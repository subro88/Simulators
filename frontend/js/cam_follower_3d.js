/**
 * Cam & Follower — Three.js WebGL 3D Controller
 * ==============================================
 * Loads binary GLTF (.glb) cam & follower model, animates cam rotation
 * and follower lift displacement from Python WebSocket telemetry.
 */

(function () {
  'use strict';

  class CamFollower3DViewer {
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
        'CamShaft': new THREE.Vector3(0, -1.2, -1.0),
        'EccentricCam': new THREE.Vector3(0, -1.2, 0),
        'RollerFollower': new THREE.Vector3(0, 0.8, 0),
        'FollowerStem': new THREE.Vector3(0, 1.8, 0),
        'GuideBush': new THREE.Vector3(0, 2.8, 0)
      };

      this.camAngleRad = 0;
      this.camRpm = 300;
      this.displacementMm = 0;

      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(3.8, 2.6, 4.8);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1.2, 0);
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(5, 7, 6);
      this.scene.add(keyLight);

      const grid = new THREE.GridHelper(10, 10, 0x223f66, 0x162238);
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
        '/models/cam_follower.glb',
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ Cam & Follower GLTF model loaded.');
        },
        undefined,
        (err) => console.warn('Cam GLTF load error:', err)
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
      this.camRpm = data.cam_rpm || 300;
      this.displacementMm = data.follower_displacement_mm || 0;
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      this.camAngleRad += ((this.camRpm / 60.0) * Math.PI * 2.0) * dt;
      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        if (this.nodes.CamShaft) {
          this.nodes.CamShaft.rotation.z = -this.camAngleRad;
        }
        if (this.nodes.EccentricCam) {
          this.nodes.EccentricCam.rotation.z = -this.camAngleRad;
        }

        // Lift Follower & Stem according to displacement
        const liftUnits = (this.displacementMm / 40.0) * 0.8;
        if (this.nodes.RollerFollower) {
          const basePos = this.basePositions['RollerFollower'];
          this.nodes.RollerFollower.position.y = basePos.y + liftUnits;
        }
        if (this.nodes.FollowerStem) {
          const basePos = this.basePositions['FollowerStem'];
          this.nodes.FollowerStem.position.y = basePos.y + liftUnits;
        }

        // Exploded View offsets
        for (const name in this.nodes) {
          const node = this.nodes[name];
          const basePos = this.basePositions[name];
          const offset = this.explodeOffsets[name];

          if (node && basePos && offset) {
            node.position.x = basePos.x + offset.x * this.explodeFactor;
            node.position.y = node.position.y + offset.y * this.explodeFactor * 0.1;
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
        this.camera.position.set(3.8, 2.6, 4.8);
      }
    }
  }

  window.CamFollower3DViewer = CamFollower3DViewer;
})();
