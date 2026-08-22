/**
 * Two-Stroke Engine — Three.js WebGL 3D Controller
 * =================================================
 * Loads binary GLTF (.glb) two-stroke engine model, animates slider-crank kinematics
 * and port transfer/scavenging phases from Python WebSocket telemetry.
 */

(function () {
  'use strict';

  class TwoStroke3DViewer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.nodes = {};
      this.basePositions = {};
      this.isLoaded = false;

      this.isExploded = false;
      this.explodeFactor = 0;
      this.targetExplodeFactor = 0;

      this.explodeOffsets = {
        'Crankcase': new THREE.Vector3(0, -1.8, 0),
        'CylinderLiner': new THREE.Vector3(-1.8, 0, 0),
        'Piston': new THREE.Vector3(0, 1.8, 0),
        'ConnectingRod': new THREE.Vector3(0, 0, 0),
        'Crankshaft': new THREE.Vector3(0, -1.8, -1.2),
        'TransferPort': new THREE.Vector3(-1.2, 0.4, 0),
        'ExhaustPort': new THREE.Vector3(1.2, 0.6, 0),
        'SparkPlug': new THREE.Vector3(0, 2.6, 0)
      };

      this.crankAngleRad = 0;
      this.engineRpm = 4500;
      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.2, 2.8, 5.2);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0.4, 0);
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(5, 7, 6);
      this.scene.add(keyLight);

      const grid = new THREE.GridHelper(12, 12, 0x223f66, 0x162238);
      grid.position.y = -2.0;
      this.scene.add(grid);

      this.loadModel();
      window.addEventListener('resize', () => this.onResize());

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    loadModel() {
      const loader = new THREE.GLTFLoader();
      loader.load(
        'models/two_stroke_engine.glb',
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ Two-Stroke Engine GLTF model loaded.');
        },
        undefined,
        (err) => console.warn('Two-Stroke GLTF load error:', err)
      );
    }

    indexNodes(root) {
      this.nodes = {};
      this.basePositions = {};
      root.traverse((child) => {
        if (child.name) {
          this.nodes[child.name] = child;
          this.basePositions[child.name] = child.position.clone();
          if (child.material) {
            child.material.metalness = 0.85;
            child.material.roughness = 0.28;
          }
        }
      });
    }

    setExploded(exploded) {
      this.isExploded = !!exploded;
      this.targetExplodeFactor = this.isExploded ? 1.0 : 0.0;
    }

    toggleExploded() {
      this.setExploded(!this.isExploded);
      return this.isExploded;
    }

    updateTelemetry(data) {
      if (!data) return;
      this.engineRpm = data.engine_rpm || 4500;
      if (data.crank_angle_deg !== undefined) {
        this.crankAngleRad = (data.crank_angle_deg * Math.PI) / 180.0;
      }
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      this.crankAngleRad += ((this.engineRpm / 60.0) * Math.PI * 2.0) * dt;
      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        const crankR = 0.5;
        const conrodL = 1.8;
        const theta = this.crankAngleRad;

        const pistonY = crankR * Math.cos(theta) + Math.sqrt(conrodL * conrodL - crankR * crankR * Math.sin(theta) * Math.sin(theta));

        if (this.nodes.Piston) {
          const basePos = this.basePositions['Piston'];
          this.nodes.Piston.position.y = basePos.y + (pistonY - 1.8);
        }
        if (this.nodes.Crankshaft) {
          this.nodes.Crankshaft.rotation.z = -theta;
        }
        if (this.nodes.ConnectingRod) {
          const beta = Math.asin((crankR / conrodL) * Math.sin(theta));
          this.nodes.ConnectingRod.rotation.z = beta;
        }

        // Exploded View offsets
        for (const name in this.nodes) {
          const node = this.nodes[name];
          const basePos = this.basePositions[name];
          const offset = this.explodeOffsets[name];

          if (node && basePos && offset) {
            node.position.x = basePos.x + offset.x * this.explodeFactor;
            node.position.z = basePos.z + offset.z * this.explodeFactor;
          }
        }
      }

      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    onResize() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    resetView() {
      if (this.controls) {
        this.controls.reset();
        this.camera.position.set(4.2, 2.8, 5.2);
      }
    }
  }

  window.TwoStroke3DViewer = TwoStroke3DViewer;
})();
