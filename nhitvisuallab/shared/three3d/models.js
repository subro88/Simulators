/*
 * Sim3D models — animated 3D representations for MechSimulator tools.
 * Family-based: each builder covers a physics domain and many tool slugs map
 * onto it (see Sim3D.mapSlug). Metadata lives in Sim3D.meta and is rendered
 * by the viewer into #sim3d-title / #sim3d-blurb on the page.
 */
(function (global) {
  'use strict';
  var S = global.Sim3D;
  var T = THREE;

  // ---- helpers ----------------------------------------------------------
  function cyl(r, h, mat) { var m = new T.Mesh(new T.CylinderGeometry(r, r, h, 24), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function box(w, h, d, mat) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function sph(r, mat) { var m = new T.Mesh(new T.SphereGeometry(r, 24, 16), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  var UP = new T.Vector3(0, 1, 0);
  function placeLink(mesh, a, b) {
    var dir = new T.Vector3().subVectors(b, a); var len = dir.length() || 1e-4;
    mesh.scale.set(1, len, 1); mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  }
  function v2(x, y, z) { return new T.Vector3(x, y == null ? 0 : y, z == null ? 0 : z); }
  function meta(slug, title, blurb) { S.meta[slug] = { title: title, blurb: blurb }; }
  function ground(g, y) { var m = new T.Mesh(new T.BoxGeometry(8, 0.2, 4), new T.MeshStandardMaterial({ color: 0x16203a, roughness: 1 })); m.position.y = y || -1.2; m.receiveShadow = true; g.add(m); }

  // ============================================================ BESPOKE (MVP)
  meta('four-bar-linkage', 'Four-Bar Linkage',
    'The simplest closed-chain mechanism: four rigid links joined by four pin joints. As the crank rotates the coupler traces a curve and the rocker oscillates — basis of wipers, governors and suspensions.');
  S.register('four-bar-linkage', function (ctx) {
    var g = new T.Group();
    var O2 = v2(-2.2, 1.4, 0), O4 = v2(2.2, 1.4, 0), r2 = 1.2, r3 = 3.0, r4 = 2.2;
    var matL = ctx.makeMaterial(0x4fc3f7, { metalness: 0.5, roughness: 0.4 }), matP = ctx.makeMaterial(0xffb74d, { metalness: 0.2, roughness: 0.5 });
    var crank = cyl(0.1, 1, matL), coupler = cyl(0.1, 1, matL), rocker = cyl(0.1, 1, matL);
    g.add(crank, coupler, rocker);
    [O2, O4].forEach(function (p) { var j = sph(0.16, matP); j.position.copy(p); g.add(j); });
    function ci(c0, r0, c1, r1, s) { var dx = c1.x - c0.x, dy = c1.y - c0.y, d = Math.hypot(dx, dy); var a = (r0 * r0 - r1 * r1 + d * d) / (2 * d); var h = Math.sqrt(Math.max(0, r0 * r0 - a * a)); var mx = c0.x + a * dx / d, my = c0.y + a * dy / d; return v2(mx + s * h * dy / d, my - s * h * dx / d, 0); }
    return { group: g, update: function (t) { var th = t * 1.1; var A = v2(O2.x + r2 * Math.cos(th), O2.y + r2 * Math.sin(th), 0); var B = ci(A, r3, O4, r4, 1); placeLink(crank, O2, A); placeLink(coupler, A, B); placeLink(rocker, B, O4); } };
  });

  meta('gear-trains', 'Gear Train',
    'A gear train transmits rotation and torque between shafts. The gear ratio sets speed reduction or torque multiplication. Simple, compound and worm trains appear in gearboxes, clocks and differentials.');
  function makeGear(R, teeth, mat) {
    var grp = new T.Group();
    var body = cyl(R * 0.9, 0.4, mat); body.rotation.x = Math.PI / 2; grp.add(body);
    var hub = cyl(R * 0.3, 0.5, mat); hub.rotation.x = Math.PI / 2; grp.add(hub);
    for (var i = 0; i < teeth; i++) { var a = (i / teeth) * Math.PI * 2; var tooth = box(R * 0.28, 0.42, R * 0.32, mat); tooth.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); tooth.rotation.y = -a; grp.add(tooth); }
    return grp;
  }
  S.register('gear-trains', function (ctx) {
    var g = new T.Group();
    var gA = makeGear(1.4, 18, ctx.makeMaterial(0x90a4ae, { metalness: 0.7, roughness: 0.35 }));
    var gB = makeGear(0.9, 12, ctx.makeMaterial(0xff8a65, { metalness: 0.7, roughness: 0.35 }));
    gA.position.set(-1.0, 1.4, 0); gB.position.set(1.3, 1.4, 0); g.add(gA, gB);
    return { group: g, update: function (t) { gA.rotation.z = t; gB.rotation.z = -t * (18 / 12); } };
  });

  meta('simple-pendulum', 'Simple Pendulum',
    'A point mass on a light string. For small angles its period is T = 2π√(L/g) — independent of mass and nearly of amplitude — the principle behind pendulum clocks.');
  S.register('simple-pendulum', function (ctx) {
    var g = new T.Group(); var L = 3.0, pivot = v2(0, 3.0, 0);
    var stand = box(0.2, 0.2, 0.2, ctx.makeMaterial(0x607d8b)); stand.position.copy(pivot); g.add(stand);
    var rod = cyl(0.04, 1, ctx.makeMaterial(0xb0bec5)); g.add(rod);
    var bob = sph(0.32, ctx.makeMaterial(0xef5350, { metalness: 0.3, roughness: 0.4 })); g.add(bob);
    return { group: g, update: function (t) { var th = 0.6 * Math.cos(Math.sqrt(9.81 / L) * t); var end = v2(pivot.x + L * Math.sin(th), pivot.y - L * Math.cos(th), 0); placeLink(rod, pivot, end); bob.position.copy(end); } };
  });

  meta('utm-testing', 'Universal Testing Machine',
    'A UTM pulls a specimen while measuring force and extension, producing a stress–strain curve. From it we read Young’s modulus, yield, UTS and ductility. The model shows the load frame, moving crosshead and a specimen that elongates and necks under tension.');
  S.register('utm-testing', function (ctx) {
    var g = new T.Group();
    var fm = ctx.makeMaterial(0x546e7a, { metalness: 0.6, roughness: 0.4 });
    var colL = box(0.25, 5, 0.25, fm); colL.position.set(-1.2, 1.5, 0);
    var colR = box(0.25, 5, 0.25, fm); colR.position.set(1.2, 1.5, 0);
    var base = box(3.2, 0.3, 1.2, fm); base.position.set(0, -1.0, 0);
    var top = box(3.2, 0.3, 1.2, fm); top.position.set(0, 4.0, 0); g.add(colL, colR, base, top);
    var cross = box(2.4, 0.25, 0.8, ctx.makeMaterial(0xffca28)); g.add(cross);
    var spec = box(0.4, 1.2, 0.4, ctx.makeMaterial(0x8d6e63, { roughness: 0.6 })); g.add(spec);
    var gT = box(0.6, 0.2, 0.6, fm), gB = box(0.6, 0.2, 0.6, fm); g.add(gT, gB);
    return { group: g, update: function (t) { var ph = Math.sin(t * 0.6) * 0.5 + 0.5; var st = 1 + ph * 0.8, nk = 1 - ph * 0.5; spec.scale.set(nk, st, nk); spec.position.y = 1.5; cross.position.y = 2.7 + ph * 0.9; gT.position.y = 2.1 + ph * 0.9; gB.position.y = 0.9; } };
  });

  meta('projectile-motion', 'Projectile Motion',
    'An object launched under gravity follows a parabolic path (neglecting drag). Range, peak and time of flight follow from launch speed and angle. The sphere traces its trajectory with a fading trail.');
  S.register('projectile-motion', function (ctx) {
    var g = new T.Group();
    var ball = sph(0.25, ctx.makeMaterial(0x66bb6a, { roughness: 0.4 })); g.add(ball);
    var tm = ctx.makeMaterial(0x66bb6a, { transparent: true, opacity: 0.6 }); var tr = [];
    for (var i = 0; i < 60; i++) { var d = sph(0.05, tm.clone()); d.visible = false; g.add(d); tr.push(d); }
    var v0 = 7, ang = 55 * Math.PI / 180;
    return { group: g, update: function (t) { var tt = t % 1.6; var x = v0 * Math.cos(ang) * tt; var y = v0 * Math.sin(ang) * tt - 0.5 * 9.81 * tt * tt; if (y < 0) y = 0; ball.position.set(x, y + 0.25, 0); for (var i = tr.length - 1; i > 0; i--) { tr[i].position.copy(tr[i - 1].position); tr[i].visible = tr[i - 1].visible; } tr[0].position.copy(ball.position); tr[0].visible = true; } };
  });

  meta('centrifugal-pump', 'Centrifugal Pump',
    'A rotating impeller flings fluid outward; the volute converts that kinetic energy into pressure. Head–capacity, power and efficiency curves define the operating point. The model shows the impeller spinning inside the casing.');
  S.register('centrifugal-pump', function (ctx) {
    var g = new T.Group(); g.position.y = 1.5;
    var casing = new T.Mesh(new T.TorusGeometry(1.6, 0.5, 16, 40), ctx.makeMaterial(0x37474f, { metalness: 0.5, roughness: 0.5 })); casing.castShadow = true; g.add(casing);
    var imp = new T.Group(); var hub = cyl(0.35, 0.5, ctx.makeMaterial(0xff7043)); imp.add(hub);
    for (var i = 0; i < 6; i++) { var a = (i / 6) * Math.PI * 2; var bl = box(1.1, 0.5, 0.12, ctx.makeMaterial(0xffab91)); bl.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7); bl.rotation.y = -a; bl.rotation.x = 0.4; imp.add(bl); }
    g.add(imp);
    return { group: g, update: function (t) { imp.rotation.y = t * 3.0; } };
  });

  meta('beam-bending', 'Beam Bending (SFD & BMD)',
    'A simply supported beam under a central load deflects in a smooth curve. The internal shear force and bending moment vary along the span — plotted as the SFD and BMD used to size beams against failure.');
  S.register('beam-bending', function (ctx) {
    var g = new T.Group(); var L = 6;
    var sm = ctx.makeMaterial(0x455a64);
    var sL = new T.Mesh(new T.ConeGeometry(0.3, 0.6, 4), sm); sL.position.set(-L / 2, -0.3, 0); sL.rotation.y = Math.PI / 4; g.add(sL);
    var sR = sL.clone(); sR.position.set(L / 2, -0.3, 0); g.add(sR);
    var N = 24, seg = box(L / N * 0.98, 0.25, 0.5, ctx.makeMaterial(0x90caf9, { metalness: 0.4, roughness: 0.5 })); var segs = [];
    for (var i = 0; i < N; i++) { var s = seg.clone(); g.add(s); segs.push(s); }
    var load = sph(0.22, ctx.makeMaterial(0xef5350)); g.add(load);
    return { group: g, update: function (t) { var dmax = 0.7 * (0.5 + 0.5 * Math.sin(t * 1.2)); for (var i = 0; i < N; i++) { var x = -L / 2 + (i + 0.5) * (L / N); segs[i].position.set(x, dmax * (1 - Math.pow(2 * x / L, 2)), 0); } load.position.set(0, dmax + 0.3, 0); } };
  });

  meta('screw-gauge', 'Screw Gauge (Micrometer)',
    'A screw gauge measures thickness to 0.01 mm using a finely pitched screw: turning the thimble advances the spindle linearly. The model shows the frame, rotating thimble and spindle closing on a workpiece.');
  S.register('screw-gauge', function (ctx) {
    var g = new T.Group(); g.position.y = 1.2;
    var fm = ctx.makeMaterial(0x607d8b, { metalness: 0.6, roughness: 0.4 });
    var frame = new T.Mesh(new T.TorusGeometry(0.9, 0.18, 12, 32, Math.PI * 1.3), fm); frame.rotation.z = Math.PI * 0.15; g.add(frame);
    var anvil = cyl(0.22, 0.3, fm); anvil.rotation.z = Math.PI / 2; anvil.position.set(-0.9, 0, 0); g.add(anvil);
    var thimble = cyl(0.28, 1.0, ctx.makeMaterial(0xffca28)); thimble.rotation.z = Math.PI / 2; thimble.position.set(0.2, 0, 0); g.add(thimble);
    var spindle = cyl(0.12, 1.2, ctx.makeMaterial(0xcfd8dc)); spindle.rotation.z = Math.PI / 2; g.add(spindle);
    var work = box(0.3, 0.6, 0.6, ctx.makeMaterial(0x8d6e63)); work.position.set(-0.55, 0, 0); g.add(work);
    return { group: g, update: function (t) { var open = 0.35 + 0.2 * (0.5 + 0.5 * Math.sin(t)); thimble.rotation.x = -t * 2; spindle.position.x = -0.55 + 0.15 + open; } };
  });

  // ============================================================ FAMILY: MECHANISMS
  meta('slider-crank', 'Slider-Crank Mechanism', 'Converts rotary motion to reciprocating motion (or vice-versa). Used in piston engines, pumps and compressors.');
  S.register('slider-crank', function (ctx) {
    var g = new T.Group(); var O = v2(-1.5, 0.5, 0), r = 1.0, l = 2.6;
    var fm = ctx.makeMaterial(0x4fc3f7, { metalness: 0.5 }), pm = ctx.makeMaterial(0xffb74d);
    var crank = cyl(0.1, 1, fm), rod = cyl(0.1, 1, fm); g.add(crank, rod);
    var pin = sph(0.14, pm), slid = box(0.6, 0.4, 0.6, ctx.makeMaterial(0x90a4ae)); g.add(pin, slid);
    ground(g, -0.6);
    return { group: g, update: function (t) { var th = t * 1.4; var A = v2(O.x + r * Math.cos(th), O.y + r * Math.sin(th), 0); var x = O.x + Math.sqrt(Math.max(0, l * l - Math.pow(A.y - O.y, 2))); var B = v2(x, O.y, 0); placeLink(crank, O, A); placeLink(rod, A, B); pin.position.copy(A); slid.position.set(B.x, O.y, 0); } };
  });

  meta('cam-follower', 'Cam & Follower', 'A rotating cam profile drives a follower up and down. Profiles (SHM, cycloidal, uniform) shape the displacement, velocity and acceleration diagrams.');
  S.register('cam-follower', function (ctx) {
    var g = new T.Group();
    var base = cyl(1.0, 0.3, ctx.makeMaterial(0x546e7a)); base.rotation.x = Math.PI / 2; g.add(base);
    var cam = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.4, 32, 1, false), ctx.makeMaterial(0x4fc3f7, { metalness: 0.5 })); cam.rotation.x = Math.PI / 2; g.add(cam);
    var fol = box(0.3, 1.4, 0.3, ctx.makeMaterial(0xffb74d)); fol.position.set(0, 1.6, 0); g.add(fol);
    ground(g, -0.5);
    return { group: g, update: function (t) { cam.rotation.z = -t * 1.5; var lift = 0.5 + 0.4 * Math.abs(Math.sin(t * 1.5)); fol.position.y = 1.1 + lift; } };
  });

  meta('belt-drive', 'Belt & Chain Drive', 'An open or crossed belt transfers rotation between pulleys; the velocity ratio follows pulley diameters. Used in conveyors, lathes and engines.');
  S.register('belt-drive', function (ctx) {
    var g = new T.Group(); g.position.y = 1.0;
    function pulley(x, R, c) { var p = new T.Mesh(new T.CylinderGeometry(R, R, 0.4, 28), ctx.makeMaterial(c, { metalness: 0.6 })); p.rotation.x = Math.PI / 2; p.position.set(x, 0, 0); g.add(p); return p; }
    var p1 = pulley(-1.4, 0.8, 0x90a4ae), p2 = pulley(1.4, 1.3, 0xff8a65);
    var belt = new T.Mesh(new T.TorusGeometry(1, 0.08, 8, 60), ctx.makeMaterial(0x37474f)); belt.rotation.y = Math.PI / 2; belt.position.set(0, 0, 0); g.add(belt);
    return { group: g, update: function (t) { p1.rotation.z = t * 1.6; p2.rotation.z = -t * 1.6 * (0.8 / 1.3); } };
  });

  meta('governor', 'Centrifugal Governor', 'Spinning flyballs rise with speed, moving a sleeve that throttles the engine — a classic feedback speed regulator (Watt, Porter, Proell).');
  S.register('governor', function (ctx) {
    var g = new T.Group(); g.position.y = 0.4;
    var col = cyl(0.12, 2.0, ctx.makeMaterial(0x546e7a)); col.position.y = 1.0; g.add(col);
    var sleeve = cyl(0.3, 0.25, ctx.makeMaterial(0xffb74d)); g.add(sleeve);
    var arms = [], balls = [];
    for (var i = 0; i < 2; i++) { var a = box(0.06, 1.6, 0.06, ctx.makeMaterial(0x4fc3f7)); g.add(a); arms.push(a); var b = sph(0.22, ctx.makeMaterial(0xef5350)); g.add(b); balls.push(b); }
    return { group: g, update: function (t) { var sp = 1.3 + 0.5 * Math.sin(t * 0.8); var ang = 0.5 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.8)); var rot = t * sp; for (var i = 0; i < 2; i++) { var side = i ? 1 : -1; var bx = side * Math.sin(ang) * 1.4, by = 1.9 - Math.cos(ang) * 1.4; balls[i].position.set(bx, by, 0); arms[i].position.set(bx / 2, (1.9 + by) / 2, 0); arms[i].rotation.z = -side * ang; } sleeve.position.y = 0.6 + ang * 0.8; } };
  });

  meta('flywheel', 'Flywheel', 'A rotating mass stores kinetic energy and smooths torque pulses. Its inertia resists speed change; used in engines, presses and grids.');
  S.register('flywheel', function (ctx) {
    var g = new T.Group(); g.position.y = 1.4;
    var rim = new T.Mesh(new T.TorusGeometry(1.3, 0.35, 16, 40), ctx.makeMaterial(0x546e7a, { metalness: 0.7, roughness: 0.4 })); g.add(rim);
    var hub = cyl(0.3, 0.5, ctx.makeMaterial(0xffb74d)); hub.rotation.x = Math.PI / 2; g.add(hub);
    for (var i = 0; i < 6; i++) { var a = (i / 6) * Math.PI * 2; var sp = box(0.12, 2.4, 0.12, ctx.makeMaterial(0x90a4ae)); sp.position.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); sp.rotation.y = -a; g.add(sp); }
    return { group: g, update: function (t) { g.rotation.z = t * 1.5; } };
  });

  meta('gyroscope', 'Gyroscope', 'A spinning rotor resists changes to its axis, precessing under an applied torque. The basis of navigation, stabilisers and momentum wheels.');
  S.register('gyroscope', function (ctx) {
    var g = new T.Group(); g.position.y = 1.4;
    var ring1 = new T.Mesh(new T.TorusGeometry(1.0, 0.08, 12, 36), ctx.makeMaterial(0x4fc3f7, { metalness: 0.6 })); g.add(ring1);
    var ring2 = ring1.clone(); ring2.rotation.x = Math.PI / 2; g.add(ring2);
    var rotor = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.2, 28), ctx.makeMaterial(0xffb74d, { metalness: 0.6 })); rotor.rotation.x = Math.PI / 2; g.add(rotor);
    return { group: g, update: function (t) { rotor.rotation.y = t * 6; ring1.rotation.x = Math.sin(t * 0.6) * 0.5; ring2.rotation.z = t * 0.4; } };
  });

  // ============================================================ FAMILY: SPRINGS / MACHINES
  meta('spring-system', 'Spring–Mass System', 'Hooke’s law (F = kx) governs a mass on a spring. Free, damped and forced motion produce SHM, decay or resonance with characteristic energy exchange.');
  S.register('spring-system', function (ctx) {
    var g = new T.Group(); g.position.y = 2.2;
    var top = box(2.0, 0.15, 0.4, ctx.makeMaterial(0x546e7a)); top.position.y = 0; g.add(top);
    var coil = new T.Group(); g.add(coil);
    for (var i = 0; i < 8; i++) { var c = cyl(0.05, 0.12, ctx.makeMaterial(0xb0bec5)); c.position.set(0, -i * 0.18, 0); coil.add(c); }
    var mass = box(0.7, 0.5, 0.7, ctx.makeMaterial(0xef5350, { metalness: 0.3 })); g.add(mass);
    return { group: g, update: function (t) { var y = -0.9 - 0.5 * Math.cos(t * 2); mass.position.y = y; coil.scale.y = (-y) / 1.4; } };
  });

  meta('simple-machines', 'Simple Machines', 'Levers, pulleys, incline planes, wheels, screws and wedges trade force for distance via mechanical advantage — the building blocks of all machines.');
  S.register('simple-machines', function (ctx) {
    var g = new T.Group();
    var beam = box(4, 0.15, 0.5, ctx.makeMaterial(0x90a4ae)); g.add(beam);
    var ful = new T.Mesh(new T.ConeGeometry(0.4, 0.8, 4), ctx.makeMaterial(0x546e7a)); ful.position.set(0, -0.4, 0); ful.rotation.y = Math.PI / 4; g.add(ful);
    var lo = box(0.5, 0.5, 0.5, ctx.makeMaterial(0xef5350)); var ef = box(0.4, 0.4, 0.4, ctx.makeMaterial(0x66bb6a)); g.add(lo, ef);
    return { group: g, update: function (t) { var a = 0.18 * Math.sin(t * 1.2); beam.rotation.z = a; lo.position.set(-1.6, 0.35 + 1.6 * Math.sin(a), 0); ef.position.set(1.6, 0.35 - 1.6 * Math.sin(a), 0); } };
  });

  // ============================================================ FAMILY: FORCES / MOTION
  meta('force-diagram', 'Forces & Free-Body Diagram', 'Vectors show every force acting on a body. Resolving them gives the resultant, equilibrium check and Lami’s theorem for coplanar concurrent forces.');
  S.register('force-diagram', function (ctx) {
    var g = new T.Group();
    var block = box(1.0, 1.0, 1.0, ctx.makeMaterial(0x90a4ae, { metalness: 0.4 })); block.position.y = 0.5; g.add(block);
    function arrow(dir, len, col) { var a = new T.Group(); var sh = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 12), ctx.makeMaterial(col)); sh.position.y = len; var st = cyl(0.05, len, ctx.makeMaterial(col)); st.position.y = len / 2; a.add(sh, st); a.quaternion.setFromUnitVectors(UP, dir.clone().normalize()); return a; }
    var f1 = arrow(v2(1, 0.6, 0), 1.4, 0xef5350), f2 = arrow(v2(-0.4, 1, 0), 1.1, 0x66bb6a), f3 = arrow(v2(0, -1, 0), 1.2, 0x4fc3f7); g.add(f1, f2, f3);
    return { group: g, update: function (t) { var s = 0.85 + 0.15 * Math.sin(t); f1.scale.set(s, 1, s); f2.scale.set(1, 1, 1); block.rotation.y = t * 0.3; } };
  });

  meta('motion-free', 'Free Fall & Escape Velocity', 'Under gravity, s = ½gt². Launch fast enough (Newton’s cannonball) and the path becomes an orbit or escapes entirely — inverse-square gravity.');
  S.register('motion-free', function (ctx) {
    var g = new T.Group(); ground(g, -1.5);
    var planet = sph(1.2, ctx.makeMaterial(0x4fc3f7, { metalness: 0.2, roughness: 0.7 })); planet.position.y = -2.6; g.add(planet);
    var ball = sph(0.18, ctx.makeMaterial(0xef5350)); g.add(ball);
    return { group: g, update: function (t) { var ang = t * 0.9; var r = 1.5 + 0.4 * Math.sin(t * 0.5); ball.position.set(Math.cos(ang) * r, -1.4 + Math.sin(ang) * r, 0); } };
  });

  meta('collision', 'Collision & Momentum', 'In isolated collisions momentum is conserved; kinetic energy may or may not be. Elastic, inelastic and explosive cases show what is conserved and what is lost.');
  S.register('collision', function (ctx) {
    var g = new T.Group(); ground(g, -0.8);
    var a = sph(0.35, ctx.makeMaterial(0xef5350)), b = sph(0.35, ctx.makeMaterial(0x66bb6a)); g.add(a, b);
    return { group: g, update: function (t) { var ph = (Math.sin(t * 1.5) * 0.5 + 0.5); a.position.set(-2 + ph * 1.2, 0, 0); b.position.set(2 - ph * 1.2, 0, 0); } };
  });

  // ============================================================ FAMILY: STRENGTH / STRESS
  meta('shaft-torsion', 'Shaft Torsion & Power Screw', 'A torque twists a shaft; shear stress and angle of twist follow τ = T·r/J. Lead screws convert rotation to thrust with efficiency and self-locking.');
  S.register('shaft-torsion', function (ctx) {
    var g = new T.Group(); g.position.y = 1.4;
    var shaft = cyl(0.35, 3.0, ctx.makeMaterial(0x90a4ae, { metalness: 0.6 })); shaft.rotation.z = Math.PI / 2; g.add(shaft);
    var lines = []; for (var i = 0; i < 8; i++) { var l = box(0.04, 3.0, 0.04, ctx.makeMaterial(0x37474f)); l.rotation.z = Math.PI / 2; var a = (i / 8) * Math.PI * 2; l.position.set(0, Math.cos(a) * 0.35, Math.sin(a) * 0.35); g.add(l); lines.push(l); }
    return { group: g, update: function (t) { var tw = 0.4 * Math.sin(t); shaft.rotation.x = tw; lines.forEach(function (l, i) { var a = (i / 8) * Math.PI * 2 + tw; l.position.set(0, Math.cos(a) * 0.35, Math.sin(a) * 0.35); }); } };
  });

  meta('impact', 'Impact & Fatigue Testing', 'A pendulum delivers a sudden blow (Charpy/Izod) measuring fracture energy; a rotating beam accumulates cycles until failure, revealing the S–N endurance limit.');
  S.register('impact', function (ctx) {
    var g = new T.Group(); g.position.y = 2.0;
    var pivot = v2(0, 0, 0), L = 1.8; var arm = cyl(0.06, 1, ctx.makeMaterial(0xb0bec5)); g.add(arm);
    var ham = box(0.4, 0.4, 0.4, ctx.makeMaterial(0xef5350)); g.add(ham);
    var spec = box(0.3, 0.8, 0.3, ctx.makeMaterial(0x90a4ae)); spec.position.set(1.4, -0.9, 0); g.add(spec);
    return { group: g, update: function (t) { var th = 0.9 * Math.cos(t * 1.4); var end = v2(pivot.x + L * Math.sin(th), pivot.y - L * Math.cos(th), 0); placeLink(arm, pivot, end); ham.position.copy(end); } };
  });

  meta('hardness', 'Hardness Testing', 'An indenter is pressed into a surface; Brinell, Rockwell and Vickers relate the impression size/depth to a hardness number characterising resistance to indentation.');
  S.register('hardness', function (ctx) {
    var g = new T.Group(); ground(g, -1.0);
    var spec = box(2.4, 0.5, 1.6, ctx.makeMaterial(0x90a4ae, { metalness: 0.4 })); spec.position.y = -0.75; g.add(spec);
    var ind = new T.Mesh(new T.ConeGeometry(0.25, 0.8, 4), ctx.makeMaterial(0xffb74d, { metalness: 0.6 })); ind.position.set(0, 0.7, 0); g.add(ind);
    var stem = cyl(0.12, 1.0, ctx.makeMaterial(0x546e7a)); stem.position.set(0, 1.4, 0); g.add(stem);
    return { group: g, update: function (t) { var y = 0.7 - 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3)); ind.position.y = y; stem.position.y = y + 0.7; } };
  });

  meta('stress-analysis', 'Stress, Strain & Sections', 'Axial, bending and torsional loads create internal stress fields. Mohr’s circle, section properties, buckling and stress concentration quantify strength and failure.');
  S.register('stress-analysis', function (ctx) {
    var g = new T.Group();
    var cube = box(1.4, 1.4, 1.4, ctx.makeMaterial(0x90a4ae, { metalness: 0.4, roughness: 0.5, transparent: true, opacity: 0.85 })); g.add(cube);
    var faces = []; for (var i = 0; i < 3; i++) { var a = arrowVec(i, 0.9, 0xef5350); g.add(a); faces.push(a); }
    function arrowVec(axis, len, col) { var grp = new T.Group(); var sh = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 12), ctx.makeMaterial(col)); sh.position.y = len; var st = cyl(0.05, len, ctx.makeMaterial(col)); st.position.y = len / 2; grp.add(sh, st); if (axis === 0) grp.rotation.z = -Math.PI / 2; if (axis === 2) grp.rotation.x = Math.PI / 2; grp.position.set(axis === 0 ? 0.7 : 0, axis === 1 ? 0.7 : 0, axis === 2 ? 0.7 : 0); return grp; }
    return { group: g, update: function (t) { cube.rotation.y = t * 0.4; cube.rotation.x = Math.sin(t * 0.3) * 0.3; } };
  });

  meta('joint', 'Joints, Threads & Tolerances', 'Bolted, riveted and welded connections, ISO threads, GD&T and fit/tolerance systems hold parts together and control how they fit and fail.');
  S.register('joint', function (ctx) {
    var g = new T.Group();
    var p1 = box(2.6, 0.3, 1.4, ctx.makeMaterial(0x90a4ae, { metalness: 0.4 })); p1.position.y = 0.15; g.add(p1);
    var p2 = box(2.6, 0.3, 1.4, ctx.makeMaterial(0x90a4ae, { metalness: 0.4 })); p2.position.y = -0.15; g.add(p2);
    var bolts = []; for (var i = -1; i <= 1; i += 2) { var b = cyl(0.12, 0.7, ctx.makeMaterial(0xffb74d, { metalness: 0.6 })); b.position.set(i * 0.9, 0, 0); g.add(b); bolts.push(b); var hd = cyl(0.2, 0.15, ctx.makeMaterial(0xffb74d)); hd.position.set(i * 0.9, 0.4, 0); g.add(hd); }
    return { group: g, update: function (t) { var s = 1 + 0.05 * Math.sin(t * 2); bolts.forEach(function (b) { b.scale.y = s; }); } };
  });

  // ============================================================ FAMILY: THERMAL / FLUID
  meta('heat', 'Heat Transfer & Thermal', 'Conduction (Fourier), convection (Newton) and radiation (Stefan–Boltzmann) move energy. Specific heat, phase change, expansion and buoyancy follow from temperature.');
  S.register('heat', function (ctx) {
    var g = new T.Group();
    var bar = box(3, 0.5, 0.5, ctx.makeMaterial(0xff7043, { emissive: 0x661a00 })); g.add(bar);
    var flame = sph(0.4, ctx.makeMaterial(0xffd54f, { emissive: 0xff8f00 })); flame.position.set(-1.8, 0, 0); g.add(flame);
    return { group: g, update: function (t) { var h = 0.5 + 0.5 * Math.sin(t); bar.material.color.setHSL(0.08 * h, 0.9, 0.4 + 0.2 * h); flame.scale.setScalar(0.6 + 0.3 * Math.sin(t * 5)); } };
  });

  meta('fluid', 'Fluid Flow & Pressure', 'Reynolds number, continuity, Bernoulli and Pascal govern pipe and open-flow behaviour — laminar vs turbulent, venturi suction, and hydraulic force multiplication.');
  S.register('fluid', function (ctx) {
    var g = new T.Group();
    var pipe = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 4, 24, 1, true), ctx.makeMaterial(0x37474f, { transparent: true, opacity: 0.4, side: T.DoubleSide })); pipe.rotation.z = Math.PI / 2; g.add(pipe);
    var parts = []; for (var i = 0; i < 12; i++) { var p = sph(0.1, ctx.makeMaterial(0x4fc3f7)); g.add(p); parts.push(p); }
    return { group: g, update: function (t) { parts.forEach(function (p, i) { var x = -2 + ((t * 1.5 + i * 0.4) % 4); p.position.set(x, Math.sin(x * 3 + i) * 0.2, Math.cos(x * 3 + i) * 0.2); }); } };
  });

  meta('four-stroke-engine', 'Four-Stroke Engine',
    'Over 720° of crank rotation the piston makes four strokes: intake draws the charge in, compression squeezes it, the spark fires the power stroke that drives the crankshaft, and exhaust pushes the burnt gas out. Valves time each stroke; the flywheel carries the crank through the dead centres.');
  S.register('four-stroke-engine', function (ctx) {
    var g = new T.Group();
    var steel = ctx.makeMaterial(0x607d8b, { metalness: 0.6, roughness: 0.4 });
    var alu = ctx.makeMaterial(0x90a4ae, { metalness: 0.5, roughness: 0.5 });
    var pistonMat = ctx.makeMaterial(0xffb74d, { metalness: 0.4, roughness: 0.4 });
    var gasMat = ctx.makeMaterial(0x4fc3f7, { transparent: true, opacity: 0.22, side: T.DoubleSide });

    var housing = new T.Group();
    var block = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 2.6, 32, 1, true), alu.clone());
    block.material.transparent = true; block.material.opacity = 0.16; block.material.side = T.DoubleSide;
    block.position.y = 0.2; housing.add(block);
    var head = cyl(1.1, 0.4, steel); head.position.y = 1.7; housing.add(head);
    var gas = cyl(0.85, 1, gasMat); g.add(gas);
    var pistonAssy = new T.Group();
    var piston = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.5, 32), pistonMat); pistonAssy.add(piston);
    var pin = cyl(0.1, 1.1, steel); pin.rotation.z = Math.PI / 2; pistonAssy.add(pin); g.add(pistonAssy);

    var crankCenter = v2(0, -1.9, 0);
    var crank = new T.Group(); crank.position.copy(crankCenter);
    var web = cyl(0.5, 0.3, steel); web.rotation.x = Math.PI / 2; crank.add(web);
    var cweight = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.25, 24, 1, false, 0, Math.PI), steel);
    cweight.rotation.x = Math.PI / 2; cweight.position.y = -0.25; crank.add(cweight);
    var crankPinMesh = cyl(0.18, 0.5, ctx.makeMaterial(0xff7043)); crankPinMesh.rotation.x = Math.PI / 2;
    crankPinMesh.position.set(0, 0.7, 0); crank.add(crankPinMesh);
    g.add(crank);

    var fly = new T.Mesh(new T.TorusGeometry(0.9, 0.18, 16, 40), steel); fly.position.copy(crankCenter); g.add(fly);

    var rod = cyl(0.12, 1, ctx.makeMaterial(0xb0bec5)); g.add(rod);

    function valve(x, color) {
      var v = new T.Group();
      var stem = cyl(0.08, 0.9, steel); stem.position.y = 0.45;
      var hv = cyl(0.28, 0.12, ctx.makeMaterial(color)); hv.position.y = 0.0;
      v.add(stem); v.add(hv); v.position.set(x, 1.7, 0); return v;
    }
    var intake = valve(-0.35, 0x4caf50), exhaust = valve(0.35, 0xef5350); g.add(intake, exhaust);
    var portIn = cyl(0.12, 0.8, alu); portIn.rotation.z = Math.PI / 2; portIn.position.set(-0.9, 1.9, 0); housing.add(portIn);
    var portEx = cyl(0.12, 0.8, alu); portEx.rotation.z = Math.PI / 2; portEx.position.set(0.9, 1.9, 0); housing.add(portEx);
    g.add(housing);

    var spark = sph(0.12, ctx.makeMaterial(0xffeb3b, { emissive: 0xffeb3b })); spark.position.set(0, 1.5, 0); g.add(spark);

    var r = 0.7, Lr = 2.2;
    return {
      group: g,
      components: [
        { name: 'Engine Block & Head', desc: 'The cylinder barrel and head form the combustion chamber that guides the piston and seals the charge.', object: housing },
        { name: 'Piston', desc: 'A reciprocating part that compresses the charge and is driven down by combustion pressure to deliver power.', object: pistonAssy },
        { name: 'Connecting Rod', desc: 'Links the piston pin to the crank pin, converting the piston’s reciprocation into crank rotation.', object: rod },
        { name: 'Crankshaft', desc: 'Spins with the flywheel; its offset pin turns the connecting-rod motion into rotary output torque.', object: crank },
        { name: 'Flywheel', desc: 'Stores rotational inertia to carry the crank smoothly through the non-powered strokes and dead centres.', object: fly },
        { name: 'Intake Valve', desc: 'Opens during the intake stroke to admit the fresh air–fuel charge into the cylinder.', object: intake },
        { name: 'Exhaust Valve', desc: 'Opens during the exhaust stroke to let the burnt gases escape the cylinder.', object: exhaust },
        { name: 'Spark Plug', desc: 'Fires at the end of compression to ignite the charge and start the power stroke.', object: spark }
      ],
      update: function (t) {
        var phase = (t * 0.15) % 1;
        var theta = phase * Math.PI * 4;
        var cp = v2(crankCenter.x + r * Math.sin(theta), crankCenter.y + r * Math.cos(theta), 0);
        var pistonPinY = crankCenter.y + r * Math.cos(theta) +
          Math.sqrt(Lr * Lr - (r * Math.sin(theta)) * (r * Math.sin(theta)));
        var pTop = pistonPinY + 0.25;
        piston.position.y = pTop;
        pin.position.y = pistonPinY;
        var gasBottom = pTop + 0.25, gasTop = 1.5, gh = Math.max(0.05, gasTop - gasBottom);
        gas.position.y = (gasTop + gasBottom) / 2; gas.scale.y = gh;
        placeLink(rod, cp, v2(0, pistonPinY, 0));
        crank.rotation.z = -theta;
        fly.rotation.z = -theta;
        var intakeOpen = phase < 0.25, exhaustOpen = phase > 0.75;
        intake.position.y = 1.7 - (intakeOpen ? 0.35 : 0);
        exhaust.position.y = 1.7 - (exhaustOpen ? 0.35 : 0);
        var sparkOn = (phase > 0.48 && phase < 0.56);
        spark.visible = sparkOn;
      }
    };
  });


  meta('piston-gas', 'Gas Laws & Cycles', 'PV = nRT. Boyle, Charles and ideal-gas behaviour, plus engine and power cycles (Otto, Diesel, Rankine, refrigeration) trace P–V diagrams and efficiency.');
  S.register('piston-gas', function (ctx) {
    var g = new T.Group();
    var cyl_ = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 2.4, 28, 1, true), ctx.makeMaterial(0x37474f, { transparent: true, opacity: 0.4, side: T.DoubleSide })); cyl_.position.y = 0.2; g.add(cyl_);
    var piston = cyl(0.95, 0.3, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); g.add(piston);
    var gas = sph(0.8, ctx.makeMaterial(0x4fc3f7, { transparent: true, opacity: 0.3 })); g.add(gas);
    return { group: g, update: function (t) { var y = 0.9 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2)); piston.position.y = y; gas.position.y = -0.8; gas.scale.set(1, (y + 0.8) / 1.7, 1); } };
  });

  meta('turbine', 'Hydraulic Turbine', 'Pelton, Francis and Kaplan turbines extract energy from flowing water via impulse or reaction blades, characterised by unit quantities and specific speed.');
  S.register('turbine', function (ctx) {
    var g = new T.Group(); g.position.y = 1.4;
    var hub = cyl(0.4, 0.5, ctx.makeMaterial(0x546e7a)); hub.rotation.x = Math.PI / 2; g.add(hub);
    var blades = []; for (var i = 0; i < 8; i++) { var a = (i / 8) * Math.PI * 2; var bl = box(0.2, 1.0, 0.5, ctx.makeMaterial(0x4fc3f7, { metalness: 0.5 })); bl.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7); bl.rotation.y = -a; g.add(bl); blades.push(bl); }
    return { group: g, update: function (t) { g.rotation.z = t * 2.2; } };
  });

  meta('heat-exchanger', 'Heat Exchanger', 'Shell-and-tube or plate exchangers transfer heat between streams. LMTD and NTU-effectiveness methods size them for parallel or counter flow.');
  S.register('heat-exchanger', function (ctx) {
    var g = new T.Group();
    var shell = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 4, 28, 1, true), ctx.makeMaterial(0x37474f, { transparent: true, opacity: 0.4, side: T.DoubleSide })); shell.rotation.z = Math.PI / 2; g.add(shell);
    var tubes = []; for (var i = 0; i < 5; i++) { var x = -0.4 + i * 0.2; var tu = cyl(0.12, 4, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); tu.rotation.z = Math.PI / 2; tu.position.y = x; g.add(tu); tubes.push(tu); }
    return { group: g, update: function (t) { tubes.forEach(function (tu, i) { tu.material.color.setHSL((0.1 + 0.1 * Math.sin(t + i)) % 1, 0.8, 0.5); }); } };
  });

  // ============================================================ FAMILY: ELECTRICAL
  meta('circuit', 'DC & AC Circuits', 'Ohm’s law, Kirchhoff’s rules, RC/RLC, bridges and dividers describe voltage, current and power in resistive, capacitive and inductive networks.');
  S.register('circuit', function (ctx) {
    var g = new T.Group();
    var bat = box(0.6, 1.0, 0.6, ctx.makeMaterial(0xef5350, { metalness: 0.4 })); bat.position.set(-2, 0, 0); g.add(bat);
    var res = box(1.0, 0.3, 0.3, ctx.makeMaterial(0x90a4ae)); res.position.set(0, 0.8, 0); g.add(res);
    var lamp = sph(0.4, ctx.makeMaterial(0xffd54f, { emissive: 0x665500 })); lamp.position.set(2, 0, 0); g.add(lamp);
    function wire(a, b) { var w = cyl(0.04, 1, ctx.makeMaterial(0xb0bec5)); g.add(w); return w; }
    var w1 = wire(), w2 = wire(), w3 = wire(), w4 = wire();
    return { group: g, update: function (t) { var on = 0.5 + 0.5 * Math.sin(t * 3); lamp.material.emissive.setRGB(on * 0.4, on * 0.3, 0); placeLink(w1, v2(-2, 0.5, 0), v2(0, 0.95, 0)); placeLink(w2, v2(0, 0.65, 0), v2(2, 0, 0)); placeLink(w3, v2(2, -0.4, 0), v2(-2, -0.5, 0)); placeLink(w4, v2(-2, -0.5, 0), v2(-2, -0.5, 0)); } };
  });

  meta('transformer', 'Transformer', 'Two coupled coils step voltage up or down by the turns ratio, with losses and efficiency. The basis of power distribution.');
  S.register('transformer', function (ctx) {
    var g = new T.Group();
    var core = box(0.5, 2.2, 1.2, ctx.makeMaterial(0x546e7a, { metalness: 0.6 })); g.add(core);
    function coil(x, c) { var grp = new T.Group(); for (var i = 0; i < 6; i++) { var r = cyl(0.5, 0.12, ctx.makeMaterial(c)); r.rotation.z = Math.PI / 2; r.position.y = -0.9 + i * 0.36; grp.add(r); } grp.position.x = x; return grp; }
    var c1 = coil(-0.4, 0xef5350), c2 = coil(0.4, 0x4fc3f7); g.add(c1, c2);
    return { group: g, update: function (t) { c1.rotation.x = t * 2; c2.rotation.x = -t * 2; } };
  });

  meta('motor-gen', 'Motor, Generator & Semiconductors', 'A current in a magnetic field produces torque (motor); relative motion induces EMF (generator, Faraday). BJTs switch and amplify with depletion regions.');
  S.register('motor-gen', function (ctx) {
    var g = new T.Group(); g.position.y = 1.2;
    var stator = new T.Mesh(new T.TorusGeometry(1.2, 0.3, 12, 32), ctx.makeMaterial(0x546e7a, { metalness: 0.6 })); g.add(stator);
    var rotor = cyl(0.8, 0.6, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); rotor.rotation.x = Math.PI / 2; g.add(rotor);
    for (var i = 0; i < 4; i++) { var a = (i / 4) * Math.PI * 2; var w = box(0.15, 0.7, 0.4, ctx.makeMaterial(0x4fc3f7)); w.position.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); w.rotation.y = -a; rotor.add(w); }
    return { group: g, update: function (t) { rotor.rotation.z = t * 3; } };
  });

  meta('logic-gates', 'Logic Gates & Karnaugh Maps', 'AND/OR/NOT/XOR combine Boolean inputs into outputs; K-maps simplify sum-of-products expressions across 2–5 variables.');
  S.register('logic-gates', function (ctx) {
    var g = new T.Group();
    var gate = box(1.2, 0.8, 0.4, ctx.makeMaterial(0x546e7a, { metalness: 0.4 })); g.add(gate);
    var led = sph(0.25, ctx.makeMaterial(0x66bb6a, { emissive: 0x114411 })); led.position.set(1.0, 0, 0); g.add(led);
    var inA = cyl(0.06, 0.6, ctx.makeMaterial(0xef5350)); inA.rotation.z = Math.PI / 2; inA.position.set(-1.0, 0.2, 0); g.add(inA);
    var inB = cyl(0.06, 0.6, ctx.makeMaterial(0x4fc3f7)); inB.rotation.z = Math.PI / 2; inB.position.set(-1.0, -0.2, 0); g.add(inB);
    return { group: g, update: function (t) { var on = (Math.sin(t * 2) > 0) && (Math.cos(t * 1.3) > 0); led.material.emissive.setRGB(on ? 0.2 : 0, on ? 0.5 : 0, on ? 0.1 : 0); } };
  });

  // ============================================================ FAMILY: OPTICS / MEASURE / MACHINING
  meta('optics', 'Ray Optics & Refraction', 'Ray tracing through mirrors and lenses forms real/virtual images; Snell’s law bends rays at interfaces, giving critical angle and total internal reflection.');
  S.register('optics', function (ctx) {
    var g = new T.Group();
    var lens = new T.Mesh(new T.SphereGeometry(0.8, 24, 16), ctx.makeMaterial(0x4fc3f7, { transparent: true, opacity: 0.4 })); lens.scale.z = 0.3; g.add(lens);
    function ray(col) { var r = cyl(0.03, 1, ctx.makeMaterial(col)); g.add(r); return r; }
    var r1 = ray(0xffd54f), r2 = ray(0x66bb6a);
    return { group: g, update: function (t) { var a = 0.3 + 0.2 * Math.sin(t); placeLink(r1, v2(-2, a, 0), v2(0, 0, 0)); placeLink(r2, v2(0, 0, 0), v2(2, -a * 0.6, 0)); } };
  });

  meta('measuring', 'Measuring Instruments', 'Vernier calipers, micrometers, rulers, gauges and protractors read dimensions and angles to fine least counts through vernier coincidence.');
  S.register('measuring', function (ctx) {
    var g = new T.Group(); g.position.y = 0.6;
    var beam = box(3.2, 0.25, 0.5, ctx.makeMaterial(0x90a4ae, { metalness: 0.4 })); g.add(beam);
    var jaw = box(0.4, 0.8, 0.5, ctx.makeMaterial(0x546e7a)); jaw.position.set(-1.3, 0.4, 0); g.add(jaw);
    var slide = box(0.4, 0.8, 0.5, ctx.makeMaterial(0xffb74d)); g.add(slide);
    var obj = box(0.6, 0.6, 0.4, ctx.makeMaterial(0x8d6e63)); obj.position.set(-0.9, 0.4, 0); g.add(obj);
    return { group: g, update: function (t) { var x = -0.6 + 0.3 * (0.5 + 0.5 * Math.sin(t)); slide.position.set(x, 0.4, 0); } };
  });

  meta('machining', 'Lathe, Mill, Drill & CNC', 'A rotating workpiece meets a cutting tool to turn, face, drill or mill; CNC interprets G-code toolpaths. Speed, feed and MRR set the cut.');
  S.register('machining', function (ctx) {
    var g = new T.Group(); g.position.y = 1.2;
    var work = cyl(0.5, 2.4, ctx.makeMaterial(0x90a4ae, { metalness: 0.5 })); work.rotation.z = Math.PI / 2; g.add(work);
    var tool = box(0.2, 1.0, 0.2, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); tool.position.set(0, 0.9, 0); g.add(tool);
    return { group: g, update: function (t) { work.rotation.x = t * 4; tool.position.z = Math.sin(t * 2) * 0.6; } };
  });

  meta('hyd-circuit', 'Hydraulic & Pneumatic Circuits', 'Pumps, DCVs, cylinders and FRL units route pressurised fluid or air to actuate linear/rotary motion under ISO 1219 notation.');
  S.register('hyd-circuit', function (ctx) {
    var g = new T.Group();
    var pump = cyl(0.5, 0.6, ctx.makeMaterial(0x546e7a, { metalness: 0.6 })); pump.position.set(-2, 0, 0); g.add(pump);
    var cyl_ = cyl(0.4, 2.2, ctx.makeMaterial(0x37474f, { transparent: true, opacity: 0.5 })); cyl_.rotation.z = Math.PI / 2; cyl_.position.set(2, 0, 0); g.add(cyl_);
    var rod = cyl(0.18, 1.2, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); rod.rotation.z = Math.PI / 2; g.add(rod);
    return { group: g, update: function (t) { var x = -0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.5)); rod.position.set(1.2 + x, 0, 0); } };
  });

  meta('bearing', 'Bearings & Life', 'Rolling elements separate races to cut friction; L10 life, dynamic rating and equivalent load predict service life for ball and roller bearings.');
  S.register('bearing', function (ctx) {
    var g = new T.Group(); g.position.y = 1.2;
    var outer = new T.Mesh(new T.TorusGeometry(1.1, 0.2, 12, 32), ctx.makeMaterial(0x546e7a, { metalness: 0.7 })); g.add(outer);
    var inner = new T.Mesh(new T.TorusGeometry(0.6, 0.18, 12, 32), ctx.makeMaterial(0x90a4ae, { metalness: 0.7 })); g.add(inner);
    var balls = []; for (var i = 0; i < 8; i++) { var a = (i / 8) * Math.PI * 2; var b = sph(0.18, ctx.makeMaterial(0xffb74d, { metalness: 0.5 })); b.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85); g.add(b); balls.push(b); }
    return { group: g, update: function (t) { balls.forEach(function (b, i) { var a = (i / 8) * Math.PI * 2 + t; b.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85); }); } };
  });

  // ============================================================ FAMILY: SCIENCE / MATH
  meta('atom', 'Atoms & Chemical Bonds', 'Protons and neutrons form a nucleus orbited by electrons (Bohr model). Ionic and covalent bonds share or transfer electrons between atoms.');
  S.register('atom', function (ctx) {
    var g = new T.Group(); g.position.y = 1.4;
    var nuc = sph(0.4, ctx.makeMaterial(0xef5350, { emissive: 0x441100 })); g.add(nuc);
    var els = []; for (var i = 0; i < 3; i++) { var e = sph(0.12, ctx.makeMaterial(0x4fc3f7)); g.add(e); els.push(e); }
    var orbit = new T.Mesh(new T.TorusGeometry(1.0, 0.02, 8, 40), ctx.makeMaterial(0x90a4ae)); g.add(orbit);
    return { group: g, update: function (t) { els.forEach(function (e, i) { var a = t * (1 + i * 0.4) + i * 2; e.position.set(Math.cos(a) * 1.0, Math.sin(a) * 0.4, Math.sin(a) * 1.0); }); orbit.rotation.x = t * 0.5; } };
  });

  meta('chemistry', 'Titration & Equations', 'A burette delivers titrant to an analyte; the equivalence point shows on a pH curve. Balancing equations conserves atoms across reactants and products.');
  S.register('chemistry', function (ctx) {
    var g = new T.Group();
    var flask = new T.Mesh(new T.CylinderGeometry(0.5, 0.3, 1.2, 20), ctx.makeMaterial(0x4fc3f7, { transparent: true, opacity: 0.5 })); flask.position.y = -0.4; g.add(flask);
    var burette = cyl(0.12, 1.6, ctx.makeMaterial(0x90a4ae)); burette.position.set(0, 1.4, 0); g.add(burette);
    var drop = sph(0.1, ctx.makeMaterial(0x66bb6a)); g.add(drop);
    return { group: g, update: function (t) { var y = 0.5 + ((t * 1.5) % 2); drop.position.set(0, y, 0); if (y > 1.8) drop.position.y = -0.2; flask.material.color.setHSL(0.3 + 0.1 * Math.sin(t), 0.7, 0.5); } };
  });

  meta('math', 'Graphs, Calculus & Matrices', 'Functions plot with derivatives and integrals; calculus animates tangents and Riemann sums; matrices multiply via row–column dot products.');
  S.register('math', function (ctx) {
    var g = new T.Group();
    var grid = new T.GridHelper(4, 8, 0x335577, 0x223355); grid.rotation.x = Math.PI / 2; grid.position.z = -0.5; g.add(grid);
    var curve = new T.Mesh(new T.TorusGeometry(1.0, 0.05, 8, 40, Math.PI), ctx.makeMaterial(0x4fc3f7)); g.add(curve);
    var pt = sph(0.12, ctx.makeMaterial(0xffd54f)); g.add(pt);
    return { group: g, update: function (t) { var a = t * 0.8; pt.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0); curve.rotation.z = t * 0.3; } };
  });

  meta('thermocouple', 'Thermocouple & Seebeck Effect', 'Two dissimilar metals joined at a hot and cold junction generate a thermo-EMF (Seebeck effect) used to measure temperature.');
  S.register('thermocouple', function (ctx) {
    var g = new T.Group();
    var m1 = box(2.0, 0.2, 0.3, ctx.makeMaterial(0xef5350, { metalness: 0.6 })); m1.position.set(-1, 0.3, 0); g.add(m1);
    var m2 = box(2.0, 0.2, 0.3, ctx.makeMaterial(0x4fc3f7, { metalness: 0.6 })); m2.position.set(1, -0.3, 0); g.add(m2);
    var j = sph(0.2, ctx.makeMaterial(0xffd54f, { emissive: 0x442200 })); j.position.set(0, 0, 0); g.add(j);
    return { group: g, update: function (t) { j.material.emissive.setRGB(0.3 * (0.5 + 0.5 * Math.sin(t)), 0.15 * (0.5 + 0.5 * Math.sin(t)), 0); } };
  });

  meta('psychrometric', 'Psychrometric Chart', 'The ASHRAE chart relates dry-bulb, wet-bulb, RH, humidity ratio, enthalpy and specific volume for HVAC process analysis.');
  S.register('psychrometric', function (ctx) {
    var g = new T.Group();
    var chart = new T.Mesh(new T.PlaneGeometry(3, 2), ctx.makeMaterial(0xfafafa, { roughness: 1 })); g.add(chart);
    var cur = new T.Mesh(new T.TorusGeometry(0.4, 0.04, 8, 24), ctx.makeMaterial(0xef5350)); cur.position.z = 0.05; g.add(cur);
    return { group: g, update: function (t) { cur.position.x = Math.sin(t) * 1.0; cur.position.y = Math.cos(t * 0.7) * 0.6; } };
  });

  meta('part-symbol', 'Symbols, Threads & Welds', 'ISO threads, AWS weld symbols, GD&T and tolerance/fit callouts encode how parts are made, located and inspected on drawings.');
  S.register('part-symbol', function (ctx) {
    var g = new T.Group();
    var part = cyl(0.6, 2.0, ctx.makeMaterial(0x90a4ae, { metalness: 0.5 })); part.rotation.z = Math.PI / 2; g.add(part);
    for (var i = 0; i < 10; i++) { var th = box(0.1, 0.12, 2.2, ctx.makeMaterial(0x37474f)); th.position.set(-0.9 + i * 0.2, 0.62, 0); g.add(th); }
    return { group: g, update: function (t) { part.rotation.x = t * 1.5; } };
  });

  // ============================================================ FALLBACK
  S.register('__default__', function (ctx) {
    var g = new T.Group(); var cube = box(1.4, 1.4, 1.4, ctx.makeMaterial(0x4fc3f7, { metalness: 0.4, roughness: 0.4 })); g.add(cube);
    return { group: g, update: function (t) { cube.rotation.y = t; cube.rotation.x = t * 0.6; } };
  });

  // ============================================================ SLUG -> BUILDER MAP
  var MAP = {
    'ac-generator': 'motor-gen', 'area-calculator': 'math', 'balance-chemical-equations': 'chemistry',
    'beam-bending': 'beam-bending', 'bearing-life': 'bearing', 'bearing-selection': 'bearing',
    'belt-drive': 'belt-drive', 'bend-radius': 'joint', 'bernoullis-principle': 'fluid',
    'bevel-protractor': 'measuring', 'bjt-transistor': 'motor-gen', 'bolted-joint': 'joint',
    'boyles-law': 'piston-gas', 'build-your-atom': 'atom', 'buoyancy': 'heat',
    'calculus-visualizer': 'math', 'cam-follower': 'cam-follower', 'capacitor-bank': 'circuit',
    'centrifugal-governor': 'governor', 'centrifugal-pump': 'centrifugal-pump', 'charles-law': 'piston-gas',
    'chemical-bonds': 'atom', 'chemical-mixing': 'atom', 'cnc-gcode': 'machining',
    'collision-momentum': 'collision', 'column-buckling': 'stress-analysis', 'continuity-equation': 'fluid',
    'crack-propagation': 'stress-analysis', 'dc-motor': 'motor-gen', 'dial-gauge': 'measuring',
    'diode-rectifier': 'circuit', 'drilling-machine': 'machining', 'electrical-wiring': 'circuit',
    'electro-pneumatic-circuit': 'hyd-circuit', 'escape-velocity': 'motion-free', 'faradays-law': 'motor-gen',
    'fatigue-life': 'impact', 'fatigue-testing': 'impact', 'fluid-flow': 'fluid',
    'flywheel': 'flywheel', 'flywheel-energy': 'flywheel', 'four-bar-linkage': 'four-bar-linkage',
    'four-stroke-engine': 'four-stroke-engine', 'free-body-diagram': 'force-diagram', 'free-fall': 'motion-free',
    'friction': 'force-diagram', 'gdt-trainer': 'part-symbol', 'gear-strength': 'gear-trains',
    'gear-trains': 'gear-trains', 'geneva-mechanism': 'slider-crank', 'governor': 'governor',
    'gyroscope': 'gyroscope', 'hardness-testing': 'hardness', 'heat-exchanger': 'heat-exchanger',
    'heat-transfer': 'heat', 'height-gauge': 'measuring', 'hookes-law': 'spring-system',
    'hydraulic-circuit': 'hyd-circuit', 'hydraulic-cylinder': 'hyd-circuit', 'hydraulic-turbine': 'turbine',
    'ideal-gas-law': 'piston-gas', 'impact-testing': 'impact', 'karnaugh-map': 'logic-gates',
    'kirchhoff-solver': 'circuit', 'lathe-machine': 'machining', 'litmus-test': 'chemistry',
    'logic-gates': 'logic-gates', 'machining-calculator': 'machining', 'math-graphing': 'math',
    'matrix-multiplication': 'math', 'milling-machine': 'machining', 'mohrs-circle': 'stress-analysis',
    'moment-of-inertia': 'stress-analysis', 'moment-of-inertia-angle': 'stress-analysis',
    'moment-of-inertia-channel': 'stress-analysis', 'moment-of-inertia-circle': 'stress-analysis',
    'moment-of-inertia-hollow-circle': 'stress-analysis', 'moment-of-inertia-hollow-rect': 'stress-analysis',
    'moment-of-inertia-i-beam': 'stress-analysis', 'moment-of-inertia-rectangle': 'stress-analysis',
    'moment-of-inertia-t-section': 'stress-analysis', 'morse-test': 'piston-gas', 'newtons-laws': 'force-diagram',
    'ohms-law': 'circuit', 'pascals-law': 'fluid', 'phase-change': 'heat',
    'plc-ladder-logic': 'logic-gates', 'pneumatic-circuit': 'hyd-circuit', 'power-screw': 'shaft-torsion',
    'pressure-gauge': 'measuring', 'pressure-vessel': 'stress-analysis', 'projectile-motion': 'projectile-motion',
    'protractor': 'measuring', 'psychrometric-chart': 'psychrometric', 'rankine-cycle': 'piston-gas',
    'ray-optics': 'optics', 'rc-circuit': 'circuit', 'refraction': 'optics',
    'refrigeration-cycle': 'piston-gas', 'resistor-color-code': 'circuit', 'reynolds-number': 'fluid',
    'rivet-joint-designer': 'joint', 'riveted-joints': 'joint', 'rlc-circuit': 'circuit',
    'scotch-yoke': 'slider-crank', 'screw-gauge': 'screw-gauge', 'shaft-torsion': 'shaft-torsion',
    'shm': 'spring-system', 'simple-machines': 'simple-machines', 'simple-pendulum': 'simple-pendulum',
    'slider-crank': 'slider-crank', 'specific-heat-capacity': 'heat', 'spring-design': 'spring-system',
    'star-delta': 'circuit', 'steel-ruler': 'measuring', 'stefan-boltzmann': 'heat',
    'stress-concentration': 'stress-analysis', 'stress-strain': 'stress-analysis', 'thermal-conductivity': 'heat',
    'thermal-expansion': 'heat', 'thermocouple': 'thermocouple', 'thermodynamics': 'piston-gas',
    'thread-nomenclature': 'part-symbol', 'titration': 'chemistry', 'tolerance-fits': 'part-symbol',
    'torque-rotation': 'force-diagram', 'torsion-testing': 'shaft-torsion', 'transformer': 'transformer',
    'truss-analysis': 'stress-analysis', 'two-stroke-engine': 'piston-gas', 'utm-testing': 'utm-testing',
    'vernier-caliper': 'measuring', 'vibrations': 'spring-system', 'viscosity-experiment': 'fluid',
    'weld-strength': 'joint', 'welding-symbols': 'part-symbol', 'wheatstone-bridge': 'circuit',
    'wind-tunnel': 'fluid'
  };
  S.mapSlug = function (slug) { return MAP[slug] || '__default__'; };

})(window);
