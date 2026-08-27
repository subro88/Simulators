(function () {
  'use strict';

  /* ================================================================
     GRAY CODE TABLES & CELL INDEXING
     ================================================================ */

  var GRAY2 = [0, 1];
  var GRAY4 = [0, 1, 3, 2];

  /* Maps: grayIndex -> gray value for row/col headers */
  var GRAY_LABELS = {
    2: { rows: ['0', '1'], cols: ['0', '1'] },
    3: { rows: ['0', '1'], cols: ['00', '01', '11', '10'] },
    4: { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] },
    5: { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] }
  };

  /* Build lookup: for numVars, gridPos(row, col) -> minterm number */
  function buildMintermMap(numVars) {
    var map = [];
    var rows, cols;
    if (numVars === 2) {
      rows = GRAY2; cols = GRAY2;
    } else if (numVars === 3) {
      rows = GRAY2; cols = GRAY4;
    } else if (numVars === 4) {
      rows = GRAY4; cols = GRAY4;
    } else if (numVars === 5) {
      rows = GRAY4; cols = GRAY4;
    }
    var numCols = cols.length;
    var numRows = rows.length;
    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        if (numVars === 5) {
          /* First grid (E=0): minterm = row*8 + col*2 + 0 */
          /* Actually: for 5-var, top vars AB (rows), CD (cols), E (grid) */
          /* Minterm = AB_gray * 8 + CD_gray * 2 + E */
          map.push(rows[r] * 8 + cols[c] * 2 + 0); /* E=0 grid */
        } else {
          map.push(rows[r] * numCols + cols[c]);
        }
      }
    }
    if (numVars === 5) {
      /* Second grid (E=1) */
      for (var r2 = 0; r2 < numRows; r2++) {
        for (var c2 = 0; c2 < numCols; c2++) {
          map.push(rows[r2] * 8 + cols[c2] * 2 + 1);
        }
      }
    }
    return map;
  }

  /* Reverse map: minterm -> (grid, row, col) */
  function buildReverseMap(numVars) {
    var fwd = buildMintermMap(numVars);
    var rev = {};
    var numCols = (numVars <= 2) ? 2 : 4;
    var numRows = (numVars <= 3) ? 2 : 4;
    for (var i = 0; i < fwd.length; i++) {
      var grid = (numVars === 5 && i >= 16) ? 1 : 0;
      var idx = (numVars === 5 && i >= 16) ? i - 16 : i;
      rev[fwd[i]] = { grid: grid, row: Math.floor(idx / numCols), col: idx % numCols };
    }
    return rev;
  }

  var VAR_NAMES = ['A', 'B', 'C', 'D', 'E'];

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = {
    'common-logic': {
      name: 'AND/OR/XOR', vars: 2, desc: 'Basic 2-variable functions',
      maps: {
        'AND': [0, 0, 0, 1],
        'OR':  [0, 1, 1, 1],
        'XOR': [0, 1, 1, 0]
      }
    },
    'majority': {
      name: 'Majority Voter', vars: 3,
      desc: '3-input majority function. Output is 1 when 2+ inputs are HIGH.',
      values: [0, 0, 0, 1, 0, 1, 1, 1]
    },
    'parity': {
      name: 'Parity Check', vars: 3,
      desc: 'Odd parity \u2014 output 1 when odd number of inputs are HIGH.',
      values: [0, 1, 1, 0, 1, 0, 0, 1]
    },
    '7seg-a': {
      name: '7-Seg (a)', vars: 4,
      desc: 'Segment "a" of BCD-to-7-segment decoder.',
      values: [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 'X', 'X', 'X', 'X', 'X', 'X']
    },
    'bcd-valid': {
      name: 'BCD Valid', vars: 4,
      desc: 'Output 1 for valid BCD digits (0\u20139), 0 for invalid (10\u201315).',
      values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    },
    'custom': {
      name: 'Custom', vars: 4,
      desc: 'Start with blank 4-variable K-Map. Click cells to set values.',
      values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  /* ================================================================
     EXPLORE DATA \u2014 16 concept cards across 5 categories
     ================================================================ */

  var CONCEPTS = [
    /* Fundamentals */
    {
      id: 'what-is-kmap', name: 'What is a K-Map?', symbol: 'K',
      formula: 'Visual truth table rearrangement', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'A Karnaugh Map (K-Map) is a graphical method for simplifying Boolean algebra expressions. It rearranges the truth table into a 2D grid where adjacent cells differ by exactly one variable. This arrangement makes it easy to spot patterns and group cells to eliminate variables. K-Maps work well for 2 to 5 variables. For more variables, the Quine-McCluskey algorithm is used.',
      example: { problem: 'Why is a K-Map better than algebraic simplification?', steps: ['Algebraic methods require knowing which laws to apply', 'K-Maps provide a systematic visual approach', 'Adjacent 1-cells are grouped to eliminate variables', 'The result is always a minimal SOP or POS expression'], answer: 'Visual & systematic', unit: '' }
    },
    {
      id: 'gray-code', name: 'Gray Code', symbol: 'G',
      formula: '00 \u2192 01 \u2192 11 \u2192 10', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Gray code is a binary numbering system where consecutive values differ in exactly one bit. In K-Maps, rows and columns are ordered using Gray code (00, 01, 11, 10) instead of binary counting order (00, 01, 10, 11). This ensures that physically adjacent cells on the map differ by exactly one variable, which is the key property that makes K-Map simplification work.',
      example: { problem: 'List the 4-element Gray code sequence.', steps: ['Start with 00', 'Change rightmost bit: 01', 'Change leftmost bit: 11', 'Change rightmost bit: 10'], answer: '00,01,11,10', unit: '' }
    },
    {
      id: 'cell-numbering', name: 'Cell Numbering', symbol: '#',
      formula: 'minterm = row_gray \u00D7 cols + col_gray', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Each cell in a K-Map corresponds to a minterm number. The minterm number is calculated from the Gray code values of the row and column. For a 4-variable K-Map (AB rows, CD columns), minterm = (AB_gray \u00D7 4) + CD_gray. For example, row 11 (Gray=3) and column 10 (Gray=2) gives minterm 3\u00D74+2=14. This mapping is critical for correctly placing truth table values on the K-Map.',
      example: { problem: 'In a 4-var K-Map, what minterm is at row AB=11, col CD=01?', steps: ['Row AB=11 has Gray value 3', 'Col CD=01 has Gray value 1', 'Minterm = 3 \u00D7 4 + 1 = 13'], answer: 13, unit: '' }
    },
    {
      id: 'adjacency', name: 'Adjacency', symbol: 'Adj',
      formula: 'Cells sharing an edge are adjacent', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Two cells in a K-Map are adjacent if their minterm numbers differ by exactly one variable. Adjacent cells share an edge on the grid, including wrap-around edges (top-bottom and left-right). The K-Map is topologically a torus. Grouping adjacent 1-cells allows the differing variable to be eliminated from the product term. This is the fundamental principle behind K-Map simplification.',
      example: { problem: 'In a 4-var K-Map, are minterms 0 and 2 adjacent?', steps: ['m0 = 0000, m2 = 0010', 'They differ in bit D only (1 bit difference)', 'Yes, they are adjacent', 'Grouping them eliminates variable D'], answer: 'Yes', unit: '' }
    },

    /* Grouping Rules */
    {
      id: 'group-size', name: 'Group Size', symbol: '2\u207F',
      formula: 'Groups must be powers of 2', unit: '\u2014',
      cat: 'grouping-rules',
      desc: 'Every group in a K-Map must contain a number of cells that is a power of 2: 1, 2, 4, 8, or 16 cells. A group of 2 eliminates 1 variable. A group of 4 eliminates 2 variables. A group of 8 eliminates 3 variables. A group of 16 (entire 4-var K-Map) eliminates all variables, meaning the output is always 1. Groups of 3, 5, 6, etc. are never valid.',
      example: { problem: 'A group of 8 in a 4-variable K-Map eliminates how many variables?', steps: ['8 = 2\u00B3', 'Number of eliminated variables = log\u2082(group size)', 'log\u2082(8) = 3 variables eliminated', '4 \u2212 3 = 1 variable remains in the product term'], answer: 3, unit: 'variables' }
    },
    {
      id: 'rectangular', name: 'Rectangular Groups', symbol: 'Rect',
      formula: 'Groups must be rectangular', unit: '\u2014',
      cat: 'grouping-rules',
      desc: 'All groups in a K-Map must form rectangles (including squares). An L-shaped or diagonal grouping is never valid. The rectangle dimensions must be powers of 2 in each direction: 1\u00D71, 1\u00D72, 2\u00D72, 1\u00D74, 2\u00D74, 4\u00D74, etc. This constraint ensures that each group corresponds to a valid product term where some variables are eliminated.',
      example: { problem: 'Is a 2\u00D73 group valid in a K-Map?', steps: ['2\u00D73 = 6 cells', '6 is not a power of 2', 'The group is not valid', 'Break it into valid groups: 2\u00D72 + 2\u00D71'], answer: 'No', unit: '' }
    },
    {
      id: 'wrap-around', name: 'Wrap-Around Groups', symbol: 'Wrap',
      formula: 'K-Map edges connect (torus)', unit: '\u2014',
      cat: 'grouping-rules',
      desc: 'The K-Map wraps around both horizontally and vertically. The leftmost column is adjacent to the rightmost column, and the top row is adjacent to the bottom row. This means cells at opposite edges can form valid groups. For example, in a 4-var K-Map, minterms {0, 2, 8, 10} form a valid group of 4 even though they occupy the four corners of the map.',
      example: { problem: 'Can minterms 0 and 2 be grouped in a 4-var K-Map?', steps: ['m0 is at row 00, col 00 (leftmost)', 'm2 is at row 00, col 10 (rightmost)', 'Left and right edges wrap around', 'They are adjacent and can be grouped'], answer: 'Yes', unit: '' }
    },
    {
      id: 'overlap', name: 'Overlapping Groups', symbol: 'OL',
      formula: 'Cells can belong to multiple groups', unit: '\u2014',
      cat: 'grouping-rules',
      desc: 'A cell in the K-Map can be part of multiple groups simultaneously. Overlapping groups are not only allowed but encouraged, because larger groups eliminate more variables and produce simpler expressions. The goal is to cover every 1-cell with at least one group while making each group as large as possible.',
      example: { problem: 'Minterm 7 (0111) can belong to how many possible groups?', steps: ['It can pair with m3 (differ in A)', 'It can pair with m5 (differ in C)', 'It can pair with m6 (differ in D)', 'It can pair with m15 (differ in B)', 'Plus larger groups \u2014 many possible groupings'], answer: 'Multiple', unit: '' }
    },
    {
      id: 'largest-groups', name: 'Largest Possible Groups', symbol: 'Max',
      formula: 'Always maximize group size', unit: '\u2014',
      cat: 'grouping-rules',
      desc: 'When forming groups on a K-Map, always make each group as large as possible. Larger groups eliminate more variables, resulting in simpler product terms. A group of 1 keeps all variables; a group of 2 eliminates 1; a group of 4 eliminates 2, and so on. Never use a smaller group when a larger one covers the same cells plus more 1-cells.',
      example: { problem: 'Minterms {0,1,2,3} in a 3-var K-Map. Best grouping?', steps: ['These 4 cells form a 2\u00D72 block', 'Group of 4 eliminates 2 variables (B,C)', 'Result: A\u2019 (only variable A=0 is common)', 'Never split into two groups of 2'], answer: "A'", unit: '' }
    },

    /* SOP & POS */
    {
      id: 'sop', name: 'Sum of Products', symbol: 'SOP',
      formula: "F = A'B + BC' + AC", unit: '\u2014',
      cat: 'sop-pos',
      desc: 'Sum of Products (SOP) is a Boolean expression format where product (AND) terms are summed (OR-ed) together. Each group of 1-cells in the K-Map produces one product term. Variables that are 0 throughout the group appear complemented; variables that are 1 appear uncomplemented; variables that change within the group are eliminated. The final SOP expression is the OR of all group terms.',
      example: { problem: 'A group covers rows AB=01,11 and col CD=01. What is its term?', steps: ['A changes (0 and 1) \u2192 eliminated', 'B is always 1 \u2192 B', 'C is always 0 \u2192 C\u2019', 'D is always 1 \u2192 D', "Product term: BC'D"], answer: "BC'D", unit: '' }
    },
    {
      id: 'pos', name: 'Product of Sums', symbol: 'POS',
      formula: "F = (A+B)(A'+C)", unit: '\u2014',
      cat: 'sop-pos',
      desc: 'Product of Sums (POS) is the dual of SOP. To find the POS expression, group the 0-cells in the K-Map (instead of the 1-cells). Each group of 0-cells produces one sum (OR) term. The variables are complemented compared to SOP: variables that are 0 in the group appear uncomplemented in the sum term, and variables that are 1 appear complemented. The final expression is the AND of all sum terms.',
      example: { problem: 'A 0-group covers row AB=00, cols CD=00,01. What is its sum term?', steps: ['A is always 0 \u2192 A (uncomplemented in POS)', 'B is always 0 \u2192 B', 'C is always 0 \u2192 C', 'D changes \u2192 eliminated', 'Sum term: (A + B + C)'], answer: '(A+B+C)', unit: '' }
    },
    {
      id: 'canonical-minimal', name: 'Canonical vs Minimal', symbol: 'Min',
      formula: 'Fewer literals = simpler circuit', unit: '\u2014',
      cat: 'sop-pos',
      desc: 'The canonical form lists every minterm as a full product term (all variables present). The minimal form, obtained through K-Map simplification, reduces the number of literals (variable occurrences). Fewer literals means fewer gates and connections in the circuit, lower cost, and lower power consumption. The literal count saved is the difference between canonical and minimal forms.',
      example: { problem: 'Canonical: AB\u2019CD\u2019 + AB\u2019CD + ABCD\u2019 + ABCD. How many literals?', steps: ['Each term has 4 literals', '4 terms \u00D7 4 literals = 16 total literals', 'Simplified: AB\u2019C + ABC = AC(B\u2019 + B) = AC', 'Minimal: 2 literals \u2014 saved 14 literals!'], answer: 14, unit: 'literals saved' }
    },

    /* Don't Care */
    {
      id: 'dont-care-def', name: "Don't-Care Conditions", symbol: 'X',
      formula: 'Output undefined for certain inputs', unit: '\u2014',
      cat: 'dont-care',
      desc: "Don't-care conditions occur when certain input combinations either never happen or when the output doesn't matter for those inputs. In BCD (Binary-Coded Decimal), the combinations 1010 through 1111 (10\u201315) never represent valid digits, so their outputs are don't-care. On the K-Map, don't-care cells are marked with X. They can be treated as either 0 or 1, whichever produces a simpler expression.",
      example: { problem: 'In BCD, why are minterms 10-15 don\'t-cares?', steps: ['BCD represents digits 0-9 only', 'Input combinations 1010-1111 never occur', 'Their outputs can be 0 or 1 freely', 'We choose the value that simplifies the expression'], answer: 'Invalid inputs', unit: '' }
    },
    {
      id: 'using-dont-cares', name: "Using Don't-Cares", symbol: 'X\u21921',
      formula: 'Include in groups for larger coverage', unit: '\u2014',
      cat: 'dont-care',
      desc: "Don't-care cells can be included in groups to make them larger, even though don't-cares are not required to be covered. Including a don't-care expands a group from, say, 2 to 4 cells, eliminating an additional variable. However, don't-cares are never required to be covered on their own \u2014 they are only included when it helps enlarge a group that covers actual 1-cells.",
      example: { problem: 'Minterms {1,3}, don\'t-care {5,7}. Best group?', steps: ['Without DC: group {1,3} = 2 cells, term = A\u2019B\u2019D', 'With DC: group {1,3,5,7} = 4 cells, term = D', 'Using don\'t-cares doubled the group size', 'One more variable eliminated'], answer: 'D', unit: '' }
    },

    /* Applications */
    {
      id: 'bcd-7seg', name: 'BCD-to-7-Segment', symbol: '7S',
      formula: 'Segment a = f(A,B,C,D)', unit: '\u2014',
      cat: 'applications',
      desc: 'A BCD-to-7-segment decoder converts a 4-bit BCD input (0\u20139) into signals for the 7 segments (a\u2013g) of a display. Each segment has its own Boolean function with 4 inputs and 6 don\'t-care conditions (inputs 10\u201315). K-Maps are used to simplify each segment function. For example, segment "a" lights for digits 0,2,3,5,6,7,8,9, giving minterms {0,2,3,5,6,7,8,9} with don\'t-cares {10,11,12,13,14,15}.',
      example: { problem: 'Segment "a" has minterms {0,2,3,5,6,7,8,9}. How many 1-cells?', steps: ['Count the minterms: 0,2,3,5,6,7,8,9', 'That is 8 minterms', 'Plus 6 don\'t-care cells (10-15)', 'The K-Map has 8 ones and 6 X\'s'], answer: 8, unit: 'cells' }
    },
    {
      id: 'error-detection', name: 'Error Detection', symbol: 'Par',
      formula: 'Parity = XOR of all bits', unit: '\u2014',
      cat: 'applications',
      desc: 'Parity checking is used for error detection in data transmission. Even parity means the total number of 1-bits (including the parity bit) is even. Odd parity means the count is odd. On a K-Map, parity functions create a checkerboard pattern where no two adjacent cells have the same value. This makes parity functions impossible to simplify with K-Maps \u2014 they inherently require n\u22121 XOR gates, which is already minimal.',
      example: { problem: '3-bit odd parity: how many minterms?', steps: ['Odd parity: output 1 when odd number of 1-bits', '001=1, 010=1, 100=1, 111=1', 'Minterms: {1, 2, 4, 7}', '4 minterms out of 8 total'], answer: 4, unit: 'minterms' }
    }
  ];

  /* ================================================================
     PRACTICE \u2014 12 problem generators
     ================================================================ */

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* Helper: count 1-bits */
  function bitCount(n) {
    var c = 0;
    while (n > 0) { c += n & 1; n >>= 1; }
    return c;
  }

  var PRACTICE = [
    /* 1. Given minterms for 2-var, find SOP */
    function () {
      var combos = [
        { m: [3], expr: 'AB', steps: ['Only minterm 3 (AB=11)', 'Group of 1: AB', 'F = AB'] },
        { m: [1, 3], expr: 'B', steps: ['Minterms 1,3 share B=1', 'Group of 2 eliminates A', 'F = B'] },
        { m: [2, 3], expr: 'A', steps: ['Minterms 2,3 share A=1', 'Group of 2 eliminates B', 'F = A'] },
        { m: [1, 2, 3], expr: 'A + B', steps: ['Group {1,3}: B', 'Group {2,3}: A', 'F = A + B'] }
      ];
      var c = randChoice(combos);
      return { prompt: '2-variable K-Map with minterms {' + c.m.join(',') + '}. What is the simplified SOP?', unit: '', answer: c.expr, tol: 0, steps: c.steps, isText: true };
    },
    /* 2. Count groups needed */
    function () {
      var cases = [
        { desc: 'minterms {3,5,6,7} in 3-var K-Map', ans: 3, steps: ['Group {3,7}: BC', 'Group {5,7}: AC', 'Group {6,7}: AB', '3 groups needed'] },
        { desc: 'minterms {0,1,2,3} in 3-var K-Map', ans: 1, steps: ['All 4 minterms form one group of 4', "They share A=0: F = A'", '1 group needed'] },
        { desc: 'minterms {0,2,8,10} in 4-var K-Map', ans: 1, steps: ['All 4 corners wrap around', "They share B=0, D=0: F = B'D'", '1 group needed'] }
      ];
      var c = randChoice(cases);
      return { prompt: 'How many groups are needed for ' + c.desc + '?', unit: 'groups', answer: c.ans, tol: 0, steps: c.steps };
    },
    /* 3. Minterm from K-Map position */
    function () {
      var row = randInt(0, 3);
      var col = randInt(0, 3);
      var rowGray = GRAY4[row];
      var colGray = GRAY4[col];
      var minterm = rowGray * 4 + colGray;
      var rowLabel = GRAY_LABELS[4].rows[row];
      var colLabel = GRAY_LABELS[4].cols[col];
      return {
        prompt: '4-var K-Map: what minterm number is at row AB=' + rowLabel + ', col CD=' + colLabel + '?',
        unit: '', answer: minterm, tol: 0,
        steps: ['Row AB=' + rowLabel + ' has Gray value ' + rowGray, 'Col CD=' + colLabel + ' has Gray value ' + colGray, 'Minterm = ' + rowGray + ' \u00D7 4 + ' + colGray + ' = ' + minterm]
      };
    },
    /* 4. How many variables eliminated */
    function () {
      var sizes = [1, 2, 4, 8];
      var sz = randChoice(sizes);
      var elim = Math.round(Math.log(sz) / Math.log(2));
      return {
        prompt: 'A group of ' + sz + ' cells in a K-Map eliminates how many variables?',
        unit: 'variables', answer: elim, tol: 0,
        steps: ['Group size = ' + sz, 'Variables eliminated = log\u2082(' + sz + ')', 'log\u2082(' + sz + ') = ' + elim]
      };
    },
    /* 5. Truth table rows */
    function () {
      var n = randChoice([2, 3, 4, 5]);
      var ans = Math.pow(2, n);
      return { prompt: 'A ' + n + '-variable K-Map has how many cells?', unit: 'cells', answer: ans, tol: 0, steps: ['Cells = 2\u207F', 'Cells = 2^' + n + ' = ' + ans] };
    },
    /* 6. Identify if group wraps */
    function () {
      var cases = [
        { desc: 'minterms {0, 2} in a 4-var K-Map', ans: 1, steps: ['m0 is at col 00 (leftmost)', 'm2 is at col 10 (rightmost)', 'The left and right edges wrap around', 'Yes, this group wraps (answer: 1)'] },
        { desc: 'minterms {0, 1} in a 4-var K-Map', ans: 0, steps: ['m0 is at col 00', 'm1 is at col 01', 'These are physically adjacent (no wrapping)', 'No, this group does not wrap (answer: 0)'] },
        { desc: 'minterms {0, 8} in a 4-var K-Map', ans: 1, steps: ['m0 is at row 00 (top)', 'm8 is at row 10 (bottom)', 'The top and bottom edges wrap around', 'Yes, this group wraps (answer: 1)'] }
      ];
      var c = randChoice(cases);
      return { prompt: 'Does the group of ' + c.desc + ' wrap around? (1=yes, 0=no)', unit: '', answer: c.ans, tol: 0, steps: c.steps };
    },
    /* 7. Literal count */
    function () {
      var cases = [
        { expr: "A'B + BC", lits: 4, steps: ["A'B has 2 literals (A', B)", 'BC has 2 literals (B, C)', 'Total: 4 literals'] },
        { expr: "AB'C + A'BC + ABC", lits: 9, steps: ["AB'C: 3 literals", "A'BC: 3 literals", 'ABC: 3 literals', 'Total: 9 literals'] },
        { expr: "B'D'", lits: 2, steps: ["B' is 1 literal", "D' is 1 literal", 'Total: 2 literals'] }
      ];
      var c = randChoice(cases);
      return { prompt: 'How many literals in: F = ' + c.expr + '?', unit: 'literals', answer: c.lits, tol: 0, steps: c.steps };
    },
    /* 8. Essential prime implicant identification */
    function () {
      var cases = [
        { desc: 'minterms {1,3,5,7} in a 3-var K-Map', ans: 1, steps: ['All 4 minterms form one group of 4', 'This covers column C=1', 'Only 1 essential PI: C', 'F = C'] },
        { desc: 'minterms {3,5,6,7} in a 3-var K-Map', ans: 3, steps: ['Group {3,7}: BC', 'Group {5,7}: AC', 'Group {6,7}: AB', 'All 3 are essential (each uniquely covers a minterm)'] }
      ];
      var c = randChoice(cases);
      return { prompt: 'How many essential prime implicants for ' + c.desc + '?', unit: 'EPIs', answer: c.ans, tol: 0, steps: c.steps };
    },
    /* 9. Don't care impact */
    function () {
      var cases = [
        { desc: "minterms {1,3}, DC {5,7}. Without DC: A'D. With DC?", ans: 'D', steps: ["Without DC: group {1,3} = A'D (2 cells)", 'With DC {5,7}: group {1,3,5,7} = D (4 cells)', "Don't-cares doubled the group size", 'Eliminated one more variable'], isText: true },
        { desc: "minterms {0,8}, DC {2,10}. Without DC: A'B'C'D' + AB'C'D'. With DC?", ans: "B'D'", steps: ["Without DC: {0,8} = B'C'D' (need C' too)", "With DC: {0,2,8,10} = B'D' (4 cells)", "Don't-cares simplified the expression", 'Eliminated variable C'], isText: true }
      ];
      var c = randChoice(cases);
      return { prompt: c.desc, unit: '', answer: c.ans, tol: 0, steps: c.steps, isText: c.isText };
    },
    /* 10. Given simplified expression, find minterms */
    function () {
      var cases = [
        { expr: 'AB (2-var)', ans: 1, steps: ['AB = 1 only when A=1 AND B=1', 'Minterm 3 (binary 11)', '1 minterm'], desc: 'How many minterms does F = AB cover in a 2-var K-Map?' },
        { expr: "A' (3-var)", ans: 4, steps: ["A'=1 when A=0", 'Minterms: 0,1,2,3 (first half)', '4 minterms'], desc: "How many minterms does F = A' cover in a 3-var K-Map?" },
        { expr: 'B (4-var)', ans: 8, steps: ['B=1 for minterms where B-bit is 1', 'Minterms: 4,5,6,7,12,13,14,15', '8 minterms'], desc: 'How many minterms does F = B cover in a 4-var K-Map?' }
      ];
      var c = randChoice(cases);
      return { prompt: c.desc, unit: 'minterms', answer: c.ans, tol: 0, steps: c.steps };
    },
    /* 11. Gray code ordering */
    function () {
      var pos = randInt(0, 3);
      var labels = ['00', '01', '11', '10'];
      var vals = [0, 1, 3, 2];
      return {
        prompt: 'In 4-element Gray code, position ' + pos + ' (0-indexed) has value:',
        unit: '', answer: vals[pos], tol: 0,
        steps: ['Gray code sequence: 00, 01, 11, 10', 'Position ' + pos + ' = ' + labels[pos], 'Decimal value = ' + vals[pos]]
      };
    },
    /* 12. Simplification result for known case */
    function () {
      var cases = [
        { desc: '4-var K-Map: minterms {0,1,2,3,4,5,6,7}', ans: "A'", steps: ['All 8 minterms have A=0', 'One group of 8 covers the top two rows', 'Eliminates B, C, D', "F = A'"], isText: true },
        { desc: '4-var K-Map: minterms {0,2,8,10}', ans: "B'D'", steps: ['Four corners of the K-Map', 'All have B=0 and D=0', 'Wraps both horizontally and vertically', "F = B'D'"], isText: true },
        { desc: '3-var K-Map: minterms {3,5,6,7}', ans: 'AB + AC + BC', steps: ['Group {3,7}: BC', 'Group {5,7}: AC', 'Group {6,7}: AB', 'F = AB + AC + BC'], isText: true }
      ];
      var c = randChoice(cases);
      return { prompt: 'Simplify: ' + c.desc, unit: '', answer: c.ans, tol: 0, steps: c.steps, isText: c.isText };
    }
  ];

  /* ================================================================
     QUIZ \u2014 15 questions (10 MCQ + 5 numeric)
     ================================================================ */

  var QUIZ_POOL = [
    { type: 'mcq', q: 'Why are K-Map rows/columns ordered in Gray code?', opts: ['For aesthetic reasons', 'So adjacent cells differ by 1 bit', 'To match binary counting', 'To simplify manufacturing'], ans: 1 },
    { type: 'mcq', q: 'A group of 4 in a K-Map eliminates how many variables?', opts: ['1', '2', '3', '4'], ans: 1 },
    { type: 'mcq', q: 'Which group size is NOT valid in a K-Map?', opts: ['1', '2', '3', '8'], ans: 2 },
    { type: 'mcq', q: "Don't-care conditions in a K-Map are marked with:", opts: ['0', '1', 'X', 'D'], ans: 2 },
    { type: 'mcq', q: 'The K-Map is topologically equivalent to a:', opts: ['Plane', 'Cylinder', 'Torus', 'Sphere'], ans: 2 },
    { type: 'mcq', q: 'An essential prime implicant is one that:', opts: ['Covers the most cells', 'Is the only PI covering some minterm', 'Contains no variables', 'Has the fewest literals'], ans: 1 },
    { type: 'mcq', q: 'SOP stands for:', opts: ['Sum of Products', 'Set of Primes', 'Standard Output Protocol', 'System of Polynomials'], ans: 0 },
    { type: 'mcq', q: 'To find POS from a K-Map, you group the:', opts: ['1-cells', '0-cells', 'X-cells', 'All cells'], ans: 1 },
    { type: 'mcq', q: 'A 5-variable K-Map consists of:', opts: ['One 4\u00D78 grid', 'Two 4\u00D74 grids', 'One 8\u00D74 grid', 'Four 2\u00D74 grids'], ans: 1 },
    { type: 'mcq', q: 'In BCD-to-7-segment, inputs 10-15 are:', opts: ['Always 0', 'Always 1', "Don't-care", 'Invalid and ignored'], ans: 2 },
    { type: 'num', q: 'How many cells in a 4-variable K-Map?', ans: 16, tol: 0, unit: 'cells' },
    { type: 'num', q: 'A group of 8 eliminates how many variables?', ans: 3, tol: 0, unit: '' },
    { type: 'num', q: 'In a 4-var K-Map, what minterm is at row AB=11, col CD=11?', ans: 15, tol: 0, unit: '' },
    { type: 'num', q: 'How many prime implicants does a single isolated 1-cell produce?', ans: 1, tol: 0, unit: '' },
    { type: 'num', q: '3-variable odd parity function has how many minterms?', ans: 4, tol: 0, unit: 'minterms' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var kmapGrid = document.getElementById('kmap-grid');
  var varTabs = document.getElementById('var-tabs');
  var presetTabs = document.getElementById('preset-tabs');
  var expressionOutput = document.getElementById('expression-output');
  var truthTable = document.getElementById('truth-table');
  var sopPosToggle = document.getElementById('sop-pos-toggle');
  var showGroupsChk = document.getElementById('chk-groups');
  var showStepsChk = document.getElementById('chk-steps');
  var stepPanel = document.getElementById('step-panel');
  var stepContent = document.getElementById('step-content');

  var rVars = document.getElementById('r-vars');
  var rMinterms = document.getElementById('r-minterms');
  var rGroups = document.getElementById('r-groups');
  var rSaved = document.getElementById('r-saved');

  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var numVars = 4;
  var showSOP = true;
  var showGroups = true;
  var showSteps = false;
  var currentPreset = 'custom';
  var subPreset = null; /* for common-logic sub-maps */

  /* K-Map cell values: array indexed by minterm number, value = 0, 1, or 'X' */
  var cellValues = [];
  var mintermMap = [];  /* grid index -> minterm number */
  var reverseMap = {};  /* minterm -> {grid, row, col} */

  /* Simplification results */
  var solveResult = null;

  /* Explore state */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  /* Practice state */
  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* Undo/Redo stacks */
  var undoStack = [];
  var redoStack = [];
  var MAX_UNDO = 50;

  /* Group colors */
  var GROUP_COLORS = [
    { fill: 'rgba(66, 165, 245, 0.20)', stroke: '#42a5f5' },
    { fill: 'rgba(239, 83, 80, 0.20)', stroke: '#ef5350' },
    { fill: 'rgba(102, 187, 106, 0.20)', stroke: '#66bb6a' },
    { fill: 'rgba(255, 167, 38, 0.20)', stroke: '#ffa726' },
    { fill: 'rgba(171, 71, 188, 0.20)', stroke: '#ab47bc' },
    { fill: 'rgba(38, 198, 218, 0.20)', stroke: '#26c6da' }
  ];

  /* ================================================================
     INITIALIZATION
     ================================================================ */

  function initKmap() {
    var total = Math.pow(2, numVars);
    cellValues = [];
    for (var i = 0; i < total; i++) cellValues.push(0);
    mintermMap = buildMintermMap(numVars);
    reverseMap = buildReverseMap(numVars);
    solveResult = null;
  }

  /* ================================================================
     UNDO / REDO
     ================================================================ */

  function saveUndo() {
    undoStack.push({ numVars: numVars, values: cellValues.slice() });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    redoStack.push({ numVars: numVars, values: cellValues.slice() });
    var state = undoStack.pop();
    numVars = state.numVars;
    cellValues = state.values;
    mintermMap = buildMintermMap(numVars);
    reverseMap = buildReverseMap(numVars);
    updateVarTabs();
    solve();
    renderKmap();
    renderTruthTable();
    updateStepPanel();
  }

  function performRedo() {
    if (redoStack.length === 0) return;
    undoStack.push({ numVars: numVars, values: cellValues.slice() });
    var state = redoStack.pop();
    numVars = state.numVars;
    cellValues = state.values;
    mintermMap = buildMintermMap(numVars);
    reverseMap = buildReverseMap(numVars);
    updateVarTabs();
    solve();
    renderKmap();
    renderTruthTable();
    updateStepPanel();
  }

  /* ================================================================
     EXPORT FUNCTIONS
     ================================================================ */

  function exportCSV() {
    if (!solveResult) return;
    var total = Math.pow(2, numVars);
    var rows = [];
    var header = [];
    for (var v = 0; v < numVars; v++) header.push(VAR_NAMES[v]);
    header.push('F');
    rows.push(header.join(','));
    for (var m = 0; m < total; m++) {
      var row = [];
      for (var b = numVars - 1; b >= 0; b--) {
        row.push((m >> b) & 1);
      }
      var val = cellValues[m];
      row.push(val === 'X' ? 'X' : val);
      rows.push(row.join(','));
    }
    var expr = showSOP ? solveResult.sopExpr : solveResult.posExpr;
    rows.push('');
    rows.push('Expression,' + expr);
    rows.push('Form,' + (showSOP ? 'SOP' : 'POS'));
    rows.push('Variables,' + numVars);

    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kmap-truth-table.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPNG() {
    var grid = document.getElementById('kmap-grid');
    if (!grid) return;
    /* Use html2canvas-like approach: render grid to a temporary canvas */
    var rect = grid.getBoundingClientRect();
    var canvas = document.createElement('canvas');
    var scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, rect.width, rect.height);

    /* Draw table structure from DOM data */
    var tables = grid.querySelectorAll('.kmap-table');
    var labels = grid.querySelectorAll('.kmap-grid-label');
    var offsetY = 0;

    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      if (labels[t]) {
        ctx.fillStyle = '#ab47bc';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(labels[t].textContent, rect.width / 2, offsetY + 16);
        offsetY += 24;
      }
      var tRect = table.getBoundingClientRect();
      var cells = table.querySelectorAll('th, td');
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var cRect = cell.getBoundingClientRect();
        var x = cRect.left - rect.left;
        var y = cRect.top - rect.top;
        var w = cRect.width;
        var h = cRect.height;

        if (cell.style.backgroundColor) {
          ctx.fillStyle = cell.style.backgroundColor;
          ctx.fillRect(x, y, w, h);
        }

        ctx.strokeStyle = '#2a3050';
        ctx.lineWidth = 1;
        if (cell.tagName === 'TD') ctx.strokeRect(x, y, w, h);

        var computed = window.getComputedStyle(cell);
        ctx.fillStyle = computed.color;
        ctx.font = computed.fontWeight + ' ' + computed.fontSize + ' ' + computed.fontFamily.split(',')[0].replace(/"/g, '');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.textContent.trim(), x + w / 2, y + h / 2);
      }
    }

    /* Watermark */
    ctx.fillStyle = 'rgba(171,71,188,0.3)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('NHIT VisualLab', rect.width - 8, rect.height - 6);

    canvas.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kmap-' + numVars + 'var.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  function copyExpression() {
    if (!solveResult) return;
    var expr = showSOP ? solveResult.sopExpr : solveResult.posExpr;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(expr);
    }
  }

  function clearAllCells() {
    saveUndo();
    var total = Math.pow(2, numVars);
    for (var i = 0; i < total; i++) cellValues[i] = 0;
    solve();
    renderKmap();
    renderTruthTable();
    updateStepPanel();
  }

  /* ================================================================
     QUINE-McCLUSKEY ALGORITHM
     ================================================================ */

  function implicantToString(bits, numV) {
    var s = '';
    for (var i = numV - 1; i >= 0; i--) {
      s += bits[i];
    }
    return s;
  }

  function mintermToBits(m, numV) {
    var bits = [];
    for (var i = 0; i < numV; i++) {
      bits.push((m >> i) & 1);
    }
    return bits;
  }

  function bitsToString(bits) {
    var s = '';
    for (var i = bits.length - 1; i >= 0; i--) {
      s += bits[i] === '-' ? '-' : bits[i];
    }
    return s;
  }

  function countOnesInBits(bits) {
    var c = 0;
    for (var i = 0; i < bits.length; i++) {
      if (bits[i] === 1) c++;
    }
    return c;
  }

  function bitsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function combineBits(a, b) {
    /* Try to combine two implicants that differ in exactly 1 position */
    var diffCount = 0, diffPos = -1;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        if (a[i] === '-' || b[i] === '-') return null; /* can't combine if dash differs */
        diffCount++;
        diffPos = i;
        if (diffCount > 1) return null;
      }
    }
    if (diffCount !== 1) return null;
    var result = a.slice();
    result[diffPos] = '-';
    return result;
  }

  function implicantCovers(impl, minterm, numV) {
    var bits = mintermToBits(minterm, numV);
    for (var i = 0; i < numV; i++) {
      if (impl[i] !== '-' && impl[i] !== bits[i]) return false;
    }
    return true;
  }

  function implicantToTerm(impl, numV, isSOP) {
    var vars = [];
    for (var i = numV - 1; i >= 0; i--) {
      if (impl[i] === '-') continue;
      var vname = VAR_NAMES[numV - 1 - i];
      if (isSOP) {
        vars.push(impl[i] === 1 ? vname : vname + "'");
      } else {
        /* POS: 0 -> uncomplemented, 1 -> complemented */
        vars.push(impl[i] === 0 ? vname : vname + "'");
      }
    }
    if (vars.length === 0) return isSOP ? '1' : '0';
    if (isSOP) {
      return vars.join('');
    } else {
      return '(' + vars.join(' + ') + ')';
    }
  }

  function getCoveredMinterms(impl, numV) {
    var covered = [];
    var total = Math.pow(2, numV);
    for (var m = 0; m < total; m++) {
      if (implicantCovers(impl, m, numV)) covered.push(m);
    }
    return covered;
  }

  function quineMcCluskey(minterms, dontCares, nVars) {
    var steps = [];
    var allTerms = minterms.concat(dontCares);

    if (allTerms.length === 0) {
      return {
        primeImplicants: [],
        essentialPIs: [],
        sopExpr: 'F = 0',
        posExpr: 'F = 0',
        groups: [],
        steps: ['No minterms specified.', 'F = 0'],
        literalsSaved: 0
      };
    }

    /* Check if all minterms are present (function is always 1) */
    var totalCells = Math.pow(2, nVars);
    if (minterms.length === totalCells) {
      return {
        primeImplicants: [],
        essentialPIs: [],
        sopExpr: 'F = 1',
        posExpr: 'F = 1',
        groups: [{ impl: [], minterms: minterms }],
        steps: ['All cells are 1.', 'F = 1'],
        literalsSaved: minterms.length * nVars
      };
    }

    steps.push('Minterms: {' + minterms.join(', ') + '}');
    if (dontCares.length > 0) {
      steps.push("Don't-cares: {" + dontCares.join(', ') + '}');
    }

    /* Step 1: Convert to bit representation and group by 1-count */
    var implicants = [];
    for (var i = 0; i < allTerms.length; i++) {
      var bits = mintermToBits(allTerms[i], nVars);
      implicants.push({
        bits: bits,
        minterms: [allTerms[i]],
        combined: false
      });
    }

    /* Sort and group by 1-count */
    var maxOnes = nVars;
    var groupText = 'Group by 1-count: ';
    var groupParts = [];
    for (var g = 0; g <= maxOnes; g++) {
      var inGroup = [];
      for (var j = 0; j < implicants.length; j++) {
        if (countOnesInBits(implicants[j].bits) === g) {
          inGroup.push('m' + implicants[j].minterms[0]);
        }
      }
      if (inGroup.length > 0) {
        groupParts.push(g + '-ones: {' + inGroup.join(', ') + '}');
      }
    }
    steps.push(groupText + groupParts.join('; '));

    /* Step 2: Iteratively combine */
    var allPIs = [];
    var round = 0;
    var currentImplicants = implicants;

    while (currentImplicants.length > 0) {
      var nextImplicants = [];
      var usedInCombination = [];
      for (var a = 0; a < currentImplicants.length; a++) usedInCombination.push(false);

      var combineSteps = [];

      for (var a2 = 0; a2 < currentImplicants.length; a2++) {
        for (var b2 = a2 + 1; b2 < currentImplicants.length; b2++) {
          var combined = combineBits(currentImplicants[a2].bits, currentImplicants[b2].bits);
          if (combined) {
            usedInCombination[a2] = true;
            usedInCombination[b2] = true;

            /* Check if this combined implicant already exists */
            var alreadyExists = false;
            for (var e = 0; e < nextImplicants.length; e++) {
              if (bitsEqual(nextImplicants[e].bits, combined)) {
                alreadyExists = true;
                /* Merge minterms */
                var existingMs = nextImplicants[e].minterms;
                var newMs = currentImplicants[a2].minterms.concat(currentImplicants[b2].minterms);
                for (var nm = 0; nm < newMs.length; nm++) {
                  if (existingMs.indexOf(newMs[nm]) === -1) existingMs.push(newMs[nm]);
                }
                break;
              }
            }

            if (!alreadyExists) {
              var mergedMinterms = currentImplicants[a2].minterms.concat(currentImplicants[b2].minterms);
              /* Deduplicate */
              var unique = [];
              for (var u = 0; u < mergedMinterms.length; u++) {
                if (unique.indexOf(mergedMinterms[u]) === -1) unique.push(mergedMinterms[u]);
              }
              nextImplicants.push({
                bits: combined,
                minterms: unique,
                combined: false
              });
              combineSteps.push(bitsToString(currentImplicants[a2].bits) + ' + ' + bitsToString(currentImplicants[b2].bits) + ' = ' + bitsToString(combined));
            }
          }
        }
      }

      /* Uncombined -> prime implicants */
      for (var p = 0; p < currentImplicants.length; p++) {
        if (!usedInCombination[p]) {
          allPIs.push(currentImplicants[p]);
        }
      }

      if (combineSteps.length > 0) {
        steps.push('Round ' + (round + 1) + ' combinations: ' + combineSteps.slice(0, 6).join('; ') + (combineSteps.length > 6 ? ' ... (' + combineSteps.length + ' total)' : ''));
      }

      currentImplicants = nextImplicants;
      round++;
    }

    /* Deduplicate PIs by bits */
    var uniquePIs = [];
    for (var pi = 0; pi < allPIs.length; pi++) {
      var dup = false;
      for (var upi = 0; upi < uniquePIs.length; upi++) {
        if (bitsEqual(uniquePIs[upi].bits, allPIs[pi].bits)) {
          dup = true;
          break;
        }
      }
      if (!dup) uniquePIs.push(allPIs[pi]);
    }

    var piLabels = [];
    for (var pl = 0; pl < uniquePIs.length; pl++) {
      piLabels.push(bitsToString(uniquePIs[pl].bits) + ' (' + implicantToTerm(uniquePIs[pl].bits, nVars, true) + ')');
    }
    steps.push('Prime implicants: ' + piLabels.join(', '));

    /* Step 3: Build coverage chart (minterms only, NOT don't-cares) */
    /* Each PI: which minterms does it cover? */
    var piCoverage = [];
    for (var pc = 0; pc < uniquePIs.length; pc++) {
      var covered = [];
      for (var mc = 0; mc < minterms.length; mc++) {
        if (implicantCovers(uniquePIs[pc].bits, minterms[mc], nVars)) {
          covered.push(minterms[mc]);
        }
      }
      piCoverage.push(covered);
    }

    /* Step 4: Find essential PIs */
    var essentialIdxs = [];
    var coveredMinterms = {};

    for (var mt = 0; mt < minterms.length; mt++) {
      var coveringPIs = [];
      for (var cp = 0; cp < uniquePIs.length; cp++) {
        if (piCoverage[cp].indexOf(minterms[mt]) !== -1) {
          coveringPIs.push(cp);
        }
      }
      if (coveringPIs.length === 1) {
        if (essentialIdxs.indexOf(coveringPIs[0]) === -1) {
          essentialIdxs.push(coveringPIs[0]);
        }
      }
    }

    /* Mark minterms covered by essential PIs */
    for (var ei = 0; ei < essentialIdxs.length; ei++) {
      var cov = piCoverage[essentialIdxs[ei]];
      for (var ci = 0; ci < cov.length; ci++) {
        coveredMinterms[cov[ci]] = true;
      }
    }

    var epiLabels = [];
    for (var el = 0; el < essentialIdxs.length; el++) {
      epiLabels.push(implicantToTerm(uniquePIs[essentialIdxs[el]].bits, nVars, true));
    }
    if (epiLabels.length > 0) {
      steps.push('Essential PIs: ' + epiLabels.join(', '));
    }

    /* Step 5: Petrick's method for remaining minterms */
    var uncoveredMinterms = [];
    for (var um = 0; um < minterms.length; um++) {
      if (!coveredMinterms[minterms[um]]) {
        uncoveredMinterms.push(minterms[um]);
      }
    }

    var selectedPIs = essentialIdxs.slice();

    if (uncoveredMinterms.length > 0) {
      /* Greedy covering: pick PI that covers most uncovered minterms */
      var remaining = uncoveredMinterms.slice();
      while (remaining.length > 0) {
        var bestPI = -1, bestCount = 0;
        for (var bp = 0; bp < uniquePIs.length; bp++) {
          if (selectedPIs.indexOf(bp) !== -1) continue;
          var cnt = 0;
          for (var rc = 0; rc < remaining.length; rc++) {
            if (piCoverage[bp].indexOf(remaining[rc]) !== -1) cnt++;
          }
          if (cnt > bestCount) {
            bestCount = cnt;
            bestPI = bp;
          }
        }
        if (bestPI === -1) break; /* shouldn't happen */
        selectedPIs.push(bestPI);
        /* Remove covered minterms */
        var newRemaining = [];
        for (var nr = 0; nr < remaining.length; nr++) {
          if (piCoverage[bestPI].indexOf(remaining[nr]) === -1) {
            newRemaining.push(remaining[nr]);
          }
        }
        remaining = newRemaining;
      }
    }

    /* Build SOP expression */
    var sopTerms = [];
    var groups = [];
    for (var si = 0; si < selectedPIs.length; si++) {
      var pi2 = uniquePIs[selectedPIs[si]];
      sopTerms.push(implicantToTerm(pi2.bits, nVars, true));
      groups.push({
        impl: pi2.bits,
        minterms: getCoveredMinterms(pi2.bits, nVars),
        term: implicantToTerm(pi2.bits, nVars, true),
        isEssential: essentialIdxs.indexOf(selectedPIs[si]) !== -1
      });
    }

    var sopExpr = sopTerms.length > 0 ? 'F = ' + sopTerms.join(' + ') : 'F = 0';

    /* Build POS expression from 0-cells */
    var zeroMinterms = [];
    for (var zm = 0; zm < totalCells; zm++) {
      if (minterms.indexOf(zm) === -1 && dontCares.indexOf(zm) === -1) {
        zeroMinterms.push(zm);
      }
    }

    var posExpr = '';
    if (zeroMinterms.length === 0) {
      posExpr = 'F = 1';
    } else if (zeroMinterms.length === totalCells - dontCares.length) {
      posExpr = 'F = 0';
    } else {
      /* Run QM on zeros to get POS */
      var posResult = quineMcCluskeyCore(zeroMinterms, dontCares, nVars);
      var posTerms = [];
      for (var pt = 0; pt < posResult.selectedPIs.length; pt++) {
        var posPi = posResult.uniquePIs[posResult.selectedPIs[pt]];
        posTerms.push(implicantToTerm(posPi.bits, nVars, false));
      }
      posExpr = posTerms.length > 0 ? 'F = ' + posTerms.join('') : 'F = 1';
    }

    /* Count literals saved */
    var canonicalLiterals = minterms.length * nVars;
    var minimalLiterals = 0;
    for (var ml = 0; ml < selectedPIs.length; ml++) {
      var impl2 = uniquePIs[selectedPIs[ml]].bits;
      for (var mlb = 0; mlb < impl2.length; mlb++) {
        if (impl2[mlb] !== '-') minimalLiterals++;
      }
    }
    var literalsSaved = canonicalLiterals - minimalLiterals;

    steps.push('Final: ' + sopExpr);

    return {
      primeImplicants: uniquePIs,
      essentialPIs: essentialIdxs,
      selectedPIs: selectedPIs,
      sopExpr: sopExpr,
      posExpr: posExpr,
      groups: groups,
      steps: steps,
      literalsSaved: literalsSaved,
      minimalLiterals: minimalLiterals
    };
  }

  /* Core QM without step tracking (used for POS) */
  function quineMcCluskeyCore(minterms, dontCares, nVars) {
    var allTerms = minterms.concat(dontCares);
    if (allTerms.length === 0) {
      return { uniquePIs: [], selectedPIs: [] };
    }

    var implicants = [];
    for (var i = 0; i < allTerms.length; i++) {
      implicants.push({
        bits: mintermToBits(allTerms[i], nVars),
        minterms: [allTerms[i]],
        combined: false
      });
    }

    var allPIs = [];
    var currentImplicants = implicants;

    while (currentImplicants.length > 0) {
      var nextImplicants = [];
      var used = [];
      for (var a = 0; a < currentImplicants.length; a++) used.push(false);

      for (var a2 = 0; a2 < currentImplicants.length; a2++) {
        for (var b2 = a2 + 1; b2 < currentImplicants.length; b2++) {
          var combined = combineBits(currentImplicants[a2].bits, currentImplicants[b2].bits);
          if (combined) {
            used[a2] = true;
            used[b2] = true;
            var exists = false;
            for (var e = 0; e < nextImplicants.length; e++) {
              if (bitsEqual(nextImplicants[e].bits, combined)) {
                exists = true;
                var em = nextImplicants[e].minterms;
                var nm2 = currentImplicants[a2].minterms.concat(currentImplicants[b2].minterms);
                for (var k = 0; k < nm2.length; k++) {
                  if (em.indexOf(nm2[k]) === -1) em.push(nm2[k]);
                }
                break;
              }
            }
            if (!exists) {
              var merged = currentImplicants[a2].minterms.concat(currentImplicants[b2].minterms);
              var uniq = [];
              for (var u = 0; u < merged.length; u++) {
                if (uniq.indexOf(merged[u]) === -1) uniq.push(merged[u]);
              }
              nextImplicants.push({ bits: combined, minterms: uniq, combined: false });
            }
          }
        }
      }

      for (var p = 0; p < currentImplicants.length; p++) {
        if (!used[p]) allPIs.push(currentImplicants[p]);
      }
      currentImplicants = nextImplicants;
    }

    /* Deduplicate */
    var uniquePIs = [];
    for (var pi = 0; pi < allPIs.length; pi++) {
      var dup = false;
      for (var upi = 0; upi < uniquePIs.length; upi++) {
        if (bitsEqual(uniquePIs[upi].bits, allPIs[pi].bits)) { dup = true; break; }
      }
      if (!dup) uniquePIs.push(allPIs[pi]);
    }

    var piCoverage = [];
    for (var pc = 0; pc < uniquePIs.length; pc++) {
      var cov = [];
      for (var mc = 0; mc < minterms.length; mc++) {
        if (implicantCovers(uniquePIs[pc].bits, minterms[mc], nVars)) cov.push(minterms[mc]);
      }
      piCoverage.push(cov);
    }

    var essentialIdxs = [];
    var coveredM = {};
    for (var mt = 0; mt < minterms.length; mt++) {
      var covering = [];
      for (var cp = 0; cp < uniquePIs.length; cp++) {
        if (piCoverage[cp].indexOf(minterms[mt]) !== -1) covering.push(cp);
      }
      if (covering.length === 1 && essentialIdxs.indexOf(covering[0]) === -1) {
        essentialIdxs.push(covering[0]);
      }
    }

    for (var ei = 0; ei < essentialIdxs.length; ei++) {
      var c2 = piCoverage[essentialIdxs[ei]];
      for (var ci = 0; ci < c2.length; ci++) coveredM[c2[ci]] = true;
    }

    var selected = essentialIdxs.slice();
    var uncov = [];
    for (var um = 0; um < minterms.length; um++) {
      if (!coveredM[minterms[um]]) uncov.push(minterms[um]);
    }

    while (uncov.length > 0) {
      var best = -1, bestC = 0;
      for (var bp = 0; bp < uniquePIs.length; bp++) {
        if (selected.indexOf(bp) !== -1) continue;
        var cnt = 0;
        for (var rc = 0; rc < uncov.length; rc++) {
          if (piCoverage[bp].indexOf(uncov[rc]) !== -1) cnt++;
        }
        if (cnt > bestC) { bestC = cnt; best = bp; }
      }
      if (best === -1) break;
      selected.push(best);
      var nu = [];
      for (var nr = 0; nr < uncov.length; nr++) {
        if (piCoverage[best].indexOf(uncov[nr]) === -1) nu.push(uncov[nr]);
      }
      uncov = nu;
    }

    return { uniquePIs: uniquePIs, selectedPIs: selected };
  }

  /* ================================================================
     BOOLEAN EXPRESSION PARSER
     ================================================================ */

  function parseExpression(expr, nVars) {
    /* Parse a Boolean expression and return the set of minterms where F=1 */
    /* Supports: juxtaposition (AND), + (OR), ' (NOT), parentheses */
    var tokens = tokenize(expr, nVars);
    if (!tokens) return null;
    var pos = { idx: 0 };
    var tree = parseOr(tokens, pos);
    if (!tree) return null;

    /* Evaluate for all input combinations */
    var total = Math.pow(2, nVars);
    var minterms = [];
    for (var m = 0; m < total; m++) {
      var vars2 = {};
      for (var v = 0; v < nVars; v++) {
        vars2[VAR_NAMES[v]] = (m >> (nVars - 1 - v)) & 1;
      }
      if (evalTree(tree, vars2)) minterms.push(m);
    }
    return minterms;
  }

  function tokenize(expr, nVars) {
    var tokens = [];
    var validVars = {};
    for (var v = 0; v < nVars; v++) validVars[VAR_NAMES[v]] = true;
    /* Also accept lowercase */
    for (var v2 = 0; v2 < nVars; v2++) validVars[VAR_NAMES[v2].toLowerCase()] = true;

    var i = 0;
    while (i < expr.length) {
      var ch = expr[i];
      if (ch === ' ' || ch === 'F' || ch === 'f' || ch === '=') { i++; continue; }
      if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
      if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
      if (ch === '+') { tokens.push({ type: 'or' }); i++; continue; }
      if (ch === "'") { tokens.push({ type: 'not' }); i++; continue; }
      if (ch === '\u0305') { tokens.push({ type: 'not' }); i++; continue; } /* overline */
      if (ch === '*' || ch === '\u00B7' || ch === '.') { tokens.push({ type: 'and' }); i++; continue; }

      var upper = ch.toUpperCase();
      if (validVars[upper] || validVars[ch]) {
        tokens.push({ type: 'var', name: upper });
        i++;
        continue;
      }

      if (ch === '0' || ch === '1') {
        tokens.push({ type: 'const', value: parseInt(ch) });
        i++;
        continue;
      }

      /* Skip unknown characters */
      i++;
    }
    return tokens;
  }

  function parseOr(tokens, pos) {
    var left = parseAnd(tokens, pos);
    if (!left) return null;
    while (pos.idx < tokens.length && tokens[pos.idx].type === 'or') {
      pos.idx++;
      var right = parseAnd(tokens, pos);
      if (!right) return null;
      left = { type: 'or', left: left, right: right };
    }
    return left;
  }

  function parseAnd(tokens, pos) {
    var left = parseUnary(tokens, pos);
    if (!left) return null;
    /* Implicit AND: next token is var, const, or lparen (no explicit operator) */
    while (pos.idx < tokens.length) {
      var next = tokens[pos.idx];
      if (next.type === 'and') {
        pos.idx++;
        var right = parseUnary(tokens, pos);
        if (!right) return null;
        left = { type: 'and', left: left, right: right };
      } else if (next.type === 'var' || next.type === 'const' || next.type === 'lparen') {
        var right2 = parseUnary(tokens, pos);
        if (!right2) return null;
        left = { type: 'and', left: left, right: right2 };
      } else {
        break;
      }
    }
    return left;
  }

  function parseUnary(tokens, pos) {
    if (pos.idx >= tokens.length) return null;
    var node = parsePrimary(tokens, pos);
    if (!node) return null;
    /* Post-fix NOT (apostrophe) */
    while (pos.idx < tokens.length && tokens[pos.idx].type === 'not') {
      pos.idx++;
      node = { type: 'not', child: node };
    }
    return node;
  }

  function parsePrimary(tokens, pos) {
    if (pos.idx >= tokens.length) return null;
    var tok = tokens[pos.idx];
    if (tok.type === 'var') {
      pos.idx++;
      return { type: 'var', name: tok.name };
    }
    if (tok.type === 'const') {
      pos.idx++;
      return { type: 'const', value: tok.value };
    }
    if (tok.type === 'lparen') {
      pos.idx++;
      var inner = parseOr(tokens, pos);
      if (pos.idx < tokens.length && tokens[pos.idx].type === 'rparen') {
        pos.idx++;
      }
      return inner;
    }
    return null;
  }

  function evalTree(node, vars2) {
    if (!node) return 0;
    if (node.type === 'var') return vars2[node.name] || 0;
    if (node.type === 'const') return node.value;
    if (node.type === 'not') return evalTree(node.child, vars2) ? 0 : 1;
    if (node.type === 'and') return (evalTree(node.left, vars2) && evalTree(node.right, vars2)) ? 1 : 0;
    if (node.type === 'or') return (evalTree(node.left, vars2) || evalTree(node.right, vars2)) ? 1 : 0;
    return 0;
  }

  /* ================================================================
     SOLVE (extract minterms from cellValues and run QM)
     ================================================================ */

  function solve() {
    var minterms = [];
    var dontCares = [];
    var total = Math.pow(2, numVars);

    for (var i = 0; i < total; i++) {
      if (cellValues[i] === 1) minterms.push(i);
      else if (cellValues[i] === 'X') dontCares.push(i);
    }

    solveResult = quineMcCluskey(minterms, dontCares, numVars);
    updateOutput();
  }

  /* ================================================================
     K-MAP GRID RENDERING (HTML-based)
     ================================================================ */

  function renderKmap() {
    if (!kmapGrid) return;
    kmapGrid.innerHTML = '';

    var numRows = (numVars <= 3) ? 2 : 4;
    var numCols = (numVars <= 2) ? 2 : 4;
    var grids = (numVars === 5) ? 2 : 1;

    var rowLabels = GRAY_LABELS[numVars].rows;
    var colLabels = GRAY_LABELS[numVars].cols;

    /* Row variable label and column variable label */
    var rowVarLabel, colVarLabel;
    if (numVars === 2) { rowVarLabel = 'A'; colVarLabel = 'B'; }
    else if (numVars === 3) { rowVarLabel = 'A'; colVarLabel = 'BC'; }
    else if (numVars === 4) { rowVarLabel = 'AB'; colVarLabel = 'CD'; }
    else { rowVarLabel = 'AB'; colVarLabel = 'CD'; }

    for (var gIdx = 0; gIdx < grids; gIdx++) {
      var gridWrapper = document.createElement('div');
      gridWrapper.className = 'kmap-grid-wrapper';

      if (numVars === 5) {
        var gridLabel = document.createElement('div');
        gridLabel.className = 'kmap-grid-label';
        gridLabel.textContent = 'E = ' + gIdx;
        gridWrapper.appendChild(gridLabel);
      }

      var table = document.createElement('table');
      table.className = 'kmap-table';

      /* Header row: corner + col labels */
      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');

      var cornerCell = document.createElement('th');
      cornerCell.className = 'kmap-corner';
      cornerCell.innerHTML = '<span class="kmap-row-var">' + rowVarLabel + '</span>\\<span class="kmap-col-var">' + colVarLabel + '</span>';
      headerRow.appendChild(cornerCell);

      for (var c = 0; c < numCols; c++) {
        var th = document.createElement('th');
        th.className = 'kmap-col-header';
        th.textContent = colLabels[c];
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      /* Body rows */
      var tbody = document.createElement('tbody');
      for (var r = 0; r < numRows; r++) {
        var tr = document.createElement('tr');

        var rowHeader = document.createElement('th');
        rowHeader.className = 'kmap-row-header';
        rowHeader.textContent = rowLabels[r];
        tr.appendChild(rowHeader);

        for (var c2 = 0; c2 < numCols; c2++) {
          var gridIndex = gIdx * numRows * numCols + r * numCols + c2;
          var minterm = mintermMap[gridIndex];
          var val = cellValues[minterm];

          var td = document.createElement('td');
          td.className = 'kmap-cell';
          td.setAttribute('data-minterm', minterm);
          td.setAttribute('data-grid', gIdx);
          td.setAttribute('data-row', r);
          td.setAttribute('data-col', c2);

          var valSpan = document.createElement('span');
          valSpan.className = 'kmap-cell-value';
          if (val === 1) {
            valSpan.textContent = '1';
            td.classList.add('one');
          } else if (val === 'X') {
            valSpan.textContent = 'X';
            td.classList.add('dc');
          } else {
            valSpan.textContent = '0';
            td.classList.add('zero');
          }
          td.appendChild(valSpan);

          var mintLabel = document.createElement('span');
          mintLabel.className = 'kmap-cell-minterm';
          mintLabel.textContent = 'm' + minterm;
          td.appendChild(mintLabel);

          /* Click handler to cycle value */
          (function (mt) {
            td.addEventListener('click', function () {
              if (mode !== 'simulate') return;
              saveUndo();
              var curVal = cellValues[mt];
              if (curVal === 0) cellValues[mt] = 1;
              else if (curVal === 1) cellValues[mt] = 'X';
              else cellValues[mt] = 0;
              solve();
              renderKmap();
              renderTruthTable();
              updateReadouts();
              dismissHint();
            });
          })(minterm);

          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      gridWrapper.appendChild(table);
      kmapGrid.appendChild(gridWrapper);
    }

    /* Draw group overlays if enabled */
    if (showGroups && solveResult && solveResult.groups.length > 0) {
      renderGroupOverlays();
    }
  }

  /* ================================================================
     GROUP OVERLAYS (visual rectangles on K-Map)
     ================================================================ */

  function renderGroupOverlays() {
    if (!solveResult || !solveResult.groups) return;

    var numRows = (numVars <= 3) ? 2 : 4;
    var numCols = (numVars <= 2) ? 2 : 4;
    var grids = (numVars === 5) ? 2 : 1;

    /* For each group, find the cells, determine bounding rectangle(s) */
    for (var gi = 0; gi < solveResult.groups.length; gi++) {
      var group = solveResult.groups[gi];
      var color = GROUP_COLORS[gi % GROUP_COLORS.length];

      /* Get positions of all minterms in this group */
      var positions = []; /* {grid, row, col} */
      for (var mi = 0; mi < group.minterms.length; mi++) {
        var pos = reverseMap[group.minterms[mi]];
        if (pos) positions.push(pos);
      }

      if (positions.length === 0) continue;

      /* For each grid, find the cells that belong to this group */
      for (var gIdx = 0; gIdx < grids; gIdx++) {
        var gridPositions = [];
        for (var pi = 0; pi < positions.length; pi++) {
          if (positions[pi].grid === gIdx) gridPositions.push(positions[pi]);
        }
        if (gridPositions.length === 0) continue;

        /* Find bounding rows and cols (respecting wrap-around) */
        var rowSet = {}, colSet = {};
        for (var gp = 0; gp < gridPositions.length; gp++) {
          rowSet[gridPositions[gp].row] = true;
          colSet[gridPositions[gp].col] = true;
        }
        var rows = Object.keys(rowSet).map(function (x) { return parseInt(x); }).sort(function (a, b) { return a - b; });
        var cols = Object.keys(colSet).map(function (x) { return parseInt(x); }).sort(function (a, b) { return a - b; });

        /* Mark cells with group color */
        for (var gp2 = 0; gp2 < gridPositions.length; gp2++) {
          var p2 = gridPositions[gp2];
          var cellEl = kmapGrid.querySelector('td[data-minterm="' + group.minterms.filter(function (mt) {
            var rev = reverseMap[mt];
            return rev && rev.grid === gIdx && rev.row === p2.row && rev.col === p2.col;
          })[0] + '"]');
          if (cellEl) {
            cellEl.style.boxShadow = 'inset 0 0 0 3px ' + color.stroke;
            cellEl.style.backgroundColor = color.fill;
          }
        }
      }
    }
  }

  /* ================================================================
     TRUTH TABLE RENDERING
     ================================================================ */

  function renderTruthTable() {
    if (!truthTable) return;
    var total = Math.pow(2, numVars);

    var html = '<table class="tt-table"><thead><tr>';
    for (var v = 0; v < numVars; v++) {
      html += '<th>' + VAR_NAMES[v] + '</th>';
    }
    html += '<th>F</th></tr></thead><tbody>';

    for (var m = 0; m < total; m++) {
      html += '<tr data-minterm="' + m + '">';
      for (var b = numVars - 1; b >= 0; b--) {
        html += '<td>' + ((m >> b) & 1) + '</td>';
      }
      var val = cellValues[m];
      var valStr = val === 'X' ? 'X' : val;
      var valClass = val === 1 ? 'tt-one' : val === 'X' ? 'tt-dc' : 'tt-zero';
      html += '<td class="tt-output ' + valClass + '" data-minterm="' + m + '">' + valStr + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';

    truthTable.innerHTML = html;

    /* Add click handlers on output column */
    var outputCells = truthTable.querySelectorAll('.tt-output');
    for (var oc = 0; oc < outputCells.length; oc++) {
      (function (cell) {
        cell.addEventListener('click', function () {
          if (mode !== 'simulate') return;
          saveUndo();
          var mt = parseInt(cell.getAttribute('data-minterm'));
          var curVal = cellValues[mt];
          if (curVal === 0) cellValues[mt] = 1;
          else if (curVal === 1) cellValues[mt] = 'X';
          else cellValues[mt] = 0;
          solve();
          renderKmap();
          renderTruthTable();
          updateReadouts();
        });
      })(outputCells[oc]);
    }

    /* Add hover cross-highlighting */
    var ttRows = truthTable.querySelectorAll('tr[data-minterm]');
    for (var tr = 0; tr < ttRows.length; tr++) {
      (function (row) {
        var mt = parseInt(row.getAttribute('data-minterm'));
        row.addEventListener('mouseenter', function () {
          row.classList.add('tt-row-hover');
          var kmCell = kmapGrid.querySelector('td[data-minterm="' + mt + '"]');
          if (kmCell) kmCell.classList.add('kmap-cell-hover');
        });
        row.addEventListener('mouseleave', function () {
          row.classList.remove('tt-row-hover');
          var kmCell = kmapGrid.querySelector('td[data-minterm="' + mt + '"]');
          if (kmCell) kmCell.classList.remove('kmap-cell-hover');
        });
      })(ttRows[tr]);
    }
  }

  /* ================================================================
     OUTPUT & READOUTS
     ================================================================ */

  function updateOutput() {
    if (!expressionOutput) return;
    if (!solveResult) {
      expressionOutput.innerHTML = '<span class="expr-placeholder">Click cells to set values, then view the simplified expression here.</span>';
      return;
    }

    var expr = showSOP ? solveResult.sopExpr : solveResult.posExpr;
    var html = '<div class="expr-result">' + escapeHtml(expr) + '</div>';

    /* Group legend */
    if (showGroups && solveResult.groups.length > 0) {
      html += '<div class="group-legend">';
      for (var gi = 0; gi < solveResult.groups.length; gi++) {
        var g = solveResult.groups[gi];
        var color = GROUP_COLORS[gi % GROUP_COLORS.length];
        html += '<span class="group-legend-item" style="border-color:' + color.stroke + ';background:' + color.fill + '">';
        html += g.term;
        if (g.isEssential) html += ' *';
        html += '</span>';
      }
      html += '</div>';
    }

    expressionOutput.innerHTML = html;
    updateReadouts();
  }

  function updateReadouts() {
    if (rVars) rVars.textContent = numVars;

    var minterms = [];
    var total = Math.pow(2, numVars);
    for (var i = 0; i < total; i++) {
      if (cellValues[i] === 1) minterms.push(i);
    }
    if (rMinterms) rMinterms.textContent = minterms.length;
    if (rGroups) rGroups.textContent = solveResult ? solveResult.groups.length : 0;
    if (rSaved) rSaved.textContent = solveResult ? solveResult.literalsSaved || 0 : 0;
  }

  function updateStepPanel() {
    if (!stepPanel || !stepContent) return;
    stepPanel.style.display = showSteps ? '' : 'none';
    if (!showSteps || !solveResult) return;

    var html = '<ol class="step-list">';
    for (var i = 0; i < solveResult.steps.length; i++) {
      html += '<li>' + escapeHtml(solveResult.steps[i]) + '</li>';
    }
    html += '</ol>';
    stepContent.innerHTML = html;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  /* ================================================================
     PRESET LOADING
     ================================================================ */

  function loadPreset(key, subKey) {
    var preset = PRESETS[key];
    if (!preset) return;

    currentPreset = key;
    subPreset = subKey || null;

    /* Set variable count */
    numVars = preset.vars;
    initKmap();

    /* Load values */
    var values;
    if (preset.maps && subKey) {
      values = preset.maps[subKey];
    } else if (preset.maps) {
      /* Default to first sub-map */
      var firstKey = Object.keys(preset.maps)[0];
      subPreset = firstKey;
      values = preset.maps[firstKey];
    } else {
      values = preset.values;
    }

    if (values) {
      var total = Math.pow(2, numVars);
      for (var i = 0; i < total && i < values.length; i++) {
        cellValues[i] = values[i];
      }
    }

    /* Update var tabs */
    updateVarTabs();
    solve();
    renderKmap();
    renderTruthTable();
    updateStepPanel();
  }

  function updateVarTabs() {
    if (!varTabs) return;
    var pills = varTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', parseInt(pills[i].getAttribute('data-vars')) === numVars);
    }
  }

  function updatePresetTabs() {
    if (!presetTabs) return;
    var pills = presetTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
      var pKey = pills[i].getAttribute('data-preset') || '';
      var isActive = pKey === currentPreset ||
        (currentPreset === 'common-logic' && (pKey === 'and' || pKey === 'or' || pKey === 'xor') && subPreset === pKey.toUpperCase());
      pills[i].classList.toggle('active', isActive);
    }
  }

  /* ================================================================
     EVENT HANDLERS
     ================================================================ */

  /* Variable count pills */
  if (varTabs) {
    varTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      var nv = parseInt(pill.getAttribute('data-vars'));
      if (!nv || nv === numVars) return;
      numVars = nv;
      initKmap();
      updateVarTabs();
      solve();
      renderKmap();
      renderTruthTable();
      updateStepPanel();
    });
  }

  /* Preset pills */
  if (presetTabs) {
    presetTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      var key = pill.getAttribute('data-preset');
      if (!key) return;
      /* Map individual gate presets to common-logic sub-presets */
      if (key === 'and' || key === 'or' || key === 'xor') {
        loadPreset('common-logic', key.toUpperCase());
      } else {
        loadPreset(key);
      }
      updatePresetTabs();

      /* Show sub-preset selector for common-logic */
      renderSubPresetSelector();
    });
  }

  function renderSubPresetSelector() {
    var subSel = document.getElementById('sub-preset-selector');
    if (!subSel) return;

    var preset = PRESETS[currentPreset];
    if (preset && preset.maps) {
      var html = '';
      var keys = Object.keys(preset.maps);
      for (var i = 0; i < keys.length; i++) {
        var active = keys[i] === subPreset ? ' active' : '';
        html += '<button class="pill sub-pill' + active + '" data-sub="' + keys[i] + '">' + keys[i] + '</button>';
      }
      subSel.innerHTML = html;
      subSel.style.display = '';

      subSel.addEventListener('click', function (e) {
        var pill = e.target.closest('.pill');
        if (!pill) return;
        var sk = pill.getAttribute('data-sub');
        loadPreset(currentPreset, sk);
        var subPills = subSel.querySelectorAll('.pill');
        for (var j = 0; j < subPills.length; j++) {
          subPills[j].classList.toggle('active', subPills[j].getAttribute('data-sub') === sk);
        }
      });
    } else {
      subSel.innerHTML = '';
      subSel.style.display = 'none';
    }
  }

  /* SOP/POS toggle */
  if (sopPosToggle) {
    sopPosToggle.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      showSOP = pill.getAttribute('data-value') === 'sop';
      var pills = sopPosToggle.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) {
        pills[i].classList.toggle('active', pills[i].getAttribute('data-value') === (showSOP ? 'sop' : 'pos'));
      }
      updateOutput();
    });
  }

  /* Show groups toggle */
  if (showGroupsChk) {
    showGroupsChk.addEventListener('change', function () {
      showGroups = showGroupsChk.checked;
      renderKmap();
      updateOutput();
    });
  }

  /* Show steps toggle */
  if (showStepsChk) {
    showStepsChk.addEventListener('change', function () {
      showSteps = showStepsChk.checked;
      updateStepPanel();
    });
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function switchMode(m) {
    mode = m;

    if (simPanel) simPanel.style.display = m === 'simulate' ? '' : 'none';
    if (catRow) catRow.style.display = m === 'explore' ? '' : 'none';
    if (itemSelector) itemSelector.style.display = m === 'explore' ? '' : 'none';
    if (itemInfo) itemInfo.style.display = 'none';
    if (practicePanel) practicePanel.style.display = m === 'practice' ? '' : 'none';
    if (practiceBar) practiceBar.style.display = m === 'practice' ? '' : 'none';
    if (quizPanel) quizPanel.style.display = m === 'quiz' ? '' : 'none';
    if (quizBar) quizBar.style.display = m === 'quiz' ? '' : 'none';
    if (quizResult) quizResult.style.display = 'none';

    var modeTabs = document.getElementById('mode-tabs');
    if (modeTabs) {
      var pills = modeTabs.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) {
        pills[i].classList.toggle('active', pills[i].getAttribute('data-mode') === m);
      }
    }

    if (m === 'simulate') {
      renderKmap();
      renderTruthTable();
    }
    if (m === 'explore') renderConceptGrid();
    if (m === 'practice') generateProblem();
    if (m === 'quiz') startQuiz();
  }

  var modeTabs = document.getElementById('mode-tabs');
  if (modeTabs) {
    modeTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      switchMode(pill.getAttribute('data-mode'));
    });
  }

  /* ================================================================
     EXPLORE UI
     ================================================================ */

  function renderConceptGrid() {
    if (!conceptGrid) return;
    conceptGrid.innerHTML = '';
    for (var i = 0; i < CONCEPTS.length; i++) {
      var c = CONCEPTS[i];
      if (c.cat !== exploreCat) continue;
      var card = document.createElement('div');
      card.className = 'is-card' + (selectedConcept === c ? ' active' : '');
      card.innerHTML = '<div class="is-card-name">' + c.name + '</div><div class="is-card-symbol">' + c.formula + '</div>';
      (function (concept) {
        card.addEventListener('click', function () {
          selectedConcept = concept;
          renderConceptGrid();
          renderConceptInfo(concept);
        });
      })(c);
      conceptGrid.appendChild(card);
    }
  }

  function renderConceptInfo(c) {
    if (!itemInfo) return;
    itemInfo.style.display = '';
    var html = '<h3>' + c.name + ' (' + c.symbol + ')</h3>';
    html += '<div class="formula-box">' + escapeHtml(c.formula) + (c.unit !== '\u2014' ? ' [' + c.unit + ']' : '') + '</div>';
    html += '<p>' + c.desc + '</p>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4><p><strong>' + c.example.problem + '</strong></p>';
      for (var s = 0; s < c.example.steps.length; s++) {
        html += '<div class="step">' + c.example.steps[s] + '</div>';
      }
      if (c.example.answer !== undefined) html += '<p><strong>Answer: ' + c.example.answer + ' ' + (c.example.unit || '') + '</strong></p>';
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  if (catTabs) {
    catTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      exploreCat = pill.getAttribute('data-cat');
      var pills = catTabs.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) {
        pills[i].classList.toggle('active', pills[i].getAttribute('data-cat') === exploreCat);
      }
      selectedConcept = null;
      if (itemInfo) itemInfo.style.display = 'none';
      renderConceptGrid();
    });
  }

  /* ================================================================
     PRACTICE UI
     ================================================================ */

  function generateProblem() {
    var gen = PRACTICE[Math.floor(Math.random() * PRACTICE.length)];
    currentProblem = gen();
    practiceAnswered = false;
    if (ppPrompt) ppPrompt.textContent = currentProblem.prompt;
    if (ppInput) {
      ppInput.value = '';
      ppInput.disabled = false;
      ppInput.placeholder = currentProblem.isText ? 'Type expression' : 'Your answer';
    }
    if (ppUnit) ppUnit.textContent = currentProblem.unit || '';
    if (ppFeedback) { ppFeedback.textContent = ''; ppFeedback.className = 'feedback'; }
    if (ppSolution) ppSolution.style.display = 'none';
    if (ppCheck) ppCheck.style.display = '';
    if (ppNext) ppNext.style.display = 'none';
    if (ppInput) ppInput.focus();
  }

  if (ppCheck) {
    ppCheck.addEventListener('click', function () {
      if (practiceAnswered || !currentProblem) return;
      var userVal = ppInput.value.trim();
      if (!userVal) return;

      practiceAnswered = true;
      practiceTotal++;

      var correct = false;
      if (currentProblem.isText) {
        /* Text comparison: normalize and compare */
        var normUser = userVal.replace(/\s+/g, '').toUpperCase().replace(/[*\.]/g, '');
        var normAns = String(currentProblem.answer).replace(/\s+/g, '').toUpperCase().replace(/[*\.]/g, '');
        correct = normUser === normAns;
      } else {
        var numVal = parseFloat(userVal);
        if (!isNaN(numVal)) {
          correct = Math.abs(numVal - currentProblem.answer) <= (currentProblem.tol || 0);
        }
      }

      if (correct) {
        practiceCorrect++;
        if (ppFeedback) { ppFeedback.textContent = 'Correct!'; ppFeedback.className = 'feedback correct'; }
      } else {
        if (ppFeedback) { ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + (currentProblem.unit || ''); ppFeedback.className = 'feedback wrong'; }
      }

      if (pbarScoreVal) pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;
      if (ppInput) ppInput.disabled = true;
      if (ppCheck) ppCheck.style.display = 'none';
      if (ppNext) ppNext.style.display = '';
      if (ppSolution) {
        ppSolution.style.display = '';
        ppSolution.innerHTML = '<strong>Solution:</strong><br>' + currentProblem.steps.join('<br>');
      }
    });
  }

  if (ppNext) ppNext.addEventListener('click', generateProblem);
  if (ppInput) {
    ppInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && ppCheck) ppCheck.click();
    });
  }

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
    if (quizResult) quizResult.style.display = 'none';
    if (quizPanel) quizPanel.style.display = '';
    if (quizBar) quizBar.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizSet.length) { showQuizResults(); return; }
    var q = quizSet[quizIdx];
    if (qbarNum) qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="q-prompt"><strong>Q' + (quizIdx + 1) + '.</strong> ' + q.q + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="q-options">';
      for (var oi = 0; oi < q.opts.length; oi++) {
        html += '<div class="q-opt" data-idx="' + oi + '">' + q.opts[oi] + '</div>';
      }
      html += '</div>';
    } else {
      html += '<div class="q-num-input"><input type="number" step="any" id="quiz-num-input" placeholder="Your answer"> <span>' + (q.unit || '') + '</span> <button class="btn btn-primary" id="quiz-num-check">Check</button></div>';
    }
    if (quizPanel) quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      var opts = quizPanel.querySelectorAll('.q-opt');
      for (var o = 0; o < opts.length; o++) {
        (function (opt) {
          opt.addEventListener('click', function () {
            if (quizAnswered) return;
            quizAnswered = true;
            var idx = parseInt(opt.getAttribute('data-idx'));
            var isCorrect = idx === q.ans;
            if (isCorrect) { quizScore++; opt.classList.add('correct'); }
            else {
              opt.classList.add('wrong');
              var allOpts = quizPanel.querySelectorAll('.q-opt');
              if (allOpts[q.ans]) allOpts[q.ans].classList.add('correct');
            }
            quizAnswers.push({ q: q.q, correct: isCorrect });
            setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
          });
        })(opts[o]);
      }
    } else {
      var checkBtn = document.getElementById('quiz-num-check');
      var numInput = document.getElementById('quiz-num-input');
      if (checkBtn) {
        checkBtn.addEventListener('click', function () {
          if (quizAnswered) return;
          var val = parseFloat(numInput.value);
          if (isNaN(val)) return;
          quizAnswered = true;
          var isCorrect = Math.abs(val - q.ans) <= (q.tol || 0);
          if (isCorrect) {
            quizScore++;
            numInput.style.borderColor = '#4caf50';
          } else {
            numInput.style.borderColor = '#ff4444';
            numInput.value = q.ans;
          }
          quizAnswers.push({ q: q.q, correct: isCorrect });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
        });
      }
      if (numInput) numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && checkBtn) checkBtn.click(); });
    }
  }

  function showQuizResults() {
    if (quizPanel) quizPanel.style.display = 'none';
    if (quizBar) quizBar.style.display = 'none';
    if (quizResult) quizResult.style.display = '';
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
    if (quizResult) quizResult.innerHTML = html;
    var retryBtn = document.getElementById('quiz-retry');
    if (retryBtn) retryBtn.addEventListener('click', startQuiz);
  }

  /* ================================================================
     KEYBOARD SHORTCUTS
     ================================================================ */

  document.addEventListener('keydown', function (e) {
    if (mode !== 'simulate') return;
    /* Undo: Ctrl+Z */
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      performUndo();
    }
    /* Redo: Ctrl+Shift+Z */
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      performRedo();
    }
  });

  /* ================================================================
     CONTEXT MENU (right-click on K-Map grid)
     ================================================================ */

  var ctxMenu = null;

  function createCtxMenu() {
    ctxMenu = document.createElement('div');
    ctxMenu.className = 'kmap-ctx-menu';
    ctxMenu.style.display = 'none';
    ctxMenu.innerHTML =
      '<div class="ctx-item" data-action="copy-expr">Copy Expression</div>' +
      '<div class="ctx-item" data-action="export-csv">Export Truth Table (CSV)</div>' +
      '<div class="ctx-item" data-action="export-png">Export K-Map (PNG)</div>' +
      '<div class="ctx-sep"></div>' +
      '<div class="ctx-item" data-action="clear-all">Clear All Cells</div>';
    document.body.appendChild(ctxMenu);

    ctxMenu.addEventListener('click', function (e) {
      var item = e.target.closest('.ctx-item');
      if (!item) return;
      var action = item.getAttribute('data-action');
      if (action === 'copy-expr') copyExpression();
      else if (action === 'export-csv') exportCSV();
      else if (action === 'export-png') exportPNG();
      else if (action === 'clear-all') clearAllCells();
      ctxMenu.style.display = 'none';
    });

    document.addEventListener('click', function () {
      if (ctxMenu) ctxMenu.style.display = 'none';
    });
  }

  createCtxMenu();

  if (kmapGrid) {
    kmapGrid.addEventListener('contextmenu', function (e) {
      if (mode !== 'simulate') return;
      e.preventDefault();
      if (!ctxMenu) return;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var mw = 200;
      var mh = 170;
      var x = Math.min(e.clientX, vw - mw - 8);
      var y = Math.min(e.clientY, vh - mh - 8);
      ctxMenu.style.left = x + 'px';
      ctxMenu.style.top = y + 'px';
      ctxMenu.style.display = '';
    });
  }

  /* ================================================================
     HINT BAR
     ================================================================ */

  var hintBar = document.getElementById('hint-bar');

  function dismissHint() {
    if (hintBar) hintBar.style.display = 'none';
  }

  if (hintBar) {
    var hintClose = hintBar.querySelector('.hint-close');
    if (hintClose) hintClose.addEventListener('click', dismissHint);
  }

  /* ================================================================
     INIT
     ================================================================ */

  initKmap();
  loadPreset('custom');
  updatePresetTabs();
  renderSubPresetSelector();
  switchMode('simulate');

  /* ================================================================
     SHAREABLE URL — the K-map (variables + cell values) is encoded into the link.
     {numVars, values} → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareLink(){
      try{
        var U=new TextEncoder().encode(JSON.stringify({ numVars:numVars, values:cellValues }));
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ flashShare('⚠ Too big',false); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(function(){ flashShare('✓ Link copied!',true); }, function(){ flashShare('↑ In address bar'); });
          } else { flashShare('↑ In address bar'); }
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
        var d=JSON.parse(new TextDecoder().decode(U));
        if(!d || typeof d.numVars!=='number' || !Array.isArray(d.values)) return;   // shape mismatch → ignore
        numVars = d.numVars; cellValues = d.values;                 // mirror performUndo's apply path
        mintermMap = buildMintermMap(numVars);
        reverseMap = buildReverseMap(numVars);
        updateVarTabs(); solve(); renderKmap(); renderTruthTable(); updateStepPanel();
      }).catch(function(){});                                       // corrupt link → keep default K-map
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // after the synchronous boot above (rAF-free so it isn't throttled)
  })();

})();
