(function () {
  'use strict';

  /* roundRect polyfill for older browsers */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  /* ══════════════════════════════════════════════════════
     1.  ELEMENT DATABASE
  ══════════════════════════════════════════════════════ */
  var EL = {
    H:  { name:'Hydrogen',   sym:'H',  Z:1,  shells:[1],        group:1,  EN:2.20, ionCharge: 0, type:'nonmetal',  color:'#ff6b6b', nColor:'#cc2222' },
    He: { name:'Helium',     sym:'He', Z:2,  shells:[2],        group:18, EN:null, ionCharge: 0, type:'noble',     color:'#a8e6cf', nColor:'#52d68a' },
    Li: { name:'Lithium',    sym:'Li', Z:3,  shells:[2,1],      group:1,  EN:0.98, ionCharge:+1, type:'metal',     color:'#ffa07a', nColor:'#e05030' },
    Be: { name:'Beryllium',  sym:'Be', Z:4,  shells:[2,2],      group:2,  EN:1.57, ionCharge:+2, type:'metal',     color:'#90ee90', nColor:'#30a030' },
    B:  { name:'Boron',      sym:'B',  Z:5,  shells:[2,3],      group:13, EN:2.04, ionCharge:+3, type:'metalloid', color:'#deb887', nColor:'#aa7733' },
    C:  { name:'Carbon',     sym:'C',  Z:6,  shells:[2,4],      group:14, EN:2.55, ionCharge: 0, type:'nonmetal',  color:'#87ceeb', nColor:'#3060c0' },
    N:  { name:'Nitrogen',   sym:'N',  Z:7,  shells:[2,5],      group:15, EN:3.04, ionCharge: 0, type:'nonmetal',  color:'#6495ed', nColor:'#2244cc' },
    O:  { name:'Oxygen',     sym:'O',  Z:8,  shells:[2,6],      group:16, EN:3.44, ionCharge:-2, type:'nonmetal',  color:'#ff7f7f', nColor:'#cc0000' },
    F:  { name:'Fluorine',   sym:'F',  Z:9,  shells:[2,7],      group:17, EN:3.98, ionCharge:-1, type:'nonmetal',  color:'#7fff00', nColor:'#228b22' },
    Ne: { name:'Neon',       sym:'Ne', Z:10, shells:[2,8],      group:18, EN:null, ionCharge: 0, type:'noble',     color:'#ffb3de', nColor:'#cc44aa' },
    Na: { name:'Sodium',     sym:'Na', Z:11, shells:[2,8,1],    group:1,  EN:0.93, ionCharge:+1, type:'metal',     color:'#ffd700', nColor:'#cc9900' },
    Mg: { name:'Magnesium',  sym:'Mg', Z:12, shells:[2,8,2],    group:2,  EN:1.31, ionCharge:+2, type:'metal',     color:'#40e0d0', nColor:'#008080' },
    Al: { name:'Aluminum',   sym:'Al', Z:13, shells:[2,8,3],    group:13, EN:1.61, ionCharge:+3, type:'metal',     color:'#c0c0c0', nColor:'#606060' },
    Si: { name:'Silicon',    sym:'Si', Z:14, shells:[2,8,4],    group:14, EN:1.90, ionCharge: 0, type:'metalloid', color:'#a0a8b0', nColor:'#505860' },
    P:  { name:'Phosphorus', sym:'P',  Z:15, shells:[2,8,5],    group:15, EN:2.19, ionCharge: 0, type:'nonmetal',  color:'#ff8c00', nColor:'#cc4400' },
    S:  { name:'Sulfur',     sym:'S',  Z:16, shells:[2,8,6],    group:16, EN:2.58, ionCharge:-2, type:'nonmetal',  color:'#ffd700', nColor:'#cc9900' },
    Cl: { name:'Chlorine',   sym:'Cl', Z:17, shells:[2,8,7],    group:17, EN:3.16, ionCharge:-1, type:'nonmetal',  color:'#7fff00', nColor:'#228b22' },
    Ar: { name:'Argon',      sym:'Ar', Z:18, shells:[2,8,8],    group:18, EN:null, ionCharge: 0, type:'noble',     color:'#da70d6', nColor:'#9400d3' },
    K:  { name:'Potassium',  sym:'K',  Z:19, shells:[2,8,8,1],  group:1,  EN:0.82, ionCharge:+1, type:'metal',     color:'#f0e68c', nColor:'#aa8800' },
    Ca: { name:'Calcium',    sym:'Ca', Z:20, shells:[2,8,8,2],  group:2,  EN:1.00, ionCharge:+2, type:'metal',     color:'#98fb98', nColor:'#228b22' },
    Cr: { name:'Chromium',   sym:'Cr', Z:24, shells:[2,8,13,1], group:6,  EN:1.66, ionCharge:+3, type:'metal',     color:'#66b2ff', nColor:'#0055cc' },
    Mn: { name:'Manganese',  sym:'Mn', Z:25, shells:[2,8,13,2], group:7,  EN:1.55, ionCharge:+2, type:'metal',     color:'#e8a0bf', nColor:'#a0306a' },
    Fe: { name:'Iron',       sym:'Fe', Z:26, shells:[2,8,14,2], group:8,  EN:1.83, ionCharge:+3, type:'metal',     color:'#cd853f', nColor:'#8b4513' },
    Co: { name:'Cobalt',     sym:'Co', Z:27, shells:[2,8,15,2], group:9,  EN:1.88, ionCharge:+2, type:'metal',     color:'#4db6ac', nColor:'#00695c' },
    Ni: { name:'Nickel',     sym:'Ni', Z:28, shells:[2,8,16,2], group:10, EN:1.91, ionCharge:+2, type:'metal',     color:'#80cbc4', nColor:'#006050' },
    Cu: { name:'Copper',     sym:'Cu', Z:29, shells:[2,8,18,1], group:11, EN:1.90, ionCharge:+2, type:'metal',     color:'#b87333', nColor:'#7a4a1e' },
    Zn: { name:'Zinc',       sym:'Zn', Z:30, shells:[2,8,18,2], group:12, EN:1.65, ionCharge:+2, type:'metal',     color:'#ced1d7', nColor:'#6c7080' },
    Br: { name:'Bromine',    sym:'Br', Z:35, shells:[2,8,18,7], group:17, EN:2.96, ionCharge:-1, type:'nonmetal',  color:'#c04040', nColor:'#800000' },
    Se: { name:'Selenium',   sym:'Se', Z:34, shells:[2,8,18,6], group:16, EN:2.55, ionCharge:-2, type:'nonmetal',  color:'#ff8a65', nColor:'#bf360c' },
    Kr: { name:'Krypton',    sym:'Kr', Z:36, shells:[2,8,18,8], group:18, EN:null, ionCharge: 0, type:'noble',     color:'#ce93d8', nColor:'#7b1fa2' },
    Sr: { name:'Strontium',  sym:'Sr', Z:38, shells:[2,8,18,8,2],    group:2,  EN:0.95, ionCharge:+2, type:'metal',     color:'#f48fb1', nColor:'#c2185b' },
    Ag: { name:'Silver',     sym:'Ag', Z:47, shells:[2,8,18,18,1],   group:11, EN:1.93, ionCharge:+1, type:'metal',     color:'#e0e0e0', nColor:'#9e9e9e' },
    Cd: { name:'Cadmium',    sym:'Cd', Z:48, shells:[2,8,18,18,2],   group:12, EN:1.69, ionCharge:+2, type:'metal',     color:'#b2dfdb', nColor:'#00695c' },
    Sn: { name:'Tin',        sym:'Sn', Z:50, shells:[2,8,18,18,4],   group:14, EN:1.96, ionCharge:+2, type:'metal',     color:'#cfd8dc', nColor:'#455a64' },
    I:  { name:'Iodine',     sym:'I',  Z:53, shells:[2,8,18,18,7],   group:17, EN:2.66, ionCharge:-1, type:'nonmetal',  color:'#9400d3', nColor:'#660099' },
    Ba: { name:'Barium',     sym:'Ba', Z:56, shells:[2,8,18,18,8,2], group:2,  EN:0.89, ionCharge:+2, type:'metal',     color:'#fff176', nColor:'#f57f17' },
    Pb: { name:'Lead',       sym:'Pb', Z:82, shells:[2,8,18,32,18,4],group:14, EN:2.33, ionCharge:+2, type:'metal',     color:'#90a4ae', nColor:'#37474f' }
  };

  /* ══════════════════════════════════════════════════════
     2.  COMPOUND DATABASES
  ══════════════════════════════════════════════════════ */
  var COVALENT = [
    { id:'H2',   formula:'H₂',   name:'Hydrogen Gas',          el1:'H',  el2:'H',
      count1:1, count2:1, bondOrder:1, bondLabel:'Single Bond',   sharedPairs:1, lonePairs1:0, lonePairs2:0,
      ENdiff:0.00,
      why:'Each H atom has 1 valence electron and needs 1 more to reach the helium configuration (2 electrons). By sharing 1 pair, both H atoms achieve stability.',
      facts:['1 electron pair shared (2 electrons total)','Each H contributes 1 valence electron','Bond length: 74 pm — shortest covalent bond','Highly flammable; used in fuel cells & rockets'] },

    { id:'O2',   formula:'O₂',   name:'Oxygen Gas',            el1:'O',  el2:'O',
      count1:1, count2:1, bondOrder:2, bondLabel:'Double Bond',   sharedPairs:2, lonePairs1:2, lonePairs2:2,
      ENdiff:0.00,
      why:'Each O has 6 valence electrons and needs 2 more for its octet. Sharing 2 electron pairs (4 electrons) gives both O atoms a complete outer shell of 8.',
      facts:['2 electron pairs shared (4 electrons total)','Each O atom has 2 lone pairs after bonding','Double bond is stronger than a single bond','Essential for cellular respiration and combustion'] },

    { id:'N2',   formula:'N₂',   name:'Nitrogen Gas',          el1:'N',  el2:'N',
      count1:1, count2:1, bondOrder:3, bondLabel:'Triple Bond',   sharedPairs:3, lonePairs1:1, lonePairs2:1,
      ENdiff:0.00,
      why:'Each N has 5 valence electrons and needs 3 more. Sharing 3 pairs (6 electrons) gives both N atoms full octets. Triple bonds are among the strongest in chemistry.',
      facts:['3 electron pairs shared (6 electrons total)','Each N has 1 lone pair after bonding','Bond energy: 945 kJ/mol — very stable','Makes up 78% of Earth\'s atmosphere'] },

    { id:'H2O',  formula:'H₂O',  name:'Water',                 el1:'O',  el2:'H',
      count1:1, count2:2, bondOrder:1, bondLabel:'2 Single Bonds', sharedPairs:2, lonePairs1:2, lonePairs2:0,
      ENdiff:1.24,
      why:'O has 6 valence electrons and needs 2 more. Two H atoms each share 1 electron with O, satisfying O (gets 8e⁻) and each H (gets 2e⁻). The O atom retains 2 lone pairs.',
      facts:['2 O–H single bonds','O has 2 lone pairs pushing bond angle to 104.5°','Polar molecule due to EN difference (O 3.44 vs H 2.20)','High surface tension and specific heat from polarity'] },

    { id:'CO2',  formula:'CO₂',  name:'Carbon Dioxide',        el1:'C',  el2:'O',
      count1:1, count2:2, bondOrder:2, bondLabel:'2 Double Bonds', sharedPairs:4, lonePairs1:0, lonePairs2:2,
      ENdiff:0.89,
      why:'C has 4 valence electrons and needs 4 more. Each O needs 2 more. Two O atoms each form a double bond with C — sharing 2 pairs each — giving all atoms full octets.',
      facts:['2 C=O double bonds (4 shared pairs, 8 electrons)','Linear molecule — bond angle 180°','Each O atom has 2 lone pairs','Produced in combustion; causes the greenhouse effect'] },

    { id:'CH4',  formula:'CH₄',  name:'Methane',               el1:'C',  el2:'H',
      count1:1, count2:4, bondOrder:1, bondLabel:'4 Single Bonds', sharedPairs:4, lonePairs1:0, lonePairs2:0,
      ENdiff:0.35,
      why:'C has 4 valence electrons and needs 4 more for its octet. Four H atoms each share 1 electron with C, forming 4 single bonds — C gets 8e⁻, each H gets 2e⁻.',
      facts:['4 C–H single bonds','Tetrahedral shape — bond angle 109.5°','Nonpolar: C and H have similar electronegativities','Main component of natural gas; potent greenhouse gas'] },

    { id:'NH3',  formula:'NH₃',  name:'Ammonia',               el1:'N',  el2:'H',
      count1:1, count2:3, bondOrder:1, bondLabel:'3 Single Bonds', sharedPairs:3, lonePairs1:1, lonePairs2:0,
      ENdiff:0.84,
      why:'N has 5 valence electrons. Three H atoms each share 1 electron with N, giving N a full octet (5 + 3 = 8). N retains 1 lone pair.',
      facts:['3 N–H single bonds','N has 1 lone pair → pyramidal shape, 107°','Polar molecule (EN diff 0.84)','Used in fertilisers, cleaning products, and refrigeration'] },

    { id:'HCl',  formula:'HCl',  name:'Hydrogen Chloride',     el1:'H',  el2:'Cl',
      count1:1, count2:1, bondOrder:1, bondLabel:'Single Bond',   sharedPairs:1, lonePairs1:0, lonePairs2:3,
      ENdiff:0.96,
      why:'H needs 1 more electron; Cl has 7 valence electrons and needs 1 more. Both share 1 electron pair — H gets 2e⁻ (full shell), Cl gets 8e⁻ (full octet). Cl keeps 3 lone pairs.',
      facts:['1 H–Cl single bond','Cl has 3 lone pairs after bonding','Polar covalent: EN diff = 0.96 (Cl 3.16 vs H 2.20)','Fully ionises in water (HCl → H⁺ + Cl⁻) forming hydrochloric acid — a strong acid'] },

    { id:'Cl2',  formula:'Cl₂',  name:'Chlorine Gas',          el1:'Cl', el2:'Cl',
      count1:1, count2:1, bondOrder:1, bondLabel:'Single Bond',   sharedPairs:1, lonePairs1:3, lonePairs2:3,
      ENdiff:0.00,
      why:'Each Cl has 7 valence electrons and needs 1 more to complete its octet. Sharing 1 pair gives both Cl atoms 8 electrons. Each retains 3 lone pairs.',
      facts:['1 Cl–Cl single bond','Each Cl has 3 lone pairs','Yellow-green toxic gas at room temperature','Used in water treatment and as a disinfectant'] },

    { id:'CCl4', formula:'CCl₄', name:'Carbon Tetrachloride',  el1:'C',  el2:'Cl',
      count1:1, count2:4, bondOrder:1, bondLabel:'4 Single Bonds', sharedPairs:4, lonePairs1:0, lonePairs2:3,
      ENdiff:0.61,
      why:'C needs 4 electrons for its octet. Each Cl needs 1 more. Four Cl atoms each share 1 electron with C — C gets 8e⁻, each Cl gets 8e⁻ (retaining 3 lone pairs).',
      facts:['4 C–Cl single bonds','Tetrahedral shape — bond angle 109.5°','Each Cl has 3 lone pairs','Used as a solvent; now restricted due to ozone depletion'] }
  ];

  var IONIC = [
    { id:'NaCl',  formula:'NaCl',   name:'Sodium Chloride',     donor:'Na', acceptor:'Cl', count1:1, count2:1,
      nTransfer:1, gainN:1, donorQ:'+1', acceptorQ:'−1',
      why:'Na has 1 valence electron — easily lost. Cl has 7 and needs 1 more. Na transfers its electron to Cl, forming Na⁺ (neon configuration) and Cl⁻ (argon configuration). Opposite charges attract.',
      facts:['Na loses 1e⁻ → Na⁺ (2,8 — like Ne)','Cl gains 1e⁻ → Cl⁻ (2,8,8 — like Ar)','Common table salt; melting point 801 °C','Conducts electricity when dissolved (free Na⁺ and Cl⁻ ions)'] },

    { id:'MgO',   formula:'MgO',    name:'Magnesium Oxide',     donor:'Mg', acceptor:'O',  count1:1, count2:1,
      nTransfer:2, gainN:2, donorQ:'+2', acceptorQ:'−2',
      why:'Mg has 2 valence electrons. O needs 2 electrons to complete its octet. Mg transfers both electrons to O, forming Mg²⁺ and O²⁻.',
      facts:['Mg loses 2e⁻ → Mg²⁺ (like Ne configuration)','O gains 2e⁻ → O²⁻ (like Ne configuration)','Very high melting point: 2852 °C','Used as a refractory material, antacid, and nutritional supplement'] },

    { id:'CaF2',  formula:'CaF₂',  name:'Calcium Fluoride',    donor:'Ca', acceptor:'F',  count1:1, count2:2,
      nTransfer:2, gainN:1, donorQ:'+2', acceptorQ:'−1',
      why:'Ca has 2 valence electrons. Each F needs only 1. Ca transfers 1 electron to each of 2 F atoms, forming Ca²⁺ and 2 F⁻. Two F atoms are needed to balance the 2+ charge.',
      facts:['Ca loses 2e⁻ → Ca²⁺ (like Ar configuration)','Each F gains 1e⁻ → F⁻ (like Ne configuration)','2 F atoms balance the Ca²⁺ charge','Found naturally as fluorite mineral; used in steel-making'] },

    { id:'KBr',   formula:'KBr',    name:'Potassium Bromide',   donor:'K',  acceptor:'Br', count1:1, count2:1,
      nTransfer:1, gainN:1, donorQ:'+1', acceptorQ:'−1',
      why:'K has 1 valence electron — far from nucleus and weakly held. Br has 7 valence electrons and needs 1 more. K transfers its electron to Br, forming K⁺ and Br⁻.',
      facts:['K loses 1e⁻ → K⁺ (like Ar configuration)','Br gains 1e⁻ → Br⁻ (like Kr configuration)','Melting point: 734 °C','Used in medicine (anticonvulsant) and photography'] },

    { id:'LiF',   formula:'LiF',    name:'Lithium Fluoride',    donor:'Li', acceptor:'F',  count1:1, count2:1,
      nTransfer:1, gainN:1, donorQ:'+1', acceptorQ:'−1',
      why:'Li has 1 valence electron. F is the most electronegative element (EN 3.98) and needs 1 electron. Li transfers its electron to F — this has the highest EN difference of any diatomic compound (3.00).',
      facts:['Li loses 1e⁻ → Li⁺ (like He configuration)','F gains 1e⁻ → F⁻ (like Ne configuration)','EN difference = 3.00 — strongest ionic character','Used in nuclear reactors and high-performance lithium batteries'] },

    { id:'Al2O3', formula:'Al₂O₃', name:'Aluminum Oxide',      donor:'Al', acceptor:'O',  count1:2, count2:3,
      nTransfer:3, gainN:2, donorQ:'+3', acceptorQ:'−2',
      why:'Al has 3 valence electrons (forms Al³⁺). O needs 2 electrons (forms O²⁻). To balance: 2 Al atoms give 6e⁻ total; 3 O atoms accept 2e⁻ each = 6e⁻ total. Cross-multiplication: 2×3 = 3×2.',
      facts:['Each Al loses 3e⁻ → Al³⁺ (like Ne configuration)','Each O gains 2e⁻ → O²⁻ (like Ne configuration)','2 Al³⁺ + 3 O²⁻ → 6 electrons transferred total','Main component of corundum — rubies and sapphires are Al₂O₃'] },

    { id:'CaCl2', formula:'CaCl₂', name:'Calcium Chloride',    donor:'Ca', acceptor:'Cl', count1:1, count2:2,
      nTransfer:2, gainN:1, donorQ:'+2', acceptorQ:'−1',
      why:'Ca has 2 valence electrons. Each Cl needs 1 electron. Ca transfers 1 electron to each of 2 Cl atoms, forming Ca²⁺ and 2 Cl⁻. Two Cl atoms are required to balance the 2+ charge.',
      facts:['Ca loses 2e⁻ → Ca²⁺ (like Ar configuration)','Each Cl gains 1e⁻ → Cl⁻ (like Ar configuration)','2 Cl⁻ ions balance the Ca²⁺ charge','Used for road de-icing, food preservation (E509)'] },

    { id:'MgCl2', formula:'MgCl₂', name:'Magnesium Chloride',  donor:'Mg', acceptor:'Cl', count1:1, count2:2,
      nTransfer:2, gainN:1, donorQ:'+2', acceptorQ:'−1',
      why:'Mg has 2 valence electrons. Each Cl needs 1 electron. Mg transfers 1 electron to each of 2 Cl atoms, forming Mg²⁺ and 2 Cl⁻.',
      facts:['Mg loses 2e⁻ → Mg²⁺ (like Ne configuration)','Each Cl gains 1e⁻ → Cl⁻ (like Ar configuration)','2 Cl⁻ needed per Mg²⁺ for charge balance','Used as food additive (E511) and fireproofing agent'] },

    { id:'Na2O',  formula:'Na₂O',  name:'Sodium Oxide',        donor:'Na', acceptor:'O',  count1:2, count2:1,
      nTransfer:1, gainN:2, donorQ:'+1', acceptorQ:'−2',
      why:'O needs 2 electrons to complete its octet, but each Na only has 1 to give. Two Na atoms each transfer 1 electron to O, forming 2 Na⁺ and 1 O²⁻.',
      facts:['Each Na loses 1e⁻ → Na⁺ (like Ne configuration)','O gains 2e⁻ → O²⁻ (like Ne configuration)','2 Na needed to supply 2 electrons to 1 O','Reacts with water to form sodium hydroxide (NaOH)'] },

    { id:'K2S',   formula:'K₂S',   name:'Potassium Sulfide',   donor:'K',  acceptor:'S',  count1:2, count2:1,
      nTransfer:1, gainN:2, donorQ:'+1', acceptorQ:'−2',
      why:'S needs 2 electrons to complete its octet, but each K only has 1 to give. Two K atoms each transfer 1 electron to S, forming 2 K⁺ and 1 S²⁻.',
      facts:['Each K loses 1e⁻ → K⁺ (like Ar configuration)','S gains 2e⁻ → S²⁻ (like Ar configuration)','2 K atoms needed to supply 2 electrons to S','Used in photography, pharmaceuticals, and leather processing'] }
  ];

  /* ══════════════════════════════════════════════════════
     3.  DOM REFERENCES
  ══════════════════════════════════════════════════════ */
  var canvas       = document.getElementById('main-canvas');
  var ctx          = canvas.getContext('2d');
  var W = 1100, H = 610;   /* logical drawing space */

  /* Hi-DPI. The canvas carried fixed width="1100" height="610" attributes while
     the CSS stretches it to its card, so on a 2x display it presented 1100
     device pixels across ~1492 — a 1.36x upscale. Size the backing store to real
     device pixels and scale the context so the 1100x610 logical space is
     untouched. Every pointer handler in this tool is on a button or tab, none on
     the canvas, so there is no hit-test to move in lockstep. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var dW = canvas.getBoundingClientRect().width;
    if (!(dW > 40)) dW = W;
    canvas.width  = Math.round(dW * dpr);
    canvas.height = Math.round(dW * (H / W) * dpr);
    var s = (dW * dpr) / W;
    ctx.setTransform(s, 0, 0, s, 0, 0);
  }

  var modeTabs     = document.getElementById('mode-tabs');
  var bondTypeTabs = document.getElementById('bond-type-tabs');
  var compoundTabs = document.getElementById('compound-tabs');
  var btnSimulate  = document.getElementById('btn-simulate');
  var btnReset     = document.getElementById('btn-reset');
  var btnExport      = document.getElementById('btn-export');
  var btnSoundToggle = document.getElementById('btn-sound');
  var btnFreeze      = document.getElementById('btn-freeze');
  var btnValence     = document.getElementById('btn-valence');
  var btnBondPairs   = document.getElementById('btn-bond-pairs');
  var infoBox      = document.getElementById('info-box');
  var infoTitle    = document.getElementById('info-title');
  var infoGrid     = document.getElementById('info-grid');

  var exploreTabs  = document.getElementById('explore-tabs');
  var exploreCards = document.getElementById('explore-cards');

  var elSelector   = document.getElementById('element-selector');
  var selSlot1     = document.getElementById('sel-slot1');
  var selSlot2     = document.getElementById('sel-slot2');
  var btnTest      = document.getElementById('btn-test');
  var btnPracReset = document.getElementById('btn-prac-reset');
  var resultPanel  = document.getElementById('result-panel');

  var quizStart    = document.getElementById('quiz-start');
  var quizQuestion = document.getElementById('quiz-question');
  var quizResult   = document.getElementById('quiz-result');
  var btnQStart    = document.getElementById('btn-quiz-start');
  var btnQNext     = document.getElementById('btn-quiz-next');
  var btnQRetry    = document.getElementById('btn-quiz-retry');
  var qzScore      = document.getElementById('qz-score');
  var qzTotal      = document.getElementById('qz-total');
  var qzProg       = document.getElementById('qz-progress-bar');
  var qzCategory   = document.getElementById('qz-category');
  var qzText       = document.getElementById('qz-text');
  var qzOptions    = document.getElementById('qz-options');
  var qzFeedback   = document.getElementById('qz-feedback');
  var qrStars      = document.getElementById('qr-stars');
  var qrScore      = document.getElementById('qr-score');
  var qrRows       = document.getElementById('qr-rows');

  /* ══════════════════════════════════════════════════════
     4.  STATE
  ══════════════════════════════════════════════════════ */
  var mode         = 'simulate';
  var bondType     = 'covalent';
  var selectedId   = 'H2';
  var simPhase     = 'idle';   // idle | running | done
  var animStart    = 0;
  var ANIM_DUR     = 5500;     // ms total animation
  var t            = 0;        // accumulated seconds (for orbital animation)
  var lastTS       = 0;
  var rafId        = null;

  var pracEl1 = null, pracEl2 = null;
  var pracMode     = false;
  var dynamicCmp   = null;
  var exploreTab   = 'overview';

  var quizSet = [], quizIdx = 0, quizScore_ = 0, quizAnswered = false;
  var quizResults = [];   /* per-question boolean: true = correct */
  var showGrid        = true;
  var soundOn         = true;
  var ctxMenuEl       = null;
  var freezeElectrons  = false;
  var showValenceOnly  = false;   /* valence-only electron display toggle */
  var showBondPairsOnly = false;  /* bond-pairs-only: hide lone pairs + inner shells */
  var atomHits         = [];      /* nucleus hit-areas built each frame for hover tooltip */
  var mouseX           = -9999;   /* canvas-space mouse coords */
  var mouseY           = -9999;

  /* ══════════════════════════════════════════════════════
     5.  HELPERS
  ══════════════════════════════════════════════════════ */
  function lerp(a, b, u) { return a + (b - a) * u; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeInOut(u) { return u < .5 ? 2*u*u : -1+(4-2*u)*u; }
  function easeOut3(u) { return 1 - Math.pow(1 - u, 3); }
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function sub(n) {
    var s = ['','','₂','₃','₄','₅','₆','₇','₈'];
    return (n < s.length) ? s[n] : String(n);
  }

  /* ══════════════════════════════════════════════════════
     5b. SOUND ENGINE  (Web Audio API — no external files)
  ══════════════════════════════════════════════════════ */
  var audioCtx_ = null;
  function getAC() {
    if (!soundOn) return null;
    if (!audioCtx_) {
      try { audioCtx_ = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (audioCtx_.state === 'suspended') audioCtx_.resume();
    return audioCtx_;
  }

  /* Ionic: electric crackle — filtered white noise burst */
  function playIonicSound() {
    var ac = getAC(); if (!ac) return;
    var t0   = ac.currentTime;
    var sr   = ac.sampleRate;
    var buf  = ac.createBuffer(1, sr * 0.3, sr);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
    var src  = ac.createBufferSource(); src.buffer = buf;
    var filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 3000; filt.Q.value = 2.5;
    var gain = ac.createGain(); gain.gain.setValueAtTime(0.18, t0); gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    src.connect(filt); filt.connect(gain); gain.connect(ac.destination);
    src.start(t0);
  }

  /* Covalent: soft resonant hum — two sine oscillators a perfect 5th apart */
  function playCovalentSound() {
    var ac = getAC(); if (!ac) return;
    var t0 = ac.currentTime;
    [330, 495].forEach(function(freq) {
      var osc  = ac.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.055, t0 + 0.35);
      gain.gain.linearRampToValueAtTime(0.001, t0 + 1.1);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t0); osc.stop(t0 + 1.15);
    });
  }

  function playBondSound(type) {
    if (type === 'ionic') playIonicSound();
    else playCovalentSound();
  }

  /* ══════════════════════════════════════════════════════
     5c. CONTEXT MENU
  ══════════════════════════════════════════════════════ */
  function hideCtxMenu() {
    if (ctxMenuEl) { ctxMenuEl.remove(); ctxMenuEl = null; }
  }

  function showCtxMenu(x, y, items) {
    hideCtxMenu();
    ctxMenuEl = document.createElement('div');
    ctxMenuEl.className = 'cb-ctx-menu';
    var menuW = 192, itemH = 38;
    ctxMenuEl.style.left = Math.min(x, window.innerWidth  - menuW - 8) + 'px';
    ctxMenuEl.style.top  = Math.min(y, window.innerHeight - items.length * itemH - 8) + 'px';
    items.forEach(function(item) {
      var btn = document.createElement('button');
      btn.className   = 'cb-ctx-item';
      btn.textContent = item.label;
      if (item.danger) btn.classList.add('cb-ctx-danger');
      btn.addEventListener('pointerdown', function(e) { e.stopPropagation(); hideCtxMenu(); item.action(); });
      ctxMenuEl.appendChild(btn);
    });
    document.body.appendChild(ctxMenuEl);
  }

  document.addEventListener('pointerdown', hideCtxMenu);

  /* ══════════════════════════════════════════════════════
     5d. EXPORT PNG
  ══════════════════════════════════════════════════════ */
  function exportPNG() {
    /* Watermark drawn on top of current frame */
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 12px sans-serif';
    ctx.textAlign   = 'right';
    ctx.textBaseline= 'bottom';
    ctx.fillText('NHIT VisualLab', W - 12, H - 10);
    ctx.restore();

    var cmp   = getCmp();
    var label = (cmp.formula || 'bond').replace(/[₁₂₃₄₅₆₇₈]/g, function(c) {
      return ({'₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8'})[c] || c;
    }).replace(/[^\w-]/g, '');
    var link  = document.createElement('a');
    link.download = 'chemical-bond-' + (label || 'simulation') + '.png';
    link.href     = canvas.toDataURL('image/png');
    link.click();
  }

  function getCmp() {
    if (pracMode && dynamicCmp) return dynamicCmp;
    var arr = bondType === 'covalent' ? COVALENT : IONIC;
    for (var i = 0; i < arr.length; i++) if (arr[i].id === selectedId) return arr[i];
    return arr[0];
  }

  /* shell radii shrink as atom gets more shells so it fits on canvas */
  function shellRadii(n) {
    var bases = [[50],[50,80],[46,70,96],[38,58,78,98],[32,50,68,86,104],[28,44,60,76,92,108]];
    return bases[Math.min(n - 1, 5)];
  }

  /* ══════════════════════════════════════════════════════
     6.  BOHR MODEL RENDERER
  ══════════════════════════════════════════════════════ */
  function drawAtom(cx, cy, sym, opts) {
    opts = opts || {};
    var el       = EL[sym];
    if (!el) return;
    var shells   = el.shells;
    var ns       = shells.length;
    var radii    = shellRadii(ns);
    var sc       = opts.scale  || 1;
    var alpha    = (opts.alpha !== undefined) ? opts.alpha : 1;
    var tVal     = opts.t || 0;
    /* ionic transfer props */
    var loseN    = opts.loseN    || 0;   // how many valence e- to fade out
    var loseP    = opts.loseP    || 0;   // fade progress 0→1
    var gainN    = opts.gainN    || 0;   // how many extra e- on valence shell
    var gainP    = opts.gainP    || 0;   // gain progress 0→1

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);

    /* orbital speed per shell (inner faster) */
    var speeds = [1.2, 0.75, 0.48, 0.30, 0.20];

    /* ── draw orbit rings ── */
    for (var s = 0; s < ns; s++) {
      var r = radii[s];
      var isVal = (s === ns - 1);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = isVal ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.28)';
      ctx.lineWidth   = isVal ? 1.8 / sc : 1.1 / sc;
      if (isVal) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      /* shell label */
      ctx.fillStyle = isVal ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.38)';
      ctx.font = (10 / sc) + 'px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('n=' + (s + 1), r + 4, -3);
    }

    /* ── nucleus glow ── */
    var nr = Math.min(26 + Math.log(el.Z + 1) * 4.5, 38);
    /* register for hover tooltip (canvas-space coords, not local) */
    atomHits.push({ cx: cx, cy: cy, nr: nr, sym: sym });
    var ng = ctx.createRadialGradient(0, 0, 0, 0, 0, nr * 2);
    ng.addColorStop(0,   el.nColor + 'cc');
    ng.addColorStop(0.5, el.nColor + '44');
    ng.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(0, 0, nr * 2, 0, Math.PI * 2);
    ctx.fillStyle = ng;
    ctx.fill();

    /* ── nucleus body ── */
    var ng2 = ctx.createRadialGradient(-nr * .3, -nr * .3, 0, 0, 0, nr);
    ng2.addColorStop(0, el.color);
    ng2.addColorStop(1, el.nColor);
    ctx.beginPath();
    ctx.arc(0, 0, nr, 0, Math.PI * 2);
    ctx.fillStyle = ng2;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5 / sc;
    ctx.stroke();

    /* ── nucleus text: Z (top-left) · symbol (centre) · ion charge (bottom) ── */
    var chargeStr   = opts.chargeStr   || null;
    var chargeAlpha = (opts.chargeAlpha !== undefined) ? opts.chargeAlpha : 0;
    var hasCharge   = !!(chargeStr && chargeAlpha > 0);

    ctx.textBaseline = 'middle';
    /* drop shadow for all nucleus text — ensures readability on any nucleus colour */
    ctx.shadowColor  = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur   = 4;

    /* atomic number — top-left corner */
    ctx.font      = Math.round(Math.max(9, nr * 0.36) / sc) + 'px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(el.Z, -nr * 0.70, -nr * 0.62);
    ctx.textAlign = 'center';

    /* element symbol — nudge up when charge label will occupy the bottom */
    var symShift = hasCharge ? -nr * 0.18 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold ' + Math.round(Math.max(14, nr * 0.62) / sc) + 'px sans-serif';
    ctx.fillText(el.sym, 0, symShift);

    /* ion charge — bottom of nucleus, colour-coded, fades in */
    if (hasCharge) {
      var isPos = chargeStr.charAt(0) === '+';
      ctx.save();
      ctx.globalAlpha *= chargeAlpha;
      ctx.shadowBlur  = 5;
      ctx.font        = 'bold ' + Math.round(Math.max(10, nr * 0.45) / sc) + 'px sans-serif';
      ctx.fillStyle   = isPos ? '#ff9090' : '#78d8ff';
      ctx.fillText(chargeStr, 0, nr * 0.46);
      ctx.restore();
    }

    /* reset shadow */
    ctx.shadowBlur  = 0;
    ctx.shadowColor = 'transparent';

    /* ── electrons ── */
    for (var s = 0; s < ns; s++) {
      var r     = radii[s];
      var cnt   = shells[s];
      var spd   = speeds[Math.min(s, 4)];
      var isVal = (s === ns - 1);

      /* valence-only mode: skip inner-shell electron dots (orbit rings still drawn) */
      if (showValenceOnly && !isVal) continue;

      /* bond-pairs-only mode: skip ALL orbital electron dots
         (shared/flying electrons are drawn outside drawAtom and survive automatically) */
      if (!showBondPairsOnly) {
        for (var e = 0; e < cnt; e++) {
          /* angle: even spacing + orbital motion + jiggle */
          var baseA = (e / cnt) * Math.PI * 2;
          var jig   = Math.sin(tVal * 3.5 + e * 1.9 + s * 1.1) * 0.06;
          var ang   = baseA + tVal * spd + jig;

          var ex = Math.cos(ang) * r;
          var ey = Math.sin(ang) * r;

          /* fade for donor's transferring electrons */
          var eAlpha = 1;
          if (isVal && loseP > 0 && e < loseN) eAlpha = 1 - loseP;

          ctx.save();
          ctx.globalAlpha *= eAlpha;

          /* electron glow */
          var eGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
          eGlow.addColorStop(0, isVal ? el.color : '#aac0e0');
          eGlow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(ex, ey, 9, 0, Math.PI * 2);
          ctx.fillStyle = eGlow;
          ctx.fill();

          /* electron dot */
          ctx.beginPath();
          ctx.arc(ex, ey, isVal ? 4.5 : 3.8, 0, Math.PI * 2);
          ctx.fillStyle = isVal ? el.color : '#8ba8cc';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = .9 / sc;
          ctx.stroke();

          ctx.restore();
        }
      } /* end !showBondPairsOnly */

      /* gained electrons (acceptor, ionic) */
      if (isVal && gainP > 0 && gainN > 0) {
        var existCnt = cnt;
        for (var ge = 0; ge < gainN; ge++) {
          var gFrac = (existCnt + ge) / (existCnt + gainN);
          var gAng  = gFrac * Math.PI * 2 + tVal * spd + 0.4;
          var gx = Math.cos(gAng) * r;
          var gy = Math.sin(gAng) * r;

          ctx.save();
          ctx.globalAlpha *= gainP;

          var ggGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12);
          ggGlow.addColorStop(0, '#ffd740');
          ggGlow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(gx, gy, 12, 0, Math.PI * 2);
          ctx.fillStyle = ggGlow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(gx, gy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd740';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,230,80,0.8)';
          ctx.lineWidth = 1 / sc;
          ctx.stroke();

          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     7.  BACKGROUND
  ══════════════════════════════════════════════════════ */
  function drawBg() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#09101e');
    bg.addColorStop(1, '#060c16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* subtle grid (toggled via right-click menu) — batched into one stroke call */
    if (showGrid) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= W; gx += 50) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0; gy <= H; gy += 50) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();
    }
  }

  /* atom labels below */
  function drawAtomLabel(cx, bottomY, el, valStr) {
    ctx.textAlign = 'center';
    ctx.fillStyle = el.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(el.name, cx, bottomY + 6);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px sans-serif';
    ctx.fillText(valStr, cx, bottomY + 24);
  }

  /* ══════════════════════════════════════════════════════
     7b. NUCLEUS HOVER TOOLTIP
  ══════════════════════════════════════════════════════ */
  function drawNucleusTooltip() {
    if (mouseX < -999) return;
    for (var i = 0; i < atomHits.length; i++) {
      var h  = atomHits[i];
      var dx = mouseX - h.cx, dy = mouseY - h.cy;
      if (dx * dx + dy * dy > h.nr * h.nr) continue;
      var el = EL[h.sym];
      if (!el) continue;

      /* build info lines */
      var config  = el.shells.map(function(c, idx) { return 'n' + (idx + 1) + ':' + c; }).join('  ');
      var ionStr  = el.ionCharge > 0 ? '+' + el.ionCharge : (el.ionCharge < 0 ? '' + el.ionCharge : 'neutral');
      var enStr   = el.EN ? el.EN.toFixed(2) : 'N/A';
      var typeStr = el.type.charAt(0).toUpperCase() + el.type.slice(1);
      var valE    = el.shells[el.shells.length - 1];
      /* ion charge colour on light bg */
      var ionCol  = el.ionCharge > 0 ? '#c0392b' : (el.ionCharge < 0 ? '#1565c0' : '#555');

      var lines = [
        { text: el.name,                                              size: 15, bold: true,  color: el.nColor || el.color },
        { text: el.sym + '   \u00b7   Z = ' + el.Z,                  size: 12, bold: false, color: '#2c3a54' },
        { text: 'Config:  ' + config,                                 size: 11, bold: false, color: '#3d4e6a' },
        { text: 'Valence e\u207B: ' + valE + '   \u00b7   Type: ' + typeStr, size: 11, bold: false, color: '#3d4e6a' },
        { text: 'Electronegativity: ' + enStr,                        size: 11, bold: false, color: '#3d4e6a' },
        { text: 'Ion charge: ' + ionStr,                              size: 11, bold: true,  color: ionCol }
      ];

      /* transition metals (d-block, groups 3–12): the valence count above is
         only the outer s-electrons — d-electrons also take part in bonding,
         which is why Fe forms both Fe²⁺ and Fe³⁺. Flag this to avoid confusion. */
      if (el.group >= 3 && el.group <= 12) {
        lines.push({ text: 'Note: d-electrons also bond', size: 11, bold: false, color: '#7a5b2a' });
      }

      var padX = 14, padY = 10, lineH = 19, accentW = 4, ttW = 220;
      var ttH  = padY * 2 + lines.length * lineH;

      /* position: prefer right of nucleus, clamp to canvas edges */
      var tx = h.cx + h.nr + 14;
      var ty = h.cy - ttH / 2;
      if (tx + ttW > W - 6) tx = h.cx - h.nr - ttW - 14;
      if (ty < 6)            ty = 6;
      if (ty + ttH > H - 6)  ty = H - ttH - 6;

      ctx.save();

      /* ── drop shadow ── */
      ctx.shadowColor = 'rgba(0,0,0,0.30)';
      ctx.shadowBlur  = 12;
      ctx.shadowOffsetY = 3;

      /* ── white background (beginPath REQUIRED before each roundRect) ── */
      ctx.beginPath();
      ctx.roundRect(tx, ty, ttW, ttH, 9);
      ctx.fillStyle = 'rgba(250,252,255,0.97)';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur  = 0;
      ctx.shadowOffsetY = 0;

      /* ── coloured border ── */
      ctx.beginPath();
      ctx.roundRect(tx, ty, ttW, ttH, 9);
      ctx.strokeStyle = el.color;
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      /* ── colour accent bar on left edge ── */
      ctx.beginPath();
      ctx.roundRect(tx, ty, accentW, ttH, [9, 0, 0, 9]);
      ctx.fillStyle = el.color;
      ctx.fill();

      /* ── text lines ── */
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      var ly = ty + padY;
      for (var j = 0; j < lines.length; j++) {
        var ln = lines[j];
        ctx.font      = (ln.bold ? 'bold ' : '') + ln.size + 'px sans-serif';
        ctx.fillStyle = ln.color;
        ctx.fillText(ln.text, tx + padX + accentW, ly);
        ly += lineH;
      }

      ctx.restore();
      break; /* one tooltip at a time */
    }
  }

  /* ══════════════════════════════════════════════════════
     8.  IDLE PHASE
  ══════════════════════════════════════════════════════ */
  function drawIdle() {
    var cmp = getCmp();
    drawBg();

    var isCov = bondType === 'covalent';
    var el1Sym = isCov ? cmp.el1 : cmp.donor;
    var el2Sym = isCov ? cmp.el2 : cmp.acceptor;
    var el1 = EL[el1Sym], el2 = EL[el2Sym];

    var ax1 = W * 0.23, ax2 = W * 0.77, ay = H * 0.44;

    drawAtom(ax1, ay, el1Sym, { t: t });
    drawAtom(ax2, ay, el2Sym, { t: t + 2 });

    var rad1 = shellRadii(el1.shells.length);
    var rad2 = shellRadii(el2.shells.length);
    var bot1 = ay + rad1[rad1.length - 1] + 8;
    var bot2 = ay + rad2[rad2.length - 1] + 8;

    drawAtomLabel(ax1, bot1, el1,
      'Valence e⁻: ' + el1.shells[el1.shells.length - 1] + '  |  Z = ' + el1.Z);
    drawAtomLabel(ax2, bot2, el2,
      'Valence e⁻: ' + el2.shells[el2.shells.length - 1] + '  |  Z = ' + el2.Z);

    /* center prompt */
    var btc = isCov ? '#1de9b6' : '#ff6e40';
    ctx.save();
    ctx.globalAlpha = .85 + .15 * Math.sin(t * 1.8);
    ctx.fillStyle = btc + '28';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 110, H / 2 - 18, 220, 34, 8);
    ctx.fill();
    ctx.fillStyle = btc;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCov ? '⚛ Covalent Bond' : '⚡ Ionic Bond', W / 2, H / 2 - 1);
    ctx.restore();

    /* Dynamic hint: guide user based on practice selection state */
    var hintMsg;
    if (pracEl1 && pracEl2) {
      hintMsg = '⚛ Click "Test Bond" in the left panel to animate your compound';
    } else if (pracEl1) {
      hintMsg = '← Select Element 2 in the left panel to continue';
    } else {
      hintMsg = '▶ Click Simulate to see bonding  ·  Right-click for options';
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '13px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(hintMsg, W / 2, H / 2 + 22);
  }

  /* ══════════════════════════════════════════════════════
     9.  COVALENT ANIMATION
  ══════════════════════════════════════════════════════ */

  /* ── Helper: draw one generalised covalent bond at any angle ──
     (x1,y1)→(x2,y2) are atom CENTRES; orb1/orb2 are orbital radii.
     nb  = bond order (1/2/3); nse = shared electrons to animate (= nb×2).
     p3  = bond progress 0→1.  col1, col2 = hex colour strings.          */
  function _drawOneBond(x1, y1, x2, y2, orb1, orb2, nb, p3, col1, col2, nse) {
    var dx = x2 - x1, dy = y2 - y1;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    var cosA = dx / dist, sinA = dy / dist;  /* unit vector along bond   */
    var perpX = -sinA,   perpY =  cosA;      /* unit vector perpendicular */

    /* surface-to-surface endpoints of the bond line */
    var x1e = x1 + orb1 * cosA, y1e = y1 + orb1 * sinA;
    var x2e = x2 - orb2 * cosA, y2e = y2 - orb2 * sinA;

    /* bond lines (multiple for double/triple) */
    var a16  = Math.round(p3 * 255).toString(16).padStart(2, '0');
    var lnGap = nb > 1 ? 7 : 0;
    for (var b = 0; b < nb; b++) {
      var off  = (b - (nb - 1) / 2) * lnGap;
      var lx1  = x1e + perpX * off, ly1 = y1e + perpY * off;
      var lx2  = x2e + perpX * off, ly2 = y2e + perpY * off;
      var grd  = ctx.createLinearGradient(lx1, ly1, lx2, ly2);
      grd.addColorStop(0,   col1 + a16);
      grd.addColorStop(0.5, '#ffd740' + a16);
      grd.addColorStop(1,   col2 + a16);
      ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2);
      ctx.strokeStyle = grd; ctx.lineWidth = 2.5; ctx.stroke();
    }

    /* shared electrons — oscillate along bond axis with perpendicular wiggle */
    var gapPx    = dist - orb1 - orb2;
    var seHalf   = Math.max(10, gapPx / 2 - 12);
    var seCX     = (x1e + x2e) / 2;
    var seCY     = (y1e + y2e) / 2;
    var seGR     = Math.max(7,   14  - (nse - 2));
    var seDot    = Math.max(3.5, 5   - (nse - 2) * 0.3);
    ctx.save();
    ctx.globalAlpha = p3;
    for (var se = 0; se < nse; se++) {
      var phase  = t * 1.8 + se * (Math.PI / nse);
      var along  = Math.cos(phase) * seHalf;
      var perp   = Math.sin(phase * 1.5 + se * 0.7) * 14;
      var seX    = seCX + along * cosA + perp * perpX;
      var seY    = seCY + along * sinA + perp * perpY;
      var seGlow = ctx.createRadialGradient(seX, seY, 0, seX, seY, seGR);
      seGlow.addColorStop(0, '#ffd740'); seGlow.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(seX, seY, seGR, 0, Math.PI * 2);
      ctx.fillStyle = seGlow; ctx.fill();
      ctx.beginPath(); ctx.arc(seX, seY, seDot, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd740'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,100,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }

  function drawCovalent(prog) {
    var cmp  = getCmp();
    var el1  = EL[cmp.el1], el2 = EL[cmp.el2];
    var r1   = shellRadii(el1.shells.length), r2 = shellRadii(el2.shells.length);
    var orb1 = r1[r1.length - 1], orb2 = r2[r2.length - 1];
    var nA   = cmp.count2 || 1;   /* number of peripheral el2 atoms */

    drawBg();

    /* Phase split: 0→.2 appear, .2→.55 approach, .55→.80 bond, .80→1 result */
    var p1  = clamp(prog / .20, 0, 1);
    var p2  = clamp((prog - .20) / .35, 0, 1);
    var p3  = clamp((prog - .55) / .25, 0, 1);
    var p4  = clamp((prog - .80) / .20, 0, 1);

    if (nA === 1) {
      /* ══ SINGLE-PARTNER: existing linear layout (unchanged) ══ */
      var maxSep = Math.min(W * 0.27, 300), bondSep = Math.max(orb1, orb2) + 60;
      var sep    = lerp(maxSep, bondSep, easeInOut(p2));
      var ax1    = W / 2 - sep, ax2 = W / 2 + sep, ay = H * 0.42;

      drawAtom(ax1, ay, cmp.el1, { t: t, alpha: easeOut3(p1), loseN: cmp.sharedPairs, loseP: p3 });
      drawAtom(ax2, ay, cmp.el2, { t: t + 1.8, alpha: easeOut3(p1), loseN: cmp.bondOrder, loseP: p3 });

      if (p1 > .4) {
        ctx.save();
        ctx.globalAlpha = (p1 - .4) / .6;
        drawAtomLabel(ax1, ay + orb1 + 6, el1,
          'Valence: ' + el1.shells[el1.shells.length-1] + ' e⁻  |  Z = ' + el1.Z);
        drawAtomLabel(ax2, ay + orb2 + 6, el2,
          'Valence: ' + el2.shells[el2.shells.length-1] + ' e⁻  |  Z = ' + el2.Z);
        ctx.restore();
      }

      if (p3 > 0) {
        var nb   = cmp.bondOrder;
        var gap  = nb > 1 ? 7 : 0;
        var x1e  = ax1 + (orb1 + 6), x2e = ax2 - (orb2 + 6);
        var a16 = Math.round(p3 * 255).toString(16).padStart(2, '0');
        for (var b = 0; b < nb; b++) {
          var by = ay + (b - (nb - 1) / 2) * gap;
          var grd = ctx.createLinearGradient(x1e, by, x2e, by);
          grd.addColorStop(0,   el1.color + a16);
          grd.addColorStop(0.5, '#ffd740' + a16);
          grd.addColorStop(1,   el2.color + a16);
          ctx.beginPath();
          ctx.moveTo(x1e, by);
          ctx.lineTo(x2e, by);
          ctx.strokeStyle = grd;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        var nse = cmp.sharedPairs * 2;
        var seCenter = (ax1 + orb1 + ax2 - orb2) / 2;
        var seHalf   = Math.max(10, (ax2 - orb2 - ax1 - orb1) / 2 - 12);
        var seGR  = Math.max(7, 14 - (nse - 2));
        var seDot = Math.max(3.5, 5 - (nse - 2) * 0.3);
        ctx.save();
        ctx.globalAlpha = p3;
        for (var se = 0; se < nse; se++) {
          var phase = (t * 1.8 + se * (Math.PI / nse));
          var seX   = seCenter + Math.cos(phase) * seHalf;
          var seY   = ay + Math.sin(phase * 1.5 + se * 0.7) * 14;
          var seGlow = ctx.createRadialGradient(seX, seY, 0, seX, seY, seGR);
          seGlow.addColorStop(0, '#ffd740');
          seGlow.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(seX, seY, seGR, 0, Math.PI * 2);
          ctx.fillStyle = seGlow; ctx.fill();
          ctx.beginPath(); ctx.arc(seX, seY, seDot, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd740'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,240,100,0.7)'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.restore();

        if (p3 > .5) {
          ctx.save();
          ctx.globalAlpha = (p3 - .5) * 2;
          ctx.fillStyle = '#ffd740';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(cmp.bondLabel + ' — ' + cmp.sharedPairs + ' shared pair' + (cmp.sharedPairs > 1 ? 's' : ''), W / 2, ay - Math.max(orb1, orb2) - 12);
          ctx.restore();
        }
      }

    } else {
      /* ══ MULTI-PARTNER: hub-and-spoke layout ══
         el1 = central atom, stays at canvas centre (cx, cy).
         nA el2 atoms radiate outward at equal angles; they approach during p2.

         Geometries (all keep atoms inside 900×500 canvas):
           count2=2  linear  → angles [π, 0]   (left & right)
           count2=3  trigonal → angles [0, 2π/3, 4π/3]
           count2=4  butterfly → angles [±da, π±da] where da≈28°          */
      var cy      = H * (nA > 2 ? 0.47 : 0.42);
      var cx      = W / 2;
      var bondSepM = orb1 + orb2 + (nA > 2 ? 32 : 55);
      /* maxSepM scales with canvas so atoms fan out proportionally to available space */
      var maxSepM  = nA > 2
        ? Math.min(H * 0.37, bondSepM + 120)   /* height-limited for 3/4 atoms */
        : Math.min(W * 0.24, bondSepM + 120);   /* width-limited for 2 atoms    */
      var sepM     = lerp(maxSepM, bondSepM, easeInOut(p2));

      var angles;
      if (nA === 2) {
        angles = [Math.PI, 0];
      } else if (nA === 3) {
        angles = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
      } else {
        var da = Math.PI / 6.5;   /* ≈27.7° — butterfly, avoids top/bottom clip */
        angles = [-da, da, Math.PI - da, Math.PI + da];
      }

      /* central atom (el1) */
      drawAtom(cx, cy, cmp.el1, { t: t, alpha: easeOut3(p1), loseN: cmp.sharedPairs, loseP: p3 });

      /* peripheral atoms (el2 × nA) */
      for (var i = 0; i < nA; i++) {
        var ex = cx + Math.cos(angles[i]) * sepM;
        var ey = cy + Math.sin(angles[i]) * sepM;
        drawAtom(ex, ey, cmp.el2, { t: t + 1.8 + i * 1.1, alpha: easeOut3(p1), loseN: cmp.bondOrder, loseP: p3 });
      }

      /* labels */
      if (p1 > .4) {
        ctx.save();
        ctx.globalAlpha = (p1 - .4) / .6;
        drawAtomLabel(cx, cy + orb1 + 6, el1,
          'Valence: ' + el1.shells[el1.shells.length-1] + ' e⁻  |  Z = ' + el1.Z);
        /* one el2 label on rightmost atom with ×N count */
        var lblIdx = (nA === 4) ? 1 : (nA === 3 ? 0 : 1);   /* lower-right or rightmost */
        var lx = cx + Math.cos(angles[lblIdx]) * sepM;
        var ly = cy + Math.sin(angles[lblIdx]) * sepM;
        drawAtomLabel(lx, ly + orb2 + 6, el2,
          'Valence: ' + el2.shells[el2.shells.length-1] + ' e⁻  |  Z = ' + el2.Z +
          '  (×' + nA + ')');
        ctx.restore();
      }

      /* bonds: one per el2 atom — uses the generalised _drawOneBond helper */
      if (p3 > 0) {
        var nsePerBond = cmp.bondOrder * 2;
        for (var i = 0; i < nA; i++) {
          var ex = cx + Math.cos(angles[i]) * sepM;
          var ey = cy + Math.sin(angles[i]) * sepM;
          _drawOneBond(cx, cy, ex, ey, orb1, orb2, cmp.bondOrder, p3, el1.color, el2.color, nsePerBond);
        }
        if (p3 > .5) {
          ctx.save();
          ctx.globalAlpha = (p3 - .5) * 2;
          ctx.fillStyle = '#ffd740';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(cmp.bondLabel + ' — ' + cmp.sharedPairs + ' shared pair' + (cmp.sharedPairs > 1 ? 's' : ''), cx, 14);
          ctx.restore();
        }
      }
    }

    /* compound result banner (shared) */
    if (p4 > 0) {
      ctx.save();
      ctx.globalAlpha = easeOut3(p4);
      var bY = H - 86;
      ctx.fillStyle = 'rgba(29,233,182,.12)';
      ctx.strokeStyle = 'rgba(29,233,182,.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 170, bY, 340, 58, 12);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1de9b6';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cmp.formula, W / 2, bY + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '13px sans-serif';
      ctx.fillText(cmp.name + '  ·  Covalent compound', W / 2, bY + 42);
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════════════════════
     10.  IONIC ANIMATION
  ══════════════════════════════════════════════════════ */
  function drawIonic(prog) {
    var cmp       = getCmp();
    var donorEl   = EL[cmp.donor];
    var acceptEl  = EL[cmp.acceptor];
    var r1 = shellRadii(donorEl.shells.length);
    var r2 = shellRadii(acceptEl.shells.length);
    var orb1 = r1[r1.length - 1], orb2 = r2[r2.length - 1];

    /* ── atom counts from compound data (count1 = donor atoms, count2 = acceptor atoms) ── */
    var nD = cmp.count1 || 1;
    var nA = cmp.count2 || 1;
    /* vertical spacing — scale with canvas height so larger canvas gives more room */
    var vSpacD = nD > 1 ? Math.min(2 * orb1 + 16, nD > 2 ? H * 0.16 : H * 0.21) : 0;
    var vSpacA = nA > 1 ? Math.min(2 * orb2 + 16, nA > 2 ? H * 0.16 : H * 0.21) : 0;

    drawBg();

    /* phases: 0→.18 appear, .18→.55 transfer, .55→.78 charges, .78→1 attract+result */
    var p1 = clamp(prog / .18, 0, 1);
    var p2 = clamp((prog - .18) / .37, 0, 1);  /* transfer */
    var p3 = clamp((prog - .55) / .23, 0, 1);  /* charges  */
    var p4 = clamp((prog - .78) / .22, 0, 1);  /* attract  */

    var startSep = Math.min(W * 0.265, 310);
    var endSep   = Math.max(orb1, orb2) + 75;
    var sep      = lerp(startSep, endSep, easeInOut(p4));

    var ax1 = W / 2 - sep, ax2 = W / 2 + sep, ay = H * 0.40;

    /* y-centre of the i-th donor / j-th acceptor atom in the stacked column */
    var donorY    = function(i) { return ay + (i - (nD - 1) / 2) * vSpacD; };
    var acceptorY = function(j) { return ay + (j - (nA - 1) / 2) * vSpacA; };

    /* ── draw all donor atoms ── */
    for (var di = 0; di < nD; di++) {
      drawAtom(ax1, donorY(di), cmp.donor, {
        t: t + di * 1.3,
        alpha:       easeOut3(p1),
        loseN:       cmp.nTransfer,
        loseP:       p2,
        chargeStr:   cmp.donorQ,
        chargeAlpha: p3
      });
    }

    /* ── draw all acceptor atoms ── */
    for (var ai = 0; ai < nA; ai++) {
      drawAtom(ax2, acceptorY(ai), cmp.acceptor, {
        t: t + 1.8 + ai * 1.3,
        alpha:       easeOut3(p1),
        gainN:       (cmp.gainN !== undefined) ? cmp.gainN : cmp.nTransfer,
        gainP:       p2,
        chargeStr:   cmp.acceptorQ,
        chargeAlpha: p3
      });
    }

    /* ── flying electrons ──────────────────────────────────────────────
       Routing formula (works for all ratios including 2:3 for Al₂O₃):
         donorIdx    = floor(fe / nTransfer)   — which donor this e⁻ leaves from
         acceptorIdx = floor(fe / gainN)        — which acceptor this e⁻ arrives at
       Verified:
         1:2 (CaF₂, nTransfer=2, gainN=1): e0→(D0,A0), e1→(D0,A1)
         2:1 (Na₂O, nTransfer=1, gainN=2): e0→(D0,A0), e1→(D1,A0)
         2:3 (Al₂O₃, nTransfer=3, gainN=2): e0→(D0,A0), e1→(D0,A0),
             e2→(D0,A1), e3→(D1,A1), e4→(D1,A2), e5→(D1,A2)            ── */
    var totalFly = nD * cmp.nTransfer;   /* = nA * gainN  (charge balance) */
    if (p2 > 0 && p2 < 1) {
      for (var fe = 0; fe < totalFly; fe++) {
        var donorIdx    = Math.floor(fe / cmp.nTransfer);
        var acceptorIdx = Math.floor(fe / ((cmp.gainN !== undefined) ? cmp.gainN : cmp.nTransfer));
        var startY = donorY(donorIdx);
        var endY   = acceptorY(acceptorIdx);

        var delay = fe * 0.12;
        var denom = Math.max(0.05, 1 - delay * Math.max(0, totalFly - 1));
        var fp    = clamp((p2 - delay) / denom, 0, 1);
        if (fp <= 0) continue;

        var fx = lerp(ax1 + orb1, ax2 - orb2, easeInOut(fp));
        /* arc upward; reduce height for later electrons so they don't all overlap */
        var arcH = Math.max(28, 82 - fe * 10);
        var fy   = lerp(startY, endY, easeInOut(fp)) - Math.sin(fp * Math.PI) * arcH;

        /* trail — skip dots that haven't separated from donor edge yet */
        for (var tr = 1; tr <= 6; tr++) {
          var rawP = fp - tr * 0.025;
          if (rawP <= 0) continue;
          var tx_ = lerp(ax1 + orb1, ax2 - orb2, easeInOut(rawP));
          var ty_ = lerp(startY, endY, easeInOut(rawP)) - Math.sin(rawP * Math.PI) * arcH;
          ctx.save();
          ctx.globalAlpha = (1 - tr / 7) * 0.45;
          ctx.beginPath();
          ctx.arc(tx_, ty_, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd740';
          ctx.fill();
          ctx.restore();
        }

        /* glowing electron dot */
        var fGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 16);
        fGlow.addColorStop(0, '#ffd740');
        fGlow.addColorStop(.5, 'rgba(255,215,64,.45)');
        fGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(fx, fy, 16, 0, Math.PI * 2);
        ctx.fillStyle = fGlow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, fy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }

    /* ion charge is now rendered inside the nucleus via chargeStr/chargeAlpha opts */

    /* ── attraction arrows (between cluster centres) ── */
    if (p4 > 0) {
      ctx.save();
      ctx.globalAlpha = p4;
      var midX = (ax1 + ax2) / 2;
      ctx.strokeStyle = '#ffd740';
      ctx.lineWidth = 2;
      var arrY = ay;
      var lEnd = ax1 + orb1 + 20, rEnd = ax2 - orb2 - 20;
      ctx.beginPath(); ctx.moveTo(lEnd, arrY); ctx.lineTo(midX - 18, arrY); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 18, arrY);
      ctx.lineTo(midX - 28, arrY - 7);
      ctx.lineTo(midX - 28, arrY + 7);
      ctx.closePath(); ctx.fillStyle = '#ffd740'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(rEnd, arrY); ctx.lineTo(midX + 18, arrY); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX + 18, arrY);
      ctx.lineTo(midX + 28, arrY - 7);
      ctx.lineTo(midX + 28, arrY + 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd740';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Electrostatic Attraction', midX, arrY - 10);
      ctx.restore();
    }

    /* ── atom labels — one per element, below the bottom atom in each column ── */
    if (p1 > .35) {
      ctx.save();
      ctx.globalAlpha = (p1 - .35) / .65;
      var dValStr = 'Valence: ' + donorEl.shells[donorEl.shells.length-1] + ' e⁻  |  Z = ' + donorEl.Z +
                    (nD > 1 ? '  (×' + nD + ' atoms)' : '');
      var aValStr = 'Valence: ' + acceptEl.shells[acceptEl.shells.length-1] + ' e⁻  |  Z = ' + acceptEl.Z +
                    (nA > 1 ? '  (×' + nA + ' atoms)' : '');
      drawAtomLabel(ax1, donorY(nD - 1) + orb1 + 6, donorEl, dValStr);
      drawAtomLabel(ax2, acceptorY(nA - 1) + orb2 + 6, acceptEl, aValStr);
      ctx.restore();
    }

    /* ── result banner ── */
    if (p4 > .4) {
      ctx.save();
      ctx.globalAlpha = easeOut3((p4 - .4) / .6);
      var bY = H - 86;
      ctx.fillStyle = 'rgba(255,110,64,.12)';
      ctx.strokeStyle = 'rgba(255,110,64,.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 180, bY, 360, 58, 12);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff6e40';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cmp.formula, W / 2, bY + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '13px sans-serif';
      var totalE = nD * cmp.nTransfer;
      ctx.fillText(cmp.name + '  ·  Ionic compound  (' + totalE + ' e⁻ transferred)', W / 2, bY + 42);
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════════════════════
     11.  MAIN DRAW
  ══════════════════════════════════════════════════════ */
  function draw() {
    if (mode !== 'simulate') return;
    atomHits = [];  /* reset hit-areas each frame */
    ctx.textBaseline = 'alphabetic';

    if (simPhase === 'idle') {
      drawIdle();
    } else {
      var elapsed  = performance.now() - animStart;
      var progress = clamp(elapsed / ANIM_DUR, 0, 1);
      if (progress >= 1 && simPhase === 'running') {
        simPhase = 'done';
        showInfoBox();
        updateReadout(true);
      }
      var isCovAnim = pracMode && dynamicCmp ? dynamicCmp._type === 'covalent' : bondType === 'covalent';
      if (isCovAnim) drawCovalent(progress);
      else            drawIonic(progress);
    }
    /* hover tooltip — always on top of everything */
    drawNucleusTooltip();
  }

  /* ══════════════════════════════════════════════════════
     12.  ANIMATION LOOP
  ══════════════════════════════════════════════════════ */
  function loop(ts) {
    var dt = Math.min((ts - lastTS) / 1000, .05);
    lastTS = ts;
    /* Only freeze electron motion when animation has fully completed */
    if (!(freezeElectrons && simPhase === 'done')) {
      t += dt * .85;
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ══════════════════════════════════════════════════════
     13.  READOUT & INFO BOX
  ══════════════════════════════════════════════════════ */
  function updateReadout(full) {
    var cmp = getCmp();
    var isCov = pracMode && dynamicCmp ? dynamicCmp._type === 'covalent' : bondType === 'covalent';
    var el1Sym = isCov ? cmp.el1 : cmp.donor;
    var el2Sym = isCov ? cmp.el2 : cmp.acceptor;
    var el1 = EL[el1Sym], el2 = EL[el2Sym];

    document.getElementById('rv-atom1').textContent =
      el1.sym + ' — ' + el1.name + ' | Z=' + el1.Z;
    document.getElementById('rv-atom2').textContent =
      el2.sym + ' — ' + el2.name + ' | Z=' + el2.Z;
    document.getElementById('rv-valence').textContent =
      el1.sym + ': ' + el1.shells[el1.shells.length-1] + ' e⁻  |  ' +
      el2.sym + ': ' + el2.shells[el2.shells.length-1] + ' e⁻';

    if (full) {
      if (isCov) {
        document.getElementById('rv-bond').textContent =
          cmp.bondLabel + ' — ' + cmp.sharedPairs + ' pair(s), EN diff ' + cmp.ENdiff.toFixed(2);
      } else {
        var rvnD = cmp.count1 || 1, rvnA = cmp.count2 || 1;
        var rvTotal = rvnD * cmp.nTransfer;
        document.getElementById('rv-bond').textContent =
          rvTotal + ' e⁻ transferred: ' + (rvnD > 1 ? rvnD + '×' : '') + cmp.donor +
          ' → ' + (rvnA > 1 ? rvnA + '×' : '') + cmp.acceptor;
      }
    } else {
      document.getElementById('rv-bond').textContent =
        isCov ? 'Electron Sharing' : 'Electron Transfer';
    }
    document.getElementById('rv-compound').textContent = cmp.formula + ' — ' + cmp.name;
  }

  function showInfoBox() {
    var cmp   = getCmp();
    var isCov = pracMode && dynamicCmp ? dynamicCmp._type === 'covalent' : bondType === 'covalent';
    infoBox.classList.remove('hidden');
    infoTitle.textContent = cmp.formula + '  —  ' + cmp.name;

    var rows = [];
    if (isCov) {
      rows.push({ l:'Bond Type',       v: cmp.bondLabel + ' (Covalent)' });
      rows.push({ l:'Shared Pairs',    v: cmp.sharedPairs + ' pair' + (cmp.sharedPairs > 1 ? 's' : '') + ' (' + (cmp.sharedPairs * 2) + ' electrons)' });
      rows.push({ l:'EN Difference',   v: cmp.ENdiff.toFixed(2) + (cmp.ENdiff >= 0.5 ? ' — polar covalent' : ' — nonpolar covalent') });
      rows.push({ l:'How It Bonds',    v: cmp.why });
    } else {
      rows.push({ l:'Bond Type',       v: 'Ionic (Electron Transfer)' });
      var infoND = cmp.count1 || 1, infoNA = cmp.count2 || 1;
      var infoTotal = infoND * cmp.nTransfer;
      rows.push({ l:'Electrons Given', v: infoTotal + ' e⁻ total: ' + (infoND > 1 ? infoND + '×' : '') + cmp.donor +
        ' → ' + (infoNA > 1 ? infoNA + '×' : '') + cmp.acceptor });
      rows.push({ l:'Ions Formed',     v: cmp.donor + cmp.donorQ + ' (cation) and ' + cmp.acceptor + cmp.acceptorQ + ' (anion)' });
      rows.push({ l:'How It Bonds',    v: cmp.why });
    }
    cmp.facts.forEach(function(f) { rows.push({ l:'›', v: f, fact: true }); });

    infoGrid.innerHTML = rows.map(function(r) {
      return '<div class="info-row' + (r.fact ? ' info-fact' : '') + '">' +
        '<span class="info-label">' + r.l + '</span>' +
        '<span class="info-val">' + r.v + '</span></div>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     14.  COMPOUND TABS
  ══════════════════════════════════════════════════════ */
  function renderCompoundTabs() {
    var arr = bondType === 'covalent' ? COVALENT : IONIC;
    compoundTabs.innerHTML = '';
    arr.forEach(function(c) {
      var btn = document.createElement('button');
      btn.className = 'pill' + (c.id === selectedId ? ' active' : '');
      btn.dataset.value = c.id;
      btn.textContent = c.formula;
      btn.title = c.name;
      compoundTabs.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════════════════════
     15.  EXPLORE MODE
  ══════════════════════════════════════════════════════ */
  var EXPLORE = {
    overview: [
      { title:'What is a Chemical Bond?',
        body:'A chemical bond is a lasting attraction between atoms that allows them to form molecules and compounds. Atoms bond to achieve a more stable electron configuration — usually a full outer shell of 8 electrons (the octet rule), except hydrogen which needs only 2.',
        formula:'Stability goal: outer shell = 8 electrons (octet rule) | H exception: 2 electrons' },
      { title:'Valence Electrons',
        body:'Valence electrons are the electrons in the outermost shell of an atom. They are the electrons that participate in bonding. The number of valence electrons determines how many bonds an atom can form and what type of bond it prefers.',
        formula:'Group 1 → 1 valence e⁻ | Group 16 → 6 valence e⁻ | Group 17 → 7 valence e⁻ | Group 18 → 8 (stable)' },
      { title:'Electronegativity',
        body:'Electronegativity measures how strongly an atom attracts electrons in a bond. The greater the difference between two atoms, the more ionic the character. Fluorine is the most electronegative element (3.98); caesium is the least (0.79). Of the elements you can pick in this simulator, potassium (0.82) is the least electronegative.',
        formula:'EN diff > 1.7 → Ionic | EN diff 0.5–1.7 → Polar Covalent | EN diff < 0.5 → Nonpolar Covalent' },
      { title:'The Bohr Atomic Model',
        body:'Niels Bohr proposed in 1913 that electrons orbit the nucleus in fixed energy shells. Shell 1 holds up to 2 electrons, shell 2 up to 8, shell 3 up to 18. While simplified, this model is excellent for visualising chemical bonding and electron transfer.',
        formula:'Max shell capacity (2n²): n=1 → 2e⁻ | n=2 → 8e⁻ | n=3 → 18e⁻ | n=4 → 32e⁻ · Shells do not always fill to their max — Period 3 elements fill n=3 with 8e⁻ before starting n=4' }
    ],
    covalent: [
      { title:'Covalent Bond Basics',
        body:'Covalent bonds form when two nonmetal atoms share electron pairs. Each atom contributes valence electrons to a shared pool — a "bond" — that holds the atoms together. The shared electrons spend time between both nuclei, attracting both simultaneously.',
        formula:'Nonmetal + Nonmetal → share electrons → covalent bond' },
      { title:'Single, Double & Triple Bonds',
        body:'The bond order is the number of shared electron pairs. Single bonds share 1 pair (H₂, HCl), double bonds 2 pairs (O₂, CO₂), and triple bonds 3 pairs (N₂). More shared pairs means a shorter, stronger bond.',
        formula:'Single: 1 pair (2e⁻) | Double: 2 pairs (4e⁻) | Triple: 3 pairs (6e⁻) | Triple bond energy N₂: 945 kJ/mol' },
      { title:'Polar vs Nonpolar Covalent',
        body:'When both atoms have identical electronegativities (same element, e.g., O₂, N₂), electrons are shared equally — nonpolar covalent. When EN differs (e.g., HCl, H₂O), electrons are pulled toward the more electronegative atom — polar covalent. The molecule has a δ+ end and a δ− end.',
        formula:'H₂O: O pulls electrons (EN 3.44 vs H 2.20) → polar | O₂: both atoms identical → nonpolar' },
      { title:'Lone Pairs',
        body:'Lone pairs (non-bonding pairs) are valence electron pairs not used in bonding. They affect molecular shape by repelling bond pairs. In H₂O, O has 2 lone pairs after forming 2 O–H bonds — these compress the H–O–H angle to 104.5° instead of the expected 109.5°.',
        formula:'H₂O: O has 2 bonding pairs + 2 lone pairs = 4 pairs → bent molecule, 104.5°' }
    ],
    ionic: [
      { title:'Ionic Bond Basics',
        body:'Ionic bonds form when a metal atom completely transfers one or more valence electrons to a nonmetal. The metal becomes a positively charged cation; the nonmetal becomes a negatively charged anion. The strong electrostatic attraction between opposite charges holds the compound together.',
        formula:'Metal → loses electrons → cation (+) | Nonmetal → gains electrons → anion (−) | Attraction holds compound' },
      { title:'Why Metals Lose Electrons',
        body:'Metals in Group 1 (Na, K, Li) have 1 valence electron and Group 2 (Mg, Ca) have 2. These outer electrons are far from the nucleus and weakly held. It is energetically more favourable to lose them and achieve the stable electron configuration of the previous noble gas.',
        formula:'Na (2,8,1) − 1e⁻ → Na⁺ (2,8) = Neon config | Ca (2,8,8,2) − 2e⁻ → Ca²⁺ (2,8,8) = Argon config' },
      { title:'Charge Balance in Ionic Compounds',
        body:'Ionic compounds must be electrically neutral overall. The formula is determined by balancing cation and anion charges. For Al³⁺ and O²⁻: the lowest common multiple of 3 and 2 is 6, so 2 Al³⁺ (gives 6e⁻) and 3 O²⁻ (takes 6e⁻) → Al₂O₃.',
        formula:'Al³⁺ + O²⁻: LCM(3,2)=6 → 2 Al³⁺ + 3 O²⁻ → Al₂O₃ | Ca²⁺ + Cl⁻ → CaCl₂ (2×1=1×2)' },
      { title:'Properties of Ionic Compounds',
        body:'Ionic compounds form rigid crystal lattices with electrostatic attractions in all directions. This gives high melting points (NaCl: 801 °C), hardness, and brittleness. They conduct electricity when dissolved in water or melted (ions move freely), but not as solids.',
        formula:'Solid NaCl: ions locked → no conduction | NaCl(aq): free Na⁺ and Cl⁻ → conducts | High MP, brittle crystal' }
    ],
    comparison: [
      { title:'Bond Formation Compared',
        body:'Covalent bonds form between two nonmetals by sharing electrons. Ionic bonds form between a metal and nonmetal by electron transfer. The key factor is electronegativity difference: above ~1.7 the bond is ionic; below that it is covalent (polar or nonpolar).',
        formula:'Metal + Nonmetal → ionic | Nonmetal + Nonmetal → covalent | EN diff > 1.7 → likely ionic' },
      { title:'Physical Properties Compared',
        body:'Covalent compounds are often gases, liquids, or soft solids at room temperature with relatively low melting points (H₂O bp 100 °C, NH₃ bp −33 °C). Ionic compounds are hard, brittle crystalline solids with very high melting points (NaCl 801 °C, MgO 2852 °C).',
        formula:'Covalent: low to moderate MP/BP, often molecular | Ionic: high MP/BP, crystal lattice' },
      { title:'Conductivity Compared',
        body:'Ionic compounds conduct electricity when dissolved in water (electrolytes) or when melted, because the ions are free to move. Covalent compounds generally do not conduct electricity, as they have no free ions or electrons — unless they ionise in water (e.g., HCl → H⁺ + Cl⁻).',
        formula:'NaCl(aq): conducts ✓ | MgO(l): conducts ✓ | H₂O(l): does not conduct ✗ | HCl(aq): conducts ✓ (ionises)' },
      { title:'Covalent vs Ionic — Examples',
        body:'Covalent: H₂ (hydrogen gas), O₂ (oxygen), N₂ (nitrogen), H₂O (water), CO₂ (carbon dioxide), CH₄ (methane), NH₃ (ammonia). Ionic: NaCl (table salt), MgO (magnesia), CaF₂ (fluorite), KBr (potassium bromide), Al₂O₃ (alumina, found in rubies).',
        formula:'Covalent → molecules | Ionic → formula units in crystal lattice (no discrete molecule)' }
    ]
  };

  function renderExplore() {
    var cards = EXPLORE[exploreTab] || [];
    exploreCards.innerHTML = '';
    cards.forEach(function(card) {
      var d = document.createElement('div');
      d.className = 'explore-card';
      d.innerHTML =
        '<h3>' + card.title + '</h3>' +
        '<p>' + card.body + '</p>' +
        (card.formula ? '<div class="ec-formula">' + card.formula + '</div>' : '');
      exploreCards.appendChild(d);
    });
  }

  /* ══════════════════════════════════════════════════════
     16.  PRACTICE — REACTION ENGINE
  ══════════════════════════════════════════════════════ */
  var PRAC_ELEMENTS = [
    'H','He','Li','Be','B','C','N','O','F','Ne',
    'Na','Mg','Al','Si','P','S','Cl','Ar',
    'K','Ca','Cr','Mn','Fe','Co','Ni','Cu','Zn',
    'Se','Br','Kr','Sr','Ag','Cd','Sn','I','Ba','Pb'
  ];

  /* Lookup DB — covers the most common pairs */
  var KDB = {
    'B+F':   { valid:true,  type:'covalent', formula:'BF₃',   name:'Boron Trifluoride',      detail:'B has 3 valence e⁻; each F needs 1e⁻. B forms 3 polar covalent bonds with 3 F atoms (EN diff 1.94). Although EN diff > 1.7, BF₃ is covalent — the threshold is a guideline. BF₃ is a planar Lewis acid with an incomplete octet at B; it readily accepts electron pairs.' },
    'C+Cl':  { valid:true,  type:'covalent', formula:'CCl₄',  name:'Carbon Tetrachloride',   detail:'C needs 4e⁻; each Cl needs 1e⁻. 4 Cl atoms each share 1e⁻ with C → 4 single bonds. Tetrahedral molecule.' },
    'C+H':   { valid:true,  type:'covalent', formula:'CH₄',   name:'Methane',                detail:'C needs 4e⁻; each H needs 1e⁻. 4 H atoms each share 1e⁻ with C → 4 single bonds.' },
    'C+N':   { valid:true,  type:'covalent', formula:'CN',    name:'Cyano Radical (CN•)',    detail:'C (4 valence e⁻) and N (5 valence e⁻) share 3 pairs → C≡N triple bond. The binary CN unit is the cyano (cyanide) radical — with 9 valence electrons it is one electron short of a closed shell, so it readily bonds with other atoms to form HCN, NaCN or pairs up as cyanogen (CN)₂. The direct C–N bond itself is a triple bond.' },
    'C+O':   { valid:true,  type:'covalent', formula:'CO₂',   name:'Carbon Dioxide',         detail:'C needs 4e⁻; each O needs 2e⁻. C forms 2 double bonds with 2 O atoms → CO₂.' },
    'C+Si':  { valid:true,  type:'covalent', formula:'SiC',   name:'Silicon Carbide',        detail:'Si and C share electrons in a covalent network solid — one of the hardest materials known.' },
    'Cl+Cl': { valid:true,  type:'covalent', formula:'Cl₂',   name:'Chlorine Gas',           detail:'Both Cl have 7 valence electrons. Each needs 1 more → share 1 pair. Single covalent bond.' },
    'F+F':   { valid:true,  type:'covalent', formula:'F₂',    name:'Fluorine Gas',           detail:'Both F need 1 more electron → share 1 pair. Single covalent bond; most electronegative element.' },
    'H+Br':  { valid:true,  type:'covalent', formula:'HBr',   name:'Hydrogen Bromide',       detail:'H needs 1e⁻; Br needs 1e⁻. Share 1 pair → single covalent bond. Polar (EN diff 0.76).' },
    'H+C':   { valid:true,  type:'covalent', formula:'CH₄',   name:'Methane',                detail:'C needs 4e⁻; each H needs 1e⁻. 4 H atoms each share 1e⁻ with C → 4 single bonds.' },
    'H+Cl':  { valid:true,  type:'covalent', formula:'HCl',   name:'Hydrogen Chloride',      detail:'H needs 1e⁻; Cl needs 1e⁻. Share 1 pair → single covalent bond. Polar (EN diff 0.96).' },
    'H+F':   { valid:true,  type:'covalent', formula:'HF',    name:'Hydrogen Fluoride',      detail:'H needs 1e⁻; F needs 1e⁻. Share 1 pair → very strong polar covalent single bond (EN diff 1.78). Note: although EN diff > 1.7 (the ionic guideline), HF is covalent — the 1.7 rule is a guideline, not a law. F is so small that electron density is shared rather than fully transferred.' },
    'H+H':   { valid:true,  type:'covalent', formula:'H₂',    name:'Hydrogen Gas',           detail:'Both H need 1 more electron → share 1 pair. Single covalent bond. Each achieves helium configuration.' },
    'H+N':   { valid:true,  type:'covalent', formula:'NH₃',   name:'Ammonia',                detail:'N needs 3e⁻; each H needs 1e⁻. N forms 3 single bonds with 3 H atoms.' },
    'H+O':   { valid:true,  type:'covalent', formula:'H₂O',   name:'Water',                  detail:'O needs 2e⁻; each H needs 1e⁻. O forms 2 single bonds with 2 H atoms. Polar molecule.' },
    'H+P':   { valid:true,  type:'covalent', formula:'PH₃',   name:'Phosphine',              detail:'P needs 3e⁻; each H needs 1e⁻. P forms 3 single bonds → pyramidal molecule. Toxic gas.' },
    'H+S':   { valid:true,  type:'covalent', formula:'H₂S',   name:'Hydrogen Sulfide',       detail:'S needs 2e⁻; each H needs 1e⁻. S forms 2 single bonds with 2 H atoms. Smells of rotten eggs.' },
    'N+N':   { valid:true,  type:'covalent', formula:'N₂',    name:'Nitrogen Gas',           detail:'Both N need 3e⁻ → share 3 pairs. Triple covalent bond; bond energy 945 kJ/mol.' },
    'N+O':   { valid:true,  type:'covalent', formula:'NO',    name:'Nitric Oxide',           detail:'N (5 valence e⁻) and O (6 valence e⁻) form an effective bond order of 2.5 — between a double and triple bond. NO has 11 total electrons (odd number), leaving one unpaired electron, making it a radical. This radical nature makes NO highly reactive and important in atmospheric chemistry and biological signalling.' },
    'O+O':   { valid:true,  type:'covalent', formula:'O₂',    name:'Oxygen Gas',             detail:'Both O need 2e⁻ → share 2 pairs. Double covalent bond. Essential for respiration.' },
    'O+S':   { valid:true,  type:'covalent', formula:'SO₂',   name:'Sulfur Dioxide',         detail:'S (6 valence e⁻) bonds with 2 O atoms; the S–O bonds have double-bond character shared by resonance. Produced by burning fossil fuels; causes acid rain.' },
    'O+Si':  { valid:true,  type:'covalent', formula:'SiO₂',  name:'Silicon Dioxide',        detail:'Si forms 4 covalent bonds with O atoms in a 3D network — forms sand, quartz, and glass.' },
    'Al+Cl': { valid:true,  type:'covalent', formula:'AlCl₃', name:'Aluminium Chloride',     detail:'EN difference |1.61 − 3.16| = 1.55 < 1.7 → polar covalent by the simulator\'s own threshold. AlCl₃ is a Lewis acid that sublimes (doesn\'t melt at standard pressure) and dissolves in organic solvents — hallmarks of a covalent compound. Al forms 3 polar covalent bonds with Cl atoms.' },
    'Al+O':  { valid:true,  type:'ionic',    formula:'Al₂O₃', name:'Aluminum Oxide',         detail:'2 Al each give 3e⁻; 3 O each take 2e⁻ → 2 Al³⁺ + 3 O²⁻. 6 electrons transferred total.' },
    'Ca+Br': { valid:true,  type:'ionic',    formula:'CaBr₂', name:'Calcium Bromide',        detail:'Ca gives 2e⁻ (one to each Br) → Ca²⁺ + 2 Br⁻. Used as a sedative and in drilling fluids.' },
    'Ca+Cl': { valid:true,  type:'ionic',    formula:'CaCl₂', name:'Calcium Chloride',       detail:'Ca gives 2e⁻ (one to each Cl) → Ca²⁺ + 2 Cl⁻. Used for road de-icing.' },
    'Ca+F':  { valid:true,  type:'ionic',    formula:'CaF₂',  name:'Calcium Fluoride',       detail:'Ca gives 2e⁻ (one to each F) → Ca²⁺ + 2 F⁻. Occurs naturally as fluorite.' },
    'Ca+O':  { valid:true,  type:'ionic',    formula:'CaO',   name:'Calcium Oxide (Lime)',   detail:'Ca gives 2e⁻ to O → Ca²⁺ + O²⁻. Used in cement, steel-making, and water treatment.' },
    'Ca+S':  { valid:true,  type:'ionic',    formula:'CaS',   name:'Calcium Sulfide',        detail:'Ca gives 2e⁻ to S → Ca²⁺ + S²⁻. Used in luminescent materials.' },
    'Cu+Cl': { valid:true,  type:'ionic',    formula:'CuCl₂', name:'Copper(II) Chloride',    detail:'Cu gives 2e⁻ (one to each Cl) → Cu²⁺ + 2 Cl⁻. Used as fungicide and catalyst.' },
    'Cu+O':  { valid:true,  type:'ionic',    formula:'CuO',   name:'Copper(II) Oxide',       detail:'Cu gives 2e⁻ to O → Cu²⁺ + O²⁻. Black powder; used in ceramics and batteries.' },
    'Fe+Cl': { valid:true,  type:'ionic',    formula:'FeCl₃', name:'Iron(III) Chloride',     detail:'Fe gives 3e⁻ (one to each Cl) → Fe³⁺ + 3 Cl⁻. Used in water treatment and etching.' },
    'Fe+O':  { valid:true,  type:'ionic',    formula:'Fe₂O₃', name:'Iron(III) Oxide (Rust)', detail:'2 Fe each give 3e⁻; 3 O each take 2e⁻ → 2 Fe³⁺ + 3 O²⁻. Common rust.' },
    'K+Br':  { valid:true,  type:'ionic',    formula:'KBr',   name:'Potassium Bromide',      detail:'K gives 1e⁻ to Br → K⁺ + Br⁻. Used in medicine and photography.' },
    'K+Cl':  { valid:true,  type:'ionic',    formula:'KCl',   name:'Potassium Chloride',     detail:'K gives 1e⁻ to Cl → K⁺ + Cl⁻. Salt substitute; used in IV fluids.' },
    'K+F':   { valid:true,  type:'ionic',    formula:'KF',    name:'Potassium Fluoride',     detail:'K gives 1e⁻ to F → K⁺ + F⁻. Used in dental treatments and glass etching.' },
    'K+O':   { valid:true,  type:'ionic',    formula:'K₂O',   name:'Potassium Oxide',        detail:'2 K each give 1e⁻ to O → 2 K⁺ + O²⁻. Reacts vigorously with water.' },
    'K+S':   { valid:true,  type:'ionic',    formula:'K₂S',   name:'Potassium Sulfide',      detail:'2 K each give 1e⁻ to S → 2 K⁺ + S²⁻. Used in photography and medicines.' },
    'Li+Cl': { valid:true,  type:'ionic',    formula:'LiCl',  name:'Lithium Chloride',       detail:'Li gives 1e⁻ to Cl → Li⁺ + Cl⁻. Used in humidity control and air conditioning.' },
    'Li+F':  { valid:true,  type:'ionic',    formula:'LiF',   name:'Lithium Fluoride',       detail:'Li gives 1e⁻ to F → Li⁺ + F⁻. Highest EN difference; used in nuclear reactors.' },
    'Mg+Cl': { valid:true,  type:'ionic',    formula:'MgCl₂', name:'Magnesium Chloride',     detail:'Mg gives 2e⁻ (one to each Cl) → Mg²⁺ + 2 Cl⁻. Food additive (E511).' },
    'Mg+O':  { valid:true,  type:'ionic',    formula:'MgO',   name:'Magnesium Oxide',        detail:'Mg gives 2e⁻ to O → Mg²⁺ + O²⁻. Very high MP (2852 °C); used as refractory.' },
    'Mg+S':  { valid:true,  type:'ionic',    formula:'MgS',   name:'Magnesium Sulfide',      detail:'Mg gives 2e⁻ to S → Mg²⁺ + S²⁻. Used in semiconductor research.' },
    'Na+Br': { valid:true,  type:'ionic',    formula:'NaBr',  name:'Sodium Bromide',         detail:'Na gives 1e⁻ to Br → Na⁺ + Br⁻. Used as a sedative and in photography.' },
    'Na+Cl': { valid:true,  type:'ionic',    formula:'NaCl',  name:'Sodium Chloride',        detail:'Na gives 1e⁻ to Cl → Na⁺ + Cl⁻. Table salt; essential for life.' },
    'Na+F':  { valid:true,  type:'ionic',    formula:'NaF',   name:'Sodium Fluoride',        detail:'Na gives 1e⁻ to F → Na⁺ + F⁻. Added to toothpaste to prevent tooth decay.' },
    'Na+O':  { valid:true,  type:'ionic',    formula:'Na₂O',  name:'Sodium Oxide',           detail:'2 Na each give 1e⁻ to O → 2 Na⁺ + O²⁻. Reacts with water to form NaOH.' },
    'Na+S':  { valid:true,  type:'ionic',    formula:'Na₂S',  name:'Sodium Sulfide',         detail:'2 Na each give 1e⁻ to S → 2 Na⁺ + S²⁻. Used in paper-making (kraft process).' },
    'Zn+Cl': { valid:true,  type:'ionic',    formula:'ZnCl₂', name:'Zinc Chloride',          detail:'Zn gives 2e⁻ (one to each Cl) → Zn²⁺ + 2 Cl⁻. Used in batteries and soldering.' },
    'Zn+O':  { valid:true,  type:'ionic',    formula:'ZnO',   name:'Zinc Oxide',             detail:'Zn gives 2e⁻ to O → Zn²⁺ + O²⁻. White pigment; used in sunscreen and rubber.' },
    'Zn+S':  { valid:true,  type:'ionic',    formula:'ZnS',   name:'Zinc Sulfide',           detail:'Zn gives 2e⁻ to S → Zn²⁺ + S²⁻. Luminescent material used in TV screens and X-ray detectors.' },
    /* — CHROMIUM — */
    'Cr+Cl': { valid:true,  type:'ionic',    formula:'CrCl₃', name:'Chromium(III) Chloride', detail:'Cr gives 3e⁻ (one to each Cl) → Cr³⁺ + 3 Cl⁻. Used as mordant in textile dyeing; beautiful green crystals.' },
    'Cr+O':  { valid:true,  type:'ionic',    formula:'Cr₂O₃', name:'Chromium(III) Oxide',   detail:'2 Cr each give 3e⁻; 3 O each take 2e⁻ → 2 Cr³⁺ + 3 O²⁻ (6 e⁻ total). Vivid green pigment; used in polishing and metallurgy.' },
    'Cr+S':  { valid:true,  type:'ionic',    formula:'Cr₂S₃', name:'Chromium(III) Sulfide',  detail:'2 Cr each give 3e⁻; 3 S each take 2e⁻ → 2 Cr³⁺ + 3 S²⁻. Found in certain minerals.' },
    /* — MANGANESE — */
    'Mn+Cl': { valid:true,  type:'ionic',    formula:'MnCl₂', name:'Manganese(II) Chloride', detail:'Mn gives 2e⁻ (one to each Cl) → Mn²⁺ + 2 Cl⁻. Used in dry-cell batteries.' },
    'Mn+O':  { valid:true,  type:'ionic',    formula:'MnO',   name:'Manganese(II) Oxide',    detail:'Mn gives 2e⁻ to O → Mn²⁺ + O²⁻. Used in ceramics and as a depolariser in batteries.' },
    'Mn+S':  { valid:true,  type:'ionic',    formula:'MnS',   name:'Manganese(II) Sulfide',  detail:'Mn gives 2e⁻ to S → Mn²⁺ + S²⁻. Pink mineral alabandite; occurs in metamorphic rocks.' },
    /* — COBALT — */
    'Co+Cl': { valid:true,  type:'ionic',    formula:'CoCl₂', name:'Cobalt(II) Chloride',    detail:'Co gives 2e⁻ (one to each Cl) → Co²⁺ + 2 Cl⁻. Humidity indicator: blue when dry, pink when wet (hydrated).' },
    'Co+O':  { valid:true,  type:'ionic',    formula:'CoO',   name:'Cobalt(II) Oxide',       detail:'Co gives 2e⁻ to O → Co²⁺ + O²⁻. Olive-green powder used in ceramics and as blue glass colouring.' },
    'Co+S':  { valid:true,  type:'ionic',    formula:'CoS',   name:'Cobalt(II) Sulfide',     detail:'Co gives 2e⁻ to S → Co²⁺ + S²⁻. Used in the production of cobalt catalysts.' },
    /* — NICKEL — */
    'Ni+Cl': { valid:true,  type:'ionic',    formula:'NiCl₂', name:'Nickel(II) Chloride',    detail:'Ni gives 2e⁻ (one to each Cl) → Ni²⁺ + 2 Cl⁻. Used in electroplating and catalysis.' },
    'Ni+O':  { valid:true,  type:'ionic',    formula:'NiO',   name:'Nickel(II) Oxide',       detail:'Ni gives 2e⁻ to O → Ni²⁺ + O²⁻. Used in nickel–cadmium and nickel–metal hydride batteries.' },
    'Ni+S':  { valid:true,  type:'ionic',    formula:'NiS',   name:'Nickel(II) Sulfide',     detail:'Ni gives 2e⁻ to S → Ni²⁺ + S²⁻. Occurs naturally as millerite mineral.' },
    /* — SELENIUM (covalent nonmetal) — */
    'H+Se':  { valid:true,  type:'covalent', formula:'H₂Se',  name:'Hydrogen Selenide',      detail:'Se has 6 valence e⁻ and needs 2 more. Each H needs 1e⁻. Se bonds with 2 H atoms (single bonds each) → bent molecule. Extremely toxic gas.' },
    'O+Se':  { valid:true,  type:'covalent', formula:'SeO₂',  name:'Selenium Dioxide',       detail:'Se has 6 valence e⁻; it bonds with 2 O atoms with double-bond character shared by resonance. Used in glass manufacture and as oxidant.' },
    'Se+Se': { valid:true,  type:'covalent', formula:'Se₂',   name:'Diselenium',             detail:'Both Se atoms have 6 valence e⁻ and each needs 2 more → they share 2 pairs (double bond). Exists at high temperatures.' },
    /* — STRONTIUM — */
    'Sr+Br': { valid:true,  type:'ionic',    formula:'SrBr₂', name:'Strontium Bromide',      detail:'Sr gives 2e⁻ (one to each Br) → Sr²⁺ + 2 Br⁻. Used in medicine and red fireworks.' },
    'Sr+Cl': { valid:true,  type:'ionic',    formula:'SrCl₂', name:'Strontium Chloride',     detail:'Sr gives 2e⁻ (one to each Cl) → Sr²⁺ + 2 Cl⁻. Produces brilliant crimson-red colour in fireworks.' },
    'Sr+F':  { valid:true,  type:'ionic',    formula:'SrF₂',  name:'Strontium Fluoride',     detail:'Sr gives 2e⁻ (one to each F) → Sr²⁺ + 2 F⁻. Used as laser gain medium and optical material.' },
    'Sr+O':  { valid:true,  type:'ionic',    formula:'SrO',   name:'Strontium Oxide',        detail:'Sr gives 2e⁻ to O → Sr²⁺ + O²⁻. Used in cathode ray tubes and as a polishing agent.' },
    'Sr+S':  { valid:true,  type:'ionic',    formula:'SrS',   name:'Strontium Sulfide',      detail:'Sr gives 2e⁻ to S → Sr²⁺ + S²⁻. Used in luminescent materials and phosphors.' },
    /* — SILVER — */
    'Ag+Br': { valid:true,  type:'ionic',    formula:'AgBr',  name:'Silver Bromide',         detail:'Ag gives 1e⁻ to Br → Ag⁺ + Br⁻. Light-sensitive; was the key compound in traditional photographic film.' },
    'Ag+Cl': { valid:true,  type:'ionic',    formula:'AgCl',  name:'Silver Chloride',        detail:'Ag gives 1e⁻ to Cl → Ag⁺ + Cl⁻. White precipitate; forms when Ag⁺ ions meet Cl⁻ ions in solution.' },
    'Ag+F':  { valid:true,  type:'ionic',    formula:'AgF',   name:'Silver Fluoride',        detail:'Ag gives 1e⁻ to F → Ag⁺ + F⁻. Soluble; used in dentistry as a cavity treatment agent.' },
    'Ag+I':  { valid:true,  type:'ionic',    formula:'AgI',   name:'Silver Iodide',          detail:'Ag gives 1e⁻ to I → Ag⁺ + I⁻. Used in cloud seeding to induce rainfall.' },
    'Ag+O':  { valid:true,  type:'ionic',    formula:'Ag₂O',  name:'Silver Oxide',           detail:'2 Ag each give 1e⁻ to O → 2 Ag⁺ + O²⁻. Brown-black powder; used in silver oxide button batteries.' },
    'Ag+S':  { valid:true,  type:'ionic',    formula:'Ag₂S',  name:'Silver Sulfide',         detail:'2 Ag each give 1e⁻ to S → 2 Ag⁺ + S²⁻. Black tarnish on silver objects; found as acanthite mineral.' },
    /* — CADMIUM — */
    'Cd+Cl': { valid:true,  type:'ionic',    formula:'CdCl₂', name:'Cadmium Chloride',       detail:'Cd gives 2e⁻ (one to each Cl) → Cd²⁺ + 2 Cl⁻. Used in photography and as a catalyst.' },
    'Cd+O':  { valid:true,  type:'ionic',    formula:'CdO',   name:'Cadmium Oxide',          detail:'Cd gives 2e⁻ to O → Cd²⁺ + O²⁻. Used in nickel-cadmium (NiCd) rechargeable batteries.' },
    'Cd+S':  { valid:true,  type:'ionic',    formula:'CdS',   name:'Cadmium Sulfide',        detail:'Cd gives 2e⁻ to S → Cd²⁺ + S²⁻. Vivid yellow pigment and semiconductor; used in solar cells.' },
    /* — TIN — */
    'Cl+Sn': { valid:true,  type:'ionic',    formula:'SnCl₂', name:'Tin(II) Chloride',       detail:'Sn gives 2e⁻ (one to each Cl) → Sn²⁺ + 2 Cl⁻. Used in tinning metals and as reducing agent in chemical synthesis.' },
    'O+Sn':  { valid:true,  type:'ionic',    formula:'SnO',   name:'Tin(II) Oxide',          detail:'Sn gives 2e⁻ to O → Sn²⁺ + O²⁻. Used in ceramic glazes and as polishing powder.' },
    'S+Sn':  { valid:true,  type:'ionic',    formula:'SnS',   name:'Tin(II) Sulfide',        detail:'Sn gives 2e⁻ to S → Sn²⁺ + S²⁻. Found as herzenbergite mineral; used in semiconductor research.' },
    /* — IODINE — */
    'H+I':   { valid:true,  type:'covalent', formula:'HI',    name:'Hydrogen Iodide',        detail:'H needs 1e⁻; I needs 1e⁻. Share 1 pair → polar covalent single bond (EN diff 0.46). Although EN diff < 0.5 (the nonpolar guideline), HI has a measurable dipole moment and is classified as polar covalent in most curricula — the 0.5 threshold is a guideline, not a law. Dissolves in water to form hydroiodic acid (a strong acid).' },
    'I+I':   { valid:true,  type:'covalent', formula:'I₂',    name:'Diiodine',               detail:'Both I atoms have 7 valence e⁻ and each needs 1 more → share 1 pair (single covalent bond). Purple-black solid; sublimes to purple vapour.' },
    /* — BARIUM — */
    'Ba+Br': { valid:true,  type:'ionic',    formula:'BaBr₂', name:'Barium Bromide',         detail:'Ba gives 2e⁻ (one to each Br) → Ba²⁺ + 2 Br⁻. Used in photography and as a reagent.' },
    'Ba+Cl': { valid:true,  type:'ionic',    formula:'BaCl₂', name:'Barium Chloride',        detail:'Ba gives 2e⁻ (one to each Cl) → Ba²⁺ + 2 Cl⁻. Produces yellow-green flame; used in fireworks and as a water treatment coagulant.' },
    'Ba+F':  { valid:true,  type:'ionic',    formula:'BaF₂',  name:'Barium Fluoride',        detail:'Ba gives 2e⁻ (one to each F) → Ba²⁺ + 2 F⁻. Excellent UV/IR transmitting optical material.' },
    'Ba+O':  { valid:true,  type:'ionic',    formula:'BaO',   name:'Barium Oxide',           detail:'Ba gives 2e⁻ to O → Ba²⁺ + O²⁻. Used in cathode ray tubes and as a desiccant.' },
    'Ba+S':  { valid:true,  type:'ionic',    formula:'BaS',   name:'Barium Sulfide',         detail:'Ba gives 2e⁻ to S → Ba²⁺ + S²⁻. Luminescent material; intermediate in barium chemical production.' },
    /* — LEAD — */
    'Br+Pb': { valid:true,  type:'ionic',    formula:'PbBr₂', name:'Lead(II) Bromide',       detail:'Pb gives 2e⁻ (one to each Br) → Pb²⁺ + 2 Br⁻. Used in perovskite solar cells.' },
    'Cl+Pb': { valid:true,  type:'ionic',    formula:'PbCl₂', name:'Lead(II) Chloride',      detail:'Pb gives 2e⁻ (one to each Cl) → Pb²⁺ + 2 Cl⁻. White solid; historically used in white pigment (now banned).' },
    'O+Pb':  { valid:true,  type:'ionic',    formula:'PbO',   name:'Lead(II) Oxide',         detail:'Pb gives 2e⁻ to O → Pb²⁺ + O²⁻. Yellow litharge; key material in lead-acid batteries.' },
    'Pb+S':  { valid:true,  type:'ionic',    formula:'PbS',   name:'Lead(II) Sulfide',       detail:'Pb gives 2e⁻ to S → Pb²⁺ + S²⁻. Black mineral galena — the primary ore of lead; also a semiconductor.' }
  };

  /* covalentNeed: electrons an atom shares to reach a closed shell.
     Atoms with ≤3 valence e⁻ (H, Be, B, Al…) share ALL their valence
     electrons (H→1, B→3 ⇒ BH₃, B₂O₃); atoms with ≥4 need (8 − v) more
     (C→4, N→3, O→2, halogens→1). Using 8−v for everything wrongly gave
     B a "need" of 5 (⇒ B₂O₅ instead of B₂O₃). */
  function covalentNeed(v) { return v <= 3 ? v : 8 - v; }

  /* Roman numeral (Stock notation) for variable-valence metals: Iron(III) etc. */
  var STOCK_METALS = { Cr:1, Mn:1, Fe:1, Co:1, Ni:1, Cu:1, Sn:1, Pb:1 };
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

  /* Parse a display formula like 'H₂O' / 'CO₂' / 'BF₃' into {sym: count} */
  function parseFormulaCounts(formula) {
    var subMap = { '₀':0,'₁':1,'₂':2,'₃':3,'₄':4,'₅':5,'₆':6,'₇':7,'₈':8,'₉':9 };
    var counts = {};
    var re = /([A-Z][a-z]?)([₀₁₂₃₄₅₆₇₈₉]*)/g;
    var m;
    while ((m = re.exec(formula)) !== null) {
      if (!m[0]) { re.lastIndex++; continue; }   /* avoid zero-width stall */
      var num = 0;
      for (var i = 0; i < m[2].length; i++) num = num * 10 + subMap[m[2].charAt(i)];
      counts[m[1]] = (counts[m[1]] || 0) + (num || 1);
    }
    return counts;
  }

  /* anionName: convert element name to anion suffix for ionic compound names */
  function anionName(name) {
    return name.replace(/ine$/,'ide').replace(/ium$/,'ide')
      .replace(/ogen$/,'ide').replace(/fur$/,'fide').replace(/enic$/,'ide')
      .replace(/orus$/,'ide').replace(/on$/,'ide')
      .replace(/ead$/,'ide').replace(/in$/,'ide');
  }

  function validateBond(s1, s2) {
    var el1 = EL[s1], el2 = EL[s2];
    if (!el1 || !el2) return { valid:false, reason:'Unknown element', detail:'Element not found in database.' };

    /* 1. noble gas — fully stable, no bonding */
    if (el1.type === 'noble') return { valid:false, reason: el1.name + ' is a Noble Gas',
      detail: el1.name + ' has a completely filled outer shell (' + el1.shells[el1.shells.length-1] + ' valence e⁻). Noble gases (Group 18) are chemically inert — no ionic or covalent bonds under normal conditions.' };
    if (el2.type === 'noble') return { valid:false, reason: el2.name + ' is a Noble Gas',
      detail: el2.name + ' has a completely filled outer shell. Noble gases are chemically inert.' };

    /* 2. KDB lookup (canonical key: sorted alphabetically) */
    var key = [s1, s2].sort().join('+');
    if (KDB[key]) return KDB[key];

    /* 3. same-element (homonuclear) */
    if (s1 === s2) {
      if (el1.type === 'metal') return { valid:false, reason:'Metal + Metal = Metallic Bond',
        detail:'Two ' + el1.name + ' atoms form a metallic bond — electrons delocalise into a shared "sea". This is not ionic or covalent bonding and falls outside this simulator\'s scope.' };
      var v1 = el1.shells[el1.shells.length - 1];
      var needH = covalentNeed(v1);
      if (needH === 0) return { valid:false, reason:'Already Stable', detail:el1.name + ' already has a full outer shell and does not need to bond.' };
      var boH = Math.min(needH, 3);
      var boLabels = ['','Single Bond','Double Bond','Triple Bond'];
      return { valid:true, type:'covalent', formula: s1 + '₂', name:'Di' + el1.name.toLowerCase(),
        detail: el1.name + ' has ' + v1 + ' valence e⁻ and needs ' + needH + ' more. Two atoms share ' + boH + ' pair(s) → ' + boLabels[boH] + '.' };
    }

    /* 4. metal + metal → metallic bond (no simulation) */
    if (el1.type === 'metal' && el2.type === 'metal') return { valid:false, reason:'Metal + Metal = Metallic Bond (Alloy)',
      detail: el1.name + ' and ' + el2.name + ' are both metals. They form metallic bonds (alloys) — a sea of delocalised electrons — not ionic or covalent compounds. Outside this simulator\'s scope.' };

    /* 5. determine which is donor (metal/metalloid with +charge) and which is acceptor (nonmetal with -charge) */
    var isDonor1 = el1.type === 'metal' || (el1.type === 'metalloid' && el1.ionCharge > 0);
    var isDonor2 = el2.type === 'metal' || (el2.type === 'metalloid' && el2.ionCharge > 0);

    if (isDonor1 && el2.type === 'nonmetal') {
      return algorithmicIonic(s1, el1, s2, el2);
    }
    if (isDonor2 && el1.type === 'nonmetal') {
      return algorithmicIonic(s2, el2, s1, el1);
    }

    /* 6. nonmetal + nonmetal → covalent */
    if ((el1.type === 'nonmetal' || el1.type === 'metalloid') &&
        (el2.type === 'nonmetal' || el2.type === 'metalloid')) {
      return algorithmicCovalent(s1, el1, s2, el2);
    }

    return { valid:false, reason:'Complex Bonding',
      detail:'This combination has complex bonding behaviour (e.g., variable valency, network covalent solid, or metalloid character) that goes beyond this simulator\'s scope.' };
  }

  function algorithmicIonic(dSym, dEl, aSym, aEl) {
    /* Borderline metalloid donor (e.g. B) with modest EN gap → covalent
       (checked FIRST so B+H correctly becomes BH₃, not a rejected hydride) */
    var enDiff0 = (dEl.EN && aEl.EN) ? Math.abs(dEl.EN - aEl.EN) : 2.0;
    if (enDiff0 < 1.7 && dEl.type === 'metalloid') {
      return algorithmicCovalent(dSym, dEl, aSym, aEl);
    }
    /* Hydrogen as acceptor: gains ONE electron to reach the helium duet (H⁻,
       hydride). The old 8−v fallback gave it a bogus −7 need (⇒ Na₇H).
       Only group 1–2 metals form genuinely ionic hydrides (NaH, CaH₂);
       transition-metal hydrides are covalent/interstitial → out of scope. */
    if (aSym === 'H') {
      if (dEl.group !== 1 && dEl.group !== 2) {
        return { valid:false, reason:'Complex Hydride',
          detail: dEl.name + ' + hydrogen does not form a simple ionic compound. Only group 1–2 metals form ionic (saline) hydrides such as NaH and CaH₂; ' + dEl.name + ' hydrides are covalent or interstitial — outside this simulator\'s scope.' };
      }
    }
    /* Carbon as acceptor: real carbides (CaC₂, Al₄C₃, Fe₃C…) do not follow the
       simple octet-transfer model — route to an honest "complex" message. */
    if (aSym === 'C') {
      return { valid:false, reason:'Carbides Are Complex',
        detail:'Metal–carbon compounds (carbides such as CaC₂ or Fe₃C) involve C₂²⁻ units, covalent networks or interstitial bonding — they do not follow the simple ionic electron-transfer model taught here.' };
    }
    var qD = Math.abs(dEl.ionCharge) || dEl.shells[dEl.shells.length-1];
    var qA = aSym === 'H' ? 1 : (Math.abs(aEl.ionCharge) || (8 - aEl.shells[aEl.shells.length-1]));
    qD = Math.max(1, qD); qA = Math.max(1, qA);
    var g  = gcd(qD, qA);
    var nD = qA / g, nA = qD / g;

    var enDiff = enDiff0;

    /* Build formula with proper subscript notation: e.g. Na₂O, Al₂O₃, NaCl, CaF₂ */
    var formula;
    if      (nD === 1 && nA === 1) formula = dSym + aSym;
    else if (nD === 1 && nA >  1) formula = dSym + aSym + sub(nA);
    else if (nD >  1 && nA === 1) formula = dSym + sub(nD) + aSym;
    else                           formula = dSym + sub(nD) + aSym + sub(nA);

    /* Stock notation for variable-valence metals: Iron(III) Chloride, not Iron Chloride */
    var stock = STOCK_METALS[dSym] ? '(' + ROMAN[qD] + ')' : '';
    var cmpName = dEl.name + stock + ' ' + anionName(aEl.name);
    var donorValence = dEl.shells[dEl.shells.length-1];
    var aValence     = aEl.shells[aEl.shells.length-1];
    var detail = dEl.name + ' has ' + donorValence + ' valence e⁻ (loses ' + qD + ', forms ' + dSym + (qD > 1 ? qD : '') + '⁺). ' +
      aEl.name + ' has ' + aValence + ' valence e⁻ (gains ' + qA + ', forms ' + aSym + (qA > 1 ? qA : '') + '⁻). ' +
      'Stoichiometry: ' + nD + ' ' + dSym + ' : ' + nA + ' ' + aSym + ' to balance charges. EN diff: ' + enDiff.toFixed(2) + '.';
    return { valid:true, type:'ionic', formula: formula, name: cmpName, detail: detail,
      _donor: dSym, _acceptor: aSym, _qD: qD, _qA: qA, _nD: nD, _nA: nA };
  }

  function algorithmicCovalent(s1, el1, s2, el2) {
    /* Conventional formula order: less-electronegative element first (NCl₃,
       H₂O, SiO₂ — not Cl₃N / OH₂). Swap if needed before computing. */
    if (el1.EN != null && el2.EN != null && el2.EN < el1.EN) {
      var swS = s1; s1 = s2; s2 = swS;
      var swE = el1; el1 = el2; el2 = swE;
    }
    var v1 = el1.shells[el1.shells.length-1];
    var v2 = el2.shells[el2.shells.length-1];
    var n1 = Math.max(0, covalentNeed(v1));
    var n2 = Math.max(0, covalentNeed(v2));
    if (n1 === 0 || n2 === 0) return { valid:false, reason:'Already Stable',
      detail:'One of these elements already has a full outer shell and does not need to bond.' };
    var bo = Math.min(n1, n2, 3);
    var enDiff = (el1.EN && el2.EN) ? Math.abs(el1.EN - el2.EN) : 0;
    var polarity = enDiff >= 0.5 ? 'polar covalent' : 'nonpolar covalent';
    var boLabels = ['','Single Bond','Double Bond','Triple Bond'];
    /* Stoichiometric formula: cross-multiply needs (like ionic charge balance) */
    var fg  = gcd(n1, n2);
    var fc1 = n2 / fg;   /* atoms of el1 */
    var fc2 = n1 / fg;   /* atoms of el2 */
    var formula = s1 + (fc1 > 1 ? sub(fc1) : '') + s2 + (fc2 > 1 ? sub(fc2) : '');
    var detail = el1.name + ' has ' + v1 + ' valence e⁻ (needs ' + n1 + '). ' + el2.name + ' has ' + v2 + ' valence e⁻ (needs ' + n2 + '). ' +
      'They share ' + bo + ' pair(s) → ' + boLabels[bo] + ' (' + polarity + ', EN diff ' + enDiff.toFixed(2) + ').';
    return { valid:true, type:'covalent', formula: formula, name: el1.name + '–' + el2.name + ' compound', detail: detail };
  }

  /* Build a full compound object for canvas animation from validation result */
  function buildDynamicCmp(s1, s2, res) {
    var el1 = EL[s1], el2 = EL[s2];

    if (res.type === 'covalent') {
      /* ── Derive atom counts from the actual formula so the animation
         matches it (H₂O → O hub + 2 H spokes, CH₄ → C + 4 H, not 1:1). ── */
      var c1 = 1, c2 = 1;
      if (s1 !== s2) {
        var pc = parseFormulaCounts(res.formula);
        if (pc[s1] && pc[s2]) { c1 = pc[s1]; c2 = pc[s2]; }
        /* central atom must be el1 (count 1); peripheral el2 (count ≥ 1) */
        if (c1 > 1 && c2 === 1) {
          var swS2 = s1; s1 = s2; s2 = swS2;
          var swE2 = el1; el1 = el2; el2 = swE2;
          var swC = c1; c1 = c2; c2 = swC;
        }
        /* both > 1 (e.g. P₂O₃): can't draw hub-and-spoke → 1:1 depiction */
        if (c1 > 1 && c2 > 1) { c1 = 1; c2 = 1; }
        c2 = Math.min(c2, 4);   /* canvas layout supports up to 4 spokes */
      }
      var v1  = el1.shells[el1.shells.length-1];
      var v2  = el2.shells[el2.shells.length-1];
      var n1  = Math.max(0, covalentNeed(v1));
      var n2  = Math.max(0, covalentNeed(v2));
      /* per-bond order: with several peripherals each bond's order equals the
         peripheral atom's need (CO₂ → 2, CH₄ → 1); for 1:1 use the min */
      var bo  = c2 > 1 ? Math.max(1, Math.min(n2, 3))
                       : Math.max(1, Math.min(n1 || 1, n2 || 1, 3));
      var sp  = bo * c2;   /* total shared pairs across all bonds */
      var enD = (el1.EN && el2.EN) ? Math.abs(el1.EN - el2.EN) : 0;
      var boL = ['','Single Bond','Double Bond','Triple Bond'];
      var label = c2 > 1 ? c2 + ' ' + boL[bo] + 's' : (boL[bo] || 'Bond');
      return {
        _type:'covalent',
        el1: s1, el2: s2, count1: c1, count2: c2,
        bondOrder: bo, bondLabel: label,
        sharedPairs: sp, lonePairs1:0, lonePairs2:0,
        ENdiff: enD,
        formula: res.formula, name: res.name,
        why: res.detail,
        facts: [
          el1.name + ': ' + v1 + ' valence e⁻  |  ' + el2.name + ': ' + v2 + ' valence e⁻' + (c2 > 1 ? ' (×' + c2 + ' atoms)' : ''),
          label + ' — ' + sp + ' shared pair' + (sp > 1 ? 's' : '') + ' (' + (sp * 2) + ' electrons)',
          'EN difference: ' + enD.toFixed(2) + (enD >= 0.5 ? ' — polar covalent' : ' — nonpolar covalent'),
          'Formula: ' + res.formula
        ]
      };
    } else {
      /* ionic — identify donor (metal/positive) and acceptor (nonmetal/negative) */
      var donor, acceptor, dEl, aEl;
      if (res._donor) {
        donor = res._donor; acceptor = res._acceptor; dEl = EL[donor]; aEl = EL[acceptor];
      } else if (el1.type === 'metal' || el1.ionCharge > 0) {
        donor = s1; acceptor = s2; dEl = el1; aEl = el2;
      } else {
        donor = s2; acceptor = s1; dEl = el2; aEl = el1;
      }
      var qD = res._qD || Math.abs(dEl.ionCharge) || 1;
      var qA = res._qA || Math.abs(aEl.ionCharge) || 1;
      return {
        _type:'ionic',
        donor: donor, acceptor: acceptor,
        count1: qA / gcd(qD, qA), count2: qD / gcd(qD, qA),
        nTransfer: qD,
        gainN: qA,   /* electrons ONE acceptor atom actually receives (= |acceptor charge|) */
        donorQ:   '+' + qD,
        acceptorQ:'−' + qA,
        formula: res.formula, name: res.name,
        why: res.detail,
        facts: [
          dEl.name + ' loses ' + qD + ' e⁻ → ' + donor + (qD > 1 ? qD : '') + '⁺  (achieves noble-gas config)',
          aEl.name + ' gains ' + qA + ' e⁻ → ' + acceptor + (qA > 1 ? qA : '') + '⁻  (achieves noble-gas config)',
          'Charge balance: ' + (qA/gcd(qD,qA)) + ' ' + donor + '⁺ per ' + (qD/gcd(qD,qA)) + ' ' + acceptor + '⁻',
          'Formula: ' + res.formula + ' — ' + res.name
        ]
      };
    }
  }

  function renderPracticeElements() {
    elSelector.innerHTML = '';
    PRAC_ELEMENTS.forEach(function(sym) {
      var el = EL[sym]; if (!el) return;
      var btn = document.createElement('button');
      var cls = 'el-' + (el.type === 'metalloid' ? 'metalloid' : el.type === 'noble' ? 'noble' : el.type === 'metal' ? 'metal' : 'nonmetal');
      btn.className = 'el-btn ' + cls;
      btn.dataset.sym = sym;
      btn.style.setProperty('--el-color', el.color);
      btn.innerHTML =
        '<span class="el-z">' + el.Z + '</span>' +
        '<span class="el-sym">' + el.sym + '</span>' +
        '<span class="el-name">' + el.name + '</span>';
      elSelector.appendChild(btn);
    });
  }

  function updatePracticeSlots() {
    function slotHTML(sym, accent) {
      if (!sym) return '<div class="sel-placeholder">Select Element ' + (accent === 'accent' ? '1' : '2') + '</div>';
      var el = EL[sym];
      return '<div class="sel-el" style="border-color:' + el.color + '">' +
        '<div class="sel-el-sym" style="color:' + el.color + '">' + el.sym + '</div>' +
        '<div class="sel-el-name">' + el.name + '</div>' +
        '<div class="sel-el-info">Z=' + el.Z + ' | Valence: ' + el.shells[el.shells.length-1] + ' e⁻</div>' +
        '<div class="sel-el-info">Type: ' + el.type + ' | EN: ' + (el.EN || 'N/A') + '</div>' +
        '</div>';
    }
    selSlot1.innerHTML = slotHTML(pracEl1, 'accent');
    selSlot2.innerHTML = slotHTML(pracEl2, 'ionic');
  }

  function runPractice() {
    if (!pracEl1 || !pracEl2) {
      resultPanel.innerHTML = '<div class="result-placeholder"><div class="result-icon">⚠</div><div>Please select two elements first.</div></div>';
      return;
    }
    var res = validateBond(pracEl1, pracEl2);
    var el1 = EL[pracEl1], el2 = EL[pracEl2];

    if (res.valid) {
      /* Build compound object and launch canvas animation */
      dynamicCmp  = buildDynamicCmp(pracEl1, pracEl2, res);
      pracMode    = true;
      simPhase    = 'running';
      animStart   = performance.now();
      infoBox.classList.add('hidden');
      resetFreeze();
      resetViewToggles();
      playBondSound(res.type);

      var tc   = res.type === 'covalent' ? '#1de9b6' : '#ff6e40';
      var icon = res.type === 'covalent' ? '⚛ Covalent Bond' : '⚡ Ionic Bond';
      resultPanel.innerHTML =
        '<div class="result-success">' +
        '<div class="rs-header" style="border-color:' + tc + '">' +
        '<div class="rs-formula" style="color:' + tc + '">' + res.formula + '</div>' +
        '<div class="rs-name">' + res.name + '</div>' +
        '<div class="rs-type" style="background:' + tc + '22;color:' + tc + '">' + icon + '</div>' +
        '</div>' +
        '<div class="rs-atoms">' +
        '<div class="rs-atom" style="border-color:' + el1.color + '">' +
        '<div class="rs-asym" style="color:' + el1.color + '">' + el1.sym + '</div>' +
        '<div class="rs-aname">' + el1.name + '</div>' +
        '<div class="rs-ainfo">Z=' + el1.Z + ' | Valence: ' + el1.shells[el1.shells.length-1] + ' e⁻</div>' +
        '<div class="rs-ainfo">Type: ' + el1.type + ' | EN: ' + (el1.EN || 'N/A') + '</div>' +
        '</div><div class="rs-plus">+</div>' +
        '<div class="rs-atom" style="border-color:' + el2.color + '">' +
        '<div class="rs-asym" style="color:' + el2.color + '">' + el2.sym + '</div>' +
        '<div class="rs-aname">' + el2.name + '</div>' +
        '<div class="rs-ainfo">Z=' + el2.Z + ' | Valence: ' + el2.shells[el2.shells.length-1] + ' e⁻</div>' +
        '<div class="rs-ainfo">Type: ' + el2.type + ' | EN: ' + (el2.EN || 'N/A') + '</div>' +
        '</div></div>' +
        '<div class="rs-explanation"><div class="rs-expl-title">How it bonds:</div><p>' + res.detail + '</p>' +
        '<div class="rs-anim-hint" style="margin-top:8px;font-size:12px;color:var(--text-dim)">▶ Watch the Bohr model animation on the canvas above →</div>' +
        '</div></div>';
    } else {
      /* Invalid — reset canvas to idle */
      pracMode   = false;
      dynamicCmp = null;
      simPhase   = 'idle';
      resultPanel.innerHTML =
        '<div class="result-invalid">' +
        '<div class="ri-icon">✗</div>' +
        '<div class="ri-title">' + res.reason + '</div>' +
        '<div class="ri-detail">' + res.detail + '</div>' +
        '<div class="ri-atoms"><span style="color:' + el1.color + '">' + el1.sym + ' (' + el1.name + ')</span>' +
        ' + <span style="color:' + el2.color + '">' + el2.sym + ' (' + el2.name + ')</span>' +
        ' cannot form an ionic or covalent compound under normal conditions.</div>' +
        '</div>';
    }
  }

  /* ══════════════════════════════════════════════════════
     17.  QUIZ
  ══════════════════════════════════════════════════════ */
  var QPOOL = [
    { cat:'Bond Type', q:'What type of bond forms between Sodium (Na) and Chlorine (Cl)?',
      opts:['Covalent bond','Ionic bond','Metallic bond','Hydrogen bond'], ans:'Ionic bond',
      exp:'Na is a metal with 1 valence electron; Cl is a nonmetal needing 1 more. Na transfers its electron to Cl, forming Na⁺ and Cl⁻. EN difference = 2.23 (>1.7 → ionic).' },

    { cat:'Bond Type', q:'What type of bond forms between two Oxygen (O) atoms in O₂?',
      opts:['Ionic bond','Single covalent bond','Double covalent bond','Triple covalent bond'], ans:'Double covalent bond',
      exp:'Both O atoms have 6 valence electrons and each needs 2 more. They share 2 electron pairs (4 electrons) → double covalent bond.' },

    { cat:'Valence Electrons', q:'How many valence electrons does Chlorine (Cl) have?',
      opts:['5','6','7','8'], ans:'7',
      exp:'Cl has electron configuration 2,8,7. The outermost shell has 7 electrons. Cl needs just 1 more to complete its octet, making it highly reactive.' },

    { cat:'Valence Electrons', q:'Which element has 1 valence electron and easily loses it to form ionic bonds?',
      opts:['Oxygen','Carbon','Sodium','Nitrogen'], ans:'Sodium',
      exp:'Na has configuration 2,8,1 — just 1 valence electron far from the nucleus. It readily loses this to form Na⁺, achieving the stable neon configuration.' },

    { cat:'Electron Transfer', q:'In MgO, how many electrons does Magnesium transfer to Oxygen?',
      opts:['1','2','3','4'], ans:'2',
      exp:'Mg has 2 valence electrons (Group 2); O needs exactly 2 more to complete its octet. Mg transfers both electrons to O → Mg²⁺ + O²⁻.' },

    { cat:'Electron Transfer', q:'Why does CaF₂ have TWO fluorine atoms for each calcium atom?',
      opts:['Ca has 2 valence electrons; each F only needs 1','F needs 2 electrons and Ca gives 1','Ca is in period 2','F has 2 valence electrons'], ans:'Ca has 2 valence electrons; each F only needs 1',
      exp:'Ca has 2 valence electrons to give away. Each F atom only needs 1. So 1 Ca supplies 1e⁻ to each of 2 F atoms → Ca²⁺ + 2 F⁻.' },

    { cat:'Electron Sharing', q:'How many electron pairs are shared in a double covalent bond like O₂?',
      opts:['1 pair (2 electrons)','2 pairs (4 electrons)','3 pairs (6 electrons)','4 pairs (8 electrons)'], ans:'2 pairs (4 electrons)',
      exp:'A double bond shares 2 electron pairs (4 electrons total). Each O contributes 2 electrons to the shared pool, satisfying both atoms\' octets.' },

    { cat:'Electron Sharing', q:'In N₂ (nitrogen gas), what type of covalent bond connects the two N atoms?',
      opts:['Single bond','Double bond','Triple bond','Quadruple bond'], ans:'Triple bond',
      exp:'Each N has 5 valence electrons and needs 3 more. Two N atoms share 3 electron pairs (6 electrons) → triple bond. N₂ has one of the strongest bonds in chemistry (945 kJ/mol).' },

    { cat:'Octet Rule', q:'Why does Hydrogen need only 2 electrons to be stable, not 8?',
      opts:['H is in Period 1 — shell n=1 holds maximum 2 electrons','H is very small','H has too many protons','H is a noble gas'], ans:'H is in Period 1 — shell n=1 holds maximum 2 electrons',
      exp:'Hydrogen only has shell n=1, which holds a maximum of 2 electrons. So H only needs 2 electrons (like He) to be stable — it follows the "duet rule" instead of the octet rule.' },

    { cat:'Electronegativity', q:'Which pair of elements would MOST likely form an ionic bond?',
      opts:['H and Cl','O and O','C and H','K and F'], ans:'K and F',
      exp:'K has EN=0.82, F has EN=3.98. Difference = 3.16 — the largest of all options and well above the 1.7 ionic threshold. The other pairs have smaller EN differences and form covalent bonds.' },

    { cat:'Compound Identification', q:'Which of these is formed by an IONIC bond?',
      opts:['H₂O (Water)','CO₂ (Carbon Dioxide)','NaCl (Table Salt)','CH₄ (Methane)'], ans:'NaCl (Table Salt)',
      exp:'NaCl is formed when Na (metal) transfers 1 electron to Cl (nonmetal) → Na⁺ + Cl⁻. The other compounds — H₂O, CO₂, CH₄ — are all covalent (nonmetal + nonmetal).' },

    { cat:'Compound Identification', q:'In which compound does Carbon form 4 covalent bonds?',
      opts:['CO₂','CH₄','HCl','N₂'], ans:'CH₄',
      exp:'C has 4 valence electrons and needs 4 more for its octet. In CH₄, C forms 4 single bonds with 4 H atoms, satisfying all atoms. CO₂ also has 4 shared pairs but with only 2 bonds (2 double bonds).' },

    { cat:'Ion Configuration', q:'When Na loses 1 electron, which noble gas configuration does it achieve?',
      opts:['Helium (He)','Neon (Ne)','Argon (Ar)','Krypton (Kr)'], ans:'Neon (Ne)',
      exp:'Na has configuration 2,8,1. Losing 1 electron gives Na⁺ with configuration 2,8 — identical to Neon. This stable noble gas configuration is why Na readily loses 1 electron.' },

    { cat:'Bond Strength', q:'Which bond is STRONGER — a single covalent bond or a triple covalent bond?',
      opts:['Single bond','Both the same','Triple bond','Depends on the atoms'], ans:'Triple bond',
      exp:'Triple bonds share 3 pairs of electrons (6 electrons), creating much stronger attraction. N≡N bond energy = 945 kJ/mol vs H–H single bond = 432 kJ/mol. More shared pairs → shorter and stronger bond.' },

    { cat:'Real-World Application', q:'Why does dissolved NaCl (table salt in water) conduct electricity, but solid NaCl does not?',
      opts:['It contains metals','Dissolved Na⁺ and Cl⁻ ions can move freely to carry charge','Water is a good conductor','NaCl releases hydrogen gas in water'], ans:'Dissolved Na⁺ and Cl⁻ ions can move freely to carry charge',
      exp:'In solid NaCl the ions are locked in a crystal lattice — they cannot move, so no current flows. When dissolved, the lattice breaks apart into free Na⁺ and Cl⁻ ions that can migrate through the solution and carry electric charge.' }
  ];

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startQuiz() {
    quizSet      = shuffle(QPOOL).slice(0, 5);
    quizIdx      = 0;
    quizScore_   = 0;
    quizAnswered = false;
    quizResults  = [];
    quizStart.classList.add('hidden');
    quizResult.classList.add('hidden');
    quizQuestion.classList.remove('hidden');
    showQ();
  }

  function showQ() {
    var q = quizSet[quizIdx];
    qzScore.textContent = quizScore_;
    qzTotal.textContent = '5';
    qzProg.style.width  = (quizIdx / 5 * 100) + '%';
    qzCategory.textContent = q.cat;
    qzText.textContent     = q.q;
    quizAnswered = false;
    qzFeedback.classList.add('hidden');
    btnQNext.style.display = 'none';

    qzOptions.innerHTML = '';
    shuffle(q.opts).forEach(function(opt) {
      var btn = document.createElement('button');
      btn.className   = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('pointerdown', function() { checkQ(opt, q, btn); });
      qzOptions.appendChild(btn);
    });
  }

  function checkQ(sel, q, btn) {
    if (quizAnswered) return;
    quizAnswered = true;
    var ok = sel === q.ans;
    if (ok) quizScore_++;
    quizResults.push(ok);
    Array.from(qzOptions.children).forEach(function(b) {
      if (b.textContent === q.ans) b.classList.add('opt-correct');
      else if (b === btn && !ok) b.classList.add('opt-wrong');
      b.disabled = true;
    });
    qzFeedback.innerHTML = (ok ? '<span class="fb-ok">✓ Correct!</span> ' : '<span class="fb-wrong">✗ Incorrect.</span> ') + q.exp;
    qzFeedback.classList.remove('hidden');
    btnQNext.style.display = '';
    qzScore.textContent = quizScore_;
  }

  function nextQ() {
    quizIdx++;
    if (quizIdx >= 5) showResult();
    else showQ();
  }

  function showResult() {
    quizQuestion.classList.add('hidden');
    quizResult.classList.remove('hidden');
    qzProg.style.width = '100%';
    var stars = quizScore_ === 5 ? '★★★' : quizScore_ >= 3 ? '★★' : '★';
    var cls   = quizScore_ === 5 ? 'gold' : quizScore_ >= 3 ? 'silver' : 'bronze';
    qrStars.textContent = stars;
    qrStars.className   = 'qr-stars ' + cls;
    qrScore.textContent = quizScore_ + ' out of 5 (' + Math.round(quizScore_ / 5 * 100) + '%)';
    qrRows.innerHTML = quizSet.map(function(q, i) {
      var ok = quizResults[i];
      return '<div class="qr-row' + (ok ? '' : ' qr-wrong') + '">' +
        '<span class="qr-num">' + (i + 1) + '</span>' +
        '<span class="qr-q">' + q.q.slice(0, 72) + (q.q.length > 72 ? '…' : '') + '</span>' +
        '<span class="qr-status">' + (ok ? '✓' : '✗') + '</span></div>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     18.  MODE SWITCHING
  ══════════════════════════════════════════════════════ */
  function setMode(m) {
    mode = m;
    document.querySelectorAll('#mode-tabs .pill').forEach(function(p) {
      p.classList.toggle('active', p.dataset.value === m);
    });
    ['simulate','explore','quiz'].forEach(function(s) {
      document.getElementById('sec-' + s).classList.toggle('hidden', s !== m);
    });
    /* Pause RAF when not in simulate mode to save battery */
    if (m === 'simulate') {
      if (!rafId) { lastTS = performance.now(); rafId = requestAnimationFrame(loop); }
    } else {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    if (m === 'explore') renderExplore();
  }

  /* ══════════════════════════════════════════════════════
     19.  EVENT LISTENERS
  ══════════════════════════════════════════════════════ */
  modeTabs.addEventListener('pointerdown', function(e) {
    if (e.target.matches('.pill')) setMode(e.target.dataset.value);
  });

  bondTypeTabs.addEventListener('pointerdown', function(e) {
    if (!e.target.matches('.pill')) return;
    pracMode   = false;
    dynamicCmp = null;
    bondType   = e.target.dataset.value;
    document.querySelectorAll('#bond-type-tabs .pill').forEach(function(p) {
      p.classList.toggle('active', p.dataset.value === bondType);
    });
    var arr = bondType === 'covalent' ? COVALENT : IONIC;
    selectedId = arr[0].id;
    renderCompoundTabs();
    simPhase = 'idle';
    infoBox.classList.add('hidden');
    updateReadout(false);
    resetFreeze();
    resetViewToggles();
  });

  compoundTabs.addEventListener('pointerdown', function(e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    pracMode   = false;
    dynamicCmp = null;
    selectedId = pill.dataset.value;
    document.querySelectorAll('#compound-tabs .pill').forEach(function(p) {
      p.classList.toggle('active', p.dataset.value === selectedId);
    });
    simPhase = 'idle';
    infoBox.classList.add('hidden');
    updateReadout(false);
    resetFreeze();
    resetViewToggles();
  });

  btnSimulate.addEventListener('pointerdown', function() {
    if (simPhase === 'running') return;
    simPhase  = 'running';
    animStart = performance.now();
    infoBox.classList.add('hidden');
    resetFreeze();
    resetViewToggles();
    var isCovSim = pracMode && dynamicCmp ? dynamicCmp._type === 'covalent' : bondType === 'covalent';
    playBondSound(isCovSim ? 'covalent' : 'ionic');
  });

  btnReset.addEventListener('pointerdown', function() {
    pracMode   = false;
    dynamicCmp = null;
    simPhase   = 'idle';
    infoBox.classList.add('hidden');
    updateReadout(false);
    resetFreeze();
    resetViewToggles();
  });

  exploreTabs.addEventListener('pointerdown', function(e) {
    if (!e.target.matches('.pill')) return;
    exploreTab = e.target.dataset.value;
    document.querySelectorAll('#explore-tabs .pill').forEach(function(p) {
      p.classList.toggle('active', p.dataset.value === exploreTab);
    });
    renderExplore();
  });

  elSelector.addEventListener('pointerdown', function(e) {
    var btn = e.target.closest('.el-btn');
    if (!btn) return;
    var sym = btn.dataset.sym;
    if (!pracEl1 || (pracEl1 && pracEl2)) {
      pracEl1 = sym; pracEl2 = null;
    } else {
      pracEl2 = sym;
    }
    document.querySelectorAll('.el-btn').forEach(function(b) {
      b.classList.remove('el-sel1', 'el-sel2');
      if (b.dataset.sym === pracEl1) b.classList.add('el-sel1');
      if (pracEl2 && b.dataset.sym === pracEl2) b.classList.add('el-sel2');
    });
    updatePracticeSlots();
    resultPanel.innerHTML = '<div class="result-placeholder"><div class="result-icon">⚛</div><div>Select two elements and click &ldquo;Test Bond&rdquo;.</div></div>';
  });

  btnTest.addEventListener('pointerdown', runPractice);
  btnPracReset.addEventListener('pointerdown', function() {
    pracEl1 = pracEl2 = null;
    pracMode   = false;
    dynamicCmp = null;
    simPhase   = 'idle';
    resetFreeze();
    document.querySelectorAll('.el-btn').forEach(function(b) { b.classList.remove('el-sel1','el-sel2'); });
    updatePracticeSlots();
    resultPanel.innerHTML = '<div class="result-placeholder"><div class="result-icon">⚛</div><div>Select two elements and click &ldquo;Test Bond&rdquo;.</div></div>';
  });

  btnQStart.addEventListener('pointerdown', startQuiz);
  btnQNext.addEventListener('pointerdown',  nextQ);
  btnQRetry.addEventListener('pointerdown', function() {
    quizResult.classList.add('hidden');
    quizStart.classList.remove('hidden');
  });

  /* Freeze toggle */
  function resetFreeze() {
    freezeElectrons = false;
    if (btnFreeze) {
      btnFreeze.textContent = '\u23F8 Freeze';
      btnFreeze.classList.remove('btn-active');
    }
  }

  /* View-mode toggles — reset when compound changes or simulation starts */
  function resetViewToggles() {
    showValenceOnly   = false;
    showBondPairsOnly = false;
    if (btnValence)   { btnValence.textContent   = '\u26A1 Valence only'; btnValence.classList.remove('btn-active'); }
    if (btnBondPairs) { btnBondPairs.textContent = '\uD83D\uDD17 Bond pairs'; btnBondPairs.classList.remove('btn-active'); }
  }

  if (btnFreeze) btnFreeze.addEventListener('pointerdown', function() {
    freezeElectrons = !freezeElectrons;
    btnFreeze.textContent = freezeElectrons ? '\u25B6 Play' : '\u23F8 Freeze';
    btnFreeze.classList.toggle('btn-active', freezeElectrons);
  });

  /* Valence-only toggle — mutually exclusive with Bond pairs */
  if (btnValence) btnValence.addEventListener('pointerdown', function() {
    showValenceOnly = !showValenceOnly;
    if (showValenceOnly) {
      showBondPairsOnly = false;
      if (btnBondPairs) { btnBondPairs.textContent = '\uD83D\uDD17 Bond pairs'; btnBondPairs.classList.remove('btn-active'); }
    }
    btnValence.textContent = showValenceOnly ? '\u26A1 All shells' : '\u26A1 Valence only';
    btnValence.classList.toggle('btn-active', showValenceOnly);
  });

  /* Bond-pairs-only toggle — mutually exclusive with Valence only */
  if (btnBondPairs) btnBondPairs.addEventListener('pointerdown', function() {
    showBondPairsOnly = !showBondPairsOnly;
    if (showBondPairsOnly) {
      showValenceOnly = false;
      if (btnValence) { btnValence.textContent = '\u26A1 Valence only'; btnValence.classList.remove('btn-active'); }
    }
    btnBondPairs.textContent = showBondPairsOnly ? '\uD83D\uDD17 All e\u207B' : '\uD83D\uDD17 Bond pairs';
    btnBondPairs.classList.toggle('btn-active', showBondPairsOnly);
  });

  /* Nucleus hover tooltip — track mouse on canvas */
  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width  / rect.width);
    mouseY = (e.clientY - rect.top)  * (canvas.height / rect.height);
  });
  canvas.addEventListener('mouseleave', function() {
    mouseX = -9999; mouseY = -9999;
  });

  /* Export PNG button */
  if (btnExport) btnExport.addEventListener('pointerdown', exportPNG);

  /* Sound toggle */
  if (btnSoundToggle) btnSoundToggle.addEventListener('pointerdown', function() {
    soundOn = !soundOn;
    btnSoundToggle.textContent = soundOn ? '🔊' : '🔇';
    btnSoundToggle.title = soundOn ? 'Mute sounds' : 'Enable sounds';
  });

  /* Canvas right-click context menu */
  canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, [
      { label: '📷  Export PNG',       action: exportPNG },
      { label: showGrid ? '⊟  Hide Grid' : '⊞  Show Grid',
        action: function() { showGrid = !showGrid; } },
      { label: soundOn  ? '🔇  Mute Sounds' : '🔊  Unmute Sounds',
        action: function() {
          soundOn = !soundOn;
          if (btnSoundToggle) { btnSoundToggle.textContent = soundOn ? '🔊' : '🔇'; }
        }
      },
      { label: '↺  Reset Animation', action: function() {
          pracMode = false; dynamicCmp = null; simPhase = 'idle';
          infoBox.classList.add('hidden'); updateReadout(false); resetFreeze();
        }, danger: false
      }
    ]);
  });

  /* ══════════════════════════════════════════════════════
     20.  INIT
  ══════════════════════════════════════════════════════ */
  fitCanvas();   /* before the first paint — resizing a canvas clears it */
  renderCompoundTabs();
  updateReadout(false);
  renderPracticeElements();
  updatePracticeSlots();

  /* Refit when the card width changes; the rAF loop repaints continuously. */
  window.addEventListener('resize', fitCanvas);

  lastTS = performance.now();
  rafId  = requestAnimationFrame(loop);

})();
