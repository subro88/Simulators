/**
 * Four-Stroke Engine — Three.js WebGL 3D Controller
 * =================================================
 * Loads binary GLTF (.glb) engine model, animates slider-crank kinematics
 * and valve timings from Python WebSocket telemetry, and supports Exploded View.
 */

(function () {
  'use strict';

  class FourStroke3DViewer {
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

      // Exploded View state & offsets
      this.isExploded = false;
      this.explodeFactor = 0;
      this.targetExplodeFactor = 0;

      this.explodeOffsets = {
        'CylinderBlock': new THREE.Vector3(-1.8, 0, 0),
        'Piston': new THREE.Vector3(0, 1.8, 0),
        'PistonPin': new THREE.Vector3(0, 1.8, 0.9),
        'ConnectingRod': new THREE.Vector3(0, 0, 0),
        'Crankshaft': new THREE.Vector3(0, -1.8, 0),
        'Flywheel': new THREE.Vector3(0, -1.8, -1.5),
        'IntakeValve': new THREE.Vector3(-1.2, 2.2, 0),
        'ExhaustValve': new THREE.Vector3(1.2, 2.2, 0),
        'SparkPlug': new THREE.Vector3(0, 2.8, 0)
      };

      // Telemetry animation variables
      this.crankAngleRad = 0;
      this.engineRpm = 1200;
      this.strokePhase = '';

      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.5, 3.2, 5.5);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = 16.0;
        this.controls.target.set(0, 0.5, 0);
      }

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(5, 7, 6);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x80d8ff, 0.85);
      fillLight.position.set(-5, -2, -6);
      this.scene.add(fillLight);

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
      const modelPath = '/models/four_stroke_engine.glb';

      loader.load(
        modelPath,
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ Four-Stroke Engine GLTF model loaded.');
        },
        undefined,
        (err) => {
          console.warn('Four-Stroke GLTF load fallback:', err);
          this.buildProceduralFallback();
        }
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

    buildProceduralFallback() {
      const group = new THREE.Group();
      const mat = (color, emissive = 0x000000) =>
        new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.3, emissive });

      const block = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.2, 24, 1, true), mat(0x1e293b));
      block.position.set(0, 0.5, 0);
      group.add(block);
      this.nodes['CylinderBlock'] = block;

      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 24), mat(0xe2e8f0));
      piston.position.set(0, 1.2, 0);
      group.add(piston);
      this.nodes['Piston'] = piston;

      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 16), mat(0x94a3b8));
      pin.position.set(0, 1.1, 0);
      pin.rotation.z = Math.PI / 2;
      group.add(pin);
      this.nodes['PistonPin'] = pin;

      const conrod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16), mat(0xf59e0b));
      conrod.position.set(0, 0, 0);
      group.add(conrod);
      this.nodes['ConnectingRod'] = conrod;

      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 20), mat(0x38bdf8));
      crank.position.set(0, -1.2, 0);
      crank.rotation.z = Math.PI / 2;
      group.add(crank);
      this.nodes['Crankshaft'] = crank;

      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 28), mat(0x334155));
      flywheel.position.set(0, -1.2, -0.8);
      flywheel.rotation.z = Math.PI / 2;
      group.add(flywheel);
      this.nodes['Flywheel'] = flywheel;

      const vIntake = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), mat(0x34d399));
      vIntake.position.set(-0.45, 2.2, 0);
      group.add(vIntake);
      this.nodes['IntakeValve'] = vIntake;

      const vExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), mat(0xef4444));
      vExhaust.position.set(0.45, 2.2, 0);
      group.add(vExhaust);
      this.nodes['ExhaustValve'] = vExhaust;

      this.scene.add(group);
      this.indexNodes(group);
      this.isLoaded = true;
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

      this.engineRpm = data.engine_rpm || 1200;
      this.strokePhase = data.current_stroke_phase || '';

      const crankDeg = data.crank_angle_deg || 0;
      this.crankAngleRad = (crankDeg * Math.PI) / 180.0;
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      // Continuous rotation if crankAngle is driven by time
      this.crankAngleRad += ((this.engineRpm / 60.0) * Math.PI * 2.0) * dt;

      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        const crankR = 0.6;
        const conrodL = 2.1;
        const theta = this.crankAngleRad;

        // Kinematic Piston displacement
        const pistonY = crankR * Math.cos(theta) + Math.sqrt(conrodL * conrodL - crankR * crankR * Math.sin(theta) * Math.sin(theta));

        // 1. Piston & Piston Pin Reciprocation
        if (this.nodes.Piston) {
          const basePos = this.basePositions['Piston'];
          this.nodes.Piston.position.y = basePos.y + (pistonY - 2.1);
        }
        if (this.nodes.PistonPin) {
          const basePos = this.basePositions['PistonPin'];
          this.nodes.PistonPin.position.y = basePos.y + (pistonY - 2.1);
        }

        // 2. Crankshaft & Flywheel Rotation
        if (this.nodes.Crankshaft) {
          this.nodes.Crankshaft.rotation.z = -theta;
        }
        if (this.nodes.Flywheel) {
          this.nodes.Flywheel.rotation.z = -theta;
        }

        // 3. Connecting Rod Oscillation
        if (this.nodes.ConnectingRod) {
          const beta = Math.asin((crankR / conrodL) * Math.sin(theta));
          this.nodes.ConnectingRod.rotation.z = beta;
          const basePos = this.basePositions['ConnectingRod'];
          this.nodes.ConnectingRod.position.y = basePos.y + (pistonY - 2.1) / 2.0;
        }

        // 4. Valve Lift Animations (Intake vs Exhaust stroke phases)
        const cycleDeg = ((theta * 180.0) / Math.PI) % 720.0;

        let intakeLift = 0;
        let exhaustLift = 0;

        if (cycleDeg >= 0 && cycleDeg < 180) {
          intakeLift = Math.sin((cycleDeg / 180.0) * Math.PI) * 0.35;
        } else if (cycleDeg >= 540 && cycleDeg < 720) {
          exhaustLift = Math.sin(((cycleDeg - 540) / 180.0) * Math.PI) * 0.35;
        }

        if (this.nodes.IntakeValve) {
          const basePos = this.basePositions['IntakeValve'];
          this.nodes.IntakeValve.position.y = basePos.y - intakeLift;
        }
        if (this.nodes.ExhaustValve) {
          const basePos = this.basePositions['ExhaustValve'];
          this.nodes.ExhaustValve.position.y = basePos.y - exhaustLift;
        }

        // Apply Exploded View offsets
        for (const name in this.nodes) {
          const node = this.nodes[name];
          const basePos = this.basePositions[name];
          const offset = this.explodeOffsets[name];

          if (node && basePos && offset) {
            node.position.x = node.position.x + offset.x * this.explodeFactor * 0.1;
            node.position.z = basePos.z + offset.z * this.explodeFactor;
          }
        }
      }

      if (this.controls) {
        this.controls.update();
      }

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
        this.camera.position.set(4.5, 3.2, 5.5);
      }
    }
  }

  window.FourStroke3DViewer = FourStroke3DViewer;
})();
