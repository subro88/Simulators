/*
 * Sim3D — shared 3D viewer for MechSimulator (offline, Three.js r149 UMD).
 * Provides a renderer, camera, built-in orbit/zoom controls, lights, ground,
 * and an animation loop driven by a registered model builder.
 *
 * Usage (see inject3d.py): a tool page includes:
 *   <script src="../../shared/three3d/three.min.js"></script>
 *   <script src="../../shared/three3d/viewer.js"></script>
 *   <script src="../../shared/three3d/models.js"></script>
 *   <script>Sim3D.mount('four-bar-linkage', document.getElementById('sim3d-canvas'));</script>
 */
(function (global) {
  'use strict';

  var models = {};        // slug -> builder(context) => { update(t,dt), reset? }
  var meta = {};          // slug -> { title, blurb }
  var instances = [];     // active render loops

  function register(slug, builder) { models[slug] = builder; }

  // ---- Minimal orbit controls (no external dependency) -------------------
  function Orbit(camera, dom) {
    this.cam = camera;
    this.dom = dom;
    this.target = new THREE.Vector3(0, 0, 0);
    this.radius = camera.position.length();
    this.theta = Math.atan2(camera.position.x, camera.position.z);
    this.phi = Math.acos(THREE.MathUtils.clamp(camera.position.y / this.radius, -1, 1));
    this.minR = this.radius * 0.25;
    this.maxR = this.radius * 4;
    this.rotSpeed = 0.005;
    this.drag = false;
    this.px = 0; this.py = 0;
    var self = this;

    dom.addEventListener('pointerdown', function (e) {
      self.drag = true; self.px = e.clientX; self.py = e.clientY;
      dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointerup', function (e) {
      self.drag = false;
      dom.releasePointerCapture && e.pointerId != null && dom.releasePointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', function (e) {
      if (!self.drag) return;
      var dx = e.clientX - self.px, dy = e.clientY - self.py;
      self.px = e.clientX; self.py = e.clientY;
      self.theta -= dx * self.rotSpeed;
      self.phi = THREE.MathUtils.clamp(self.phi - dy * self.rotSpeed, 0.05, Math.PI - 0.05);
      self.apply();
    });
    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.radius = THREE.MathUtils.clamp(self.radius * (1 + Math.sign(e.deltaY) * 0.1), self.minR, self.maxR);
      self.apply();
    }, { passive: false });
  }
  Orbit.prototype.apply = function () {
    var s = Math.sin(this.phi);
    this.cam.position.set(
      this.target.x + this.radius * s * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * s * Math.cos(this.theta)
    );
    this.cam.lookAt(this.target);
  };

  function makeMaterial(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 0.3,
      roughness: opts.roughness != null ? opts.roughness : 0.6,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1
    });
  }

  function mount(slug, canvas, opts) {
    opts = opts || {};
    if (!canvas) { console.warn('Sim3D: no canvas for', slug); return null; }
    if (!models[slug]) {
      var mapped = (global.Sim3D.mapSlug && global.Sim3D.mapSlug(slug)) || '__default__';
      slug = models[mapped] ? mapped : '__default__';
    }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    var w = canvas.clientWidth || 480, h = canvas.clientHeight || 360;
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.bg || 0x0e1726);

    var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(6, 4, 8);

    var controls = new Orbit(camera, canvas);

    // Cut-section (local clipping) + auto-explore state
    renderer.localClippingEnabled = true;
    var cutOn = false, explore = false;
    var clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    var highlighted = null;
    function setClip(on) {
      if (!model.group) return;
      model.group.traverse(function (o) {
        if (!o.material) return;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) { m.clippingPlanes = on ? [clipPlane] : []; m.needsUpdate = true; });
      });
    }
    function highlight(obj) {
      if (!obj) return;
      obj.traverse(function (o) {
        if (!o.material) return;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (m.userData._emi === undefined) m.userData._emi = m.emissive ? m.emissive.getHex() : 0;
          if (m.emissive) m.emissive.setHex(0x2b6cff);
        });
      });
    }
    function restore(obj) {
      if (!obj) return;
      obj.traverse(function (o) {
        if (!o.material) return;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) { if (m.userData && m.userData._emi !== undefined && m.emissive) m.emissive.setHex(m.userData._emi); });
      });
    }

    // Lights
    scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x202830, 0.9));
    var key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(6, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    // Ground
    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.MeshStandardMaterial({ color: 0x16203a, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
    var grid = new THREE.GridHelper(20, 20, 0x335577, 0x223355);
    grid.material.opacity = 0.35; grid.material.transparent = true;
    scene.add(grid);

    var ctx = {
      THREE: THREE, scene: scene, camera: camera, renderer: renderer,
      makeMaterial: makeMaterial, controls: controls,
      opts: opts
    };

    var model = models[slug](ctx) || {};
    if (model.group) scene.add(model.group);
    applyMeta(slug);

    // ---- Controls bar: cut section, explore, component descriptions ----
    var sectionEl = document.getElementById('sim3d-section');
    var comps = (model && model.components) ? model.components : [];
    if (sectionEl) {
      var bar = document.createElement('div'); bar.className = 'sim3d-controls';
      var cutBtn = document.createElement('button'); cutBtn.type = 'button'; cutBtn.textContent = 'Cut Section'; cutBtn.className = 'sim3d-btn';
      var expBtn = document.createElement('button'); expBtn.type = 'button'; expBtn.textContent = 'Explore'; expBtn.className = 'sim3d-btn';
      bar.appendChild(cutBtn); bar.appendChild(expBtn);
      if (comps.length) {
        var lbl = document.createElement('span'); lbl.className = 'sim3d-ctrl-label'; lbl.textContent = 'Components:'; bar.appendChild(lbl);
        comps.forEach(function (c, i) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'sim3d-btn sim3d-comp'; b.textContent = c.name; b.dataset.i = i; bar.appendChild(b);
        });
      }
      sectionEl.appendChild(bar);
      var descEl = document.createElement('div'); descEl.className = 'sim3d-desc'; descEl.style.display = 'none'; sectionEl.appendChild(descEl);

      if (!document.getElementById('sim3d-controls-style')) {
        var st = document.createElement('style'); st.id = 'sim3d-controls-style';
        st.textContent = '.sim3d-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0;}' +
          '.sim3d-btn{background:#16203a;color:#cdd7ee;border:1px solid #2a3a5a;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;}' +
          '.sim3d-btn:hover{background:#1d2a48;}' +
          '.sim3d-btn.active{background:#2b6cff;color:#fff;border-color:#2b6cff;}' +
          '.sim3d-ctrl-label{color:#8aa0c0;font-size:13px;margin-left:6px;}' +
          '.sim3d-desc{margin:6px 0 2px;padding:10px 12px;background:#0a1322;border:1px solid #1e2c44;border-radius:8px;color:#bcd0ea;font-size:13px;line-height:1.5;}';
        document.head.appendChild(st);
      }

      cutBtn.addEventListener('click', function () { cutOn = !cutOn; cutBtn.classList.toggle('active', cutOn); setClip(cutOn); });
      expBtn.addEventListener('click', function () { explore = !explore; expBtn.classList.toggle('active', explore); });
      bar.querySelectorAll('.sim3d-comp').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = +b.dataset.i; var c = comps[i];
          bar.querySelectorAll('.sim3d-comp').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          if (highlighted) restore(highlighted);
          highlighted = c.object; highlight(highlighted);
          descEl.style.display = 'block';
          descEl.innerHTML = '<strong>' + c.name + '</strong><br>' + c.desc;
        });
      });
    }

    var clock = new THREE.Clock();
    function resize() {
      var nw = canvas.clientWidth || w, nh = canvas.clientHeight || h;
      if (nw !== renderer.domElement.width / renderer.getPixelRatio() ||
          nh !== renderer.domElement.height / renderer.getPixelRatio()) {
        renderer.setSize(nw, nh, false);
        camera.aspect = nw / nh; camera.updateProjectionMatrix();
      }
    }
    function loop() {
      resize();
      var dt = clock.getDelta(), t = clock.elapsedTime;
      if (explore) controls.theta += 0.012;
      if (model.update) model.update(t, dt);
      controls.apply();
      renderer.render(scene, camera);
      global.requestAnimationFrame(loop);
    }
    global.requestAnimationFrame(loop);

    var inst = { slug: slug, renderer: renderer, model: model, dispose: function () { renderer.dispose(); } };
    instances.push(inst);
    return inst;
  }

  global.Sim3D = { register: register, mount: mount, meta: meta, _models: models, _instances: instances };

  function applyMeta(slug) {
    var m = meta[slug]; if (!m) return;
    var tEl = document.getElementById('sim3d-title');
    var bEl = document.getElementById('sim3d-blurb');
    if (tEl && !tEl.textContent.trim()) tEl.textContent = m.title || '';
    if (bEl && !bEl.textContent.trim()) bEl.textContent = m.blurb || '';
  }
})(window);
