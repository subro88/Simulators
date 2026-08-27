/* ═══════════════════════════════════════════════════════════════════
   Welding Symbol Trainer — app.js  v2
   AWS A2.4 + ISO 2553 dual-standard support
   NHIT VisualLab · https://nhitvisuallab.org
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────
     1. WELD DATA
     ──────────────────────────────────────────────────────────────── */
  var WELDS = [
    { id:'square-groove',   name:'Square Groove',       cat:'groove',     desc:'Two square-edged plates butted together with a small root opening (gap). The weld fuses through the full thickness.',                          apps:'Sheet metal, thin plates up to 6 mm, root passes' },
    { id:'v-groove',        name:'V-Groove',            cat:'groove',     desc:'Both plate edges are bevelled symmetrically to form a V-shaped preparation, allowing full penetration on thicker materials.',                   apps:'Structural steel, pressure vessels, pipe joints (6–20 mm)' },
    { id:'bevel-groove',    name:'Bevel Groove',        cat:'groove',     desc:'Only one plate edge is bevelled while the other remains square. This is essentially half of a V-groove.',                                       apps:'T-joints, corner joints, when one plate is difficult to bevel' },
    { id:'u-groove',        name:'U-Groove',            cat:'groove',     desc:'Both plate edges are machined into a U-shaped (concave) profile, reducing the volume of weld metal required compared to a V-groove.',          apps:'Heavy plate fabrication (>20 mm), pressure vessels, nuclear piping' },
    { id:'j-groove',        name:'J-Groove',            cat:'groove',     desc:'One plate edge is machined into a J-shaped profile while the other remains square — half of a U-groove.',                                      apps:'Thick T-joints, corner joints on heavy plate' },
    { id:'flare-v-groove',  name:'Flare V-Groove',      cat:'groove',     desc:'Two convex (rounded) surfaces placed together, forming a flared V-shaped opening where the weld is deposited.',                                apps:'Round bar to round bar, pipe to pipe, structural tubing' },
    { id:'flare-bevel',     name:'Flare Bevel Groove',  cat:'groove',     desc:'One convex (rounded) surface meets a flat plate, forming a flared half-V opening.',                                                            apps:'Round bar to flat plate, tube to plate connections' },
    { id:'fillet',          name:'Fillet Weld',         cat:'fillet',     desc:'A roughly triangular weld deposited in the internal corner formed by two surfaces at approximately right angles (T-joint, lap joint, or corner joint).', apps:'T-joints, lap joints, corner joints — the most common weld type (approx. 80% of all welds)' },
    { id:'plug',            name:'Plug Weld',           cat:'plug',       desc:'A weld made through a circular hole in one plate to fuse it to a second plate beneath. The hole is completely or partially filled with weld metal.',     apps:'Connecting overlapping plates where edge welding is impractical' },
    { id:'slot',            name:'Slot Weld',           cat:'plug',       desc:'Similar to a plug weld but made through an elongated (slot-shaped) hole rather than a round one.',                                              apps:'Large overlapping plate connections, structural reinforcement' },
    { id:'spot',            name:'Spot Weld',           cat:'resistance', desc:'A resistance weld that fuses overlapping plates at a small circular area without any edge preparation or filler metal.',                        apps:'Sheet metal fabrication, automotive body panels, appliances' },
    { id:'seam',            name:'Seam Weld',           cat:'resistance', desc:'A continuous resistance weld along overlapping plates, produced by rotating wheel electrodes. Creates a gas-tight or liquid-tight joint.',      apps:'Fuel tanks, cans, pipes, pressure-tight sheet metal assemblies' }
  ];

  var CATEGORIES = {
    groove:     'Groove Welds',
    fillet:     'Fillet',
    plug:       'Plug & Slot',
    resistance: 'Spot & Seam'
  };

  var CAT_ORDER = ['groove','fillet','plug','resistance'];

  /* Learn-mode anatomy parts — standard-aware */
  var LEARN_PARTS_AWS = [
    { name:'Reference Line', color:'#4fc3f7',  desc:'The horizontal line that anchors every welding symbol. All information hangs from this line.' },
    { name:'Arrow',          color:'#4fc3f7',  desc:'Points from the reference line to the joint where the weld is to be made.' },
    { name:'Arrow-Side Symbol', color:'#e91e63', desc:'Weld symbol placed BELOW the reference line — indicates the weld on the side the arrow points to.' },
    { name:'Other-Side Symbol', color:'#f48fb1', desc:'Weld symbol placed ABOVE the reference line — indicates the weld on the side opposite the arrow.' },
    { name:'Tail',           color:'#ffb74d',  desc:'A forked end opposite the arrow. Used to specify welding process (e.g., GMAW, SMAW), electrode, or other references. Omitted when not needed.' },
    { name:'Dimensions',     color:'#3ddc84',  desc:'Size (leg/depth) is placed to the LEFT of the symbol. Length is placed to the RIGHT. Pitch (spacing) follows length in parentheses.' },
    { name:'Supplementary Symbols', color:'#a78bfa', desc:'Circle at the reference-line/arrow junction = Weld All Around. Flag at the same junction, flying toward the TAIL = Field Weld (done on site, not in shop).' },
    { name:'Contour & Finish', color:'#f5c842', desc:'A contour symbol above the weld symbol indicates the desired face shape: flat (—), convex (⌢), or concave (⌣). A letter indicates finishing method: G=grind, M=machine, C=chip.' }
  ];

  var LEARN_PARTS_ISO = [
    { name:'Solid Reference Line', color:'#4fc3f7',  desc:'The continuous (solid) line that anchors the symbol. The arrow-side weld symbol is always placed ON this solid line.' },
    { name:'Dashed Reference Line', color:'#81d4fa', desc:'A dashed (identification) line drawn parallel to the solid line. The other-side weld symbol is placed ON this dashed line. Omitted for symmetrical welds.' },
    { name:'Arrow',          color:'#4fc3f7',  desc:'Points from the reference line to the joint where the weld is to be made — same as AWS.' },
    { name:'Arrow-Side Symbol', color:'#e91e63', desc:'Weld symbol placed ON THE SOLID reference line — indicates the weld on the side the arrow points to.' },
    { name:'Other-Side Symbol', color:'#f48fb1', desc:'Weld symbol placed ON THE DASHED reference line — indicates the weld on the side opposite the arrow.' },
    { name:'Tail',           color:'#ffb74d',  desc:'A forked end opposite the arrow. Uses ISO 4063 numeric process codes (e.g., 135 = MAG/GMAW, 111 = SMAW) instead of abbreviations.' },
    { name:'Dimensions',     color:'#3ddc84',  desc:'Fillet: "a" prefix = throat thickness, "z" prefix = leg length (e.g., a5 = 5 mm throat). Size LEFT of symbol, length RIGHT. All in mm.' },
    { name:'Supplementary Symbols', color:'#a78bfa', desc:'Circle = Weld All Around (same as AWS). Triangular site/field weld flag at the reference-line/arrow junction, flying toward the tail — same orientation as AWS.' },
    { name:'Contour & Finish', color:'#f5c842', desc:'Same contour symbols as AWS: flat (—), convex (⌢), concave (⌣). ISO also recognises a "toes blended smoothly" supplementary symbol.' }
  ];

  /* ────────────────────────────────────────────────────────────────
     2. DOM REFS
     ──────────────────────────────────────────────────────────────── */
  var canvas   = document.getElementById('weld-canvas');
  var ctx      = canvas.getContext('2d');
  var W = 900, H = 480;

  /* Panels */
  var elWeldSelector = document.getElementById('weld-selector');
  var elWeldInfo     = document.getElementById('weld-info');
  var elLearnInfo    = document.getElementById('learn-info');
  var elPlacement    = document.getElementById('placement-row');
  var elPracticePanel= document.getElementById('practice-panel');
  var elPracticeBar  = document.getElementById('practice-bar');
  var elQuizPanel    = document.getElementById('quiz-panel');
  var elQuizBar      = document.getElementById('quiz-bar');
  var elQuizResult   = document.getElementById('quiz-result');

  /* ────────────────────────────────────────────────────────────────
     3. STATE
     ──────────────────────────────────────────────────────────────── */
  var mode        = 'explore';
  var standard    = 'aws';   // 'aws' | 'iso'
  var selCat      = 'groove';
  var selWeld     = WELDS[0];
  var placement   = 'arrow';  // 'arrow' | 'other' | 'both'
  var learnPart   = -1;       // highlighted learn part index, -1 = all
  var showDims    = true;     // show size / length annotations on canvas
  var showTail    = true;     // show forked tail on canvas
  var hintDismissed = false;

  /* ─── Per-weld dimensions (auto-populated from WELD_DEFAULTS) ───
     One entry per weld id. Each carries: size, length, pitch, angle,
     process (canonical AWS abbreviation), position (canonical AWS code),
     note, supplementary flags, and a fillet-sizing prefix (ISO only). */
  var weldData = {};

  /* ─── Standard data tables ─── */

  /* WELD_DEFAULTS — sensible starter values per AWS A2.4 / ISO 2553 */
  var WELD_DEFAULTS = {
    'square-groove':  { size: '3',   length: '',   pitch: '', angle: ''    },
    'v-groove':       { size: '12',  length: '',   pitch: '', angle: '60'  },
    'bevel-groove':   { size: '10',  length: '',   pitch: '', angle: '45'  },
    'u-groove':       { size: '12',  length: '',   pitch: '', angle: '20'  },
    'j-groove':       { size: '10',  length: '',   pitch: '', angle: '20'  },
    'flare-v-groove': { size: '',    length: '',   pitch: '', angle: ''    },
    'flare-bevel':    { size: '',    length: '',   pitch: '', angle: ''    },
    'fillet':         { size: '6',   length: '50', pitch: '150', angle: '' },
    'plug':           { size: '16',  length: '6',  pitch: '40',  angle: '' },
    'slot':           { size: '12',  length: '40', pitch: '100', angle: '' },
    'spot':           { size: '6',   length: '',   pitch: '',    angle: '' },
    'seam':           { size: '6',   length: '50', pitch: '150', angle: '' }
  };

  /* PROCESSES — AWS abbreviation + ISO 4063 numeric code */
  var PROCESSES = [
    { aws: '',     iso: '',    name: '(no process)' },
    { aws: 'SMAW', iso: '111', name: 'SMAW / 111 — Shielded metal arc (stick)' },
    { aws: 'GMAW', iso: '135', name: 'GMAW / 135 — MAG (active gas)' },
    { aws: 'GMAW', iso: '131', name: 'GMAW / 131 — MIG (inert gas)' },
    { aws: 'GTAW', iso: '141', name: 'GTAW / 141 — TIG' },
    { aws: 'FCAW', iso: '136', name: 'FCAW / 136 — Flux-cored, gas-shielded' },
    { aws: 'FCAW', iso: '114', name: 'FCAW / 114 — Flux-cored, self-shielded' },
    { aws: 'SAW',  iso: '121', name: 'SAW  / 121 — Submerged arc' },
    { aws: 'PAW',  iso: '15',  name: 'PAW  / 15  — Plasma arc' },
    { aws: 'OFW',  iso: '311', name: 'OFW  / 311 — Oxy-acetylene' },
    { aws: 'RSW',  iso: '21',  name: 'RSW  / 21  — Resistance spot' },
    { aws: 'RSEW', iso: '22',  name: 'RSEW / 22  — Resistance seam' }
  ];

  /* POSITIONS — AWS D1.1 codes + equivalent ISO 6947 codes, by weld cat */
  var POSITIONS = {
    groove: [
      { aws: '',    iso: '',       name: '(no position)' },
      { aws: '1G',  iso: 'PA',     name: '1G / PA — Flat (downhand)' },
      { aws: '2G',  iso: 'PC',     name: '2G / PC — Horizontal' },
      { aws: '3G↑', iso: 'PF',     name: '3G↑ / PF — Vertical up' },
      { aws: '3G↓', iso: 'PG',     name: '3G↓ / PG — Vertical down' },
      { aws: '4G',  iso: 'PE',     name: '4G / PE — Overhead' },
      { aws: '5G',  iso: 'PH', name: '5G / PH — Pipe horizontal fixed (uphill)' },
      { aws: '6G',  iso: 'H-L045', name: '6G / H-L045 — Pipe 45° fixed' }
    ],
    fillet: [
      { aws: '',    iso: '',  name: '(no position)' },
      { aws: '1F',  iso: 'PA', name: '1F / PA — Flat (rotated)' },
      { aws: '2F',  iso: 'PB', name: '2F / PB — Horizontal' },
      { aws: '3F↑', iso: 'PF', name: '3F↑ / PF — Vertical up' },
      { aws: '3F↓', iso: 'PG', name: '3F↓ / PG — Vertical down' },
      { aws: '4F',  iso: 'PD', name: '4F / PD — Overhead' },
      { aws: '5F',  iso: 'PH', name: '5F / PH — Pipe horizontal fixed (uphill)' },
      { aws: '6F',  iso: 'H-L045', name: '6F / H-L045 — Pipe 45° fixed' }
    ],
    plug: [
      { aws: '',    iso: '',  name: '(no position)' },
      { aws: '1F',  iso: 'PA', name: '1F / PA — Flat' },
      { aws: '2F',  iso: 'PB', name: '2F / PB — Horizontal' },
      { aws: '4F',  iso: 'PD', name: '4F / PD — Overhead' }
    ],
    resistance: [
      { aws: '',    iso: '',  name: '(no position)' },
      { aws: 'Flat', iso: 'PA', name: 'Flat / PA' }
    ]
  };

  /* Look up canonical process by AWS abbreviation (handles 131/135/136 etc.) */
  function findProcessByAws(aws, iso) {
    for (var i = 0; i < PROCESSES.length; i++) {
      if (PROCESSES[i].aws === aws && (iso == null || PROCESSES[i].iso === iso)) return PROCESSES[i];
    }
    return null;
  }

  function getWeldData(id) {
    if (!weldData[id]) {
      var def = WELD_DEFAULTS[id] || {};
      weldData[id] = {
        size:    def.size    || '',
        length:  def.length  || '',
        pitch:   def.pitch   || '',
        angle:   def.angle   || '',
        process: '',        /* canonical AWS abbreviation; '' = none */
        processIso: '',     /* canonical ISO 4063 number paired with process */
        position: '',       /* canonical AWS code */
        note: '',           /* free-text */
        allAround: false,
        field: false,
        filletPrefix: 'z'   /* ISO fillet: 'z' = leg (default per industry), 'a' = throat */
      };
    }
    return weldData[id];
  }

  function resetWeldData(id) {
    delete weldData[id];
    return getWeldData(id);
  }

  /* Practice */
  var pScore = 0, pTotal = 0, pCurrent = null, pLocked = false;

  /* Quiz */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizLocked = false;
  var quizAnswers = [];

  /* Helpers */
  function isISO() { return standard === 'iso'; }
  function learnParts() { return isISO() ? LEARN_PARTS_ISO : LEARN_PARTS_AWS; }

  /* ────────────────────────────────────────────────────────────────
     4. DRAWING HELPERS
     ──────────────────────────────────────────────────────────────── */
  function clear() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  }

  function drawText(txt, x, y, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || '600') + ' ' + (opts.size || 13) + 'px ' + (opts.family || "'Segoe UI', system-ui, sans-serif");
    ctx.fillStyle = opts.color || '#dde3f0';
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = opts.baseline || 'middle';
    ctx.fillText(txt, x, y);
  }

  function drawSectionLabel(txt, x, y) {
    drawText(txt, x, y, { size: 11, weight: '700', color: '#6b7a99' });
  }

  /* Draw a dashed line helper */
  function drawDashedLine(x1, y1, x2, y2, color, lineWidth) {
    ctx.save();
    ctx.strokeStyle = color || '#81d4fa';
    ctx.lineWidth = lineWidth || 2;
    ctx.lineCap = 'round';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ────────────────────────────────────────────────────────────────
     5. REFERENCE LINE DIAGRAM — AWS & ISO
     ──────────────────────────────────────────────────────────────── */
  function drawRefLineDiagram(cx, cy, weldId, plcmt, opts) {
    opts = opts || {};
    var rlLen = opts.rlLen || 260;
    var symSize = opts.symSize || 36;
    var rlX1 = cx - rlLen/2;
    var rlX2 = cx + rlLen/2;
    var rlY  = cy;
    var dashGap = 18; // gap between solid and dashed line in ISO

    /* Resistance spot/seam symbols have NO arrow/other-side significance —
       they are centred on the reference line (AWS A2.4; ISO 2553 same). */
    var isRes = (weldId === 'spot' || weldId === 'seam');
    /* ISO 2553: for symmetrical double-sided welds (both sides, identical
       symbol) the dashed identification line is OMITTED. */
    var isoSym = isISO() && plcmt === 'both' && !isRes;

    /* ── Reference line(s) ── */
    /* Solid reference line (always drawn) */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rlX1, rlY);
    ctx.lineTo(rlX2, rlY);
    ctx.stroke();

    /* ISO: draw dashed reference line (below solid by default).
       Omitted for symmetrical both-sides welds and resistance welds. */
    if (isISO() && !opts.noDash && !isoSym && !isRes) {
      var dashY = rlY + dashGap;
      drawDashedLine(rlX1, dashY, rlX2, dashY, '#81d4fa', 2.5);

      /* Small labels for reference lines */
      if (!opts.noLabels) {
        drawText('solid', rlX2 + 24, rlY, { size: 8, color: 'rgba(79,195,247,0.5)', weight: '600' });
        drawText('dashed', rlX2 + 28, dashY, { size: 8, color: 'rgba(129,212,250,0.5)', weight: '600' });
      }
    }

    /* ── Arrow ── */
    /* The arrow attaches at the END of the reference line — this junction
       is where the weld-all-around circle / field flag sit.
       AWS A2.4 §6.4.1: for asymmetric prep (bevel, J, flare-bevel), the
       arrow "breaks" (bends) and points to the member to be prepared. */
    var arrowStartX = rlX1;
    var arrowEndX = rlX1 - 55;
    var arrowEndY = rlY + 100;
    var bentArrow = (weldId === 'bevel-groove' || weldId === 'j-groove' || weldId === 'flare-bevel');
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, rlY);
    if (bentArrow) {
      /* Kink: straight portion from ref line to a bend point, then
         a deflected segment to the arrowhead — indicates "prep this member" */
      var bendX = (arrowStartX + arrowEndX) / 2 + 18;
      var bendY = (rlY + arrowEndY) / 2;
      ctx.lineTo(bendX, bendY);
      ctx.lineTo(arrowEndX, arrowEndY);
    } else {
      ctx.lineTo(arrowEndX, arrowEndY);
    }
    ctx.stroke();
    /* arrowhead — use last segment angle */
    var headFromX = bentArrow ? ((arrowStartX + arrowEndX) / 2 + 18) : arrowStartX;
    var headFromY = bentArrow ? ((rlY + arrowEndY) / 2) : rlY;
    var angle = Math.atan2(arrowEndY - headFromY, arrowEndX - headFromX);
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - 12*Math.cos(angle - 0.4), arrowEndY - 12*Math.sin(angle - 0.4));
    ctx.lineTo(arrowEndX - 12*Math.cos(angle + 0.4), arrowEndY - 12*Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    /* Read per-weld user data (or defaults) */
    var d = getWeldData(weldId);

    /* Compose the tail content per standard:
       AWS  → "PROCESS / POSITION / note"     (e.g. "GMAW / 2F / X-ray")
       ISO  → "iso4063 / position / note"     (e.g. "135 / PB / X-ray") */
    var procText, posText;
    if (isISO()) {
      procText = d.processIso || '';
      var posList = POSITIONS[selWeld.cat] || [];
      var posMatch = posList.find ? posList.find(function(p){ return p.aws === d.position; }) : null;
      if (!posMatch) { for (var pi = 0; pi < posList.length; pi++) if (posList[pi].aws === d.position) { posMatch = posList[pi]; break; } }
      posText = posMatch ? posMatch.iso : '';
    } else {
      procText = d.process || '';
      posText  = d.position || '';
    }
    var tailParts = [procText, posText, d.note].filter(function(s){ return s; });
    var tailText  = tailParts.join(' / ');

    /* ── Tail ── */
    var drawTail = !opts.noTail && (opts.forceTail || showTail);
    if (drawTail) {
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rlX2, rlY);
      ctx.lineTo(rlX2 + 18, rlY - 14);
      ctx.moveTo(rlX2, rlY);
      ctx.lineTo(rlX2 + 18, rlY + 14);
      ctx.stroke();
      if (tailText && !opts.noLabels) {
        drawText(tailText, rlX2 + 28, rlY, { size: 10, color: '#ffb74d', weight: '700', align: 'left' });
      }
    }

    /* ── Weld-all-around circle ── */
    if (d.allAround && !opts.noLabels) {
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rlX1, rlY, 8, 0, Math.PI*2);
      ctx.stroke();
    }

    /* ── Field weld flag ── */
    if (d.field && !opts.noLabels) {
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.moveTo(rlX1, rlY);
      ctx.lineTo(rlX1, rlY - 22);
      ctx.lineTo(rlX1 + 14, rlY - 14);
      ctx.closePath();
      ctx.fill();
    }

    /* ── Weld symbols ── */
    var symCx = cx + 10;

    /* Groove-angle annotation applies to these preps only */
    var angTxt = (d.angle || '').toString().trim();
    var isAngWeld = (weldId === 'v-groove' || weldId === 'bevel-groove' || weldId === 'u-groove' || weldId === 'j-groove');
    var hasAng = !!angTxt && isAngWeld && showDims && !opts.noLabels;

    if (isRes) {
      /* Spot / seam: centred ON the reference line, no side significance
         (identical rule in AWS A2.4 and ISO 2553). */
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, 1);
      if (!opts.noLabels) {
        drawText('Centred on line — no side significance', cx + 10, rlY + symSize + 18, { size: 10, color: '#6b7a99', weight: '700' });
      }
    } else if (isoSym) {
      /* ISO symmetrical double weld: both symbols mirrored on the SOLID
         line; dashed identification line omitted. */
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#e91e63';
      drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, -1); // arrow side above
      ctx.strokeStyle = '#f48fb1';
      drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, 1);  // other side below
      drawText('Both Sides — symmetrical (dashed line omitted)', cx + 10, rlY + symSize + 18, { size: 10, color: '#6b7a99', weight: '700' });
    } else if (isISO()) {
      /* ISO 2553 System A:
         Arrow-side symbol → ON the SOLID line, drawn ABOVE it
            (opening on solid line, apex points away from dashed line)
         Other-side symbol → ON the DASHED line, drawn BELOW it
            (opening on dashed line, apex points away from solid line)
         Result: the two symbols point AWAY from each other, with the
         space between solid and dashed lines kept clear. */
      if (plcmt === 'arrow' || plcmt === 'both') {
        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, -1); // above solid line
      }
      if (plcmt === 'other' || plcmt === 'both') {
        ctx.strokeStyle = '#f48fb1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawWeldSymbol(ctx, weldId, symCx, rlY + dashGap, symSize, 1); // below dashed line
      }

      /* Placement label */
      if (!opts.noLabels) {
        var isoLabel = plcmt === 'arrow' ? 'Arrow Side (solid line)' : 'Other Side (dashed line)';
        var isoLabY = rlY + dashGap + symSize + (hasAng && plcmt === 'other' ? 32 : 14);
        drawText(isoLabel, cx + 10, isoLabY, { size: 10, color: '#6b7a99', weight: '700' });
      }

    } else {
      /* AWS A2.4:
         Arrow-side → BELOW reference line
         Other-side → ABOVE reference line
      */
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (plcmt === 'arrow' || plcmt === 'both') {
        drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, 1); // below
      }
      if (plcmt === 'other' || plcmt === 'both') {
        ctx.strokeStyle = '#f48fb1';
        ctx.lineWidth = 3;
        drawWeldSymbol(ctx, weldId, symCx, rlY, symSize, -1); // above
        ctx.strokeStyle = '#e91e63';
      }

      /* Placement label (kept clear of the groove-angle annotation) */
      if (!opts.noLabels) {
        var plLabel = plcmt === 'arrow' ? 'Arrow Side' : plcmt === 'other' ? 'Other Side' : 'Both Sides';
        var plLabY = plcmt === 'other'
          ? rlY - symSize - (hasAng ? 32 : 18)
          : rlY + symSize + (hasAng ? 30 : 18);
        drawText(plLabel, cx + 10, plLabY, { size: 10, color: '#6b7a99', weight: '700' });
      }
    }

    /* ── Dimensions (size / length / pitch) ── */
    if (showDims && !opts.noLabels) {
      var sizeTxt   = d.size   || '';
      var lengthTxt = d.length || '';
      var pitchTxt  = d.pitch  || '';

      /* ISO fillet sizing prefix (a = throat, z = leg) */
      if (sizeTxt && isISO() && weldId === 'fillet') {
        sizeTxt = (d.filletPrefix || 'z') + sizeTxt;
      }

      /* Dimensions sit on the SAME side as the symbol they describe.
         AWS: below for arrow side, above for other side.
         ISO: the arrow-side symbol is ABOVE the solid line; the other-side
         symbol hangs below the dashed line. Resistance welds: below. */
      var dimAbove = isRes ? false
        : isISO() ? (plcmt === 'arrow' || isoSym)
                  : (plcmt === 'other');
      var dimBase  = (isISO() && !isoSym && !isRes && plcmt === 'other') ? rlY + dashGap : rlY;
      var dimY = dimAbove ? rlY - symSize + 8 : dimBase + symSize - 4;

      /* Right-of-symbol text: AWS "length-pitch"; ISO "length (pitch)".
         Plug welds have no length — pitch alone goes to the right, and the
         depth of filling is shown INSIDE the symbol (AWS A2.4). */
      var rightStr;
      if (weldId === 'plug') {
        rightStr = pitchTxt;
      } else if (lengthTxt) {
        rightStr = pitchTxt ? (isISO() ? lengthTxt + ' (' + pitchTxt + ')' : lengthTxt + '-' + pitchTxt) : lengthTxt;
      } else {
        rightStr = '';
      }

      function drawDimRow(y) {
        if (sizeTxt) {
          drawText(sizeTxt, symCx - symSize*0.75, y, { size: 12, color: '#3ddc84', weight: '800', family: "'Courier New', monospace" });
        }
        if (rightStr) {
          drawText(rightStr, symCx + symSize*0.95, y, { size: 12, color: '#3ddc84', weight: '800', family: "'Courier New', monospace", align: 'left' });
        }
      }
      drawDimRow(dimY);
      /* AWS both sides: each symbol carries its own dimensions */
      if (!isISO() && plcmt === 'both' && !isRes) drawDimRow(rlY - symSize + 8);

      /* Plug weld depth of filling — inside the rectangle symbol */
      if (weldId === 'plug' && lengthTxt) {
        var inY = rlY + (dimAbove ? -1 : 1) * symSize * 0.28;
        if (!isISO() && plcmt === 'other') inY = rlY - symSize * 0.28;
        if (isISO() && plcmt === 'other' && !isoSym) inY = rlY + dashGap + symSize * 0.28;
        drawText(lengthTxt, symCx, inY, { size: 10, color: '#ffd54f', weight: '800', family: "'Courier New', monospace" });
      }

      /* ── Angle annotation near the symbol vertex (V / bevel / U / J grooves) ── */
      if (hasAng) {
        var angY = dimAbove ? rlY - symSize - 14 : dimBase + symSize + 12;
        drawText(angTxt.replace(/°$/, '') + '°', symCx, angY, { size: 11, color: '#90caf9', weight: '700', family: "'Courier New', monospace" });
      }
    }
  }

  /* ────────────────────────────────────────────────────────────────
     6. WELD SYMBOL DRAWING (the small symbols on the reference line)
     ──────────────────────────────────────────────────────────────── */
  function drawWeldSymbol(c, id, cx, cy, s, dir) {
    /* dir: 1 = below ref line, -1 = above ref line.
       Opening of asymmetric symbols always touches the reference line;
       the closed/pointed end faces away. */
    c.beginPath();
    switch (id) {
      case 'square-groove':
        /* Two parallel verticals (I-butt). Wider gap per AWS Fig. 3 */
        c.moveTo(cx - s*0.22, cy);
        c.lineTo(cx - s*0.22, cy + s*0.7*dir);
        c.moveTo(cx + s*0.22, cy);
        c.lineTo(cx + s*0.22, cy + s*0.7*dir);
        break;

      case 'v-groove':
        /* Symmetric V, ~60° included angle */
        c.moveTo(cx - s*0.42, cy);
        c.lineTo(cx, cy + s*0.78*dir);
        c.lineTo(cx + s*0.42, cy);
        break;

      case 'bevel-groove':
        /* AWS A2.4 §6.4.1: perpendicular leg always on the LEFT,
           diagonal rises ~45° back to the reference line on the right */
        c.moveTo(cx - s*0.22, cy);
        c.lineTo(cx - s*0.22, cy + s*0.75*dir);
        c.moveTo(cx - s*0.22, cy + s*0.75*dir);
        c.lineTo(cx + s*0.28, cy);
        break;

      case 'u-groove':
        /* Bucket-shaped U with short verticals + flat-radius bottom */
        c.moveTo(cx - s*0.30, cy);
        c.lineTo(cx - s*0.30, cy + s*0.45*dir);
        c.quadraticCurveTo(cx - s*0.30, cy + s*0.78*dir, cx - s*0.10, cy + s*0.78*dir);
        c.lineTo(cx + s*0.10, cy + s*0.78*dir);
        c.quadraticCurveTo(cx + s*0.30, cy + s*0.78*dir, cx + s*0.30, cy + s*0.45*dir);
        c.lineTo(cx + s*0.30, cy);
        break;

      case 'j-groove':
        /* Half of U: vertical leg on left, J curve on right */
        c.moveTo(cx - s*0.22, cy);
        c.lineTo(cx - s*0.22, cy + s*0.78*dir);
        c.lineTo(cx + s*0.05, cy + s*0.78*dir);
        c.quadraticCurveTo(cx + s*0.28, cy + s*0.78*dir, cx + s*0.28, cy + s*0.45*dir);
        c.lineTo(cx + s*0.28, cy);
        break;

      case 'flare-v-groove':
        /* AWS A2.4 flare-V: two quarter-circle arcs. Each starts at the
           reference line with a VERTICAL tangent (the two starts adjacent
           at centre) and sweeps outward to a HORIZONTAL tangent at depth —
           the flared opening faces away from the line. */
        c.moveTo(cx - s*0.06, cy);
        c.quadraticCurveTo(cx - s*0.06, cy + s*0.72*dir, cx - s*0.50, cy + s*0.72*dir);
        c.moveTo(cx + s*0.06, cy);
        c.quadraticCurveTo(cx + s*0.06, cy + s*0.72*dir, cx + s*0.50, cy + s*0.72*dir);
        break;

      case 'flare-bevel':
        /* AWS A2.4 flare-bevel: perpendicular leg on the LEFT (flat member)
           + one quarter-circle arc starting vertical at the line and
           sweeping right to a horizontal tangent (convex member). */
        c.moveTo(cx - s*0.30, cy);
        c.lineTo(cx - s*0.30, cy + s*0.72*dir);
        c.moveTo(cx - s*0.14, cy);
        c.quadraticCurveTo(cx - s*0.14, cy + s*0.72*dir, cx + s*0.32, cy + s*0.72*dir);
        break;

      case 'fillet':
        /* Right triangle, perpendicular leg on the LEFT */
        c.moveTo(cx - s*0.35, cy);
        c.lineTo(cx - s*0.35, cy + s*0.70*dir);
        c.lineTo(cx + s*0.35, cy);
        c.closePath();
        break;

      case 'plug':
      case 'slot':
        var rw = s * 0.55, rh = s * 0.55;
        c.rect(cx - rw/2, dir > 0 ? cy : cy - rh, rw, rh);
        break;

      case 'spot':
        c.arc(cx, cy, s*0.30, 0, Math.PI*2);
        break;

      case 'seam':
        /* AWS A2.4 seam: circle centred on the line with TWO parallel
           horizontal lines passing through and extending beyond it. */
        c.arc(cx, cy, s*0.30, 0, Math.PI*2);
        c.moveTo(cx - s*0.50, cy - s*0.13);
        c.lineTo(cx + s*0.50, cy - s*0.13);
        c.moveTo(cx - s*0.50, cy + s*0.13);
        c.lineTo(cx + s*0.50, cy + s*0.13);
        break;
    }
    c.stroke();
  }

  /* ────────────────────────────────────────────────────────────────
     7. JOINT CROSS-SECTION DRAWING
     ──────────────────────────────────────────────────────────────── */
  function drawJointSection(cx, cy, weldId, plcmt) {
    plcmt = plcmt || 'arrow';
    var pw = 110; // plate width
    var ph = 55;  // plate half-height
    var gap = 6;

    ctx.lineWidth = 2;
    ctx.lineJoin  = 'round';
    ctx.lineCap   = 'round';

    switch (weldId) {

      /* ── Square groove: full thickness weld fill ── */
      case 'square-groove':
        drawPlateRect(cx - pw - gap/2, cy - ph, pw, ph*2);
        drawPlateRect(cx + gap/2, cy - ph, pw, ph*2);
        /* Full-thickness weld */
        ctx.fillStyle = '#ef6c00';
        ctx.fillRect(cx - gap/2 - 1, cy - ph, gap + 2, ph*2);
        /* Crown reinforcement on top & root on bottom */
        ctx.fillStyle = 'rgba(239,108,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - ph, 10, 4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy + ph, 8, 3, 0, 0, Math.PI*2);
        ctx.fill();
        drawWeldHatch(cx - gap/2, cy - ph, gap, ph*2);
        break;

      /* ── V-groove: full penetration, ~60° bevel, root opening ── */
      case 'v-groove':
        drawPlateRect(cx - pw - 2, cy - ph, pw, ph*2);
        drawPlateRect(cx + 2, cy - ph, pw, ph*2);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy - ph);                // top-left opening
        ctx.lineTo(cx - 4, cy + ph - 4);             // root face left
        ctx.lineTo(cx + 4, cy + ph - 4);             // root face right
        ctx.lineTo(cx + 32, cy - ph);                // top-right opening
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown reinforcement above plates */
        ctx.fillStyle = 'rgba(239,108,0,0.8)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - ph, 36, 7, 0, 0, Math.PI*2);
        ctx.fill();
        /* Root pass bulge below plates */
        ctx.fillStyle = 'rgba(239,108,0,0.55)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + ph, 9, 4, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── Bevel groove: LEFT plate is beveled (matches symbol leg-left) ── */
      case 'bevel-groove':
        drawPlateRect(cx - pw - 2, cy - ph, pw, ph*2);
        drawPlateRect(cx + 2, cy - ph, pw, ph*2);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - ph);                // top of bevel on left plate
        ctx.lineTo(cx - 2, cy + ph - 4);             // root at bottom of left plate
        ctx.lineTo(cx + 2, cy + ph - 4);             // along right plate face
        ctx.lineTo(cx + 2, cy - ph);                 // up the right plate face
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown reinforcement */
        ctx.fillStyle = 'rgba(239,108,0,0.8)';
        ctx.beginPath();
        ctx.ellipse(cx - 14, cy - ph, 22, 6, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── U-groove: bucket profile, full penetration ── */
      case 'u-groove':
        drawPlateRect(cx - pw - 2, cy - ph, pw, ph*2);
        drawPlateRect(cx + 2, cy - ph, pw, ph*2);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - ph);
        ctx.lineTo(cx - 24, cy + ph - 20);
        ctx.quadraticCurveTo(cx - 24, cy + ph - 4, cx - 8, cy + ph - 4);
        ctx.lineTo(cx + 8, cy + ph - 4);
        ctx.quadraticCurveTo(cx + 24, cy + ph - 4, cx + 24, cy + ph - 20);
        ctx.lineTo(cx + 24, cy - ph);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown */
        ctx.fillStyle = 'rgba(239,108,0,0.8)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - ph, 28, 6, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── J-groove: only LEFT plate prepared with J profile ── */
      case 'j-groove':
        drawPlateRect(cx - pw - 2, cy - ph, pw, ph*2);
        drawPlateRect(cx + 2, cy - ph, pw, ph*2);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - ph);
        ctx.lineTo(cx - 24, cy + ph - 20);
        ctx.quadraticCurveTo(cx - 24, cy + ph - 4, cx - 8, cy + ph - 4);
        ctx.lineTo(cx + 2, cy + ph - 4);
        ctx.lineTo(cx + 2, cy - ph);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown */
        ctx.fillStyle = 'rgba(239,108,0,0.8)';
        ctx.beginPath();
        ctx.ellipse(cx - 11, cy - ph, 20, 6, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── Flare-V: two round bars + triangular weld fill ── */
      case 'flare-v-groove':
        ctx.fillStyle = '#546e7a';
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx - 32, cy, 30, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 32, cy, 30, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        /* Weld fills only the UPPER flared cusp (welded from above), the
           groove walls being the bars' convex surfaces down to the waist */
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.arc(cx - 32, cy, 30, -1.047, -0.067, false);          // left bar surface: top → waist
        ctx.arc(cx + 32, cy, 30, Math.PI + 0.067, Math.PI + 1.047, false); // right bar: waist → top
        ctx.closePath();                                          // face of the weld (top chord)
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown */
        ctx.fillStyle = 'rgba(239,108,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 27, 16, 4, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── Flare-bevel: one round bar + flat plate, weld in flared gap ── */
      case 'flare-bevel':
        ctx.fillStyle = '#546e7a';
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 2;
        drawPlateRect(cx - pw + 30, cy - ph, pw - 32, ph*2);  // flat plate on left, right edge at cx-2
        ctx.fillStyle = '#546e7a';
        ctx.beginPath(); ctx.arc(cx + 34, cy, 30, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        /* Weld fills only the UPPER flared cusp between the flat plate face
           and the bar's convex surface (welded from above) */
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 26);                              // plate face, top
        ctx.lineTo(cx - 2, cy - 2);                               // down the plate face
        ctx.arc(cx + 34, cy, 30, Math.PI + 0.067, Math.PI + 1.047, false); // bar surface: waist → top
        ctx.closePath();                                          // face of the weld (top chord)
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Crown */
        ctx.fillStyle = 'rgba(239,108,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx + 8, cy - 27, 12, 4, 0, 0, Math.PI*2);
        ctx.fill();
        break;

      /* ── Fillet (T-joint): respect arrow/other/both placement ── */
      case 'fillet': {
        drawPlateRect(cx - pw, cy + 2, pw*2, ph - 2);          // base plate
        drawPlateRect(cx - 20, cy - ph - 10, 40, ph + 12);     // upright
        ctx.fillStyle = '#ef6c00';
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5;
        var showLeft  = (plcmt === 'arrow' || plcmt === 'both');
        var showRight = (plcmt === 'other' || plcmt === 'both');
        if (showLeft) {
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy + 2);
          ctx.lineTo(cx - 20, cy - 22);
          ctx.lineTo(cx - 44, cy + 2);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy - 22); ctx.lineTo(cx - 44, cy + 2);
          ctx.stroke();
        }
        if (showRight) {
          ctx.fillStyle = '#ef6c00';
          ctx.beginPath();
          ctx.moveTo(cx + 20, cy + 2);
          ctx.lineTo(cx + 20, cy - 22);
          ctx.lineTo(cx + 44, cy + 2);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx + 20, cy - 22); ctx.lineTo(cx + 44, cy + 2);
          ctx.stroke();
        }
        break;
      }

      /* ── Plug: round hole filled completely with weld metal ── */
      case 'plug':
        drawPlateRect(cx - pw, cy - 8, pw*2, 20);
        drawPlateRect(cx - pw, cy + 16, pw*2, 20);
        /* Clear the hole (vertical sides) and fill it solidly */
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(cx - 16, cy - 8, 32, 20);
        ctx.fillStyle = '#ef6c00';
        ctx.fillRect(cx - 16, cy - 8, 32, 20);
        /* Crown above + fusion lens into bottom plate */
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8, 18, 5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 16, 4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy - 8); ctx.lineTo(cx - 16, cy + 12);
        ctx.moveTo(cx + 16, cy - 8); ctx.lineTo(cx + 16, cy + 12);
        ctx.stroke();
        break;

      /* ── Slot: elongated hole filled completely ── */
      case 'slot':
        drawPlateRect(cx - pw, cy - 8, pw*2, 20);
        drawPlateRect(cx - pw, cy + 16, pw*2, 20);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(cx - 32, cy - 8, 64, 20);
        ctx.fillStyle = '#ef6c00';
        ctx.fillRect(cx - 32, cy - 8, 64, 20);
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8, 34, 5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 32, 4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy - 8); ctx.lineTo(cx - 32, cy + 12);
        ctx.moveTo(cx + 32, cy - 8); ctx.lineTo(cx + 32, cy + 12);
        ctx.stroke();
        break;

      /* ── Resistance ── */
      case 'spot':
        drawPlateRect(cx - pw, cy - 18, pw*2, 16);
        drawPlateRect(cx - pw, cy + 2, pw*2, 16);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 14, 10, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        /* Electrode indentation marks on top & bottom (typical of RSW) */
        ctx.strokeStyle = 'rgba(120,144,156,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 18); ctx.quadraticCurveTo(cx, cy - 16, cx + 6, cy - 18);
        ctx.moveTo(cx - 6, cy + 18); ctx.quadraticCurveTo(cx, cy + 16, cx + 6, cy + 18);
        ctx.stroke();
        break;

      case 'seam':
        drawPlateRect(cx - pw, cy - 18, pw*2, 16);
        drawPlateRect(cx - pw, cy + 2, pw*2, 16);
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, pw*0.7, 10, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 1.5; ctx.stroke();
        break;
    }
  }

  function drawPlateRect(x, y, w, h) {
    ctx.fillStyle = '#546e7a';
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    /* subtle hatch lines for metal texture */
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(120,144,156,0.18)';
    ctx.lineWidth = 1;
    var step = 8;
    for (var i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i - h, y + h);
      ctx.stroke();
    }
    ctx.restore();
    /* re-draw border after clip restore */
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  function drawWeldHatch(x, y, w, h) {
    ctx.strokeStyle = 'rgba(255,204,128,0.35)';
    ctx.lineWidth = 1;
    for (var i = 0; i < w + h; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + Math.min(i, w), y + Math.max(0, i - w));
      ctx.lineTo(x + Math.max(0, i - h), y + Math.min(i, h));
      ctx.stroke();
    }
  }

  /* ────────────────────────────────────────────────────────────────
     8. STANDARD BADGE ON CANVAS
     ──────────────────────────────────────────────────────────────── */
  function drawStandardBadge() {
    var label = isISO() ? 'ISO 2553' : 'AWS A2.4';
    var badgeColor = isISO() ? '#42a5f5' : '#e91e63';
    var badgeBg = isISO() ? 'rgba(66,165,245,0.12)' : 'rgba(233,30,99,0.12)';
    var bx = W - 70, by = 18;

    /* Badge background */
    ctx.fillStyle = badgeBg;
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1;
    roundRect(ctx, bx - 36, by - 10, 72, 20, 4);
    ctx.fill();
    ctx.stroke();

    /* Badge text */
    drawText(label, bx, by, { size: 10, weight: '800', color: badgeColor });
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /* ────────────────────────────────────────────────────────────────
     9. MAIN DRAW FUNCTION
     ──────────────────────────────────────────────────────────────── */
  function draw() {
    clear();
    drawStandardBadge();
    if (mode === 'learn') { drawLearnMode(); return; }
    if (mode === 'practice' || mode === 'quiz') { drawQuestionMode(); return; }
    drawExploreMode();
  }

  function drawExploreMode() {
    /* Section labels */
    drawSectionLabel('WELDING SYMBOL', 230, 22);
    drawSectionLabel('JOINT CROSS-SECTION', 680, 22);

    /* Divider */
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(465, 30);
    ctx.lineTo(465, H - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Symbol diagram */
    drawRefLineDiagram(240, 190, selWeld.id, placement);

    /* Joint cross-section */
    drawJointSection(680, 230, selWeld.id, placement);

    /* Weld name label below joint */
    drawText(selWeld.name, 680, H - 40, { size: 15, weight: '800', color: '#e91e63' });

    /* Arrow side / other side labels */
    if (selWeld.cat === 'groove' || selWeld.id === 'fillet') {
      drawText('Arrow side', 680, H - 20, { size: 10, color: '#4fc3f7', weight: '600' });
    }
  }

  /* ────────────────────────────────────────────────────────────────
     10. LEARN MODE — AWS & ISO anatomy
     ──────────────────────────────────────────────────────────────── */
  function drawLearnMode() {
    if (isISO()) {
      drawLearnModeISO();
    } else {
      drawLearnModeAWS();
    }
  }

  function drawLearnModeAWS() {
    drawSectionLabel('ANATOMY OF A WELDING SYMBOL (AWS A2.4)', W/2, 22);

    var rlY = 200;
    var rlX1 = 140, rlX2 = 620;

    /* Reference line */
    ctx.strokeStyle = learnPart === 0 ? '#4fc3f7' : (learnPart < 0 ? '#4fc3f7' : 'rgba(79,195,247,0.3)');
    ctx.lineWidth = learnPart === 0 ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rlX1, rlY);
    ctx.lineTo(rlX2, rlY);
    ctx.stroke();
    if (learnPart === 0) drawText('Reference Line', (rlX1 + rlX2)/2, rlY - 75, { size: 11, color: '#4fc3f7', weight: '700' });

    /* Arrow */
    var arrOp = learnPart === 1 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = arrOp;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = learnPart === 1 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(rlX1 + 50, rlY);
    ctx.lineTo(rlX1 - 10, rlY + 120);
    ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    var aa = Math.atan2(120, -60);
    ctx.beginPath();
    ctx.moveTo(rlX1 - 10, rlY + 120);
    ctx.lineTo(rlX1 - 10 - 12*Math.cos(aa-0.4), rlY+120 - 12*Math.sin(aa-0.4));
    ctx.lineTo(rlX1 - 10 - 12*Math.cos(aa+0.4), rlY+120 - 12*Math.sin(aa+0.4));
    ctx.closePath(); ctx.fill();
    if (learnPart === 1) drawText('Arrow', rlX1 - 25, rlY + 145, { size: 11, color: '#4fc3f7', weight: '700' });
    ctx.globalAlpha = 1;

    /* Arrow-side symbol (V-groove below) */
    var symOp = learnPart === 2 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = symOp;
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = learnPart === 2 ? 4 : 3;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawWeldSymbol(ctx, 'v-groove', 350, rlY, 40, 1);
    if (learnPart === 2) drawText('Arrow-Side Symbol (BELOW)', 350, rlY + 56, { size: 11, color: '#e91e63', weight: '700' });
    ctx.globalAlpha = 1;

    /* Other-side symbol (fillet above) */
    symOp = learnPart === 3 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = symOp;
    ctx.strokeStyle = '#f48fb1';
    ctx.lineWidth = learnPart === 3 ? 4 : 3;
    drawWeldSymbol(ctx, 'fillet', 350, rlY, 36, -1);
    if (learnPart === 3) drawText('Other-Side Symbol (ABOVE)', 350, rlY - 52, { size: 11, color: '#f48fb1', weight: '700' });
    ctx.globalAlpha = 1;

    /* Tail */
    var tailOp = learnPart === 4 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = tailOp;
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = learnPart === 4 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(rlX2, rlY);
    ctx.lineTo(rlX2 + 24, rlY - 18);
    ctx.moveTo(rlX2, rlY);
    ctx.lineTo(rlX2 + 24, rlY + 18);
    ctx.stroke();
    if (learnPart === 4) {
      drawText('Tail', rlX2 + 50, rlY, { size: 11, color: '#ffb74d', weight: '700' });
      drawText('(GMAW)', rlX2 + 38, rlY - 22, { size: 9, color: 'rgba(255,183,77,0.5)', weight: '600' });
    }
    ctx.globalAlpha = 1;

    /* Dimensions */
    var dimOp = learnPart === 5 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = dimOp;
    drawText('6', 310, rlY + 22, { size: 14, color: '#3ddc84', weight: '800', family: "'Courier New', monospace" });
    drawText('50', 400, rlY + 22, { size: 14, color: '#3ddc84', weight: '800', family: "'Courier New', monospace" });
    if (learnPart === 5) {
      drawText('Size', 295, rlY + 42, { size: 9, color: '#3ddc84', weight: '700' });
      drawText('Length', 415, rlY + 42, { size: 9, color: '#3ddc84', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* Supplementary symbols */
    var suppOp = learnPart === 6 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = suppOp;
    /* Weld-all-around circle */
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rlX1 + 50, rlY, 8, 0, Math.PI*2);
    ctx.stroke();
    /* Field weld flag — AWS: points LEFT (toward tail) */
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(rlX1 + 50, rlY);
    ctx.lineTo(rlX1 + 50, rlY - 22);
    ctx.lineTo(rlX1 + 65, rlY - 14);
    ctx.closePath();
    ctx.fill();
    if (learnPart === 6) {
      drawText('Weld All Around', rlX1 + 50, rlY + 20, { size: 9, color: '#a78bfa', weight: '700' });
      drawText('Field Weld (flag toward tail)', rlX1 + 50, rlY - 34, { size: 9, color: '#a78bfa', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* Contour & Finish — three options: flush, convex, concave */
    var contOp = learnPart === 7 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = contOp;
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    var cY = rlY + 140;
    /* Flush (—) */
    ctx.beginPath(); ctx.moveTo(245, cY); ctx.lineTo(285, cY); ctx.stroke();
    drawText('G', 300, cY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('flush + grind', 268, cY + 18, { size: 8, color: '#f5c842', weight: '700' });
    /* Convex (⌢) */
    ctx.beginPath();
    ctx.moveTo(340, cY + 4);
    ctx.quadraticCurveTo(365, cY - 14, 390, cY + 4);
    ctx.stroke();
    drawText('M', 405, cY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('convex + machine', 365, cY + 18, { size: 8, color: '#f5c842', weight: '700' });
    /* Concave (⌣) */
    ctx.beginPath();
    ctx.moveTo(445, cY - 4);
    ctx.quadraticCurveTo(470, cY + 14, 495, cY - 4);
    ctx.stroke();
    drawText('C', 510, cY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('concave + chip', 470, cY + 18, { size: 8, color: '#f5c842', weight: '700' });
    if (learnPart === 7) {
      drawText('Contour (flat / convex / concave) + Finish letter (G/M/C)', W/2, cY + 36, { size: 9, color: '#f5c842', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* Bottom legend */
    drawText('Click the parts list below to highlight each element', W/2, H - 20, { size: 10, color: '#6b7a99', weight: '600' });
  }

  function drawLearnModeISO() {
    drawSectionLabel('ANATOMY OF A WELDING SYMBOL (ISO 2553 SYSTEM A)', W/2, 22);

    var rlY = 175;
    var dashY = rlY + 24; // dashed line below solid
    var rlX1 = 140, rlX2 = 620;

    /* 0: Solid reference line */
    var solidOp = learnPart === 0 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = solidOp;
    ctx.strokeStyle = learnPart === 0 ? '#4fc3f7' : '#4fc3f7';
    ctx.lineWidth = learnPart === 0 ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rlX1, rlY);
    ctx.lineTo(rlX2, rlY);
    ctx.stroke();
    if (learnPart === 0) drawText('Solid (Continuous) Reference Line', (rlX1 + rlX2)/2, rlY - 55, { size: 11, color: '#4fc3f7', weight: '700' });
    ctx.globalAlpha = 1;

    /* 1: Dashed reference line */
    var dashOp = learnPart === 1 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = dashOp;
    drawDashedLine(rlX1, dashY, rlX2, dashY, learnPart === 1 ? '#81d4fa' : '#81d4fa', learnPart === 1 ? 3.5 : 2.5);
    if (learnPart === 1) drawText('Dashed (Identification) Line — other side', (rlX1 + rlX2)/2, dashY + 18, { size: 9, color: '#81d4fa', weight: '700' });
    ctx.globalAlpha = 1;

    /* 2: Arrow */
    var arrOp = learnPart === 2 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = arrOp;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = learnPart === 2 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(rlX1 + 50, rlY);
    ctx.lineTo(rlX1 - 10, rlY + 120);
    ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    var aa = Math.atan2(120, -60);
    ctx.beginPath();
    ctx.moveTo(rlX1 - 10, rlY + 120);
    ctx.lineTo(rlX1 - 10 - 12*Math.cos(aa-0.4), rlY+120 - 12*Math.sin(aa-0.4));
    ctx.lineTo(rlX1 - 10 - 12*Math.cos(aa+0.4), rlY+120 - 12*Math.sin(aa+0.4));
    ctx.closePath(); ctx.fill();
    if (learnPart === 2) drawText('Arrow', rlX1 - 25, rlY + 145, { size: 11, color: '#4fc3f7', weight: '700' });
    ctx.globalAlpha = 1;

    /* 3: Arrow-side symbol on SOLID line (drawn ABOVE it, apex away from
       dashed). Fillet used here so the a/z dimension example applies. */
    var symOp = learnPart === 3 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = symOp;
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = learnPart === 3 ? 4 : 3;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawWeldSymbol(ctx, 'fillet', 350, rlY, 36, -1);
    if (learnPart === 3) drawText('Arrow-Side (ON solid line, drawn above it)', 350, rlY - 50, { size: 10, color: '#e91e63', weight: '700' });
    ctx.globalAlpha = 1;

    /* 4: Other-side symbol on DASHED line (below it) */
    symOp = learnPart === 4 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = symOp;
    ctx.strokeStyle = '#f48fb1';
    ctx.lineWidth = learnPart === 4 ? 4 : 3;
    drawWeldSymbol(ctx, 'v-groove', 480, dashY, 28, 1);
    if (learnPart === 4) drawText('Other-Side (ON dashed line)', 480, dashY + 38, { size: 9, color: '#f48fb1', weight: '700' });
    ctx.globalAlpha = 1;

    /* 5: Tail */
    var tailOp = learnPart === 5 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = tailOp;
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = learnPart === 5 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(rlX2, rlY);
    ctx.lineTo(rlX2 + 24, rlY - 18);
    ctx.moveTo(rlX2, rlY);
    ctx.lineTo(rlX2 + 24, rlY + 18);
    ctx.stroke();
    if (learnPart === 5) {
      drawText('Tail', rlX2 + 50, rlY, { size: 11, color: '#ffb74d', weight: '700' });
      drawText('(135)', rlX2 + 38, rlY - 22, { size: 9, color: 'rgba(255,183,77,0.5)', weight: '600' });
      drawText('ISO 4063 code', rlX2 + 54, rlY - 38, { size: 8, color: 'rgba(255,183,77,0.35)', weight: '600' });
    }
    ctx.globalAlpha = 1;

    /* 6: Dimensions (ISO notation) — beside the arrow-side fillet ABOVE the
       solid line; the zone between solid and dashed lines stays clear. */
    var dimOp = learnPart === 6 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = dimOp;
    drawText('a5', 310, rlY - 16, { size: 13, color: '#3ddc84', weight: '800', family: "'Courier New', monospace" });
    drawText('100', 410, rlY - 16, { size: 13, color: '#3ddc84', weight: '800', family: "'Courier New', monospace" });
    if (learnPart === 6) {
      drawText('Throat (a=mm)', 288, rlY - 34, { size: 8, color: '#3ddc84', weight: '700' });
      drawText('Length', 425, rlY - 34, { size: 8, color: '#3ddc84', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* 7: Supplementary symbols */
    var suppOp = learnPart === 7 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = suppOp;
    /* Weld-all-around circle */
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rlX1 + 50, rlY, 8, 0, Math.PI*2);
    ctx.stroke();
    /* Site/Field weld flag — ISO 2553 uses the SAME orientation as AWS:
       triangular flag at the junction with broadside facing the joint
       and pole pointing toward the tail. */
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(rlX1 + 50, rlY);
    ctx.lineTo(rlX1 + 50, rlY - 22);
    ctx.lineTo(rlX1 + 65, rlY - 14);
    ctx.closePath();
    ctx.fill();
    if (learnPart === 7) {
      drawText('Weld All Around', rlX1 + 50, rlY + 20, { size: 9, color: '#a78bfa', weight: '700' });
      drawText('Site Weld (flag toward tail)', rlX1 + 50, rlY - 34, { size: 9, color: '#a78bfa', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* 8: Contour & Finish — three options: flush, convex, concave */
    var contOp = learnPart === 8 ? 1 : (learnPart < 0 ? 1 : 0.25);
    ctx.globalAlpha = contOp;
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    var contourY = rlY + 150;
    /* Flush (—) */
    ctx.beginPath(); ctx.moveTo(245, contourY); ctx.lineTo(285, contourY); ctx.stroke();
    drawText('G', 300, contourY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('flush + grind', 268, contourY + 18, { size: 8, color: '#f5c842', weight: '700' });
    /* Convex (⌢) */
    ctx.beginPath();
    ctx.moveTo(340, contourY + 4);
    ctx.quadraticCurveTo(365, contourY - 14, 390, contourY + 4);
    ctx.stroke();
    drawText('M', 405, contourY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('convex + machine', 365, contourY + 18, { size: 8, color: '#f5c842', weight: '700' });
    /* Concave (⌣) */
    ctx.beginPath();
    ctx.moveTo(445, contourY - 4);
    ctx.quadraticCurveTo(470, contourY + 14, 495, contourY - 4);
    ctx.stroke();
    drawText('C', 510, contourY, { size: 12, color: '#f5c842', weight: '800' });
    drawText('concave + chip', 470, contourY + 18, { size: 8, color: '#f5c842', weight: '700' });
    if (learnPart === 8) {
      drawText('Contour (flat / convex / concave) + Finish letter (G/M/C)', W/2, contourY + 36, { size: 9, color: '#f5c842', weight: '700' });
    }
    ctx.globalAlpha = 1;

    /* Bottom legend */
    drawText('Click the parts list below to highlight each element', W/2, H - 20, { size: 10, color: '#6b7a99', weight: '600' });
  }

  function drawQuestionMode() {
    drawSectionLabel(mode === 'quiz' ? 'IDENTIFY THIS WELDING SYMBOL' : 'WHAT WELD DOES THIS SYMBOL REPRESENT?', W/2, 22);

    var qWeld = mode === 'quiz' ? (quizSet[quizIdx] || WELDS[0]) : (pCurrent || WELDS[0]);

    /* Draw a larger, centered symbol */
    drawRefLineDiagram(W/2, 220, qWeld.id, 'arrow', { rlLen: 300, symSize: 50, noTail: true, noLabels: true });

    /* Question mark label */
    drawText('?', W/2 + 10, 310, { size: 42, weight: '900', color: 'rgba(233,30,99,0.25)' });
  }

  /* ────────────────────────────────────────────────────────────────
     11. UI — WELD SELECTOR
     ──────────────────────────────────────────────────────────────── */
  function buildWeldGrid() {
    var grid = document.getElementById('ws-grid');
    grid.innerHTML = '';
    var filtered = WELDS.filter(function (w) { return w.cat === selCat; });
    filtered.forEach(function (w) {
      var b = document.createElement('button');
      b.className = 'ws-btn' + (w.id === selWeld.id ? ' active' : '');
      b.dataset.id = w.id;
      b.innerHTML = '<span class="ws-btn-name">' + w.name + '</span>';
      b.addEventListener('click', function () {
        selWeld = w;
        buildWeldGrid();
        updateInfo();
        draw();
      });
      grid.appendChild(b);
    });
  }

  /* Spot/seam have no arrow/other-side significance — grey out the
     placement pills and force 'arrow' while the resistance cat is active */
  function updatePlacementUI() {
    var res = (selCat === 'resistance');
    document.querySelectorAll('#placement-tabs .pill').forEach(function (p) {
      p.disabled = res;
      if (res) p.classList.toggle('active', p.dataset.value === 'arrow');
    });
    if (res) placement = 'arrow';
  }

  /* Category tabs */
  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.value;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    /* auto-select first weld in category */
    var first = WELDS.filter(function (w) { return w.cat === selCat; })[0];
    if (first) selWeld = first;
    updatePlacementUI();
    buildWeldGrid();
    updateInfo();
    draw();
  });

  /* Placement toggle */
  document.getElementById('placement-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    placement = e.target.dataset.value;
    document.querySelectorAll('#placement-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     12. UI — STANDARD TOGGLE
     ──────────────────────────────────────────────────────────────── */
  document.getElementById('std-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    standard = e.target.dataset.value;
    document.querySelectorAll('#std-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });

    /* If in learn mode, rebuild parts list for new standard */
    if (mode === 'learn') {
      learnPart = -1;
      buildLearnParts();
    }
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     13. UI — INFO CARD
     ──────────────────────────────────────────────────────────────── */
  function updateInfo() {
    document.getElementById('wi-name').textContent = selWeld.name;
    document.getElementById('wi-cat').textContent  = CATEGORIES[selWeld.cat];
    document.getElementById('wi-desc').textContent  = selWeld.desc;
    document.getElementById('wi-apps').textContent  = selWeld.apps;
  }

  /* ────────────────────────────────────────────────────────────────
     14. MODE SWITCHING
     ──────────────────────────────────────────────────────────────── */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.value;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(m);
  });

  function switchMode(m) {
    mode = m;

    /* visibility */
    elWeldSelector.style.display   = (m === 'explore') ? '' : 'none';
    elWeldInfo.style.display       = (m === 'explore') ? '' : 'none';
    elPlacement.style.display      = (m === 'explore') ? '' : 'none';
    elLearnInfo.style.display      = (m === 'learn')   ? '' : 'none';
    elPracticePanel.style.display  = (m === 'practice') ? '' : 'none';
    elPracticeBar.style.display    = (m === 'practice') ? '' : 'none';
    elQuizPanel.style.display      = (m === 'quiz')    ? '' : 'none';
    elQuizBar.style.display        = (m === 'quiz')    ? '' : 'none';
    elQuizResult.style.display     = 'none';

    if (m === 'learn') {
      learnPart = -1;
      buildLearnParts();
    }
    if (m === 'practice') { pScore = 0; pTotal = 0; pLocked = false; updatePracticeScore(); newPracticeQ(); }
    if (m === 'quiz') { startQuiz(); }
    draw();
  }

  /* ────────────────────────────────────────────────────────────────
     15. LEARN MODE — parts list interaction
     ──────────────────────────────────────────────────────────────── */
  function buildLearnParts() {
    var container = document.getElementById('learn-parts');
    container.innerHTML = '';
    var parts = learnParts();

    /* "Show All" button */
    var allBtn = document.createElement('div');
    allBtn.className = 'learn-part' + (learnPart < 0 ? ' active' : '');
    allBtn.innerHTML = '<div class="learn-dot" style="background:#dde3f0"></div><div><div class="learn-part-name">Show All Parts</div><div class="learn-part-desc">Display the complete welding symbol with all elements visible</div></div>';
    allBtn.addEventListener('click', function () { learnPart = -1; buildLearnParts(); draw(); });
    container.appendChild(allBtn);

    parts.forEach(function (p, i) {
      var el = document.createElement('div');
      el.className = 'learn-part' + (learnPart === i ? ' active' : '');
      el.innerHTML = '<div class="learn-dot" style="background:' + p.color + '"></div><div><div class="learn-part-name">' + p.name + '</div><div class="learn-part-desc">' + p.desc + '</div></div>';
      el.addEventListener('click', function () { learnPart = i; buildLearnParts(); draw(); });
      container.appendChild(el);
    });
  }

  /* ────────────────────────────────────────────────────────────────
     16. PRACTICE MODE
     ──────────────────────────────────────────────────────────────── */
  function newPracticeQ() {
    pLocked = false;
    pCurrent = WELDS[Math.floor(Math.random() * WELDS.length)];
    buildAnswerBtns('practice-answers', pCurrent, function (chosen) {
      if (pLocked) return;
      pLocked = true;
      pTotal++;
      var correct = (chosen === pCurrent.id);
      if (correct) pScore++;
      markAnswers('practice-answers', pCurrent.id, chosen);
      updatePracticeScore();
      document.getElementById('p-feedback').textContent = correct ? 'Correct!' : 'Wrong — ' + pCurrent.name;
      document.getElementById('p-feedback').className = 'feedback ' + (correct ? 'ok' : 'err');
    });
    document.getElementById('p-feedback').textContent = '';
    draw();
  }

  function updatePracticeScore() {
    document.getElementById('p-score').textContent = pScore;
    document.getElementById('p-total').textContent = pTotal;
  }

  document.getElementById('btn-p-new').addEventListener('click', newPracticeQ);

  /* ────────────────────────────────────────────────────────────────
     17. QUIZ MODE
     ──────────────────────────────────────────────────────────────── */
  function startQuiz() {
    quizScore = 0; quizIdx = 0; quizLocked = false; quizAnswers = [];
    elQuizResult.style.display = 'none';
    elQuizPanel.style.display = '';
    elQuizBar.style.display = '';
    /* Pick QUIZ_SIZE unique welds */
    var pool = WELDS.slice();
    shuffle(pool);
    quizSet = pool.slice(0, QUIZ_SIZE);
    showQuizQ();
  }

  function showQuizQ() {
    quizLocked = false;
    document.getElementById('quiz-q-num').textContent = quizIdx + 1;
    document.getElementById('quiz-q-total').textContent = QUIZ_SIZE;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('btn-quiz-next').style.display = 'none';

    buildAnswerBtns('quiz-answers', quizSet[quizIdx], function (chosen) {
      if (quizLocked) return;
      quizLocked = true;
      var correct = (chosen === quizSet[quizIdx].id);
      if (correct) quizScore++;
      quizAnswers.push({ weld: quizSet[quizIdx], given: chosen, ok: correct });
      markAnswers('quiz-answers', quizSet[quizIdx].id, chosen);
      var fb = document.getElementById('quiz-feedback');
      fb.textContent = correct ? 'Correct!' : 'Incorrect — ' + quizSet[quizIdx].name;
      fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
      document.getElementById('btn-quiz-next').style.display = '';
    });
    draw();
  }

  document.getElementById('btn-quiz-next').addEventListener('click', function () {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) { showQuizResult(); return; }
    showQuizQ();
    draw();
  });

  function showQuizResult() {
    elQuizPanel.style.display = 'none';
    elQuizBar.style.display = 'none';
    elQuizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var stars = pct >= 1 ? '★★★' : pct >= 0.6 ? '★★☆' : '★☆☆';
    var cls   = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var verdict = pct >= 1 ? 'Perfect score!' : pct >= 0.6 ? 'Good job — keep practising!' : 'Keep learning — you\'ll get there!';

    document.getElementById('qr-stars').textContent = stars;
    var scoreEl = document.getElementById('qr-score');
    scoreEl.textContent = quizScore + ' / ' + QUIZ_SIZE;
    scoreEl.className = 'qr-score ' + cls;
    document.getElementById('qr-verdict').textContent = verdict;

    var rows = document.getElementById('qr-rows');
    rows.innerHTML = '';
    quizAnswers.forEach(function (a, i) {
      var givenName = a.ok ? a.weld.name : (findWeld(a.given) || { name: a.given }).name;
      var row = document.createElement('div');
      row.className = 'qr-row ' + (a.ok ? 'ok' : 'err');
      row.innerHTML = '<div class="qr-qnum">Q' + (i+1) + '</div>' +
        '<div class="qr-correct">Correct: <strong>' + a.weld.name + '</strong></div>' +
        '<div class="qr-given">Given: <strong>' + givenName + '</strong></div>' +
        '<div class="qr-mark">' + (a.ok ? '✓' : '✗') + '</div>';
      rows.appendChild(row);
    });
  }

  document.getElementById('btn-quiz-retry').addEventListener('click', function () {
    startQuiz();
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     18. ANSWER BUTTON HELPERS
     ──────────────────────────────────────────────────────────────── */
  /* Plug and slot share the SAME rectangle symbol (AWS A2.4) — they can't
     be told apart from the symbol alone, so never offer both as options. */
  var TWIN_SYMBOLS = { plug: 'slot', slot: 'plug' };

  function buildAnswerBtns(containerId, correctWeld, onPick) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    /* Build 4 options: 1 correct + 3 wrong (unique, no ambiguous twin) */
    var options = [correctWeld];
    var twin = TWIN_SYMBOLS[correctWeld.id];
    var pool = WELDS.filter(function (w) { return w.id !== correctWeld.id && w.id !== twin; });
    shuffle(pool);
    for (var i = 0; i < 3 && i < pool.length; i++) options.push(pool[i]);
    shuffle(options);

    options.forEach(function (w) {
      var btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = w.name;
      btn.dataset.id = w.id;
      btn.addEventListener('click', function () { onPick(w.id); });
      container.appendChild(btn);
    });
  }

  function markAnswers(containerId, correctId, chosenId) {
    var btns = document.getElementById(containerId).querySelectorAll('.answer-btn');
    btns.forEach(function (b) {
      b.classList.add('locked');
      if (b.dataset.id === correctId) b.classList.add('correct');
      else if (b.dataset.id === chosenId) b.classList.add('wrong');
    });
  }

  /* ────────────────────────────────────────────────────────────────
     19. UTILITIES
     ──────────────────────────────────────────────────────────────── */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function findWeld(id) {
    for (var i = 0; i < WELDS.length; i++) { if (WELDS[i].id === id) return WELDS[i]; }
    return null;
  }

  /* ────────────────────────────────────────────────────────────────
     20. RESPONSIVE CANVAS
     ──────────────────────────────────────────────────────────────── */
  function fitCanvas() {
    var card = canvas.parentElement;
    if (!card) return;
    var maxW = card.clientWidth - 16;     // padding allowance
    if (maxW <= 0) return;
    var scale = Math.min(1, maxW / W);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width  = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
    /* Keep internal resolution sharp on HiDPI screens */
    var targetW = Math.round(W * dpr);
    var targetH = Math.round(H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    draw();
  }
  window.addEventListener('resize', fitCanvas);

  /* ────────────────────────────────────────────────────────────────
     21. SOUND EFFECTS (Web Audio API — no external assets)
     ──────────────────────────────────────────────────────────────── */
  var audioCtx = null;
  function beep(freq, dur, type) {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return; }
    }
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function playCorrect() { beep(880, 0.12, 'triangle'); setTimeout(function(){ beep(1320, 0.16, 'triangle'); }, 80); }
  function playWrong()   { beep(220, 0.22, 'sawtooth'); }

  /* Patch markAnswers to play sound — invoked from practice/quiz onPick */
  var origMarkAnswers = markAnswers;
  markAnswers = function (containerId, correctId, chosenId) {
    origMarkAnswers(containerId, correctId, chosenId);
    if (chosenId === correctId) playCorrect(); else playWrong();
  };

  /* ────────────────────────────────────────────────────────────────
     22. KEYBOARD SHORTCUTS (1–4 in Practice/Quiz, Esc closes modal)
     ──────────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    /* Close modal on Esc */
    if (e.key === 'Escape') {
      closeDimsModal();
      hideCtxMenu();
      return;
    }
    if (mode !== 'practice' && mode !== 'quiz') return;
    /* Skip if focus is in an input */
    if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var n = parseInt(e.key, 10);
    if (!(n >= 1 && n <= 4)) return;
    var containerId = mode === 'practice' ? 'practice-answers' : 'quiz-answers';
    var btns = document.getElementById(containerId).querySelectorAll('.answer-btn');
    if (btns[n - 1] && !btns[n - 1].classList.contains('locked')) {
      btns[n - 1].click();
    }
  });

  /* ────────────────────────────────────────────────────────────────
     23. EXPLORE-MODE UTILITY BAR (dims + tail toggles, custom dims, export)
     ──────────────────────────────────────────────────────────────── */
  var elExploreUtils = document.getElementById('explore-utils');
  var elToggleDims   = document.getElementById('toggle-dims');
  var elToggleTail   = document.getElementById('toggle-tail');
  var elBtnCustom    = document.getElementById('btn-custom-dims');
  var elBtnExport    = document.getElementById('btn-export-png');

  if (elToggleDims) elToggleDims.addEventListener('change', function () {
    showDims = elToggleDims.checked; draw();
  });
  if (elToggleTail) elToggleTail.addEventListener('change', function () {
    showTail = elToggleTail.checked; draw();
  });
  if (elBtnCustom) elBtnCustom.addEventListener('click', openDimsModal);
  if (elBtnExport) elBtnExport.addEventListener('click', exportPNG);

  /* ── Custom dimensions modal ── */
  var elDimsModal   = document.getElementById('dims-modal-overlay');
  var elDmClose     = document.getElementById('dims-modal-close');
  var elDmApply     = document.getElementById('cd-apply');
  var elDmReset     = document.getElementById('cd-reset');
  var elDmTitle     = document.getElementById('dims-modal-title');
  var elCdSize      = document.getElementById('cd-size');
  var elCdAngle     = document.getElementById('cd-angle');
  var elCdLength    = document.getElementById('cd-length');
  var elCdPitch     = document.getElementById('cd-pitch');
  var elCdProcess   = document.getElementById('cd-process');
  var elCdPosition  = document.getElementById('cd-position');
  var elCdNote      = document.getElementById('cd-note');
  var elCdAround    = document.getElementById('cd-all-around');
  var elCdField     = document.getElementById('cd-field');
  var elCdFpRow     = document.getElementById('cd-fillet-prefix-row');
  var elCdFpZ       = document.getElementById('cd-fp-z');
  var elCdFpA       = document.getElementById('cd-fp-a');

  /* Each weld type exposes a different subset of fields. */
  var FIELD_VISIBILITY = {
    'square-groove':  { size: true,  angle: false, length: false, pitch: false },
    'v-groove':       { size: true,  angle: true,  length: false, pitch: false },
    'bevel-groove':   { size: true,  angle: true,  length: false, pitch: false },
    'u-groove':       { size: true,  angle: true,  length: false, pitch: false },
    'j-groove':       { size: true,  angle: true,  length: false, pitch: false },
    'flare-v-groove': { size: true,  angle: false, length: false, pitch: false },
    'flare-bevel':    { size: true,  angle: false, length: false, pitch: false },
    'fillet':         { size: true,  angle: false, length: true,  pitch: true  },
    'plug':           { size: true,  angle: false, length: true,  pitch: true  },
    'slot':           { size: true,  angle: false, length: true,  pitch: true  },
    'spot':           { size: true,  angle: false, length: false, pitch: false },
    'seam':           { size: true,  angle: false, length: true,  pitch: true  }
  };

  /* Populate the process <select> — same canonical entries regardless of
     standard; only the display text differs. */
  function populateProcessDropdown() {
    if (!elCdProcess) return;
    elCdProcess.innerHTML = '';
    PROCESSES.forEach(function (p, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = p.name;
      elCdProcess.appendChild(opt);
    });
  }

  /* Populate the position <select> based on the current weld's category. */
  function populatePositionDropdown(cat) {
    if (!elCdPosition) return;
    elCdPosition.innerHTML = '';
    (POSITIONS[cat] || []).forEach(function (p, i) {
      var opt = document.createElement('option');
      opt.value = p.aws;          /* canonical key */
      opt.textContent = p.name;
      elCdPosition.appendChild(opt);
    });
  }

  function applyFieldVisibility(id) {
    var v = FIELD_VISIBILITY[id] || { size: true, angle: false, length: true, pitch: true };
    document.querySelectorAll('.modal-grid label[data-field]').forEach(function (lbl) {
      var f = lbl.dataset.field;
      if (f === 'size' || f === 'angle' || f === 'length' || f === 'pitch') {
        lbl.classList.toggle('cd-hidden', !v[f]);
      }
    });
    /* Fillet a/z prefix row visible only for fillet in ISO mode */
    var showPrefix = (id === 'fillet') && isISO();
    if (elCdFpRow) elCdFpRow.style.display = showPrefix ? '' : 'none';
  }

  function openDimsModal() {
    var d = getWeldData(selWeld.id);
    /* Match the modal title to the current weld */
    if (elDmTitle) elDmTitle.textContent = selWeld.name + ' — dimensions';

    populatePositionDropdown(selWeld.cat);
    applyFieldVisibility(selWeld.id);

    /* Plug welds: the "length" value is the DEPTH OF FILLING, drawn inside
       the symbol per AWS A2.4 (slots keep a true length) */
    var lenLbl = document.querySelector('.modal-grid label[data-field="length"] .cd-label');
    if (lenLbl) lenLbl.textContent = (selWeld.id === 'plug') ? 'Depth of filling (inside symbol)' : 'Length (right of symbol)';

    elCdSize.value     = d.size;
    elCdAngle.value    = d.angle;
    elCdLength.value   = d.length;
    elCdPitch.value    = d.pitch;
    /* Pick the canonical process entry by AWS abbreviation. */
    var procIdx = 0;
    for (var i = 0; i < PROCESSES.length; i++) {
      if (PROCESSES[i].aws === d.process && PROCESSES[i].iso === d.processIso) { procIdx = i; break; }
    }
    elCdProcess.value  = procIdx;
    elCdPosition.value = d.position || '';
    elCdNote.value     = d.note;
    elCdAround.checked = d.allAround;
    elCdField.checked  = d.field;
    if (elCdFpZ && elCdFpA) {
      elCdFpZ.checked = (d.filletPrefix !== 'a');
      elCdFpA.checked = (d.filletPrefix === 'a');
    }

    elDimsModal.style.display = 'flex';
    setTimeout(function(){ elCdSize.focus(); }, 50);
  }
  function closeDimsModal() {
    if (elDimsModal) elDimsModal.style.display = 'none';
  }
  if (elDmClose) elDmClose.addEventListener('click', closeDimsModal);
  if (elDimsModal) elDimsModal.addEventListener('click', function (e) {
    if (e.target === elDimsModal) closeDimsModal();
  });
  if (elDmApply) elDmApply.addEventListener('click', function () {
    var d = getWeldData(selWeld.id);
    d.size   = elCdSize.value.trim();
    d.angle  = elCdAngle.value.trim();
    d.length = elCdLength.value.trim();
    d.pitch  = elCdPitch.value.trim();
    d.note   = elCdNote.value.trim();
    d.allAround = elCdAround.checked;
    d.field     = elCdField.checked;
    /* Canonical process — store both aws + iso so the standard switch is lossless */
    var procIdx = parseInt(elCdProcess.value, 10) || 0;
    d.process    = PROCESSES[procIdx].aws;
    d.processIso = PROCESSES[procIdx].iso;
    /* Position — canonical key is the AWS code */
    d.position = elCdPosition.value;
    /* Fillet prefix */
    if (elCdFpA && elCdFpA.checked) d.filletPrefix = 'a';
    else                            d.filletPrefix = 'z';

    if (d.process || d.position || d.note) showTail = true;
    if (elToggleTail) elToggleTail.checked = showTail;
    closeDimsModal();
    draw();
  });
  if (elDmReset) elDmReset.addEventListener('click', function () {
    var d = resetWeldData(selWeld.id);
    /* Refresh modal fields from new defaults */
    elCdSize.value     = d.size;
    elCdAngle.value    = d.angle;
    elCdLength.value   = d.length;
    elCdPitch.value    = d.pitch;
    elCdProcess.value  = 0;
    elCdPosition.value = '';
    elCdNote.value     = '';
    elCdAround.checked = false;
    elCdField.checked  = false;
    if (elCdFpZ) elCdFpZ.checked = true;
    if (elCdFpA) elCdFpA.checked = false;
    draw();
  });

  /* Populate the process dropdown once on init */
  populateProcessDropdown();

  /* ── Export PNG (with watermark) ── */
  function exportPNG() {
    /* Composite canvas onto a temporary canvas with white background + watermark */
    var dpr = window.devicePixelRatio || 1;
    var out = document.createElement('canvas');
    out.width  = W;
    out.height = H + 28;  // extra space for watermark
    var octx = out.getContext('2d');
    /* Dark background to match tool */
    octx.fillStyle = '#0d1117';
    octx.fillRect(0, 0, out.width, out.height);
    /* Draw the live canvas onto the export, normalising the HiDPI scale */
    octx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, W, H);
    /* Watermark */
    octx.fillStyle = 'rgba(120,144,156,0.65)';
    octx.font = '11px "Segoe UI", system-ui, sans-serif';
    octx.textAlign = 'left';
    octx.fillText('NHIT VisualLab / Welding Symbol Trainer / ' + (isISO() ? 'ISO 2553' : 'AWS A2.4') + ' / ' + selWeld.name, 12, H + 18);
    /* Trigger download */
    var link = document.createElement('a');
    link.download = 'weld-symbol-' + selWeld.id + '-' + (isISO() ? 'iso' : 'aws') + '.png';
    link.href = out.toDataURL('image/png');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  /* ────────────────────────────────────────────────────────────────
     24. RIGHT-CLICK CONTEXT MENU
     ──────────────────────────────────────────────────────────────── */
  var elCtxMenu = document.getElementById('canvas-ctx-menu');
  function showCtxMenu(x, y) {
    if (!elCtxMenu) return;
    elCtxMenu.style.display = 'block';
    /* Keep inside viewport */
    var rect = elCtxMenu.getBoundingClientRect();
    var maxX = window.innerWidth - rect.width - 4;
    var maxY = window.innerHeight - rect.height - 4;
    elCtxMenu.style.left = Math.min(x, maxX) + 'px';
    elCtxMenu.style.top  = Math.min(y, maxY) + 'px';
  }
  function hideCtxMenu() {
    if (elCtxMenu) elCtxMenu.style.display = 'none';
  }
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY);
  });
  document.addEventListener('click', function (e) {
    if (!elCtxMenu || elCtxMenu.style.display === 'none') return;
    if (!elCtxMenu.contains(e.target)) hideCtxMenu();
  });
  if (elCtxMenu) elCtxMenu.addEventListener('click', function (e) {
    var btn = e.target.closest('.ctx-item');
    if (!btn) return;
    var action = btn.dataset.action;
    hideCtxMenu();
    if (action === 'export') exportPNG();
    else if (action === 'toggle-dims') {
      showDims = !showDims;
      if (elToggleDims) elToggleDims.checked = showDims;
      draw();
    }
    else if (action === 'toggle-tail') {
      showTail = !showTail;
      if (elToggleTail) elToggleTail.checked = showTail;
      draw();
    }
    else if (action === 'reset') resetView();
    else if (action === 'copy-id') copyText(selWeld.id);
  });

  function resetView() {
    showDims = true; showTail = true;
    /* Wipe per-weld overrides — defaults will re-populate on next access */
    weldData = {};
    if (elToggleDims) elToggleDims.checked = true;
    if (elToggleTail) elToggleTail.checked = true;
    draw();
  }

  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s);
    }
  }

  /* ────────────────────────────────────────────────────────────────
     25. LEARNING PANELS — expand/collapse all
     ──────────────────────────────────────────────────────────────── */
  var elExpandAll   = document.getElementById('learn-expand-all');
  var elCollapseAll = document.getElementById('learn-collapse-all');
  function allLearnCards() { return document.querySelectorAll('.learn-panels .learn-card'); }
  if (elExpandAll) elExpandAll.addEventListener('click', function () {
    allLearnCards().forEach(function (c) { c.open = true; });
  });
  if (elCollapseAll) elCollapseAll.addEventListener('click', function () {
    allLearnCards().forEach(function (c) { c.open = false; });
  });

  /* ────────────────────────────────────────────────────────────────
     26. FIRST-TIME HINT (auto-dismiss after first interaction)
     ──────────────────────────────────────────────────────────────── */
  var elHint = document.getElementById('canvas-hint');
  function dismissHint() {
    if (hintDismissed || !elHint) return;
    hintDismissed = true;
    elHint.classList.add('hidden');
    setTimeout(function () { if (elHint) elHint.style.display = 'none'; }, 400);
  }
  ['click', 'contextmenu'].forEach(function (evt) {
    canvas.addEventListener(evt, dismissHint);
  });
  document.getElementById('weld-selector').addEventListener('click', dismissHint);

  /* ────────────────────────────────────────────────────────────────
     27. EXPLORE/UTILS VISIBILITY BY MODE
     ──────────────────────────────────────────────────────────────── */
  var origSwitchMode = switchMode;
  switchMode = function (m) {
    origSwitchMode(m);
    if (elExploreUtils) elExploreUtils.style.display = (m === 'explore') ? '' : 'none';
    /* Cursor class for canvas */
    canvas.classList.toggle('mode-quiz', m === 'quiz');
    canvas.classList.toggle('mode-practice', m === 'practice');
  };

  /* ────────────────────────────────────────────────────────────────
     28. INIT
     ──────────────────────────────────────────────────────────────── */
  buildWeldGrid();
  updatePlacementUI();
  updateInfo();
  /* Hide utils until explore mode confirmed (already explore by default) */
  if (elExploreUtils) elExploreUtils.style.display = (mode === 'explore') ? '' : 'none';
  fitCanvas();   /* sets up HiDPI canvas + first draw */

})();
