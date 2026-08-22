(function(){
  "use strict";
  var S = window.DIFF_STATE = {
    carrierRpm: 60, maneuver: "straight", turnBias: 60,
    spiderCount: 2, axleTeeth: 14, spiderTeeth: 10,
    left: 60, right: 60, spider: 0, t: 0,
    leftAng: 0, rightAng: 0, carrierAng: 0, spiderAng: 0
  };

  function computeKinematics(){
    var C = S.carrierRpm, L = C, R = C, sp = 0;
    var ratio = S.axleTeeth / S.spiderTeeth;
    if(S.maneuver === "straight"){ L = R = C; sp = 0; }
    else if(S.maneuver === "left"){
      var outerL = C * 2 * (S.turnBias/100);
      L = outerL; R = 2*C - outerL; sp = (outerL - C) * ratio;
    } else if(S.maneuver === "right"){
      var outerR = C * 2 * (S.turnBias/100);
      R = outerR; L = 2*C - outerR; sp = (outerR - C) * ratio;
    } else if(S.maneuver === "slip"){
      L = 2*C; R = 0; sp = (2*C - C) * ratio;
    } else if(S.maneuver === "jacked"){
      R = 2*C; L = 0; sp = (2*C - C) * ratio;
    }
    S.left = L; S.right = R; S.spider = sp;
  }

  function $(id){ return document.getElementById(id); }

  function updateReadouts(){
    $("o-left").textContent = Math.round(S.left);
    $("o-right").textContent = Math.round(S.right);
    $("o-spider").textContent = (S.spider>=0?"+":"") + S.spider.toFixed(1);
    $("o-ratio").textContent = "T_axle/T_spider = " + (S.axleTeeth/S.spiderTeeth).toFixed(2) +
      "  |  L + R = " + Math.round(S.left + S.right) + " = 2x" + Math.round(S.carrierRpm);
    if($("d-carrier")){
      $("d-carrier").textContent = Math.round(S.carrierRpm);
      $("d-left").textContent = Math.round(S.left);
      $("d-right").textContent = Math.round(S.right);
      $("d-spider").textContent = (S.spider>=0?"+":"") + S.spider.toFixed(1);
    }
  }

  var sections = ["simulate","3d-model","explore","practice","quiz","reference"];
  function showSection(val){
    sections.forEach(function(s){
      var el = $(s + "-wrapper");
      if(el) el.classList.toggle("hidden", s !== val);
    });
    var tabs = document.querySelectorAll("#mode-tabs .pill");
    tabs.forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-value") === val); });
    if(val === "3d-model" && window.DIFF3D){ window.DIFF3D.activate(); }
    else if(window.DIFF3D){ window.DIFF3D.deactivate(); }
  }
  (function(){
    var tabs = document.querySelectorAll("#mode-tabs .pill");
    tabs.forEach(function(b){
      b.addEventListener("click", function(){ showSection(b.getAttribute("data-value")); });
    });
  })();

  function setManeuver(val, srcGroup){
    S.maneuver = val;
    ["grp-maneuver","grp3-maneuver"].forEach(function(g){
      var btns = document.querySelectorAll("#" + g + " .btn");
      btns.forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-m") === val); });
    });
    computeKinematics(); updateReadouts();
    if(window.DIFF3D) window.DIFF3D.setMode(val);
  }
  function setSpider(val){
    S.spiderCount = val;
    ["grp-spider","grp3-spider"].forEach(function(g){
      var btns = document.querySelectorAll("#" + g + " .btn");
      btns.forEach(function(b){ b.classList.toggle("active", parseInt(b.getAttribute("data-sp"),10) === val); });
    });
    if(window.DIFF3D) window.DIFF3D.setSpider(val);
  }

  function bindSlider(id, id3, key, vid, vid3){
    function apply(v){
      S[key] = v;
      if(vid) $(vid).textContent = v;
      if(vid3) $(vid3).textContent = v;
      computeKinematics(); updateReadouts();
      if(key === "axleTeeth" || key === "spiderTeeth"){ if(window.DIFF3D) window.DIFF3D.setTeeth(S.axleTeeth, S.spiderTeeth); }
    }
    var a = $(id); if(a){ a.addEventListener("input", function(){ apply(parseFloat(a.value)); }); }
    var b = $(id3); if(b){ b.addEventListener("input", function(){ apply(parseFloat(b.value)); }); }
  }

  (function wire(){
    bindSlider("s-rpm","s3-rpm","carrierRpm","v-rpm","v3-rpm");
    bindSlider("s-bias","s3-bias","turnBias","v-bias","v3-bias");
    bindSlider("s-axle","s3-axle","axleTeeth","v-axle","v3-axle");
    bindSlider("s-spidert","s3-spidert","spiderTeeth","v-spidert","v3-spidert");
    ["grp-maneuver","grp3-maneuver"].forEach(function(g){
      var btns = document.querySelectorAll("#" + g + " .btn");
      btns.forEach(function(b){ b.addEventListener("click", function(){ setManeuver(b.getAttribute("data-m"), g); }); });
    });
    ["grp-spider","grp3-spider"].forEach(function(g){
      var btns = document.querySelectorAll("#" + g + " .btn");
      btns.forEach(function(b){ b.addEventListener("click", function(){ setSpider(parseInt(b.getAttribute("data-sp"),10)); }); });
    });
  })();

  window.checkQuiz = function(el, n, correct){
    var opts = el.parentNode.querySelectorAll(".quiz-opt");
    opts.forEach(function(o){ o.classList.remove("correct","wrong"); });
    el.classList.add(correct ? "correct" : "wrong");
    if(!correct){
      opts.forEach(function(o){ if(o.getAttribute("data-correct")!==null) o.classList.add("correct"); });
    }
    $("fb-"+n).textContent = correct ? "Correct!" : "Not quite — see the highlighted answer.";
  };

  var canvas = $("diff-canvas");
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;

  function speedColor(rpm){
    var f = Math.max(0, Math.min(1, Math.abs(rpm)/300));
    var r = Math.round(41 + (255-41)*f);
    var g = Math.round(182 + (214-182)*f);
    var b = Math.round(246 + (132-246)*f);
    return "rgb("+r+","+g+","+b+")";
  }
  function drawWheel(cx, cy, r, ang, rpm){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = speedColor(rpm); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = "#0a0d14"; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = speedColor(rpm); ctx.lineWidth = 3;
    ctx.rotate(ang);
    for(var i=0;i<6;i++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r-7,0); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = "#dde3f0"; ctx.font = "12px monospace"; ctx.textAlign = "center";
    ctx.fillText(Math.round(rpm)+" rpm", cx, cy - r - 8);
  }
  function render2D(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0a0d14"; ctx.fillRect(0,0,W,H);
    var cx = W/2, cy = H/2;
    var Lx = cx - 250, Rx = cx + 250, wr = 55;
    // axle
    ctx.strokeStyle = "#2a3050"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(Lx, cy); ctx.lineTo(Rx, cy); ctx.stroke();
    // carrier housing
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.carrierAng);
    ctx.strokeStyle = "#29b6f6"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0,0,70,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "#7fd1ff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(50,0); ctx.stroke();
    ctx.restore();
    // spider gears (orbiting cross-pin)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.spiderAng);
    var sc = S.spiderCount;
    for(var i=0;i<sc;i++){
      var a = i*(Math.PI*2/sc);
      var px = Math.cos(a)*34, py = Math.sin(a)*34;
      ctx.fillStyle = "#ffd600"; ctx.beginPath(); ctx.arc(px,py,9,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // wheels
    drawWheel(Lx, cy, wr, S.leftAng, S.left);
    drawWheel(Rx, cy, wr, S.rightAng, S.right);
    // carrier label
    ctx.fillStyle = "#6b7a99"; ctx.font = "12px monospace"; ctx.textAlign = "center";
    ctx.fillText("CARRIER " + Math.round(S.carrierRpm) + " rpm", cx, cy - 90);
  }
  var last = 0;
  function loop(ts){
    if(!last) last = ts;
    var dt = Math.min(0.05, (ts - last)/1000); last = ts;
    var k = (Math.PI*2/60); // rpm -> rad/s
    S.leftAng += S.left * k * dt;
    S.rightAng += S.right * k * dt;
    S.carrierAng += S.carrierRpm * k * dt;
    S.spiderAng += S.spider * k * dt;
    render2D();
    requestAnimationFrame(loop);
  }

  $("btn-2d-export").addEventListener("click", function(){
    var a = document.createElement("a");
    a.download = "differential-2d.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  computeKinematics(); updateReadouts();
  requestAnimationFrame(loop);
  showSection("simulate");
})();
