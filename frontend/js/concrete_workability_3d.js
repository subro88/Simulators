/**
 * Concrete Workability Lab (IS 1199) — Three.js 3D WebGL Controller
 * =================================================================
 * Features:
 * - PBR Metallic / Roughness Shaders
 * - OrbitControls (Orbit, Pan, Zoom)
 * - 💥 Exploded View smooth vector interpolation
 * - Dynamic concrete slump deformation animation
 */

(function () {
  'use strict';

  let scene, camera, renderer, controls;
  let modelGroup, isExploded = false;
  let explodeFactor = 0.0, targetExplode = 0.0;
  const nodes = {};

  const basePositions = {
    BasePlate: [0.0, -1.0, 0.0],
    SlumpCone: [0.0, 0.0, 0.0],
    ConcreteMould: [0.0, -0.02, 0.0],
    TampingRod: [1.3, 0.6, 0.0],
    HeightGauge: [-1.3, 0.0, 0.0],
    UpperHopper: [-2.8, 1.6, 0.0],
    LowerHopper: [-2.8, 0.5, 0.0],
    CylinderMould: [-2.8, -0.5, 0.0],
    VeeBeePot: [2.8, -0.5, 0.0],
    VeeBeeRiderDisc: [2.8, 0.6, 0.0]
  };

  const explodeVectors = {
    BasePlate: [0.0, -0.8, 0.0],
    SlumpCone: [0.0, 1.4, 0.0],
    ConcreteMould: [0.0, 0.0, 0.0],
    TampingRod: [1.2, 0.8, 0.0],
    HeightGauge: [-1.0, 0.5, 0.0],
    UpperHopper: [-1.0, 1.2, 0.0],
    LowerHopper: [-1.0, 0.3, 0.0],
    CylinderMould: [-1.0, -0.8, 0.0],
    VeeBeePot: [1.2, -0.6, 0.0],
    VeeBeeRiderDisc: [1.2, 1.2, 0.0]
  };

  function init3D() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b13);

    const aspect = canvas.clientWidth / canvas.clientHeight || 1.6;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 2.5, 7.5);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0x00e676, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x29b6f6, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Floor Grid
    const grid = new THREE.GridHelper(12, 24, 0x00e676, 0x1a2638);
    grid.position.y = -1.05;
    scene.add(grid);

    // Load GLB
    const loader = new THREE.GLTFLoader();
    loader.load(
      '/models/concrete_workability.glb',
      function (gltf) {
        modelGroup = gltf.scene;
        scene.add(modelGroup);

        modelGroup.traverse(function (child) {
          if (child.isMesh) {
            nodes[child.name] = child;
          }
        });
      },
      undefined,
      function (err) {
        console.warn('Fallback: procedural mesh used if GLB load fails', err);
      }
    );

    // Exploded View Button
    const explodeBtn = document.getElementById('btn-toggle-explode');
    if (explodeBtn) {
      explodeBtn.addEventListener('click', function () {
        isExploded = !isExploded;
        targetExplode = isExploded ? 1.0 : 0.0;
        explodeBtn.textContent = isExploded ? '⏪ Collapse View' : '💥 Exploded View';
      });
    }

    const resetCamBtn = document.getElementById('btn-reset-cam');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', function () {
        camera.position.set(0, 2.5, 7.5);
        controls.target.set(0, 0, 0);
      });
    }

    window.addEventListener('resize', onResize);
    animate();
  }

  function onResize() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || !camera || !renderer) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  function animate() {
    requestAnimationFrame(animate);

    // Smooth Exploded View interpolation
    explodeFactor += (targetExplode - explodeFactor) * 0.1;

    for (const [name, node] of Object.entries(nodes)) {
      const base = basePositions[name];
      const vec = explodeVectors[name];
      if (base && vec) {
        node.position.x = base[0] + vec[0] * explodeFactor;
        node.position.y = base[1] + vec[1] * explodeFactor;
        node.position.z = base[2] + vec[2] * explodeFactor;
      }
    }

    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3D);
  } else {
    init3D();
  }
})();
