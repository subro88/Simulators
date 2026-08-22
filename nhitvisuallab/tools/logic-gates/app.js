(function () {
  'use strict';

  /* ================================================================
     EXPLORE DATA — 16 concept cards across 6 categories
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────── */
    {
      id: 'binary', name: 'Binary Number System', symbol: 'Bin',
      formula: 'Decimal \u2194 Binary conversion', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'The binary number system uses only two digits: 0 and 1. Each digit position represents a power of 2. The rightmost bit (LSB) has weight 2\u2070=1, the next 2\u00B9=2, then 2\u00B2=4, and so on. To convert decimal to binary, repeatedly divide by 2 and read remainders bottom-up. Binary is the native language of all digital circuits because transistors naturally operate as switches with two states: ON (1) and OFF (0).',
      example: { problem: 'Convert decimal 13 to binary.', steps: ['13 \u00F7 2 = 6 remainder 1', '6 \u00F7 2 = 3 remainder 0', '3 \u00F7 2 = 1 remainder 1', '1 \u00F7 2 = 0 remainder 1', 'Read remainders bottom-up: 1101'], answer: 1101, unit: '' }
    },
    {
      id: 'boolean', name: 'Boolean Algebra', symbol: 'Bool',
      formula: 'A\u00B7B + A\u0305 = ?', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Boolean algebra is the mathematical framework for digital logic. Variables can only be 0 or 1. Key operations: AND (\u00B7), OR (+), NOT (\u0305). Important laws include: Identity (A\u00B71=A, A+0=A), Complement (A\u00B7A\u0305=0, A+A\u0305=1), Idempotent (A\u00B7A=A, A+A=A), and De Morgan\'s Theorems ((A\u00B7B)\u0305 = A\u0305+B\u0305 and (A+B)\u0305 = A\u0305\u00B7B\u0305). These laws allow simplification of complex logic expressions.',
      example: { problem: 'Simplify: A\u00B7(A+B)', steps: ['Distribute: A\u00B7A + A\u00B7B', 'Idempotent: A + A\u00B7B', 'Absorption: A'], answer: 'A', unit: '' }
    },
    {
      id: 'truth-tables', name: 'Truth Tables', symbol: 'TT',
      formula: '2\u207F rows for n inputs', unit: 'rows',
      cat: 'fundamentals',
      desc: 'A truth table lists all possible input combinations and their corresponding outputs for a Boolean function. For n inputs, there are 2\u207F rows. Truth tables are the primary tool for defining, verifying, and comparing logic functions. Two circuits are equivalent if and only if their truth tables are identical. This simulator automatically generates the truth table for any circuit you build.',
      example: { problem: 'How many rows does a truth table with 4 inputs have?', steps: ['Rows = 2\u207F', 'Rows = 2\u2074', 'Rows = 16'], answer: 16, unit: 'rows' }
    },
    /* ── Basic Gates ──────────────────────────────────────────── */
    {
      id: 'and-or-not', name: 'AND, OR, NOT Gates', symbol: 'Gates',
      formula: 'AND: Y=A\u00B7B  OR: Y=A+B  NOT: Y=A\u0305', unit: '\u2014',
      cat: 'basic-gates',
      desc: 'The three fundamental gates form the basis of all digital logic. AND outputs 1 only when ALL inputs are 1 \u2014 like a series circuit where all switches must be closed. OR outputs 1 when ANY input is 1 \u2014 like a parallel circuit. NOT (inverter) flips the input: 0 becomes 1 and vice versa. Any Boolean function, no matter how complex, can be built using combinations of these three gates.',
      example: { problem: 'AND gate: A=1, B=0. What is the output?', steps: ['Y = A AND B', 'Y = 1 AND 0', 'AND requires ALL inputs to be 1', 'Y = 0'], answer: 0, unit: '' }
    },
    {
      id: 'nand-nor', name: 'NAND & NOR (Universal)', symbol: 'Univ',
      formula: 'NAND: Y=(A\u00B7B)\u0305  NOR: Y=(A+B)\u0305', unit: '\u2014',
      cat: 'basic-gates',
      desc: 'NAND and NOR are called universal gates because ANY Boolean function can be implemented using only NAND gates or only NOR gates. NAND is an AND followed by NOT \u2014 output is 0 only when all inputs are 1. NOR is an OR followed by NOT \u2014 output is 1 only when all inputs are 0. In practice, NAND gates are the most commonly used because NAND-only implementations are often the most efficient in terms of transistor count.',
      example: { problem: 'How to make a NOT gate using only NAND gates?', steps: ['Connect both inputs of a NAND gate together', 'NAND(A,A) = (A\u00B7A)\u0305 = A\u0305', 'This creates an inverter using one NAND gate'], answer: 1, unit: 'gate' }
    },
    {
      id: 'xor-xnor', name: 'XOR & XNOR', symbol: 'XOR',
      formula: 'XOR: Y=A\u2295B  XNOR: Y=(A\u2295B)\u0305', unit: '\u2014',
      cat: 'basic-gates',
      desc: 'XOR (exclusive OR) outputs 1 when the inputs are DIFFERENT \u2014 it detects inequality. XNOR outputs 1 when inputs are the SAME \u2014 it acts as an equality comparator. XOR is essential in arithmetic circuits: it generates the SUM bit in half and full adders. XOR is also used in parity generators/checkers for error detection, and in cryptography for simple encryption (XOR cipher).',
      example: { problem: 'XOR gate: A=1, B=1. What is the output?', steps: ['Y = A XOR B', 'Y = 1 XOR 1', 'XOR outputs 1 when inputs DIFFER', 'Both inputs are the same, so Y = 0'], answer: 0, unit: '' }
    },
    {
      id: 'buffer-inverter', name: 'Buffer & Inverter', symbol: 'Buf',
      formula: 'Buffer: Y=A  NOT: Y=A\u0305', unit: '\u2014',
      cat: 'basic-gates',
      desc: 'A buffer passes the input signal to the output unchanged. While this seems pointless, buffers are used for signal conditioning (strengthening weak signals), isolation between circuit stages, and fan-out (driving multiple gate inputs from a single source). The inverter (NOT gate) complements the input. Buffers and inverters are single-input, single-output gates.',
      example: { problem: 'Buffer: A=1. What is the output?', steps: ['Y = A', 'Y = 1', 'Buffer passes input unchanged'], answer: 1, unit: '' }
    },
    /* ── Combinational ────────────────────────────────────────── */
    {
      id: 'mux', name: 'Multiplexer', symbol: 'MUX',
      formula: 'Y = S ? B : A', unit: '\u2014',
      cat: 'combinational',
      desc: 'A multiplexer (MUX) selects one of multiple data inputs and routes it to a single output, controlled by select lines. A 2:1 MUX has 2 data inputs (A, B), 1 select input (S), and 1 output (Y). When S=0, Y=A; when S=1, Y=B. Larger MUXes (4:1, 8:1) use more select lines. MUXes can implement any Boolean function and are used in data routing, function generators, and CPU data paths.',
      example: { problem: 'MUX 2:1: A=1, B=0, Sel=1. What is Y?', steps: ['When Sel=1, output = B', 'B = 0', 'Y = 0'], answer: 0, unit: '' }
    },
    {
      id: 'decoder', name: 'Decoder & Encoder', symbol: 'DEC',
      formula: 'n inputs \u2192 2\u207F outputs', unit: '\u2014',
      cat: 'combinational',
      desc: 'A decoder converts an n-bit binary input into 2\u207F output lines, where exactly one output is active for each input combination. A 2-to-4 decoder has 2 inputs and 4 outputs. Decoders are used in memory address decoding, 7-segment display driving, and instruction decoding in CPUs. An encoder performs the reverse operation: it converts 2\u207F input lines into an n-bit binary code, with priority given to the highest active input.',
      example: { problem: 'Decoder 2:4: A1=1, A0=0 (binary 10 = decimal 2). Which output is active?', steps: ['Input = 10 in binary = 2 in decimal', 'Output Y2 is activated', 'All other outputs (Y0, Y1, Y3) are 0'], answer: 'Y2', unit: '' }
    },
    {
      id: 'adder', name: 'Half & Full Adder', symbol: 'Add',
      formula: 'Sum = A\u2295B, Carry = A\u00B7B', unit: '\u2014',
      cat: 'combinational',
      desc: 'A half adder adds two single bits, producing a sum (S = A XOR B) and a carry (C = A AND B). A full adder adds three bits (A, B, and carry-in), producing sum and carry-out. Full adders are cascaded to build n-bit binary adders \u2014 the carry-out of each stage connects to the carry-in of the next. A 4-bit adder uses 4 full adders in a ripple-carry configuration.',
      example: { problem: 'Half adder: A=1, B=1. Find Sum and Carry.', steps: ['Sum = A XOR B = 1 XOR 1 = 0', 'Carry = A AND B = 1 AND 1 = 1', 'Result: Sum=0, Carry=1 (binary 10 = decimal 2)'], answer: '10', unit: 'binary' }
    },
    /* ── Sequential ───────────────────────────────────────────── */
    {
      id: 'latch', name: 'SR Latch', symbol: 'SR',
      formula: 'S=1: Q\u21901  R=1: Q\u21900', unit: '\u2014',
      cat: 'sequential',
      desc: 'The SR (Set-Reset) latch is the simplest memory element, storing one bit. It can be built from two cross-coupled NOR or NAND gates. Set (S=1, R=0) forces Q=1. Reset (S=0, R=1) forces Q=0. Hold (S=0, R=0) maintains the previous state. The forbidden state (S=1, R=1) produces unpredictable results. SR latches are level-sensitive \u2014 they respond immediately to input changes.',
      example: { problem: 'SR Latch: S=1, R=0. What is Q?', steps: ['S=1 sets the latch', 'Q = 1, Q\u0305 = 0', 'When S returns to 0, Q remains 1 (memory)'], answer: 1, unit: '' }
    },
    {
      id: 'flipflop', name: 'D & JK Flip-Flops', symbol: 'FF',
      formula: 'D-FF: Q\u2190D on \u2191CLK', unit: '\u2014',
      cat: 'sequential',
      desc: 'The D flip-flop captures the D input value on the rising edge of the clock and holds it until the next clock edge. It eliminates the forbidden state of the SR latch. D flip-flops are the building block of registers and shift registers. The JK flip-flop is more versatile: J=1,K=0 sets (Q=1), J=0,K=1 resets (Q=0), J=1,K=1 toggles, and J=0,K=0 holds. The toggle mode makes JK flip-flops useful for counters.',
      example: { problem: 'D flip-flop: D=1, rising clock edge. What is Q after the edge?', steps: ['On rising edge, Q captures D', 'D = 1, so Q becomes 1', 'Q\u0305 becomes 0', 'Q holds this value until the next rising edge'], answer: 1, unit: '' }
    },
    {
      id: 'counter', name: 'Binary Counter', symbol: 'Ctr',
      formula: 'Each T-FF divides frequency by 2', unit: '\u2014',
      cat: 'sequential',
      desc: 'A binary counter is built by cascading T flip-flops. Each flip-flop toggles when its clock input goes high. The first flip-flop toggles on every clock pulse (LSB). Its output clocks the second flip-flop, which toggles at half the frequency. A 4-bit ripple counter counts from 0000 to 1111 (0-15) and then wraps around. Counters are used in frequency dividers, timers, address generators, and event counting.',
      example: { problem: 'A 4-bit binary counter starts at 0000. After 5 clock pulses, what is the count?', steps: ['Pulse 1: 0001', 'Pulse 2: 0010', 'Pulse 3: 0011', 'Pulse 4: 0100', 'Pulse 5: 0101 (decimal 5)'], answer: '0101', unit: '' }
    },
    /* ── Boolean Algebra ──────────────────────────────────────── */
    {
      id: 'demorgan', name: "De Morgan's Theorems", symbol: 'DM',
      formula: '(A\u00B7B)\u0305 = A\u0305+B\u0305', unit: '\u2014',
      cat: 'boolean-algebra',
      desc: "De Morgan's two theorems are fundamental for circuit simplification. Theorem 1: The complement of a product equals the sum of the complements \u2014 (A\u00B7B)\u0305 = A\u0305+B\u0305. This means a NAND gate is equivalent to an OR gate with inverted inputs. Theorem 2: The complement of a sum equals the product of the complements \u2014 (A+B)\u0305 = A\u0305\u00B7B\u0305. This means a NOR gate is equivalent to an AND gate with inverted inputs. These theorems allow conversion between AND/OR and NAND/NOR implementations.",
      example: { problem: 'Apply De Morgan to: (A+B+C)\u0305', steps: ['(A+B+C)\u0305 = A\u0305 \u00B7 B\u0305 \u00B7 C\u0305', 'Complement of sum = product of complements', 'NOR of three inputs = AND of three inverted inputs'], answer: 0, unit: '' }
    },
    {
      id: 'karnaugh', name: 'Karnaugh Maps', symbol: 'K-Map',
      formula: 'Visual minimisation of Boolean functions', unit: '\u2014',
      cat: 'boolean-algebra',
      desc: 'Karnaugh maps (K-maps) provide a visual method for simplifying Boolean expressions. Cells are arranged so adjacent cells differ by exactly one variable (Gray code ordering). Groups of 1s are circled in powers of 2 (1, 2, 4, 8). Each group eliminates one variable from the expression. K-maps work well for up to 4-5 variables. For larger functions, the Quine-McCluskey algorithm is used. K-maps help find the minimal sum-of-products or product-of-sums expression.',
      example: { problem: 'Simplify F(A,B) = \u03A3m(1,2,3) using a K-map.', steps: ['2-variable K-map has 4 cells', 'Minterms 1,2,3 are marked as 1 (only minterm 0 is 0)', 'Group m1+m3: B, Group m2+m3: A', 'F = A + B'], answer: 'A+B', unit: '' }
    },
    /* ── Applications ─────────────────────────────────────────── */
    {
      id: 'real-world', name: 'Real-World Logic Circuits', symbol: 'App',
      formula: 'ALU, Memory, Control, I/O', unit: '\u2014',
      cat: 'applications',
      desc: 'Logic gates are the foundation of all digital systems. CPUs contain arithmetic logic units (ALUs) built from adders and comparators. Memory systems use flip-flops for registers and SRAM cells. Decoders select memory addresses and I/O devices. Multiplexers route data on buses. Counters and timers control sequencing. In industrial automation, combinational logic implements safety interlocks (AND for two-hand operation), while PLCs use ladder logic based on Boolean algebra. FPGAs implement custom logic using programmable lookup tables (LUTs) which are essentially multiplexers.',
      example: { problem: 'How many flip-flops are needed for an 8-bit register?', steps: ['Each flip-flop stores 1 bit', 'An 8-bit register stores 8 bits', 'Number of flip-flops = 8'], answer: 8, unit: 'flip-flops' }
    }
  ];

  /* ================================================================
     PRACTICE — 12 problem generators
     ================================================================ */

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var PRACTICE = [
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = a & b;
      return { prompt: 'AND gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = A AND B', 'Y = ' + a + ' AND ' + b, 'Y = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = a | b;
      return { prompt: 'OR gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = A OR B', 'Y = ' + a + ' OR ' + b, 'Y = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = (a & b) ? 0 : 1;
      return { prompt: 'NAND gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = NOT(A AND B)', 'A AND B = ' + (a & b), 'Y = NOT(' + (a & b) + ') = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = (a | b) ? 0 : 1;
      return { prompt: 'NOR gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = NOT(A OR B)', 'A OR B = ' + (a | b), 'Y = NOT(' + (a | b) + ') = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = a ^ b;
      return { prompt: 'XOR gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = A XOR B', 'Y = ' + a + ' XOR ' + b, 'XOR outputs 1 when inputs differ', 'Y = ' + ans] };
    },
    function () {
      var n = randChoice([2, 3, 4, 5]);
      var ans = Math.pow(2, n);
      return { prompt: 'How many rows does a truth table have with ' + n + ' inputs?', unit: 'rows', answer: ans, tol: 0, steps: ['Rows = 2^n', 'Rows = 2^' + n, 'Rows = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var sum = a ^ b;
      var carry = a & b;
      var ans = carry * 10 + sum;
      return { prompt: 'Half adder: A=' + a + ', B=' + b + '. What is the 2-digit result (CarrySum)?', unit: '', answer: ans, tol: 0, steps: ['Sum = A XOR B = ' + a + ' XOR ' + b + ' = ' + sum, 'Carry = A AND B = ' + a + ' AND ' + b + ' = ' + carry, 'Result = ' + carry + '' + sum] };
    },
    function () {
      var dec = randChoice([5, 7, 9, 11, 13, 14, 15]);
      var bin = dec.toString(2);
      var bits = bin.length;
      return { prompt: 'How many bits are needed to represent decimal ' + dec + ' in binary?', unit: 'bits', answer: bits, tol: 0, steps: [dec + ' in binary = ' + bin, 'Length = ' + bits + ' bits'] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1), cin = randInt(0, 1);
      var sum = a ^ b ^ cin;
      var cout = (a & b) | (cin & (a ^ b));
      return { prompt: 'Full adder: A=' + a + ', B=' + b + ', Cin=' + cin + '. What is the Sum output?', unit: '', answer: sum, tol: 0, steps: ['Sum = A XOR B XOR Cin', 'Sum = ' + a + ' XOR ' + b + ' XOR ' + cin, 'Sum = ' + sum, 'Cout = ' + cout] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1);
      var ans = (a ^ b) ? 0 : 1;
      return { prompt: 'XNOR gate: A=' + a + ', B=' + b + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['Y = NOT(A XOR B)', 'A XOR B = ' + (a ^ b), 'Y = NOT(' + (a ^ b) + ') = ' + ans] };
    },
    function () {
      var a = randInt(0, 1), b = randInt(0, 1), sel = randInt(0, 1);
      var ans = sel === 0 ? a : b;
      return { prompt: 'MUX 2:1: A=' + a + ', B=' + b + ', Sel=' + sel + '. What is the output?', unit: '', answer: ans, tol: 0, steps: ['When Sel=' + sel + ', output = ' + (sel === 0 ? 'A' : 'B'), (sel === 0 ? 'A' : 'B') + ' = ' + ans, 'Y = ' + ans] };
    },
    function () {
      var a1 = randInt(0, 1), a0 = randInt(0, 1);
      var dec = a1 * 2 + a0;
      return { prompt: 'Decoder 2:4: A1=' + a1 + ', A0=' + a0 + '. Which output (Y0-Y3) is HIGH?', unit: '', answer: dec, tol: 0, steps: ['Binary input = ' + a1 + '' + a0 + ' = decimal ' + dec, 'Output Y' + dec + ' is HIGH', 'All other outputs are LOW', 'Answer: ' + dec + ' (Y' + dec + ')'] };
    }
  ];

  /* ================================================================
     QUIZ — 15 questions (10 MCQ + 5 numeric)
     ================================================================ */

  var QUIZ_POOL = [
    { type: 'mcq', q: 'Which gate outputs 1 only when ALL inputs are 1?', opts: ['OR', 'AND', 'XOR', 'NOR'], ans: 1 },
    { type: 'mcq', q: 'NAND and NOR are called:', opts: ['Fundamental gates', 'Universal gates', 'Arithmetic gates', 'Sequential gates'], ans: 1 },
    { type: 'mcq', q: 'XOR outputs 1 when inputs are:', opts: ['Both 1', 'Both 0', 'Different', 'The same'], ans: 2 },
    { type: 'mcq', q: 'De Morgan\'s theorem: (A\u00B7B)\' equals:', opts: ['A\'+B\'', 'A\'\u00B7B\'', 'A+B', '(A+B)\''], ans: 0 },
    { type: 'mcq', q: 'A D flip-flop captures data on:', opts: ['Level of clock', 'Rising edge of clock', 'Falling edge of D', 'Both edges'], ans: 1 },
    { type: 'mcq', q: 'What type of circuit has memory?', opts: ['Combinational', 'Sequential', 'Arithmetic', 'Passive'], ans: 1 },
    { type: 'mcq', q: 'The SR latch forbidden state occurs when:', opts: ['S=0, R=0', 'S=1, R=0', 'S=0, R=1', 'S=1, R=1'], ans: 3 },
    { type: 'mcq', q: 'A 2:1 MUX with Sel=0 outputs:', opts: ['Input A', 'Input B', 'Always 0', 'Always 1'], ans: 0 },
    { type: 'mcq', q: 'Which component is used to build binary counters?', opts: ['AND gate', 'D flip-flop', 'T flip-flop', 'Decoder'], ans: 2 },
    { type: 'mcq', q: 'A half adder has how many outputs?', opts: ['1', '2', '3', '4'], ans: 1 },
    { type: 'num', q: 'AND gate: A=1, B=1. What is the output?', ans: 1, tol: 0, unit: '' },
    { type: 'num', q: 'How many rows in a 3-input truth table?', ans: 8, tol: 0, unit: 'rows' },
    { type: 'num', q: 'NOR gate: A=0, B=0. What is the output?', ans: 1, tol: 0, unit: '' },
    { type: 'num', q: 'XOR gate: A=1, B=0. What is the output?', ans: 1, tol: 0, unit: '' },
    { type: 'num', q: 'How many flip-flops for a 4-bit counter?', ans: 4, tol: 0, unit: '' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');
  var simPanel = document.getElementById('sim-panel');
  var prebuiltTabs = document.getElementById('prebuilt-tabs');
  var circuitDesc = document.getElementById('circuit-desc');
  var btnRun = document.getElementById('btn-run');
  var btnStop = document.getElementById('btn-stop');
  var btnClear = document.getElementById('btn-clear');
  var btnDelete = document.getElementById('btn-delete');
  var toolbarHint = document.getElementById('toolbar-hint');
  var propsPanel = document.getElementById('props-panel');
  var propsBody = document.getElementById('props-body');
  var simReadouts = document.getElementById('sim-readouts');
  var warningBar = document.getElementById('warning-bar');
  var truthTablePanel = document.getElementById('truth-table-panel');
  var truthTableBody = document.getElementById('truth-table-body');
  var boolExprPanel = document.getElementById('bool-expr');
  var boolExprValue = document.getElementById('bool-expr-value');
  var ioPanel = document.getElementById('io-panel');
  var ioInputs = document.getElementById('io-inputs');
  var ioOutputs = document.getElementById('io-outputs');

  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var qbarNum = document.getElementById('qbar-num');
  var quizResult = document.getElementById('quiz-result');

  /* ================================================================
     COMPONENT DEFINITIONS — 22 digital components
     ================================================================ */

  var COMP_DEFS = {
    /* ── Input / Output (4) ── */
    'input-pin': { name: 'Input Pin', cat: 'io', w: 40, h: 40,
      ports: [{ x: 40, y: 20, dir: 'right', label: 'Q' }],
      params: { state: { label: 'State', type: 'select', options: ['LOW', 'HIGH'], def: 'LOW' }, label: { label: 'Label', type: 'text', def: '' } }
    },
    'output-pin': { name: 'Output Pin', cat: 'io', w: 40, h: 40,
      ports: [{ x: 0, y: 20, dir: 'left', label: 'A' }],
      params: { label: { label: 'Label', type: 'text', def: '' } }
    },
    'clock-source': { name: 'Clock', cat: 'io', w: 50, h: 40,
      ports: [{ x: 50, y: 20, dir: 'right', label: 'CLK' }],
      params: { freq: { label: 'Freq (Hz)', min: 0.5, max: 10, step: 0.5, def: 2 } }
    },
    'constant': { name: 'Constant', cat: 'io', w: 30, h: 30,
      ports: [{ x: 30, y: 15, dir: 'right', label: 'Q' }],
      params: { value: { label: 'Value', type: 'select', options: ['0', '1'], def: '1' } }
    },

    /* ── Basic Gates (8) ── */
    'and-gate': { name: 'AND', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'or-gate': { name: 'OR', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'not-gate': { name: 'NOT', cat: 'gates', w: 50, h: 40,
      ports: [{ x: 0, y: 20, dir: 'left', label: 'A' }, { x: 50, y: 20, dir: 'right', label: 'Q' }],
      params: {} },
    'nand-gate': { name: 'NAND', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'nor-gate': { name: 'NOR', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'xor-gate': { name: 'XOR', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'xnor-gate': { name: 'XNOR', cat: 'gates', w: 60, h: 50,
      ports: [{ x: 0, y: 14, dir: 'left', label: 'A' }, { x: 0, y: 36, dir: 'left', label: 'B' }, { x: 60, y: 25, dir: 'right', label: 'Q' }],
      params: {} },
    'buffer': { name: 'Buffer', cat: 'gates', w: 50, h: 40,
      ports: [{ x: 0, y: 20, dir: 'left', label: 'A' }, { x: 50, y: 20, dir: 'right', label: 'Q' }],
      params: {} },

    /* ── Combinational (4) ── */
    'mux-2to1': { name: 'MUX 2:1', cat: 'combo', w: 50, h: 70,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'A' }, { x: 0, y: 35, dir: 'left', label: 'B' }, { x: 0, y: 55, dir: 'left', label: 'Sel' }, { x: 50, y: 35, dir: 'right', label: 'Q' }],
      params: {} },
    'demux-1to2': { name: 'DEMUX 1:2', cat: 'combo', w: 50, h: 70,
      ports: [{ x: 0, y: 35, dir: 'left', label: 'D' }, { x: 0, y: 55, dir: 'left', label: 'Sel' }, { x: 50, y: 15, dir: 'right', label: 'Y0' }, { x: 50, y: 55, dir: 'right', label: 'Y1' }],
      params: {} },
    'decoder-2to4': { name: 'Decoder 2:4', cat: 'combo', w: 60, h: 90,
      ports: [{ x: 0, y: 25, dir: 'left', label: 'A0' }, { x: 0, y: 55, dir: 'left', label: 'A1' }, { x: 60, y: 15, dir: 'right', label: 'Y0' }, { x: 60, y: 35, dir: 'right', label: 'Y1' }, { x: 60, y: 55, dir: 'right', label: 'Y2' }, { x: 60, y: 75, dir: 'right', label: 'Y3' }],
      params: {} },
    'encoder-4to2': { name: 'Encoder 4:2', cat: 'combo', w: 60, h: 90,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'I0' }, { x: 0, y: 35, dir: 'left', label: 'I1' }, { x: 0, y: 55, dir: 'left', label: 'I2' }, { x: 0, y: 75, dir: 'left', label: 'I3' }, { x: 60, y: 30, dir: 'right', label: 'Y0' }, { x: 60, y: 60, dir: 'right', label: 'Y1' }],
      params: {} },

    /* ── Sequential (4) ── */
    'sr-latch': { name: 'SR Latch', cat: 'seq', w: 60, h: 60,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'S' }, { x: 0, y: 45, dir: 'left', label: 'R' }, { x: 60, y: 15, dir: 'right', label: 'Q' }, { x: 60, y: 45, dir: 'right', label: 'Q\u0305' }],
      params: {} },
    'd-flipflop': { name: 'D Flip-Flop', cat: 'seq', w: 60, h: 60,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'D' }, { x: 0, y: 45, dir: 'left', label: 'CLK' }, { x: 60, y: 15, dir: 'right', label: 'Q' }, { x: 60, y: 45, dir: 'right', label: 'Q\u0305' }],
      params: {} },
    'jk-flipflop': { name: 'JK Flip-Flop', cat: 'seq', w: 60, h: 70,
      ports: [{ x: 0, y: 12, dir: 'left', label: 'J' }, { x: 0, y: 35, dir: 'left', label: 'CLK' }, { x: 0, y: 58, dir: 'left', label: 'K' }, { x: 60, y: 15, dir: 'right', label: 'Q' }, { x: 60, y: 55, dir: 'right', label: 'Q\u0305' }],
      params: {} },
    't-flipflop': { name: 'T Flip-Flop', cat: 'seq', w: 60, h: 60,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'T' }, { x: 0, y: 45, dir: 'left', label: 'CLK' }, { x: 60, y: 15, dir: 'right', label: 'Q' }, { x: 60, y: 45, dir: 'right', label: 'Q\u0305' }],
      params: {} },

    /* ── Utility (2) ── */
    '7seg-display': { name: '7-Segment', cat: 'utility', w: 60, h: 90,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'A' }, { x: 0, y: 35, dir: 'left', label: 'B' }, { x: 0, y: 55, dir: 'left', label: 'C' }, { x: 0, y: 75, dir: 'left', label: 'D' }],
      params: {} },
    'probe': { name: 'Probe', cat: 'utility', w: 30, h: 30,
      ports: [{ x: 0, y: 15, dir: 'left', label: 'P' }],
      params: { label: { label: 'Label', type: 'text', def: 'Probe' } }
    }
  };

  /* ================================================================
     STATE VARIABLES
     ================================================================ */

  var mode = 'simulate';
  var running = false;
  var simTime = 0, lastTime = 0, animFrame = null;
  var W = 800, H = 500;
  var dpr = window.devicePixelRatio || 1;
  var _fontFamily = "'Segoe UI', system-ui, sans-serif";

  var components = [];
  var connections = [];
  var nextId = 1;
  var selectedComp = null;
  var draggingComp = null;
  var dragOffX = 0, dragOffY = 0;
  var dragStartX = 0, dragStartY = 0, dragMoved = false;
  var connectingFrom = null;
  var hoveredPort = null;
  var hoveredCompId = null;
  var selectedConn = -1;
  var hoveredConn = -1;
  var _pathCache = [];
  var _crossingsCache = [];
  var particles = [];
  var undoStack = [];
  var MAX_UNDO = 30;

  var exploreCat = 'fundamentals';
  var selectedConcept = null;
  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* 7-segment lookup: bits [a,b,c,d,e,f,g] for 0-F */
  var SEVEN_SEG_MAP = [
    0x7E, 0x30, 0x6D, 0x79, 0x33, 0x5B, 0x5F, 0x70,
    0x7F, 0x7B, 0x77, 0x1F, 0x4E, 0x3D, 0x4F, 0x47
  ];

  /* ================================================================
     CANVAS SIZING + HiDPI
     ================================================================ */

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(400, Math.floor(rect.width));
    /* Ensure H respects the CSS min-height (420px) so there's no
       stretch mismatch between logical and display coordinates */
    H = Math.max(420, Math.min(600, Math.floor(W * 0.6)));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  window.addEventListener('resize', resizeCanvas);

  /* ================================================================
     ROTATION HELPERS
     ================================================================ */

  function getRotatedPort(def, portIdx, orient) {
    var port = def.ports[portIdx];
    if (!port) return null;
    if (!orient) return { x: port.x, y: port.y, dir: port.dir, label: port.label };
    var dirs = { up: 'right', right: 'down', down: 'left', left: 'up' };
    return { x: def.h - port.y, y: port.x, dir: dirs[port.dir] || port.dir, label: port.label };
  }

  function getEffectiveDims(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return { w: 60, h: 40 };
    return comp.orient ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
  }

  /* ================================================================
     HELPER FUNCTIONS
     ================================================================ */

  function findComp(id) {
    for (var i = 0; i < components.length; i++) {
      if (components[i].id === id) return components[i];
    }
    return null;
  }

  function isPortConnected(compId, portIdx) {
    for (var i = 0; i < connections.length; i++) {
      var c = connections[i];
      if ((c.from.compId === compId && c.from.portIdx === portIdx) ||
          (c.to.compId === compId && c.to.portIdx === portIdx)) return true;
    }
    return false;
  }

  function isOutputPort(def, portIdx) {
    return def.ports[portIdx].dir === 'right';
  }

  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    /* Scale from CSS display pixels to canvas logical pixels (W × H).
       On mobile, CSS width:100% may differ from canvas.style.width,
       and on HiDPI, rect dimensions are CSS pixels not canvas pixels. */
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  /* ================================================================
     CONNECTION ROUTING
     ================================================================ */

  function getPortWorldPos(info) {
    var comp = findComp(info.compId);
    if (!comp) return { x: 0, y: 0 };
    var def = COMP_DEFS[comp.type];
    var port = getRotatedPort(def, info.portIdx, comp.orient);
    return { x: comp.x + port.x, y: comp.y + port.y };
  }

  function applyStub(pos, dir, len) {
    switch (dir) {
      case 'up': return { x: pos.x, y: pos.y - len };
      case 'down': return { x: pos.x, y: pos.y + len };
      case 'left': return { x: pos.x - len, y: pos.y };
      case 'right': return { x: pos.x + len, y: pos.y };
      default: return { x: pos.x, y: pos.y - len };
    }
  }

  function enforceOrthogonal(pts) {
    if (!pts || pts.length < 2) return pts;
    var result = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var prev = result[result.length - 1];
      var cur = pts[i];
      if (Math.abs(prev.x - cur.x) > 1 && Math.abs(prev.y - cur.y) > 1) {
        if (result.length >= 2) {
          var pp = result[result.length - 2];
          if (Math.abs(pp.x - prev.x) < 1) result.push({ x: prev.x, y: cur.y });
          else result.push({ x: cur.x, y: prev.y });
        } else {
          result.push({ x: cur.x, y: prev.y });
        }
      }
      result.push(cur);
    }
    return result;
  }

  function getConnectionPath(conn) {
    var fromComp = findComp(conn.from.compId);
    var toComp = findComp(conn.to.compId);
    if (!fromComp || !toComp) return null;

    var fromDef = COMP_DEFS[fromComp.type];
    var toDef = COMP_DEFS[toComp.type];
    var fromPort = getRotatedPort(fromDef, conn.from.portIdx, fromComp.orient);
    var toPort = getRotatedPort(toDef, conn.to.portIdx, toComp.orient);
    if (!fromPort || !toPort) return null;

    var fp = { x: fromComp.x + fromPort.x, y: fromComp.y + fromPort.y };
    var tp = { x: toComp.x + toPort.x, y: toComp.y + toPort.y };

    var STUB = 20;
    var fpS = applyStub(fp, fromPort.dir, STUB);
    var tpS = applyStub(tp, toPort.dir, STUB);

    if (conn.waypoints && conn.waypoints.length > 0) {
      var wpts = [fp, fpS];
      for (var wi = 0; wi < conn.waypoints.length; wi++) wpts.push(conn.waypoints[wi]);
      var lastWp = wpts[wpts.length - 1];
      if (Math.abs(lastWp.x - tpS.x) > 1 && Math.abs(lastWp.y - tpS.y) > 1) {
        if (toPort.dir === 'up' || toPort.dir === 'down') wpts.push({ x: tpS.x, y: lastWp.y });
        else wpts.push({ x: lastWp.x, y: tpS.y });
      }
      wpts.push(tpS);
      wpts.push(tp);
      return enforceOrthogonal(wpts);
    }

    var points = [fp, fpS];
    var isFromVert = (fromPort.dir === 'up' || fromPort.dir === 'down');
    var isToVert = (toPort.dir === 'up' || toPort.dir === 'down');

    if (Math.abs(fpS.x - tpS.x) < 1 && Math.abs(fpS.y - tpS.y) < 1) {
      /* direct */
    } else if (Math.abs(fpS.x - tpS.x) < 1 || Math.abs(fpS.y - tpS.y) < 1) {
      points.push(tpS);
    } else if (isFromVert && isToVert) {
      var midY = (fpS.y + tpS.y) / 2 + (conn._dragOffset || 0) + (conn._autoNudge || 0);
      points.push({ x: fpS.x, y: midY });
      points.push({ x: tpS.x, y: midY });
      points.push(tpS);
    } else if (!isFromVert && !isToVert) {
      var midX = (fpS.x + tpS.x) / 2 + (conn._dragOffset || 0) + (conn._autoNudge || 0);
      points.push({ x: midX, y: fpS.y });
      points.push({ x: midX, y: tpS.y });
      points.push(tpS);
    } else {
      var nudge = (conn._dragOffset || 0) + (conn._autoNudge || 0);
      if (isFromVert) {
        var bendY = tpS.y + nudge;
        points.push({ x: fpS.x, y: bendY });
        points.push({ x: tpS.x, y: bendY });
      } else {
        var bendX = tpS.x + nudge;
        points.push({ x: bendX, y: fpS.y });
        points.push({ x: bendX, y: tpS.y });
      }
      points.push(tpS);
    }

    points.push(tp);
    return cleanPath(points);
  }

  function cleanPath(path) {
    if (!path || path.length < 2) return path;
    var fixed = [path[0]];
    for (var i = 1; i < path.length; i++) {
      var prev = fixed[fixed.length - 1];
      var cur = path[i];
      if (Math.abs(cur.x - prev.x) > 1 && Math.abs(cur.y - prev.y) > 1) {
        fixed.push({ x: cur.x, y: prev.y });
      }
      fixed.push(cur);
    }
    var res = [fixed[0]];
    for (var j = 1; j < fixed.length; j++) {
      if (res.length >= 2) {
        var pp = res[res.length - 2], p = res[res.length - 1], c = fixed[j];
        if ((Math.abs(pp.x - p.x) < 1 && Math.abs(p.x - c.x) < 1) ||
            (Math.abs(pp.y - p.y) < 1 && Math.abs(p.y - c.y) < 1)) {
          res[res.length - 1] = c;
          continue;
        }
      }
      var prev2 = res[res.length - 1];
      if (!(Math.abs(fixed[j].x - prev2.x) < 1 && Math.abs(fixed[j].y - prev2.y) < 1)) {
        res.push(fixed[j]);
      }
    }
    return res;
  }

  function polylineLength(pts) {
    var len = 0;
    for (var i = 1; i < pts.length; i++) len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
    return len;
  }

  function interpolatePolyline(pts, dist) {
    var remaining = dist;
    for (var i = 1; i < pts.length; i++) {
      var segLen = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
      if (segLen < 0.001) continue;
      if (remaining <= segLen) {
        var frac = remaining / segLen;
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * frac, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * frac };
      }
      remaining -= segLen;
    }
    return pts[pts.length - 1];
  }

  function pointToSegmentDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var projX = ax + t * dx, projY = ay + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  /* ── Path cache & overlap detection ── */

  function recomputePaths() {
    for (var i = 0; i < connections.length; i++) connections[i]._autoNudge = 0;
    _pathCache = [];
    for (var i2 = 0; i2 < connections.length; i2++) _pathCache[i2] = getConnectionPath(connections[i2]);
    nudgeOverlaps();
    _crossingsCache = findCrossings();
  }

  function nudgeOverlaps() {
    var THRESHOLD = 15, OFFSET = 8;
    var nudged = {};
    for (var i = 0; i < _pathCache.length; i++) {
      if (nudged[i]) continue;
      var pathA = _pathCache[i];
      if (!pathA || pathA.length < 2) continue;
      var group = [i];
      for (var j = i + 1; j < _pathCache.length; j++) {
        var pathB = _pathCache[j];
        if (!pathB || pathB.length < 2) continue;
        if (pathsOverlap(pathA, pathB, THRESHOLD)) group.push(j);
      }
      if (group.length > 1) {
        for (var g = 0; g < group.length; g++) {
          var ci = group[g];
          connections[ci]._autoNudge = (g - (group.length - 1) / 2) * OFFSET;
          _pathCache[ci] = getConnectionPath(connections[ci]);
          nudged[ci] = true;
        }
      }
    }
  }

  function pathsOverlap(pathA, pathB, threshold) {
    for (var si = 1; si < pathA.length; si++) {
      var a1 = pathA[si - 1], a2 = pathA[si];
      var aH = Math.abs(a1.y - a2.y) < 1, aV = Math.abs(a1.x - a2.x) < 1;
      if (!aH && !aV) continue;
      for (var sj = 1; sj < pathB.length; sj++) {
        var b1 = pathB[sj - 1], b2 = pathB[sj];
        var bH = Math.abs(b1.y - b2.y) < 1, bV = Math.abs(b1.x - b2.x) < 1;
        if (!bH && !bV) continue;
        if (aH && bH && Math.abs(a1.y - b1.y) < 4) {
          var ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x)) - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
          if (ov > threshold) return true;
        } else if (aV && bV && Math.abs(a1.x - b1.x) < 4) {
          var ov2 = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y)) - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
          if (ov2 > threshold) return true;
        }
      }
    }
    return false;
  }

  function findCrossings() {
    var crossings = [];
    var allSegs = [];
    for (var ci = 0; ci < _pathCache.length; ci++) {
      var path = _pathCache[ci];
      if (!path || path.length < 2) continue;
      for (var si = 1; si < path.length; si++) allSegs.push({ ci: ci, x1: path[si - 1].x, y1: path[si - 1].y, x2: path[si].x, y2: path[si].y });
    }
    for (var i = 0; i < allSegs.length; i++) {
      for (var j = i + 1; j < allSegs.length; j++) {
        var a = allSegs[i], b = allSegs[j];
        if (a.ci === b.ci) continue;
        var aH = Math.abs(a.y1 - a.y2) < 1, aV = Math.abs(a.x1 - a.x2) < 1;
        var bH = Math.abs(b.y1 - b.y2) < 1, bV = Math.abs(b.x1 - b.x2) < 1;
        if (aH && bV) {
          var ix = b.x1, iy = a.y1;
          if (ix > Math.min(a.x1, a.x2) + 2 && ix < Math.max(a.x1, a.x2) - 2 && iy > Math.min(b.y1, b.y2) + 2 && iy < Math.max(b.y1, b.y2) - 2) crossings.push({ x: ix, y: iy });
        } else if (aV && bH) {
          var ix2 = a.x1, iy2 = b.y1;
          if (ix2 > Math.min(b.x1, b.x2) + 2 && ix2 < Math.max(b.x1, b.x2) - 2 && iy2 > Math.min(a.y1, a.y2) + 2 && iy2 < Math.max(a.y1, a.y2) - 2) crossings.push({ x: ix2, y: iy2 });
        }
      }
    }
    return crossings;
  }

  function drawCrossings(crossings) {
    if (!crossings || crossings.length === 0) return;
    ctx.save();
    var R = 5;
    for (var i = 0; i < crossings.length; i++) {
      var cr = crossings[i];
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(cr.x - R, cr.y - R, R * 2, R * 2);
      ctx.strokeStyle = '#6a7a9a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, R, Math.PI, 0, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ================================================================
     DRAW FUNCTION
     ================================================================ */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = '#151a24';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    recomputePaths();

    /* Draw connections */
    for (var i = 0; i < connections.length; i++) {
      drawConnection(connections[i], i, hoveredConn === i, selectedConn === i);
    }
    drawCrossings(_crossingsCache);

    /* Connection preview */
    if (connectingFrom) {
      var fpPrev = getPortWorldPos(connectingFrom);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(fpPrev.x, fpPrev.y);
      var prevCompF = findComp(connectingFrom.compId);
      var stubPt = fpPrev;
      if (prevCompF) {
        var prevDefF = COMP_DEFS[prevCompF.type];
        var prevPortF = getRotatedPort(prevDefF, connectingFrom.portIdx, prevCompF.orient);
        stubPt = applyStub({ x: prevCompF.x + prevPortF.x, y: prevCompF.y + prevPortF.y }, prevPortF.dir, 20);
        ctx.lineTo(stubPt.x, stubPt.y);
      }
      if (connectingFrom._waypoints) {
        for (var wi = 0; wi < connectingFrom._waypoints.length; wi++) {
          ctx.lineTo(connectingFrom._waypoints[wi].x, connectingFrom._waypoints[wi].y);
        }
      }
      if (connectingFrom._lastMouse) {
        var mouse = connectingFrom._lastMouse;
        var lastPt2;
        if (connectingFrom._waypoints && connectingFrom._waypoints.length > 0) {
          lastPt2 = connectingFrom._waypoints[connectingFrom._waypoints.length - 1];
        } else {
          lastPt2 = stubPt;
        }
        var pdx = Math.abs(mouse.x - lastPt2.x);
        var pdy = Math.abs(mouse.y - lastPt2.y);
        if (pdx <= pdy) ctx.lineTo(lastPt2.x, mouse.y);
        else ctx.lineTo(mouse.x, lastPt2.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (connectingFrom._waypoints) {
        for (var wd = 0; wd < connectingFrom._waypoints.length; wd++) {
          ctx.beginPath();
          ctx.arc(connectingFrom._waypoints[wd].x, connectingFrom._waypoints[wd].y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#80d8ff';
          ctx.fill();
        }
      }
    }

    /* Draw components */
    for (var c = 0; c < components.length; c++) {
      drawComponent(components[c]);
    }

    /* Draw particles */
    if (running) drawParticles();

    /* Truth table sidebar (right side of canvas) */
    if (running) drawTruthTableSidebar();

    /* Empty state hint */
    if (components.length === 0 && !running) {
      ctx.fillStyle = '#2a3050';
      ctx.font = '14px ' + _fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('Drag or click components from the palette to add them', W / 2, H / 2 - 10);
      ctx.fillText('Then click ports (circles) to connect them', W / 2, H / 2 + 14);
      ctx.textAlign = 'left';
    }
  }

  /* ================================================================
     TRUTH TABLE — CANVAS SIDEBAR
     ================================================================ */

  var _ttSidebarRect = null; /* { x, y, w, h, rowH, headerH, table } for click detection */

  function drawTruthTableSidebar() {
    var table = _ttCache;
    if (!table || table.rows.length === 0) return;

    var nCols = table.headers.length;
    var nRows = table.rows.length;
    var nIn = table.inputCount;
    /* Auto-size columns: measure header text widths */
    ctx.font = '700 10px ' + _fontFamily;
    var colW = 28;
    for (var hw = 0; hw < nCols; hw++) {
      var tw = ctx.measureText(table.headers[hw]).width + 14;
      if (tw > colW) colW = Math.min(tw, 50);
    }
    colW = Math.round(colW);
    var rowH = 18;
    var headerH = 22;
    var pad = 8;
    var ttW = nCols * colW + pad * 2;
    var ttH = headerH + nRows * rowH + pad * 2;
    var ttX = W - ttW - 8;
    var ttY = 8;

    /* Determine active row from current input pin states */
    var inputPins = components.filter(function (c) { return c.type === 'input-pin'; });
    var activeRow = -1;
    if (inputPins.length === nIn) {
      var rowVal = 0;
      for (var ai = 0; ai < nIn; ai++) {
        if (inputPins[ai].values.state === 'HIGH') rowVal |= (1 << (nIn - 1 - ai));
      }
      activeRow = rowVal;
    }

    /* Save rect for click detection */
    _ttSidebarRect = { x: ttX, y: ttY, w: ttW, h: ttH, rowH: rowH, headerH: headerH, pad: pad, colW: colW, table: table, nIn: nIn };

    ctx.save();

    /* Background panel */
    ctx.fillStyle = 'rgba(10,14,20,0.92)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ttX, ttY, ttW, ttH, 6);
    ctx.fill(); ctx.stroke();

    /* Title */
    ctx.font = '600 9px ' + _fontFamily;
    ctx.fillStyle = '#4a5578';
    ctx.textAlign = 'left';
    ctx.fillText('TRUTH TABLE', ttX + pad, ttY + 12);

    /* Clickable hint */
    ctx.font = '500 7px ' + _fontFamily;
    ctx.fillStyle = '#333d55';
    ctx.textAlign = 'right';
    ctx.fillText('click row to set inputs', ttX + ttW - pad, ttY + 12);

    var tableX = ttX + pad;
    var tableY = ttY + 18;

    /* Header row */
    ctx.font = '700 10px ' + _fontFamily;
    for (var h = 0; h < nCols; h++) {
      var hx = tableX + h * colW + colW / 2;
      ctx.fillStyle = h < nIn ? '#42a5f5' : '#00e676';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(table.headers[h], hx, tableY + headerH / 2);
    }

    /* Separator line */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, tableY + headerH);
    ctx.lineTo(tableX + nCols * colW, tableY + headerH);
    ctx.stroke();

    /* Input/output column separator */
    var sepX = tableX + nIn * colW;
    ctx.strokeStyle = '#1e2a3a';
    ctx.beginPath();
    ctx.moveTo(sepX, tableY);
    ctx.lineTo(sepX, tableY + headerH + nRows * rowH);
    ctx.stroke();

    /* Data rows */
    for (var r = 0; r < nRows; r++) {
      var ry = tableY + headerH + r * rowH;
      var isActive = (r === activeRow);

      /* Active row highlight */
      if (isActive) {
        ctx.fillStyle = 'rgba(0,230,118,0.12)';
        ctx.beginPath();
        ctx.roundRect(tableX - 4, ry + 1, nCols * colW + 8, rowH - 2, 3);
        ctx.fill();
        /* Left accent bar */
        ctx.fillStyle = '#00e676';
        ctx.fillRect(tableX - 6, ry + 4, 2, rowH - 8);
      }

      /* Hover row (stored from pointer handler) */
      if (r === _ttHoverRow && !isActive) {
        ctx.fillStyle = 'rgba(66,165,245,0.08)';
        ctx.beginPath();
        ctx.roundRect(tableX - 4, ry + 1, nCols * colW + 8, rowH - 2, 3);
        ctx.fill();
      }

      ctx.font = isActive ? '700 10px ' + _fontFamily : '500 10px ' + _fontFamily;
      for (var c = 0; c < nCols; c++) {
        var cx = tableX + c * colW + colW / 2;
        var val = table.rows[r][c];
        var isOutput = c >= nIn;
        if (isActive) {
          ctx.fillStyle = val ? '#00e676' : '#ff5555';
        } else {
          ctx.fillStyle = isOutput ? (val ? 'rgba(0,230,118,0.6)' : '#2a3050') : (val ? '#8899bb' : '#333d55');
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, cx, ry + rowH / 2);
      }
    }

    /* Boolean expression at bottom */
    var exprY = tableY + headerH + nRows * rowH + 8;
    var expr = generateBooleanExpression();
    if (expr && exprY + 14 < ttY + ttH) {
      ctx.font = '500 7px ' + _fontFamily;
      ctx.fillStyle = '#4a5578';
      ctx.textAlign = 'left';
      var maxExprW = ttW - pad * 2;
      /* Truncate if too long */
      var exprText = expr.length > 40 ? expr.substring(0, 38) + '\u2026' : expr;
      ctx.fillText(exprText, tableX, exprY);
    }

    ctx.restore();
  }

  var _ttHoverRow = -1;

  /* Truth table row click handler — set inputs to match clicked row */
  function handleTTClick(mx, my) {
    if (!_ttSidebarRect || !_ttSidebarRect.table) return false;
    var r = _ttSidebarRect;
    if (mx < r.x || mx > r.x + r.w || my < r.y || my > r.y + r.h) return false;

    var tableY = r.y + 18;
    var rowIdx = Math.floor((my - tableY - r.headerH) / r.rowH);
    if (rowIdx < 0 || rowIdx >= r.table.rows.length) return false;

    /* Set input pins to match this row */
    var inputPins = components.filter(function (c) { return c.type === 'input-pin'; });
    var n = r.nIn;
    for (var b = 0; b < n && b < inputPins.length; b++) {
      var bit = (rowIdx >> (n - 1 - b)) & 1;
      inputPins[b].values.state = bit ? 'HIGH' : 'LOW';
      inputPins[b]._outputs = [bit];
    }
    markTruthTableDirty();
    computeCircuit();
    draw();
    return true;
  }

  /* Truth table hover detection */
  function handleTTHover(mx, my) {
    if (!_ttSidebarRect || !_ttSidebarRect.table) { _ttHoverRow = -1; return; }
    var r = _ttSidebarRect;
    if (mx < r.x || mx > r.x + r.w || my < r.y || my > r.y + r.h) { _ttHoverRow = -1; return; }
    var tableY = r.y + 18;
    var rowIdx = Math.floor((my - tableY - r.headerH) / r.rowH);
    _ttHoverRow = (rowIdx >= 0 && rowIdx < r.table.rows.length) ? rowIdx : -1;
  }

  /* ================================================================
     CONNECTION DRAWING
     ================================================================ */

  /* Wire color palette — each input pin gets a distinct color */
  var WIRE_COLORS = [
    { h: '#42a5f5', l: '#1a3050' },  /* Blue — Input A */
    { h: '#ff7043', l: '#3a1a10' },  /* Orange — Input B */
    { h: '#ab47bc', l: '#2a1a30' },  /* Purple — Input C */
    { h: '#26c6da', l: '#0a2a30' },  /* Cyan — Input D */
    { h: '#ffca28', l: '#2a2510' },  /* Yellow — Input E */
    { h: '#66bb6a', l: '#1a2a1a' },  /* Green — Input F */
    { h: '#ef5350', l: '#2a1010' },  /* Red */
    { h: '#78909c', l: '#1a2025' }   /* Grey fallback */
  ];

  /* Trace a connection back to its root input pin to determine wire color */
  function getSourceColor(conn, alpha) {
    var srcComp = findComp(conn.from.compId);
    if (!srcComp) return alpha > 0.5 ? '#4caf50' : '#2a3050';

    /* Direct from input pin */
    if (srcComp.type === 'input-pin') {
      var idx = 0;
      for (var i = 0; i < components.length; i++) {
        if (components[i].type === 'input-pin') {
          if (components[i].id === srcComp.id) break;
          idx++;
        }
      }
      var col = WIRE_COLORS[idx % WIRE_COLORS.length];
      return alpha > 0.5 ? col.h : col.l;
    }

    /* From clock source — always cyan */
    if (srcComp.type === 'clock-source') {
      return alpha > 0.5 ? '#26c6da' : '#0a2a30';
    }

    /* From constant — always yellow */
    if (srcComp.type === 'constant') {
      return alpha > 0.5 ? '#ffca28' : '#2a2510';
    }

    /* From a gate — use green for HIGH, grey for LOW (output of mixed inputs) */
    return alpha > 0.5 ? '#4caf50' : '#2a3050';
  }

  function drawConnection(conn, connIdx, isHovered, isSelected) {
    var path = _pathCache[connIdx] || getConnectionPath(conn);
    if (!path || path.length < 2) return;

    var level = conn.logicLevel;
    if (running) {
      /* Color-code wires by source input pin for easier tracing */
      var wireColor = level === 1 ? getSourceColor(conn, 1.0) : getSourceColor(conn, 0.2);
      ctx.strokeStyle = wireColor;
    } else {
      ctx.strokeStyle = '#3a4a6a';
    }
    var baseWidth = running ? (level === 1 ? 2.5 : 1.5) : 2;

    if (isSelected) { ctx.strokeStyle = '#00e5ff'; baseWidth = 4; }
    else if (isHovered && !running) { ctx.strokeStyle = '#5599cc'; baseWidth = 3; }

    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    /* Glow for HIGH wires */
    if (running && level === 1) {
      ctx.save();
      var glowCol = getSourceColor(conn, 1.0);
      ctx.strokeStyle = glowCol.replace(')', ',0.15)').replace('rgb', 'rgba');
      /* Fallback if not rgb format */
      if (ctx.strokeStyle.indexOf('rgba') === -1) ctx.strokeStyle = 'rgba(76,175,80,0.15)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var j = 1; j < path.length; j++) ctx.lineTo(path[j].x, path[j].y);
      ctx.stroke();
      ctx.restore();
    }

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,229,255,0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var k = 1; k < path.length; k++) ctx.lineTo(path[k].x, path[k].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ================================================================
     PARTICLE DRAWING
     ================================================================ */

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var conn = connections[p.connIdx];
      if (!conn || conn.logicLevel !== 1) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#69f0ae';
      ctx.fill();
    }
  }

  /* ================================================================
     COMPONENT DRAWING
     ================================================================ */

  function drawComponent(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return;
    var x = comp.x, y = comp.y;
    var isSelected = (selectedComp && selectedComp.id === comp.id);
    var ed = getEffectiveDims(comp);

    ctx.save();
    ctx.translate(x, y);

    if (isSelected) {
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-4, -4, ed.w + 8, ed.h + 8);
      ctx.setLineDash([]);
    }

    if (comp.orient) {
      ctx.save();
      ctx.translate(def.h, 0);
      ctx.rotate(Math.PI / 2);
    }

    drawSymbol(comp, def);

    if (comp.orient) ctx.restore();

    /* Ports */
    var showPortLabels = isSelected || (hoveredCompId === comp.id) || (connectingFrom != null);
    for (var p = 0; p < def.ports.length; p++) {
      var port = getRotatedPort(def, p, comp.orient);
      var isHov = (hoveredPort && hoveredPort.compId === comp.id && hoveredPort.portIdx === p);
      var isConn = (connectingFrom && connectingFrom.compId === comp.id && connectingFrom.portIdx === p);
      var connected = isPortConnected(comp.id, p);
      ctx.beginPath();
      ctx.arc(port.x, port.y, isHov ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isConn ? '#ff9900' : (isHov ? '#80d8ff' : (connected ? '#4caf50' : '#5a8ab5'));
      ctx.fill();
      ctx.strokeStyle = '#0a0e14';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (showPortLabels && port.label) {
        ctx.save();
        ctx.font = 'bold 8px ' + _fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var lx = port.x, ly = port.y;
        var lDir = port.dir;
        if (lDir === 'up') { ly -= 10; }
        else if (lDir === 'down') { ly += 10; }
        else if (lDir === 'left') { lx -= 12; }
        else if (lDir === 'right') { lx += 12; }
        var tw = ctx.measureText(port.label).width + 6;
        ctx.fillStyle = 'rgba(10,14,20,0.85)';
        ctx.beginPath();
        ctx.roundRect(lx - tw / 2, ly - 6, tw, 12, 3);
        ctx.fill();
        ctx.fillStyle = isHov ? '#80d8ff' : '#00bcd4';
        ctx.fillText(port.label, lx, ly);
        ctx.restore();
      }
    }

    /* Label */
    ctx.fillStyle = '#8899bb';
    ctx.font = '9px ' + _fontFamily;
    ctx.textAlign = 'center';
    var labelText = def.name;
    if (comp.type === 'input-pin' && comp.values && comp.values.label) labelText = comp.values.label;
    if (comp.type === 'output-pin' && comp.values && comp.values.label) labelText = comp.values.label;
    if (comp.type === 'probe' && comp.values && comp.values.label) labelText = comp.values.label;
    ctx.fillText(labelText, ed.w / 2, ed.h + 14);

    ctx.restore();
  }

  /* ================================================================
     SYMBOL DISPATCHER
     ================================================================ */

  function drawSymbol(comp, def) {
    var w = def.w, h = def.h;
    var t = comp.type;

    if (t === 'input-pin') drawInputPin(w, h, comp);
    else if (t === 'output-pin') drawOutputPin(w, h, comp);
    else if (t === 'clock-source') drawClockSource(w, h, comp);
    else if (t === 'constant') drawConstant(w, h, comp);
    else if (t === 'and-gate') drawANDGate(w, h, comp);
    else if (t === 'or-gate') drawORGate(w, h, comp);
    else if (t === 'not-gate') drawNOTGate(w, h, comp);
    else if (t === 'nand-gate') drawNANDGate(w, h, comp);
    else if (t === 'nor-gate') drawNORGate(w, h, comp);
    else if (t === 'xor-gate') drawXORGate(w, h, comp);
    else if (t === 'xnor-gate') drawXNORGate(w, h, comp);
    else if (t === 'buffer') drawBuffer(w, h, comp);
    else if (t === 'mux-2to1') drawMUX(w, h, comp);
    else if (t === 'demux-1to2') drawDEMUX(w, h, comp);
    else if (t === 'decoder-2to4') drawDecoder(w, h, comp);
    else if (t === 'encoder-4to2') drawEncoder(w, h, comp);
    else if (t === 'sr-latch') drawSRLatch(w, h, comp);
    else if (t === 'd-flipflop') drawDFlipFlop(w, h, comp);
    else if (t === 'jk-flipflop') drawJKFlipFlop(w, h, comp);
    else if (t === 't-flipflop') drawTFlipFlop(w, h, comp);
    else if (t === '7seg-display') drawSevenSegment(w, h, comp);
    else if (t === 'probe') drawProbe(w, h, comp);
  }

  /* ================================================================
     SYMBOL DRAWING — 22 ANSI gate symbols
     ================================================================ */

  /* ── Helper: get output value for coloring ── */
  function gateOutput(comp, idx) {
    if (!comp._outputs) return -1;
    return comp._outputs[idx] || 0;
  }

  function gateColor(comp, idx) {
    var out = gateOutput(comp, idx);
    return {
      fill: out === 1 ? '#1b3a1b' : '#1a2535',
      stroke: out === 1 ? '#4caf50' : '#5a8ab5'
    };
  }

  /* ── Input Pin ── */
  function drawInputPin(w, h, comp) {
    var isHigh = comp.values && comp.values.state === 'HIGH';
    ctx.fillStyle = isHigh ? '#4caf50' : '#1a2535';
    ctx.strokeStyle = isHigh ? '#69f0ae' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    /* Glow when HIGH */
    if (isHigh) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(76,175,80,0.15)';
      ctx.fill();
    }
    /* State label */
    ctx.fillStyle = isHigh ? '#fff' : '#6b7a99';
    ctx.font = '700 12px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isHigh ? '1' : '0', w / 2, h / 2);
  }

  /* ── Output Pin ── */
  function drawOutputPin(w, h, comp) {
    var isHigh = !!comp._displayHigh;
    var cx = w / 2, cy = h / 2, r = w / 2 - 2;

    /* Outer glow ring for HIGH */
    if (isHigh) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,230,118,0.12)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,230,118,0.2)';
      ctx.fill();
    }

    /* Main circle — bright green (HIGH) or dark (LOW) */
    ctx.fillStyle = isHigh ? '#00e676' : '#1a2535';
    ctx.strokeStyle = isHigh ? '#69f0ae' : '#3a4a60';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    /* Value text: 1 or 0 */
    ctx.font = '700 ' + Math.round(r * 0.9) + 'px ' + _fontFamily;
    ctx.fillStyle = isHigh ? '#fff' : '#4a5578';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isHigh ? '1' : '0', cx, cy + 1);
  }

  /* ── Clock Source ── */
  function drawClockSource(w, h, comp) {
    var clkHigh = comp._clockState || 0;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = clkHigh ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    /* Square wave icon */
    ctx.strokeStyle = '#69f0ae';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var sx = 10, sy = h * 0.3, ey = h * 0.7, sw = (w - 20) / 4;
    ctx.moveTo(sx, ey);
    ctx.lineTo(sx, sy); ctx.lineTo(sx + sw, sy);
    ctx.lineTo(sx + sw, ey); ctx.lineTo(sx + sw * 2, ey);
    ctx.lineTo(sx + sw * 2, sy); ctx.lineTo(sx + sw * 3, sy);
    ctx.lineTo(sx + sw * 3, ey); ctx.lineTo(sx + sw * 4, ey);
    ctx.stroke();
  }

  /* ── Constant ── */
  function drawConstant(w, h, comp) {
    var val = comp.values && comp.values.value === '1' ? 1 : 0;
    ctx.fillStyle = val ? '#1b3a1b' : '#1a2535';
    ctx.strokeStyle = val ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = val ? '#69f0ae' : '#6b7a99';
    ctx.font = '700 14px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val ? '1' : '0', w / 2, h / 2);
  }

  /* ── AND Gate ── */
  function drawANDGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.45, 0);
    ctx.arc(w * 0.45, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AND', w / 2 - 4, h / 2);
  }

  /* ── OR Gate ── */
  function drawORGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w * 0.3, h / 2, 0, h);
    ctx.quadraticCurveTo(w * 0.6, h, w, h / 2);
    ctx.quadraticCurveTo(w * 0.6, 0, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OR', w / 2, h / 2);
  }

  /* ── NOT Gate (Inverter) ── */
  function drawNOTGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* Triangle */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w - 12, h / 2);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Bubble */
    ctx.beginPath();
    ctx.arc(w - 6, h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /* ── NAND Gate ── */
  function drawNANDGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* AND body (shortened) */
    var bw = w - 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bw * 0.45, 0);
    ctx.arc(bw * 0.45, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Bubble */
    ctx.beginPath();
    ctx.arc(w - 6, h / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NAND', w / 2 - 4, h / 2);
  }

  /* ── NOR Gate ── */
  function drawNORGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* OR body (shortened) */
    var bw = w - 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(bw * 0.3, h / 2, 0, h);
    ctx.quadraticCurveTo(bw * 0.6, h, bw, h / 2);
    ctx.quadraticCurveTo(bw * 0.6, 0, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Bubble */
    ctx.beginPath();
    ctx.arc(w - 6, h / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NOR', w / 2 - 2, h / 2);
  }

  /* ── XOR Gate ── */
  function drawXORGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* OR body */
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(w * 0.3 + 4, h / 2, 4, h);
    ctx.quadraticCurveTo(w * 0.6, h, w, h / 2);
    ctx.quadraticCurveTo(w * 0.6, 0, 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Extra curved line on input side */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w * 0.3, h / 2, 0, h);
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XOR', w / 2 + 2, h / 2);
  }

  /* ── XNOR Gate ── */
  function drawXNORGate(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* XOR body (shortened for bubble) */
    var bw = w - 12;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(bw * 0.3 + 4, h / 2, 4, h);
    ctx.quadraticCurveTo(bw * 0.6, h, bw, h / 2);
    ctx.quadraticCurveTo(bw * 0.6, 0, 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Extra curved line */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(bw * 0.3, h / 2, 0, h);
    ctx.stroke();
    /* Bubble */
    ctx.beginPath();
    ctx.arc(w - 6, h / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 8px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XNOR', w / 2 - 2, h / 2);
  }

  /* ── Buffer ── */
  function drawBuffer(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUF', w / 2 - 3, h / 2);
  }

  /* ── MUX 2:1 ── */
  function drawMUX(w, h, comp) {
    var col = gateColor(comp, 0);
    ctx.fillStyle = col.fill;
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 2;
    /* Trapezoid */
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h * 0.2);
    ctx.lineTo(w, h * 0.8);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Labels */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MUX', w / 2, h * 0.35);
    ctx.font = '600 7px ' + _fontFamily;
    ctx.fillText('A', 8, 15);
    ctx.fillText('B', 8, 35);
    ctx.fillText('S', 8, 55);
  }

  /* ── DEMUX 1:2 ── */
  function drawDEMUX(w, h, comp) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 2;
    /* Trapezoid (reversed) */
    ctx.beginPath();
    ctx.moveTo(0, h * 0.2);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 8px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEMUX', w / 2, h * 0.35);
    ctx.font = '600 7px ' + _fontFamily;
    ctx.fillText('D', 8, 35);
    ctx.fillText('S', 8, 55);
    ctx.textAlign = 'right';
    ctx.fillText('Y0', w - 4, 15);
    ctx.fillText('Y1', w - 4, 55);
  }

  /* ── Decoder 2:4 ── */
  function drawDecoder(w, h, comp) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    /* Title */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEC', w / 2, 6);
    /* Pin labels */
    ctx.font = '600 7px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.fillText('A0', 4, 25);
    ctx.fillText('A1', 4, 55);
    ctx.textAlign = 'right';
    ctx.fillText('Y0', w - 4, 15);
    ctx.fillText('Y1', w - 4, 35);
    ctx.fillText('Y2', w - 4, 55);
    ctx.fillText('Y3', w - 4, 75);
    /* Highlight active output */
    if (comp._outputs) {
      for (var oi = 0; oi < comp._outputs.length; oi++) {
        if (comp._outputs[oi] === 1) {
          var oy = [15, 35, 55, 75][oi];
          ctx.fillStyle = 'rgba(76,175,80,0.3)';
          ctx.fillRect(w - 20, oy - 6, 16, 12);
        }
      }
    }
  }

  /* ── Encoder 4:2 ── */
  function drawEncoder(w, h, comp) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 9px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ENC', w / 2, 6);
    ctx.font = '600 7px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.fillText('I0', 4, 15);
    ctx.fillText('I1', 4, 35);
    ctx.fillText('I2', 4, 55);
    ctx.fillText('I3', 4, 75);
    ctx.textAlign = 'right';
    ctx.fillText('Y0', w - 4, 30);
    ctx.fillText('Y1', w - 4, 60);
  }

  /* ── SR Latch ── */
  function drawSRLatch(w, h, comp) {
    var qVal = comp._q;
    ctx.fillStyle = qVal === 1 ? '#1b3a1b' : '#1a2535';
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    /* Pin labels */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 9px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 4, 15);
    ctx.fillText('R', 4, 45);
    ctx.textAlign = 'right';
    ctx.fillText('Q', w - 4, 15);
    ctx.fillText('Q\u0305', w - 4, 45);
    /* Title */
    ctx.textAlign = 'center';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.fillText('SR', w / 2, h / 2 + 1);
    /* Invalid state warning */
    if (comp._q === -1) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '600 7px ' + _fontFamily;
      ctx.fillText('INVALID', w / 2, h - 4);
    }
  }

  /* ── D Flip-Flop ── */
  function drawDFlipFlop(w, h, comp) {
    var qVal = comp._q;
    ctx.fillStyle = qVal === 1 ? '#1b3a1b' : '#1a2535';
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    /* Pin labels */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 9px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', 4, 15);
    ctx.textAlign = 'right';
    ctx.fillText('Q', w - 4, 15);
    ctx.fillText('Q\u0305', w - 4, 45);
    /* Clock triangle */
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(8, 45);
    ctx.lineTo(0, 52);
    ctx.stroke();
    /* Title */
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.fillText('D', w / 2, h / 2 + 1);
  }

  /* ── JK Flip-Flop ── */
  function drawJKFlipFlop(w, h, comp) {
    var qVal = comp._q;
    ctx.fillStyle = qVal === 1 ? '#1b3a1b' : '#1a2535';
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 9px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('J', 4, 12);
    ctx.fillText('K', 4, 58);
    ctx.textAlign = 'right';
    ctx.fillText('Q', w - 4, 15);
    ctx.fillText('Q\u0305', w - 4, 55);
    /* Clock triangle */
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(8, 35);
    ctx.lineTo(0, 42);
    ctx.stroke();
    /* Title */
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.fillText('JK', w / 2, h / 2 + 1);
  }

  /* ── T Flip-Flop ── */
  function drawTFlipFlop(w, h, comp) {
    var qVal = comp._q;
    ctx.fillStyle = qVal === 1 ? '#1b3a1b' : '#1a2535';
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 9px ' + _fontFamily;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', 4, 15);
    ctx.textAlign = 'right';
    ctx.fillText('Q', w - 4, 15);
    ctx.fillText('Q\u0305', w - 4, 45);
    /* Clock triangle */
    ctx.strokeStyle = qVal === 1 ? '#4caf50' : '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(8, 45);
    ctx.lineTo(0, 52);
    ctx.stroke();
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.font = '700 10px ' + _fontFamily;
    ctx.fillText('T', w / 2, h / 2 + 1);
  }

  /* ── 7-Segment Display ── */
  function drawSevenSegment(w, h, comp) {
    ctx.fillStyle = '#0a0e14';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);

    var bcd = comp._inputs || [0, 0, 0, 0];
    var val = ((bcd[0] || 0) << 3) | ((bcd[1] || 0) << 2) | ((bcd[2] || 0) << 1) | (bcd[3] || 0);
    var segs = SEVEN_SEG_MAP[val & 0xF];

    var segOn = '#3ddc84';
    var segOff = '#1a2535';

    /* Segment dimensions */
    var cx = w / 2;
    var sy = 12;     /* top y */
    var my = h / 2;  /* middle y */
    var by = h - 12; /* bottom y */
    var sl = 14;     /* segment length */
    var sw = 3;      /* segment width */

    /* a: top horizontal */
    ctx.fillStyle = (segs & 0x40) ? segOn : segOff;
    ctx.fillRect(cx - sl / 2, sy - sw / 2, sl, sw);

    /* b: top-right vertical */
    ctx.fillStyle = (segs & 0x20) ? segOn : segOff;
    ctx.fillRect(cx + sl / 2 - sw / 2, sy + sw / 2, sw, my - sy - sw);

    /* c: bottom-right vertical */
    ctx.fillStyle = (segs & 0x10) ? segOn : segOff;
    ctx.fillRect(cx + sl / 2 - sw / 2, my + sw / 2, sw, by - my - sw);

    /* d: bottom horizontal */
    ctx.fillStyle = (segs & 0x08) ? segOn : segOff;
    ctx.fillRect(cx - sl / 2, by - sw / 2, sl, sw);

    /* e: bottom-left vertical */
    ctx.fillStyle = (segs & 0x04) ? segOn : segOff;
    ctx.fillRect(cx - sl / 2 - sw / 2, my + sw / 2, sw, by - my - sw);

    /* f: top-left vertical */
    ctx.fillStyle = (segs & 0x02) ? segOn : segOff;
    ctx.fillRect(cx - sl / 2 - sw / 2, sy + sw / 2, sw, my - sy - sw);

    /* g: middle horizontal */
    ctx.fillStyle = (segs & 0x01) ? segOn : segOff;
    ctx.fillRect(cx - sl / 2, my - sw / 2, sl, sw);

    /* Hex value label */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '600 8px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0x' + (val & 0xF).toString(16).toUpperCase(), w / 2, h - 4);
  }

  /* ── Probe ── */
  function drawProbe(w, h, comp) {
    var val = comp._inputs && comp._inputs[0] === 1 ? 1 : 0;
    ctx.fillStyle = val ? '#4caf50' : '#1a2535';
    ctx.strokeStyle = val ? '#69f0ae' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = val ? '#fff' : '#6b7a99';
    ctx.font = '700 11px ' + _fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val ? '1' : '0', w / 2, h / 2);
  }

  /* ================================================================
     SIMULATION ENGINE
     ================================================================ */

  function computeCircuit() {
    /* 1. Set source values */
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      if (comp.type === 'input-pin') {
        comp._outputs = [comp.values.state === 'HIGH' ? 1 : 0];
      } else if (comp.type === 'constant') {
        comp._outputs = [parseInt(comp.values.value) || 0];
      } else if (comp.type === 'clock-source') {
        comp._outputs = [comp._clockState || 0];
      }
    }

    /* 2. Topological sort */
    var order = topologicalSort();

    /* 3. Evaluate in order */
    for (var i = 0; i < order.length; i++) {
      evaluateGate(order[i]);
    }

    /* 4. Feedback stabilization — ONLY if sequential elements exist */
    var hasSequential = false;
    for (var sq = 0; sq < components.length; sq++) {
      var sqt = components[sq].type;
      if (sqt === 'sr-latch' || sqt === 'd-flipflop' || sqt === 'jk-flipflop' || sqt === 't-flipflop') {
        hasSequential = true;
        break;
      }
    }
    if (hasSequential) {
      var stable = false;
      var iter = 0;
      while (!stable && iter < 10) {
        stable = true;
        for (var j = 0; j < order.length; j++) {
          if (evaluateGate(order[j])) stable = false;
        }
        iter++;
      }
    }

    /* 5. Propagate logic levels to connections */
    for (var ci = 0; ci < connections.length; ci++) {
      var conn = connections[ci];
      var srcComp = findComp(conn.from.compId);
      if (srcComp && srcComp._outputs) {
        var _opi = getOutputPortIndex(srcComp, conn.from.portIdx);
        conn.logicLevel = srcComp._outputs[_opi] || 0;
      } else {
        conn.logicLevel = 0;
      }
    }

    /* 6. Update I/O panel and readouts */
    updateIOPanel();
    updateReadouts();
  }

  /* Silent version for truth table generation (no UI update) */
  function computeCircuitSilent() {
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      if (comp.type === 'input-pin') {
        comp._outputs = [comp.values.state === 'HIGH' ? 1 : 0];
      } else if (comp.type === 'constant') {
        comp._outputs = [parseInt(comp.values.value) || 0];
      } else if (comp.type === 'clock-source') {
        comp._outputs = [comp._clockState || 0];
      }
    }
    var order = topologicalSort();
    for (var i = 0; i < order.length; i++) evaluateGate(order[i]);
    var stable = false;
    var iter = 0;
    while (!stable && iter < 100) {
      stable = true;
      for (var j = 0; j < order.length; j++) {
        if (evaluateGate(order[j])) stable = false;
      }
      iter++;
    }
    for (var ci = 0; ci < connections.length; ci++) {
      var conn = connections[ci];
      var srcComp = findComp(conn.from.compId);
      if (srcComp && srcComp._outputs) {
        conn.logicLevel = srcComp._outputs[getOutputPortIndex(srcComp, conn.from.portIdx)] || 0;
      }
    }
  }

  function getOutputPortIndex(comp, portIdx) {
    /* Map the absolute port index to the output array index */
    var def = COMP_DEFS[comp.type];
    if (!def) return 0;
    var outIdx = 0;
    for (var p = 0; p < portIdx; p++) {
      if (isOutputPort(def, p)) outIdx++;
    }
    return outIdx;
  }

  function topologicalSort() {
    var inDeg = {};
    for (var c = 0; c < components.length; c++) inDeg[components[c].id] = 0;
    for (var ci = 0; ci < connections.length; ci++) {
      inDeg[connections[ci].to.compId] = (inDeg[connections[ci].to.compId] || 0) + 1;
    }
    var queue = [];
    for (var c2 = 0; c2 < components.length; c2++) {
      if (inDeg[components[c2].id] === 0) queue.push(components[c2]);
    }
    var order = [];
    while (queue.length > 0) {
      var cur = queue.shift();
      order.push(cur);
      for (var ci2 = 0; ci2 < connections.length; ci2++) {
        if (connections[ci2].from.compId === cur.id) {
          var targetId = connections[ci2].to.compId;
          inDeg[targetId]--;
          if (inDeg[targetId] === 0) {
            var target = findComp(targetId);
            if (target) queue.push(target);
          }
        }
      }
    }
    /* Add remaining (cycles) */
    for (var c3 = 0; c3 < components.length; c3++) {
      if (order.indexOf(components[c3]) === -1) order.push(components[c3]);
    }
    return order;
  }

  function evaluateGate(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return false;

    /* Sources already set */
    if (comp.type === 'input-pin' || comp.type === 'constant' || comp.type === 'clock-source') return false;

    /* Collect input values */
    var inputs = getInputValues(comp);
    comp._inputs = inputs;
    var prevOut = comp._outputs ? comp._outputs.slice() : [];

    switch (comp.type) {
      case 'and-gate':
        comp._outputs = [inputs.length > 0 && inputs.every(function (v) { return v === 1; }) ? 1 : 0];
        break;
      case 'or-gate':
        comp._outputs = [inputs.some(function (v) { return v === 1; }) ? 1 : 0];
        break;
      case 'not-gate':
        comp._outputs = [inputs[0] === 1 ? 0 : 1];
        break;
      case 'buffer':
        comp._outputs = [inputs[0] || 0];
        break;
      case 'nand-gate':
        comp._outputs = [inputs.length > 0 && inputs.every(function (v) { return v === 1; }) ? 0 : 1];
        break;
      case 'nor-gate':
        comp._outputs = [inputs.some(function (v) { return v === 1; }) ? 0 : 1];
        break;
      case 'xor-gate': {
        var xr = 0;
        for (var xi = 0; xi < inputs.length; xi++) xr ^= (inputs[xi] || 0);
        comp._outputs = [xr];
        break;
      }
      case 'xnor-gate': {
        var xnr = 0;
        for (var xni = 0; xni < inputs.length; xni++) xnr ^= (inputs[xni] || 0);
        comp._outputs = [xnr ? 0 : 1];
        break;
      }
      case 'mux-2to1': {
        var mIn = getNamedInputs(comp);
        comp._outputs = [mIn.sel === 0 ? (mIn.a || 0) : (mIn.b || 0)];
        break;
      }
      case 'demux-1to2': {
        var dmIn = getNamedInputs(comp);
        comp._outputs = dmIn.sel === 0 ? [dmIn.d || 0, 0] : [0, dmIn.d || 0];
        break;
      }
      case 'decoder-2to4': {
        var decIn = getNamedInputs(comp);
        var decVal = ((decIn.a1 || 0) << 1) | (decIn.a0 || 0);
        comp._outputs = [0, 0, 0, 0];
        comp._outputs[decVal] = 1;
        break;
      }
      case 'encoder-4to2': {
        var encIn = getNamedInputs(comp);
        var encOut = [0, 0];
        for (var ei = 3; ei >= 0; ei--) {
          if (encIn['i' + ei]) {
            encOut = [ei & 1, (ei >> 1) & 1];  /* Y0=LSB, Y1=MSB */
            break;
          }
        }
        comp._outputs = encOut;
        break;
      }
      case 'sr-latch': {
        var srIn = getNamedInputs(comp);
        if (srIn.s && !srIn.r) { comp._q = 1; }
        else if (!srIn.s && srIn.r) { comp._q = 0; }
        else if (srIn.s && srIn.r) { comp._q = -1; }
        /* else: hold */
        if (typeof comp._q === 'undefined') comp._q = 0;
        comp._outputs = [comp._q === 1 ? 1 : 0, comp._q === 1 ? 0 : 1];
        break;
      }
      case 'd-flipflop': {
        var dfIn = getNamedInputs(comp);
        if (dfIn.clk === 1 && comp._prevClk === 0) {
          comp._q = dfIn.d || 0;
        }
        comp._prevClk = dfIn.clk;
        if (typeof comp._q === 'undefined') comp._q = 0;
        comp._outputs = [comp._q || 0, comp._q ? 0 : 1];
        break;
      }
      case 'jk-flipflop': {
        var jkIn = getNamedInputs(comp);
        if (jkIn.clk === 1 && comp._prevClk === 0) {
          var jj = jkIn.j || 0, kk = jkIn.k || 0;
          if (jj && !kk) comp._q = 1;
          else if (!jj && kk) comp._q = 0;
          else if (jj && kk) comp._q = comp._q ? 0 : 1;
        }
        comp._prevClk = jkIn.clk;
        if (typeof comp._q === 'undefined') comp._q = 0;
        comp._outputs = [comp._q || 0, comp._q ? 0 : 1];
        break;
      }
      case 't-flipflop': {
        var tIn = getNamedInputs(comp);
        if (tIn.clk === 1 && comp._prevClk === 0) {
          if (tIn.t) comp._q = comp._q ? 0 : 1;
        }
        comp._prevClk = tIn.clk;
        if (typeof comp._q === 'undefined') comp._q = 0;
        comp._outputs = [comp._q || 0, comp._q ? 0 : 1];
        break;
      }
      case '7seg-display': {
        /* Inputs are consumed for display; no outputs */
        comp._outputs = [];
        break;
      }
      case 'output-pin':
      case 'probe':
        comp._outputs = [];
        comp._displayHigh = (inputs.length > 0 && inputs[0] === 1);
        break;
      default:
        break;
    }

    /* Check if output changed */
    if (!prevOut || prevOut.length !== (comp._outputs || []).length) return true;
    for (var oi = 0; oi < prevOut.length; oi++) {
      if (prevOut[oi] !== comp._outputs[oi]) return true;
    }
    return false;
  }

  function getInputValues(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return [];
    var inputs = [];
    for (var p = 0; p < def.ports.length; p++) {
      if (isOutputPort(def, p)) continue;
      var val = 0;
      for (var ci = 0; ci < connections.length; ci++) {
        if (connections[ci].to.compId === comp.id && connections[ci].to.portIdx === p) {
          var src = findComp(connections[ci].from.compId);
          if (src && src._outputs) {
            val = src._outputs[getOutputPortIndex(src, connections[ci].from.portIdx)] || 0;
          }
        }
      }
      inputs.push(val);
    }
    return inputs;
  }

  function getNamedInputs(comp) {
    var def = COMP_DEFS[comp.type];
    var result = {};
    for (var p = 0; p < def.ports.length; p++) {
      if (isOutputPort(def, p)) continue;
      var label = def.ports[p].label.toLowerCase();
      /* Normalize labels: Q̅ → qbar etc */
      label = label.replace('\u0305', 'bar');
      var val = 0;
      for (var ci = 0; ci < connections.length; ci++) {
        if (connections[ci].to.compId === comp.id && connections[ci].to.portIdx === p) {
          var src = findComp(connections[ci].from.compId);
          if (src && src._outputs) {
            val = src._outputs[getOutputPortIndex(src, connections[ci].from.portIdx)] || 0;
          }
        }
      }
      result[label] = val;
    }
    return result;
  }

  /* ================================================================
     CLOCK SYSTEM
     ================================================================ */

  function updateClock(dt) {
    for (var c = 0; c < components.length; c++) {
      if (components[c].type === 'clock-source') {
        var freq = components[c].values.freq || 2;
        if (!components[c]._clockAccum) components[c]._clockAccum = 0;
        components[c]._clockAccum += dt;
        var halfPeriod = 0.5 / freq;
        if (components[c]._clockAccum >= halfPeriod) {
          components[c]._clockAccum -= halfPeriod;
          components[c]._clockState = components[c]._clockState ? 0 : 1;
        }
        components[c]._outputs = [components[c]._clockState || 0];
      }
    }
  }

  /* ================================================================
     TRUTH TABLE GENERATION
     ================================================================ */

  /* Truth table cache — regenerate only on topology change, not every frame */
  var _ttCache = null;
  var _ttDirty = true;

  function markTruthTableDirty() { _ttDirty = true; }

  function generateTruthTable() {
    /* Return cached table if topology hasn't changed */
    if (!_ttDirty && _ttCache) return _ttCache;

    var inputPins = components.filter(function (c) { return c.type === 'input-pin'; });
    var outputPins = components.filter(function (c) { return c.type === 'output-pin'; });

    if (inputPins.length === 0 || inputPins.length > 6 || outputPins.length === 0) {
      _ttCache = null; _ttDirty = false; return null;
    }

    var n = inputPins.length;
    var rows = Math.pow(2, n);
    var table = { headers: [], rows: [], inputCount: n };

    /* FIX A: Snapshot ALL component state (not just input pins)
       This prevents truth table evaluation from corrupting flip-flop
       state (_q, _prevClk), clock state, and display flags. */
    var snapshot = [];
    for (var sc = 0; sc < components.length; sc++) {
      var c = components[sc];
      snapshot.push({
        _q: c._q, _prevClk: c._prevClk,
        _outputs: c._outputs ? c._outputs.slice() : [],
        _inputs: c._inputs ? c._inputs.slice() : [],
        _displayHigh: c._displayHigh,
        _clockState: c._clockState, _clockAccum: c._clockAccum,
        state: c.values ? c.values.state : undefined
      });
    }

    /* Headers */
    for (var i = 0; i < inputPins.length; i++) {
      table.headers.push(inputPins[i].values.label || ('IN' + i));
    }
    for (var o = 0; o < outputPins.length; o++) {
      table.headers.push(outputPins[o].values.label || ('OUT' + o));
    }

    /* Evaluate each combination */
    for (var r = 0; r < rows; r++) {
      /* Reset sequential state for each row to get pure combinational result */
      for (var rc = 0; rc < components.length; rc++) {
        components[rc]._q = 0;
        components[rc]._prevClk = 0;
      }
      for (var b = 0; b < n; b++) {
        inputPins[b].values.state = (r >> (n - 1 - b)) & 1 ? 'HIGH' : 'LOW';
        inputPins[b]._outputs = [(r >> (n - 1 - b)) & 1];
      }
      computeCircuitSilent();
      var row = [];
      for (var b2 = 0; b2 < n; b2++) row.push((r >> (n - 1 - b2)) & 1);
      for (var o2 = 0; o2 < outputPins.length; o2++) {
        row.push(outputPins[o2]._inputs ? outputPins[o2]._inputs[0] : 0);
      }
      table.rows.push(row);
    }

    /* Restore ALL component state from snapshot */
    for (var rs = 0; rs < components.length; rs++) {
      var snap = snapshot[rs];
      var comp = components[rs];
      comp._q = snap._q;
      comp._prevClk = snap._prevClk;
      comp._outputs = snap._outputs;
      comp._inputs = snap._inputs;
      comp._displayHigh = snap._displayHigh;
      comp._clockState = snap._clockState;
      comp._clockAccum = snap._clockAccum;
      if (snap.state !== undefined && comp.values) comp.values.state = snap.state;
    }

    _ttCache = table;
    _ttDirty = false;
    return table;
  }

  function renderTruthTable(table) {
    if (!truthTablePanel || !truthTableBody) return;
    if (!table) { truthTablePanel.style.display = 'none'; return; }
    truthTablePanel.style.display = '';
    var html = '<table class="tt-table"><thead><tr>';
    for (var h = 0; h < table.headers.length; h++) {
      html += '<th>' + table.headers[h] + '</th>';
    }
    html += '</tr></thead><tbody>';
    var outputStart = table.inputCount;
    for (var r = 0; r < table.rows.length; r++) {
      html += '<tr>';
      for (var c = 0; c < table.rows[r].length; c++) {
        var isOut = c >= outputStart;
        var cls = table.rows[r][c] ? 'tt-high' : 'tt-low';
        if (isOut) cls += ' tt-output';
        html += '<td class="' + cls + '">' + table.rows[r][c] + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    truthTableBody.innerHTML = html;
  }

  /* ================================================================
     BOOLEAN EXPRESSION GENERATION
     ================================================================ */

  function generateBooleanExpression() {
    var outputPins = components.filter(function (c) { return c.type === 'output-pin'; });
    if (outputPins.length === 0) return '';
    var exprs = [];
    for (var o = 0; o < outputPins.length; o++) {
      var label = outputPins[o].values.label || ('OUT' + o);
      var expr = traceExpression(outputPins[o], 0, 0);
      exprs.push(label + ' = ' + expr);
    }
    return exprs.join(';  ');
  }

  function traceExpression(comp, portIdx, depth) {
    if (depth > 20) return '...';
    /* Find what's connected to the given input port */
    var srcComp = null;
    var srcPortIdx = 0;
    for (var ci = 0; ci < connections.length; ci++) {
      if (connections[ci].to.compId === comp.id && connections[ci].to.portIdx === portIdx) {
        srcComp = findComp(connections[ci].from.compId);
        srcPortIdx = connections[ci].from.portIdx;
        break;
      }
    }
    if (!srcComp) return '?';

    switch (srcComp.type) {
      case 'input-pin': return srcComp.values.label || 'IN';
      case 'constant': return srcComp.values.value || '0';
      case 'clock-source': return 'CLK';
      case 'and-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' \u00B7 ') + ')';
      case 'or-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' + ') + ')';
      case 'not-gate': return traceExpression(srcComp, 0, depth + 1) + "'";
      case 'nand-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' \u00B7 ') + ")'";
      case 'nor-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' + ') + ")'";
      case 'xor-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' \u2295 ') + ')';
      case 'xnor-gate': return '(' + getSourceExpressions(srcComp, depth + 1).join(' \u2295 ') + ")'";
      case 'buffer': return traceExpression(srcComp, 0, depth + 1);
      default: return srcComp.type;
    }
  }

  function getSourceExpressions(comp, depth) {
    var def = COMP_DEFS[comp.type];
    var exprs = [];
    for (var p = 0; p < def.ports.length; p++) {
      if (isOutputPort(def, p)) continue;
      exprs.push(traceExpression(comp, p, depth));
    }
    return exprs;
  }

  /* ================================================================
     READOUTS UPDATE
     ================================================================ */

  function updateReadouts() {
    var rGates = document.getElementById('r-gates');
    var rInputs = document.getElementById('r-inputs');
    var rOutputs = document.getElementById('r-outputs');
    var rConns = document.getElementById('r-connections');
    if (!rGates) return;

    var gateCount = 0, inputCount = 0, outputCount = 0;
    for (var c = 0; c < components.length; c++) {
      var cat = COMP_DEFS[components[c].type] ? COMP_DEFS[components[c].type].cat : '';
      if (cat === 'gates' || cat === 'combo' || cat === 'seq') gateCount++;
      if (components[c].type === 'input-pin' || components[c].type === 'constant' || components[c].type === 'clock-source') inputCount++;
      if (components[c].type === 'output-pin') outputCount++;
    }
    rGates.textContent = gateCount;
    rInputs.textContent = inputCount;
    rOutputs.textContent = outputCount;
    rConns.textContent = connections.length;

    /* Truth table: generate for cache, but hide HTML panels when running
       (truth table is now rendered inside the canvas sidebar) */
    var table = generateTruthTable();
    if (running) {
      /* Hide HTML panels — canvas sidebar shows the truth table */
      if (truthTablePanel) truthTablePanel.style.display = 'none';
      if (boolExprPanel) boolExprPanel.style.display = 'none';
    } else {
      renderTruthTable(table);
      var expr = generateBooleanExpression();
      if (boolExprPanel && boolExprValue) {
        if (expr) {
          boolExprPanel.style.display = '';
          boolExprValue.textContent = expr;
        } else {
          boolExprPanel.style.display = 'none';
        }
      }
    }
  }

  /* ================================================================
     I/O PANEL UPDATE
     ================================================================ */

  var _ioPanelBuilt = false;
  var _ioPanelInputCount = 0;
  var _ioPanelOutputCount = 0;

  function updateIOPanel() {
    if (!ioPanel || !ioInputs || !ioOutputs) return;

    var inputPins = components.filter(function (c) { return c.type === 'input-pin'; });
    var outputPins = components.filter(function (c) { return c.type === 'output-pin'; });

    if (inputPins.length === 0 && outputPins.length === 0) {
      ioPanel.style.display = 'none';
      _ioPanelBuilt = false;
      return;
    }
    ioPanel.style.display = '';

    /* Only rebuild HTML when component count changes (not every frame) */
    var needRebuild = !_ioPanelBuilt ||
      inputPins.length !== _ioPanelInputCount ||
      outputPins.length !== _ioPanelOutputCount;

    if (needRebuild) {
      _ioPanelInputCount = inputPins.length;
      _ioPanelOutputCount = outputPins.length;
      _ioPanelBuilt = true;

      /* Build inputs — compact inline grid */
      var iHtml = '<div class="io-section-title">INPUTS</div><div class="io-items">';
      for (var i = 0; i < inputPins.length; i++) {
        var ip = inputPins[i];
        var isHigh = ip.values.state === 'HIGH';
        var lbl = ip.values.label || ('IN' + i);
        iHtml += '<div class="io-item">';
        iHtml += '<button class="io-toggle ' + (isHigh ? 'on' : '') + '" data-comp-id="' + ip.id + '">' + (isHigh ? '1' : '0') + '</button>';
        iHtml += '<span class="io-item-label">' + lbl + '</span>';
        iHtml += '</div>';
      }
      iHtml += '</div>';
      ioInputs.innerHTML = iHtml;

      /* Build outputs — compact inline grid */
      var oHtml = '<div class="io-section-title">OUTPUTS</div><div class="io-items">';
      for (var o = 0; o < outputPins.length; o++) {
        var op = outputPins[o];
        var oVal = op._inputs && op._inputs[0] === 1;
        var oLbl = op.values.label || ('OUT' + o);
        oHtml += '<div class="io-item">';
        oHtml += '<span class="io-led ' + (oVal ? 'on' : '') + '"></span>';
        oHtml += '<span class="io-item-addr">' + oLbl + '</span>';
        oHtml += '<span class="io-item-label io-val">' + (oVal ? '1' : '0') + '</span>';
        oHtml += '</div>';
      }
      oHtml += '</div>';
      ioOutputs.innerHTML = oHtml;

      /* Attach toggle handlers once — use event delegation on parent */
      ioInputs.onclick = function (e) {
        var btn = e.target.closest('.io-toggle');
        if (!btn) return;
        var compId = parseInt(btn.dataset.compId);
        var comp = findComp(compId);
        if (!comp) return;
        comp.values.state = comp.values.state === 'HIGH' ? 'LOW' : 'HIGH';
        comp._outputs = [comp.values.state === 'HIGH' ? 1 : 0];
        markTruthTableDirty();
        computeCircuit();
        draw();
      };
    } else {
      /* Fast update: just toggle classes and text (no innerHTML rebuild) */
      var toggleBtns = ioInputs.querySelectorAll('.io-toggle');
      for (var ti = 0; ti < toggleBtns.length && ti < inputPins.length; ti++) {
        var isH = inputPins[ti].values.state === 'HIGH';
        toggleBtns[ti].classList.toggle('on', isH);
        toggleBtns[ti].textContent = isH ? '1' : '0';
      }
      var leds = ioOutputs.querySelectorAll('.io-led');
      var vals = ioOutputs.querySelectorAll('.io-val');
      for (var li = 0; li < leds.length && li < outputPins.length; li++) {
        var oV = outputPins[li]._inputs && outputPins[li]._inputs[0] === 1;
        leds[li].classList.toggle('on', oV);
        if (vals[li]) vals[li].textContent = oV ? '1' : '0';
      }
    }
  }

  /* Force rebuild on next call (e.g. after loading a preset) */
  function invalidateIOPanel() {
    _ioPanelBuilt = false;
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(ts) {
    if (!running) return;
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    simTime += dt;

    /* Update clocks */
    updateClock(dt);

    /* Re-evaluate circuit */
    computeCircuit();

    /* Update particles */
    for (var p = 0; p < particles.length; p++) {
      var part = particles[p];
      var conn = connections[part.connIdx];
      if (!conn || conn.logicLevel !== 1) continue;
      part.t += part.speed * dt;
      if (part.t > 1) part.t -= 1;
      if (part.t < 0) part.t += 1;
      var path = _pathCache[part.connIdx];
      if (path) {
        var len = polylineLength(path);
        var pos = interpolatePolyline(path, part.t * len);
        part.x = pos.x;
        part.y = pos.y;
      }
    }

    /* Timing diagram capture */
    sampleTiming();
    drawTiming();

    draw();
    animFrame = requestAnimationFrame(animate);
  }

  function startSimulation() {
    if (running) return;
    running = true;
    btnRun.style.display = 'none';
    btnStop.style.display = '';
    simReadouts.style.display = '';

    /* Timing diagram: fresh trace for this run */
    rebuildTraces();
    updateTimingVisibility();

    /* Create particles */
    particles = [];
    for (var i = 0; i < connections.length; i++) {
      for (var j = 0; j < 4; j++) {
        particles.push({ connIdx: i, t: j / 4, x: 0, y: 0, speed: 0.3 + Math.random() * 0.2 });
      }
    }

    computeCircuit();
    lastTime = performance.now();
    animFrame = requestAnimationFrame(animate);
  }

  function stopSimulation() {
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    btnRun.style.display = '';
    btnStop.style.display = 'none';
    simReadouts.style.display = 'none';
    particles = [];
    /* Reset */
    for (var c = 0; c < components.length; c++) {
      components[c]._clockState = 0;
      components[c]._clockAccum = 0;
      components[c]._prevClk = 0;
    }
    for (var i = 0; i < connections.length; i++) {
      connections[i].logicLevel = 0;
    }
    _ttSidebarRect = null;
    markTruthTableDirty();
    updateReadouts(); /* Restore HTML truth table panels */
    draw();
  }

  /* ================================================================
     HIT TESTING
     ================================================================ */

  function hitTestPort(mx, my) {
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      var def = COMP_DEFS[comp.type];
      if (!def) continue;
      for (var p = 0; p < def.ports.length; p++) {
        var port = getRotatedPort(def, p, comp.orient);
        var px = comp.x + port.x;
        var py = comp.y + port.y;
        var d = Math.sqrt((mx - px) * (mx - px) + (my - py) * (my - py));
        if (d <= 8) return { compId: comp.id, portIdx: p };
      }
    }
    return null;
  }

  function hitTestComponent(mx, my) {
    for (var c = components.length - 1; c >= 0; c--) {
      var comp = components[c];
      var ed = getEffectiveDims(comp);
      if (mx >= comp.x - 4 && mx <= comp.x + ed.w + 4 &&
          my >= comp.y - 4 && my <= comp.y + ed.h + 4) {
        return comp;
      }
    }
    return null;
  }

  function hitTestConnection(mx, my) {
    for (var i = 0; i < _pathCache.length; i++) {
      var path = _pathCache[i];
      if (!path || path.length < 2) continue;
      for (var s = 1; s < path.length; s++) {
        var d = pointToSegmentDist(mx, my, path[s - 1].x, path[s - 1].y, path[s].x, path[s].y);
        if (d < 6) return i;
      }
    }
    return -1;
  }

  /* ================================================================
     EVENT HANDLERS
     ================================================================ */

  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    var pos = getCanvasPos(e);
    var mx = pos.x, my = pos.y;

    /* ── Pre-check: does this touch hit anything interactive?
       If yes, preventDefault() to block page scroll for this gesture.
       If no, let the browser scroll the page normally (touch-action: pan-y). ── */
    var hitsPort = hitTestPort(mx, my);
    var hitsComp = hitTestComponent(mx, my);
    var hitsConn = hitTestConnection(mx, my);
    var hitsAnything = hitsPort || hitsComp || (hitsConn >= 0) || connectingFrom;

    if (hitsAnything) {
      e.preventDefault(); /* block scroll — user is interacting with circuit */
    }
    /* If nothing hit: don't preventDefault → browser handles vertical scroll */

    /* Port click */
    if (hitsPort) {
      var port = hitsPort;
      if (connectingFrom) {
        /* Complete connection */
        if (connectingFrom.compId !== port.compId) {
          saveUndoState();
          var newConn = {
            from: { compId: connectingFrom.compId, portIdx: connectingFrom.portIdx },
            to: { compId: port.compId, portIdx: port.portIdx },
            logicLevel: 0
          };
          if (connectingFrom._waypoints && connectingFrom._waypoints.length > 0) {
            newConn.waypoints = connectingFrom._waypoints.slice();
          }
          connections.push(newConn);
          if (running) computeCircuit();
          else updateReadouts();
        }
        connectingFrom = null;
      } else {
        connectingFrom = { compId: port.compId, portIdx: port.portIdx };
      }
      draw();
      return;
    }

    /* Add waypoint when clicking empty space during connection */
    if (connectingFrom) {
      e.preventDefault(); /* already connecting — block scroll */
      if (!connectingFrom._waypoints) connectingFrom._waypoints = [];
      var prevPt;
      if (connectingFrom._waypoints.length > 0) {
        prevPt = connectingFrom._waypoints[connectingFrom._waypoints.length - 1];
      } else {
        var fromC = findComp(connectingFrom.compId);
        if (fromC) {
          var fromDef = COMP_DEFS[fromC.type];
          var fromP = getRotatedPort(fromDef, connectingFrom.portIdx, fromC.orient);
          var portPos = { x: fromC.x + fromP.x, y: fromC.y + fromP.y };
          prevPt = applyStub(portPos, fromP.dir, 20);
        } else {
          prevPt = getPortWorldPos(connectingFrom);
        }
      }
      var adx = Math.abs(mx - prevPt.x);
      var ady = Math.abs(my - prevPt.y);
      var snapped;
      if (adx <= ady) snapped = { x: prevPt.x, y: my };
      else snapped = { x: mx, y: prevPt.y };
      if (Math.abs(snapped.x - prevPt.x) > 2 || Math.abs(snapped.y - prevPt.y) > 2) {
        connectingFrom._waypoints.push(snapped);
      }
      draw();
      return;
    }

    /* Truth table row click */
    if (running && handleTTClick(mx, my)) return;

    /* Input pin toggle during simulation */
    if (running) {
      var comp = hitTestComponent(mx, my);
      if (comp && comp.type === 'input-pin') {
        comp.values.state = comp.values.state === 'HIGH' ? 'LOW' : 'HIGH';
        comp._outputs = [comp.values.state === 'HIGH' ? 1 : 0];
        markTruthTableDirty();
        computeCircuit();
        draw();
        return;
      }
    }

    /* Component drag */
    var comp2 = hitTestComponent(mx, my);
    if (comp2) {
      saveUndoState();
      selectedComp = comp2;
      selectedConn = -1;
      draggingComp = comp2;
      dragOffX = mx - comp2.x;
      dragOffY = my - comp2.y;
      dragStartX = mx;
      dragStartY = my;
      dragMoved = false;
      updateProperties();
      draw();
      return;
    }

    /* Connection selection */
    var ci = hitTestConnection(mx, my);
    if (ci >= 0) {
      selectedConn = ci;
      selectedComp = null;
      updateProperties();
      draw();
      return;
    }

    /* Deselect */
    selectedComp = null;
    selectedConn = -1;
    updateProperties();
    draw();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (mode !== 'simulate') return;
    var pos = getCanvasPos(e);
    var mx = pos.x, my = pos.y;

    if (draggingComp) {
      e.preventDefault(); /* block scroll while dragging component */
      var nx = Math.round((mx - dragOffX) / 20) * 20;
      var ny = Math.round((my - dragOffY) / 20) * 20;
      draggingComp.x = Math.max(0, Math.min(W - 40, nx));
      draggingComp.y = Math.max(0, Math.min(H - 40, ny));
      dragMoved = true;
      draw();
      return;
    }

    if (connectingFrom) {
      e.preventDefault(); /* block scroll while connecting */
      connectingFrom._lastMouse = { x: mx, y: my };
      draw();
      return;
    }

    /* Truth table hover */
    var oldTTRow = _ttHoverRow;
    handleTTHover(mx, my);

    /* Hover detection */
    var oldPort = hoveredPort;
    var oldComp = hoveredCompId;
    var oldConn = hoveredConn;
    hoveredPort = hitTestPort(mx, my);
    var hComp = hitTestComponent(mx, my);
    hoveredCompId = hComp ? hComp.id : null;
    hoveredConn = hitTestConnection(mx, my);

    if (draggingComp) canvas.style.cursor = 'grabbing';
    else if (running && _ttHoverRow >= 0) canvas.style.cursor = 'pointer';
    else if (hoveredPort) canvas.style.cursor = 'crosshair';
    else if (hoveredCompId) {
      /* While the simulation runs, input pins are click-to-toggle — show pointer, not grab */
      canvas.style.cursor = (running && hComp && hComp.type === 'input-pin') ? 'pointer' : 'grab';
    }
    else if (hoveredConn >= 0) canvas.style.cursor = 'pointer';
    else canvas.style.cursor = 'default';

    var changed = (hoveredPort !== oldPort) || (hoveredCompId !== oldComp) || (hoveredConn !== oldConn) || (_ttHoverRow !== oldTTRow);
    if (changed) draw();
  });

  canvas.addEventListener('pointerup', function (e) {
    if (draggingComp) {
      draggingComp = null;
      if (!dragMoved && selectedComp && selectedComp.type === 'input-pin' && !running) {
        /* Toggle input pin on click (no drag) in build mode */
      }
      draw();
    }
  });

  canvas.addEventListener('pointerleave', function () {
    hoveredPort = null;
    hoveredCompId = null;
    hoveredConn = -1;
    draw();
  });

  /* Context menu */
  var ctxMenu = document.getElementById('ctx-menu');
  var ctxTarget = null;

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (mode !== 'simulate') return;
    var pos = getCanvasPos(e);
    var comp = hitTestComponent(pos.x, pos.y);
    if (!comp) { ctxMenu.style.display = 'none'; return; }
    ctxTarget = comp;
    selectedComp = comp;
    updateProperties();
    ctxMenu.style.display = '';
    /* Clamp to viewport edges */
    var mw = ctxMenu.offsetWidth || 180;
    var mh = ctxMenu.offsetHeight || 260;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    ctxMenu.style.left = Math.min(e.clientX, vw - mw - 8) + 'px';
    ctxMenu.style.top = Math.min(e.clientY, vh - mh - 8) + 'px';
    draw();
  });

  document.addEventListener('click', function () {
    ctxMenu.style.display = 'none';
  });

  document.getElementById('ctx-info').addEventListener('click', function () {
    if (!ctxTarget) return;
    var def = COMP_DEFS[ctxTarget.type];
    if (!def) return;
    var comp = ctxTarget;

    var html = '<div style="font-size:1rem;font-weight:700;color:#dde3f0;margin-bottom:6px;">' + def.name + '</div>';
    html += '<div style="font-size:0.78rem;color:#6b7a99;margin-bottom:8px;">Type: ' + comp.type + ' &middot; ID: ' + comp.id + '</div>';

    /* Port details with connection info */
    html += '<div style="font-size:0.82rem;margin-bottom:6px;font-weight:600;color:#8899bb;">Ports:</div>';
    for (var pi = 0; pi < def.ports.length; pi++) {
      var port = def.ports[pi];
      var isOut = port.dir === 'right';
      var connInfo = '';
      for (var ci = 0; ci < connections.length; ci++) {
        var cn = connections[ci];
        if (isOut && cn.from.compId === comp.id && cn.from.portIdx === pi) {
          var tgt = findComp(cn.to.compId);
          connInfo += ' \u2192 ' + (tgt ? COMP_DEFS[tgt.type].name + ' (ID ' + tgt.id + ')' : '?');
        }
        if (!isOut && cn.to.compId === comp.id && cn.to.portIdx === pi) {
          var src = findComp(cn.from.compId);
          connInfo += ' \u2190 ' + (src ? COMP_DEFS[src.type].name + ' (ID ' + src.id + ')' : '?');
        }
      }
      var portVal = '';
      if (isOut && comp._outputs) {
        var oi = 0; for (var pp = 0; pp < pi; pp++) { if (def.ports[pp].dir === 'right') oi++; }
        portVal = ' = <span style="color:' + (comp._outputs[oi] ? '#00e676' : '#ff5555') + ';font-weight:700;">' + (comp._outputs[oi] || 0) + '</span>';
      }
      if (!isOut && comp._inputs) {
        var ii = 0; for (var pp2 = 0; pp2 < pi; pp2++) { if (def.ports[pp2].dir !== 'right') ii++; }
        portVal = ' = <span style="color:' + (comp._inputs[ii] ? '#00e676' : '#ff5555') + ';font-weight:700;">' + (comp._inputs[ii] || 0) + '</span>';
      }
      html += '<div style="font-size:0.78rem;padding:2px 0;color:#99a8c0;">';
      html += '<span style="color:' + (isOut ? '#00e676' : '#42a5f5') + ';">' + (isOut ? 'OUT' : 'IN') + '</span> ';
      html += '<strong>' + port.label + '</strong>' + portVal;
      html += '<span style="color:#4a5578;">' + (connInfo || ' (unconnected)') + '</span>';
      html += '</div>';
    }

    /* State info for special components */
    if (comp.type === 'input-pin') {
      html += '<div style="margin-top:6px;padding:6px 8px;background:rgba(0,230,118,0.08);border-radius:4px;font-size:0.82rem;">';
      html += 'State: <strong style="color:' + (comp.values.state === 'HIGH' ? '#00e676' : '#ff5555') + ';">' + comp.values.state + '</strong>';
      if (comp.values.label) html += ' &middot; Label: ' + comp.values.label;
      html += '</div>';
    }
    if (comp._q !== undefined) {
      html += '<div style="margin-top:6px;padding:6px 8px;background:rgba(0,230,118,0.08);border-radius:4px;font-size:0.82rem;">';
      html += 'Q = <strong style="color:' + (comp._q === 1 ? '#00e676' : (comp._q === -1 ? '#ff9900' : '#ff5555')) + ';">' + (comp._q === -1 ? 'INVALID' : comp._q) + '</strong>';
      if (comp._prevClk !== undefined) html += ' &middot; Prev CLK: ' + comp._prevClk;
      html += '</div>';
    }
    if (comp.type === 'clock-source') {
      html += '<div style="margin-top:6px;padding:6px 8px;background:rgba(0,230,118,0.08);border-radius:4px;font-size:0.82rem;">';
      html += 'Freq: ' + (comp.values.freq || 2) + ' Hz &middot; Clock: <strong>' + (comp._clockState ? 'HIGH' : 'LOW') + '</strong>';
      html += '</div>';
    }

    /* Mini truth table for basic gates */
    var gateTypes = ['and-gate','or-gate','not-gate','nand-gate','nor-gate','xor-gate','xnor-gate'];
    if (gateTypes.indexOf(comp.type) >= 0) {
      html += '<div style="margin-top:8px;font-size:0.78rem;font-weight:600;color:#8899bb;">Truth Table:</div>';
      html += '<table style="font-size:0.72rem;font-family:monospace;margin-top:2px;border-collapse:collapse;">';
      if (comp.type === 'not-gate') {
        html += '<tr><th style="padding:1px 6px;color:#42a5f5;">A</th><th style="padding:1px 6px;color:#00e676;">Q</th></tr>';
        html += '<tr><td style="padding:1px 6px;">0</td><td style="padding:1px 6px;color:#00e676;">1</td></tr>';
        html += '<tr><td style="padding:1px 6px;">1</td><td style="padding:1px 6px;">0</td></tr>';
      } else {
        var gLabel = def.name;
        html += '<tr><th style="padding:1px 6px;color:#42a5f5;">A</th><th style="padding:1px 6px;color:#42a5f5;">B</th><th style="padding:1px 6px;color:#00e676;">Q</th></tr>';
        var ttRows = [[0,0],[0,1],[1,0],[1,1]];
        for (var tr = 0; tr < 4; tr++) {
          var a = ttRows[tr][0], b = ttRows[tr][1], q;
          if (comp.type === 'and-gate') q = a & b;
          else if (comp.type === 'or-gate') q = a | b;
          else if (comp.type === 'nand-gate') q = (a & b) ? 0 : 1;
          else if (comp.type === 'nor-gate') q = (a | b) ? 0 : 1;
          else if (comp.type === 'xor-gate') q = a ^ b;
          else if (comp.type === 'xnor-gate') q = (a ^ b) ? 0 : 1;
          else q = 0;
          html += '<tr><td style="padding:1px 6px;">' + a + '</td><td style="padding:1px 6px;">' + b + '</td>';
          html += '<td style="padding:1px 6px;color:' + (q ? '#00e676' : '#ff5555') + ';font-weight:700;">' + q + '</td></tr>';
        }
      }
      html += '</table>';
    }

    propsPanel.style.display = 'block';
    propsBody.innerHTML = html;
  });

  document.getElementById('ctx-duplicate').addEventListener('click', function () {
    if (!ctxTarget) return;
    saveUndoState();
    var orig = ctxTarget;
    var vals = {};
    for (var k in orig.values) vals[k] = orig.values[k];
    var newC = { id: nextId++, type: orig.type, x: orig.x + 40, y: orig.y + 40, orient: orig.orient, values: vals };
    components.push(newC);
    selectedComp = newC;
    updateProperties();
    draw();
  });

  document.getElementById('ctx-rotate').addEventListener('click', function () {
    if (!ctxTarget) return;
    saveUndoState();
    ctxTarget.orient = ctxTarget.orient ? 0 : 1;
    draw();
  });

  document.getElementById('ctx-delete').addEventListener('click', function () {
    if (!ctxTarget) return;
    saveUndoState();
    var cid = ctxTarget.id;
    components = components.filter(function (c) { return c.id !== cid; });
    connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
    selectedComp = null;
    updateProperties();
    draw();
  });

  document.getElementById('ctx-export-png').addEventListener('click', exportPNG);
  document.getElementById('ctx-export-csv').addEventListener('click', exportCSV);

  document.getElementById('ctx-reset').addEventListener('click', function () {
    if (running) stopSimulation();
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      if (comp.type === 'input-pin') comp.values.state = 'LOW';
      comp._q = 0;
      comp._prevClk = 0;
      comp._clockState = 0;
      comp._clockAccum = 0;
      comp._outputs = null;
      comp._inputs = null;
    }
    for (var i = 0; i < connections.length; i++) connections[i].logicLevel = 0;
    computeCircuit();
    draw();
  });

  /* Keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (mode !== 'simulate') return;

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); performRedo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); performUndo(); return; }
    if (e.key === 'Escape') {
      if (connectingFrom) { connectingFrom = null; draw(); return; }
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedComp) {
        saveUndoState();
        var cid = selectedComp.id;
        components = components.filter(function (c) { return c.id !== cid; });
        connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
        selectedComp = null;
        updateProperties();
        draw();
      } else if (selectedConn >= 0) {
        saveUndoState();
        connections.splice(selectedConn, 1);
        selectedConn = -1;
        draw();
      }
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (selectedComp) { saveUndoState(); selectedComp.orient = selectedComp.orient ? 0 : 1; draw(); }
      return;
    }
    if (e.key === 'd' || e.key === 'D') {
      if (selectedComp) {
        saveUndoState();
        var orig = selectedComp;
        var vals = {};
        for (var k in orig.values) vals[k] = orig.values[k];
        var newC = { id: nextId++, type: orig.type, x: orig.x + 40, y: orig.y + 40, orient: orig.orient, values: vals };
        components.push(newC);
        selectedComp = newC;
        updateProperties();
        draw();
      }
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (running) stopSimulation();
      else startSimulation();
    }
  });

  /* Toolbar buttons */
  btnRun.addEventListener('click', startSimulation);
  btnStop.addEventListener('click', stopSimulation);
  btnClear.addEventListener('click', function () {
    saveUndoState();
    components = [];
    connections = [];
    particles = [];
    selectedComp = null;
    selectedConn = -1;
    connectingFrom = null;
    if (running) stopSimulation();
    updateProperties();
    circuitDesc.style.display = 'none';
    ioPanel.style.display = 'none';
    truthTablePanel.style.display = 'none';
    boolExprPanel.style.display = 'none';
    draw();
  });
  btnDelete.addEventListener('click', function () {
    if (selectedComp) {
      saveUndoState();
      var cid = selectedComp.id;
      components = components.filter(function (c) { return c.id !== cid; });
      connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
      selectedComp = null;
      updateProperties();
      draw();
    } else if (selectedConn >= 0) {
      saveUndoState();
      connections.splice(selectedConn, 1);
      selectedConn = -1;
      draw();
    }
  });
  document.getElementById('btn-rotate').addEventListener('click', function () {
    if (selectedComp) { saveUndoState(); selectedComp.orient = selectedComp.orient ? 0 : 1; draw(); }
  });
  document.getElementById('btn-undo').addEventListener('click', performUndo);
  document.getElementById('btn-redo').addEventListener('click', performRedo);

  /* Pre-built circuit tabs */
  prebuiltTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var circuit = pill.dataset.circuit;
    if (!circuit) return;
    prebuiltTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
    pill.classList.add('active');
    buildCircuit(circuit);
  });

  /* ================================================================
     SMART PLACEMENT + COMPONENT ADDING
     ================================================================ */

  function findFreeSpot(w, h) {
    var startX = 120, startY = 60;
    for (var row = 0; row < 20; row++) {
      for (var col = 0; col < 15; col++) {
        var cx = startX + col * 80;
        var cy = startY + row * 60;
        if (cx + w > W - 20 || cy + h > H - 20) continue;
        var free = true;
        for (var i = 0; i < components.length; i++) {
          var ed = getEffectiveDims(components[i]);
          if (cx < components[i].x + ed.w + 20 && cx + w + 20 > components[i].x &&
              cy < components[i].y + ed.h + 20 && cy + h + 20 > components[i].y) {
            free = false;
            break;
          }
        }
        if (free) return { x: Math.round(cx / 20) * 20, y: Math.round(cy / 20) * 20 };
      }
    }
    return { x: 100, y: 100 };
  }

  function addComponent(type) {
    var def = COMP_DEFS[type];
    if (!def) return;
    saveUndoState();
    var vals = {};
    for (var k in def.params) vals[k] = def.params[k].def;
    var spot = findFreeSpot(def.w, def.h);
    var comp = { id: nextId++, type: type, x: spot.x, y: spot.y, orient: 0, values: vals };
    components.push(comp);
    selectedComp = comp;
    updateProperties();
    draw();
  }

  function addComp(type, x, y, vals) {
    var def = COMP_DEFS[type];
    if (!def) return null;
    var v = {};
    for (var k in def.params) v[k] = def.params[k].def;
    if (vals) { for (var kk in vals) v[kk] = vals[kk]; }
    var comp = { id: nextId++, type: type, x: x, y: y, orient: 0, values: v };
    components.push(comp);
    return comp.id;
  }

  function connect(fromId, fromPort, toId, toPort) {
    connections.push({
      from: { compId: fromId, portIdx: fromPort },
      to: { compId: toId, portIdx: toPort },
      logicLevel: 0
    });
  }

  /* ================================================================
     UNDO / REDO
     ================================================================ */

  var redoStack = [];

  function saveUndoState() {
    /* Include runtime state (_q, _prevClk, _clockState) so undo preserves
       flip-flop and clock state for sequential circuits */
    var comps = components.map(function (c) {
      var obj = { id: c.id, type: c.type, x: c.x, y: c.y, orient: c.orient, values: c.values };
      if (c._q !== undefined) obj._q = c._q;
      if (c._prevClk !== undefined) obj._prevClk = c._prevClk;
      if (c._clockState !== undefined) obj._clockState = c._clockState;
      if (c._clockAccum !== undefined) obj._clockAccum = c._clockAccum;
      return obj;
    });
    undoStack.push(JSON.stringify({ components: comps, connections: connections, nextId: nextId }));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify({ components: components, connections: connections, nextId: nextId }));
    var state = JSON.parse(undoStack.pop());
    components = state.components;
    connections = state.connections;
    nextId = state.nextId;
    selectedComp = null;
    selectedConn = -1;
    markTruthTableDirty();
    updateProperties();
    if (running) computeCircuit();
    updateReadouts();
    draw();
  }

  function performRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify({ components: components, connections: connections, nextId: nextId }));
    var state = JSON.parse(redoStack.pop());
    components = state.components;
    connections = state.connections;
    nextId = state.nextId;
    selectedComp = null;
    selectedConn = -1;
    markTruthTableDirty();
    updateProperties();
    if (running) computeCircuit();
    updateReadouts();
    draw();
  }

  /* ================================================================
     PROPERTIES PANEL
     ================================================================ */

  function updateProperties() {
    if (!propsPanel || !propsBody) return;
    if (!selectedComp) {
      propsPanel.style.display = 'none';
      return;
    }
    var comp = selectedComp;
    var def = COMP_DEFS[comp.type];
    if (!def) { propsPanel.style.display = 'none'; return; }

    propsPanel.style.display = 'block';
    var html = '<div style="font-weight:700;margin-bottom:8px;">' + def.name + ' (ID: ' + comp.id + ')</div>';

    var paramKeys = Object.keys(def.params);
    if (paramKeys.length === 0) {
      html += '<div style="color:#6b7a99;font-size:0.82rem;">No editable parameters</div>';
    }
    for (var pi = 0; pi < paramKeys.length; pi++) {
      var key = paramKeys[pi];
      var param = def.params[key];
      var val = comp.values[key];
      html += '<div class="prop-row" style="margin-top:6px;">';
      html += '<label style="font-size:0.82rem;color:#a0b0d0;">' + param.label + '</label>';
      if (param.type === 'select') {
        html += '<select class="prop-select" data-key="' + key + '">';
        for (var oi = 0; oi < param.options.length; oi++) {
          html += '<option' + (val === param.options[oi] ? ' selected' : '') + '>' + param.options[oi] + '</option>';
        }
        html += '</select>';
      } else if (param.type === 'text') {
        html += '<input class="prop-input" type="text" data-key="' + key + '" value="' + (val || '') + '">';
      } else {
        html += '<input class="prop-input" type="number" data-key="' + key + '" value="' + val + '" min="' + param.min + '" max="' + param.max + '" step="' + param.step + '">';
      }
      html += '</div>';
    }

    if (comp._outputs && comp._outputs.length > 0) {
      html += '<div style="margin-top:8px;font-size:0.82rem;color:#69f0ae;">Output: [' + comp._outputs.join(', ') + ']</div>';
    }

    propsBody.innerHTML = html;

    /* Attach change handlers */
    propsBody.querySelectorAll('.prop-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        comp.values[sel.dataset.key] = sel.value;
        if (sel.dataset.key === 'state') {
          comp._outputs = [sel.value === 'HIGH' ? 1 : 0];
        }
        if (running) computeCircuit();
        else updateReadouts();
        draw();
      });
    });
    propsBody.querySelectorAll('.prop-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        if (inp.type === 'number') comp.values[inp.dataset.key] = parseFloat(inp.value);
        else comp.values[inp.dataset.key] = inp.value;
        if (running) computeCircuit();
        else updateReadouts();
        draw();
      });
    });
  }

  /* ================================================================
     PALETTE — Click to place + Drag-and-drop + Collapsible categories
     ================================================================ */

  var palette = document.getElementById('palette');

  /* Collapsible categories */
  var catHeaders = palette.querySelectorAll('.palette-cat');
  catHeaders.forEach(function (h, i) {
    if (i > 0) h.classList.add('collapsed');
  });
  catHeaders.forEach(function (catHeader) {
    catHeader.addEventListener('click', function () {
      var wasCollapsed = catHeader.classList.contains('collapsed');
      catHeaders.forEach(function (h) { h.classList.add('collapsed'); });
      if (wasCollapsed) catHeader.classList.remove('collapsed');
    });
  });

  /* Click to place */
  palette.addEventListener('click', function (e) {
    var item = e.target.closest('.palette-item');
    if (!item) return;
    var type = item.dataset.type;
    if (!type) return;
    addComponent(type);
  });

  /* Drag and drop */
  palette.addEventListener('dragstart', function (e) {
    var item = e.target.closest('.palette-item');
    if (!item) return;
    e.dataTransfer.setData('text/plain', item.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  });

  canvas.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    var type = e.dataTransfer.getData('text/plain');
    var def = COMP_DEFS[type];
    if (!def) return;
    var pos = getCanvasPos(e);
    saveUndoState();
    var vals = {};
    for (var k in def.params) vals[k] = def.params[k].def;
    var x = Math.round((pos.x - def.w / 2) / 20) * 20;
    var y = Math.round((pos.y - def.h / 2) / 20) * 20;
    var comp = { id: nextId++, type: type, x: x, y: y, orient: 0, values: vals };
    components.push(comp);
    selectedComp = comp;
    updateProperties();
    draw();
  });

  /* Draw palette icons */
  function drawPaletteIcons() {
    var _dpr = window.devicePixelRatio || 1;
    palette.querySelectorAll('.palette-item').forEach(function (item) {
      var type = item.dataset.type;
      var def = COMP_DEFS[type];
      if (!def) return;
      var c = item.querySelector('canvas');
      if (!c) return;
      /* DPR backing store. These palette icons were fixed 36x36 bitmaps
         stretched by the browser on a retina display, so every component symbol
         rendered at 2x upscale. Size the backing to device pixels and scale the
         context, keeping the 36-unit logical space the drawing code uses. */
      var _need = Math.round(36 * _dpr);
      if (c.width !== _need) {
        c.width = _need; c.height = _need;
        c.style.width = '36px'; c.style.height = '36px';
      }
      var pCtx = c.getContext('2d');
      var s = 36;
      pCtx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
      pCtx.clearRect(0, 0, s, s);
      pCtx.fillStyle = '#0d1117';
      pCtx.fillRect(0, 0, s, s);
      pCtx.save();
      var scale = Math.min((s - 4) / def.w, (s - 4) / def.h) * 0.85;
      pCtx.translate(s / 2 - def.w * scale / 2, s / 2 - def.h * scale / 2);
      pCtx.scale(scale, scale);
      var origCtx = ctx;
      ctx = pCtx;
      drawSymbol({ type: type, values: { state: 'LOW', value: '1', freq: 2, label: '' }, _outputs: [], _inputs: [], _q: 0, _clockState: 0 }, def);
      ctx = origCtx;
      pCtx.restore();
    });
  }

  /* ================================================================
     PRESET CIRCUITS — 10 presets
     ================================================================ */

  function buildCircuit(name) {
    saveUndoState();
    components = [];
    connections = [];
    nextId = 1;
    particles = [];
    selectedComp = null;
    selectedConn = -1;
    markTruthTableDirty();
    invalidateIOPanel();
    if (running) stopSimulation();

    var desc = '';

    switch (name) {
      case 'and-or-not':
        desc = 'Basic gates demo: Two input pins connected to AND, OR, and NOT gates with output pins. Toggle inputs to see how each gate responds.';
        addComp('input-pin', 60, 60, { state: 'LOW', label: 'A' });       /* 1 */
        addComp('input-pin', 60, 160, { state: 'LOW', label: 'B' });      /* 2 */
        addComp('and-gate', 200, 40, {});                                   /* 3 */
        addComp('or-gate', 200, 140, {});                                   /* 4 */
        addComp('not-gate', 200, 240, {});                                  /* 5 */
        addComp('output-pin', 340, 55, { label: 'AND' });                  /* 6 */
        addComp('output-pin', 340, 155, { label: 'OR' });                  /* 7 */
        addComp('output-pin', 340, 250, { label: 'NOT' });                 /* 8 */
        connect(1, 0, 3, 0); /* A → AND.A */
        connect(2, 0, 3, 1); /* B → AND.B */
        connect(1, 0, 4, 0); /* A → OR.A */
        connect(2, 0, 4, 1); /* B → OR.B */
        connect(1, 0, 5, 0); /* A → NOT.A */
        connect(3, 2, 6, 0); /* AND.Q → out */
        connect(4, 2, 7, 0); /* OR.Q → out */
        connect(5, 1, 8, 0); /* NOT.Q → out */
        break;

      case 'half-adder':
        desc = 'Half Adder: XOR gate produces the Sum, AND gate produces the Carry. Toggle A and B inputs to verify the truth table.';
        addComp('input-pin', 60, 60, { state: 'LOW', label: 'A' });       /* 1 */
        addComp('input-pin', 60, 180, { state: 'LOW', label: 'B' });      /* 2 */
        addComp('xor-gate', 220, 40, {});                                   /* 3 */
        addComp('and-gate', 220, 160, {});                                  /* 4 */
        addComp('output-pin', 360, 55, { label: 'Sum' });                  /* 5 */
        addComp('output-pin', 360, 175, { label: 'Carry' });               /* 6 */
        connect(1, 0, 3, 0); /* A → XOR.A */
        connect(2, 0, 3, 1); /* B → XOR.B */
        connect(1, 0, 4, 0); /* A → AND.A */
        connect(2, 0, 4, 1); /* B → AND.B */
        connect(3, 2, 5, 0); /* XOR.Q → Sum */
        connect(4, 2, 6, 0); /* AND.Q → Carry */
        break;

      case 'full-adder':
        desc = 'Full Adder: Adds three bits (A, B, Cin) producing Sum and Carry-out. Built from two XOR gates, two AND gates, and one OR gate.';
        addComp('input-pin', 40, 40, { state: 'LOW', label: 'A' });       /* 1 */
        addComp('input-pin', 40, 140, { state: 'LOW', label: 'B' });      /* 2 */
        addComp('input-pin', 40, 260, { state: 'LOW', label: 'Cin' });    /* 3 */
        addComp('xor-gate', 160, 60, {});                                   /* 4: A XOR B */
        addComp('and-gate', 160, 160, {});                                  /* 5: A AND B */
        addComp('xor-gate', 320, 80, {});                                   /* 6: (A^B) XOR Cin */
        addComp('and-gate', 320, 200, {});                                  /* 7: (A^B) AND Cin */
        addComp('or-gate', 460, 160, {});                                   /* 8: carry OR */
        addComp('output-pin', 460, 95, { label: 'Sum' });                  /* 9 */
        addComp('output-pin', 560, 175, { label: 'Cout' });                /* 10 */
        connect(1, 0, 4, 0); /* A → XOR1.A */
        connect(2, 0, 4, 1); /* B → XOR1.B */
        connect(1, 0, 5, 0); /* A → AND1.A */
        connect(2, 0, 5, 1); /* B → AND1.B */
        connect(4, 2, 6, 0); /* XOR1.Q → XOR2.A */
        connect(3, 0, 6, 1); /* Cin → XOR2.B */
        connect(4, 2, 7, 0); /* XOR1.Q → AND2.A */
        connect(3, 0, 7, 1); /* Cin → AND2.B */
        connect(5, 2, 8, 0); /* AND1.Q → OR.A */
        connect(7, 2, 8, 1); /* AND2.Q → OR.B */
        connect(6, 2, 9, 0); /* XOR2.Q → Sum */
        connect(8, 2, 10, 0); /* OR.Q → Cout */
        break;

      case 'mux-from-gates':
        desc = 'MUX from gates: A 2:1 multiplexer built from AND, OR, and NOT gates. When Sel=0, output=A. When Sel=1, output=B.';
        addComp('input-pin', 40, 40, { state: 'HIGH', label: 'A' });      /* 1 */
        addComp('input-pin', 40, 140, { state: 'LOW', label: 'B' });      /* 2 */
        addComp('input-pin', 40, 280, { state: 'LOW', label: 'Sel' });    /* 3 */
        addComp('not-gate', 160, 260, {});                                  /* 4: NOT Sel */
        addComp('and-gate', 280, 20, {});                                   /* 5: A AND NOT_Sel */
        addComp('and-gate', 280, 140, {});                                  /* 6: B AND Sel */
        addComp('or-gate', 420, 80, {});                                    /* 7: OR */
        addComp('output-pin', 540, 95, { label: 'Y' });                    /* 8 */
        connect(3, 0, 4, 0); /* Sel → NOT */
        connect(1, 0, 5, 0); /* A → AND1.A */
        connect(4, 1, 5, 1); /* NOT.Q → AND1.B */
        connect(2, 0, 6, 0); /* B → AND2.A */
        connect(3, 0, 6, 1); /* Sel → AND2.B */
        connect(5, 2, 7, 0); /* AND1.Q → OR.A */
        connect(6, 2, 7, 1); /* AND2.Q → OR.B */
        connect(7, 2, 8, 0); /* OR.Q → Y */
        break;

      case 'sr-latch':
        desc = 'SR Latch built from cross-coupled NOR gates. Set (S=1) forces Q=1. Reset (R=1) forces Q=0. Both HIGH is the forbidden state.';
        addComp('input-pin', 60, 40, { state: 'LOW', label: 'S' });       /* 1 */
        addComp('input-pin', 60, 200, { state: 'LOW', label: 'R' });      /* 2 */
        addComp('sr-latch', 240, 80, {});                                   /* 3 */
        addComp('output-pin', 380, 80, { label: 'Q' });                   /* 4 */
        addComp('output-pin', 380, 140, { label: 'Qbar' });               /* 5 */
        connect(1, 0, 3, 0); /* S → SR.S */
        connect(2, 0, 3, 1); /* R → SR.R */
        connect(3, 2, 4, 0); /* SR.Q → Q out */
        connect(3, 3, 5, 0); /* SR.Qbar → Qbar out */
        break;

      case 'd-flip-flop':
        desc = 'D Flip-Flop: Data input is captured on the rising edge of the clock. Toggle D, then observe Q change when CLK rises.';
        addComp('input-pin', 60, 40, { state: 'LOW', label: 'D' });       /* 1 */
        addComp('clock-source', 60, 160, { freq: 1 });                    /* 2 */
        addComp('d-flipflop', 240, 60, {});                                /* 3 */
        addComp('output-pin', 380, 60, { label: 'Q' });                   /* 4 */
        addComp('output-pin', 380, 120, { label: 'Qbar' });               /* 5 */
        connect(1, 0, 3, 0); /* D → DFF.D */
        connect(2, 0, 3, 1); /* CLK → DFF.CLK */
        connect(3, 2, 4, 0); /* DFF.Q → Q out */
        connect(3, 3, 5, 0); /* DFF.Qbar → Qbar out */
        break;

      case '4bit-counter':
        desc = '4-bit ripple counter: Four T flip-flops in cascade. Each stage divides the clock by 2. Outputs show binary count 0000-1111.';
        addComp('constant', 40, 40, { value: '1' });                      /* 1: T=1 always */
        addComp('clock-source', 40, 140, { freq: 2 });                    /* 2 */
        addComp('t-flipflop', 160, 40, {});                                /* 3: bit 0 */
        addComp('t-flipflop', 280, 40, {});                                /* 4: bit 1 */
        addComp('t-flipflop', 400, 40, {});                                /* 5: bit 2 */
        addComp('t-flipflop', 520, 40, {});                                /* 6: bit 3 */
        addComp('output-pin', 160, 140, { label: 'Q0' });                 /* 7 */
        addComp('output-pin', 280, 140, { label: 'Q1' });                 /* 8 */
        addComp('output-pin', 400, 140, { label: 'Q2' });                 /* 9 */
        addComp('output-pin', 520, 140, { label: 'Q3' });                 /* 10 */
        connect(1, 0, 3, 0); /* T=1 → TFF0.T */
        connect(2, 0, 3, 1); /* CLK → TFF0.CLK */
        connect(3, 2, 7, 0); /* TFF0.Q → Q0 */
        connect(1, 0, 4, 0); /* T=1 → TFF1.T */
        connect(3, 2, 4, 1); /* TFF0.Q → TFF1.CLK */
        connect(4, 2, 8, 0); /* TFF1.Q → Q1 */
        connect(1, 0, 5, 0); /* T=1 → TFF2.T */
        connect(4, 2, 5, 1); /* TFF1.Q → TFF2.CLK */
        connect(5, 2, 9, 0); /* TFF2.Q → Q2 */
        connect(1, 0, 6, 0); /* T=1 → TFF3.T */
        connect(5, 2, 6, 1); /* TFF2.Q → TFF3.CLK */
        connect(6, 2, 10, 0); /* TFF3.Q → Q3 */
        break;

      case '7seg-decoder':
        desc = '7-Segment Decoder: Four BCD input switches drive a 7-segment display. Toggle inputs to display hexadecimal digits 0-F.';
        addComp('input-pin', 60, 40, { state: 'LOW', label: 'D3' });      /* 1 */
        addComp('input-pin', 60, 100, { state: 'LOW', label: 'D2' });     /* 2 */
        addComp('input-pin', 60, 160, { state: 'LOW', label: 'D1' });     /* 3 */
        addComp('input-pin', 60, 220, { state: 'LOW', label: 'D0' });     /* 4 */
        addComp('7seg-display', 240, 40, {});                               /* 5 */
        connect(1, 0, 5, 0); /* D3 → 7seg.A */
        connect(2, 0, 5, 1); /* D2 → 7seg.B */
        connect(3, 0, 5, 2); /* D1 → 7seg.C */
        connect(4, 0, 5, 3); /* D0 → 7seg.D */
        break;

      case 'alarm-system':
        desc = 'Alarm system: Three sensor inputs (Door, Window, Motion) connected through OR and AND logic. Alarm sounds when at least one sensor triggers AND the system is armed.';
        addComp('input-pin', 40, 40, { state: 'LOW', label: 'Door' });    /* 1 */
        addComp('input-pin', 40, 120, { state: 'LOW', label: 'Window' }); /* 2 */
        addComp('input-pin', 40, 200, { state: 'LOW', label: 'Motion' }); /* 3 */
        addComp('input-pin', 40, 320, { state: 'HIGH', label: 'Armed' }); /* 4 */
        addComp('or-gate', 200, 40, {});                                    /* 5: Door OR Window */
        addComp('or-gate', 200, 160, {});                                   /* 6: (D|W) OR Motion */
        addComp('and-gate', 380, 160, {});                                  /* 7: sensor OR Armed */
        addComp('output-pin', 500, 175, { label: 'Alarm' });              /* 8 */
        connect(1, 0, 5, 0); /* Door → OR1.A */
        connect(2, 0, 5, 1); /* Window → OR1.B */
        connect(5, 2, 6, 0); /* OR1 → OR2.A */
        connect(3, 0, 6, 1); /* Motion → OR2.B */
        connect(6, 2, 7, 0); /* OR2 → AND.A */
        connect(4, 0, 7, 1); /* Armed → AND.B */
        connect(7, 2, 8, 0); /* AND → Alarm */
        break;

      case 'traffic-light':
        desc = 'Traffic Light Controller: Clock drives a 2-bit counter. Decoder activates one of three outputs (Red, Yellow, Green) in sequence.';
        addComp('constant', 40, 40, { value: '1' });                      /* 1: T=1 */
        addComp('clock-source', 40, 140, { freq: 1 });                    /* 2 */
        addComp('t-flipflop', 160, 40, {});                                /* 3: bit 0 */
        addComp('t-flipflop', 280, 40, {});                                /* 4: bit 1 */
        addComp('decoder-2to4', 420, 40, {});                               /* 5 */
        addComp('output-pin', 560, 40, { label: 'Red' });                 /* 6 */
        addComp('output-pin', 560, 100, { label: 'Yellow' });             /* 7 */
        addComp('output-pin', 560, 160, { label: 'Green' });              /* 8 */
        connect(1, 0, 3, 0); /* T=1 → TFF0.T */
        connect(2, 0, 3, 1); /* CLK → TFF0.CLK */
        connect(1, 0, 4, 0); /* T=1 → TFF1.T */
        connect(3, 2, 4, 1); /* TFF0.Q → TFF1.CLK */
        connect(3, 2, 5, 0); /* TFF0.Q → DEC.A0 */
        connect(4, 2, 5, 1); /* TFF1.Q → DEC.A1 */
        connect(5, 2, 6, 0); /* DEC.Y0 → Red */
        connect(5, 3, 7, 0); /* DEC.Y1 → Yellow */
        connect(5, 4, 8, 0); /* DEC.Y2 → Green */
        break;
    }

    circuitDesc.textContent = desc;
    circuitDesc.style.display = desc ? '' : 'none';
    computeCircuit();
    draw();
  }

  /* ================================================================
     EXPORT FUNCTIONS
     ================================================================ */

  function exportPNG() {
    /* Draw watermark */
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '10px ' + _fontFamily;
    ctx.textAlign = 'right';
    ctx.fillText('NHIT VisualLab', W - 8, H - 8);
    ctx.restore();

    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'logic-circuit.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function exportCSV() {
    var table = generateTruthTable();
    if (!table) { alert('Add input and output pins to generate a truth table.'); return; }
    var csv = table.headers.join(',') + '\n';
    for (var r = 0; r < table.rows.length; r++) {
      csv += table.rows[r].join(',') + '\n';
    }
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'truth-table.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function switchMode(m) {
    mode = m;
    simPanel.style.display = m === 'simulate' ? '' : 'none';
    catRow.style.display = m === 'explore' ? '' : 'none';
    itemSelector.style.display = m === 'explore' ? '' : 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = m === 'practice' ? '' : 'none';
    practiceBar.style.display = m === 'practice' ? '' : 'none';
    quizPanel.style.display = m === 'quiz' ? '' : 'none';
    quizBar.style.display = m === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    if (m === 'simulate') draw();
    if (m === 'explore') renderConceptGrid();
    if (m === 'practice') generateProblem();
    if (m === 'quiz') startQuiz();
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    switchMode(pill.dataset.mode);
  });

  /* ================================================================
     EXPLORE UI
     ================================================================ */

  function renderConceptGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      if (c.cat !== exploreCat) return;
      var card = document.createElement('div');
      card.className = 'is-card' + (selectedConcept === c ? ' active' : '');
      card.innerHTML = '<div class="is-card-name">' + c.name + '</div><div class="is-card-symbol">' + c.formula + '</div>';
      card.addEventListener('click', function () {
        selectedConcept = c;
        renderConceptGrid();
        renderConceptInfo(c);
      });
      conceptGrid.appendChild(card);
    });
  }

  function renderConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<h3>' + c.name + ' (' + c.symbol + ')</h3>';
    html += '<div class="formula-box">' + c.formula + (c.unit !== '\u2014' ? ' [' + c.unit + ']' : '') + '</div>';
    html += '<p>' + c.desc + '</p>';

    /* Worked example */
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4><p><strong>' + c.example.problem + '</strong></p>';
      c.example.steps.forEach(function (s) { html += '<div class="step">' + s + '</div>'; });
      if (c.example.answer !== undefined) html += '<p><strong>Answer: ' + c.example.answer + ' ' + (c.example.unit || '') + '</strong></p>';
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  catTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCat = pill.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === exploreCat); });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  /* ================================================================
     PRACTICE UI
     ================================================================ */

  function generateProblem() {
    var gen = PRACTICE[Math.floor(Math.random() * PRACTICE.length)];
    currentProblem = gen();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) return;
    practiceAnswered = true;
    practiceTotal++;
    var diff = Math.abs(userVal - currentProblem.answer);
    var correct = diff <= (currentProblem.tol || 0);
    if (correct) {
      practiceCorrect++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback correct';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + (currentProblem.unit || '');
      ppFeedback.className = 'feedback wrong';
    }
    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    ppSolution.style.display = '';
    ppSolution.innerHTML = '<strong>Solution:</strong><br>' + currentProblem.steps.join('<br>');
  });

  ppNext.addEventListener('click', generateProblem);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ppCheck.click(); });

  /* ================================================================
     QUIZ UI
     ================================================================ */

  function startQuiz() {
    var shuffled = QUIZ_POOL.slice().sort(function () { return Math.random() - 0.5; });
    quizSet = shuffled.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizSet.length) { showQuizResults(); return; }
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="q-prompt"><strong>Q' + (quizIdx + 1) + '.</strong> ' + q.q + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="q-options">';
      q.opts.forEach(function (opt, oi) {
        html += '<div class="q-opt" data-idx="' + oi + '">' + opt + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="q-num-input"><input type="number" step="any" id="quiz-num-input" placeholder="Your answer"> <span>' + (q.unit || '') + '</span> <button class="btn btn-primary" id="quiz-num-check">Check</button></div>';
    }
    quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.q-opt').forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var idx = parseInt(opt.dataset.idx);
          var correct = idx === q.ans;
          if (correct) { quizScore++; opt.classList.add('correct'); }
          else {
            opt.classList.add('wrong');
            quizPanel.querySelectorAll('.q-opt')[q.ans].classList.add('correct');
          }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
        });
      });
    } else {
      var checkBtn = document.getElementById('quiz-num-check');
      var numInput = document.getElementById('quiz-num-input');
      if (checkBtn) {
        checkBtn.addEventListener('click', function () {
          if (quizAnswered) return;
          var val = parseFloat(numInput.value);
          if (isNaN(val)) return;
          quizAnswered = true;
          var correct = Math.abs(val - q.ans) <= (q.tol || 0);
          if (correct) {
            quizScore++;
            numInput.style.borderColor = '#4caf50';
          } else {
            numInput.style.borderColor = '#ff4444';
            numInput.value = q.ans;
          }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
        });
      }
      if (numInput) numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && checkBtn) checkBtn.click(); });
    }
  }

  function showQuizResults() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';
    var pct = Math.round((quizScore / QUIZ_SIZE) * 100);
    var grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practicing!';
    var html = '<h3>Quiz Complete! ' + grade + '</h3>';
    html += '<div class="quiz-score">' + quizScore + ' / ' + QUIZ_SIZE + ' (' + pct + '%)</div>';
    html += '<div class="quiz-review">';
    for (var i = 0; i < quizAnswers.length; i++) {
      var qa = quizAnswers[i];
      html += '<div class="quiz-review-item ' + (qa.correct ? 'correct' : 'wrong') + '">';
      html += '<span>' + (qa.correct ? '\u2713' : '\u2717') + '</span> ' + qa.q;
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">Try Again</button>';
    quizResult.innerHTML = html;
    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     CANVAS WHEEL — prevent page scroll when hovering canvas
     ================================================================ */

  canvas.addEventListener('wheel', function (e) {
    /* Only capture if canvas content can scroll (not applicable for this tool) */
  }, { passive: true });

  /* ================================================================
     USER GUIDE + INIT
     ================================================================ */

  document.getElementById('btn-guide').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('user-guide').scrollIntoView({ behavior: 'smooth' });
  });

  /* ================================================================
     BOOLEAN EXPRESSION → CIRCUIT CONVERTER
     Grammar (loosest to tightest): OR (+,|) → XOR (^,⊕) → AND (·,*,.,&,
     implicit adjacency) → NOT (postfix ' or prefix !/~) → atom (A–Z, 0, 1,
     parenthesised sub-expression). Single-letter variables only.
     ================================================================ */

  function parseBoolExpr(src) {
    var s = (src || '').trim();
    if (!s) throw new Error('Type an expression first — e.g. A\'B + BC');
    var pos = 0;
    var vars = [];
    function peek() { return pos < s.length ? s.charAt(pos) : ''; }
    function skipWs() { while (pos < s.length && /\s/.test(s.charAt(pos))) pos++; }
    function isVarChar(ch) { return /[A-Za-z]/.test(ch); }
    function isAtomStart(ch) { return ch === '(' || ch === '0' || ch === '1' || ch === '!' || ch === '~' || isVarChar(ch); }
    function parseOr() {
      var kids = [parseXor()]; skipWs();
      while (peek() === '+' || peek() === '|') {
        pos++; if (peek() === '|') pos++;
        kids.push(parseXor()); skipWs();
      }
      return kids.length === 1 ? kids[0] : { op: 'or', kids: kids };
    }
    function parseXor() {
      var kids = [parseAnd()]; skipWs();
      while (peek() === '^' || peek() === '⊕') { pos++; kids.push(parseAnd()); skipWs(); }
      return kids.length === 1 ? kids[0] : { op: 'xor', kids: kids };
    }
    function parseAnd() {
      var kids = [parseUnary()]; skipWs();
      for (;;) {
        var ch = peek();
        if (ch === '·' || ch === '*' || ch === '.' || ch === '&') {
          pos++; if (peek() === '&') pos++;
          kids.push(parseUnary()); skipWs(); continue;
        }
        if (isAtomStart(ch)) { kids.push(parseUnary()); skipWs(); continue; }
        break;
      }
      return kids.length === 1 ? kids[0] : { op: 'and', kids: kids };
    }
    function parseUnary() {
      skipWs();
      var ch = peek();
      if (ch === '!' || ch === '~') { pos++; return applyPostfix({ op: 'not', a: parseUnary() }); }
      return applyPostfix(parseAtom());
    }
    function applyPostfix(node) {
      skipWs();
      while (peek() === "'" || peek() === '’') { pos++; node = { op: 'not', a: node }; skipWs(); }
      return node;
    }
    function parseAtom() {
      skipWs();
      var ch = peek();
      if (ch === '(') {
        pos++;
        var e = parseOr();
        skipWs();
        if (peek() !== ')') throw new Error('Missing closing parenthesis');
        pos++;
        return e;
      }
      if (ch === '0' || ch === '1') { pos++; return { op: 'const', v: ch === '1' ? 1 : 0 }; }
      if (isVarChar(ch)) {
        var name = ch.toUpperCase(); pos++;
        if (vars.indexOf(name) === -1) vars.push(name);
        return { op: 'var', name: name };
      }
      throw new Error('Unexpected "' + (ch || 'end of expression') + '" at position ' + (pos + 1));
    }
    var ast = parseOr();
    skipWs();
    if (pos < s.length) throw new Error('Unexpected "' + s.charAt(pos) + '" at position ' + (pos + 1));
    vars.sort();
    if (vars.length > 6) throw new Error('Maximum 6 variables (truth-table limit) — you used ' + vars.length);
    return { ast: ast, vars: vars };
  }

  function countAstGates(node) {
    switch (node.op) {
      case 'var': case 'const': return 0;
      case 'not': return 1 + countAstGates(node.a);
      default: {
        var n = node.kids.length - 1; /* n-ary chain uses n−1 two-input gates */
        for (var i = 0; i < node.kids.length; i++) n += countAstGates(node.kids[i]);
        return n;
      }
    }
  }

  function buildCircuitFromExpression(exprText) {
    var parsed = parseBoolExpr(exprText); /* throws on syntax error */
    var gateTotal = countAstGates(parsed.ast);
    if (gateTotal > 30) throw new Error('Expression needs ' + gateTotal + ' gates — keep it under 30 for a readable circuit');

    if (running) stopSimulation();
    saveUndoState();
    components = []; connections = []; nextId = 1;
    selectedComp = null; selectedConn = -1; connectingFrom = null;

    var GX0 = 160, GDX = 115, GY0 = 40, GDY = 82;
    var colY = [];
    function yFor(level) { var y = colY[level] || GY0; colY[level] = y + GDY; return y; }

    var pinIds = {};
    for (var i = 0; i < parsed.vars.length; i++) {
      pinIds[parsed.vars[i]] = addComp('input-pin', 30, 46 + i * 76, { label: parsed.vars[i], state: 'LOW' });
    }

    var GATE_TYPE = { and: 'and-gate', or: 'or-gate', xor: 'xor-gate' };

    function emitGate(type, a, b) {
      var level = 1 + Math.max(a.level, b ? b.level : 0);
      var def = COMP_DEFS[type];
      var id = addComp(type, GX0 + (level - 1) * GDX, yFor(level), null);
      connect(a.id, a.port, id, 0);
      if (b) connect(b.id, b.port, id, 1);
      return { id: id, port: def.ports.length - 1, level: level };
    }

    function emit(node) {
      switch (node.op) {
        case 'var':
          return { id: pinIds[node.name], port: 0, level: 0 };
        case 'const': {
          var cid = addComp('constant', 30, yFor(0) + parsed.vars.length * 76, { value: String(node.v) });
          return { id: cid, port: 0, level: 0 };
        }
        case 'not':
          return emitGate('not-gate', emit(node.a), null);
        default: {
          var cur = emit(node.kids[0]);
          for (var k = 1; k < node.kids.length; k++) {
            cur = emitGate(GATE_TYPE[node.op], cur, emit(node.kids[k]));
          }
          return cur;
        }
      }
    }

    var out = emit(parsed.ast);
    var rootComp = findComp(out.id);
    var outY = rootComp ? rootComp.y : GY0;
    var outId = addComp('output-pin', GX0 + out.level * GDX + 10, outY, { label: 'Y' });
    connect(out.id, out.port, outId, 0);

    /* Keep the generated layout inside the visible canvas */
    var maxX = 0, maxY = 0;
    for (var m = 0; m < components.length; m++) {
      var md = getEffectiveDims(components[m]);
      maxX = Math.max(maxX, components[m].x + md.w);
      maxY = Math.max(maxY, components[m].y + md.h);
    }
    if (maxX > W - 20) {
      var sx = (W - 20 - GX0) / Math.max(1, maxX - GX0);
      for (var m2 = 0; m2 < components.length; m2++) {
        if (components[m2].x > GX0 - 40) {
          components[m2].x = Math.round((GX0 + (components[m2].x - GX0) * sx) / 10) * 10;
        }
      }
    }
    if (maxY > H - 20) {
      var sy = (H - 20 - GY0) / Math.max(1, maxY - GY0);
      for (var m3 = 0; m3 < components.length; m3++) {
        components[m3].y = Math.round((GY0 + (components[m3].y - GY0) * sy) / 10) * 10;
      }
    }

    /* The canvas no longer shows a preset — clear the active preset pill */
    document.querySelectorAll('#prebuilt-tabs .pill').forEach(function (p) { p.classList.remove('active'); });
    if (circuitDesc) circuitDesc.style.display = 'none';

    markTruthTableDirty();
    invalidateIOPanel();
    updateProperties();
    updateReadouts();
    draw();
    return { gates: gateTotal, vars: parsed.vars.length };
  }

  (function wireExpressionBar() {
    var exprInput = document.getElementById('expr-input');
    var exprBuild = document.getElementById('expr-build');
    var exprMsg = document.getElementById('expr-msg');
    if (!exprInput || !exprBuild) return;
    var defaultMsg = exprMsg ? exprMsg.innerHTML : '';
    function setMsg(html, cls) {
      if (!exprMsg) return;
      exprMsg.innerHTML = html;
      exprMsg.className = 'expr-hint' + (cls ? ' ' + cls : '');
    }
    function doBuild() {
      try {
        var res = buildCircuitFromExpression(exprInput.value);
        setMsg('&#10003; Built ' + res.gates + ' gate' + (res.gates === 1 ? '' : 's') + ' from ' + res.vars +
               ' input' + (res.vars === 1 ? '' : 's') + ' — truth table below. Press <strong>Run</strong> to simulate.', 'ok');
        if (toolbarHint) toolbarHint.textContent = 'Circuit generated from your expression. Press Run to simulate it.';
      } catch (err) {
        setMsg('&#9888; ' + (err && err.message ? err.message : 'Could not parse that expression'), 'err');
      }
    }
    exprBuild.addEventListener('click', doBuild);
    exprInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doBuild(); } });
    exprInput.addEventListener('input', function () { setMsg(defaultMsg, ''); });
  })();

  /* ================================================================
     TIMING DIAGRAM — rolling waveform capture of clock/inputs/outputs
     ================================================================ */

  var timingPanel = document.getElementById('timing-panel');
  var timingCanvas = document.getElementById('timing-canvas');
  var tctx = timingCanvas ? timingCanvas.getContext('2d') : null;
  var timingOn = true;
  var TRACE_WINDOW = 8;   /* seconds visible */
  var TRACE_MAX_SIGS = 8;
  var traceT = [];
  var traceSigs = [];

  function rebuildTraces() {
    traceT = [];
    traceSigs = [];
    var list = [];
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      if (comp.type === 'clock-source') list.push({ comp: comp, label: 'CLK', kind: 'clk' });
    }
    for (var c2 = 0; c2 < components.length; c2++) {
      var comp2 = components[c2];
      if (comp2.type === 'input-pin') list.push({ comp: comp2, label: comp2.values.label || 'IN', kind: 'in' });
    }
    var outN = 0;
    for (var c3 = 0; c3 < components.length; c3++) {
      var comp3 = components[c3];
      if (comp3.type === 'output-pin') { list.push({ comp: comp3, label: comp3.values.label || ('OUT' + outN), kind: 'out' }); outN++; }
    }
    traceSigs = list.slice(0, TRACE_MAX_SIGS);
    for (var s = 0; s < traceSigs.length; s++) traceSigs[s].vals = [];
  }

  function sampleTiming() {
    if (!timingOn || !traceSigs.length) return;
    traceT.push(simTime);
    for (var s = 0; s < traceSigs.length; s++) {
      var sig = traceSigs[s];
      var v;
      if (sig.kind === 'out') v = sig.comp._displayHigh ? 1 : 0;
      else v = (sig.comp._outputs && sig.comp._outputs[0]) ? 1 : 0;
      sig.vals.push(v);
    }
    var minT = simTime - TRACE_WINDOW;
    var drop = 0;
    while (drop < traceT.length && traceT[drop] < minT) drop++;
    if (drop > 0) {
      traceT.splice(0, drop);
      for (var s2 = 0; s2 < traceSigs.length; s2++) traceSigs[s2].vals.splice(0, drop);
    }
  }

  function updateTimingVisibility() {
    if (!timingPanel) return;
    var show = timingOn && traceSigs.length > 0;
    timingPanel.style.display = show ? 'block' : 'none';
    var btn = document.getElementById('btn-timing');
    if (btn) btn.setAttribute('aria-pressed', timingOn ? 'true' : 'false');
    if (show) drawTiming();
  }

  function drawTiming() {
    if (!tctx || !timingPanel || timingPanel.style.display === 'none' || !traceSigs.length) return;
    var cssW = Math.max(280, timingPanel.clientWidth - 28);
    var rowH = 34, topPad = 8, gutter = 64;
    var cssH = topPad + traceSigs.length * rowH + 20;
    if (timingCanvas.width !== Math.round(cssW * dpr) || timingCanvas.height !== Math.round(cssH * dpr)) {
      timingCanvas.width = Math.round(cssW * dpr);
      timingCanvas.height = Math.round(cssH * dpr);
      timingCanvas.style.width = cssW + 'px';
      timingCanvas.style.height = cssH + 'px';
    }
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.clearRect(0, 0, cssW, cssH);

    var t1 = traceT.length ? traceT[traceT.length - 1] : 0;
    var t0 = Math.max(0, t1 - TRACE_WINDOW);
    var plotW = cssW - gutter - 10;
    function tx(t) { return gutter + (t - t0) / TRACE_WINDOW * plotW; }

    /* 1-second grid + axis labels */
    tctx.font = '10px ' + _fontFamily;
    tctx.textAlign = 'center';
    for (var g = Math.ceil(t0); g <= t1; g++) {
      var gx = tx(g);
      if (gx < gutter - 1) continue;
      tctx.strokeStyle = 'rgba(139,157,195,0.13)';
      tctx.lineWidth = 1;
      tctx.beginPath();
      tctx.moveTo(gx, topPad);
      tctx.lineTo(gx, cssH - 18);
      tctx.stroke();
      tctx.fillStyle = '#6b7a99';
      tctx.fillText(g + 's', gx, cssH - 6);
    }

    var COLORS = { clk: '#f6b93b', in: '#42a5f5', out: '#43c66a' };
    for (var s = 0; s < traceSigs.length; s++) {
      var sig = traceSigs[s];
      var yLow = topPad + s * rowH + rowH - 8;
      var yHigh = topPad + s * rowH + 6;

      tctx.strokeStyle = 'rgba(139,157,195,0.10)';
      tctx.beginPath();
      tctx.moveTo(gutter, yLow);
      tctx.lineTo(cssW - 10, yLow);
      tctx.stroke();

      tctx.fillStyle = COLORS[sig.kind] || '#c0d0e8';
      tctx.textAlign = 'right';
      tctx.font = '600 11px ' + _fontFamily;
      var lbl = sig.label.length > 7 ? sig.label.slice(0, 6) + '…' : sig.label;
      tctx.fillText(lbl, gutter - 8, (yLow + yHigh) / 2 + 4);

      if (!sig.vals.length) continue;
      tctx.strokeStyle = COLORS[sig.kind] || '#c0d0e8';
      tctx.lineWidth = 1.6;
      tctx.beginPath();
      var prevY = sig.vals[0] ? yHigh : yLow;
      tctx.moveTo(tx(traceT[0]), prevY);
      for (var p = 1; p < sig.vals.length; p++) {
        var x = tx(traceT[p]);
        var y = sig.vals[p] ? yHigh : yLow;
        if (y !== prevY) {
          tctx.lineTo(x, prevY);
          tctx.lineTo(x, y);
          prevY = y;
        }
      }
      tctx.lineTo(tx(traceT[traceT.length - 1]), prevY);
      tctx.stroke();
    }
  }

  (function wireTimingToggle() {
    var btn = document.getElementById('btn-timing');
    if (!btn) return;
    btn.addEventListener('click', function () {
      timingOn = !timingOn;
      if (timingOn && running && !traceSigs.length) rebuildTraces();
      updateTimingVisibility();
      if (toolbarHint) {
        toolbarHint.textContent = timingOn
          ? (traceSigs.length ? 'Timing diagram on — waveforms record while the simulation runs.' : 'Timing diagram on — press Run to record waveforms.')
          : 'Timing diagram hidden.';
      }
    });
  })();

  /* ================================================================
     SAVE / OPEN — circuit as a portable .json file (no backend)
     ================================================================ */

  function slimCircuitJSON() {
    return JSON.stringify({
      app: 'nhitvisuallab-logic-gates',
      version: 1,
      saved: new Date().toISOString(),
      components: components.map(function (c) {
        return { id: c.id, type: c.type, x: c.x, y: c.y, orient: c.orient || 0, values: c.values };
      }),
      connections: connections.map(function (cn) {
        return { from: cn.from, to: cn.to };
      }),
      nextId: nextId
    }, null, 1);
  }

  function saveCircuitFile() {
    if (!components.length) {
      if (toolbarHint) toolbarHint.textContent = 'Nothing to save — add some gates first.';
      return;
    }
    var blob = new Blob([slimCircuitJSON()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'logic-circuit.json';
    a.click();
    URL.revokeObjectURL(url);
    if (toolbarHint) toolbarHint.textContent = 'Circuit saved as logic-circuit.json — use Open to load it back later.';
  }

  function loadCircuitData(data) {
    if (!data || !Array.isArray(data.components) || !Array.isArray(data.connections)) {
      throw new Error('Not a valid circuit file');
    }
    var comps = [];
    var maxId = 0;
    for (var i = 0; i < data.components.length; i++) {
      var c = data.components[i];
      if (!c || !COMP_DEFS[c.type] || typeof c.x !== 'number' || typeof c.y !== 'number') continue;
      var def = COMP_DEFS[c.type];
      var vals = {};
      for (var k in def.params) vals[k] = def.params[k].def;
      if (c.values) { for (var kk in c.values) { if (kk in vals || kk === 'label') vals[kk] = c.values[kk]; } }
      comps.push({ id: c.id, type: c.type, x: c.x, y: c.y, orient: c.orient || 0, values: vals });
      if (c.id > maxId) maxId = c.id;
    }
    if (!comps.length) throw new Error('Circuit file contains no valid components');
    var ids = {};
    for (var m = 0; m < comps.length; m++) ids[comps[m].id] = true;
    var conns = [];
    for (var j = 0; j < data.connections.length; j++) {
      var cn = data.connections[j];
      if (!cn || !cn.from || !cn.to || !ids[cn.from.compId] || !ids[cn.to.compId]) continue;
      conns.push({ from: { compId: cn.from.compId, portIdx: cn.from.portIdx | 0 }, to: { compId: cn.to.compId, portIdx: cn.to.portIdx | 0 }, logicLevel: 0 });
    }
    if (running) stopSimulation();
    saveUndoState();
    components = comps;
    connections = conns;
    nextId = Math.max(data.nextId || 1, maxId + 1);
    selectedComp = null; selectedConn = -1; connectingFrom = null;
    markTruthTableDirty();
    invalidateIOPanel();
    updateProperties();
    updateReadouts();
    draw();
    if (toolbarHint) toolbarHint.textContent = 'Circuit loaded — press Run to simulate.';
  }

  (function wireSaveOpen() {
    var btnSave = document.getElementById('btn-save');
    var btnOpen = document.getElementById('btn-open');
    var fileInput = document.getElementById('file-open');
    if (btnSave) btnSave.addEventListener('click', saveCircuitFile);
    if (btnOpen && fileInput) {
      btnOpen.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            loadCircuitData(JSON.parse(reader.result));
          } catch (err) {
            if (toolbarHint) toolbarHint.textContent = '⚠ Could not open that file: ' + (err && err.message ? err.message : 'invalid JSON');
          }
        };
        reader.readAsText(file);
      });
    }
  })();

  /* ================================================================
     EMBED — copy an iframe snippet (includes current circuit hash)
     ================================================================ */

  (function wireEmbedButton() {
    var btn = document.getElementById('btn-embed');
    if (!btn) return;
    function flashEmbed(label, ok) {
      if (btn._orig == null) btn._orig = btn.innerHTML;
      clearTimeout(btn._ft);
      btn.textContent = label;
      btn.style.color = ok === false ? '#ff6b6b' : (ok ? '#43c66a' : '');
      btn._ft = setTimeout(function () { btn.innerHTML = btn._orig; btn.style.color = ''; }, 1900);
    }
    btn.addEventListener('click', function () {
      var hash = (location.hash && location.hash.indexOf('#c=') === 0) ? location.hash : '';
      var src = 'https://nhitvisuallab.org/tools/logic-gates/?embed=1' + hash;
      var snippet = '<iframe src="' + src + '"\n' +
        '        width="100%" height="640" loading="lazy" allowfullscreen\n' +
        '        style="border:1px solid #ccc;border-radius:8px;"\n' +
        '        title="Logic Gate Simulator by NHIT VisualLab"></iframe>';
      function fallbackPrompt() {
        /* Clipboard unavailable (permissions/older browser) — show the code for manual copy */
        window.prompt('Copy this embed code (Ctrl+C / Cmd+C):', snippet);
        flashEmbed('↑ Copy from dialog');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(snippet).then(
          function () {
            flashEmbed('✓ Embed code copied!', true);
            if (toolbarHint) toolbarHint.textContent = hash
              ? 'Embed code copied — the iframe reproduces your current circuit. Tip: press Share first to refresh the circuit link.'
              : 'Embed code copied — paste it into any website or LMS page.';
          },
          fallbackPrompt
        );
      } else {
        fallbackPrompt();
      }
    });
  })();

  /* Init */
  resizeCanvas();
  drawPaletteIcons();
  buildCircuit('and-or-not');
  switchMode('simulate');

  /* ================================================================
     SHAREABLE URL — the whole circuit is encoded into the link (no backend).
     {components,connections,nextId} → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function toolHint(m){ var h=document.getElementById('toolbar-hint'); if(h) h.textContent=m; }
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareSnapshot(){ return JSON.stringify({ components: components, connections: connections, nextId: nextId }); }
    function shareLink(){
      if(!components.length){ flashShare('Nothing to place',false); toolHint('Add some gates first, then Share.'); return Promise.resolve(); }
      try{
        var U=new TextEncoder().encode(shareSnapshot());
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ flashShare('⚠ Too big',false); toolHint('Circuit too big to share as a link.'); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(
              function(){ flashShare('✓ Link copied!',true); toolHint('Shareable link copied — opens this exact circuit.'); },
              function(){ flashShare('↑ In address bar'); toolHint('Shareable link is in the address bar.'); });
          } else { flashShare('↑ In address bar'); toolHint('Shareable link is in the address bar.'); }
        }).catch(function(){ flashShare('✗ Failed',false); });
      }catch(e){ flashShare('✗ Failed',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var data=JSON.parse(new TextDecoder().decode(U));
        if(!data || !Array.isArray(data.components) || !Array.isArray(data.connections)) return;   // shape mismatch → ignore
        components = data.components; connections = data.connections; nextId = data.nextId || 1;
        selectedComp = null; selectedConn = -1;
        if (typeof markTruthTableDirty === 'function') markTruthTableDirty();
        updateProperties(); draw();
        toolHint('Opened a shared circuit. Press Run to simulate.');
      }).catch(function(){});                     // corrupt link → keep the seed circuit
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // runs after the boot above (rAF-free so it's not throttled in background tabs)
  })();

})();
