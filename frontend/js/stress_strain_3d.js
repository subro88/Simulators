/**
 * Stress-Strain Three.js 3D WebGL Renderer
 */
class StressStrain3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.nodes = {};
    this.isExploded = false;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);

    const width = this.canvas.clientWidth || 600;
    const height = this.canvas.clientHeight || 400;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.5, 4.5);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    this.scene.add(dirLight);

    this.loadModel();
    this.animate();
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
      '/models/stress_strain.glb',
      (gltf) => {
        const model = gltf.scene;
        this.scene.add(model);

        model.traverse((child) => {
          if (child.isMesh) {
            this.nodes[child.name] = child;
          }
        });
      },
      undefined,
      (err) => {
        console.warn('GLB load fallback', err);
      }
    );
  }

  updateStrain(elongationMm) {
    if (this.nodes['TensileSpecimen']) {
      const scaleY = 1.0 + (elongationMm * 2.0);
      this.nodes['TensileSpecimen'].scale.y = scaleY;
    }
    if (this.nodes['GripJaws_Top']) {
      this.nodes['GripJaws_Top'].position.y = 1.1 + (elongationMm * 0.5);
    }
  }

  toggleExplode() {
    this.isExploded = !this.isExploded;
    const factor = this.isExploded ? 0.8 : 0.0;
    if (this.nodes['GripJaws_Top']) this.nodes['GripJaws_Top'].position.y = 1.1 + factor;
    if (this.nodes['GripJaws_Bottom']) this.nodes['GripJaws_Bottom'].position.y = -1.1 - factor;
  }

  resetCamera() {
    this.camera.position.set(0, 1.5, 4.5);
    this.controls.target.set(0, 0, 0);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
