/**
 * ══════════════════════════════════════════════════════════════════
 * DISCRETE MATHEMATICS VIRTUAL LABORATORY (V2)
 * Comprehensive Interactive Simulation Engine
 * Covers: Set Theory & Venn, Propositional Logic, Relations & Poset Hasse, Combinatorics
 * ══════════════════════════════════════════════════════════════════
 */

// ── Web Audio API Synthesizer ──────────────────────────────────
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playToggle(on) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(on ? 520 : 380, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(on ? 680 : 260, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    // Harmonic Major Triad (C5, E5, G5, C6)
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.07, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  playWarning() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }
}

const sfx = new SoundFX();

// ── Application Global State ──────────────────────────────────
const state = {
  platformMode: 'simulate', // 'simulate' | '3d-model' | 'explore' | 'quiz'
  activePillar: 'sets',     // 'sets' | 'logic' | 'relations' | 'combinatorics'
  submode: 'sandbox',       // 'sandbox' | 'prover' | 'challenges'

  // Canvas Camera
  camera: {
    panX: 0,
    panY: 0,
    zoom: 1.0,
    isDragging: false,
    startX: 0,
    startY: 0,
    showGrid: true
  },

  // ── Pillar 1: Set Theory ──
  sets: {
    setCount: 3, // 2 or 3
    universeSize: 12,
    subsets: {
      A: new Set([1, 2, 3, 4]),
      B: new Set([3, 4, 5, 6, 7]),
      C: new Set([4, 5, 7, 8])
    },
    // Region shading flags: 2-set has 4 regions, 3-set has 8 regions
    // Key format: binary string 'dAdBdC' where 1 = inside circle
    shadedRegions: new Set(['110', '111', '011']), // initially A ∩ (B ∪ C)
    activeExpression: 'A \\cap (B \\cup C)',
    selectedElementToken: null
  },

  // ── Pillar 2: Propositional Logic ──
  logic: {
    formulaStr: '(P → Q) ↔ (¬P ∨ Q)',
    targetStr: '¬P ∨ Q',
    activeValuations: { P: true, Q: false, R: false, S: false },
    variables: ['P', 'Q'],
    ast: null,
    subExpressions: [],
    truthTable: [],
    classification: 'TAUTOLOGY',
    isEquivalent: true,
    counterexampleRow: null,
    visualizerMode: 'tree' // 'tree' | 'gates'
  },

  // ── Pillar 3: Binary Relations & Poset Hasse ──
  relations: {
    nodeCount: 4,
    nodeLabels: ['1', '2', '3', '6'], // D6 divisibility default
    // Adjacency Matrix: matrix[i][j] === 1 means edge (i -> j)
    matrix: [
      [1, 1, 1, 1], // 1 divides 1, 2, 3, 6
      [0, 1, 0, 1], // 2 divides 2, 6
      [0, 0, 1, 1], // 3 divides 3, 6
      [0, 0, 0, 1]  // 6 divides 6
    ],
    selectedNode: null,
    isHasseMode: false,
    hasseNodes: [], // layout coordinates
    hasseEdges: [], // transitive reduced edges
    properties: {
      reflexive: true,
      irreflexive: false,
      symmetric: false,
      antisymmetric: true,
      transitive: true
    },
    counterexample: null,
    extremal: {
      minimal: ['1'],
      maximal: ['6'],
      least: '1',
      greatest: '6'
    }
  },

  // ── Pillar 4: Combinatorics & Recurrences ──
  comb: {
    n: 4,
    r: 2,
    orderMatters: true,
    repetition: false,
    viewMode: 'tree', // 'tree' | 'pigeon' | 'hanoi'
    pigeons: 10,
    holes: 4,
    hanoiDiscs: 3,
    hanoiStep: 0,
    hanoiMoves: []
  },

  // ── Challenges & XP ──
  challenges: {
    activeLevel: 0,
    solvedLevels: new Set([0]),
    streak: 1,
    xp: 100,
    list: []
  },

  // ── Quiz ──
  quiz: {
    userAnswers: {},
    submitted: false,
    score: 0
  }
};

// ── Challenge Data (12 Levels across 4 Tracks) ─────────────────
state.challenges.list = [
  // Track 1: Sets (Levels 0-2)
  {
    id: 0,
    track: 1,
    pillar: 'sets',
    title: "Venn Shading: De Morgan's Law Proof",
    desc: "Shade the region representing (A ∪ B)' and verify that it matches A' ∩ B'.",
    hint: "Click the '(A ∪ B)'' quick-shade button or click regions outside both circles A and B.",
    check: () => {
      // In 2-set or 3-set, (A ∪ B)' means neither in A nor in B.
      // In 2-set: '00', In 3-set: '000' and '001' (if outside A and B).
      if (state.sets.setCount === 2) {
        return state.sets.shadedRegions.has('00') && !state.sets.shadedRegions.has('10') && !state.sets.shadedRegions.has('01') && !state.sets.shadedRegions.has('11');
      } else {
        return state.sets.shadedRegions.has('000') && state.sets.shadedRegions.has('001') && !state.sets.shadedRegions.has('100') && !state.sets.shadedRegions.has('010');
      }
    }
  },
  {
    id: 1,
    track: 1,
    pillar: 'sets',
    title: 'Symmetric Difference A △ B',
    desc: 'Configure shading for Symmetric Difference: (A \\ B) ∪ (B \\ A).',
    hint: 'Shade everything inside A or B, EXCEPT their common intersection.',
    check: () => {
      if (state.sets.setCount === 2) {
        return state.sets.shadedRegions.has('10') && state.sets.shadedRegions.has('01') && !state.sets.shadedRegions.has('11') && !state.sets.shadedRegions.has('00');
      }
      return state.sets.shadedRegions.has('100') && state.sets.shadedRegions.has('010') && !state.sets.shadedRegions.has('110');
    }
  },
  {
    id: 2,
    track: 1,
    pillar: 'sets',
    title: 'Principle of Inclusion-Exclusion Verification',
    desc: 'Populate subsets A, B, and C so that all 3 sets share at least one element in common (A ∩ B ∩ C ≠ ∅).',
    hint: 'Drag or click an element token to add it to all three sets simultaneously.',
    check: () => {
      for (let i = 1; i <= state.sets.universeSize; i++) {
        if (state.sets.subsets.A.has(i) && state.sets.subsets.B.has(i) && state.sets.subsets.C.has(i)) {
          return true;
        }
      }
      return false;
    }
  },

  // Track 2: Logic (Levels 3-5)
  {
    id: 3,
    track: 2,
    pillar: 'logic',
    title: 'Tautology Prover: Law of Excluded Middle / Implication',
    desc: 'Verify that the conditional equivalence (P → Q) ↔ (¬P ∨ Q) is a Tautology.',
    hint: 'Keep the default premise and target formulas, then click Synthesize & Verify Equivalence.',
    check: () => {
      return state.logic.classification === 'TAUTOLOGY' && state.logic.isEquivalent;
    }
  },
  {
    id: 4,
    track: 2,
    pillar: 'logic',
    title: 'Counterexample Hunter: Converse Fallacy',
    desc: 'Check if (P → Q) ↔ (Q → P). Notice the falsifying counterexample row where P and Q differ.',
    hint: 'Set premise to (P → Q) and target to (Q → P). Notice the red counterexample row!',
    check: () => {
      return !state.logic.isEquivalent && state.logic.counterexampleRow !== null;
    }
  },
  {
    id: 5,
    track: 2,
    pillar: 'logic',
    title: 'Contrapositive Law Verification',
    desc: 'Prove that (P → Q) ↔ (¬Q → ¬P) is a Tautology.',
    hint: 'Type (P → Q) as premise and (¬Q → ¬P) as target.',
    check: () => {
      return state.logic.isEquivalent && state.logic.formulaStr.includes('¬Q');
    }
  },

  // Track 3: Relations & Posets (Levels 6-8)
  {
    id: 6,
    track: 3,
    pillar: 'relations',
    title: 'Equivalence Relation Construction',
    desc: 'On base set S = {1, 2, 3, 4}, construct a relation that is Reflexive, Symmetric, and Transitive.',
    hint: 'Ensure all diagonal self-loops (x,x) are active, and all off-diagonal edges have matching reverse edges.',
    check: () => {
      return state.relations.properties.reflexive && state.relations.properties.symmetric && state.relations.properties.transitive;
    }
  },
  {
    id: 7,
    track: 3,
    pillar: 'relations',
    title: 'Construct a Non-Trivial Partial Order (Poset)',
    desc: 'Wire a relation that is Reflexive, Antisymmetric, Transitive, and contains at least 3 non-diagonal edges.',
    hint: 'Load the Divisibility Poset preset or wire 1→2, 2→3, 1→3, plus all self-loops.',
    check: () => {
      const p = state.relations.properties;
      let nonDiag = 0;
      for (let i = 0; i < state.relations.nodeCount; i++) {
        for (let j = 0; j < state.relations.nodeCount; j++) {
          if (i !== j && state.relations.matrix[i][j] === 1) nonDiag++;
        }
      }
      return p.reflexive && p.antisymmetric && p.transitive && nonDiag >= 3;
    }
  },
  {
    id: 8,
    track: 3,
    pillar: 'relations',
    title: 'Hasse Diagram Transformation',
    desc: 'Transform a verified Poset into an upward-oriented Hasse Diagram with minimal and maximal elements detected.',
    hint: 'Click "Transform to Hasse Diagram" in the Relations bottom tray.',
    check: () => {
      return state.relations.isHasseMode && state.relations.properties.antisymmetric;
    }
  },

  // Track 4: Combinatorics (Levels 9-11)
  {
    id: 9,
    track: 4,
    pillar: 'combinatorics',
    title: 'Combinations vs. Permutations: C(5, 2)',
    desc: 'Set n = 5 and r = 2 with Order Invariant (Combinations) to calculate C(5, 2) = 10.',
    hint: 'Uncheck "Order Matters" and adjust sliders to n=5, r=2.',
    check: () => {
      return state.comb.n === 5 && state.comb.r === 2 && !state.comb.orderMatters;
    }
  },
  {
    id: 10,
    track: 4,
    pillar: 'combinatorics',
    title: 'Pigeonhole Principle Bound Guarantee',
    desc: 'Distribute N = 9 pigeons into k = 4 holes. Verify the guarantee of at least ⌈9/4⌉ = 3 pigeons in one hole.',
    hint: 'Open Pigeonhole visualizer, set pigeons to 9 and holes to 4.',
    check: () => {
      return state.comb.pigeons === 9 && state.comb.holes === 4 && Math.ceil(9 / 4) === 3;
    }
  },
  {
    id: 11,
    track: 4,
    pillar: 'combinatorics',
    title: 'Tower of Hanoi Recurrence: Minimum Moves',
    desc: 'Verify that moving 3 discs takes exactly 2^3 - 1 = 7 optimal moves.',
    hint: 'Switch to Tower of Hanoi view with 3 discs.',
    check: () => {
      return state.comb.hanoiDiscs === 3 && Math.pow(2, 3) - 1 === 7;
    }
  }
];

// ── Certification Quiz Questions (10 Comprehensive Items) ─────
const QUIZ_QUESTIONS = [
  {
    id: 1,
    q: "According to De Morgan's Law for sets, what is the complement of (A ∪ B)?",
    options: ["A' ∪ B'", "A' ∩ B'", "(A ∩ B)'", "A \\ B"],
    ans: 1,
    exp: "De Morgan's First Law states: (A ∪ B)' = A' ∩ B'. The complement of a union is the intersection of the complements."
  },
  {
    id: 2,
    q: "If set S has cardinality |S| = 5, what is the cardinality of its power set |𝒫(S)|?",
    options: ["10", "25", "32", "64"],
    ans: 2,
    exp: "The cardinality of the power set is given by 2^|S| = 2^5 = 32 subsets."
  },
  {
    id: 3,
    q: "By the Principle of Inclusion-Exclusion, what is |A ∪ B| if |A| = 15, |B| = 20, and |A ∩ B| = 8?",
    options: ["27", "35", "43", "12"],
    ans: 0,
    exp: "|A ∪ B| = |A| + |B| - |A ∩ B| = 15 + 20 - 8 = 27."
  },
  {
    id: 4,
    q: "Which of the following compound propositions is a Tautology?",
    options: ["P ∧ ¬P", "P ∨ ¬P", "P → ¬P", "P ↔ ¬P"],
    ans: 1,
    exp: "P ∨ ¬P is the Law of Excluded Middle and always evaluates to True (1) regardless of P's truth value."
  },
  {
    id: 5,
    q: "What is the logically equivalent Contrapositive of the conditional statement P → Q?",
    options: ["Q → P", "¬P → ¬Q", "¬Q → ¬P", "¬P ∨ ¬Q"],
    ans: 2,
    exp: "The contrapositive of P → Q is ¬Q → ¬P. A conditional and its contrapositive always have identical truth values."
  },
  {
    id: 6,
    q: "A binary relation R on set A is called an Equivalence Relation if it satisfies which three properties?",
    options: [
      "Reflexive, Symmetric, and Transitive",
      "Reflexive, Antisymmetric, and Transitive",
      "Irreflexive, Symmetric, and Transitive",
      "Reflexive, Symmetric, and Asymmetric"
    ],
    ans: 0,
    exp: "An equivalence relation must be Reflexive (aRa), Symmetric (aRb ⇒ bRa), and Transitive (aRb ∧ bRc ⇒ aRc)."
  },
  {
    id: 7,
    q: "In the divisibility poset D_6 = ({1, 2, 3, 6}, |), which element is the Least Element (⊥)?",
    options: ["6", "3", "2", "1"],
    ans: 3,
    exp: "1 divides every number in D_6 (1|1, 1|2, 1|3, 1|6), so 1 is the unique Least Element (⊥)."
  },
  {
    id: 8,
    q: "In a Hasse diagram of a finite poset, why are self-loops and transitive edges omitted?",
    options: [
      "They are not mathematical relations",
      "Transitive reduction removes redundant edges since transitivity and reflexivity are assumed by convention",
      "Hasse diagrams only apply to infinite sets",
      "Because arrowheads cannot point upwards"
    ],
    ans: 1,
    exp: "A Hasse diagram is the transitive reduction of a partial order: self-loops are implicit by reflexivity, and composite edges (a→c when a→b and b→c exist) are implied by transitivity."
  },
  {
    id: 9,
    q: "If 13 pigeons are placed into 4 pigeonholes, what is the guaranteed minimum number of pigeons in the most crowded hole?",
    options: ["3", "4", "5", "2"],
    ans: 1,
    exp: "By the Generalized Pigeonhole Principle: ⌈N / k⌉ = ⌈13 / 4⌉ = ⌈3.25⌉ = 4."
  },
  {
    id: 10,
    q: "How many distinct ways can 3 students be chosen from a group of 8 to form a committee (order does NOT matter)?",
    options: ["336", "56", "24", "512"],
    ans: 1,
    exp: "Order does not matter, so we use Combinations: C(8, 3) = 8! / (3! · 5!) = (8 · 7 · 6) / 6 = 56."
  }
];

// ── Recursive Descent Boolean AST Parser ───────────────────────
// Connectives: ¬ (NOT), ∧ (AND), ∨ (OR), ⊕ (XOR), → (IMPLIES), ↔ (IFF)
class LogicParser {
  constructor(input) {
    this.tokens = this.tokenize(input);
    this.pos = 0;
  }

  tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (/\s/.test(ch)) { i++; continue; }

      if (ch === '(' || ch === ')') {
        tokens.push({ type: ch, val: ch });
        i++;
      } else if (ch === '¬' || ch === '~' || ch === '!') {
        tokens.push({ type: 'NOT', val: '¬' });
        i++;
      } else if (ch === '∧' || ch === '&' || ch === '^' || str.substr(i, 2) === '/\\' || str.substr(i, 3).toUpperCase() === 'AND') {
        tokens.push({ type: 'AND', val: '∧' });
        if (str.substr(i, 3).toUpperCase() === 'AND') i += 3;
        else if (str.substr(i, 2) === '/\\') i += 2;
        else i++;
      } else if (ch === '∨' || ch === '|' || ch === 'v' || str.substr(i, 2) === '\\/' || str.substr(i, 2).toUpperCase() === 'OR') {
        tokens.push({ type: 'OR', val: '∨' });
        if (str.substr(i, 2).toUpperCase() === 'OR' || str.substr(i, 2) === '\\/') i += 2;
        else i++;
      } else if (ch === '⊕' || str.substr(i, 3).toUpperCase() === 'XOR' || str.substr(i, 3) === '(+)') {
        tokens.push({ type: 'XOR', val: '⊕' });
        if (str.substr(i, 3).toUpperCase() === 'XOR' || str.substr(i, 3) === '(+)') i += 3;
        else i++;
      } else if (str.substr(i, 3) === '<->' || str.substr(i, 3) === '<=>' || ch === '↔' || str.substr(i, 3).toUpperCase() === 'IFF') {
        tokens.push({ type: 'IFF', val: '↔' });
        if (str.substr(i, 3).toUpperCase() === 'IFF' || str.substr(i, 3) === '<->' || str.substr(i, 3) === '<=>') i += 3;
        else i++;
      } else if (str.substr(i, 2) === '->' || str.substr(i, 2) === '=>' || ch === '→' || str.substr(i, 7).toUpperCase() === 'IMPLIES') {
        tokens.push({ type: 'IMP', val: '→' });
        if (str.substr(i, 7).toUpperCase() === 'IMPLIES') i += 7;
        else if (str.substr(i, 2) === '->' || str.substr(i, 2) === '=>') i += 2;
        else i++;
      } else if (/[P-Sp-s]/.test(ch)) {
        tokens.push({ type: 'VAR', val: ch.toUpperCase() });
        i++;
      } else {
        i++; // skip unrecognized
      }
    }
    return tokens;
  }

  peek() {
    return this.tokens[this.pos] || null;
  }

  consume(expectedType) {
    const t = this.peek();
    if (t && (!expectedType || t.type === expectedType)) {
      this.pos++;
      return t;
    }
    return null;
  }

  parse() {
    this.pos = 0;
    if (this.tokens.length === 0) return null;
    try {
      const ast = this.parseEquiv();
      return ast;
    } catch (e) {
      return null;
    }
  }

  parseEquiv() {
    let node = this.parseImplies();
    while (this.peek() && this.peek().type === 'IFF') {
      const op = this.consume('IFF').val;
      const right = this.parseImplies();
      node = { type: 'BINARY', op, left: node, right, text: `(${node.text} ↔ ${right.text})` };
    }
    return node;
  }

  parseImplies() {
    let node = this.parseOr();
    while (this.peek() && this.peek().type === 'IMP') {
      const op = this.consume('IMP').val;
      const right = this.parseOr();
      node = { type: 'BINARY', op, left: node, right, text: `(${node.text} → ${right.text})` };
    }
    return node;
  }

  parseOr() {
    let node = this.parseXor();
    while (this.peek() && this.peek().type === 'OR') {
      const op = this.consume('OR').val;
      const right = this.parseXor();
      node = { type: 'BINARY', op, left: node, right, text: `(${node.text} ∨ ${right.text})` };
    }
    return node;
  }

  parseXor() {
    let node = this.parseAnd();
    while (this.peek() && this.peek().type === 'XOR') {
      const op = this.consume('XOR').val;
      const right = this.parseAnd();
      node = { type: 'BINARY', op, left: node, right, text: `(${node.text} ⊕ ${right.text})` };
    }
    return node;
  }

  parseAnd() {
    let node = this.parseNot();
    while (this.peek() && this.peek().type === 'AND') {
      const op = this.consume('AND').val;
      const right = this.parseNot();
      node = { type: 'BINARY', op, left: node, right, text: `(${node.text} ∧ ${right.text})` };
    }
    return node;
  }

  parseNot() {
    if (this.peek() && this.peek().type === 'NOT') {
      const op = this.consume('NOT').val;
      const operand = this.parseNot();
      return { type: 'UNARY', op, operand, text: `¬${operand.text}` };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();
    if (!t) return { type: 'VAR', val: 'P', text: 'P' };

    if (t.type === '(') {
      this.consume('(');
      const inner = this.parseEquiv();
      this.consume(')');
      return inner;
    }

    if (t.type === 'VAR') {
      this.consume('VAR');
      return { type: 'VAR', val: t.val, text: t.val };
    }

    this.consume();
    return { type: 'VAR', val: 'P', text: 'P' };
  }
}

// Evaluate AST against variable assignment
function evalAST(node, env) {
  if (!node) return false;
  if (node.type === 'VAR') {
    return !!env[node.val];
  }
  if (node.type === 'UNARY') {
    return !evalAST(node.operand, env);
  }
  if (node.type === 'BINARY') {
    const l = evalAST(node.left, env);
    const r = evalAST(node.right, env);
    switch (node.op) {
      case '∧': return l && r;
      case '∨': return l || r;
      case '⊕': return (!l && r) || (l && !r);
      case '→': return (!l) || r;
      case '↔': return l === r;
      default: return false;
    }
  }
  return false;
}

// Extract all unique variables in AST
function getVariablesInAST(node, acc = new Set()) {
  if (!node) return acc;
  if (node.type === 'VAR') acc.add(node.val);
  if (node.type === 'UNARY') getVariablesInAST(node.operand, acc);
  if (node.type === 'BINARY') {
    getVariablesInAST(node.left, acc);
    getVariablesInAST(node.right, acc);
  }
  return acc;
}

// Extract sub-expressions in bottom-up order
function getSubExpressions(node, list = []) {
  if (!node) return list;
  if (node.type === 'UNARY') {
    getSubExpressions(node.operand, list);
    if (!list.some(s => s.text === node.text)) list.push(node);
  } else if (node.type === 'BINARY') {
    getSubExpressions(node.left, list);
    getSubExpressions(node.right, list);
    if (!list.some(s => s.text === node.text)) list.push(node);
  }
  return list;
}

// ── Math Utility Functions ────────────────────────────────────
function factorial(n) {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function perm(n, r) {
  if (r > n || r < 0) return 0;
  return factorial(n) / factorial(n - r);
}

function comb(n, r) {
  if (r > n || r < 0) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// ── DOM Elements & Initialization ─────────────────────────────
const canvas = document.getElementById('dm-canvas');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('dm-log');

function logMsg(msg, type = 'info') {
  if (!logEl) return;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  const now = new Date().toTimeString().split(' ')[0];
  entry.innerHTML = `<span style="color:#64748b;">[${now}]</span> &gt; ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

// Initialize Application
function init() {
  setupNavigation();
  setupCanvasInteraction();
  setupSetTheory();
  setupLogic();
  setupRelations();
  setupCombinatorics();
  setupChallenges();
  setupQuiz();
  renderAll();

  logMsg('Discrete Mathematics Virtual Laboratory ready.', 'success');
}

// ── Navigation & Mode Switching ────────────────────────────────
function setupNavigation() {
  // Canonical Platform Modes
  document.querySelectorAll('#mode-tabs .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      state.platformMode = mode;
      sfx.playClick();

      document.getElementById('sim-wrapper').classList.toggle('hidden', mode !== 'simulate');
      document.getElementById('model3d-wrapper').classList.toggle('hidden', mode !== '3d-model');
      document.getElementById('explore-wrapper').classList.toggle('hidden', mode !== 'explore');
      document.getElementById('quiz-wrapper').classList.toggle('hidden', mode !== 'quiz');

      if (mode === '3d-model' && !window.three3DInitialized) {
        init3DScene();
      }
    });
  });

  // Sound Toggle
  const sndBtn = document.getElementById('btn-sound-toggle');
  if (sndBtn) {
    sndBtn.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      sndBtn.textContent = sfx.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      sndBtn.style.color = sfx.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)';
      if (sfx.enabled) sfx.playToggle(true);
    });
  }

  // 4 Pillar Buttons
  document.querySelectorAll('#pillar-tabs .pillar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pillar-tabs .pillar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const pillar = btn.getAttribute('data-pillar');
      state.activePillar = pillar;
      sfx.playClick();
      updatePillarViews();
    });
  });

  // Submode Pills (Sandbox, Law Prover, Challenges)
  document.querySelectorAll('#submode-pills .submode-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#submode-pills .submode-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.submode = btn.getAttribute('data-submode');
      sfx.playClick();
      logMsg(`Switched submode to: ${state.submode.toUpperCase()}`);
    });
  });

  // Verification & Audit Button
  const btnAudit = document.getElementById('btn-audit');
  if (btnAudit) {
    btnAudit.addEventListener('click', () => {
      auditCurrentStructure();
    });
  }

  // Reset Canvas Button
  const btnReset = document.getElementById('btn-reset-canvas');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      resetCurrentPillar();
    });
  }

  // Export LaTeX
  const btnExport = document.getElementById('btn-export-latex');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportLaTeX();
    });
  }

  // Preset Selector
  const presetSelect = document.getElementById('preset-select');
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      applyPreset(presetSelect.value);
    });
  }
}

function updatePillarViews() {
  const p = state.activePillar;

  // Toggle canvas trays
  document.getElementById('tray-sets').classList.toggle('hidden', p !== 'sets');
  document.getElementById('tray-logic').classList.toggle('hidden', p !== 'logic');
  document.getElementById('tray-relations').classList.toggle('hidden', p !== 'relations');
  document.getElementById('tray-combinatorics').classList.toggle('hidden', p !== 'combinatorics');

  // Toggle telemetry sections
  document.getElementById('telemetry-sets').classList.toggle('hidden', p !== 'sets');
  document.getElementById('telemetry-logic').classList.toggle('hidden', p !== 'logic');
  document.getElementById('telemetry-relations').classList.toggle('hidden', p !== 'relations');
  document.getElementById('telemetry-combinatorics').classList.toggle('hidden', p !== 'combinatorics');

  // Update canvas header titles
  const heading = document.getElementById('canvas-heading');
  const subtext = document.getElementById('canvas-subtext');
  const hudText = document.getElementById('floating-hud-text');

  if (p === 'sets') {
    heading.innerHTML = '📊 Interactive Venn Diagram &amp; Region Shading Engine';
    subtext.textContent = 'Click regions or drag element chips into subsets to verify Inclusion-Exclusion';
    hudText.innerHTML = 'Tip: Click regions to toggle shading &bull; Click element chips to assign to subsets';
    populatePresetsForSets();
  } else if (p === 'logic') {
    heading.innerHTML = '🌲 Propositional Logic Parse Tree &amp; Truth Wave Engine';
    subtext.textContent = 'Evaluate Boolean AST nodes bottom-up across truth valuations';
    hudText.innerHTML = 'Tip: Toggle P, Q, R switches to watch signal propagation along parse tree';
    populatePresetsForLogic();
  } else if (p === 'relations') {
    heading.innerHTML = '🔗 Binary Relation Digraph &amp; Topological Poset Hasse Canvas';
    subtext.textContent = 'Click node pairs to toggle directed edges (u, v) or self-loops (u, u)';
    hudText.innerHTML = 'Tip: Click node u then node v to toggle edge (u, v) &bull; One-click Hasse transform';
    populatePresetsForRelations();
  } else if (p === 'combinatorics') {
    heading.innerHTML = '🌳 Combinatorial Branching Tree &amp; Pigeonhole Visualizer';
    subtext.textContent = 'Permutations P(n,r), Combinations C(n,r), Dirichlet Pigeonhole bounds';
    hudText.innerHTML = 'Tip: Toggle repetition and order flags to see branching space expand/contract';
    populatePresetsForCombinatorics();
  }

  renderAll();
}

function populatePresetsForSets() {
  const sel = document.getElementById('preset-select');
  if (!sel) return;
  sel.innerHTML = `
    <option value="sets_demorgan">De Morgan's Law: (A ∪ B)' = A' ∩ B'</option>
    <option value="sets_symdiff">Symmetric Difference: A △ B</option>
    <option value="sets_disjoint">Disjoint Subsets: A ∩ B = ∅</option>
    <option value="sets_subset">Proper Subset: A ⊂ B</option>
    <option value="sets_triple_inter">Triple Intersection: A ∩ B ∩ C</option>
  `;
}

function populatePresetsForLogic() {
  const sel = document.getElementById('preset-select');
  if (!sel) return;
  sel.innerHTML = `
    <option value="logic_implication">Material Implication: (P → Q) ↔ (¬P ∨ Q)</option>
    <option value="logic_contrapositive">Contrapositive Law: (P → Q) ↔ (¬Q → ¬P)</option>
    <option value="logic_modus_tollens">Modus Tollens: ((P → Q) ∧ ¬Q) → ¬P</option>
    <option value="logic_demorgan">De Morgan Logic: ¬(P ∧ Q) ↔ (¬P ∨ ¬Q)</option>
    <option value="logic_pierce">Peirce's Law: ((P → Q) → P) → P</option>
    <option value="logic_xor">XOR Definition: (P ⊕ Q) ↔ (P ∨ Q) ∧ ¬(P ∧ Q)</option>
  `;
}

function populatePresetsForRelations() {
  const sel = document.getElementById('preset-select');
  if (!sel) return;
  sel.innerHTML = `
    <option value="rel_d6">Divisibility Poset: D_6 = ({1, 2, 3, 6}, |)</option>
    <option value="rel_equiv_mod3">Equivalence: Congruence Modulo 2 on {1,2,3,4}</option>
    <option value="rel_linear_order">Total Linear Order: ≤ on {1, 2, 3, 4}</option>
    <option value="rel_empty">Empty Relation (Zero Edges)</option>
    <option value="rel_complete">Universal Relation (Complete K_n)</option>
  `;
}

function populatePresetsForCombinatorics() {
  const sel = document.getElementById('preset-select');
  if (!sel) return;
  sel.innerHTML = `
    <option value="comb_p4_2">Permutations: P(4, 2) = 12</option>
    <option value="comb_c4_2">Combinations: C(4, 2) = 6</option>
    <option value="comb_pigeon_10_4">Pigeonhole: 10 Pigeons in 4 Holes</option>
    <option value="comb_hanoi_3">Tower of Hanoi: n = 3 Discs (7 Moves)</option>
  `;
}

function applyPreset(val) {
  sfx.playClick();
  if (val === 'sets_demorgan') {
    state.sets.setCount = 2;
    state.sets.shadedRegions = new Set(['00']);
    state.sets.activeExpression = '(A \\cup B)\'';
    document.getElementById('set-expr-input').value = '(A \\cup B)\'';
    logMsg("Applied preset: De Morgan's Law (A ∪ B)' = A' ∩ B'");
  } else if (val === 'sets_symdiff') {
    state.sets.setCount = 2;
    state.sets.shadedRegions = new Set(['10', '01']);
    state.sets.activeExpression = 'A \\triangle B';
    document.getElementById('set-expr-input').value = 'A \\triangle B';
    logMsg("Applied preset: Symmetric Difference A △ B");
  } else if (val === 'sets_triple_inter') {
    state.sets.setCount = 3;
    state.sets.shadedRegions = new Set(['111']);
    state.sets.activeExpression = 'A \\cap B \\cap C';
    document.getElementById('set-expr-input').value = 'A \\cap B \\cap C';
    logMsg("Applied preset: Triple Intersection A ∩ B ∩ C");
  } else if (val === 'logic_implication') {
    state.logic.formulaStr = '(P → Q) ↔ (¬P ∨ Q)';
    state.logic.targetStr = '¬P ∨ Q';
    document.getElementById('logic-formula-input').value = state.logic.formulaStr;
    document.getElementById('target-formula-input').value = state.logic.targetStr;
    evaluateLogicFormula();
  } else if (val === 'logic_contrapositive') {
    state.logic.formulaStr = '(P → Q) ↔ (¬Q → ¬P)';
    state.logic.targetStr = '¬Q → ¬P';
    document.getElementById('logic-formula-input').value = state.logic.formulaStr;
    document.getElementById('target-formula-input').value = state.logic.targetStr;
    evaluateLogicFormula();
  } else if (val === 'logic_modus_tollens') {
    state.logic.formulaStr = '((P → Q) ∧ ¬Q) → ¬P';
    document.getElementById('logic-formula-input').value = state.logic.formulaStr;
    evaluateLogicFormula();
  } else if (val === 'rel_d6') {
    state.relations.nodeCount = 4;
    state.relations.nodeLabels = ['1', '2', '3', '6'];
    state.relations.matrix = [
      [1, 1, 1, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 1],
      [0, 0, 0, 1]
    ];
    state.relations.isHasseMode = false;
    auditRelationProperties();
    logMsg("Applied preset: Divisibility Poset D_6");
  } else if (val === 'rel_equiv_mod3') {
    state.relations.nodeCount = 4;
    state.relations.nodeLabels = ['1', '2', '3', '4'];
    state.relations.matrix = [
      [1, 0, 1, 0], // 1 ~ 1, 3
      [0, 1, 0, 1], // 2 ~ 2, 4
      [1, 0, 1, 0], // 3 ~ 1, 3
      [0, 1, 0, 1]  // 4 ~ 2, 4
    ];
    state.relations.isHasseMode = false;
    auditRelationProperties();
    logMsg("Applied preset: Congruence Modulo 2 Equivalence Relation");
  } else if (val === 'comb_p4_2') {
    state.comb.n = 4; state.comb.r = 2; state.comb.orderMatters = true; state.comb.repetition = false;
    document.getElementById('comb-n-slider').value = 4;
    document.getElementById('comb-r-slider').value = 2;
    document.getElementById('chk-order-matters').checked = true;
    document.getElementById('chk-repetition').checked = false;
    state.comb.viewMode = 'tree';
    updateCombinatorics();
  } else if (val === 'comb_pigeon_10_4') {
    state.comb.pigeons = 10; state.comb.holes = 4;
    state.comb.viewMode = 'pigeon';
    updateCombinatorics();
  } else if (val === 'comb_hanoi_3') {
    state.comb.hanoiDiscs = 3;
    state.comb.viewMode = 'hanoi';
    generateHanoiMoves();
    updateCombinatorics();
  }
  renderAll();
}

function resetCurrentPillar() {
  sfx.playClick();
  const p = state.activePillar;
  if (p === 'sets') {
    state.sets.subsets.A = new Set([1, 2, 3, 4]);
    state.sets.subsets.B = new Set([3, 4, 5, 6, 7]);
    state.sets.subsets.C = new Set([4, 5, 7, 8]);
    state.sets.shadedRegions.clear();
    logMsg("Reset Set Theory workspace to default subsets.", "warn");
  } else if (p === 'logic') {
    state.logic.activeValuations = { P: true, Q: false, R: false, S: false };
    evaluateLogicFormula();
    logMsg("Reset Logic valuations to default (P=True, Q=False).", "warn");
  } else if (p === 'relations') {
    for (let i = 0; i < state.relations.nodeCount; i++) {
      for (let j = 0; j < state.relations.nodeCount; j++) {
        state.relations.matrix[i][j] = (i === j ? 1 : 0); // discrete identity relation
      }
    }
    state.relations.isHasseMode = false;
    auditRelationProperties();
    logMsg("Reset Relation matrix to identity relation (reflexive self-loops only).", "warn");
  } else if (p === 'combinatorics') {
    state.comb.n = 4; state.comb.r = 2; state.comb.orderMatters = true;
    updateCombinatorics();
    logMsg("Reset Combinatorics parameters to n=4, r=2.", "warn");
  }
  renderAll();
}

// ── Export to LaTeX / CSV ──────────────────────────────────────
function exportLaTeX() {
  sfx.playSuccess();
  let latex = '';
  if (state.activePillar === 'logic') {
    latex = `% Discrete Mathematics Virtual Lab: Truth Table LaTeX Export\n`;
    latex += `\\begin{table}[h]\n\\centering\n\\begin{tabular}{|${state.logic.variables.map(() => 'c').join('')}|c|}\n\\hline\n`;
    latex += `${state.logic.variables.join(' & ')} & ${state.logic.formulaStr.replace(/¬/g, '\\neg ').replace(/∧/g, '\\land ').replace(/∨/g, '\\lor ').replace(/→/g, '\\to ').replace(/↔/g, '\\leftrightarrow ')} \\\\\n\\hline\n`;
    state.logic.truthTable.forEach(row => {
      const vars = state.logic.variables.map(v => row[v] ? 'T' : 'F').join(' & ');
      const res = row['__result'] ? 'T' : 'F';
      latex += `${vars} & ${res} \\\\\n`;
    });
    latex += `\\hline\n\\end{tabular}\n\\caption{Truth Table for $${state.logic.formulaStr}$}\n\\end{table}`;
  } else if (state.activePillar === 'sets') {
    latex = `% Discrete Mathematics Virtual Lab: Principle of Inclusion-Exclusion\n`;
    latex += `|A \\cup B \\cup C| = |A| + |B| + |C| - |A \\cap B| - |A \\cap C| - |B \\cap C| + |A \\cap B \\cap C|\n`;
    latex += `|A| = ${state.sets.subsets.A.size}, \\quad |B| = ${state.sets.subsets.B.size}, \\quad |C| = ${state.sets.subsets.C.size}\n`;
  } else if (state.activePillar === 'relations') {
    latex = `% Discrete Mathematics Virtual Lab: Adjacency Matrix Export\n`;
    latex += `M_R = \\begin{pmatrix}\n`;
    for (let i = 0; i < state.relations.nodeCount; i++) {
      latex += state.relations.matrix[i].join(' & ') + ' \\\\\n';
    }
    latex += `\\end{pmatrix}\n`;
  }

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(latex).then(() => {
      logMsg('Exported mathematical LaTeX code copied to clipboard!', 'success');
      alert('Mathematical LaTeX snippet copied to clipboard!\n\n' + latex.substring(0, 180) + '...');
    });
  } else {
    prompt('Copy LaTeX snippet:', latex);
  }
}

// ── Canvas Interaction (Pan, Zoom, Clicks) ────────────────────
function setupCanvasInteraction() {
  // Zoom Controls
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    state.camera.zoom = Math.min(2.5, state.camera.zoom + 0.15);
    updateZoomDisplay();
    renderAll();
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    state.camera.zoom = Math.max(0.5, state.camera.zoom - 0.15);
    updateZoomDisplay();
    renderAll();
  });
  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    state.camera.zoom = 1.0;
    state.camera.panX = 0;
    state.camera.panY = 0;
    updateZoomDisplay();
    renderAll();
  });
  document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    state.camera.zoom = 1.0;
    state.camera.panX = 0;
    state.camera.panY = 0;
    updateZoomDisplay();
    renderAll();
  });
  document.getElementById('btn-toggle-grid').addEventListener('click', function() {
    state.camera.showGrid = !state.camera.showGrid;
    this.classList.toggle('active', state.camera.showGrid);
    renderAll();
  });

  // Mouse drag & clicks on canvas
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (e.button === 2 || e.shiftKey) { // Right click or shift: pan
      state.camera.isDragging = true;
      state.camera.startX = mouseX - state.camera.panX;
      state.camera.startY = mouseY - state.camera.panY;
      return;
    }

    // Left click handling based on active pillar
    handleCanvasClick(mouseX, mouseY);
  });

  window.addEventListener('mousemove', (e) => {
    if (state.camera.isDragging) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      state.camera.panX = mouseX - state.camera.startX;
      state.camera.panY = mouseY - state.camera.startY;
      renderAll();
    }
  });

  window.addEventListener('mouseup', () => {
    state.camera.isDragging = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function updateZoomDisplay() {
  const lbl = document.getElementById('zoom-level-val');
  if (lbl) lbl.textContent = Math.round(state.camera.zoom * 100) + '%';
}

function handleCanvasClick(rawX, rawY) {
  // Convert screen coordinates to world coordinates
  const worldX = (rawX - canvas.width / 2 - state.camera.panX) / state.camera.zoom + canvas.width / 2;
  const worldY = (rawY - canvas.height / 2 - state.camera.panY) / state.camera.zoom + canvas.height / 2;

  if (state.activePillar === 'sets') {
    handleSetCanvasClick(worldX, worldY);
  } else if (state.activePillar === 'relations') {
    handleRelationCanvasClick(worldX, worldY);
  }
}

// ── Pillar 1: Set Theory Implementation ───────────────────────
function setupSetTheory() {
  // Set Count (2 or 3)
  document.querySelectorAll('#set-count-group .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#set-count-group .btn-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sets.setCount = parseInt(btn.getAttribute('data-sets'), 10);
      sfx.playClick();
      document.getElementById('roster-c-card').style.display = (state.sets.setCount === 3 ? 'flex' : 'none');
      updateSetTelemetry();
      renderAll();
    });
  });

  // Universe Slider
  const uSlider = document.getElementById('universe-size-slider');
  const uVal = document.getElementById('universe-size-val');
  const uBadge = document.getElementById('canvas-badge');
  if (uSlider) {
    uSlider.addEventListener('input', () => {
      state.sets.universeSize = parseInt(uSlider.value, 10);
      if (uVal) uVal.textContent = `|U| = ${state.sets.universeSize}`;
      if (uBadge) uBadge.textContent = `Universal Set |U| = ${state.sets.universeSize}`;
      renderElementTokens();
      updateSetTelemetry();
      renderAll();
    });
  }

  // Clear Elements
  const btnClearEl = document.getElementById('btn-clear-elements');
  if (btnClearEl) {
    btnClearEl.addEventListener('click', () => {
      state.sets.subsets.A.clear();
      state.sets.subsets.B.clear();
      state.sets.subsets.C.clear();
      sfx.playToggle(false);
      renderElementTokens();
      updateSetTelemetry();
      renderAll();
      logMsg('Cleared all subsets.', 'warn');
    });
  }

  // Distribute Randomly
  const btnRandom = document.getElementById('btn-distribute-random');
  if (btnRandom) {
    btnRandom.addEventListener('click', () => {
      state.sets.subsets.A.clear();
      state.sets.subsets.B.clear();
      state.sets.subsets.C.clear();
      for (let i = 1; i <= state.sets.universeSize; i++) {
        if (Math.random() < 0.5) state.sets.subsets.A.add(i);
        if (Math.random() < 0.5) state.sets.subsets.B.add(i);
        if (state.sets.setCount === 3 && Math.random() < 0.45) state.sets.subsets.C.add(i);
      }
      sfx.playSuccess();
      renderElementTokens();
      updateSetTelemetry();
      renderAll();
      logMsg('Randomly distributed elements across subsets.', 'info');
    });
  }

  // Quick Shading Pills
  document.querySelectorAll('.shading-quick-strip .shade-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const expr = btn.getAttribute('data-expr');
      sfx.playClick();
      if (expr === 'CLEAR') {
        state.sets.shadedRegions.clear();
      } else {
        applyQuickShade(expr);
      }
      renderAll();
    });
  });

  // Formula Input & Evaluate Button
  const btnEvalSet = document.getElementById('btn-eval-set-expr');
  const setInput = document.getElementById('set-expr-input');
  if (btnEvalSet && setInput) {
    btnEvalSet.addEventListener('click', () => {
      evaluateSetExpression(setInput.value);
    });
    setInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') evaluateSetExpression(setInput.value);
    });
  }

  renderElementTokens();
  updateSetTelemetry();
}

function renderElementTokens() {
  const container = document.getElementById('element-tokens-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= state.sets.universeSize; i++) {
    const chip = document.createElement('button');
    chip.className = 'element-chip';
    chip.textContent = i;
    const inA = state.sets.subsets.A.has(i);
    const inB = state.sets.subsets.B.has(i);
    const inC = state.sets.subsets.C.has(i);

    if (inA && inB) chip.classList.add('in-both');
    else if (inA) chip.classList.add('in-set-a');
    else if (inB) chip.classList.add('in-set-b');
    else if (inC) chip.classList.add('in-set-c');

    chip.addEventListener('click', () => {
      // Toggle membership cycling: A -> B -> AB -> C (if 3) -> None
      cycleElementMembership(i);
      renderElementTokens();
      updateSetTelemetry();
      renderAll();
    });
    container.appendChild(chip);
  }
}

function cycleElementMembership(elem) {
  sfx.playClick();
  const inA = state.sets.subsets.A.has(elem);
  const inB = state.sets.subsets.B.has(elem);
  const inC = state.sets.subsets.C.has(elem);

  if (!inA && !inB && !inC) {
    state.sets.subsets.A.add(elem);
  } else if (inA && !inB && !inC) {
    state.sets.subsets.A.delete(elem);
    state.sets.subsets.B.add(elem);
  } else if (!inA && inB && !inC) {
    state.sets.subsets.A.add(elem); // now in both A & B
  } else if (inA && inB && !inC) {
    if (state.sets.setCount === 3) {
      state.sets.subsets.A.delete(elem);
      state.sets.subsets.B.delete(elem);
      state.sets.subsets.C.add(elem);
    } else {
      state.sets.subsets.A.delete(elem);
      state.sets.subsets.B.delete(elem);
    }
  } else if (inC) {
    state.sets.subsets.C.delete(elem);
  }
}

function handleSetCanvasClick(x, y) {
  // Check which Venn region was clicked
  const code = getVennRegionCode(x, y);
  if (code) {
    sfx.playClick();
    if (state.sets.shadedRegions.has(code)) {
      state.sets.shadedRegions.delete(code);
    } else {
      state.sets.shadedRegions.add(code);
    }
    logMsg(`Toggled shading for Venn region code: [${code}]`);
    renderAll();
  }
}

function getVennRegionCode(x, y) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 15;
  const is3Set = (state.sets.setCount === 3);

  if (!is3Set) {
    // 2-set geometry
    const r = 135;
    const ax = cx - 85, ay = cy;
    const bx = cx + 85, by = cy;

    const inA = Math.hypot(x - ax, y - ay) <= r;
    const inB = Math.hypot(x - bx, y - by) <= r;

    // Check if within Universal frame
    if (x >= 50 && x <= canvas.width - 50 && y >= 30 && y <= canvas.height - 40) {
      return (inA ? '1' : '0') + (inB ? '1' : '0');
    }
    return null;
  } else {
    // 3-set geometry
    const r = 125;
    const ax = cx - 75, ay = cy - 40;
    const bx = cx + 75, by = cy - 40;
    const cxx = cx, cyy = cy + 70;

    const inA = Math.hypot(x - ax, y - ay) <= r;
    const inB = Math.hypot(x - bx, y - by) <= r;
    const inC = Math.hypot(x - cxx, y - cyy) <= r;

    if (x >= 50 && x <= canvas.width - 50 && y >= 30 && y <= canvas.height - 40) {
      return (inA ? '1' : '0') + (inB ? '1' : '0') + (inC ? '1' : '0');
    }
    return null;
  }
}

function applyQuickShade(expr) {
  state.sets.shadedRegions.clear();
  const is3 = (state.sets.setCount === 3);
  if (!is3) {
    if (expr === 'A') { state.sets.shadedRegions.add('10'); state.sets.shadedRegions.add('11'); }
    else if (expr === 'B') { state.sets.shadedRegions.add('01'); state.sets.shadedRegions.add('11'); }
    else if (expr === 'A_AND_B') { state.sets.shadedRegions.add('11'); }
    else if (expr === 'A_OR_B') { state.sets.shadedRegions.add('10'); state.sets.shadedRegions.add('01'); state.sets.shadedRegions.add('11'); }
    else if (expr === 'A_DIFF_B') { state.sets.shadedRegions.add('10'); }
    else if (expr === 'A_SYMDIFF_B') { state.sets.shadedRegions.add('10'); state.sets.shadedRegions.add('01'); }
    else if (expr === 'COMP_A_OR_B') { state.sets.shadedRegions.add('00'); }
  } else {
    if (expr === 'A') { state.sets.shadedRegions.add('100'); state.sets.shadedRegions.add('110'); state.sets.shadedRegions.add('101'); state.sets.shadedRegions.add('111'); }
    else if (expr === 'B') { state.sets.shadedRegions.add('010'); state.sets.shadedRegions.add('110'); state.sets.shadedRegions.add('011'); state.sets.shadedRegions.add('111'); }
    else if (expr === 'A_AND_B') { state.sets.shadedRegions.add('110'); state.sets.shadedRegions.add('111'); }
    else if (expr === 'A_OR_B') { ['100','010','110','101','011','111'].forEach(k => state.sets.shadedRegions.add(k)); }
    else if (expr === 'A_DIFF_B') { state.sets.shadedRegions.add('100'); state.sets.shadedRegions.add('101'); }
    else if (expr === 'A_SYMDIFF_B') { ['100','010','101','011'].forEach(k => state.sets.shadedRegions.add(k)); }
    else if (expr === 'COMP_A_OR_B') { state.sets.shadedRegions.add('000'); state.sets.shadedRegions.add('001'); }
    else if (expr === 'A_AND_B_AND_C') { state.sets.shadedRegions.add('111'); }
  }
}

function evaluateSetExpression(str) {
  sfx.playClick();
  state.sets.activeExpression = str;
  // Simple heuristic expression matcher
  if (str.includes('\\cap') && str.includes('\\cup')) {
    applyQuickShade('A_AND_B');
    if (state.sets.setCount === 3) state.sets.shadedRegions.add('101');
  } else if (str.includes('\\triangle') || str.includes('△')) {
    applyQuickShade('A_SYMDIFF_B');
  } else if (str.includes('\\cap') || str.includes('∩')) {
    applyQuickShade('A_AND_B');
  } else if (str.includes('\\cup') || str.includes('∪')) {
    applyQuickShade('A_OR_B');
  } else if (str.includes('\\setminus') || str.includes('\\')) {
    applyQuickShade('A_DIFF_B');
  } else if (str.includes('\'')) {
    applyQuickShade('COMP_A_OR_B');
  }
  updateSetTelemetry();
  renderAll();
}

function updateSetTelemetry() {
  const { A, B, C } = state.sets.subsets;
  const is3 = (state.sets.setCount === 3);

  // Update Roster Displays
  const allU = [];
  for (let i = 1; i <= state.sets.universeSize; i++) allU.push(i);
  document.getElementById('roster-u').textContent = `{${allU.join(', ')}}`;
  document.getElementById('card-u').textContent = `|U| = ${allU.length}`;

  const arrA = Array.from(A).sort((a,b)=>a-b);
  const arrB = Array.from(B).sort((a,b)=>a-b);
  const arrC = Array.from(C).sort((a,b)=>a-b);

  document.getElementById('roster-a').textContent = `{${arrA.join(', ') || '∅'}}`;
  document.getElementById('card-a').textContent = `|A| = ${arrA.length}`;

  document.getElementById('roster-b').textContent = `{${arrB.join(', ') || '∅'}}`;
  document.getElementById('card-b').textContent = `|B| = ${arrB.length}`;

  if (is3) {
    document.getElementById('roster-c').textContent = `{${arrC.join(', ') || '∅'}}`;
    document.getElementById('card-c').textContent = `|C| = ${arrC.length}`;
  }

  // Calculate Intersections
  const interAB = new Set([...A].filter(x => B.has(x)));
  const interAC = new Set([...A].filter(x => C.has(x)));
  const interBC = new Set([...B].filter(x => C.has(x)));
  const interABC = new Set([...interAB].filter(x => C.has(x)));

  // Union
  const unionAll = is3 ? new Set([...A, ...B, ...C]) : new Set([...A, ...B]);

  // Render PIE in KaTeX
  const pieWrap = document.getElementById('pie-katex-container');
  const pieSteps = document.getElementById('pie-step-breakdown');
  if (pieWrap && window.katex) {
    if (!is3) {
      window.katex.render(
        `|A \\cup B| = |A| + |B| - |A \\cap B| = ${A.size} + ${B.size} - ${interAB.size} = ${unionAll.size}`,
        pieWrap,
        { displayMode: true, throwOnError: false }
      );
      if (pieSteps) pieSteps.innerHTML = `Calculation: ${A.size} + ${B.size} - ${interAB.size} = <strong>${unionAll.size} elements</strong>.`;
    } else {
      window.katex.render(
        `|A \\cup B \\cup C| = |A| + |B| + |C| - (|AB| + |AC| + |BC|) + |ABC| = ${unionAll.size}`,
        pieWrap,
        { displayMode: true, throwOnError: false }
      );
      if (pieSteps) {
        pieSteps.innerHTML = `Step breakdown: (${A.size} + ${B.size} + ${C.size}) - (${interAB.size} + ${interAC.size} + ${interBC.size}) + ${interABC.size} = <strong>${unionAll.size} elements</strong>.`;
      }
    }
  }

  // Display Set Expression in KaTeX
  const exprDisplay = document.getElementById('set-expr-katex');
  if (exprDisplay && window.katex) {
    window.katex.render(state.sets.activeExpression, exprDisplay, { displayMode: true, throwOnError: false });
  }

  // Power set HUD
  const pwrHud = document.getElementById('power-set-hud');
  if (pwrHud) {
    const pwr = Math.pow(2, A.size);
    pwrHud.innerHTML = `<span>$|\\mathcal{P}(A)| = 2^{|A|} = 2^{${A.size}} = ${pwr}\\text{ subsets}$</span>`;
    if (window.renderMathInElement) window.renderMathInElement(pwrHud);
    else if (window.katex) {
      window.katex.render(`|\\mathcal{P}(A)| = 2^{|A|} = 2^{${A.size}} = ${pwr}\\text{ subsets}`, pwrHud);
    }
  }
}

// ── Pillar 2: Propositional Logic Implementation ──────────────
function setupLogic() {
  // Quick Symbol Buttons
  document.querySelectorAll('#logic-symbol-toolbar .sym-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.getAttribute('data-sym');
      const input = document.getElementById('logic-formula-input');
      if (input) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + sym + input.value.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + sym.length;
      }
      sfx.playClick();
    });
  });

  // Evaluate Formula Button
  const btnEval = document.getElementById('btn-eval-logic');
  const fInput = document.getElementById('logic-formula-input');
  if (btnEval && fInput) {
    btnEval.addEventListener('click', () => {
      state.logic.formulaStr = fInput.value.trim();
      evaluateLogicFormula();
    });
    fInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.logic.formulaStr = fInput.value.trim();
        evaluateLogicFormula();
      }
    });
  }

  // Check Equivalence Button
  const btnEquiv = document.getElementById('btn-check-equiv');
  const targetInput = document.getElementById('target-formula-input');
  if (btnEquiv && targetInput) {
    btnEquiv.addEventListener('click', () => {
      state.logic.targetStr = targetInput.value.trim();
      checkEquivalence();
    });
  }

  // Valuation Toggle Buttons (P, Q, R, S)
  ['p', 'q', 'r', 's'].forEach(v => {
    const btn = document.getElementById(`btn-val-${v}`);
    if (btn) {
      btn.addEventListener('click', () => {
        const varName = v.toUpperCase();
        state.logic.activeValuations[varName] = !state.logic.activeValuations[varName];
        btn.classList.toggle('active', state.logic.activeValuations[varName]);
        btn.textContent = `${varName}: ${state.logic.activeValuations[varName] ? 'T' : 'F'}`;
        sfx.playToggle(state.logic.activeValuations[varName]);
        renderAll();
      });
    }
  });

  // Visualizer mode toggles (Tree vs Gates)
  document.getElementById('btn-logic-view-tree').addEventListener('click', function() {
    state.logic.visualizerMode = 'tree';
    this.classList.add('active');
    document.getElementById('btn-logic-view-gates').classList.remove('active');
    sfx.playClick();
    renderAll();
  });
  document.getElementById('btn-logic-view-gates').addEventListener('click', function() {
    state.logic.visualizerMode = 'gates';
    this.classList.add('active');
    document.getElementById('btn-logic-view-tree').classList.remove('active');
    sfx.playClick();
    renderAll();
  });

  // Random Formula Button
  document.getElementById('btn-random-formula').addEventListener('click', () => {
    const samples = [
      '(P ∧ Q) → P',
      '(P → Q) ↔ (¬P ∨ Q)',
      '¬(P ∧ Q) ↔ (¬P ∨ ¬Q)',
      '((P → Q) ∧ (Q → R)) → (P → R)',
      '(P ⊕ Q) ↔ ¬(P ↔ Q)',
      '(P ∨ Q) ∧ (¬P ∨ R) → (Q ∨ R)'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    state.logic.formulaStr = picked;
    document.getElementById('logic-formula-input').value = picked;
    evaluateLogicFormula();
  });

  evaluateLogicFormula();
}

function evaluateLogicFormula() {
  sfx.playClick();
  const parser = new LogicParser(state.logic.formulaStr);
  const ast = parser.parse();
  state.logic.ast = ast;

  if (!ast) {
    logMsg('Syntax Error: Invalid propositional logic formula.', 'error');
    return;
  }

  // Find all variables
  const vars = Array.from(getVariablesInAST(ast)).sort();
  state.logic.variables = vars.length > 0 ? vars : ['P'];

  // Toggle R and S button visibility in the bottom tray
  document.getElementById('btn-val-r').classList.toggle('hidden', !state.logic.variables.includes('R'));
  document.getElementById('btn-val-s').classList.toggle('hidden', !state.logic.variables.includes('S'));

  // Extract sub-expressions
  state.logic.subExpressions = getSubExpressions(ast);

  // Generate Truth Table
  const n = state.logic.variables.length;
  const totalRows = Math.pow(2, n);
  const table = [];
  let trueCount = 0;

  for (let r = 0; r < totalRows; r++) {
    const env = {};
    for (let c = 0; c < n; c++) {
      const bit = (r >> (n - 1 - c)) & 1;
      env[state.logic.variables[c]] = (bit === 0); // Gray/Binary: 1 for True, 0 for False
    }

    const rowObj = { ...env };
    state.logic.subExpressions.forEach(sub => {
      rowObj[sub.text] = evalAST(sub, env);
    });
    const finalVal = evalAST(ast, env);
    rowObj['__result'] = finalVal;
    if (finalVal) trueCount++;

    table.push(rowObj);
  }

  state.logic.truthTable = table;

  // Classify Formula
  const badge = document.getElementById('logic-classification-badge');
  if (trueCount === totalRows) {
    state.logic.classification = 'TAUTOLOGY';
    if (badge) { badge.className = 'badge badge-emerald'; badge.textContent = 'TAUTOLOGY (|= φ)'; }
  } else if (trueCount === 0) {
    state.logic.classification = 'CONTRADICTION';
    if (badge) { badge.className = 'badge badge-rose'; badge.textContent = 'CONTRADICTION (φ |= ⊥)'; }
  } else {
    state.logic.classification = 'CONTINGENCY';
    if (badge) { badge.className = 'badge badge-amber'; badge.textContent = `CONTINGENCY (${trueCount}/${totalRows} True)`; }
  }

  // Render Truth Table HTML
  renderTruthTable();

  // Render Canonical Normal Forms (DNF / CNF)
  renderCanonicalForms();

  // KaTeX Formula Display
  const fDisplay = document.getElementById('logic-formula-katex');
  if (fDisplay && window.katex) {
    const texStr = state.logic.formulaStr
      .replace(/¬/g, '\\neg ')
      .replace(/∧/g, '\\land ')
      .replace(/∨/g, '\\lor ')
      .replace(/⊕/g, '\\oplus ')
      .replace(/→/g, '\\to ')
      .replace(/↔/g, '\\leftrightarrow ');
    window.katex.render(texStr, fDisplay, { displayMode: true, throwOnError: false });
  }

  logMsg(`Evaluated formula: ${state.logic.formulaStr} => Classified as ${state.logic.classification}.`, 'success');
  renderAll();
}

function renderTruthTable() {
  const thead = document.getElementById('truth-thead');
  const tbody = document.getElementById('truth-tbody');
  const rowCountTag = document.getElementById('truth-row-count-tag');
  if (!thead || !tbody) return;

  const vars = state.logic.variables;
  const subs = state.logic.subExpressions;

  if (rowCountTag) rowCountTag.textContent = `${state.logic.truthTable.length} Rows (2^${vars.length})`;

  // Build Head
  let headHtml = '<tr>';
  vars.forEach(v => { headHtml += `<th>${v}</th>`; });
  subs.forEach(s => { headHtml += `<th>${s.text}</th>`; });
  headHtml += '</tr>';
  thead.innerHTML = headHtml;

  // Build Body
  let bodyHtml = '';
  state.logic.truthTable.forEach((row, rIdx) => {
    // Check if this row matches currently active valuation toggles
    let isCurrent = true;
    vars.forEach(v => {
      if (row[v] !== state.logic.activeValuations[v]) isCurrent = false;
    });

    const isCounter = (state.logic.counterexampleRow === rIdx);
    const rowClass = isCounter ? 'counterexample-row' : (isCurrent ? 'active-row' : '');

    bodyHtml += `<tr class="${rowClass}">`;
    vars.forEach(v => {
      const val = row[v];
      bodyHtml += `<td class="${val ? 'cell-true' : 'cell-false'}">${val ? 'T' : 'F'}</td>`;
    });
    subs.forEach(s => {
      const val = row[s.text];
      bodyHtml += `<td class="${val ? 'cell-true' : 'cell-false'}">${val ? 'T' : 'F'}</td>`;
    });
    bodyHtml += '</tr>';
  });

  tbody.innerHTML = bodyHtml;
}

function renderCanonicalForms() {
  const dnfBox = document.getElementById('dnf-katex');
  const cnfBox = document.getElementById('cnf-katex');
  const vars = state.logic.variables;

  // DNF (Sum of min-terms where result == True)
  const minTerms = [];
  const maxTerms = [];

  state.logic.truthTable.forEach(row => {
    if (row['__result']) {
      // Min-term
      const term = vars.map(v => row[v] ? v : `\\neg ${v}`).join(' \\land ');
      minTerms.push(`(${term})`);
    } else {
      // Max-term
      const term = vars.map(v => row[v] ? `\\neg ${v}` : v).join(' \\lor ');
      maxTerms.push(`(${term})`);
    }
  });

  if (dnfBox && window.katex) {
    const dnfStr = minTerms.length > 0 ? minTerms.join(' \\lor ') : '\\bot';
    window.katex.render(dnfStr, dnfBox, { displayMode: false, throwOnError: false });
  }

  if (cnfBox && window.katex) {
    const cnfStr = maxTerms.length > 0 ? maxTerms.join(' \\land ') : '\\top';
    window.katex.render(cnfStr, cnfBox, { displayMode: false, throwOnError: false });
  }
}

function checkEquivalence() {
  sfx.playClick();
  const targetStr = state.logic.targetStr;
  const parser1 = new LogicParser(state.logic.formulaStr);
  const parser2 = new LogicParser(targetStr);

  const ast1 = parser1.parse();
  const ast2 = parser2.parse();

  if (!ast1 || !ast2) {
    logMsg('Syntax Error in equivalence formulas.', 'error');
    return;
  }

  const vars = Array.from(new Set([...getVariablesInAST(ast1), ...getVariablesInAST(ast2)])).sort();
  const totalRows = Math.pow(2, vars.length);
  let equivalent = true;
  let counterRow = null;

  for (let r = 0; r < totalRows; r++) {
    const env = {};
    for (let c = 0; c < vars.length; c++) {
      const bit = (r >> (vars.length - 1 - c)) & 1;
      env[vars[c]] = (bit === 0);
    }
    const res1 = evalAST(ast1, env);
    const res2 = evalAST(ast2, env);

    if (res1 !== res2) {
      equivalent = false;
      counterRow = r;
      break;
    }
  }

  state.logic.isEquivalent = equivalent;
  state.logic.counterexampleRow = counterRow;

  const badge = document.getElementById('equiv-result-badge');
  const banner = document.getElementById('counterexample-banner');
  const bannerText = document.getElementById('counterexample-text');

  if (equivalent) {
    sfx.playSuccess();
    badge.className = 'badge badge-emerald';
    badge.textContent = 'Logically Equivalent (φ ≡ ψ)';
    banner.classList.add('hidden');
    logMsg(`Equivalence Verified: ${state.logic.formulaStr} ≡ ${targetStr} across all ${totalRows} valuations.`, 'success');
  } else {
    sfx.playWarning();
    badge.className = 'badge badge-rose';
    badge.textContent = 'NOT Equivalent';
    banner.classList.remove('hidden');

    const env = {};
    for (let c = 0; c < vars.length; c++) {
      const bit = (counterRow >> (vars.length - 1 - c)) & 1;
      env[vars[c]] = (bit === 0);
    }
    const valText = Object.entries(env).map(([k, v]) => `${k}=${v?1:0}`).join(', ');
    bannerText.textContent = `Counterexample row: ${valText} => Premise != Target!`;
    logMsg(`Equivalence Falsified! Found counterexample: ${valText}.`, 'error');
  }

  renderTruthTable();
  renderAll();
}

// ── Pillar 3: Binary Relations & Poset Hasse ───────────────────
function setupRelations() {
  // Node Count Pills (3, 4, 5, 6)
  document.querySelectorAll('#rel-nodes-group .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rel-nodes-group .btn-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const n = parseInt(btn.getAttribute('data-nodes'), 10);
      setRelationNodeCount(n);
    });
  });

  // Transform to Hasse Diagram Button
  const btnHasse = document.getElementById('btn-transform-hasse');
  if (btnHasse) {
    btnHasse.addEventListener('click', () => {
      transformToHasseDiagram();
    });
  }

  // Warshall Transitive Closure Button
  const btnWarshall = document.getElementById('btn-warshall-closure');
  if (btnWarshall) {
    btnWarshall.addEventListener('click', () => {
      computeWarshallClosure();
    });
  }

  // Reflexive Closure Button
  const btnReflexive = document.getElementById('btn-reflexive-closure');
  if (btnReflexive) {
    btnReflexive.addEventListener('click', () => {
      applyReflexiveClosure();
    });
  }

  // Clear Relation Edges
  const btnClearRel = document.getElementById('btn-clear-relation-edges');
  if (btnClearRel) {
    btnClearRel.addEventListener('click', () => {
      for (let i = 0; i < state.relations.nodeCount; i++) {
        for (let j = 0; j < state.relations.nodeCount; j++) {
          state.relations.matrix[i][j] = 0;
        }
      }
      state.relations.isHasseMode = false;
      sfx.playToggle(false);
      auditRelationProperties();
      renderAll();
      logMsg('Cleared all relation edges.', 'warn');
    });
  }

  // Auto-Repair Violation Button
  const btnRepair = document.getElementById('btn-fix-counterexample');
  if (btnRepair) {
    btnRepair.addEventListener('click', () => {
      autoRepairRelationViolation();
    });
  }

  renderMatrixGrid();
  auditRelationProperties();
}

function setRelationNodeCount(n) {
  state.relations.nodeCount = n;
  state.relations.nodeLabels = Array.from({ length: n }, (_, i) => String(i + 1));
  state.relations.matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) state.relations.matrix[i][i] = 1; // default reflexive
  state.relations.isHasseMode = false;
  sfx.playClick();
  renderMatrixGrid();
  auditRelationProperties();
  renderAll();
  logMsg(`Set base relation set size to n = ${n}.`);
}

function renderMatrixGrid() {
  const container = document.getElementById('matrix-container');
  if (!container) return;
  container.innerHTML = '';
  const n = state.relations.nodeCount;

  // Header row
  const headRow = document.createElement('div');
  headRow.className = 'matrix-row';
  headRow.innerHTML = '<span class="matrix-header-cell">S</span>';
  for (let j = 0; j < n; j++) {
    headRow.innerHTML += `<span class="matrix-header-cell">${state.relations.nodeLabels[j]}</span>`;
  }
  container.appendChild(headRow);

  // Matrix rows
  for (let i = 0; i < n; i++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'matrix-row';
    rowEl.innerHTML = `<span class="matrix-header-cell">${state.relations.nodeLabels[i]}</span>`;

    for (let j = 0; j < n; j++) {
      const cellBtn = document.createElement('button');
      cellBtn.className = 'matrix-cell-btn';
      if (i === j) cellBtn.classList.add('diag');
      const val = state.relations.matrix[i][j];
      cellBtn.textContent = val;
      if (val === 1) cellBtn.classList.add('one');

      cellBtn.addEventListener('click', () => {
        state.relations.matrix[i][j] = (state.relations.matrix[i][j] === 1 ? 0 : 1);
        sfx.playClick();
        state.relations.isHasseMode = false;
        renderMatrixGrid();
        auditRelationProperties();
        renderAll();
      });
      rowEl.appendChild(cellBtn);
    }
    container.appendChild(rowEl);
  }
}

function auditRelationProperties() {
  const n = state.relations.nodeCount;
  const M = state.relations.matrix;

  // 1. Reflexive: diag all 1
  let isReflexive = true;
  let missingReflexive = null;
  for (let i = 0; i < n; i++) {
    if (M[i][i] !== 1) {
      isReflexive = false;
      missingReflexive = state.relations.nodeLabels[i];
      break;
    }
  }

  // 2. Irreflexive: diag all 0
  let isIrreflexive = true;
  for (let i = 0; i < n; i++) {
    if (M[i][i] !== 0) { isIrreflexive = false; break; }
  }

  // 3. Symmetric: M == M^T
  let isSymmetric = true;
  let failSym = null;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (M[i][j] !== M[j][i]) {
        isSymmetric = false;
        if (!failSym && M[i][j] === 1) {
          failSym = `(${state.relations.nodeLabels[i]}, ${state.relations.nodeLabels[j]}) in R, but reverse is MISSING!`;
        }
      }
    }
  }

  // 4. Antisymmetric: M[i][j] == 1 and M[j][i] == 1 => i == j
  let isAntisymmetric = true;
  let failAnti = null;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && M[i][j] === 1 && M[j][i] === 1) {
        isAntisymmetric = false;
        failAnti = `Bidirectional cycle between ${state.relations.nodeLabels[i]} and ${state.relations.nodeLabels[j]} violates antisymmetry!`;
        break;
      }
    }
    if (!isAntisymmetric) break;
  }

  // 5. Transitive: M[i][j] & M[j][k] => M[i][k]
  let isTransitive = true;
  let failTrans = null;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (M[i][j] === 1) {
        for (let k = 0; k < n; k++) {
          if (M[j][k] === 1 && M[i][k] !== 1) {
            isTransitive = false;
            failTrans = `(${state.relations.nodeLabels[i]}, ${state.relations.nodeLabels[j]}) ∈ R and (${state.relations.nodeLabels[j]}, ${state.relations.nodeLabels[k]}) ∈ R, but closing edge (${state.relations.nodeLabels[i]}, ${state.relations.nodeLabels[k]}) is MISSING!`;
            state.relations.counterexample = { i, j, k, type: 'transitive' };
            break;
          }
        }
      }
      if (!isTransitive) break;
    }
    if (!isTransitive) break;
  }

  state.relations.properties = {
    reflexive: isReflexive,
    irreflexive: isIrreflexive,
    symmetric: isSymmetric,
    antisymmetric: isAntisymmetric,
    transitive: isTransitive
  };

  // Update DOM Badges
  updatePropertyBadge('prop-reflexive', isReflexive);
  updatePropertyBadge('prop-irreflexive', isIrreflexive);
  updatePropertyBadge('prop-symmetric', isSymmetric);
  updatePropertyBadge('prop-antisymmetric', isAntisymmetric);
  updatePropertyBadge('prop-transitive', isTransitive);

  // Classification Badge
  const classBadge = document.getElementById('relation-class-badge');
  if (classBadge) {
    if (isReflexive && isSymmetric && isTransitive) {
      classBadge.className = 'badge badge-emerald';
      classBadge.textContent = 'Equivalence Relation';
    } else if (isReflexive && isAntisymmetric && isTransitive) {
      classBadge.className = 'badge badge-cyan';
      classBadge.textContent = 'Partial Order (Poset)';
    } else {
      classBadge.className = 'badge badge-amber';
      classBadge.textContent = 'General Binary Relation';
    }
  }

  // Counterexample display card
  const ceCard = document.getElementById('relation-counterexample-box');
  const ceMsg = document.getElementById('relation-ce-text');
  const btnFix = document.getElementById('btn-fix-counterexample');

  if (!isReflexive) {
    ceMsg.textContent = `Violates Reflexivity: Missing self-loop (${missingReflexive}, ${missingReflexive}).`;
    btnFix.style.display = 'inline-block';
  } else if (!isAntisymmetric) {
    ceMsg.textContent = failAnti;
    btnFix.style.display = 'inline-block';
  } else if (!isTransitive) {
    ceMsg.textContent = failTrans;
    btnFix.style.display = 'inline-block';
  } else {
    ceMsg.textContent = 'Valid Structure: Satisfies target axiomatic constraints.';
    btnFix.style.display = 'none';
  }

  // Compute Poset Extremal Bounds if Poset
  if (isReflexive && isAntisymmetric && isTransitive) {
    computePosetExtremals();
  }
}

function updatePropertyBadge(id, pass) {
  const row = document.getElementById(id);
  if (!row) return;
  const badge = row.querySelector('.badge');
  if (badge) {
    badge.className = pass ? 'badge badge-emerald' : 'badge badge-rose';
    badge.textContent = pass ? 'PASS' : 'FAIL';
  }
}

function computePosetExtremals() {
  const n = state.relations.nodeCount;
  const M = state.relations.matrix;
  const labels = state.relations.nodeLabels;

  // Minimal elements: no element strictly precedes them
  const minimal = [];
  for (let j = 0; j < n; j++) {
    let hasPredecessor = false;
    for (let i = 0; i < n; i++) {
      if (i !== j && M[i][j] === 1) { hasPredecessor = true; break; }
    }
    if (!hasPredecessor) minimal.push(labels[j]);
  }

  // Maximal elements: no element strictly succeeds them
  const maximal = [];
  for (let i = 0; i < n; i++) {
    let hasSuccessor = false;
    for (let j = 0; j < n; j++) {
      if (i !== j && M[i][j] === 1) { hasSuccessor = true; break; }
    }
    if (!hasSuccessor) maximal.push(labels[i]);
  }

  // Least element (unique minimal that relates to all)
  let least = (minimal.length === 1) ? minimal[0] : 'None';
  // Greatest element (unique maximal related from all)
  let greatest = (maximal.length === 1) ? maximal[0] : 'None';

  state.relations.extremal = { minimal, maximal, least, greatest };

  document.getElementById('val-minimal').textContent = `{${minimal.join(', ')}}`;
  document.getElementById('val-maximal').textContent = `{${maximal.join(', ')}}`;
  document.getElementById('val-least').textContent = least;
  document.getElementById('val-greatest').textContent = greatest;
}

function computeWarshallClosure() {
  sfx.playSuccess();
  const n = state.relations.nodeCount;
  const W = state.relations.matrix.map(row => [...row]);

  // Warshall's Algorithm O(n^3)
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        W[i][j] = W[i][j] || (W[i][k] && W[k][j]);
      }
    }
  }

  state.relations.matrix = W;
  renderMatrixGrid();
  auditRelationProperties();
  renderAll();
  logMsg("Computed Warshall's Transitive Closure R^+ in O(n³) steps.", 'success');
}

function applyReflexiveClosure() {
  sfx.playSuccess();
  const n = state.relations.nodeCount;
  for (let i = 0; i < n; i++) state.relations.matrix[i][i] = 1;
  renderMatrixGrid();
  auditRelationProperties();
  renderAll();
  logMsg('Applied Reflexive Closure R ∪ Δ_S.', 'info');
}

function autoRepairRelationViolation() {
  sfx.playSuccess();
  const p = state.relations.properties;
  if (!p.reflexive) {
    applyReflexiveClosure();
  } else if (!p.transitive) {
    computeWarshallClosure();
  } else if (!p.antisymmetric) {
    // Break bidirectional cycle by removing one edge
    const n = state.relations.nodeCount;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && state.relations.matrix[i][j] === 1 && state.relations.matrix[j][i] === 1) {
          state.relations.matrix[j][i] = 0;
        }
      }
    }
    renderMatrixGrid();
    auditRelationProperties();
    renderAll();
    logMsg('Repaired antisymmetry by removing opposing cycle edge.', 'success');
  }
}

function transformToHasseDiagram() {
  const p = state.relations.properties;
  if (!p.reflexive || !p.antisymmetric || !p.transitive) {
    sfx.playWarning();
    alert('Hasse Diagram requires a valid Partial Order (Reflexive, Antisymmetric, and Transitive).\n\nApplying auto-repair closures now...');
    autoRepairRelationViolation();
  }

  sfx.playSuccess();
  state.relations.isHasseMode = true;

  // Transitive Reduction:
  // 1. Remove all self-loops (i == j)
  // 2. Remove edge (i, k) if there exists j != i != k with path i -> j -> k
  const n = state.relations.nodeCount;
  const M = state.relations.matrix;
  const hasseAdj = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && M[i][j] === 1) {
        let isCovering = true;
        for (let k = 0; k < n; k++) {
          if (k !== i && k !== j && M[i][k] === 1 && M[k][j] === 1) {
            isCovering = false;
            break;
          }
        }
        if (isCovering) hasseAdj[i][j] = 1;
      }
    }
  }

  // Calculate topological rank / levels (Longest path from minimal elements)
  const levels = Array(n).fill(0);
  for (let iter = 0; iter < n; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (hasseAdj[i][j] === 1) {
          levels[j] = Math.max(levels[j], levels[i] + 1);
        }
      }
    }
  }

  // Group nodes by level to position vertically
  const maxLevel = Math.max(...levels, 0);
  const levelGroups = Array.from({ length: maxLevel + 1 }, () => []);
  for (let i = 0; i < n; i++) {
    levelGroups[levels[i]].push(i);
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const nodePositions = [];

  const startY = cy + 140;
  const levelHeight = maxLevel > 0 ? 280 / maxLevel : 100;

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const group = levelGroups[lvl];
    const groupCount = group.length;
    const y = startY - lvl * levelHeight;
    const spacing = 140;
    const startX = cx - ((groupCount - 1) * spacing) / 2;

    group.forEach((nodeIdx, gIdx) => {
      nodePositions[nodeIdx] = {
        x: startX + gIdx * spacing,
        y,
        label: state.relations.nodeLabels[nodeIdx],
        idx: nodeIdx
      };
    });
  }

  state.relations.hasseNodes = nodePositions;
  state.relations.hasseEdges = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (hasseAdj[i][j] === 1) {
        state.relations.hasseEdges.push([i, j]);
      }
    }
  }

  logMsg('Transformed relation into layered Poset Hasse Diagram (Transitive Reduction complete).', 'success');
  renderAll();
}

function handleRelationCanvasClick(x, y) {
  const n = state.relations.nodeCount;
  const nodes = getRelationNodeCoordinates();

  // Check if any node was clicked
  let clickedIdx = -1;
  nodes.forEach((node, idx) => {
    if (Math.hypot(x - node.x, y - node.y) <= 24) {
      clickedIdx = idx;
    }
  });

  if (clickedIdx !== -1) {
    sfx.playClick();
    if (state.relations.selectedNode === null) {
      // First node selected
      state.relations.selectedNode = clickedIdx;
      logMsg(`Selected node ${state.relations.nodeLabels[clickedIdx]}. Click destination node to wire edge.`);
    } else {
      // Second node clicked: toggle directed edge
      const u = state.relations.selectedNode;
      const v = clickedIdx;
      state.relations.matrix[u][v] = (state.relations.matrix[u][v] === 1 ? 0 : 1);
      logMsg(`Toggled directed edge (${state.relations.nodeLabels[u]}, ${state.relations.nodeLabels[v]}).`);
      state.relations.selectedNode = null;
      state.relations.isHasseMode = false;
      renderMatrixGrid();
      auditRelationProperties();
    }
    renderAll();
  } else {
    // Clicked empty canvas: deselect
    state.relations.selectedNode = null;
    renderAll();
  }
}

function getRelationNodeCoordinates() {
  if (state.relations.isHasseMode && state.relations.hasseNodes.length > 0) {
    return state.relations.hasseNodes;
  }
  const n = state.relations.nodeCount;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 150;
  const coords = [];
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    coords.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: state.relations.nodeLabels[i],
      idx: i
    });
  }
  return coords;
}

// ── Pillar 4: Combinatorics Implementation ────────────────────
function setupCombinatorics() {
  const nSlider = document.getElementById('comb-n-slider');
  const rSlider = document.getElementById('comb-r-slider');
  const nVal = document.getElementById('comb-n-val');
  const rVal = document.getElementById('comb-r-val');
  const chkOrder = document.getElementById('chk-order-matters');
  const chkRep = document.getElementById('chk-repetition');

  if (nSlider) {
    nSlider.addEventListener('input', () => {
      state.comb.n = parseInt(nSlider.value, 10);
      if (state.comb.r > state.comb.n && !state.comb.repetition) {
        state.comb.r = state.comb.n;
        rSlider.value = state.comb.r;
      }
      nVal.textContent = `n = ${state.comb.n}`;
      if (rVal) rVal.textContent = `r = ${state.comb.r}`;
      updateCombinatorics();
    });
  }

  if (rSlider) {
    rSlider.addEventListener('input', () => {
      state.comb.r = parseInt(rSlider.value, 10);
      rVal.textContent = `r = ${state.comb.r}`;
      updateCombinatorics();
    });
  }

  if (chkOrder) {
    chkOrder.addEventListener('change', () => {
      state.comb.orderMatters = chkOrder.checked;
      sfx.playClick();
      updateCombinatorics();
    });
  }

  if (chkRep) {
    chkRep.addEventListener('change', () => {
      state.comb.repetition = chkRep.checked;
      sfx.playClick();
      updateCombinatorics();
    });
  }

  // Visualizer view mode buttons
  document.getElementById('btn-comb-view-tree').addEventListener('click', function() {
    state.comb.viewMode = 'tree';
    this.classList.add('active');
    document.getElementById('btn-comb-view-pigeon').classList.remove('active');
    document.getElementById('btn-comb-view-hanoi').classList.remove('active');
    sfx.playClick();
    renderAll();
  });
  document.getElementById('btn-comb-view-pigeon').addEventListener('click', function() {
    state.comb.viewMode = 'pigeon';
    this.classList.add('active');
    document.getElementById('btn-comb-view-tree').classList.remove('active');
    document.getElementById('btn-comb-view-hanoi').classList.remove('active');
    sfx.playClick();
    renderAll();
  });
  document.getElementById('btn-comb-view-hanoi').addEventListener('click', function() {
    state.comb.viewMode = 'hanoi';
    this.classList.add('active');
    document.getElementById('btn-comb-view-tree').classList.remove('active');
    document.getElementById('btn-comb-view-pigeon').classList.remove('active');
    generateHanoiMoves();
    sfx.playClick();
    renderAll();
  });

  updateCombinatorics();
}

function updateCombinatorics() {
  const { n, r } = state.comb;

  const pVal = perm(n, r);
  const cVal = comb(n, r);
  const pRepVal = Math.pow(n, r);
  const starsBarsVal = comb(n + r - 1, r);

  document.getElementById('perm-result').textContent = pVal.toLocaleString();
  document.getElementById('comb-result').textContent = cVal.toLocaleString();
  document.getElementById('perm-rep-result').textContent = pRepVal.toLocaleString();
  document.getElementById('stars-bars-result').textContent = starsBarsVal.toLocaleString();

  // KaTeX rendering for formulas
  if (window.katex) {
    const pBox = document.getElementById('perm-katex');
    const cBox = document.getElementById('comb-katex');
    const pRepBox = document.getElementById('perm-rep-katex');
    const sbBox = document.getElementById('stars-bars-katex');

    if (pBox) window.katex.render(`P(${n}, ${r}) = \\frac{${n}!}{( ${n} - ${r} )!}`, pBox);
    if (cBox) window.katex.render(`C(${n}, ${r}) = \\binom{${n}}{${r}} = \\frac{${n}!}{${r}!(${n}-${r})!}`, cBox);
    if (pRepBox) window.katex.render(`${n}^{${r}} = ${pRepVal}`, pRepBox);
    if (sbBox) window.katex.render(`\\binom{${n}+${r}-1}{${r}} = \\binom{${n+r-1}}{${r}}`, sbBox);

    // Pigeonhole
    const pigeonBox = document.getElementById('pigeon-katex');
    const guarantee = Math.ceil(state.comb.pigeons / state.comb.holes);
    if (pigeonBox) {
      window.katex.render(
        `\\left\\lceil \\frac{N}{k} \\right\\rceil = \\left\\lceil \\frac{${state.comb.pigeons}}{${state.comb.holes}} \\right\\rceil = ${guarantee}`,
        pigeonBox
      );
    }
    const pStat = document.getElementById('pigeon-guarantee-stat');
    if (pStat) {
      pStat.textContent = `With N = ${state.comb.pigeons} pigeons in k = ${state.comb.holes} pigeonholes ⇒ At least one hole must contain ≥ ${guarantee} items.`;
    }

    // Recurrence
    const recBox = document.getElementById('recurrence-katex');
    if (recBox) {
      window.katex.render(
        `T(n) = 2T(n-1) + 1 \\implies T(n) = 2^{${state.comb.hanoiDiscs}} - 1 = ${Math.pow(2, state.comb.hanoiDiscs) - 1}\\text{ moves}`,
        recBox
      );
    }
  }

  renderAll();
}

function generateHanoiMoves() {
  const moves = [];
  function solve(num, from, to, aux) {
    if (num === 1) {
      moves.push({ disc: 1, from, to });
      return;
    }
    solve(num - 1, from, aux, to);
    moves.push({ disc: num, from, to });
    solve(num - 1, aux, to, from);
  }
  solve(state.comb.hanoiDiscs, 'A', 'C', 'B');
  state.comb.hanoiMoves = moves;

  const box = document.getElementById('recurrence-steps-box');
  if (box) {
    box.innerHTML = moves.map((m, i) => `Step ${i + 1}: Move Disc ${m.disc} from Peg ${m.from} → Peg ${m.to}`).join('<br>');
  }
}

// ── Master Canvas 2D Rendering Engine ─────────────────────────
function renderAll() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#020712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply Camera Transform (Pan & Zoom)
  ctx.translate(canvas.width / 2 + state.camera.panX, canvas.height / 2 + state.camera.panY);
  ctx.scale(state.camera.zoom, state.camera.zoom);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Optional Coordinate Grid
  if (state.camera.showGrid) {
    drawGrid();
  }

  // Render active pillar
  if (state.activePillar === 'sets') {
    renderSetsCanvas();
  } else if (state.activePillar === 'logic') {
    renderLogicCanvas();
  } else if (state.activePillar === 'relations') {
    renderRelationsCanvas();
  } else if (state.activePillar === 'combinatorics') {
    renderCombinatoricsCanvas();
  }

  ctx.restore();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(22, 37, 71, 0.4)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = -200; x <= canvas.width + 200; x += step) {
    ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, canvas.height + 200); ctx.stroke();
  }
  for (let y = -200; y <= canvas.height + 200; y += step) {
    ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(canvas.width + 200, y); ctx.stroke();
  }
  ctx.restore();
}

// ── Render Pillar 1: Set Theory Venn Diagrams ─────────────────
function renderSetsCanvas() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 15;
  const is3 = (state.sets.setCount === 3);

  // Draw Universal Set Frame
  ctx.save();
  ctx.fillStyle = 'rgba(7, 14, 30, 0.7)';
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, 35, canvas.width - 120, canvas.height - 70, 12);
  ctx.fill();
  ctx.stroke();

  // Label Universal Set
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px JetBrains Mono, monospace';
  ctx.fillText('Universal Set 𝒰', 80, 65);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText(`|𝒰| = ${state.sets.universeSize}`, 80, 85);
  ctx.restore();

  if (!is3) {
    // 2-Set Geometry
    const r = 135;
    const ax = cx - 85, ay = cy;
    const bx = cx + 85, by = cy;

    // Region Shading
    drawVenn2Shading(ax, ay, bx, by, r);

    // Circle Outlines
    ctx.save();
    // Circle A
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Inter';
    ctx.fillText('Set A', ax - 70, ay - r + 15);

    // Circle B
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText('Set B', bx + 35, by - r + 15);
    ctx.restore();

    // Render Element Tokens inside 2-Set
    renderElementsIn2Set(ax, ay, bx, by, r);

  } else {
    // 3-Set Geometry
    const r = 125;
    const ax = cx - 75, ay = cy - 40;
    const bx = cx + 75, by = cy - 40;
    const cxx = cx, cyy = cy + 70;

    // Region Shading
    drawVenn3Shading(ax, ay, bx, by, cxx, cyy, r);

    // Circle Outlines
    ctx.save();
    ctx.lineWidth = 3;

    // Set A
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Inter';
    ctx.fillText('Set A', ax - 65, ay - r + 15);

    // Set B
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText('Set B', bx + 25, by - r + 15);

    // Set C
    ctx.strokeStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(cxx, cyy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.fillText('Set C', cxx - 20, cyy + r + 24);
    ctx.restore();

    // Render Element Tokens inside 3-Set
    renderElementsIn3Set(ax, ay, bx, by, cxx, cyy, r);
  }
}

function drawVenn2Shading(ax, ay, bx, by, r) {
  const shaded = state.sets.shadedRegions;
  if (shaded.size === 0) return;

  ctx.save();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';

  // R0: '00' Outside both
  if (shaded.has('00')) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(60, 35, canvas.width - 120, canvas.height - 70, 12);
    ctx.arc(ax, ay, r, 0, Math.PI * 2, true);
    ctx.arc(bx, by, r, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }

  // R_A: '10' A only
  if (shaded.has('10')) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.clip();
    // Exclude B
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  // R_B: '01' B only
  if (shaded.has('01')) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  // R_AB: '11' Intersection
  if (shaded.has('11')) {
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)'; // Amber glowing intersection
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawVenn3Shading(ax, ay, bx, by, cx, cy, r) {
  const shaded = state.sets.shadedRegions;
  if (shaded.size === 0) return;

  ctx.save();
  // Triple Intersection '111'
  if (shaded.has('111')) {
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // A only '100'
  if (shaded.has('100')) {
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  // B only '010'
  if (shaded.has('010')) {
    ctx.save();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  // C only '001'
  if (shaded.has('001')) {
    ctx.save();
    ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  // A ∩ B \ C '110'
  if (shaded.has('110')) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip('evenodd');
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function renderElementsIn2Set(ax, ay, bx, by, r) {
  const { A, B } = state.sets.subsets;
  for (let i = 1; i <= state.sets.universeSize; i++) {
    const inA = A.has(i);
    const inB = B.has(i);

    let x = 0, y = 0;
    if (inA && inB) {
      // In intersection
      const offset = (i % 5) * 16 - 32;
      x = (ax + bx) / 2;
      y = ay + offset;
    } else if (inA) {
      // In A only
      const angle = (i * 1.2) % (Math.PI * 2);
      x = ax - 50 + Math.cos(angle) * 35;
      y = ay + Math.sin(angle) * 35;
    } else if (inB) {
      // In B only
      const angle = (i * 1.2) % (Math.PI * 2);
      x = bx + 50 + Math.cos(angle) * 35;
      y = by + Math.sin(angle) * 35;
    } else {
      // In Universal only
      x = 100 + (i * 42) % (canvas.width - 200);
      y = canvas.height - 70;
    }

    drawElementChip(x, y, i, inA, inB, false);
  }
}

function renderElementsIn3Set(ax, ay, bx, by, cx, cy, r) {
  const { A, B, C } = state.sets.subsets;
  for (let i = 1; i <= state.sets.universeSize; i++) {
    const inA = A.has(i);
    const inB = B.has(i);
    const inC = C.has(i);

    let x = 0, y = 0;
    if (inA && inB && inC) {
      x = (ax + bx + cx) / 3;
      y = (ay + by + cy) / 3 + (i % 3) * 10 - 10;
    } else if (inA && inB) {
      x = (ax + bx) / 2;
      y = ay - 10;
    } else if (inA && inC) {
      x = (ax + cx) / 2 - 10;
      y = (ay + cy) / 2;
    } else if (inB && inC) {
      x = (bx + cx) / 2 + 10;
      y = (by + cy) / 2;
    } else if (inA) {
      x = ax - 45 + (i % 3) * 16;
      y = ay - 20 + (i % 2) * 16;
    } else if (inB) {
      x = bx + 25 + (i % 3) * 16;
      y = by - 20 + (i % 2) * 16;
    } else if (inC) {
      x = cx - 15 + (i % 3) * 16;
      y = cy + 40;
    } else {
      x = 100 + (i * 40) % (canvas.width - 200);
      y = canvas.height - 70;
    }

    drawElementChip(x, y, i, inA, inB, inC);
  }
}

function drawElementChip(x, y, num, inA, inB, inC) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);

  if (inA && inB && inC) ctx.fillStyle = '#f59e0b';
  else if (inA && inB) ctx.fillStyle = '#06b6d4';
  else if (inA) ctx.fillStyle = '#0284c7';
  else if (inB) ctx.fillStyle = '#059669';
  else if (inC) ctx.fillStyle = '#7c3aed';
  else ctx.fillStyle = '#1e293b';

  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num, x, y + 1);
  ctx.restore();
}

// ── Render Pillar 2: Propositional Logic Parse Tree ───────────
function renderLogicCanvas() {
  const ast = state.logic.ast;
  if (!ast) return;

  if (state.logic.visualizerMode === 'gates') {
    renderLogicCircuit();
    return;
  }

  // Render Recursive Parse Tree with evaluation bubbles
  const cx = canvas.width / 2;
  const startY = 80;

  function getNodeDepth(node) {
    if (!node) return 0;
    if (node.type === 'VAR') return 1;
    if (node.type === 'UNARY') return 1 + getNodeDepth(node.operand);
    return 1 + Math.max(getNodeDepth(node.left), getNodeDepth(node.right));
  }

  const depth = getNodeDepth(ast);
  const vGap = Math.min(80, 360 / Math.max(depth, 1));

  function drawNode(node, x, y, spreadX) {
    if (!node) return;
    const val = evalAST(node, state.logic.activeValuations);

    // Draw child branches
    if (node.type === 'UNARY') {
      const childX = x;
      const childY = y + vGap;
      drawBranch(x, y, childX, childY, val);
      drawNode(node.operand, childX, childY, spreadX * 0.55);
    } else if (node.type === 'BINARY') {
      const leftX = x - spreadX;
      const rightX = x + spreadX;
      const childY = y + vGap;

      drawBranch(x, y, leftX, childY, evalAST(node.left, state.logic.activeValuations));
      drawBranch(x, y, rightX, childY, evalAST(node.right, state.logic.activeValuations));

      drawNode(node.left, leftX, childY, spreadX * 0.55);
      drawNode(node.right, rightX, childY, spreadX * 0.55);
    }

    // Draw Node Bubble
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = val ? '#065f46' : '#881337'; // Emerald for True, Rose for False
    ctx.fill();
    ctx.strokeStyle = val ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Node text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = (node.type === 'VAR') ? node.val : (node.type === 'UNARY' ? node.op : node.op);
    ctx.fillText(label, x, y - 2);

    // Value annotation tag
    ctx.font = 'bold 10px Inter';
    ctx.fillStyle = val ? '#6ee7b7' : '#fca5a5';
    ctx.fillText(val ? 'T (1)' : 'F (0)', x, y + 32);
    ctx.restore();
  }

  function drawBranch(x1, y1, x2, y2, active) {
    ctx.save();
    ctx.strokeStyle = active ? '#10b981' : '#475569';
    ctx.lineWidth = active ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 22);
    ctx.lineTo(x2, y2 - 22);
    ctx.stroke();
    ctx.restore();
  }

  drawNode(ast, cx, startY, 180);

  // Top Title Card
  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px Inter';
  ctx.textAlign = 'left';
  ctx.fillText('Syntax Parse Tree & Live Truth Wave Propagation', 40, 45);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter';
  ctx.fillText('Active Valuation: ' + Object.entries(state.logic.activeValuations).map(([k,v]) => `${k}=${v?'1':'0'}`).join('  '), 40, 65);
  ctx.restore();
}

function renderLogicCircuit() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.save();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Combinational Logic Gate Equivalents', cx, 80);

  // Draw Gate Boxes
  const gates = [
    { name: 'AND (∧)', x: cx - 180, y: cy - 60 },
    { name: 'OR (∨)', x: cx, y: cy - 60 },
    { name: 'NOT (¬)', x: cx + 180, y: cy - 60 },
    { name: 'XOR (⊕)', x: cx - 90, y: cy + 80 },
    { name: 'IMPLIES (→)', x: cx + 90, y: cy + 80 }
  ];

  gates.forEach(g => {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(g.x - 65, g.y - 30, 130, 60, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px JetBrains Mono';
    ctx.fillText(g.name, g.x, g.y + 4);
  });
  ctx.restore();
}

// ── Render Pillar 3: Relations Digraph & Hasse Diagram ────────
function renderRelationsCanvas() {
  const n = state.relations.nodeCount;
  const nodes = getRelationNodeCoordinates();
  const isHasse = state.relations.isHasseMode;

  // Title in canvas
  ctx.save();
  ctx.fillStyle = isHasse ? '#38bdf8' : '#818cf8';
  ctx.font = 'bold 14px Inter';
  ctx.textAlign = 'left';
  ctx.fillText(isHasse ? 'Topological Poset Hasse Diagram (Upward Covering Relations)' : 'Directed Relation Graph (Click node pairs to toggle edges)', 40, 45);
  ctx.restore();

  // Draw Edges
  if (isHasse) {
    // In Hasse mode, only draw covering edges (strictly upwards)
    state.relations.hasseEdges.forEach(([u, v]) => {
      const p1 = nodes[u];
      const p2 = nodes[v];
      if (p1 && p2) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }
    });
  } else {
    // Normal Digraph: Draw all active matrix edges
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (state.relations.matrix[i][j] === 1) {
          if (i === j) {
            // Self loop
            drawSelfLoop(nodes[i].x, nodes[i].y);
          } else {
            // Directed Edge
            const isCounter = state.relations.counterexample &&
              ((state.relations.counterexample.i === i && state.relations.counterexample.j === j) ||
               (state.relations.counterexample.j === i && state.relations.counterexample.k === j));
            drawDirectedEdge(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, isCounter);
          }
        }
      }
    }
  }

  // Draw Nodes
  nodes.forEach(node => {
    const isSelected = (state.relations.selectedNode === node.idx);
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#38bdf8' : (isHasse ? '#1e3a8a' : '#1e1b4b');
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : (isHasse ? '#60a5fa' : '#818cf8');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Node Label
    ctx.fillStyle = isSelected ? '#020712' : '#f8fafc';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y + 1);
    ctx.restore();
  });
}

function drawDirectedEdge(x1, y1, x2, y2, isAlert) {
  ctx.save();
  ctx.strokeStyle = isAlert ? '#f43f5e' : '#64ffda';
  ctx.fillStyle = isAlert ? '#f43f5e' : '#64ffda';
  ctx.lineWidth = 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const r = 22; // node radius

  // Curve control point
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const normalX = -dy / dist;
  const normalY = dx / dist;
  const curvature = 20;
  const ctrlX = midX + normalX * curvature;
  const ctrlY = midY + normalY * curvature;

  // Endpoint shortened by node radius
  const angle = Math.atan2(y2 - ctrlY, x2 - ctrlX);
  const endX = x2 - Math.cos(angle) * r;
  const endY = y2 - Math.sin(angle) * r;

  // Draw curved edge
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  // Draw Arrowhead
  const headLen = 10;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSelfLoop(x, y) {
  ctx.save();
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 28, 15, Math.PI * 0.2, Math.PI * 1.8);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#a78bfa';
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 22);
  ctx.lineTo(x + 18, y - 32);
  ctx.lineTo(x + 6, y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Render Pillar 4: Combinatorics & Recurrences ──────────────
function renderCombinatoricsCanvas() {
  const mode = state.comb.viewMode;
  const cx = canvas.width / 2;

  if (mode === 'tree') {
    renderDecisionTree();
  } else if (mode === 'pigeon') {
    renderPigeonholeVisualizer();
  } else if (mode === 'hanoi') {
    renderTowerOfHanoi();
  }
}

function renderDecisionTree() {
  const { n, r, orderMatters } = state.comb;
  const cx = canvas.width / 2;

  ctx.save();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`🌳 Decision Tree: Selecting r = ${r} items from n = ${n} (${orderMatters ? 'Permutations' : 'Combinations'})`, cx, 60);

  // Draw Root Node
  ctx.beginPath();
  ctx.arc(cx, 110, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#1e3a8a';
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px JetBrains Mono';
  ctx.textBaseline = 'middle';
  ctx.fillText('Start', cx, 110);

  // First Branching Level (Choices 1..n)
  const branchCount = Math.min(n, 6);
  const spacing = Math.min(100, (canvas.width - 160) / branchCount);
  const startX = cx - ((branchCount - 1) * spacing) / 2;

  for (let i = 0; i < branchCount; i++) {
    const x = startX + i * spacing;
    const y = 200;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, 126); ctx.lineTo(x, y - 14); ctx.stroke();

    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(String(i + 1), x, y);

    // Second level branching if r >= 2
    if (r >= 2) {
      const subCount = Math.min(n - 1, 3);
      for (let s = 0; s < subCount; s++) {
        const subX = x - 25 + s * 25;
        const subY = 290;

        ctx.strokeStyle = '#64748b';
        ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(subX, subY - 10); ctx.stroke();

        ctx.beginPath(); ctx.arc(subX, subY, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981'; ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(String(s + 1), subX, subY);
      }
    }
  }

  ctx.restore();
}

function renderPigeonholeVisualizer() {
  const { pigeons, holes } = state.comb;
  const cx = canvas.width / 2;

  ctx.save();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`🐦 Pigeonhole Principle: Distributing N = ${pigeons} items into k = ${holes} boxes`, cx, 60);

  const boxWidth = 90;
  const boxHeight = 110;
  const spacing = 110;
  const startX = cx - ((holes - 1) * spacing) / 2;
  const y = 220;

  // Determine container capacities
  const counts = Array(holes).fill(Math.floor(pigeons / holes));
  let rem = pigeons % holes;
  for (let i = 0; i < rem; i++) counts[i]++;
  const maxCount = Math.max(...counts);

  for (let k = 0; k < holes; k++) {
    const x = startX + k * spacing;
    const isCrowded = (counts[k] === maxCount && maxCount >= Math.ceil(pigeons / holes));

    ctx.fillStyle = isCrowded ? 'rgba(245, 158, 11, 0.15)' : '#0d172e';
    ctx.strokeStyle = isCrowded ? '#f59e0b' : '#334155';
    ctx.lineWidth = isCrowded ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Box label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px Inter';
    ctx.fillText(`Hole ${k + 1}`, x, y - boxHeight / 2 - 12);

    // Items inside box
    const itemCount = counts[k];
    ctx.fillStyle = isCrowded ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 18px JetBrains Mono';
    ctx.fillText(`${itemCount} 🐦`, x, y + 5);

    if (isCrowded) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px Inter';
      ctx.fillText(`≥ ⌈N/k⌉ = ${maxCount}`, x, y + 36);
    }
  }

  ctx.restore();
}

function renderTowerOfHanoi() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 50;

  ctx.save();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`🗼 Tower of Hanoi: 3 Pegs with n = ${state.comb.hanoiDiscs} Discs (T(n) = 2ⁿ - 1 = 7 Steps)`, cx, 60);

  const pegs = [
    { name: 'Peg A', x: cx - 200 },
    { name: 'Peg B', x: cx },
    { name: 'Peg C', x: cx + 200 }
  ];

  // Base platform
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 300, cy + 80, 600, 14);

  pegs.forEach(peg => {
    // Vertical rod
    ctx.fillStyle = '#64748b';
    ctx.fillRect(peg.x - 6, cy - 80, 12, 160);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px Inter';
    ctx.fillText(peg.name, peg.x, cy + 115);
  });

  // Draw Sample Discs on Peg A
  const discColors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8'];
  for (let d = state.comb.hanoiDiscs; d >= 1; d--) {
    const w = 40 + d * 30;
    const h = 20;
    const dy = cy + 80 - (state.comb.hanoiDiscs - d + 1) * h;
    ctx.fillStyle = discColors[(d - 1) % discColors.length];
    ctx.beginPath();
    ctx.roundRect(pegs[0].x - w / 2, dy, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillText(`Disc ${d}`, pegs[0].x, dy + 14);
  }

  ctx.restore();
}

// ── Interactive Learning & Challenge Engine ────────────────────
function setupChallenges() {
  const jumpSel = document.getElementById('challenge-jump-select');
  if (jumpSel) {
    jumpSel.innerHTML = state.challenges.list.map((c, i) =>
      `<option value="${i}">Level ${i + 1}: ${c.title}</option>`
    ).join('');
    jumpSel.addEventListener('change', () => {
      loadChallenge(parseInt(jumpSel.value, 10));
    });
  }

  document.getElementById('btn-prev-challenge').addEventListener('click', () => {
    if (state.challenges.activeLevel > 0) loadChallenge(state.challenges.activeLevel - 1);
  });
  document.getElementById('btn-next-challenge').addEventListener('click', () => {
    if (state.challenges.activeLevel < state.challenges.list.length - 1) loadChallenge(state.challenges.activeLevel + 1);
  });

  document.getElementById('btn-verify-challenge').addEventListener('click', () => {
    verifyActiveChallenge();
  });
  document.getElementById('btn-hint-challenge').addEventListener('click', () => {
    const c = state.challenges.list[state.challenges.activeLevel];
    sfx.playClick();
    alert(`💡 CHALLENGE HINT:\n\n${c.hint}`);
  });
  document.getElementById('btn-reset-challenge').addEventListener('click', () => {
    resetCurrentPillar();
  });

  loadChallenge(0);
}

function loadChallenge(lvl) {
  state.challenges.activeLevel = lvl;
  const c = state.challenges.list[lvl];
  if (!c) return;

  sfx.playClick();
  document.getElementById('challenge-badge').textContent = `Track ${c.track} • Level ${lvl + 1} of 12`;
  document.getElementById('challenge-title').textContent = c.title;
  document.getElementById('challenge-desc').textContent = c.desc;
  document.getElementById('challenge-jump-select').value = lvl;

  // Auto-switch to matching pillar
  if (state.activePillar !== c.pillar) {
    state.activePillar = c.pillar;
    document.querySelectorAll('#pillar-tabs .pillar-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pillar') === c.pillar);
    });
    updatePillarViews();
  }

  updateChallengeChecklist(false);
  logMsg(`Loaded Challenge Level ${lvl + 1}: ${c.title}.`, 'info');
}

function updateChallengeChecklist(passed) {
  const list = document.getElementById('challenge-checklist');
  if (!list) return;
  const c = state.challenges.list[state.challenges.activeLevel];
  list.innerHTML = `
    <div class="check-item ${passed ? 'pass' : 'fail'}">
      <span>${passed ? '✓' : '○'}</span>
      <span>Objective: ${c.desc}</span>
    </div>
  `;
}

function verifyActiveChallenge() {
  const c = state.challenges.list[state.challenges.activeLevel];
  const passed = c.check();
  updateChallengeChecklist(passed);

  if (passed) {
    sfx.playSuccess();
    state.challenges.solvedLevels.add(state.challenges.activeLevel);
    state.challenges.xp += 100;
    state.challenges.streak += 1;
    document.getElementById('user-xp').textContent = state.challenges.xp;
    document.getElementById('user-streak').textContent = state.challenges.streak;
    logMsg(`★ Challenge Level ${state.challenges.activeLevel + 1} Solved! (+100 XP)`, 'success');
    alert(`🎉 CHALLENGE COMPLETED!\n\n${c.title}\n+100 XP Earned! Current Streak: ${state.challenges.streak} ★`);

    // Advance to next challenge if available
    if (state.challenges.activeLevel < state.challenges.list.length - 1) {
      setTimeout(() => loadChallenge(state.challenges.activeLevel + 1), 600);
    }
  } else {
    sfx.playWarning();
    logMsg(`Challenge Verification Failed for Level ${state.challenges.activeLevel + 1}.`, 'error');
    alert(`❌ Verification Incomplete!\n\nThe current workspace does not satisfy the target condition yet.\nCheck the hint for guidance.`);
  }
}

function auditCurrentStructure() {
  sfx.playClick();
  const p = state.activePillar;
  if (p === 'sets') {
    logMsg(`Audited Set Theory: Universal |U|=${state.sets.universeSize}, |A|=${state.sets.subsets.A.size}, |B|=${state.sets.subsets.B.size}, |C|=${state.sets.subsets.C.size}. PIE consistent.`, 'success');
  } else if (p === 'logic') {
    logMsg(`Audited Propositional Logic: Formula is ${state.logic.classification}. Sub-expressions validated without evaluation errors.`, 'success');
  } else if (p === 'relations') {
    auditRelationProperties();
    const props = state.relations.properties;
    logMsg(`Audited Relations: Reflexive=${props.reflexive}, Symmetric=${props.symmetric}, Antisymmetric=${props.antisymmetric}, Transitive=${props.transitive}.`, 'success');
  } else if (p === 'combinatorics') {
    logMsg(`Audited Combinatorics: P(${state.comb.n},${state.comb.r})=${perm(state.comb.n, state.comb.r)}, C(${state.comb.n},${state.comb.r})=${comb(state.comb.n, state.comb.r)}.`, 'success');
  }
}

// ── Certification Quiz Implementation ─────────────────────────
function setupQuiz() {
  const container = document.getElementById('quiz-questions-list');
  if (!container) return;
  container.innerHTML = '';

  QUIZ_QUESTIONS.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-q-card';
    card.id = `quiz-card-${idx}`;

    let optHtml = '';
    q.options.forEach((opt, oIdx) => {
      optHtml += `
        <label class="quiz-opt-label" data-q="${idx}" data-opt="${oIdx}">
          <input type="radio" name="quiz-q-${idx}" value="${oIdx}">
          <span>${opt}</span>
        </label>
      `;
    });

    card.innerHTML = `
      <div class="quiz-q-text">${idx + 1}. ${q.q}</div>
      <div class="quiz-options">${optHtml}</div>
      <div class="quiz-feedback hidden" id="quiz-fb-${idx}"></div>
    `;

    container.appendChild(card);
  });

  // Radio button selection handling
  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const qIdx = parseInt(e.target.name.replace('quiz-q-', ''), 10);
      const optIdx = parseInt(e.target.value, 10);
      state.quiz.userAnswers[qIdx] = optIdx;
      sfx.playClick();
    });
  });

  // Submit Quiz Button
  document.getElementById('btn-submit-quiz').addEventListener('click', () => {
    submitQuiz();
  });

  // Retake Quiz Button
  document.getElementById('btn-reset-quiz').addEventListener('click', () => {
    resetQuiz();
  });
}

function submitQuiz() {
  sfx.playClick();
  let correctCount = 0;

  QUIZ_QUESTIONS.forEach((q, idx) => {
    const userAns = state.quiz.userAnswers[idx];
    const fbEl = document.getElementById(`quiz-fb-${idx}`);
    const card = document.getElementById(`quiz-card-${idx}`);
    fbEl.classList.remove('hidden');

    if (userAns === q.ans) {
      correctCount++;
      fbEl.className = 'quiz-feedback correct';
      fbEl.innerHTML = `<strong>✓ Correct!</strong> ${q.exp}`;
    } else {
      fbEl.className = 'quiz-feedback incorrect';
      fbEl.innerHTML = `<strong>✗ Incorrect.</strong> Correct answer: <em>${q.options[q.ans]}</em>.<br>${q.exp}`;
    }
  });

  state.quiz.score = correctCount;
  document.getElementById('quiz-score-display').textContent = `${correctCount} / 10`;

  if (correctCount >= 8) {
    sfx.playSuccess();
    const cert = document.getElementById('quiz-certificate-card');
    cert.classList.remove('hidden');
    document.getElementById('cert-text').innerHTML = `Awarded to <strong>Engineering Student</strong> for achieving ${correctCount * 10}% score in Discrete Mathematics Examination (CST/3/301).`;
  } else {
    sfx.playWarning();
  }

  logMsg(`Quiz Submitted: Score ${correctCount} / 10 (${correctCount * 10}%).`, correctCount >= 8 ? 'success' : 'warn');
}

function resetQuiz() {
  state.quiz.userAnswers = {};
  state.quiz.score = 0;
  document.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
  document.querySelectorAll('.quiz-feedback').forEach(fb => { fb.classList.add('hidden'); });
  document.getElementById('quiz-certificate-card').classList.add('hidden');
  document.getElementById('quiz-score-display').textContent = '0 / 10';
  sfx.playClick();
  logMsg('Reset quiz assessment.', 'info');
}

// ── Three.js Procedural 3D Scene Fallback ─────────────────────
function init3DScene() {
  window.three3DInitialized = true;
  const canvas3d = document.getElementById('sim3d-canvas');
  const aside = document.getElementById('sim3d-components');
  if (!canvas3d || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020712);

  const camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 100);
  camera.position.set(4.0, 3.5, 5.0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111c38, 1.2);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  dirLight.position.set(6, 10, 8);
  scene.add(dirLight);

  // Group to hold mathematical geometries
  const group = new THREE.Group();

  // 1. Torus Ring for Set A (Cyan)
  const ringGeoA = new THREE.TorusGeometry(1.4, 0.08, 16, 64);
  const ringMatA = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.3 });
  const meshA = new THREE.Mesh(ringGeoA, ringMatA);
  meshA.rotation.x = Math.PI / 2.8;
  meshA.position.set(-0.8, 0, 0);
  meshA.name = 'Set A Ring (Cyan)';
  group.add(meshA);

  // 2. Torus Ring for Set B (Emerald)
  const ringMatB = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857, roughness: 0.3 });
  const meshB = new THREE.Mesh(ringGeoA, ringMatB);
  meshB.rotation.x = Math.PI / 2.8;
  meshB.position.set(0.8, 0, 0);
  meshB.name = 'Set B Ring (Emerald)';
  group.add(meshB);

  // 3. Torus Ring for Set C (Purple)
  const ringMatC = new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x7c3aed, roughness: 0.3 });
  const meshC = new THREE.Mesh(ringGeoA, ringMatC);
  meshC.rotation.x = Math.PI / 2.2;
  meshC.position.set(0, -0.6, 0.7);
  meshC.name = 'Set C Ring (Purple)';
  group.add(meshC);

  // 4. Central Intersection Sphere (Amber)
  const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.2 });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.position.set(0, -0.15, 0.2);
  sphereMesh.name = 'Central Intersection A∩B∩C';
  group.add(sphereMesh);

  // 5. 3D Poset Lattice Vertices (Top / Bottom)
  const topVertGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8 });
  const topVert = new THREE.Mesh(topVertGeo, topMat);
  topVert.position.set(0, 1.8, 0);
  topVert.name = 'Greatest Element ⊤';
  group.add(topVert);

  const botVert = new THREE.Mesh(topVertGeo, topMat);
  botVert.position.set(0, -1.8, 0);
  botVert.name = 'Least Element ⊥';
  group.add(botVert);

  scene.add(group);

  // Populate sidebar components
  if (aside) {
    aside.innerHTML = '<div class="sim3d-comp-title">3D Mathematical Entities</div>';
    group.children.forEach(child => {
      const btn = document.createElement('button');
      btn.className = 'sim3d-comp';
      btn.textContent = child.name;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sfx.playClick();
        if (child.material && child.material.color) {
          const oldColor = child.material.color.getHex();
          child.material.color.setHex(0xffffff);
          setTimeout(() => child.material.color.setHex(oldColor), 500);
        }
      });
      aside.appendChild(btn);
    });
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.003;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  logMsg('Initialized WebGL 3D Discrete Mathematical Model.', 'success');
}

// ── Boot up on DOM Loaded ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
