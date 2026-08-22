/**
 * Steering Geometry — Three.js WebGL 3D Controller
 * =================================================
 * Loads binary GLTF (.glb) steering assembly model, animates Ackermann wheel angles
 * and rack travel from Python WebSocket telemetry, and supports Exploded View.
 */

(function () {
  'use strict';

  class Steering3DViewer {
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
        'SteeringWheel': new THREE.Vector3(0, 1.2, -1.2),
        'SteeringColumn': new THREE.Vector3(0, 0.8, -0.6),
        'RackAndPinion': new THREE.Vector3(0, -0.8, 0),
        'TieRod_Left': new THREE.Vector3(-1.2, 0, 0),
        'TieRod_Right': new THREE.Vector3(1.2, 0, 0),
        'Knuckle_Left': new THREE.Vector3(-1.8, 0, 0),
        'Knuckle_Right': new THREE.Vector3(1.8, 0, 0),
        'Wheel_Left': new THREE.Vector3(-2.4, 0, 0),
        'Wheel_Right': new THREE.Vector3(2.4, 0, 0)
      };

      this.innerAngleRad = 0;
      this.outerAngleRad = 0;
      this.handwheelAngleRad = 0;

      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.5, 3.5, 5.5);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0);
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(5, 7, 6);
      this.scene.add(keyLight);

      const grid = new THREE.GridHelper(12, 12, 0x223f66, 0x162238);
      grid.position.y = -1.2;
      this.scene.add(grid);

      this.loadModel();
      window.addEventListener('resize', () => this.onResize());

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    loadModel() {
      const loader = new THREE.GLTFLoader();
      loader.load(
        'models/steering_geometry.glb',
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ Steering Geometry GLTF model loaded.');
        },
        undefined,
        (err) => console.warn('Steering GLTF load error:', err)
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
      const deg2rad = (deg) => (deg * Math.PI) / 180.0;

      this.innerAngleRad = deg2rad(data.inner_wheel_angle_deg || 0);
      this.outerAngleRad = deg2rad(data.actual_outer_wheel_angle_deg || 0);
      this.handwheelAngleRad = deg2rad(data.steering_wheel_angle_deg || 0);
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        // Handwheel rotation
        if (this.nodes.SteeringWheel) {
          this.nodes.SteeringWheel.rotation.z = -this.handwheelAngleRad;
        }

        // Left & Right wheel lock angle rotations
        if (this.nodes.Knuckle_Left) {
          this.nodes.Knuckle_Left.rotation.y = this.innerAngleRad;
        }
        if (this.nodes.Wheel_Left) {
          this.nodes.Wheel_Left.rotation.y = this.innerAngleRad;
        }

        if (this.nodes.Knuckle_Right) {
          this.nodes.Knuckle_Right.rotation.y = this.outerAngleRad;
        }
        if (this.nodes.Wheel_Right) {
          this.nodes.Wheel_Right.rotation.y = this.outerAngleRad;
        }

        // Exploded View offsets
        for (const name in this.nodes) {
          const node = this.nodes[name];
          const basePos = this.basePositions[name];
          const offset = this.explodeOffsets[name];

          if (node && basePos && offset) {
            node.position.x = basePos.x + offset.x * this.explodeFactor;
            node.position.y = basePos.y + offset.y * this.explodeFactor;
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
        this.camera.position.set(4.5, 3.5, 5.5);
      }
    }
  }

  window.Steering3DViewer = Steering3DViewer;
})();
