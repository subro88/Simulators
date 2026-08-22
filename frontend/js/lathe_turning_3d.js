/**
 * Lathe Turning 3D WebGL Renderer (Three.js)
 * ==========================================
 * Renders interactive Lathe chuck, workpiece cylinder, tool post,
 * chips, and GLB models with explode mode and camera controls.
 */

class LatheTurning3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
    this.camera.position.set(3, 2, 4);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.setupLights();
    this.buildProceduralLathe();
    this.loadGLBModel();

    this.isExploded = false;
    this.rotationSpeed = 0.05;

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.4);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);
  }

  buildProceduralLathe() {
    this.latheGroup = new THREE.Group();

    // Lathe Bed
    const bedGeo = new THREE.BoxGeometry(4.0, 0.2, 0.8);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    this.bedMesh = new THREE.Mesh(bedGeo, bedMat);
    this.bedMesh.position.set(0, -0.6, 0);
    this.latheGroup.add(this.bedMesh);

    // Headstock
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.set(-1.6, -0.1, 0);
    this.latheGroup.add(this.headMesh);

    // Chuck (Rotates)
    const chuckGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    const chuckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    this.chuckMesh = new THREE.Mesh(chuckGeo, chuckMat);
    this.chuckMesh.rotation.z = Math.PI / 2;
    this.chuckMesh.position.set(-1.1, 0, 0);
    this.latheGroup.add(this.chuckMesh);

    // Workpiece Cylinder (Rotates)
    const workGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.0, 32);
    const workMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
    this.workpieceMesh = new THREE.Mesh(workGeo, workMat);
    this.workpieceMesh.rotation.z = Math.PI / 2;
    this.workpieceMesh.position.set(0, 0, 0);
    this.latheGroup.add(this.workpieceMesh);

    // Tool Post & Cutting Insert
    const toolGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
    const toolMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
    this.toolMesh = new THREE.Mesh(toolGeo, toolMat);
    this.toolMesh.position.set(0.2, -0.05, 0.35);
    this.latheGroup.add(this.toolMesh);

    this.scene.add(this.latheGroup);
  }

  loadGLBModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
      '/models/lathe_turning.glb',
      (gltf) => {
        this.glbModel = gltf.scene;
        this.glbModel.scale.set(0.8, 0.8, 0.8);
        this.glbModel.position.set(0, 0.5, 0);
        this.glbModel.visible = false;
        this.scene.add(this.glbModel);
      },
      undefined,
      (err) => console.log('GLB load fallback to procedural model:', err)
    );
  }

  toggleExplodeView() {
    this.isExploded = !this.isExploded;
    const offset = this.isExploded ? 0.6 : 0.0;

    this.headMesh.position.x = -1.6 - offset;
    this.chuckMesh.position.x = -1.1 - offset * 0.5;
    this.toolMesh.position.z = 0.35 + offset;
  }

  resetCamera() {
    this.camera.position.set(3, 2, 4);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  updateParams(speedRpm, diameterMm) {
    this.rotationSpeed = (speedRpm / 60) * 0.1;
    const rad = (diameterMm / 100) * 0.25;
    if (this.workpieceMesh) {
      this.workpieceMesh.scale.set(rad / 0.25, 1, rad / 0.25);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.chuckMesh && this.workpieceMesh) {
      this.chuckMesh.rotation.x += this.rotationSpeed;
      this.workpieceMesh.rotation.x += this.rotationSpeed;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.canvas) return;
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}

window.LatheTurning3D = LatheTurning3D;
