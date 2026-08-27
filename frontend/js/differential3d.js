/**
 * Automotive Differential — Three.js WebGL 3D Controller
 * =======================================================
 * Loads binary GLTF (.glb) differential model, handles real-time physical gear
 * rotations from Python WebSocket telemetry, and supports Exploded View component inspection.
 */

(function () {
  'use strict';

  class Differential3DViewer {
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

      // Explosion displacement vectors for each node
      this.explodeOffsets = {
        'DrivePinion': new THREE.Vector3(0, -1.2, 0),
        'CrownWheel': new THREE.Vector3(0, 0, -1.0),
        'DifferentialCarrier': new THREE.Vector3(0, 0, 1.0),
        'CrossPin': new THREE.Vector3(0, 0, 0),
        'SpiderGear_Top': new THREE.Vector3(0, 1.2, 0),
        'SpiderGear_Bottom': new THREE.Vector3(0, -1.2, 0),
        'SunGear_Left': new THREE.Vector3(-1.2, 0, 0),
        'SunGear_Right': new THREE.Vector3(1.2, 0, 0),
        'Axle_Left': new THREE.Vector3(-1.8, 0, 0),
        'Axle_Right': new THREE.Vector3(1.8, 0, 0),
        'Wheel_Left': new THREE.Vector3(-2.4, 0, 0),
        'Wheel_Right': new THREE.Vector3(2.4, 0, 0),
        'AxleHousing_Left': new THREE.Vector3(-2.0, 0, -1.5),
        'AxleHousing_Right': new THREE.Vector3(2.0, 0, -1.5)
      };

      // Current physics rotation speeds (rad/sec)
      this.speeds = {
        pinion: 0,
        crown: 0,
        left: 0,
        right: 0,
        spider: 0
      };

      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = null;

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(5.5, 3.8, 6.5);

      // 3. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      // 4. Orbit Controls
      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 20.0;
        this.controls.target.set(0, 0, 0);
      }

      // 5. Studio Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(6, 8, 5);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x80d8ff, 0.85);
      fillLight.position.set(-6, -2, -5);
      this.scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffd600, 0.6);
      rimLight.position.set(0, -6, 4);
      this.scene.add(rimLight);

      // 6. Ground grid
      const grid = new THREE.GridHelper(14, 14, 0x223f66, 0x162238);
      grid.position.y = -2.4;
      this.scene.add(grid);

      // 7. Load GLB Model
      this.loadModel();

      // 8. Resize Listener
      window.addEventListener('resize', () => this.onResize());

      // 9. Animation Loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    loadModel() {
      const loader = new THREE.GLTFLoader();
      const modelPath = '/models/differential.glb';

      loader.load(
        modelPath,
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ High-detail Differential GLTF model loaded.');
        },
        undefined,
        (err) => {
          console.warn('GLTF load fallback:', err);
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
            child.material.roughness = 0.26;
          }
        }
      });
    }

    buildProceduralFallback() {
      const group = new THREE.Group();
      const mat = (color, emissive = 0x000000) =>
        new THREE.MeshStandardMaterial({
          color,
          metalness: 0.82,
          roughness: 0.28,
          emissive
        });

      const pinion = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.8, 20), mat(0xff9800, 0x331a00));
      pinion.position.set(0, -1.75, 0);
      pinion.rotation.x = Math.PI / 2;
      group.add(pinion);
      this.nodes['DrivePinion'] = pinion;

      const crown = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.22, 28, 16), mat(0x29b6f6, 0x052033));
      crown.rotation.y = Math.PI / 2;
      group.add(crown);
      this.nodes['CrownWheel'] = crown;

      const carrier = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.6, 20), mat(0x1f2535));
      carrier.rotation.z = Math.PI / 2;
      group.add(carrier);
      this.nodes['DifferentialCarrier'] = carrier;

      const spTop = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.45, 16), mat(0xffd600, 0x332800));
      spTop.position.set(0, 0.62, 0);
      carrier.add(spTop);
      this.nodes['SpiderGear_Top'] = spTop;

      const spBot = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.45, 16), mat(0xffd600, 0x332800));
      spBot.position.set(0, -0.62, 0);
      spBot.rotation.x = Math.PI;
      carrier.add(spBot);
      this.nodes['SpiderGear_Bottom'] = spBot;

      const sunL = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 18), mat(0x3ddc84, 0x053315));
      sunL.position.set(-1.15, 0, 0);
      sunL.rotation.z = Math.PI / 2;
      group.add(sunL);
      this.nodes['SunGear_Left'] = sunL;

      const sunR = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 18), mat(0x3ddc84, 0x053315));
      sunR.position.set(1.15, 0, 0);
      sunR.rotation.z = -Math.PI / 2;
      group.add(sunR);
      this.nodes['SunGear_Right'] = sunR;

      const axleL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 14), mat(0x8899aa));
      axleL.position.set(-2.1, 0, 0);
      axleL.rotation.z = Math.PI / 2;
      group.add(axleL);
      this.nodes['Axle_Left'] = axleL;

      const axleR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 14), mat(0x8899aa));
      axleR.position.set(2.1, 0, 0);
      axleR.rotation.z = Math.PI / 2;
      group.add(axleR);
      this.nodes['Axle_Right'] = axleR;

      const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.5, 24), mat(0x131518));
      wheelL.position.set(-3.1, 0, 0);
      wheelL.rotation.z = Math.PI / 2;
      group.add(wheelL);
      this.nodes['Wheel_Left'] = wheelL;

      const wheelR = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.5, 24), mat(0x131518));
      wheelR.position.set(3.1, 0, 0);
      wheelR.rotation.z = Math.PI / 2;
      group.add(wheelR);
      this.nodes['Wheel_Right'] = wheelR;

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

      const toRadSec = (rpm) => (rpm / 60.0) * Math.PI * 2.0;

      this.speeds.pinion = toRadSec(data.input_rpm || 0);
      this.speeds.crown = toRadSec(data.crown_rpm || 0);
      this.speeds.left = toRadSec(data.left_rpm || 0);
      this.speeds.right = toRadSec(data.right_rpm || 0);
      this.speeds.spider = toRadSec(data.spider_rpm || 0);
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      // Smooth interpolation for Exploded View animation
      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        // Apply physics rotations
        if (this.nodes.DrivePinion) {
          this.nodes.DrivePinion.rotation.y += this.speeds.pinion * dt;
        }

        if (this.nodes.CrownWheel) {
          this.nodes.CrownWheel.rotation.x += this.speeds.crown * dt;
        }
        if (this.nodes.DifferentialCarrier) {
          this.nodes.DifferentialCarrier.rotation.x += this.speeds.crown * dt;
        }

        if (this.nodes.SpiderGear_Top) {
          this.nodes.SpiderGear_Top.rotation.y += this.speeds.spider * dt;
        }
        if (this.nodes.SpiderGear_Bottom) {
          this.nodes.SpiderGear_Bottom.rotation.y -= this.speeds.spider * dt;
        }

        if (this.nodes.SunGear_Left) {
          this.nodes.SunGear_Left.rotation.x += this.speeds.left * dt;
        }
        if (this.nodes.Axle_Left) {
          this.nodes.Axle_Left.rotation.x += this.speeds.left * dt;
        }
        if (this.nodes.Wheel_Left) {
          this.nodes.Wheel_Left.rotation.x += this.speeds.left * dt;
        }

        if (this.nodes.SunGear_Right) {
          this.nodes.SunGear_Right.rotation.x += this.speeds.right * dt;
        }
        if (this.nodes.Axle_Right) {
          this.nodes.Axle_Right.rotation.x += this.speeds.right * dt;
        }
        if (this.nodes.Wheel_Right) {
          this.nodes.Wheel_Right.rotation.x += this.speeds.right * dt;
        }

        // Apply Exploded View node offsets
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
        this.camera.position.set(5.5, 3.8, 6.5);
      }
    }
  }

  window.Differential3DViewer = Differential3DViewer;
})();
