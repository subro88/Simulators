/**
 * Automotive Friction Clutch — Three.js WebGL 3D Controller
 * ==========================================================
 * Loads binary GLTF (.glb) clutch model, animates pedal clamp/release travel,
 * drives engine vs gearbox rotational speeds, and supports Exploded View inspection.
 */

(function () {
  'use strict';

  class Clutch3DViewer {
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
        'Flywheel': new THREE.Vector3(0, 0, -1.8),
        'FrictionDisc_Lining': new THREE.Vector3(0, 0, -0.9),
        'FrictionDisc_Hub': new THREE.Vector3(0, 0, -0.9),
        'PressurePlate': new THREE.Vector3(0, 0, 0.2),
        'DiaphragmSpring': new THREE.Vector3(0, 0, 1.1),
        'ReleaseBearing': new THREE.Vector3(0, 0, 2.0),
        'SplinedShaft': new THREE.Vector3(0, 0, 0)
      };

      // Telemetry animation values
      this.engineOmega = 0;
      this.gearboxOmega = 0;
      this.pedalDisplacement = 0;

      this.lastTime = performance.now();
      this.init();
    }

    init() {
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 560;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(4.5, 2.8, 5.5);

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
        this.controls.target.set(0, 0, 0);
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

      const rimLight = new THREE.DirectionalLight(0xffd600, 0.5);
      rimLight.position.set(0, -6, 4);
      this.scene.add(rimLight);

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
      const modelPath = 'models/clutch.glb';

      loader.load(
        modelPath,
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.indexNodes(root);
          this.isLoaded = true;
          console.log('✓ Clutch GLTF model loaded.');
        },
        undefined,
        (err) => {
          console.warn('Clutch GLTF load fallback:', err);
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

      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32), mat(0x22252a));
      flywheel.position.set(0, 0, -0.6);
      flywheel.rotation.x = Math.PI / 2;
      group.add(flywheel);
      this.nodes['Flywheel'] = flywheel;

      const lining = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 32), mat(0xd97706));
      lining.position.set(0, 0, -0.3);
      lining.rotation.x = Math.PI / 2;
      group.add(lining);
      this.nodes['FrictionDisc_Lining'] = lining;

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), mat(0x556270));
      hub.position.set(0, 0, -0.3);
      hub.rotation.x = Math.PI / 2;
      group.add(hub);
      this.nodes['FrictionDisc_Hub'] = hub;

      const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.25, 32), mat(0x29b6f6, 0x052033));
      plate.position.set(0, 0, 0.0);
      plate.rotation.x = Math.PI / 2;
      group.add(plate);
      this.nodes['PressurePlate'] = plate;

      const spring = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.35, 16), mat(0xffd600, 0x332800));
      spring.position.set(0, 0, 0.35);
      spring.rotation.x = Math.PI / 2;
      group.add(spring);
      this.nodes['DiaphragmSpring'] = spring;

      const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 20), mat(0x3ddc84));
      bearing.position.set(0, 0, 0.8);
      bearing.rotation.x = Math.PI / 2;
      group.add(bearing);
      this.nodes['ReleaseBearing'] = bearing;

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 20), mat(0x65707e));
      shaft.position.set(0, 0, 0.2);
      shaft.rotation.x = Math.PI / 2;
      group.add(shaft);
      this.nodes['SplinedShaft'] = shaft;

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

      this.engineOmega = toRadSec(data.engine_rpm || 0);
      this.gearboxOmega = toRadSec(data.gearbox_rpm || 0);

      // Axial displacement based on pedal travel (0% to 100%) -> 0.0 to 0.45 units
      const pedalPct = data.pedal_travel_pct !== undefined ? data.pedal_travel_pct : 0;
      this.pedalDisplacement = (pedalPct / 100.0) * 0.45;
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.1);
      this.lastTime = now;

      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * 0.08;

      if (this.isLoaded && this.nodes) {
        // Engine-driven components: Flywheel & Pressure Plate
        if (this.nodes.Flywheel) {
          this.nodes.Flywheel.rotation.z += this.engineOmega * dt;
        }
        if (this.nodes.PressurePlate) {
          this.nodes.PressurePlate.rotation.z += this.engineOmega * dt;
        }

        // Gearbox-driven components: Friction Disc Hub/Lining & Splined Shaft
        if (this.nodes.FrictionDisc_Lining) {
          this.nodes.FrictionDisc_Lining.rotation.z += this.gearboxOmega * dt;
        }
        if (this.nodes.FrictionDisc_Hub) {
          this.nodes.FrictionDisc_Hub.rotation.z += this.gearboxOmega * dt;
        }
        if (this.nodes.SplinedShaft) {
          this.nodes.SplinedShaft.rotation.z += this.gearboxOmega * dt;
        }

        // Apply Exploded View & Pedal Travel axial displacement
        for (const name in this.nodes) {
          const node = this.nodes[name];
          const basePos = this.basePositions[name];
          const offset = this.explodeOffsets[name];

          if (node && basePos) {
            let pedalZ = 0;

            // Pressure Plate & Release Bearing move back on pedal press
            if (name === 'PressurePlate' || name === 'ReleaseBearing' || name === 'DiaphragmSpring') {
              pedalZ = this.pedalDisplacement;
            }

            const expZ = offset ? offset.z * this.explodeFactor : 0;
            const expX = offset ? offset.x * this.explodeFactor : 0;
            const expY = offset ? offset.y * this.explodeFactor : 0;

            node.position.x = basePos.x + expX;
            node.position.y = basePos.y + expY;
            node.position.z = basePos.z + expZ + pedalZ;
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
        this.camera.position.set(4.5, 2.8, 5.5);
      }
    }
  }

  window.Clutch3DViewer = Clutch3DViewer;
})();
