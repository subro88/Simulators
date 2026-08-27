/* Standalone 3D embed viewer for upgraded V1→V2 tool pages.
 * Renders the tool's GLB into #sim3d-canvas (canonical .sim3d component) with
 * OrbitControls, and builds a right-side carousel of components (#sim3d-components).
 * Clicking a component loads that GLB. Optional manifest: window.V2_COMPONENTS
 * (array) or window.V2_COMPONENTS_URL (json). Falls back to a single model.
 * Requires THREE, THREE.OrbitControls, THREE.GLTFLoader globals.
 * Exposes window.loadSim3D(url) so the carousel (or external code) can swap models. */
(function () {
  function el(id) { return document.getElementById(id); }
  function note(canvas, text) {
    if (!canvas) return;
    var n = document.createElement("div");
    n.style.cssText = "position:absolute;top:50%;left:0;right:0;text-align:center;color:#6b7a99;font-size:13px;pointer-events:none;";
    n.textContent = text;
    if (canvas.parentElement) { canvas.parentElement.style.position = "relative"; canvas.parentElement.appendChild(n); }
  }

  var scene, camera, renderer, controls, loader, currentModel, canvas;

  function frameObject(obj) {
    try {
      var box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;
      var size = box.getSize(new THREE.Vector3());
      var center = box.getCenter(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      var fov = camera.fov * (Math.PI / 180);
      var dist = (maxDim / 2) / Math.tan(fov / 2) * 1.6;
      camera.near = Math.max(0.001, dist / 1000);
      camera.far = dist * 1000;
      camera.position.copy(center).add(
        new THREE.Vector3(0.6, 0.45, 1).normalize().multiplyScalar(dist)
      );
      camera.updateProjectionMatrix();
      if (controls) { controls.target.copy(center); controls.update(); }
    } catch (e) { /* leave camera as-is */ }
  }

  function loadGLB(url) {
    if (!window.THREE || !THREE.GLTFLoader || !loader || !scene) return;
    loader.load(url,
      function (g) {
        if (currentModel) scene.remove(currentModel);
        currentModel = g.scene;
        scene.add(currentModel);
        frameObject(currentModel);
      },
      undefined,
      function () { if (el("sim3d-canvas")) note(el("sim3d-canvas"), "3D model unavailable"); }
    );
  }
  window.loadSim3D = loadGLB;

  function setActive(aside, btn) {
    aside.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
    btn.classList.add("active");
  }

  function buildCarousel(list) {
    var aside = el("sim3d-components");
    if (!aside || !list || !list.length) return;
    aside.innerHTML = "";
    list.forEach(function (c, i) {
      var b = document.createElement("button");
      b.className = "sim3d-comp" + (i === 0 ? " active" : "");
      b.innerHTML = '<img class="sim3d-thumb" alt="' + (c.label || "") + '" src=""><span>' +
        (c.label || ("Component " + (i + 1))) + "</span>";
      b.addEventListener("click", function () { loadGLB(c.url); setActive(aside, b); });
      aside.appendChild(b);
      var img = b.querySelector("img");
      makeThumb(c.url, function (data) { if (data) img.src = data; });
    });
  }

  // Offscreen renderer used to generate a PNG thumbnail per component for the carousel.
  var thumbRenderer, thumbScene, thumbCam;
  function ensureThumb() {
    if (thumbRenderer) return;
    var c = document.createElement("canvas"); c.width = 240; c.height = 150;
    thumbRenderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    thumbRenderer.setSize(240, 150);
    thumbRenderer.outputEncoding = THREE.sRGBEncoding;
    thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    thumbScene = new THREE.Scene();
    if (THREE.PMREMGenerator && THREE.RoomEnvironment) {
      var pm = new THREE.PMREMGenerator(thumbRenderer);
      thumbScene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    }
    thumbScene.add(new THREE.AmbientLight(0xffffff, 0.8));
    var d = new THREE.DirectionalLight(0xffffff, 1.0); d.position.set(3, 5, 4); thumbScene.add(d);
    thumbCam = new THREE.PerspectiveCamera(45, 240 / 150, 0.1, 1000);
  }
  function makeThumb(url, cb) {
    if (!window.THREE || !THREE.GLTFLoader) { cb(null); return; }
    ensureThumb();
    var l = new THREE.GLTFLoader();
    if (THREE.DRACOLoader) {
      var dr = new THREE.DRACOLoader(); dr.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      l.setDRACOLoader(dr);
    }
    l.load(url, function (g) {
      var obj = g.scene; thumbScene.add(obj);
      try {
        var box = new THREE.Box3().setFromObject(obj);
        var size = box.getSize(new THREE.Vector3()); var center = box.getCenter(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z) || 1;
        var fov = thumbCam.fov * Math.PI / 180;
        var dist = (maxDim / 2) / Math.tan(fov / 2) * 1.6;
        thumbCam.near = Math.max(0.001, dist / 1000); thumbCam.far = dist * 1000;
        thumbCam.position.copy(center).add(new THREE.Vector3(0.6, 0.45, 1).normalize().multiplyScalar(dist));
        thumbCam.lookAt(center);
        thumbRenderer.render(thumbScene, thumbCam);
        cb(thumbRenderer.domElement.toDataURL("image/png"));
      } catch (e) { cb(null); }
      thumbScene.remove(obj);
    }, undefined, function () { cb(null); });
  }

  // Resize + re-frame once the 3D pane becomes visible (it starts hidden in the tab layout).
  function onShowModel() {
    if (!renderer || !canvas) return;
    var w = canvas.clientWidth || 800, h = canvas.clientHeight || 460;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (currentModel) frameObject(currentModel);
    if (controls) controls.update();
  }

  // Fullscreen toggle (top-right) + drag-to-resize height handle for the 3D section.
  function setupViewerUI() {
    var section = document.getElementById("sim3d-section");
    var c = document.getElementById("sim3d-canvas");
    if (!section || !c) return;
    var fsBtn = document.createElement("button");
    fsBtn.className = "sim3d-fs-btn"; fsBtn.type = "button"; fsBtn.textContent = "⤢ Fullscreen";
    section.appendChild(fsBtn);
    fsBtn.addEventListener("click", function () {
      section.classList.toggle("fullscreen");
      fsBtn.textContent = section.classList.contains("fullscreen") ? "⤡ Exit" : "⤢ Fullscreen";
      setTimeout(onShowModel, 30);
    });
    var handle = document.createElement("div");
    handle.className = "sim3d-resize"; handle.title = "Drag to resize height";
    section.appendChild(handle);
    var drag = false, startY = 0, startH = 0;
    handle.addEventListener("mousedown", function (e) {
      drag = true; startY = e.clientY; startH = c.clientHeight || 460; e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!drag) return;
      var h = Math.max(220, Math.min(window.innerHeight - 40, startH + (e.clientY - startY)));
      c.style.height = h + "px";
      if (renderer) {
        var w = c.clientWidth || 800;
        renderer.setSize(w, h, false);
        if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
      }
    });
    window.addEventListener("mouseup", function () { drag = false; });
    window.addEventListener("resize", function () { if (section.classList.contains("fullscreen")) onShowModel(); });
  }

  // Tab / mode switching. Two cases:
  //  - Page already has a native mode system (utm-testing style .controls-bar with a 3d-model
  //    pill that toggles #model3d-wrapper via a .hidden class): integrate, don't add a 2nd bar.
  //  - Otherwise build our own Simulate / 3D Model .controls-bar and swap panes in place.
  function setupTabs() {
    var app = document.getElementById("app") || document.querySelector("main");
    var model = document.getElementById("model3d-wrapper");
    if (!app || !model) return; // not a tabbable layout -> show 3D inline
    // Explicit inline embeds (root-level pages) must NOT reorganize the page into panes.
    if (model.dataset && model.dataset.v2Inline) return;
    var nativeBar = document.querySelector(".controls-bar");
    if (nativeBar) {
      if (!model.classList.contains("hidden")) model.classList.add("hidden");
      var simWrap = document.getElementById("sim-wrapper") || document.querySelector('.view-section[id$="sim-wrapper"]');
      function activate3D() {
        // Hide every other mode section, then show the 3D block (app.js's id mapping is
        // unreliable for the simulate section, so we do the swap explicitly).
        document.querySelectorAll(".view-section").forEach(function (el) {
          if (el !== model) el.classList.add("hidden");
        });
        model.classList.remove("hidden");
        setTimeout(onShowModel, 0);
      }
      function activateSim() {
        model.classList.add("hidden");
        if (simWrap) simWrap.classList.remove("hidden");
      }
      nativeBar.querySelectorAll(".pill").forEach(function (p) {
        var v = p.getAttribute("data-value") || "";
        if (v === "3d-model" || /3d model/i.test(p.textContent)) p.addEventListener("click", activate3D);
        else if (v === "simulate" || /simulate/i.test(p.textContent)) p.addEventListener("click", activateSim);
      });
      if (window.MutationObserver) {
        new MutationObserver(function () { if (!model.classList.contains("hidden")) onShowModel(); })
          .observe(model, { attributes: true, attributeFilter: ["class", "style"] });
      }
      // Apply the correct initial state based on the page's active mode pill, so the 3D
      // block is hidden under Simulate (and shown + sized if 3D Model is the default).
      var activePill = nativeBar.querySelector(".pill.active");
      var start3D = activePill && (activePill.getAttribute("data-value") === "3d-model" ||
        /3d model/i.test(activePill.textContent || ""));
      if (start3D) { activate3D(); }
      else { model.classList.add("hidden"); if (simWrap) simWrap.classList.remove("hidden"); }
      return;
    }
    var simPane = document.createElement("div"); simPane.id = "v2-sim-pane";
    var modelPane = document.createElement("div"); modelPane.id = "v2-model-pane";
    modelPane.appendChild(model);
    while (app.firstChild) simPane.appendChild(app.firstChild);
    app.appendChild(simPane); app.appendChild(modelPane);
    var bar = document.createElement("div"); bar.className = "controls-bar";
    bar.innerHTML = '<div class="ctrl-group"><span class="ctrl-label">Mode</span>' +
      '<div class="pill-tabs">' +
      '<button type="button" class="pill active" data-pane="sim">Simulate</button>' +
      '<button type="button" class="pill" data-pane="model">3D Model</button>' +
      '</div></div>';
    app.parentNode.insertBefore(bar, app);
    function show(pane) {
      simPane.style.display = pane === "sim" ? "block" : "none";
      modelPane.style.display = pane === "model" ? "block" : "none";
      bar.querySelectorAll(".pill").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-pane") === pane);
      });
      if (pane === "model") onShowModel();
    }
    bar.querySelectorAll(".pill").forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-pane")); });
    });
    show("sim");
  }

  function init() {
    canvas = el("sim3d-canvas") || el("v2-webgl");
    if (!canvas) return;
    if (!window.THREE || !THREE.OrbitControls || !THREE.GLTFLoader) { note(canvas, "3D viewer unavailable"); return; }
    try {
      var slug = window.V2_TOOL_ID || window.location.pathname.split("/").pop().replace(".html", "");
      var model = window.V2_MODEL || slug.replace(/-/g, "_");
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e17);
      var w = canvas.clientWidth || 600, h = canvas.clientHeight || 460;
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 1.2, 4.2);
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer.setSize(w, h, false); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      var d1 = new THREE.DirectionalLight(0xffffff, 1.1); d1.position.set(5, 8, 5); scene.add(d1);
      var d2 = new THREE.DirectionalLight(0x88bbff, 0.4); d2.position.set(-5, -3, -5); scene.add(d2);
      loader = new THREE.GLTFLoader();
      if (THREE.DRACOLoader) {
        var draco = new THREE.DRACOLoader();
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
        loader.setDRACOLoader(draco);
      }
      // Image-based lighting so PBR / metallic materials are visible (metals reflect env).
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      if (THREE.PMREMGenerator && THREE.RoomEnvironment) {
        var pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      }

      // Build carousel from inline array, manifest URL, or a single default model.
      var initial = "/models/" + model + ".glb";
      if (window.V2_COMPONENTS && window.V2_COMPONENTS[0]) initial = window.V2_COMPONENTS[0].url;
      function ensureCarousel() {
        if (el("sim3d-components") && !el("sim3d-components").childElementCount)
          buildCarousel([{ label: "3D Model", url: initial }]);
      }
      if (window.V2_COMPONENTS && window.V2_COMPONENTS.length) {
        buildCarousel(window.V2_COMPONENTS);
      } else if (window.V2_COMPONENTS_URL) {
        fetch(window.V2_COMPONENTS_URL)
          .then(function (r) { return r.json(); })
          .then(function (list) { if (list && list.length) buildCarousel(list); else ensureCarousel(); })
          .catch(function () { ensureCarousel(); });
      } else {
        ensureCarousel();
      }

      // Initial model: first component if present, else the single default model
      loadGLB(initial);

      (function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); })();
      window.addEventListener("resize", function () {
        var w2 = canvas.clientWidth || 600, h2 = canvas.clientHeight || 460;
        camera.aspect = w2 / h2; camera.updateProjectionMatrix(); renderer.setSize(w2, h2);
      });
      setupTabs();
      setupViewerUI();
    } catch (e) { note(canvas, "3D viewer error"); }
  }

  if (document.readyState !== "loading") init();
  else window.addEventListener("DOMContentLoaded", init);
})();
