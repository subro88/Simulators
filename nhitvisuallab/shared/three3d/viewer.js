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
      var mapped = (S.mapSlug && S.mapSlug(slug)) || '__default__';
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
