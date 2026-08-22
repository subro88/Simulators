(function(){
  "use strict";
  var THREE = window.THREE;
  if(!THREE){ return; }
  var S = window.DIFF_STATE;
  var renderer, scene, camera, diff, carrier, leftSide, rightSide, leftWheel, rightWheel, drivePinion;
  var spiders = [];
  var running = false, last = 0, rafId = 0;
  var canvas = document.getElementById("sim3d-canvas");
  var cam = { radius: 9, theta: 0.9, phi: 1.15 };

  function mat(c, o){
    o = o || {};
    return new THREE.MeshStandardMaterial({ color:c, metalness:o.metal||0.6, roughness:o.rough||0.35, emissive:o.emissive||0x000000 });
  }

  function buildSpider(count, axleT, spiderT){
    spiders.forEach(function(s){ carrier.remove(s); });
    spiders = [];
    var d = 0.62;
    var coneR = Math.max(0.22, 0.18 + spiderT*0.012);
    for(var i=0;i<count;i++){
      var a = i*(Math.PI*2/count);
      var radial = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      var g = new THREE.Group();
      g.position.set(0, d*Math.cos(a), d*Math.sin(a));
      g.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), radial);
      var geo = new THREE.ConeGeometry(coneR, 0.5, 16);
      geo.rotateZ(Math.PI/2);
      var m = new THREE.Mesh(geo, mat(0xffd600,{emissive:0x4a3a00}));
      g.add(m);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(coneR*0.9,0.05,8,20), mat(0xffe066));
      ring.position.x = -0.1; ring.rotation.y = Math.PI/2;
      g.add(ring);
      g.userData.mesh = m;
      carrier.add(g);
      spiders.push(g);
    }
  }

  function rebuild(){
    if(!diff) return;
    while(diff.children.length) diff.remove(diff.children[0]);
    spiders = [];
    var sideR = Math.max(0.4, 0.3 + S.axleTeeth*0.018);
    var sideGeo = new THREE.ConeGeometry(sideR, 0.7, 20); sideGeo.rotateZ(Math.PI/2);
    var sideGeoR = new THREE.ConeGeometry(sideR, 0.7, 20); sideGeoR.rotateZ(Math.PI/2);
    leftSide = new THREE.Mesh(sideGeo, mat(0x3ddc84,{emissive:0x064a22}));
    leftSide.position.x = -1.15; diff.add(leftSide);
    rightSide = new THREE.Mesh(sideGeoR, mat(0x3ddc84,{emissive:0x064a22}));
    rightSide.position.x = 1.15; diff.add(rightSide);
    carrier = new THREE.Group(); diff.add(carrier);
    var crownGeo = new THREE.TorusGeometry(1.35, 0.18, 12, 40); crownGeo.rotateY(Math.PI/2);
    var crown = new THREE.Mesh(crownGeo, mat(0x29b6f6,{emissive:0x06283a}));
    carrier.add(crown);
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.5,20), mat(0x1f2535));
    hub.rotation.z = Math.PI/2; carrier.add(hub);
    var pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.4,12), mat(0x8899aa));
    carrier.add(pin);
    buildSpider(S.spiderCount, S.axleTeeth, S.spiderTeeth);
    rebuild2();
  }

  function rebuild2(){
    if(!diff) return;
    // drive pinion
    drivePinion = new THREE.Group();
    var pg = new THREE.CylinderGeometry(0.28,0.28,0.7,16); pg.rotateX(Math.PI/2);
    var pm = new THREE.Mesh(pg, mat(0xff9800,{emissive:0x3a2200}));
    drivePinion.add(pm);
    drivePinion.position.set(0,-1.75,0);
    diff.add(drivePinion);
    // axles
    var axleGeo = new THREE.CylinderGeometry(0.12,0.12,1.7,12); axleGeo.rotateZ(Math.PI/2);
    var axleGeoR = new THREE.CylinderGeometry(0.12,0.12,1.7,12); axleGeoR.rotateZ(Math.PI/2);
    var lAx = new THREE.Mesh(axleGeo, mat(0x8899aa)); lAx.position.set(-2.0,0,0); diff.add(lAx);
    var rAx = new THREE.Mesh(axleGeoR, mat(0x8899aa)); rAx.position.set(2.0,0,0); diff.add(rAx);
    // wheels
    var wGeo = new THREE.CylinderGeometry(0.85,0.85,0.5,24); wGeo.rotateZ(Math.PI/2);
    var wGeoR = new THREE.CylinderGeometry(0.85,0.85,0.5,24); wGeoR.rotateZ(Math.PI/2);
    leftWheel = new THREE.Mesh(wGeo, mat(0x556677)); leftWheel.position.set(-3.0,0,0); diff.add(leftWheel);
    rightWheel = new THREE.Mesh(wGeoR, mat(0x556677)); rightWheel.position.set(3.0,0,0); diff.add(rightWheel);
  }

  function init(){
    if(renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, 1.6, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(5,8,6); scene.add(dl);
    var pl = new THREE.PointLight(0x66aaff, 0.5); pl.position.set(-6,-3,-4); scene.add(pl);
    diff = new THREE.Group(); scene.add(diff);
    rebuild();
    bindOrbit();
    resize();
    window.addEventListener("resize", resize);
  }

  function resize(){
    if(!renderer) return;
    var w = canvas.clientWidth || 900, h = canvas.clientHeight || 540;
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  function updateCam(){
    var r = cam.radius;
    camera.position.set(
      r*Math.sin(cam.phi)*Math.cos(cam.theta),
      r*Math.cos(cam.phi),
      r*Math.sin(cam.phi)*Math.sin(cam.theta)
    );
    camera.lookAt(0,0,0);
  }
  function bindOrbit(){
    var dragging=false, lx=0, ly=0;
    canvas.addEventListener("mousedown", function(e){ dragging=true; lx=e.clientX; ly=e.clientY; });
    window.addEventListener("mouseup", function(){ dragging=false; });
    window.addEventListener("mousemove", function(e){
      if(!dragging) return;
      cam.theta -= (e.clientX-lx)*0.01;
      cam.phi = Math.max(0.2, Math.min(2.9, cam.phi - (e.clientY-ly)*0.01));
      lx=e.clientX; ly=e.clientY; updateCam();
    });
    canvas.addEventListener("wheel", function(e){
      e.preventDefault();
      cam.radius = Math.max(4, Math.min(20, cam.radius + e.deltaY*0.01));
      updateCam();
    }, {passive:false});
  }

  function animate(ts){
    if(!running) return;
    if(!last) last = ts;
    var dt = Math.min(0.05,(ts-last)/1000); last = ts;
    var k = Math.PI*2/60;
    carrier.rotation.x += S.carrierRpm*k*dt;
    leftSide.rotation.x += S.left*k*dt;
    rightSide.rotation.x += S.right*k*dt;
    leftWheel.rotation.x += S.left*k*dt;
    rightWheel.rotation.x += S.right*k*dt;
    spiders.forEach(function(g){ g.userData.mesh.rotation.x += S.spider*k*dt; });
    drivePinion.rotation.z += S.carrierRpm*k*dt*3;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }
  function activate(){
    init(); updateCam(); resize();
    running = true; last = 0;
    if(!rafId) rafId = requestAnimationFrame(animate);
  }
  function deactivate(){ running = false; if(rafId){ cancelAnimationFrame(rafId); rafId = 0; } }
  window.DIFF3D = {
    activate: activate, deactivate: deactivate,
    setMode: function(m){ S.maneuver = m; },
    setSpider: function(n){ S.spiderCount = n; if(diff) rebuild(); },
    setTeeth: function(a,s){ S.axleTeeth=a; S.spiderTeeth=s; if(diff) rebuild(); },
    export: function(){
      if(!renderer) return;
      renderer.render(scene, camera);
      var a=document.createElement("a"); a.download="differential-3d.png";
      a.href = canvas.toDataURL("image/png"); a.click();
    }
  };
  var ex = document.getElementById("btn-3d-export");
  if(ex) ex.addEventListener("click", function(){ if(window.DIFF3D) window.DIFF3D.export(); });
})();
