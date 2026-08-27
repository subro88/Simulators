/**
 * V2 Simulator Framework — shared controller for all Batch 4 tools.
 * Data-driven: reads window.TOOL_ID -> V2_CONFIGS[TOOL_ID], builds the
 * Simulate control panel + telemetry, drives the WebSocket, the 2D schematic
 * and the Three.js 3D GLB viewer (OrbitControls + Exploded View).
 */
(function () {
  "use strict";

  /* ───────────────────────── 3D Viewer ───────────────────────── */
  class V2Viewer {
    constructor(canvasId, modelName, anim) {
      this.canvas = document.getElementById(canvasId);
      this.modelName = modelName;
      this.anim = anim || { mode: "auto" };
      this.nodes = {};
      this.basePositions = {};
      this.isExploded = false;
      this.explodeFactor = 0;
      this.init();
    }

    init() {
      const w = this.canvas.clientWidth || 600;
      const h = this.canvas.clientHeight || 520;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050a12);

      this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      this.camera.position.set(0, 1.2, 4.2);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.1); d1.position.set(5, 8, 5); this.scene.add(d1);
      const d2 = new THREE.DirectionalLight(0x88bbff, 0.4); d2.position.set(-5, -3, -5); this.scene.add(d2);

      this.loadModel();
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    loadModel() {
      if (!this.modelName) { this.showPlaceholder("3D model coming soon"); return; }
      const loader = new THREE.GLTFLoader();
      loader.load(
        "/models/" + this.modelName + ".glb",
        (gltf) => {
          this.model = gltf.scene;
          this.scene.add(this.model);
          this.model.traverse((c) => { if (c.isMesh) this.nodes[c.name] = c; });
          this.model.children.forEach((child, i) => {
            this.basePositions[i] = child.position.clone();
          });
        },
        undefined,
        () => { this.showPlaceholder("3D model unavailable"); }
      );
    }

    showPlaceholder(text) {
      const note = document.createElement("div");
      note.style.cssText = "position:absolute;top:50%;left:0;right:0;text-align:center;color:#6b7a99;font-size:13px;pointer-events:none;";
      note.textContent = text;
      const p = this.canvas.parentElement;
      if (p) { p.style.position = "relative"; p.appendChild(note); }
    }

    applyTelemetry(data) {
      if (!this.model) return;
      const a = this.anim;
      try {
        if (a.mode === "scaleY" && data[a.field] != null) {
          const s = 1 + parseFloat(data[a.field]) * (a.scale || 0.001);
          this.model.scale.y = s;
        } else if (a.mode === "rotateRate" && data[a.field] != null) {
          this._rate = parseFloat(data[a.field]) * (a.scale || 0.0002);
        }
      } catch (e) { /* ignore */ }
    }

    toggleExplode() {
      this.isExploded = !this.isExploded;
      if (!this.model) return this.isExploded;
      this.model.children.forEach((child, i) => {
        const base = this.basePositions[i] || new THREE.Vector3();
        const dir = base.clone();
        if (dir.lengthSq() < 1e-6) dir.set(0, (i % 2 ? 1 : -1), 0);
        dir.normalize();
        const target = base.clone().add(dir.multiplyScalar(this.isExploded ? 1.1 : 0.0));
        child.position.copy(target);
      });
      return this.isExploded;
    }

    resetCamera() {
      this.camera.position.set(0, 1.2, 4.2);
      this.controls.target.set(0, 0, 0);
    }

    onResize() {
      const w = this.canvas.clientWidth || 600;
      const h = this.canvas.clientHeight || 520;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    animate() {
      requestAnimationFrame(this.animate);
      if (this.model && !this.isExploded) {
        const rate = this._rate != null ? this._rate : 0.0035;
        this.model.rotation.y += rate;
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  /* ───────────────────────── App Controller ───────────────────────── */
  class V2App {
    constructor() {
      window.V2_CONFIGS = Object.assign({}, window.V2_CONFIGS_AUTO || {}, window.V2_CONFIGS || {});
      this.cfg = window.V2_CONFIGS[window.TOOL_ID];
      this.socket = null;
      this.viewer = null;
      this.state = {};
      this.controls = {};
      this.telemetryNodes = {};
      if (!this.cfg) {
        this.cfg = { title: window.TOOL_ID, category: "Engineering",
                     model: window.TOOL_ID.replace(/-/g, "_"), controls: [], telemetry: [], ws: false };
      }
      this.init();
    }

    init() {
      const cfg = this.cfg;
      document.getElementById("page-title").textContent = cfg.title + " — NHIT VisualLab";
      document.getElementById("tool-title").textContent = cfg.title;
      document.getElementById("tool-subtitle").textContent = cfg.subtitle || "";
      document.getElementById("crumb-cat").textContent = cfg.category || "Strength of Materials";
      document.getElementById("crumb-tool").textContent = cfg.title;
      document.getElementById("schematic-label").textContent = cfg.schematicLabel || "Working 2D Schematic";
      document.title = cfg.title + " — V2 | NHIT VisualLab";
      const desc = document.getElementById("page-desc");
      if (desc) desc.setAttribute("content", cfg.title + " — interactive V2 engineering simulator with Python physics engine and WebGL 3D.");

      if (this.cfg.controls && this.cfg.controls.length) {
        this.buildControls();
        this.buildTelemetry();
      } else {
        const cb = document.getElementById("control-blocks"); if (cb) cb.innerHTML = "";
        const tb = document.getElementById("telemetry-box");
        if (tb) tb.innerHTML = "<div class='telemetry-row'><span class='telemetry-key'>Mode</span><span class='telemetry-val'>3D Model Viewer</span></div>";
      }
      this.buildSections();

      this.viewer = new V2Viewer("webgl-canvas", cfg.model, cfg.anim);

      this.bindModeTabs();
      this.bindViewport();
      if (this.cfg.ws !== false) this.connectWS(); else this.setStaticBadge();
      this.bindPresets();
    }

    buildControls() {
      const wrap = document.getElementById("control-blocks");
      this.controls = {};
      this.cfg.controls.forEach((c) => {
        this.state[c.id] = c.value;
        const block = document.createElement("div");
        block.className = "control-block";
        const row = document.createElement("div");
        row.className = "control-label-row";
        const lbl = document.createElement("span");
        lbl.textContent = c.label;
        const val = document.createElement("span");
        val.className = "control-value";
        val.id = "val-" + c.id;
        val.textContent = c.value + (c.unit ? " " + c.unit : "");
        row.appendChild(lbl); row.appendChild(val);
        block.appendChild(row);

        let input;
        if (c.type === "select") {
          input = document.createElement("select");
          input.className = "btn-secondary";
          input.style.cssText = "width:100%;background:var(--bg-input);padding:8px;cursor:pointer;";
          c.options.forEach((o) => {
            const opt = document.createElement("option");
            opt.value = o.value; opt.textContent = o.label;
            if (o.value === c.value) opt.selected = true;
            input.appendChild(opt);
          });
          input.addEventListener("change", () => {
            this.state[c.id] = input.value;
            this.sendState();
          });
        } else {
          input = document.createElement("input");
          input.type = "range";
          input.className = "slider-custom";
          input.min = c.min; input.max = c.max; input.step = c.step; input.value = c.value;
          input.addEventListener("input", () => {
            const v = parseFloat(input.value);
            this.state[c.id] = v;
            val.textContent = v + (c.unit ? " " + c.unit : "");
            this.sendState();
          });
        }
        input.id = "ctrl-" + c.id;
        block.appendChild(input);
        wrap.appendChild(block);
        this.controls[c.id] = input;
      });
    }

    buildTelemetry() {
      const box = document.getElementById("telemetry-box");
      box.innerHTML = "";
      this.telemetryNodes = {};
      (this.cfg.telemetry || []).forEach((t) => {
        const row = document.createElement("div");
        row.className = "telemetry-row";
        const k = document.createElement("span");
        k.className = "telemetry-key"; k.textContent = t.label;
        const v = document.createElement("span");
        v.className = "telemetry-val"; v.textContent = "—";
        row.appendChild(k); row.appendChild(v);
        box.appendChild(row);
        this.telemetryNodes[t.field] = v;
        v._fmt = t.fmt || ((x) => (typeof x === "number" ? x.toFixed(2) : x));
      });
      if (this.cfg.equation) {
        const eq = document.createElement("div");
        eq.className = "telemetry-equation";
        eq.id = "telemetry-equation";
        box.appendChild(eq);
      }
    }

    buildSections() {
      // Explore
      const ex = document.getElementById("explore-cards");
      (this.cfg.explore || []).forEach((card) => {
        const d = document.createElement("div");
        d.className = "info-card";
        d.innerHTML = "<h3>" + card.h + "</h3><p>" + card.p + "</p>";
        ex.appendChild(d);
      });
      // Practice
      const pr = document.getElementById("practice-content");
      if (this.cfg.practice) pr.innerHTML = "<div class='info-card'>" + this.cfg.practice + "</div>";
      // Quiz
      const qz = document.getElementById("quiz-content");
      if (this.cfg.quiz) qz.innerHTML = "<div class='info-card'>" + this.cfg.quiz + "</div>";
      // Related links
      const rl = document.getElementById("related-links");
      (this.cfg.related || []).forEach((r) => {
        const a = document.createElement("a");
        a.className = "btn-secondary";
        a.href = r.href; a.textContent = r.label; a.title = r.label;
        rl.appendChild(a);
      });
    }

    bindModeTabs() {
      document.querySelectorAll("#mode-tabs .pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll("#mode-tabs .pill").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const mode = btn.dataset.mode;
          ["simulate", "explore", "practice", "quiz"].forEach((sec) => {
            const el = document.getElementById("section-" + sec);
            if (el) el.classList.toggle("active", sec === mode || (mode === "3d-model" && sec === "simulate"));
          });
          if (mode === "3d-model" && this.viewer) setTimeout(() => this.viewer.onResize(), 30);
        });
      });
    }

    bindViewport() {
      const btnE = document.getElementById("btn-toggle-explode");
      const btnR = document.getElementById("btn-reset-cam");
      if (btnE) btnE.addEventListener("click", () => {
        if (!this.viewer) return;
        const on = this.viewer.toggleExplode();
        btnE.classList.toggle("active", on);
        btnE.textContent = on ? "🔍 Assembled View" : "💥 Exploded View";
      });
      if (btnR) btnR.addEventListener("click", () => this.viewer && this.viewer.resetCamera());
    }

    setStaticBadge() {
      const badge = document.getElementById("ws-badge");
      const txt = document.getElementById("ws-text");
      if (badge) badge.classList.remove("disconnected");
      if (txt) txt.textContent = "3D Model Viewer (no live engine)";
    }

    connectWS() {
      const wsId = this.cfg.ws || window.TOOL_ID;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = proto + "//" + window.location.host + "/ws/" + wsId;
      const badge = document.getElementById("ws-badge");
      const txt = document.getElementById("ws-text");

      const open = () => {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
          badge.classList.remove("disconnected");
          txt.textContent = "Python Engine Connected (WebSocket)";
          this.sendState();
        };
        this.socket.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "state_update") this.onStateUpdate(msg.payload);
          } catch (e) { /* ignore */ }
        };
        this.socket.onclose = () => {
          badge.classList.add("disconnected");
          txt.textContent = "Reconnecting...";
          setTimeout(open, 2500);
        };
        this.socket.onerror = () => this.socket.close();
      };
      open();
    }

    sendState() {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "set_state", payload: this.state }));
      }
    }

    onStateUpdate(data) {
      // Telemetry DOM
      for (const field in this.telemetryNodes) {
        const node = this.telemetryNodes[field];
        const val = data[field];
        if (val != null) node.textContent = node._fmt(val, data);
      }
      if (this.cfg.equation && this.cfg.equation.fmt) {
        const eq = document.getElementById("telemetry-equation");
        if (eq) eq.textContent = this.cfg.equation.fmt(data);
      }
      // 2D schematic
      const canvas = document.getElementById("2d-schematic-canvas");
      if (canvas && window.V2_2D && this.cfg.draw2d && window.V2_2D[this.cfg.draw2d]) {
        const ctx = canvas.getContext("2d");
        const w = (canvas.width = canvas.clientWidth || 600);
        const h = (canvas.height = canvas.clientHeight || 200);
        ctx.clearRect(0, 0, w, h);
        window.V2_2D[this.cfg.draw2d](ctx, w, h, data, this.cfg);
      }
      // 3D telemetry
      if (this.viewer) this.viewer.applyTelemetry(data);
    }

    bindPresets() {
      const sel = document.getElementById("preset-select");
      const group = document.getElementById("preset-group");
      if (!this.cfg.presets) return;
      group.style.display = "flex";
      fetch("/api/" + (this.cfg.ws || window.TOOL_ID) + "/presets")
        .then((r) => r.json())
        .then((presets) => {
          Object.keys(presets).forEach((key) => {
            const o = document.createElement("option");
            o.value = key;
            o.textContent = presets[key].name || key;
            sel.appendChild(o);
          });
          sel.addEventListener("change", () => {
            const p = presets[sel.value];
            if (!p) return;
            const params = p.params || p;
            Object.keys(params).forEach((k) => {
              if (this.controls[k]) {
                this.controls[k].value = params[k];
                this.state[k] = params[k];
                const v = document.getElementById("val-" + k);
                if (v) v.textContent = params[k];
              }
            });
            this.sendState();
          });
        })
        .catch(() => { group.style.display = "none"; });
    }
  }

  window.addEventListener("DOMContentLoaded", () => { window.v2app = new V2App(); });
})();
