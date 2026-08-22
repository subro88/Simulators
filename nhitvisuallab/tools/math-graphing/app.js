(function () {
  'use strict';

  /* S1 ── Helpers & Utilities ─────────────────────────────── */

  /** Shorthand getElementById */
  function $(id) { return document.getElementById(id); }

  /** Clamp value between lo and hi */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** Escape HTML entities for safe insertion */
  function escHtml(t) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(t));
    return d.innerHTML;
  }

  /** Linear interpolation */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /** Round to a given number of significant figures */
  function roundSig(v, sig) {
    if (v === 0) return 0;
    if (!isFinite(v)) return v;
    var m = Math.pow(10, sig - Math.ceil(Math.log10(Math.abs(v))));
    return Math.round(v * m) / m;
  }

  /** Format a number for display: remove trailing zeros, use scientific for extremes */
  function formatNum(v) {
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    var abs = Math.abs(v);
    /* Use scientific notation for very large or very small */
    if (abs >= 1e6 || (abs < 1e-4 && abs > 0)) {
      return v.toExponential(2);
    }
    /* Round to at most 6 significant figures, strip trailing zeros */
    var r = roundSig(v, 6);
    var s = String(r);
    /* If it has a decimal point, strip trailing zeros */
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  /** Format number for axis labels: shorter form */
  function formatAxisNum(v) {
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) {
      return v.toExponential(1);
    }
    var r = roundSig(v, 4);
    var s = String(r);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  /** Generate a unique ID */
  function uid() { return ++state.nextId; }

  /** Deep clone plain objects / arrays */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Debounce helper for resize events */
  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  /** Check if a value is a valid finite number */
  function isOk(v) { return typeof v === 'number' && isFinite(v); }


  /* S2 ── Constants & Colors ──────────────────────────────── */

  /** Colours for up to 8 simultaneous function plots */
  var FUNC_COLORS = [
    '#18b4f5', '#ff6b6b', '#51cf66', '#ffd43b',
    '#cc5de8', '#ff922b', '#20c997', '#e599f7'
  ];

  /** Default labels for functions: f, g, h, p, q, r, s, t */
  var FUNC_LABELS = ['f', 'g', 'h', 'p', 'q', 'r', 's', 't'];

  /** Map of recognised function names → { args: argCount, fn: implementation } */
  var KNOWN_FUNCS = {
    sin:   { args: 1, fn: Math.sin },
    cos:   { args: 1, fn: Math.cos },
    tan:   { args: 1, fn: Math.tan },
    asin:  { args: 1, fn: Math.asin },
    acos:  { args: 1, fn: Math.acos },
    atan:  { args: 1, fn: Math.atan },
    atan2: { args: 2, fn: Math.atan2 },
    sinh:  { args: 1, fn: Math.sinh },
    cosh:  { args: 1, fn: Math.cosh },
    tanh:  { args: 1, fn: Math.tanh },
    ln:    { args: 1, fn: Math.log },
    log:   { args: 1, fn: Math.log10 },
    log2:  { args: 1, fn: Math.log2 },
    log10: { args: 1, fn: Math.log10 },
    sqrt:  { args: 1, fn: Math.sqrt },
    cbrt:  { args: 1, fn: Math.cbrt },
    abs:   { args: 1, fn: Math.abs },
    floor: { args: 1, fn: Math.floor },
    ceil:  { args: 1, fn: Math.ceil },
    round: { args: 1, fn: Math.round },
    sign:  { args: 1, fn: Math.sign },
    min:   { args: 2, fn: Math.min },
    max:   { args: 2, fn: Math.max },
    exp:   { args: 1, fn: Math.exp }
  };

  /** Recognised mathematical constants */
  var KNOWN_CONSTS = {
    pi:  Math.PI,
    e:   Math.E,
    inf: Infinity
  };

  /** Background colour for the graph canvas */
  var BG_COLOR = '#0d1117';

  /** Grid and axis colours */
  var GRID_MAJOR_COLOR = 'rgba(255,255,255,0.08)';
  var GRID_MINOR_COLOR = 'rgba(255,255,255,0.03)';
  var AXIS_COLOR = 'rgba(255,255,255,0.35)';
  var AXIS_NUM_COLOR = 'rgba(255,255,255,0.5)';
  var AXIS_LABEL_COLOR = 'rgba(255,255,255,0.6)';


  /* S3 ── Tokenizer ───────────────────────────────────────── */

  /**
   * Token types used by the tokenizer and parser.
   * Each token is { type, value, pos }.
   */
  var TK_NUM    = 'NUM';
  var TK_ID     = 'ID';
  var TK_OP     = 'OP';
  var TK_LPAREN = 'LPAREN';
  var TK_RPAREN = 'RPAREN';
  var TK_COMMA  = 'COMMA';
  var TK_PIPE   = 'PIPE';
  var TK_LT     = 'LT';
  var TK_GT     = 'GT';
  var TK_LTEQ   = 'LTEQ';
  var TK_GTEQ   = 'GTEQ';

  /**
   * Tokenize a mathematical expression string into an array of tokens.
   * Inserts implicit multiplication where needed (e.g. 2x → 2*x).
   *
   * @param {string} expr - The expression to tokenize
   * @returns {Array} Array of token objects, or null on error
   */
  /** Map of Unicode math characters to their ASCII equivalents */
  var UNICODE_MAP = {
    'π': 'pi',   /* π */
    '−': '-',    /* − minus sign */
    '×': '*',    /* × */
    '⋅': '*',    /* ⋅ dot operator */
    '·': '*',    /* · middle dot */
    '÷': '/',    /* ÷ */
    '√': 'sqrt', /* √ */
    '²': '^2',   /* ² */
    '³': '^3',   /* ³ */
    '‘': '',     /* curly quotes → strip */
    '’': ''
  };

  function tokenize(expr) {
    /* Normalise common Unicode math characters (π, −, ×, ÷, √, ², ³)
       so pasted textbook expressions tokenize correctly. */
    var norm = '';
    for (var u = 0; u < expr.length; u++) {
      var uc = expr[u];
      norm += (UNICODE_MAP[uc] !== undefined) ? UNICODE_MAP[uc] : uc;
    }
    expr = norm;

    var tokens = [];
    var i = 0;
    var len = expr.length;
    var pipeDepth = 0;
    var numRe = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
    var idRe  = /^[a-zA-Z_]\w*/;

    while (i < len) {
      /* Skip whitespace */
      if (expr[i] === ' ' || expr[i] === '\t') {
        i++;
        continue;
      }

      var ch = expr[i];
      var pos = i;

      /* Numbers: integer, decimal, or scientific notation */
      var numMatch = expr.slice(i).match(numRe);
      if (numMatch) {
        tokens.push({ type: TK_NUM, value: parseFloat(numMatch[0]), pos: pos });
        i += numMatch[0].length;
        continue;
      }

      /* Identifiers: variable names, function names, constants */
      var idMatch = expr.slice(i).match(idRe);
      if (idMatch) {
        tokens.push({ type: TK_ID, value: idMatch[0], pos: pos });
        i += idMatch[0].length;
        continue;
      }

      /* Operators */
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
        tokens.push({ type: TK_OP, value: ch, pos: pos });
        i++;
        continue;
      }

      /* Factorial — treat as an operator for parsePostfix */
      if (ch === '!') {
        tokens.push({ type: TK_OP, value: '!', pos: pos });
        i++;
        continue;
      }

      /* Parentheses */
      if (ch === '(') {
        tokens.push({ type: TK_LPAREN, value: '(', pos: pos });
        i++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: TK_RPAREN, value: ')', pos: pos });
        i++;
        continue;
      }

      /* Comma (function argument separator) */
      if (ch === ',') {
        tokens.push({ type: TK_COMMA, value: ',', pos: pos });
        i++;
        continue;
      }

      /* Pipe for absolute value: |expr| — track open/close parity so
         implicit multiplication is only inserted before OPENING pipes */
      if (ch === '|') {
        var opening = (pipeDepth === 0);
        pipeDepth = opening ? pipeDepth + 1 : pipeDepth - 1;
        tokens.push({ type: TK_PIPE, value: '|', pos: pos, opening: opening });
        i++;
        continue;
      }

      /* Comparison operators: <=, >=, <, > */
      if (ch === '<') {
        if (i + 1 < len && expr[i + 1] === '=') {
          tokens.push({ type: TK_LTEQ, value: '<=', pos: pos });
          i += 2;
        } else {
          tokens.push({ type: TK_LT, value: '<', pos: pos });
          i++;
        }
        continue;
      }
      if (ch === '>') {
        if (i + 1 < len && expr[i + 1] === '=') {
          tokens.push({ type: TK_GTEQ, value: '>=', pos: pos });
          i += 2;
        } else {
          tokens.push({ type: TK_GT, value: '>', pos: pos });
          i++;
        }
        continue;
      }

      /* Unknown character — raise a clear parse error instead of
         silently dropping it (silent drops made "2π" plot y = 2) */
      parseError = 'Unrecognised character "' + ch + '" at position ' + (pos + 1);
      return null;
    }

    /* ── Insert implicit multiplication tokens ─────────────── */
    var out = [];
    for (var j = 0; j < tokens.length; j++) {
      var cur = tokens[j];
      if (j > 0) {
        var prev = tokens[j - 1];
        var needMul = false;

        /* NUM followed by ID:  2x → 2*x */
        if (prev.type === TK_NUM && cur.type === TK_ID) {
          needMul = true;
        }
        /* NUM followed by LPAREN:  2( → 2*( */
        if (prev.type === TK_NUM && cur.type === TK_LPAREN) {
          needMul = true;
        }
        /* NUM followed by OPENING pipe:  2| → 2*|  (never before a
           closing pipe — that would break |x-3|, |3|, 2|x-1|) */
        if (prev.type === TK_NUM && cur.type === TK_PIPE && cur.opening) {
          needMul = true;
        }
        /* RPAREN followed by LPAREN:  )( → )*( */
        if (prev.type === TK_RPAREN && cur.type === TK_LPAREN) {
          needMul = true;
        }
        /* RPAREN followed by ID:  )x → )*x */
        if (prev.type === TK_RPAREN && cur.type === TK_ID) {
          needMul = true;
        }
        /* RPAREN followed by NUM:  )2 → )*2 */
        if (prev.type === TK_RPAREN && cur.type === TK_NUM) {
          needMul = true;
        }
        /* RPAREN followed by OPENING pipe:  )| → )*| */
        if (prev.type === TK_RPAREN && cur.type === TK_PIPE && cur.opening) {
          needMul = true;
        }
        /* CLOSING pipe followed by NUM/ID/LPAREN/opening pipe: |x|2 → |x|*2 */
        if (prev.type === TK_PIPE && !prev.opening &&
            (cur.type === TK_NUM || cur.type === TK_ID || cur.type === TK_LPAREN ||
             (cur.type === TK_PIPE && cur.opening))) {
          needMul = true;
        }
        /* ID followed by LPAREN where ID is NOT a known function:  a( → a*( */
        if (prev.type === TK_ID && cur.type === TK_LPAREN) {
          if (!KNOWN_FUNCS[prev.value.toLowerCase()]) {
            needMul = true;
          }
        }
        /* ID followed by NUM:  x2 → x*2 */
        if (prev.type === TK_ID && cur.type === TK_NUM) {
          needMul = true;
        }
        /* ID followed by ID:  xy → x*y */
        if (prev.type === TK_ID && cur.type === TK_ID) {
          needMul = true;
        }
        /* PIPE (closing) could be followed by LPAREN, NUM, ID — handled by the parser */

        if (needMul) {
          out.push({ type: TK_OP, value: '*', pos: cur.pos });
        }
      }
      out.push(cur);
    }

    return out;
  }


  /* S4 ── Parser / AST Builder ────────────────────────────── */

  /**
   * Recursive-descent parser that builds an Abstract Syntax Tree (AST).
   *
   * AST node types:
   *   { type: 'num',   value: number }
   *   { type: 'var' }                        — the independent variable x
   *   { type: 'param', name: string }        — a slider parameter (a, b, k, etc.)
   *   { type: 'binop', op: string, left: node, right: node }
   *   { type: 'unary', op: '-', arg: node }
   *   { type: 'call',  name: string, args: [node] }
   *
   * Operator precedence (lowest to highest):
   *   1. Comparison:     < > <= >=
   *   2. Addition:       + -
   *   3. Multiplication: * /
   *   4. Implicit mul:   adjacent terms without operator
   *   5. Unary:          - +
   *   6. Power:          ^ (right-associative)
   *   7. Postfix:        !
   *   8. Atom:           number, variable, function call, parenthesised expr, |abs|
   */

  var parseError = '';

  /**
   * Parse an expression string into an AST.
   * @param {string} expr - The expression to parse
   * @returns {Object|null} AST root node, or null on error
   */
  function parse(expr) {
    parseError = '';
    if (!expr || !expr.trim()) {
      parseError = 'Empty expression';
      return null;
    }

    var tokens = tokenize(expr);
    if (!tokens) {
      if (!parseError) parseError = 'Tokenization failed';
      return null;
    }

    var pos = 0;

    /** Peek at current token without consuming */
    function peek() { return pos < tokens.length ? tokens[pos] : null; }

    /** Consume current token and advance */
    function next() { return tokens[pos++]; }

    /** Check if current token matches type (and optionally value) */
    function match(type, value) {
      var t = peek();
      if (!t) return false;
      if (t.type !== type) return false;
      if (value !== undefined && t.value !== value) return false;
      return true;
    }

    /** Consume a token of expected type, or set error */
    function expect(type, value) {
      if (match(type, value)) return next();
      var t = peek();
      parseError = 'Expected ' + type + (value ? ' "' + value + '"' : '') +
        ' but got ' + (t ? t.type + ' "' + t.value + '"' : 'end of expression');
      return null;
    }

    /* ── Precedence level 1: Comparison ──────────────────── */
    function parseComparison() {
      var node = parseAddSub();
      while (match(TK_LT) || match(TK_GT) || match(TK_LTEQ) || match(TK_GTEQ)) {
        var op = next().value;
        var right = parseAddSub();
        if (!right) return null;
        node = { type: 'binop', op: op, left: node, right: right };
      }
      return node;
    }

    /* ── Precedence level 2: Addition / Subtraction ──────── */
    function parseAddSub() {
      var node = parseMulDiv();
      if (!node) return null;
      while (match(TK_OP, '+') || match(TK_OP, '-')) {
        var op = next().value;
        var right = parseMulDiv();
        if (!right) return null;
        node = { type: 'binop', op: op, left: node, right: right };
      }
      return node;
    }

    /* ── Precedence level 3: Multiplication / Division ───── */
    function parseMulDiv() {
      var node = parseUnary();
      if (!node) return null;
      while (match(TK_OP, '*') || match(TK_OP, '/')) {
        var op = next().value;
        var right = parseUnary();
        if (!right) return null;
        node = { type: 'binop', op: op, left: node, right: right };
      }
      return node;
    }

    /* ── Precedence level 5: Unary +/- ───────────────────── */
    function parseUnary() {
      if (match(TK_OP, '-')) {
        next();
        var arg = parseUnary();
        if (!arg) return null;
        /* Optimise: -number → num node with negated value */
        if (arg.type === 'num') {
          arg.value = -arg.value;
          return arg;
        }
        return { type: 'unary', op: '-', arg: arg };
      }
      if (match(TK_OP, '+')) {
        next();
        return parseUnary();
      }
      return parsePower();
    }

    /* ── Precedence level 6: Exponentiation (right-assoc) ─ */
    function parsePower() {
      var base = parsePostfix();
      if (!base) return null;
      if (match(TK_OP, '^')) {
        next();
        /* Right-associative: recurse into parsePower, not parsePostfix */
        var exp = parseUnary();
        if (!exp) return null;
        return { type: 'binop', op: '^', left: base, right: exp };
      }
      return base;
    }

    /* ── Precedence level 7: Postfix (factorial) ─────────── */
    function parsePostfix() {
      var node = parseAtom();
      if (!node) return null;
      while (match(TK_OP, '!')) {
        next();
        node = { type: 'call', name: 'factorial', args: [node] };
      }
      return node;
    }

    /* ── Precedence level 8: Atoms ───────────────────────── */
    function parseAtom() {
      var t = peek();
      if (!t) {
        parseError = 'Unexpected end of expression';
        return null;
      }

      /* Number literal */
      if (t.type === TK_NUM) {
        next();
        return { type: 'num', value: t.value };
      }

      /* Identifier: constant, variable 'x', function call, or parameter */
      if (t.type === TK_ID) {
        var name = t.value;
        var lower = name.toLowerCase();
        next();

        /* Known constant */
        if (KNOWN_CONSTS[lower] !== undefined) {
          return { type: 'num', value: KNOWN_CONSTS[lower] };
        }

        /* The independent variable */
        if (lower === 'x') {
          return { type: 'var' };
        }

        /* Function call: ID followed by LPAREN */
        if (match(TK_LPAREN)) {
          next(); /* consume '(' */
          var args = [];
          if (!match(TK_RPAREN)) {
            var firstArg = parseComparison();
            if (!firstArg) return null;
            args.push(firstArg);
            while (match(TK_COMMA)) {
              next(); /* consume ',' */
              var arg = parseComparison();
              if (!arg) return null;
              args.push(arg);
            }
          }
          if (!expect(TK_RPAREN)) return null;
          return { type: 'call', name: lower, args: args };
        }

        /* Otherwise it's a parameter (slider variable) */
        return { type: 'param', name: lower };
      }

      /* Parenthesised sub-expression */
      if (t.type === TK_LPAREN) {
        next(); /* consume '(' */
        var inner = parseComparison();
        if (!inner) return null;
        if (!expect(TK_RPAREN)) return null;
        return inner;
      }

      /* Absolute value: |expr| */
      if (t.type === TK_PIPE) {
        next(); /* consume opening '|' */
        var absArg = parseComparison();
        if (!absArg) return null;
        if (!expect(TK_PIPE)) return null;
        return { type: 'call', name: 'abs', args: [absArg] };
      }

      parseError = 'Unexpected token: "' + t.value + '"';
      return null;
    }

    /* ── Run the parser ──────────────────────────────────── */
    var ast = parseComparison();
    if (!ast) {
      if (!parseError) parseError = 'Parse error';
      return null;
    }
    /* Make sure we consumed all tokens */
    if (pos < tokens.length) {
      parseError = 'Unexpected token after expression: "' + tokens[pos].value + '"';
      return null;
    }
    return ast;
  }

  /**
   * Walk the AST and collect all parameter names (non-x identifiers).
   * @param {Object} ast - The AST root node
   * @returns {Array} Sorted array of unique parameter names
   */
  function extractParams(ast) {
    var params = {};
    function walk(node) {
      if (!node) return;
      if (node.type === 'param') {
        params[node.name] = true;
      } else if (node.type === 'binop') {
        walk(node.left);
        walk(node.right);
      } else if (node.type === 'unary') {
        walk(node.arg);
      } else if (node.type === 'call') {
        for (var i = 0; i < node.args.length; i++) {
          walk(node.args[i]);
        }
      }
    }
    walk(ast);
    return Object.keys(params).sort();
  }


  /* S5 ── Evaluator ───────────────────────────────────────── */

  /**
   * Simple factorial for non-negative integers (capped at 170).
   */
  function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n > 170) return Infinity;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  /**
   * Evaluate an AST node at a given x value with parameter bindings.
   *
   * @param {Object} node   - AST node
   * @param {number} x      - Value of the independent variable
   * @param {Object} params - Map of parameter names to numeric values
   * @returns {number} The computed result, or NaN on error
   */
  function evaluate(node, x, params) {
    try {
      return evalNode(node, x, params);
    } catch (e) {
      return NaN;
    }
  }

  /** Internal recursive evaluator — may throw */
  function evalNode(node, x, params) {
    if (!node) return NaN;

    switch (node.type) {
      case 'num':
        return node.value;

      case 'var':
        return x;

      case 'param':
        return params[node.name] !== undefined ? params[node.name] : NaN;

      case 'unary':
        return -evalNode(node.arg, x, params);

      case 'binop': {
        var l = evalNode(node.left, x, params);
        var r = evalNode(node.right, x, params);
        switch (node.op) {
          case '+':  return l + r;
          case '-':  return l - r;
          case '*':  return l * r;
          case '/':  return l / r; /* JS handles ±Infinity for 1/0 correctly */
          case '^':  return Math.pow(l, r);
          case '<':  return l < r ? 1 : 0;
          case '>':  return l > r ? 1 : 0;
          case '<=': return l <= r ? 1 : 0;
          case '>=': return l >= r ? 1 : 0;
          default:   return NaN;
        }
      }

      case 'call': {
        var args = [];
        for (var i = 0; i < node.args.length; i++) {
          args.push(evalNode(node.args[i], x, params));
        }

        /* Special case: factorial */
        if (node.name === 'factorial') {
          return factorial(args[0]);
        }

        /* Look up in known functions */
        var fn = KNOWN_FUNCS[node.name];
        if (!fn) return NaN;

        /* min and max accept variable number of args */
        if (node.name === 'min') return Math.min.apply(null, args);
        if (node.name === 'max') return Math.max.apply(null, args);

        /* Standard function call */
        return fn.fn.apply(null, args);
      }

      default:
        return NaN;
    }
  }


  /* S5b ── AST → LaTeX & KaTeX Rendering ─────────────────── */

  function precOf(op) {
    if (op === '+' || op === '-') return 1;
    if (op === '*' || op === '/') return 2;
    if (op === '^') return 3;
    return 0;
  }

  function needsParensLeft(parent) {
    var child = parent.left;
    if (child.type === 'binop') return precOf(child.op) < precOf(parent.op);
    if (child.type === 'unary') return precOf(parent.op) >= 2;
    return false;
  }

  function needsParensRight(parent) {
    var child = parent.right;
    if (child.type === 'binop') {
      if (precOf(child.op) < precOf(parent.op)) return true;
      if (precOf(child.op) === precOf(parent.op) && (parent.op === '-' || parent.op === '/')) return true;
    }
    if (child.type === 'unary') return true;
    return false;
  }

  function needsParens(node) {
    return node.type === 'binop';
  }

  function latexWrapNode(node, wrap) {
    var s = astToLatex(node);
    return wrap ? '\\left(' + s + '\\right)' : s;
  }

  function astToLatex(node) {
    if (!node) return '?';
    switch (node.type) {
      case 'num': {
        var v = node.value;
        if (v === Math.PI) return '\\pi';
        if (v === Math.E)  return 'e';
        if (!isFinite(v))  return String(v);
        if (v === Math.floor(v) && Math.abs(v) < 1e10) return String(v);
        return formatNum(v);
      }
      case 'var':   return 'x';
      case 'param': return node.name;
      case 'unary': return '-' + latexWrapNode(node.arg, needsParens(node.arg));
      case 'binop': {
        if (node.op === '/') {
          return '\\dfrac{' + astToLatex(node.left) + '}{' + astToLatex(node.right) + '}';
        }
        if (node.op === '^') {
          var base = latexWrapNode(node.left, needsParensLeft(node));
          var exp  = astToLatex(node.right);
          return base + '^{' + exp + '}';
        }
        if (node.op === '*') {
          /* Additive sub-expressions (and unary minus on the right) must be
             parenthesised inside a product, e.g. 2(x + 1). */
          var lAdd = node.left.type === 'binop' && (node.left.op === '+' || node.left.op === '-');
          var rAdd = (node.right.type === 'binop' && (node.right.op === '+' || node.right.op === '-')) ||
                     node.right.type === 'unary';
          var lL = lAdd ? '\\left(' + astToLatex(node.left) + '\\right)' : astToLatex(node.left);
          var rL = rAdd ? '\\left(' + astToLatex(node.right) + '\\right)' : astToLatex(node.right);
          var lIsNum  = node.left.type === 'num';
          var rIsExpr = node.right.type === 'var' || node.right.type === 'call' || node.right.type === 'binop' || node.right.type === 'param';
          if (lIsNum && rIsExpr) return lL + ' ' + rL;
          if (node.left.type === 'param' && (node.right.type === 'call' || node.right.type === 'var')) return lL + ' ' + rL;
          return lL + ' \\cdot ' + rL;
        }
        var lStr = latexWrapNode(node.left, needsParensLeft(node));
        var rStr = latexWrapNode(node.right, needsParensRight(node));
        return lStr + ' ' + node.op + ' ' + rStr;
      }
      case 'call': {
        var arg0 = node.args[0];
        if (node.name === 'exp')  return 'e^{' + astToLatex(arg0) + '}';
        if (node.name === 'sqrt') return '\\sqrt{' + astToLatex(arg0) + '}';
        if (node.name === 'cbrt') return '\\sqrt[3]{' + astToLatex(arg0) + '}';
        if (node.name === 'abs')  return '\\left|' + astToLatex(arg0) + '\\right|';
        if (node.name === 'floor') return '\\lfloor ' + astToLatex(arg0) + ' \\rfloor';
        if (node.name === 'ceil')  return '\\lceil ' + astToLatex(arg0) + ' \\rceil';
        if (node.name === 'ln')   return '\\ln\\!\\left(' + astToLatex(arg0) + '\\right)';
        if (node.name === 'log')  return '\\log\\!\\left(' + astToLatex(arg0) + '\\right)';
        if (node.name === 'log2') return '\\log_2\\!\\left(' + astToLatex(arg0) + '\\right)';
        if (node.name === 'log10') return '\\log_{10}\\!\\left(' + astToLatex(arg0) + '\\right)';
        if (node.args.length === 2) {
          return node.name + '\\!\\left(' + astToLatex(node.args[0]) + ',\\,' + astToLatex(node.args[1]) + '\\right)';
        }
        var fnMap = { sin: '\\sin', cos: '\\cos', tan: '\\tan',
                      asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
                      sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh' };
        var fn = fnMap[node.name] || node.name;
        return fn + '\\!\\left(' + astToLatex(arg0) + '\\right)';
      }
      default: return '?';
    }
  }

  /** Render a LaTeX string to HTML via KaTeX, fall back to escaped text */
  function renderMath(latex) {
    if (typeof katex !== 'undefined') {
      try {
        return katex.renderToString(latex, { throwOnError: false, displayMode: false });
      } catch (e) { /* fall through */ }
    }
    return escHtml(latex);
  }

  /** Update a KaTeX preview element for a given expression string and label */
  function updateKatexPreview(previewEl, expr, label) {
    if (!previewEl) return;
    if (!expr || !expr.trim()) {
      previewEl.innerHTML = '<span class="fkp-placeholder">' + escHtml(label) + '(x) = \u2026</span>';
      return;
    }
    try {
      var ast = parse(expr);
      if (ast) {
        previewEl.innerHTML = renderMath(label + '(x) = ' + astToLatex(ast));
      } else {
        previewEl.innerHTML = '<span class="fkp-raw">' + escHtml(label) + '(x) = ' + escHtml(expr) + '</span>';
      }
    } catch (err) {
      previewEl.innerHTML = '<span class="fkp-raw">' + escHtml(label) + '(x) = ' + escHtml(expr) + '</span>';
    }
  }


  /* S6 ── State ───────────────────────────────────────────── */

  var state = {
    /** Current mode: 'simulate', 'learn', 'practice' */
    mode: 'simulate',

    /** Visible coordinate window */
    view: { xMin: -10, xMax: 10, yMin: -7, yMax: 7 },

    /**
     * Function slots. Each entry:
     * { id, expr, ast, color, visible, label, error, params:{} }
     */
    funcs: [],

    /** Parameter sliders: paramName → { min, max, step, value } */
    sliders: {},

    /** Display options toggles */
    options: {
      grid: true,
      minorGrid: false,
      axisNums: true,
      deriv1: false,
      deriv2: false
    },

    /** Integral shading settings */
    integral: {
      funcIdx: -1,
      xFrom: -1,
      xTo: 1,
      visible: false
    },

    /** Value table visibility and step size */
    tableVisible: false,
    tableStep: 1,

    /** Currently selected function index (for UI highlighting) */
    selectedFunc: 0,

    /** Hover / trace point info: { funcIdx, wx, wy } or null */
    hoverPoint: null,

    /** Highlighted analysis point: { wx, wy, color, type, animStart } or null */
    highlight: null,

    /** Pan state */
    dragging: false,
    dragStart: null,
    dragView: null,

    /** Pinch-to-zoom state for touch */
    pinch: null,

    /** Undo / redo stacks (view snapshots) */
    undoStack: [],
    redoStack: [],

    /** Auto-incrementing ID counter */
    nextId: 0,

    /** Active tool mode: 'move', 'point', 'intersect', 'tangent', 'derivative', 'integral' */
    tool: 'move',

    /** Free points placed on graph: [{id, wx, wy, dragging}] */
    points: [],

    /** Tangent lines: [{funcIdx, x0, slope, yInt, color}] */
    tangents: [],

    /** Intersection points: [{x, y, funcA, funcB}] */
    intersections: [],

    /** Slider animation state: null or {param, dir, speed, playing} */
    animation: null,

    /** Interactive derivative segments: [{funcIdx, xFrom, xTo, color}] */
    derivSegments: [],

    /** Interactive integral regions: [{funcIdx, xFrom, xTo, color, value}] */
    integralRegions: [],

    /** Pending first click for 2-click tools: {tool, funcIdx, wx} or null */
    pendingClick: null,

    /** Freehand sketch strokes: [{points: [{x, y, p}], color, width}] in CSS-px coords */
    strokes: [],

    /** Stroke currently being drawn, or null */
    activeStroke: null,

    /** Current sketch pen color */
    sketchColor: '#ffffff',

    /** Current sketch pen width */
    sketchWidth: 2,

    /** Shape annotations: [{type, x1, y1, x2, y2, color, width, filled, text?}] in CSS-px */
    shapes: [],

    /** Shape being dragged out, or null */
    activeShape: null,

    /** Current shape sub-tool */
    shapeType: 'rect',

    /** Current shape color */
    shapeColor: '#ffffff',

    /** Current shape stroke width */
    shapeWidth: 2,

    /** Whether shapes are filled */
    shapeFilled: false,

    /** Selected annotation index (-1 = none) */
    selectedAnnotation: -1,

    /** Selected annotation type: 'shape' or 'stroke' or '' */
    selectedAnnotationType: '',

    /** Drag state for moving annotations: {type, idx, lastWx, lastWy} or null */
    dragAnnotation: null,

    /** Whether annotations are visible */
    showAnnotations: true,

    /** Last mouse position on canvas (CSS px) for cursor dot */
    cursorPos: null
  };


  /* S7 ── DOM References ──────────────────────────────────── */

  var canvas, ctx;
  var elGraphCard     = $('graph-card');
  var elExprSidebar   = $('expr-sidebar');
  var elFuncList      = $('func-list');
  var elBtnAddFunc    = $('btn-add-func');
  var elSliderSection = $('slider-section');
  var elSliderList    = $('slider-list');
  var elAnalysis      = $('analysis-section');
  var elAnalysisBody  = $('analysis-content');
  var elChkGrid       = $('chk-grid');
  var elChkMinorGrid  = $('chk-minor-grid');
  var elChkAxisNums   = $('chk-axis-nums');
  var elChkDeriv1     = $('chk-deriv1');
  var elChkDeriv2     = $('chk-deriv2');
  var elChkIntegral   = $('chk-integral');
  var elIntegralFrom  = $('integral-from');
  var elIntegralTo    = $('integral-to');
  var elIntegralFunc  = $('integral-func');
  var elIntegralVal   = $('integral-value');
  var elBtnTable      = $('btn-table');
  var elTableWrap     = $('table-wrap');
  var elTableBody     = $('table-body');
  var elTableStep     = $('table-step');
  var elModeTabs      = $('mode-tabs');
  var elBtnZoomIn     = $('btn-zoom-in');
  var elBtnZoomOut    = $('btn-zoom-out');
  var elBtnZoomReset  = $('btn-zoom-reset');
  var elBtnZoomFit    = $('btn-zoom-fit');
  var elHintBar       = $('hint-bar');
  var elPresets       = $('presets');


  /* S8 ── Canvas Setup & Resize ───────────────────────────── */

  /** Logical (CSS-pixel) width and height of canvas */
  var W = 800, H = 533;

  function initCanvas() {
    canvas = $('graph-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    sizeCanvas();
    /* Retry sizing after layout settles (fixes race condition on some browsers) */
    if (W < 100) {
      setTimeout(function() { sizeCanvas(); draw(); }, 50);
      setTimeout(function() { sizeCanvas(); draw(); }, 200);
    }
  }

  /** Size canvas to fit its container, respecting devicePixelRatio */
  function sizeCanvas() {
    if (!canvas) return;
    var container = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = container.clientWidth - 12; /* subtract padding */
    if (cw < 100) cw = 800;
    /* Maintain 3:2 aspect ratio */
    var ch = Math.round(cw * (2 / 3));

    W = cw;
    H = ch;

    canvas.style.width  = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width  = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }

  /* ── Coordinate transforms ───────────────────────────── */

  /** World X → Screen X (CSS pixels) */
  function toSX(wx) {
    return (wx - state.view.xMin) / (state.view.xMax - state.view.xMin) * W;
  }

  /** World Y → Screen Y (CSS pixels, Y flipped) */
  function toSY(wy) {
    return (1 - (wy - state.view.yMin) / (state.view.yMax - state.view.yMin)) * H;
  }

  /** Screen X → World X */
  function toWX(sx) {
    return state.view.xMin + sx / W * (state.view.xMax - state.view.xMin);
  }

  /** Screen Y → World Y */
  function toWY(sy) {
    return state.view.yMax - sy / H * (state.view.yMax - state.view.yMin);
  }

  /* Attach ResizeObserver for responsive canvas */
  function attachResizeObserver() {
    if (!canvas || !canvas.parentElement) return;
    if (typeof ResizeObserver === 'undefined') return;
    var resizeHandler = debounce(function () {
      sizeCanvas();
      draw();
    }, 100);
    var ro = new ResizeObserver(resizeHandler);
    ro.observe(canvas.parentElement);
  }


  /* S9 ── Grid & Axes Rendering ───────────────────────────── */

  /**
   * Compute a "nice" step size for grid lines.
   * Snaps to 1, 2, or 5 × 10^n so the grid looks clean at any zoom.
   *
   * @param {number} range       - The visible range (e.g. xMax - xMin)
   * @param {number} targetLines - Desired number of grid lines (~8-12)
   * @returns {number} The step size
   */
  function niceStep(range, targetLines) {
    if (range <= 0 || !isFinite(range)) return 1;
    var raw = range / targetLines;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var frac = raw / mag;
    var nice;
    if (frac <= 1.5)      nice = 1;
    else if (frac <= 3.5)  nice = 2;
    else if (frac <= 7.5)  nice = 5;
    else                    nice = 10;
    return nice * mag;
  }

  /** Draw minor and major grid lines */
  function drawGrid() {
    if (!state.options.grid) return;

    var v = state.view;
    var xRange = v.xMax - v.xMin;
    var yRange = v.yMax - v.yMin;
    var stepX = niceStep(xRange, 10);
    var stepY = niceStep(yRange, 8);

    /* ── Minor grid (subdivide major step by 5) ───────── */
    if (state.options.minorGrid) {
      var minorStepX = stepX / 5;
      var minorStepY = stepY / 5;
      ctx.strokeStyle = GRID_MINOR_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      /* Half-step epsilon on loop bounds guards against float accumulation
         drift dropping the last gridline */
      var mxStart = Math.ceil(v.xMin / minorStepX) * minorStepX;
      for (var mx = mxStart; mx <= v.xMax + minorStepX * 0.5; mx += minorStepX) {
        var sx = toSX(mx);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, H);
      }

      var myStart = Math.ceil(v.yMin / minorStepY) * minorStepY;
      for (var my = myStart; my <= v.yMax + minorStepY * 0.5; my += minorStepY) {
        var sy = toSY(my);
        ctx.moveTo(0, sy);
        ctx.lineTo(W, sy);
      }
      ctx.stroke();
    }

    /* ── Major grid lines ─────────────────────────────── */
    ctx.strokeStyle = GRID_MAJOR_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();

    var xStart = Math.ceil(v.xMin / stepX) * stepX;
    for (var gx = xStart; gx <= v.xMax + stepX * 0.5; gx += stepX) {
      /* Skip the axis itself — drawn separately thicker */
      if (Math.abs(gx) < stepX * 0.01) continue;
      var gsx = toSX(gx);
      ctx.moveTo(gsx, 0);
      ctx.lineTo(gsx, H);
    }

    var yStart = Math.ceil(v.yMin / stepY) * stepY;
    for (var gy = yStart; gy <= v.yMax + stepY * 0.5; gy += stepY) {
      if (Math.abs(gy) < stepY * 0.01) continue;
      var gsy = toSY(gy);
      ctx.moveTo(0, gsy);
      ctx.lineTo(W, gsy);
    }
    ctx.stroke();

    /* ── Axes (thicker, drawn at origin) ──────────────── */
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    /* Y axis (x = 0) */
    if (v.xMin <= 0 && v.xMax >= 0) {
      var axisX = toSX(0);
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, H);
    }

    /* X axis (y = 0) */
    if (v.yMin <= 0 && v.yMax >= 0) {
      var axisY = toSY(0);
      ctx.moveTo(0, axisY);
      ctx.lineTo(W, axisY);
    }
    ctx.stroke();
  }

  /** Draw tick marks and numbers along the axes */
  function drawAxisNumbers() {
    if (!state.options.axisNums) return;

    var v = state.view;
    var xRange = v.xMax - v.xMin;
    var yRange = v.yMax - v.yMin;
    var stepX = niceStep(xRange, 10);
    var stepY = niceStep(yRange, 8);

    ctx.fillStyle = AXIS_NUM_COLOR;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    /* Determine where the axes sit in screen space (or clamp to edges) */
    var originSX = clamp(toSX(0), 0, W);
    var originSY = clamp(toSY(0), 0, H);

    /* ── X-axis numbers ───────────────────────────────── */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var xLabelY = originSY + 6;
    /* Keep labels on screen */
    if (xLabelY > H - 14) xLabelY = H - 14;
    if (xLabelY < 2) xLabelY = 2;

    var xStart2 = Math.ceil(v.xMin / stepX) * stepX;
    for (var tx = xStart2; tx <= v.xMax; tx += stepX) {
      /* Round to avoid floating point drift */
      tx = Math.round(tx / stepX) * stepX;
      if (Math.abs(tx) < stepX * 0.01) continue; /* Skip origin */
      var tsx = toSX(tx);
      if (tsx < 20 || tsx > W - 20) continue; /* Don't crowd edges */

      /* Tick mark */
      ctx.strokeStyle = AXIS_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tsx, originSY - 3);
      ctx.lineTo(tsx, originSY + 3);
      ctx.stroke();

      /* Number label */
      ctx.fillStyle = AXIS_NUM_COLOR;
      ctx.fillText(formatAxisNum(tx), tsx, xLabelY);
    }

    /* ── Y-axis numbers ───────────────────────────────── */
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    var yLabelX = originSX - 6;
    if (yLabelX < 30) yLabelX = 30;
    if (yLabelX > W - 5) yLabelX = W - 5;

    var yStart2 = Math.ceil(v.yMin / stepY) * stepY;
    for (var ty = yStart2; ty <= v.yMax; ty += stepY) {
      ty = Math.round(ty / stepY) * stepY;
      if (Math.abs(ty) < stepY * 0.01) continue; /* Skip origin */
      var tsy = toSY(ty);
      if (tsy < 12 || tsy > H - 12) continue;

      /* Tick mark */
      ctx.strokeStyle = AXIS_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originSX - 3, tsy);
      ctx.lineTo(originSX + 3, tsy);
      ctx.stroke();

      /* Number label */
      ctx.fillStyle = AXIS_NUM_COLOR;
      ctx.fillText(formatAxisNum(ty), yLabelX, tsy);
    }
  }

  /** Draw "x" and "y" labels near the axis endpoints */
  function drawAxisLabels() {
    ctx.fillStyle = AXIS_LABEL_COLOR;
    ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    /* "x" near the right end of the x-axis */
    var v = state.view;
    if (v.yMin <= 0 && v.yMax >= 0) {
      var axY = toSY(0);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('x', W - 6, axY - 6);
    }

    /* "y" near the top of the y-axis */
    if (v.xMin <= 0 && v.xMax >= 0) {
      var axX = toSX(0);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('y', axX + 6, 6);
    }
  }


  /* S10 ── Function Plotting ──────────────────────────────── */

  /**
   * Plot a single function on the canvas.
   *
   * @param {Object}  func      - Function object from state.funcs
   * @param {number}  lineWidth - Line width in CSS pixels
   * @param {Array}   dash      - Dash pattern ([] for solid)
   * @param {number}  alpha     - Opacity (0-1)
   * @param {Object}  [astOverride] - Optional AST to plot instead of func.ast
   */
  function plotFunction(func, lineWidth, dash, alpha, astOverride) {
    var ast = astOverride || func.ast;
    if (!ast) return;

    var color = func.color;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);

    var v = state.view;
    var yRange = v.yMax - v.yMin;
    var jumpThreshold = yRange * 2; /* Asymptote detection threshold */

    /* Sample at every pixel column (or half-pixel for retina quality) */
    var samples = Math.ceil(W * 1.5);
    var points = new Array(samples);
    var params = func.params || {};

    for (var i = 0; i < samples; i++) {
      var sx = (i / (samples - 1)) * W;
      var wx = toWX(sx);
      var wy = evaluate(ast, wx, params);
      var sy = toSY(wy);
      points[i] = { sx: sx, sy: sy, wy: wy, valid: isOk(wy) };
    }

    /* Draw connected line segments, breaking at invalid points
       and at large jumps (asymptotes) */
    ctx.beginPath();
    var inPath = false;

    for (var j = 0; j < samples; j++) {
      var pt = points[j];

      if (!pt.valid) {
        /* Break the line at NaN / Infinity */
        inPath = false;
        continue;
      }

      /* Discontinuity detection in WORLD space:
         (a) |Δy| > 2× the visible y-range → asymptote (tan, 1/(x−1));
         (b) smaller but visible jumps (floor, sign) → midpoint test: for a
             continuous function f(midpoint) ≈ average of the endpoints,
             for a jump it hugs one side. Steep continuous curves (x³ at
             zoom) pass the midpoint test and stay connected. */
      if (j > 0 && points[j - 1].valid) {
        var prevPt = points[j - 1];
        var dyWorld = Math.abs(pt.wy - prevPt.wy);
        if (dyWorld > jumpThreshold) {
          inPath = false;
        } else if (dyWorld > yRange * 0.02) {
          var mwx = toWX((pt.sx + prevPt.sx) / 2);
          var mwy = evaluate(ast, mwx, params);
          if (!isOk(mwy) ||
              Math.abs(mwy - (pt.wy + prevPt.wy) / 2) > dyWorld * 0.4) {
            inPath = false;
          }
        }
      }

      if (!inPath) {
        ctx.moveTo(pt.sx, pt.sy);
        inPath = true;
      } else {
        ctx.lineTo(pt.sx, pt.sy);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  /** Plot all visible functions from state.funcs */
  function plotAllFunctions() {
    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.visible) continue;
      if (f.type === 'implicit') { plotImplicit(f); continue; }
      if (f.type === 'parametric') { plotParametric(f); continue; }
      if (f.type === 'polar') { plotPolar(f); continue; }
      if (f.inequality) { plotInequalityShading(f); continue; }
      if (!f.ast) continue;
      plotFunction(f, 2.5, [], 1);
    }
  }

  /** Plot first and/or second derivative overlays as dashed lines */
  function plotDerivatives() {
    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.visible || !f.ast) continue;

      /* First derivative: short dash */
      if (state.options.deriv1) {
        plotDerivLine(f, 1, [6, 4], 0.7);
      }

      /* Second derivative: dotted */
      if (state.options.deriv2) {
        plotDerivLine(f, 2, [2, 4], 0.5);
      }
    }
  }

  /**
   * Plot a numerical derivative of a function.
   *
   * @param {Object} func  - Function object
   * @param {number} order - 1 for first derivative, 2 for second
   * @param {Array}  dash  - Dash pattern
   * @param {number} alpha - Opacity
   */
  function plotDerivLine(func, order, dash, alpha) {
    if (!func.ast) return;
    var params = func.params || {};
    var v = state.view;
    var yRange = v.yMax - v.yMin;
    var samples = Math.ceil(W * 1.5);

    ctx.strokeStyle = func.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);

    var points = new Array(samples);
    for (var i = 0; i < samples; i++) {
      var sx = (i / (samples - 1)) * W;
      var wx = toWX(sx);
      var dy = (order === 1) ?
        numericalDeriv(func.ast, wx, params) :
        numericalDeriv2(func.ast, wx, params);
      var sy = toSY(dy);
      points[i] = { sx: sx, sy: sy, wy: dy, valid: isOk(dy) };
    }

    ctx.beginPath();
    var inPath = false;
    var jumpThreshold = yRange * 2; /* world-space asymptote threshold */
    for (var j = 0; j < samples; j++) {
      var pt = points[j];
      if (!pt.valid) { inPath = false; continue; }
      if (j > 0 && points[j - 1].valid) {
        var dyWorld = Math.abs(pt.wy - points[j - 1].wy);
        if (dyWorld > jumpThreshold) { inPath = false; }
      }
      if (!inPath) {
        ctx.moveTo(pt.sx, pt.sy);
        inPath = true;
      } else {
        ctx.lineTo(pt.sx, pt.sy);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  /**
   * Fill the region between the curve and the x-axis, splitting the polygon
   * at non-finite samples so shading across a pole (e.g. 1/x over [−1, 1])
   * does not draw a false region. Caller sets fillStyle / globalAlpha.
   */
  function fillIntegralPolygons(ast, params, xFrom, xTo, steps, dx, zeroSY) {
    var runStartSX = null;
    var inRun = false;
    ctx.beginPath();
    for (var i = 0; i <= steps + 1; i++) {
      var wx = xFrom + i * dx;
      var wy = (i <= steps) ? evaluate(ast, wx, params) : NaN; /* sentinel to close last run */
      if (i <= steps && isOk(wy)) {
        var sx = toSX(wx);
        if (!inRun) {
          runStartSX = sx;
          ctx.moveTo(sx, zeroSY);
          inRun = true;
        }
        ctx.lineTo(sx, toSY(wy));
      } else if (inRun) {
        /* Close this contiguous run back to the x-axis */
        var endSX = toSX(xFrom + (i - 1) * dx);
        ctx.lineTo(endSX, zeroSY);
        ctx.closePath();
        inRun = false;
      }
    }
    ctx.fill();
  }

  /**
   * Shade the area under a curve between xFrom and xTo (integral region).
   * Uses a filled polygon with semi-transparent fill.
   */
  function plotIntegral() {
    if (!state.integral.visible) return;
    /* Use selected function for integral display */
    var idx = state.selectedFunc;
    if (idx < 0 || idx >= state.funcs.length) return;
    var f = state.funcs[idx];
    if (!f.visible || !f.ast) return;

    var xFrom = state.integral.xFrom;
    var xTo   = state.integral.xTo;
    if (xFrom >= xTo) return;

    var params = f.params || {};
    var color = f.color;

    /* Build polygon: bottom edge at y=0, top edge along the curve */
    var steps = Math.max(200, Math.ceil(W));
    var dx = (xTo - xFrom) / steps;
    var zeroSY = toSY(0);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    fillIntegralPolygons(f.ast, params, xFrom, xTo, steps, dx, zeroSY);
    ctx.globalAlpha = 1;

    /* Draw vertical boundary lines at xFrom and xTo */
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(toSX(xFrom), 0);
    ctx.lineTo(toSX(xFrom), H);
    ctx.moveTo(toSX(xTo), 0);
    ctx.lineTo(toSX(xTo), H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }


  /* S11 ── Derivative & Integral Computation ──────────────── */

  /**
   * Compute first derivative at x using central difference method.
   * f'(x) ≈ [f(x+h) - f(x-h)] / (2h)
   *
   * @param {Object} ast    - Function AST
   * @param {number} x      - Point at which to differentiate
   * @param {Object} params - Parameter bindings
   * @returns {number} Approximate derivative value
   */
  function numericalDeriv(ast, x, params) {
    var h = 1e-7;
    var yPlus  = evaluate(ast, x + h, params);
    var yMinus = evaluate(ast, x - h, params);
    if (!isOk(yPlus) || !isOk(yMinus)) return NaN;
    return (yPlus - yMinus) / (2 * h);
  }

  /**
   * Compute second derivative at x using central difference method.
   * f''(x) ≈ [f(x+h) - 2f(x) + f(x-h)] / h²
   *
   * @param {Object} ast    - Function AST
   * @param {number} x      - Point at which to differentiate
   * @param {Object} params - Parameter bindings
   * @returns {number} Approximate second derivative value
   */
  function numericalDeriv2(ast, x, params) {
    var h = 1e-5;
    var yPlus  = evaluate(ast, x + h, params);
    var yMid   = evaluate(ast, x, params);
    var yMinus = evaluate(ast, x - h, params);
    if (!isOk(yPlus) || !isOk(yMid) || !isOk(yMinus)) return NaN;
    return (yPlus - 2 * yMid + yMinus) / (h * h);
  }

  /**
   * Compute definite integral using composite Simpson's 1/3 rule.
   * Uses ~1000 intervals for good accuracy on most functions.
   *
   * @param {Object} ast    - Function AST
   * @param {number} xFrom  - Lower integration bound
   * @param {number} xTo    - Upper integration bound
   * @param {Object} params - Parameter bindings
   * @returns {number} Approximate integral value
   */
  function computeIntegral(ast, xFrom, xTo, params) {
    /* Simpson's rule requires even number of intervals */
    var n = 1000;
    var h = (xTo - xFrom) / n;
    if (h === 0) return 0;

    var sum = evaluate(ast, xFrom, params) + evaluate(ast, xTo, params);
    if (!isOk(sum)) return NaN;

    for (var i = 1; i < n; i++) {
      var x = xFrom + i * h;
      var y = evaluate(ast, x, params);
      if (!isOk(y)) return NaN;
      sum += (i % 2 === 0) ? 2 * y : 4 * y;
    }

    return (h / 3) * sum;
  }

  /**
   * Find zeros (roots) of a function in a given interval using bisection.
   * Scans for sign changes then refines.
   *
   * @param {Object} ast    - Function AST
   * @param {number} xFrom  - Scan start
   * @param {number} xTo    - Scan end
   * @param {Object} params - Parameter bindings
   * @returns {Array} Array of approximate x-values where f(x) ≈ 0
   */
  function findZeros(ast, xFrom, xTo, params) {
    var zeros = [];
    var steps = 500;
    var dx = (xTo - xFrom) / steps;
    var MAX_ROOTS = 20;

    /* Sample function to find the characteristic scale (max |f(x)| in view) */
    var maxAbs = 0;
    for (var s = 0; s <= 50; s++) {
      var sv = evaluate(ast, xFrom + (s / 50) * (xTo - xFrom), params);
      if (isOk(sv) && Math.abs(sv) > maxAbs) maxAbs = Math.abs(sv);
    }
    /* Minimum meaningful crossing: at least 0.1% of the function's range */
    var threshold = maxAbs * 0.001;
    if (threshold < 1e-10) threshold = 1e-10;

    /* Acceptance tolerance: a refined root must actually satisfy
       |f(root)| ≈ 0 relative to the function's local scale. This
       rejects poles (tan, 1/x), where bisection converges on the
       asymptote but |f| stays huge. */
    var acceptTol = Math.max(threshold, 1e-9);

    /** Newton refinement around a coarse sample (used by the
        near-zero fast path so raw low-precision samples are never
        pushed directly). Falls back to x0 if Newton diverges. */
    function refineNewton(x0) {
      var xr = x0;
      for (var n = 0; n < 30; n++) {
        var fx = evaluate(ast, xr, params);
        if (!isOk(fx)) return x0;
        if (Math.abs(fx) < 1e-14) break;
        var h = Math.max(Math.abs(xr), 1) * 1e-7;
        var d = (evaluate(ast, xr + h, params) - evaluate(ast, xr - h, params)) / (2 * h);
        if (!isOk(d) || Math.abs(d) < 1e-14) break;
        var xn = xr - fx / d;
        /* Keep the iterate inside the scan interval; touching zeros (x²)
           can sit many samples away from where |f| first dips below the
           threshold, so allow wandering within the interval. */
        if (!isOk(xn) || xn < xFrom || xn > xTo) break;
        if (Math.abs(xn - xr) < 1e-14) { xr = xn; break; }
        xr = xn;
      }
      return xr;
    }

    var prevY = evaluate(ast, xFrom, params);
    for (var i = 1; i <= steps; i++) {
      var x = xFrom + i * dx;
      var y = evaluate(ast, x, params);

      if (!isOk(prevY) || !isOk(y)) { prevY = y; continue; }

      /* Sign change detected — bisect, then verify it is a root, not a pole */
      if (prevY * y < 0 && (Math.abs(prevY) > threshold || Math.abs(y) > threshold)) {
        var lo = x - dx, hi = x;
        for (var j = 0; j < 60; j++) {
          var mid = (lo + hi) / 2;
          var midY = evaluate(ast, mid, params);
          if (!isOk(midY)) break;
          if (midY * evaluate(ast, lo, params) < 0) hi = mid;
          else lo = mid;
        }
        var root = (lo + hi) / 2;
        var fRoot = evaluate(ast, root, params);
        /* Reject poles: at a genuine root |f| collapses toward 0; at an
           asymptote it stays at (or above) the sampled scale. */
        if (isOk(fRoot) && Math.abs(fRoot) <= acceptTol) {
          zeros.push(roundSig(root, 8));
          if (zeros.length >= MAX_ROOTS) break;
        }
        prevY = y;
        continue;
      }

      /* Near-zero fast path (touching zeros / exact samples): refine with
         Newton instead of pushing the raw sample, then verify. */
      if (Math.abs(y) < threshold) {
        var neighborY = evaluate(ast, x + dx, params);
        if ((isOk(neighborY) && Math.abs(neighborY) > threshold) ||
            (Math.abs(prevY) > threshold)) {
          var r2 = refineNewton(x);
          var f2 = evaluate(ast, r2, params);
          if (isOk(f2) && Math.abs(f2) <= acceptTol) {
            zeros.push(roundSig(r2, 8));
            if (zeros.length >= MAX_ROOTS) break;
          }
        }
      }
      prevY = y;
    }

    /* Deduplicate roots that are very close together (sorted merge, so
       refined duplicates from adjacent samples collapse to one root) */
    zeros.sort(function (a, b) { return a - b; });
    var unique = [];
    for (var k = 0; k < zeros.length; k++) {
      if (unique.length === 0 || Math.abs(zeros[k] - unique[unique.length - 1]) > dx * 0.5) {
        unique.push(zeros[k]);
      }
    }
    return unique;
  }

  /**
   * Find local extrema (minima and maxima) in a given interval.
   * Looks for sign changes in the first derivative.
   *
   * @param {Object} ast    - Function AST
   * @param {number} xFrom  - Scan start
   * @param {number} xTo    - Scan end
   * @param {Object} params - Parameter bindings
   * @returns {Array} Array of { x, y, type: 'min'|'max' }
   */
  function findExtrema(ast, xFrom, xTo, params) {
    var result = [];
    var steps = 500;
    var dx = (xTo - xFrom) / steps;
    var MAX_EXTREMA = 20;

    /* Compute characteristic scale to filter noise at asymptotes */
    var maxAbsY = 0;
    for (var s = 0; s <= 50; s++) {
      var sv = evaluate(ast, xFrom + (s / 50) * (xTo - xFrom), params);
      if (isOk(sv) && Math.abs(sv) > maxAbsY) maxAbsY = Math.abs(sv);
    }
    var yThreshold = maxAbsY * 100; /* reject extrema with absurdly large y */
    if (yThreshold < 1) yThreshold = 1e8;

    var prevD = numericalDeriv(ast, xFrom, params);
    for (var i = 1; i <= steps; i++) {
      var x = xFrom + i * dx;
      var d = numericalDeriv(ast, x, params);

      if (!isOk(prevD) || !isOk(d)) { prevD = d; continue; }

      /* Derivative sign change or derivative crossing zero */
      var crossed = (prevD * d < 0) || (Math.abs(d) < 1e-10 && Math.abs(prevD) > 1e-8);
      if (crossed) {
        /* Refine with bisection */
        var lo = x - dx, hi = x;
        for (var j = 0; j < 50; j++) {
          var mid = (lo + hi) / 2;
          var midD = numericalDeriv(ast, mid, params);
          if (!isOk(midD)) break;
          if (midD * numericalDeriv(ast, lo, params) < 0) hi = mid;
          else lo = mid;
        }
        var ex = (lo + hi) / 2;
        var ey = evaluate(ast, ex, params);

        /* Skip if y-value is absurdly large (asymptote noise) */
        if (!isOk(ey) || Math.abs(ey) > yThreshold) { prevD = d; continue; }

        var d2 = numericalDeriv2(ast, ex, params);
        var type = d2 > 0 ? 'min' : 'max';
        result.push({ x: roundSig(ex, 6), y: roundSig(ey, 6), type: type });
        if (result.length >= MAX_EXTREMA) break;
      }
      prevD = d;
    }
    return result;
  }


  /* S12 ── Point Tracing & Hover ──────────────────────────── */

  /**
   * Handle canvas mousemove for point tracing.
   * Finds the closest visible function to the cursor and sets hoverPoint.
   *
   * @param {number} mouseScreenX - Mouse X in CSS pixels relative to canvas
   * @param {number} mouseScreenY - Mouse Y in CSS pixels relative to canvas
   */
  function updateHoverPoint(mouseScreenX, mouseScreenY) {
    var wx = toWX(mouseScreenX);
    var bestFunc = -1;
    var bestDist = Infinity;
    var bestWY = 0;

    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.visible || !f.ast) continue;

      var wy = evaluate(f.ast, wx, f.params || {});
      if (!isOk(wy)) continue;

      var sy = toSY(wy);
      var dist = Math.abs(sy - mouseScreenY);

      if (dist < bestDist) {
        bestDist = dist;
        bestFunc = i;
        bestWY = wy;
      }
    }

    /* Only show hover if within 28 CSS pixels of a curve (snap tolerance for
       tangent / derivative / integral tools — wider = easier to hit) */
    if (bestFunc >= 0 && bestDist < 28) {
      state.hoverPoint = {
        funcIdx: bestFunc,
        wx: wx,
        wy: bestWY
      };
    } else {
      state.hoverPoint = null;
    }
  }

  /**
   * Draw the hover crosshair, point marker, and coordinate tooltip.
   */
  function drawHover() {
    var hp = state.hoverPoint;
    if (!hp) return;

    var sx = toSX(hp.wx);
    var sy = toSY(hp.wy);
    var func = state.funcs[hp.funcIdx];
    if (!func) return;
    var color = func.color;

    /* ── Vertical dashed crosshair line ────────────── */
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H);
    ctx.stroke();
    ctx.setLineDash([]);

    /* ── Horizontal dashed crosshair line ─────────── */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(W, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    /* ── Point marker (filled circle) ─────────────── */
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();

    /* White ring around the point */
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.stroke();

    /* ── Tooltip with coordinates ─────────────────── */
    var xStr = formatNum(roundSig(hp.wx, 5));
    var yStr = formatNum(roundSig(hp.wy, 5));
    var label = (func.label || 'f') + '(' + xStr + ') = ' + yStr;

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var tw = ctx.measureText(label).width;
    var padding = 8;
    var boxW = tw + padding * 2;
    var boxH = 22;

    /* Position tooltip: prefer upper-right of the point, but keep on-canvas */
    var tipX = sx + 12;
    var tipY = sy - 28;

    if (tipX + boxW > W - 4) tipX = sx - boxW - 12;
    if (tipY < 4) tipY = sy + 12;
    if (tipY + boxH > H - 4) tipY = H - boxH - 4;

    /* Tooltip background */
    ctx.fillStyle = 'rgba(13, 17, 23, 0.88)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, tipX, tipY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    /* Tooltip text */
    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tipX + padding, tipY + boxH / 2);
  }

  /** Draw a rounded rectangle path (helper for tooltips) */
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


  /* S13 ── Zoom, Pan & Touch ──────────────────────────────── */

  /**
   * Apply a zoom factor centred on a given world-space point.
   *
   * @param {number} factor   - Zoom factor (>1 zooms out, <1 zooms in)
   * @param {number} centreWX - World X to zoom towards
   * @param {number} centreWY - World Y to zoom towards
   */
  function zoomAtPoint(factor, centreWX, centreWY) {
    var v = state.view;
    var newXMin = centreWX - (centreWX - v.xMin) * factor;
    var newXMax = centreWX + (v.xMax - centreWX) * factor;
    var newYMin = centreWY - (centreWY - v.yMin) * factor;
    var newYMax = centreWY + (v.yMax - centreWY) * factor;

    /* Clamp to sane bounds */
    var xRange = newXMax - newXMin;
    var yRange = newYMax - newYMin;

    if (xRange < 1e-10 || yRange < 1e-10) return; /* Too zoomed in */
    if (xRange > 1e10 || yRange > 1e10) return;    /* Too zoomed out */

    v.xMin = newXMin;
    v.xMax = newXMax;
    v.yMin = newYMin;
    v.yMax = newYMax;
  }

  /**
   * Get CSS-pixel mouse coordinates relative to the canvas element.
   *
   * @param {Event} e - Mouse or pointer event
   * @returns {{ x: number, y: number }}
   */
  function canvasCoords(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  /**
   * Get CSS-pixel touch coordinates relative to the canvas.
   *
   * @param {Touch} touch - A single Touch object
   * @returns {{ x: number, y: number }}
   */
  function touchCoords(touch) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  /* ── Mouse wheel zoom ──────────────────────────────── */

  function onWheel(e) {
    /* Only zoom when Ctrl/Cmd is held — otherwise let page scroll normally */
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    var pos = canvasCoords(e);
    var wx = toWX(pos.x);
    var wy = toWY(pos.y);
    var factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    zoomAtPoint(factor, wx, wy);
    draw();
  }

  /* ── Pointer drag (pan) ────────────────────────────── */

  function onPointerDown(e) {
    /* Ignore if event originates from sidebar or controls */
    if (e.target !== canvas) return;
    if (e.button !== 0) return; /* Left button only */

    /* Sketch tool — begin new stroke (world coords) */
    if (state.tool === 'sketch') {
      var pos = canvasCoords(e);
      state.activeStroke = {
        points: [{ wx: toWX(pos.x), wy: toWY(pos.y), p: e.pressure || 0.5 }],
        color: state.sketchColor,
        width: state.sketchWidth
      };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    /* Shape tool — begin new shape in world coords (text handled separately on pointerUp) */
    if (state.tool === 'shape' && state.shapeType !== 'text') {
      var spos = canvasCoords(e);
      var swx = toWX(spos.x), swy = toWY(spos.y);
      state.activeShape = {
        type: state.shapeType, wx1: swx, wy1: swy, wx2: swx, wy2: swy,
        color: state.shapeColor, width: state.shapeWidth, filled: state.shapeFilled, rotation: 0
      };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    /* Check for annotation selection/drag in move mode */
    if (state.tool === 'move') {
      var mpos = canvasCoords(e);

      /* Check action icon clicks first */
      if (state.selectedAnnotation >= 0) {
        if (hitBtn(mpos.x, mpos.y, selectionUI.deleteBtn)) {
          deleteSelectedAnnotation();
          return;
        }
        if (hitBtn(mpos.x, mpos.y, selectionUI.dupBtn)) {
          duplicateSelectedAnnotation();
          return;
        }
        if (hitBtn(mpos.x, mpos.y, selectionUI.rotateBtn)) {
          rotateSelectedAnnotation();
          return;
        }
        /* Check corner resize */
        var bounds = getSelectionBounds();
        var corner = hitCorner(mpos.x, mpos.y, bounds);
        if (corner) {
          state.dragAnnotation = {
            type: state.selectedAnnotationType, idx: state.selectedAnnotation,
            lastWx: toWX(mpos.x), lastWy: toWY(mpos.y), corner: corner
          };
          canvas.setPointerCapture(e.pointerId);
          canvas.style.cursor = (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize';
          return;
        }
      }

      var hit = findNearestAnnotation(mpos.x, mpos.y);
      if (hit) {
        state.selectedAnnotation = hit.idx;
        state.selectedAnnotationType = hit.type;
        saveUndo();
        state.dragAnnotation = { type: hit.type, idx: hit.idx, lastWx: toWX(mpos.x), lastWy: toWY(mpos.y), corner: null };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'move';
        draw();
        return;
      }
      /* Click inside selection box — drag the selected annotation */
      if (state.selectedAnnotation >= 0) {
        var sBounds = getSelectionBounds();
        if (sBounds && sBounds.corners && pointInPolygon(mpos.x, mpos.y, sBounds.corners)) {
          state.dragAnnotation = {
            type: state.selectedAnnotationType, idx: state.selectedAnnotation,
            lastWx: toWX(mpos.x), lastWy: toWY(mpos.y), corner: null
          };
          canvas.setPointerCapture(e.pointerId);
          canvas.style.cursor = 'move';
          return;
        }
      }
      /* Clicked empty area — clear selection */
      if (state.selectedAnnotation >= 0) {
        state.selectedAnnotation = -1;
        state.selectedAnnotationType = '';
        draw();
      }
    }

    state.dragging = true;
    state.dragStart = canvasCoords(e);
    state.dragView = deepClone(state.view);
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    var pos = canvasCoords(e);
    state.cursorPos = pos;

    /* Sketch tool — append point to active stroke (world coords) */
    if (state.tool === 'sketch' && state.activeStroke) {
      state.activeStroke.points.push({ wx: toWX(pos.x), wy: toWY(pos.y), p: e.pressure || 0.5 });
      draw();
      return;
    }

    /* Annotation drag — move or resize selected shape/stroke */
    if (state.dragAnnotation) {
      var nowWx = toWX(pos.x), nowWy = toWY(pos.y);

      if (state.dragAnnotation.corner) {
        /* Corner resize */
        if (state.dragAnnotation.type === 'shape') {
          var rsh = state.shapes[state.dragAnnotation.idx];
          if (rsh) {
            var c = state.dragAnnotation.corner;
            if (c === 'nw')      { rsh.wx1 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'ne') { rsh.wx2 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'sw') { rsh.wx1 = nowWx; rsh.wy2 = nowWy; }
            else if (c === 'se') { rsh.wx2 = nowWx; rsh.wy2 = nowWy; }
          }
        } else if (state.dragAnnotation.type === 'stroke') {
          /* Scale stroke from opposite corner */
          var rst = state.strokes[state.dragAnnotation.idx];
          if (rst && rst.points.length > 0) {
            var dwx = nowWx - state.dragAnnotation.lastWx;
            var dwy = nowWy - state.dragAnnotation.lastWy;
            var sb = getSelectionBounds();
            if (sb) {
              var anchorWx, anchorWy;
              var rc = state.dragAnnotation.corner;
              if (rc === 'nw')      { anchorWx = toWX(sb.maxX); anchorWy = toWY(sb.maxY); }
              else if (rc === 'ne') { anchorWx = toWX(sb.minX); anchorWy = toWY(sb.maxY); }
              else if (rc === 'sw') { anchorWx = toWX(sb.maxX); anchorWy = toWY(sb.minY); }
              else                  { anchorWx = toWX(sb.minX); anchorWy = toWY(sb.minY); }
              var oldW = toWX(sb.maxX) - toWX(sb.minX);
              var oldH = toWY(sb.minY) - toWY(sb.maxY);
              var newW = oldW + (rc === 'nw' || rc === 'sw' ? -dwx : dwx);
              var newH = oldH + (rc === 'nw' || rc === 'ne' ? dwy : -dwy);
              if (Math.abs(oldW) > 0.001 && Math.abs(oldH) > 0.001) {
                var sx = newW / oldW, sy = newH / oldH;
                for (var si = 0; si < rst.points.length; si++) {
                  rst.points[si].wx = anchorWx + (rst.points[si].wx - anchorWx) * sx;
                  rst.points[si].wy = anchorWy + (rst.points[si].wy - anchorWy) * sy;
                }
              }
            }
          }
        }
      } else {
        /* Normal drag — translate */
        var tdwx = nowWx - state.dragAnnotation.lastWx;
        var tdwy = nowWy - state.dragAnnotation.lastWy;
        if (state.dragAnnotation.type === 'shape') {
          var sh = state.shapes[state.dragAnnotation.idx];
          if (sh) { sh.wx1 += tdwx; sh.wy1 += tdwy; sh.wx2 += tdwx; sh.wy2 += tdwy; }
        } else if (state.dragAnnotation.type === 'stroke') {
          var st = state.strokes[state.dragAnnotation.idx];
          if (st) {
            for (var pi = 0; pi < st.points.length; pi++) {
              st.points[pi].wx += tdwx;
              st.points[pi].wy += tdwy;
            }
          }
        }
      }
      state.dragAnnotation.lastWx = nowWx;
      state.dragAnnotation.lastWy = nowWy;
      draw();
      return;
    }

    /* Hover cursor feedback in move mode (before click) */
    if (state.tool === 'move' && !state.dragging) {
      var hBounds = getSelectionBounds();
      var hCorner = hitCorner(pos.x, pos.y, hBounds);
      if (hCorner) {
        canvas.style.cursor = (hCorner === 'nw' || hCorner === 'se') ? 'nwse-resize' : 'nesw-resize';
      } else if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn) || hitBtn(pos.x, pos.y, selectionUI.dupBtn) || hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) {
        canvas.style.cursor = 'pointer';
      } else if (hBounds && hBounds.corners && pointInPolygon(pos.x, pos.y, hBounds.corners)) {
        /* Inside selection box — show move cursor */
        canvas.style.cursor = 'move';
      } else if (findNearestAnnotation(pos.x, pos.y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }

    /* Shape tool — update endpoint for live preview (world coords) */
    if (state.tool === 'shape' && state.activeShape) {
      state.activeShape.wx2 = toWX(pos.x);
      state.activeShape.wy2 = toWY(pos.y);
      draw();
      return;
    }

    if (state.dragging && state.dragStart && state.dragView) {
      /* Compute delta in world coordinates */
      var dv = state.dragView;
      var dxScreen = pos.x - state.dragStart.x;
      var dyScreen = pos.y - state.dragStart.y;
      var dxWorld = dxScreen / W * (dv.xMax - dv.xMin);
      var dyWorld = dyScreen / H * (dv.yMax - dv.yMin);

      state.view.xMin = dv.xMin - dxWorld;
      state.view.xMax = dv.xMax - dxWorld;
      state.view.yMin = dv.yMin + dyWorld; /* Inverted Y */
      state.view.yMax = dv.yMax + dyWorld;

      state.hoverPoint = null;
      draw();
    } else {
      /* Not dragging — update hover point */
      updateHoverPoint(pos.x, pos.y);
      draw();
    }
  }

  function onPointerUp(e) {
    /* Annotation drag — finalize */
    if (state.dragAnnotation) {
      state.dragAnnotation = null;
      if (canvas) canvas.style.cursor = 'crosshair';
      draw();
      return;
    }

    /* Sketch tool — finalize stroke and auto-exit */
    if (state.tool === 'sketch' && state.activeStroke) {
      if (state.activeStroke.points.length >= 2) {
        state.strokes.push(state.activeStroke);
      }
      state.activeStroke = null;
      draw();
      setTool('move');
      return;
    }

    /* Shape tool — finalize shape or handle text click */
    if (state.tool === 'shape') {
      if (state.activeShape) {
        /* Only save if dragged a meaningful distance (check in screen px) */
        var sdx = toSX(state.activeShape.wx2) - toSX(state.activeShape.wx1);
        var sdy = toSY(state.activeShape.wy2) - toSY(state.activeShape.wy1);
        if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) {
          state.shapes.push(state.activeShape);
        }
        state.activeShape = null;
        draw();
        setTool('move');
        return;
      }
      /* Text shape — show inline input at click position */
      if (state.shapeType === 'text') {
        var tpos = canvasCoords(e);
        showShapeTextInput(toWX(tpos.x), toWY(tpos.y));
        return;
      }
    }

    var didDrag = false;
    if (state.dragging && state.dragStart) {
      var pos = canvasCoords(e);
      var dx = pos.x - state.dragStart.x;
      var dy = pos.y - state.dragStart.y;
      didDrag = (Math.abs(dx) > 3 || Math.abs(dy) > 3);
      state.dragging = false;
      state.dragStart = null;
      state.dragView = null;
      /* Restore tool-specific cursor instead of always crosshair */
      if (state.tool === 'move') canvas.style.cursor = 'crosshair';
      else if (state.tool === 'point') canvas.style.cursor = 'copy';
      else if (state.tool === 'sketch') canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'pointer';
    }
    /* Tool-specific click (if didn't drag) */
    if (!didDrag && e.target === canvas) {
      var clickWx = toWX(e.offsetX);
      var clickWy = toWY(e.offsetY);
      if (state.tool === 'point') {
        addGraphPoint(clickWx, clickWy);
      } else if (state.tool === 'tangent' && state.hoverPoint) {
        addTangentAt(state.hoverPoint.funcIdx, state.hoverPoint.wx);
      } else if (state.tool === 'intersect') {
        findAllIntersections();
        draw();
      } else if (state.tool === 'derivative' || state.tool === 'integral') {
        handleTwoClickTool();
      }
    }
    /* Always recompute intersections after pan/zoom */
    if (didDrag) { findAllIntersections(); }
  }

  /* ── Touch: pinch-to-zoom and two-finger pan ───────── */

  function getTouchDistance(t1, t2) {
    var dx = t1.clientX - t2.clientX;
    var dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMidpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function onTouchStart(e) {
    if (e.target !== canvas) return;

    if (e.touches.length === 2) {
      /* Begin pinch — abort any active sketch/shape */
      e.preventDefault();
      if (state.activeStroke) { state.activeStroke = null; }
      if (state.activeShape) { state.activeShape = null; }
      var t1 = e.touches[0], t2 = e.touches[1];
      state.pinch = {
        dist: getTouchDistance(t1, t2),
        mid: getTouchMidpoint(t1, t2),
        view: deepClone(state.view)
      };
      state.dragging = false;
    } else if (e.touches.length === 1) {
      if (state.tool === 'sketch') {
        /* Sketch: begin stroke via touch (world coords) */
        e.preventDefault();
        var spos = touchCoords(e.touches[0]);
        state.activeStroke = {
          points: [{ wx: toWX(spos.x), wy: toWY(spos.y), p: e.touches[0].force || 0.5 }],
          color: state.sketchColor,
          width: state.sketchWidth
        };
        return;
      }
      if (state.tool === 'shape' && state.shapeType !== 'text') {
        /* Shape: begin shape via touch (world coords) */
        e.preventDefault();
        var shpos = touchCoords(e.touches[0]);
        var shwx = toWX(shpos.x), shwy = toWY(shpos.y);
        state.activeShape = {
          type: state.shapeType, wx1: shwx, wy1: shwy, wx2: shwx, wy2: shwy,
          color: state.shapeColor, width: state.shapeWidth, filled: state.shapeFilled, rotation: 0
        };
        return;
      }
      /* Check annotation action icons, corner resize, or drag in move mode */
      if (state.tool === 'move') {
        var tpos = touchCoords(e.touches[0]);

        /* Action icon taps */
        if (state.selectedAnnotation >= 0) {
          if (hitBtn(tpos.x, tpos.y, selectionUI.deleteBtn)) {
            e.preventDefault();
            deleteSelectedAnnotation();
            return;
          }
          if (hitBtn(tpos.x, tpos.y, selectionUI.dupBtn)) {
            e.preventDefault();
            duplicateSelectedAnnotation();
            return;
          }
          if (hitBtn(tpos.x, tpos.y, selectionUI.rotateBtn)) {
            e.preventDefault();
            rotateSelectedAnnotation();
            return;
          }
          /* Corner resize */
          var tBounds = getSelectionBounds();
          var tCorner = hitCorner(tpos.x, tpos.y, tBounds);
          if (tCorner) {
            state.dragAnnotation = {
              type: state.selectedAnnotationType, idx: state.selectedAnnotation,
              lastWx: toWX(tpos.x), lastWy: toWY(tpos.y), corner: tCorner
            };
            e.preventDefault();
            return;
          }
        }

        var thit = findNearestAnnotation(tpos.x, tpos.y);
        if (thit) {
          state.selectedAnnotation = thit.idx;
          state.selectedAnnotationType = thit.type;
          state.dragAnnotation = { type: thit.type, idx: thit.idx, lastWx: toWX(tpos.x), lastWy: toWY(tpos.y), corner: null };
          e.preventDefault();
          draw();
          return;
        }
        /* Touch inside selection box — drag the selected annotation */
        if (state.selectedAnnotation >= 0) {
          var tsBounds = getSelectionBounds();
          if (tsBounds && tsBounds.corners && pointInPolygon(tpos.x, tpos.y, tsBounds.corners)) {
            state.dragAnnotation = {
              type: state.selectedAnnotationType, idx: state.selectedAnnotation,
              lastWx: toWX(tpos.x), lastWy: toWY(tpos.y), corner: null
            };
            e.preventDefault();
            return;
          }
        }
      }
      /* Single-finger pan */
      var pos = touchCoords(e.touches[0]);
      state.dragging = true;
      state.dragStart = pos;
      state.dragView = deepClone(state.view);
    }
  }

  function onTouchMove(e) {
    if (e.target !== canvas) return;

    if (e.touches.length === 2 && state.pinch) {
      e.preventDefault();
      var t1 = e.touches[0], t2 = e.touches[1];
      var newDist = getTouchDistance(t1, t2);
      var newMid  = getTouchMidpoint(t1, t2);

      /* Zoom factor from pinch distance change */
      var factor = state.pinch.dist / newDist;

      /* Restore original view, then apply zoom */
      var pv = state.pinch.view;
      state.view = deepClone(pv);

      /* Compute world-space centre of pinch */
      var rect = canvas.getBoundingClientRect();
      var midX = state.pinch.mid.x - rect.left;
      var midY = state.pinch.mid.y - rect.top;
      var centreWX = toWX(midX);
      var centreWY = toWY(midY);

      zoomAtPoint(factor, centreWX, centreWY);

      /* Also handle two-finger pan (midpoint shift) */
      var panDX = (newMid.x - state.pinch.mid.x) / W * (pv.xMax - pv.xMin);
      var panDY = (newMid.y - state.pinch.mid.y) / H * (pv.yMax - pv.yMin);
      state.view.xMin -= panDX;
      state.view.xMax -= panDX;
      state.view.yMin += panDY;
      state.view.yMax += panDY;

      draw();
    } else if (e.touches.length === 1 && state.dragAnnotation) {
      /* Annotation drag or resize via touch */
      e.preventDefault();
      var apos = touchCoords(e.touches[0]);
      var anWx = toWX(apos.x), anWy = toWY(apos.y);
      if (state.dragAnnotation.corner) {
        /* Corner resize via touch */
        if (state.dragAnnotation.type === 'shape') {
          var rsh = state.shapes[state.dragAnnotation.idx];
          if (rsh) {
            var tc = state.dragAnnotation.corner;
            if (tc === 'nw')      { rsh.wx1 = anWx; rsh.wy1 = anWy; }
            else if (tc === 'ne') { rsh.wx2 = anWx; rsh.wy1 = anWy; }
            else if (tc === 'sw') { rsh.wx1 = anWx; rsh.wy2 = anWy; }
            else if (tc === 'se') { rsh.wx2 = anWx; rsh.wy2 = anWy; }
          }
        }
      } else {
        /* Normal translate via touch */
        var adwx = anWx - state.dragAnnotation.lastWx;
        var adwy = anWy - state.dragAnnotation.lastWy;
        if (state.dragAnnotation.type === 'shape') {
          var ash = state.shapes[state.dragAnnotation.idx];
          if (ash) { ash.wx1 += adwx; ash.wy1 += adwy; ash.wx2 += adwx; ash.wy2 += adwy; }
        } else if (state.dragAnnotation.type === 'stroke') {
          var ast = state.strokes[state.dragAnnotation.idx];
          if (ast) { for (var ai = 0; ai < ast.points.length; ai++) { ast.points[ai].wx += adwx; ast.points[ai].wy += adwy; } }
        }
      }
      state.dragAnnotation.lastWx = anWx;
      state.dragAnnotation.lastWy = anWy;
      draw();
    } else if (e.touches.length === 1 && state.tool === 'sketch' && state.activeStroke) {
      /* Sketch: add point via touch (world coords) */
      e.preventDefault();
      var spos = touchCoords(e.touches[0]);
      state.activeStroke.points.push({ wx: toWX(spos.x), wy: toWY(spos.y), p: e.touches[0].force || 0.5 });
      draw();
    } else if (e.touches.length === 1 && state.tool === 'shape' && state.activeShape) {
      /* Shape: update endpoint via touch (world coords) */
      e.preventDefault();
      var shpos = touchCoords(e.touches[0]);
      state.activeShape.wx2 = toWX(shpos.x);
      state.activeShape.wy2 = toWY(shpos.y);
      draw();
    } else if (e.touches.length === 1 && state.dragging && state.dragStart && state.dragView) {
      /* Single-finger pan */
      var pos = touchCoords(e.touches[0]);
      var dv = state.dragView;
      var dxScreen = pos.x - state.dragStart.x;
      var dyScreen = pos.y - state.dragStart.y;
      var dxWorld = dxScreen / W * (dv.xMax - dv.xMin);
      var dyWorld = dyScreen / H * (dv.yMax - dv.yMin);

      state.view.xMin = dv.xMin - dxWorld;
      state.view.xMax = dv.xMax - dxWorld;
      state.view.yMin = dv.yMin + dyWorld;
      state.view.yMax = dv.yMax + dyWorld;

      draw();
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) {
      state.pinch = null;
    }
    if (e.touches.length === 0) {
      /* Finalize annotation drag on touch end */
      if (state.dragAnnotation) { state.dragAnnotation = null; draw(); }
      /* Finalize sketch stroke on touch end + auto-exit */
      if (state.activeStroke) {
        if (state.activeStroke.points.length >= 2) {
          state.strokes.push(state.activeStroke);
        }
        state.activeStroke = null;
        draw();
        setTool('move');
      }
      /* Finalize shape on touch end + auto-exit */
      if (state.activeShape) {
        var sdx = toSX(state.activeShape.wx2) - toSX(state.activeShape.wx1);
        var sdy = toSY(state.activeShape.wy2) - toSY(state.activeShape.wy1);
        if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) {
          state.shapes.push(state.activeShape);
        }
        state.activeShape = null;
        draw();
        setTool('move');
      }
      state.dragging = false;
      state.dragStart = null;
      state.dragView = null;
    }
  }

  /* ── Zoom toolbar buttons ──────────────────────────── */

  /** Zoom in by 1.5× centred on the current view centre */
  function zoomIn() {
    var v = state.view;
    var cx = (v.xMin + v.xMax) / 2;
    var cy = (v.yMin + v.yMax) / 2;
    zoomAtPoint(1 / 1.5, cx, cy);
    draw();
  }

  /** Zoom out by 1.5× centred on the current view centre */
  function zoomOut() {
    var v = state.view;
    var cx = (v.xMin + v.xMax) / 2;
    var cy = (v.yMin + v.yMax) / 2;
    zoomAtPoint(1.5, cx, cy);
    draw();
  }

  /** Reset view to default -10..10, -7..7 */
  function resetView() {
    saveUndo();
    state.view.xMin = -10;
    state.view.xMax = 10;
    state.view.yMin = -7;
    state.view.yMax = 7;
    runAnalysis();
    findAllIntersections();
    draw();
  }

  /**
   * Zoom to fit: compute y-range of all visible functions across
   * the current x-range and set the view accordingly.
   */
  function zoomToFit() {
    saveUndo();
    var v = state.view;
    var yMin = Infinity, yMax = -Infinity;
    var found = false;
    var samples = 300;

    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.visible || !f.ast) continue;
      var params = f.params || {};

      for (var s = 0; s <= samples; s++) {
        var wx = v.xMin + (s / samples) * (v.xMax - v.xMin);
        var wy = evaluate(f.ast, wx, params);
        if (isOk(wy) && Math.abs(wy) < 1e8) {
          if (wy < yMin) yMin = wy;
          if (wy > yMax) yMax = wy;
          found = true;
        }
      }
    }

    if (!found) { resetView(); return; }

    /* Add 10% padding */
    var pad = (yMax - yMin) * 0.1;
    if (pad < 0.5) pad = 0.5;
    v.yMin = yMin - pad;
    v.yMax = yMax + pad;
    runAnalysis();
    findAllIntersections();
    draw();
  }

  /* ── Attach all canvas event listeners ─────────────── */

  /* ── Freehand Sketch Rendering ────────────────────────── */

  /**
   * Render a single stroke with pressure-sensitive width and quadratic smoothing.
   */
  function renderStroke(stroke) {
    var pts = stroke.points;
    if (pts.length < 2) return;

    /* Apply rotation if set */
    var sRot = stroke.rotation || 0;
    if (sRot) {
      var sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
      for (var ri = 0; ri < pts.length; ri++) {
        var rpx = toSX(pts[ri].wx), rpy = toSY(pts[ri].wy);
        if (rpx < sMinX) sMinX = rpx; if (rpy < sMinY) sMinY = rpy;
        if (rpx > sMaxX) sMaxX = rpx; if (rpy > sMaxY) sMaxY = rpy;
      }
      var scx = (sMinX + sMaxX) / 2, scy = (sMinY + sMaxY) / 2;
      ctx.save();
      ctx.translate(scx, scy);
      ctx.rotate(sRot);
      ctx.translate(-scx, -scy);
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;

    /* Check if any point has meaningful pressure data */
    var hasPressure = false;
    for (var k = 0; k < pts.length; k++) {
      if (pts[k].p > 0 && Math.abs(pts[k].p - 0.5) > 0.05) { hasPressure = true; break; }
    }

    if (!hasPressure) {
      /* No pressure — draw as single-width smooth path (world→screen) */
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(toSX(pts[0].wx), toSY(pts[0].wy));
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (toSX(pts[i].wx) + toSX(pts[i + 1].wx)) / 2;
        var my = (toSY(pts[i].wy) + toSY(pts[i + 1].wy)) / 2;
        ctx.quadraticCurveTo(toSX(pts[i].wx), toSY(pts[i].wy), mx, my);
      }
      ctx.lineTo(toSX(pts[pts.length - 1].wx), toSY(pts[pts.length - 1].wy));
      ctx.stroke();
    } else {
      /* Pressure-sensitive — draw segment by segment with varying width */
      for (var j = 1; j < pts.length; j++) {
        var p0 = pts[j - 1];
        var p1 = pts[j];
        var w = stroke.width * (0.4 + p1.p * 0.8);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(toSX(p0.wx), toSY(p0.wy));
        ctx.lineTo(toSX(p1.wx), toSY(p1.wy));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (sRot) ctx.restore();
  }

  /**
   * Draw all completed strokes and the active (in-progress) stroke.
   */
  /**
   * Draw a colored dot at the cursor position when sketch or shape tool is active.
   */
  function drawCursorDot() {
    if (!state.cursorPos) return;
    if (state.tool !== 'sketch' && state.tool !== 'shape') return;
    var color = state.tool === 'sketch' ? state.sketchColor : state.shapeColor;
    var size = state.tool === 'sketch' ? state.sketchWidth : state.shapeWidth;
    var r = Math.max(3, size);
    ctx.beginPath();
    ctx.arc(state.cursorPos.x, state.cursorPos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Live guidance for curve-snap tools (tangent / derivative / integral).
   * These tools only act when the cursor is on a plotted curve, so when the
   * cursor is in empty graph space we show a small "move onto the curve" hint
   * next to the pointer — turning a silent no-op into visible feedback.
   */
  function drawToolGuide() {
    if (!state.cursorPos) return;
    var t = state.tool;
    if (t !== 'tangent' && t !== 'derivative' && t !== 'integral') return;
    if (state.hoverPoint) return; /* On a curve — the hover marker already guides */

    var label = (state.pendingClick && (t === 'derivative' || t === 'integral'))
      ? 'Click 2nd point on the curve'
      : 'Move onto the curve';
    var x = state.cursorPos.x + 14;
    var y = state.cursorPos.y - 14;

    ctx.save();
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    var tw = ctx.measureText(label).width;
    var padX = 8, padY = 5, boxH = 22;
    /* Keep the tooltip inside the canvas */
    if (x + tw + padX * 2 > W) x = state.cursorPos.x - 14 - tw - padX * 2;
    if (y - boxH < 0) y = state.cursorPos.y + 26;

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(20,24,33,0.92)';
    roundRect(ctx, x, y - boxH + padY, tw + padX * 2, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e7ecf3';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + padX, y - boxH / 2 + padY);
    ctx.restore();
  }

  function drawStrokes() {
    for (var i = 0; i < state.strokes.length; i++) {
      renderStroke(state.strokes[i]);
    }
    if (state.activeStroke) {
      renderStroke(state.activeStroke);
    }
  }

  /* ── Shape Rendering ─────────────────────────────────── */

  /**
   * Draw an arrowhead at (x, y) pointing in direction (angle).
   */
  function drawArrowhead(x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.45);
    ctx.lineTo(-size, size * 0.45);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Render a single shape object.
   */
  function renderShape(s) {
    /* Convert world coords to screen coords for rendering */
    var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);

    /* Apply rotation around center of bounding box */
    var rot = s.rotation || 0;
    if (rot) {
      var rcx = (x1 + x2) / 2, rcy = (y1 + y2) / 2;
      ctx.save();
      ctx.translate(rcx, rcy);
      ctx.rotate(rot);
      ctx.translate(-rcx, -rcy);
    }

    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;

    var headSize = Math.max(10, s.width * 3);

    switch (s.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;

      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        var ang = Math.atan2(y2 - y1, x2 - x1);
        drawArrowhead(x2, y2, ang, headSize, s.color);
        break;

      case 'dblarrow':
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        var a1 = Math.atan2(y2 - y1, x2 - x1);
        var a2 = Math.atan2(y1 - y2, x1 - x2);
        drawArrowhead(x2, y2, a1, headSize, s.color);
        drawArrowhead(x1, y1, a2, headSize, s.color);
        break;

      case 'rect':
        var rx = Math.min(x1, x2), ry = Math.min(y1, y2);
        var rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        if (s.filled) {
          ctx.globalAlpha = 0.15;
          ctx.fillRect(rx, ry, rw, rh);
          ctx.globalAlpha = 0.9;
        }
        ctx.strokeRect(rx, ry, rw, rh);
        break;

      case 'circle':
        var cdx = x2 - x1, cdy = y2 - y1;
        var radius = Math.sqrt(cdx * cdx + cdy * cdy);
        ctx.beginPath();
        ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        if (s.filled) {
          ctx.globalAlpha = 0.15;
          ctx.fill();
          ctx.globalAlpha = 0.9;
        }
        ctx.stroke();
        break;

      case 'ellipse':
        var ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2;
        var erx = Math.abs(x2 - x1) / 2, ery = Math.abs(y2 - y1) / 2;
        if (erx < 1 || ery < 1) break;
        ctx.beginPath();
        ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2);
        if (s.filled) {
          ctx.globalAlpha = 0.15;
          ctx.fill();
          ctx.globalAlpha = 0.9;
        }
        ctx.stroke();
        break;

      case 'text':
        if (!s.text) break;
        /* Compute box dimensions from stored world coords */
        var tbW = Math.abs(x2 - x1);
        var tbH = Math.abs(y2 - y1);
        if (tbW < 4) tbW = 60; /* fallback for legacy shapes */
        if (tbH < 4) tbH = 22;
        /* Scale font size to fit the box height */
        var fontSize = Math.max(8, Math.round(tbH * 0.64));
        ctx.font = 'bold ' + fontSize + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var tbX = Math.min(x1, x2), tbY = Math.min(y1, y2);
        /* Background box */
        ctx.fillStyle = 'rgba(13,17,23,0.85)';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1;
        roundRect(ctx, tbX, tbY, tbW, tbH, 5);
        ctx.fill();
        ctx.stroke();
        /* Text — vertically centered */
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, tbX + 6, tbY + (tbH - fontSize) / 2);
        break;
    }
    ctx.globalAlpha = 1;
    if (rot) ctx.restore();
  }

  /**
   * Draw all completed shapes and the active (in-progress) shape.
   */
  function drawShapes() {
    for (var i = 0; i < state.shapes.length; i++) {
      renderShape(state.shapes[i]);
    }
    if (state.activeShape) {
      renderShape(state.activeShape);
    }
  }

  /**
   * Show the inline text input at the given canvas position for the text shape tool.
   */
  /**
   * Edit an existing text shape inline (triggered by double-click).
   */
  function editTextShape(idx, shape) {
    var inp = $('shape-text-input');
    if (!inp || !canvas) return;
    var rect = canvas.getBoundingClientRect();
    var parent = canvas.parentElement;
    var parentRect = parent.getBoundingClientRect();
    var sx = toSX(shape.wx1), sy = toSY(shape.wy1);
    inp.style.display = '';
    inp.style.left = (rect.left - parentRect.left + sx) + 'px';
    inp.style.top = (rect.top - parentRect.top + sy) + 'px';
    inp.value = shape.text || '';
    inp.focus();
    inp.select();

    function commit() {
      var txt = inp.value.trim();
      if (txt) {
        saveUndo();
        shape.text = txt;
        /* Recompute wx2 from new text width */
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        var twPx = ctx.measureText(txt).width + 12;
        var thPx = Math.abs(toSY(shape.wy2) - toSY(shape.wy1));
        if (thPx < 4) thPx = 22;
        shape.wx2 = shape.wx1 + twPx / W * (state.view.xMax - state.view.xMin);
      }
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', onBlur);
      draw();
    }

    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { inp.style.display = 'none'; inp.removeEventListener('keydown', onKey); inp.removeEventListener('blur', onBlur); }
    }
    function onBlur() { commit(); }

    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', onBlur);
  }

  function showShapeTextInput(wx, wy) {
    var inp = $('shape-text-input');
    if (!inp || !canvas) return;
    var rect = canvas.getBoundingClientRect();
    var parent = canvas.parentElement;
    var parentRect = parent.getBoundingClientRect();
    /* Position input at screen coords converted from world coords */
    var sx = toSX(wx), sy = toSY(wy);
    inp.style.display = '';
    inp.style.left = (rect.left - parentRect.left + sx) + 'px';
    inp.style.top = (rect.top - parentRect.top + sy) + 'px';
    inp.value = '';
    inp.focus();

    function commit() {
      var txt = inp.value.trim();
      if (txt) {
        /* Measure text width in screen px, convert to world width */
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        var twPx = ctx.measureText(txt).width + 12; /* +12 for padding */
        var thPx = 22; /* text box height */
        var wx2 = wx + twPx / W * (state.view.xMax - state.view.xMin);
        var wy2 = wy - thPx / H * (state.view.yMax - state.view.yMin);
        state.shapes.push({
          type: 'text', wx1: wx, wy1: wy, wx2: wx2, wy2: wy2,
          color: state.shapeColor, width: state.shapeWidth, filled: false, text: txt, rotation: 0
        });
        draw();
      }
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', onBlur);
      /* Auto-exit text tool after one entry */
      setTool('move');
    }

    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { inp.style.display = 'none'; inp.removeEventListener('keydown', onKey); inp.removeEventListener('blur', onBlur); }
    }
    function onBlur() { commit(); }

    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', onBlur);
  }

  function attachCanvasEvents() {
    if (!canvas) return;

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', function () {
      state.hoverPoint = null;
      state.cursorPos = null;
      if (state.dragging) {
        state.dragging = false;
        state.dragStart = null;
        state.dragView = null;
        canvas.style.cursor = 'crosshair';
      }
      draw();
    });

    /* Double-click to edit text shapes */
    canvas.addEventListener('dblclick', function (e) {
      if (state.tool !== 'move') return;
      var dpos = canvasCoords(e);
      var dhit = findNearestAnnotation(dpos.x, dpos.y);
      if (dhit && dhit.type === 'shape') {
        var ds = state.shapes[dhit.idx];
        if (ds && ds.type === 'text') {
          editTextShape(dhit.idx, ds);
        }
      }
    });

    /* Touch events for mobile pinch-to-zoom */
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
  }


  /* ── Main draw() function ──────────────────────────── */

  /** Placeholder for analysis markers drawn by S14+ */
  function drawAnalysisMarkers() { /* implemented in S14-S25 */ }

  /**
   * Master render function — clears canvas and redraws everything.
   * Called after any state change that affects the graph.
   */
  function draw() {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.scale(dpr, dpr);

    /* Clear and fill background */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    /* Render layers in order */
    drawGrid();
    drawAxisNumbers();
    plotIntegral();
    drawIntegralRegions();
    plotAllFunctions();
    plotDerivatives();
    drawDerivSegments();
    drawIntersections();
    drawTangentLines();
    drawFreePoints();
    drawAnalysisMarkers();
    if (state.showAnnotations) {
      drawStrokes();
      drawShapes();
      drawSelectionIndicator();
      drawPendingClick();
    }
    drawHover();
    drawHighlight();
    drawCursorDot();
    drawToolGuide();
    drawAxisLabels();

    ctx.restore();
  }

  /* ── End of S1-S13. Sections S14-S25 continue below. ── */


  /* S14 ── Function Analysis UI ────────────────────────── */

  /** Analysis cache for the currently selected function */
  var analysisCache = { roots: [], extrema: [], inflections: [], yIntercept: null };

  /**
   * Run analysis on the currently selected function:
   * roots, extrema, inflection points, y-intercept.
   */
  function runAnalysis() {
    analysisCache = { roots: [], extrema: [], inflections: [], yIntercept: null };

    var idx = state.selectedFunc;
    if (idx < 0 || idx >= state.funcs.length) {
      updateAnalysisPanel();
      return;
    }
    var f = state.funcs[idx];
    if (!f || !f.ast || f.error) {
      updateAnalysisPanel();
      return;
    }

    var v = state.view;
    var params = f.params || {};

    /* Roots */
    analysisCache.roots = findZeros(f.ast, v.xMin, v.xMax, params);

    /* Extrema */
    analysisCache.extrema = findExtrema(f.ast, v.xMin, v.xMax, params);

    /* Inflection points — sign changes in second derivative */
    var inflections = [];
    var infSteps = 500;
    var infDx = (v.xMax - v.xMin) / infSteps;
    var MAX_INFLECTIONS = 20;
    var prevD2 = numericalDeriv2(f.ast, v.xMin, params);
    for (var ii = 1; ii <= infSteps; ii++) {
      var ix2 = v.xMin + ii * infDx;
      var d2i = numericalDeriv2(f.ast, ix2, params);
      if (isOk(prevD2) && isOk(d2i) && prevD2 * d2i < 0) {
        /* Verify genuine inflection vs corner/discontinuity noise:
           1) d2 not too large (corners produce huge spikes)
           2) The f'' values on both sides should be moderate
           3) Cluster filter: skip if too close to a previous inflection */
        var d2Max = Math.max(Math.abs(prevD2), Math.abs(d2i));
        /* Scale-aware threshold: compare d2 to typical curvature in view */
        var viewScale = (v.yMax - v.yMin) / ((v.xMax - v.xMin) * (v.xMax - v.xMin));
        var d2Limit = Math.max(viewScale * 500, 100);
        if (d2Max > d2Limit) {
          prevD2 = d2i; continue;
        }
        /* Cluster filter */
        if (inflections.length > 0 && Math.abs(ix2 - inflections[inflections.length - 1].x) < infDx * 5) {
          prevD2 = d2i; continue;
        }
        var lo2 = ix2 - infDx, hi2 = ix2;
        for (var jj = 0; jj < 50; jj++) {
          var mid2 = (lo2 + hi2) / 2;
          var midD2i = numericalDeriv2(f.ast, mid2, params);
          if (!isOk(midD2i)) break;
          if (midD2i * numericalDeriv2(f.ast, lo2, params) < 0) hi2 = mid2;
          else lo2 = mid2;
        }
        var infX = roundSig((lo2 + hi2) / 2, 6);
        var infY = evaluate(f.ast, infX, params);
        if (isOk(infY) && Math.abs(infY) < 1e8) {
          inflections.push({ x: infX, y: roundSig(infY, 6) });
          if (inflections.length >= MAX_INFLECTIONS) break;
        }
      }
      prevD2 = d2i;
    }
    /* Deduplicate inflections that cluster closely (noise from corners/discontinuities).
       Use a generous dedup window: 2% of x-range */
    var dedupInf = [];
    var infWindow = (v.xMax - v.xMin) * 0.04;
    if (infWindow < 0.1) infWindow = 0.1;
    for (var di = 0; di < inflections.length; di++) {
      var dominated = false;
      for (var dj = 0; dj < dedupInf.length; dj++) {
        if (Math.abs(inflections[di].x - dedupInf[dj].x) < infWindow) {
          dominated = true; break;
        }
      }
      if (!dominated) dedupInf.push(inflections[di]);
    }
    analysisCache.inflections = dedupInf;

    /* Y-intercept */
    var y0 = evaluate(f.ast, 0, params);
    if (isOk(y0)) {
      analysisCache.yIntercept = { x: 0, y: roundSig(y0, 6) };
    }

    updateAnalysisPanel();

    /* Also update integral if visible */
    if (state.integral.visible) computeAndShowIntegral();
  }

  /**
   * Update the analysis section in the sidebar with formatted results.
   */
  /* ── Analysis highlight system ──────────────────────── */

  var highlightAnimId = null;

  /**
   * Set a highlighted point on the canvas with a pulsing animation.
   * @param {number} wx - World X
   * @param {number} wy - World Y
   * @param {string} color - Marker color
   * @param {string} type - 'root'|'extrema'|'inflection'|'yint'
   */
  function setHighlight(wx, wy, color, type) {
    /* Toggle off if clicking the same point */
    if (state.highlight && Math.abs(state.highlight.wx - wx) < 1e-6 && Math.abs(state.highlight.wy - wy) < 1e-6) {
      clearHighlight();
      return;
    }
    state.highlight = { wx: wx, wy: wy, color: color, type: type, animStart: performance.now() };
    /* Start animation loop for pulsing effect */
    if (highlightAnimId) cancelAnimationFrame(highlightAnimId);
    function pulse() {
      if (!state.highlight) return;
      draw();
      highlightAnimId = requestAnimationFrame(pulse);
    }
    /* Run pulse for 2 seconds then stop animating (keep marker static) */
    pulse();
    setTimeout(function () {
      if (highlightAnimId) { cancelAnimationFrame(highlightAnimId); highlightAnimId = null; }
      draw();
    }, 2000);
  }

  function clearHighlight() {
    state.highlight = null;
    if (highlightAnimId) { cancelAnimationFrame(highlightAnimId); highlightAnimId = null; }
    /* Remove active class from all chips */
    var chips = document.querySelectorAll('.sb-analysis-chip.active');
    for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
    draw();
  }

  /** Draw the highlighted analysis point with pulsing ring */
  function drawHighlight() {
    if (!state.highlight) return;
    var h = state.highlight;
    var sx = toSX(h.wx), sy = toSY(h.wy);
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

    var elapsed = (performance.now() - h.animStart) / 1000;
    var pulsePhase = Math.sin(elapsed * 4) * 0.5 + 0.5; /* 0→1 pulsing */
    var ringRadius = 8 + pulsePhase * 8; /* 8→16px pulsing ring */
    var ringAlpha = 0.6 - pulsePhase * 0.4; /* fades as it expands */

    /* Pulsing outer ring */
    ctx.beginPath();
    ctx.arc(sx, sy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = ringAlpha;
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* Crosshair lines */
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
    ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    /* Solid inner dot */
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = h.color;
    ctx.fill();

    /* Coordinate label */
    var label = '(' + roundSig(h.wx, 4) + ', ' + roundSig(h.wy, 4) + ')';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    var lx = sx + 14, ly = sy - 14;
    var tw = ctx.measureText(label).width;
    if (lx + tw + 10 > W) lx = sx - tw - 18;
    if (ly - 18 < 0) ly = sy + 24;
    /* Background */
    ctx.fillStyle = 'rgba(13,17,23,0.92)';
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, lx - 8, ly - 18, tw + 16, 24, 6);
    ctx.fill();
    ctx.stroke();
    /* Text */
    ctx.fillStyle = h.color;
    ctx.fillText(label, lx, ly);
  }

  /** Format a number to 4 decimals (trimmed), cleaning -0 → 0 */
  function fmtA(n) {
    var s = n.toFixed(4);
    /* Trim trailing zeros but keep at least 2 decimals for stable layout */
    while (s.length > 0 && s.charAt(s.length - 1) === '0' &&
           s.indexOf('.') !== -1 && s.length - s.indexOf('.') > 3) {
      s = s.slice(0, -1);
    }
    if (parseFloat(s) === 0) s = '0.00';
    return s;
  }

  function updateAnalysisPanel() {
    var roots = analysisCache.roots;
    var extrema = analysisCache.extrema;
    var inflections = analysisCache.inflections;
    var yInt = analysisCache.yIntercept;

    /* Get the selected function's color for markers */
    var selIdx = state.selectedFunc;
    var funcColor = (selIdx >= 0 && selIdx < state.funcs.length) ? state.funcs[selIdx].color : '#18b4f5';

    /* Helper: create a chip DOM element with click-to-highlight */
    function makeChip(text, cls, wx, wy, color) {
      var chip = document.createElement('span');
      chip.className = 'sb-analysis-chip ' + cls;
      chip.textContent = text;
      chip.addEventListener('click', function () {
        /* Toggle active class on this chip, remove from others */
        var allChips = document.querySelectorAll('.sb-analysis-chip.active');
        for (var c = 0; c < allChips.length; c++) allChips[c].classList.remove('active');
        chip.classList.add('active');
        setHighlight(wx, wy, color, cls);
      });
      return chip;
    }

    /* Roots — as x-value chips */
    var rootsEl = $('val-roots');
    var cntRoots = $('cnt-roots');
    if (rootsEl) {
      rootsEl.innerHTML = '';
      if (roots.length === 0) {
        rootsEl.innerHTML = '<span class="sb-analysis-none">None in view</span>';
        if (cntRoots) cntRoots.textContent = '';
      } else {
        if (cntRoots) cntRoots.textContent = roots.length;
        for (var ri = 0; ri < roots.length; ri++) {
          rootsEl.appendChild(makeChip('x = ' + fmtA(roots[ri]), 'root', roots[ri], 0, funcColor));
        }
      }
    }

    /* Extrema — colored min/max chips */
    var extEl = $('val-extrema');
    var cntExt = $('cnt-extrema');
    if (extEl) {
      extEl.innerHTML = '';
      if (extrema.length === 0) {
        extEl.innerHTML = '<span class="sb-analysis-none">None in view</span>';
        if (cntExt) cntExt.textContent = '';
      } else {
        if (cntExt) cntExt.textContent = extrema.length;
        for (var ei = 0; ei < extrema.length; ei++) {
          var e = extrema[ei];
          var cls = e.type === 'max' ? 'ext-max' : 'ext-min';
          var col = e.type === 'max' ? '#3ddc84' : '#ff5555';
          extEl.appendChild(makeChip('(' + fmtA(e.x) + ', ' + fmtA(e.y) + ')', cls, e.x, e.y, col));
        }
      }
    }

    /* Inflection points — gold chips */
    var infEl = $('val-inflection');
    var cntInf = $('cnt-inflection');
    if (infEl) {
      infEl.innerHTML = '';
      if (inflections.length === 0) {
        infEl.innerHTML = '<span class="sb-analysis-none">None in view</span>';
        if (cntInf) cntInf.textContent = '';
      } else {
        if (cntInf) cntInf.textContent = inflections.length;
        for (var ii = 0; ii < inflections.length; ii++) {
          var p = inflections[ii];
          infEl.appendChild(makeChip('(' + fmtA(p.x) + ', ' + fmtA(p.y) + ')', 'inflect', p.x, p.y, '#f5c842'));
        }
      }
    }

    /* Y-intercept — single accent chip */
    var yiEl = $('val-yintercept');
    if (yiEl) {
      if (!yInt) {
        yiEl.textContent = '\u2014';
        yiEl.className = 'sb-analysis-none';
        yiEl.onclick = null;
      } else {
        yiEl.textContent = '(0, ' + fmtA(yInt.y) + ')';
        yiEl.className = 'sb-analysis-chip yint';
        yiEl.onclick = function () {
          var allChips = document.querySelectorAll('.sb-analysis-chip.active');
          for (var c = 0; c < allChips.length; c++) allChips[c].classList.remove('active');
          yiEl.classList.add('active');
          setHighlight(0, yInt.y, funcColor, 'yint');
        };
      }
    }
  }

  /**
   * Draw analysis markers on the canvas: circles for roots,
   * diamonds for extrema, squares for inflection points.
   * Overrides the placeholder from S13.
   */
  drawAnalysisMarkers = function () {
    if (!ctx) return;
    var idx = state.selectedFunc;
    if (idx < 0 || idx >= state.funcs.length) return;
    var f = state.funcs[idx];
    if (!f || !f.visible) return;
    var color = f.color;

    /* Draw roots as small circles on the x-axis */
    var roots = analysisCache.roots;
    for (var i = 0; i < roots.length; i++) {
      var sx = toSX(roots[i]);
      var sy = toSY(0);
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    /* Draw extrema as filled diamonds */
    var extrema = analysisCache.extrema;
    for (var j = 0; j < extrema.length; j++) {
      var ex = toSX(extrema[j].x);
      var ey = toSY(extrema[j].y);
      var ds = 6;
      ctx.beginPath();
      ctx.moveTo(ex, ey - ds);
      ctx.lineTo(ex + ds, ey);
      ctx.lineTo(ex, ey + ds);
      ctx.lineTo(ex - ds, ey);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    /* Draw inflection points as small squares */
    var inflections = analysisCache.inflections;
    for (var k = 0; k < inflections.length; k++) {
      var ix = toSX(inflections[k].x);
      var iy = toSY(inflections[k].y);
      var ss = 4;
      ctx.fillStyle = color;
      ctx.fillRect(ix - ss, iy - ss, ss * 2, ss * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(ix - ss, iy - ss, ss * 2, ss * 2);
    }
  };


  /* S15 ── Parameter Slider System ─────────────────────── */

  /**
   * Rebuild parameter sliders after function list changes.
   * Collects all unique parameters across all functions,
   * creates or updates slider rows in the sidebar.
   */
  function rebuildSliders() {
    /* Only show sliders for the SELECTED function */
    var selIdx = state.selectedFunc;
    var selFunc = state.funcs[selIdx];

    if (!elSliderList) return;
    elSliderList.innerHTML = '';

    if (!selFunc || !selFunc.ast) {
      if (elSliderSection) elSliderSection.style.display = 'none';
      return;
    }

    var pNames = extractParams(selFunc.ast);
    if (pNames.length === 0) {
      if (elSliderSection) elSliderSection.style.display = 'none';
      return;
    }

    if (elSliderSection) elSliderSection.style.display = '';

    /* Ensure per-function slider storage exists */
    if (!selFunc.sliderState) selFunc.sliderState = {};

    /* Limit to 6 sliders max (all params still evaluated, just UI limited) */
    var maxSliders = 6;
    if (pNames.length > maxSliders) {
      /* Ensure all params have slider state even if not shown */
      for (var pp = maxSliders; pp < pNames.length; pp++) {
        if (!selFunc.sliderState[pNames[pp]]) {
          selFunc.sliderState[pNames[pp]] = { min: -10, max: 10, step: 0.1, value: 1 };
        }
      }
      pNames = pNames.slice(0, maxSliders);
    }

    for (var p = 0; p < pNames.length; p++) {
      var name = pNames[p];

      /* Per-function slider state */
      if (!selFunc.sliderState[name]) {
        selFunc.sliderState[name] = { min: -10, max: 10, step: 0.1, value: 1 };
      }
      /* Also keep global state in sync for animation */
      state.sliders[name] = selFunc.sliderState[name];

      var sl = selFunc.sliderState[name];

      var row = document.createElement('div');
      row.className = 'slider-row';

      /* Label with function-colored dot */
      var label = document.createElement('span');
      label.className = 'slider-label';
      var labelDot = document.createElement('span');
      labelDot.className = 'slider-label-dot';
      labelDot.style.background = selFunc.color;
      var labelText = document.createElement('span');
      labelText.textContent = name;
      labelText.style.color = selFunc.color;
      label.appendChild(labelDot);
      label.appendChild(labelText);

      /* Min bound input */
      var minInput = document.createElement('input');
      minInput.type = 'number';
      minInput.className = 'slider-bound-input';
      minInput.value = sl.min;
      minInput.title = 'Min bound';
      minInput.setAttribute('inputmode', 'decimal');
      (function(nm, inp, fi) {
        inp.addEventListener('change', function() {
          /* Debounce: ignore duplicate change events within 100ms */
          var fsl = state.funcs[fi].sliderState;
          var v = parseFloat(inp.value);
          if (fsl && fsl[nm] && isOk(v) && v < fsl[nm].max) {
            fsl[nm].min = v;
            if (fsl[nm].value < v) fsl[nm].value = v;
            rebuildSliders();
            syncFuncParams();
            draw();
          } else {
            if (fsl && fsl[nm]) inp.value = fsl[nm].min;
          }
        });
      })(name, minInput, selIdx);

      /* Range input */
      var range = document.createElement('input');
      range.type = 'range';
      range.className = 'slider-range';
      range.id = 'sl-' + name;
      range.min = sl.min;
      range.max = sl.max;
      range.step = sl.step;
      range.value = sl.value;
      range.addEventListener('input', (function (nm) {
        return function (e) {
          onSliderInput(nm, parseFloat(e.target.value));
        };
      })(name));

      /* Max bound input */
      var maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.className = 'slider-bound-input';
      maxInput.value = sl.max;
      maxInput.title = 'Max bound';
      maxInput.setAttribute('inputmode', 'decimal');
      (function(nm, inp, fi) {
        inp.addEventListener('change', function() {
          /* Debounce: ignore duplicate change events within 100ms */
          var fsl = state.funcs[fi].sliderState;
          var v = parseFloat(inp.value);
          if (fsl && fsl[nm] && isOk(v) && v > fsl[nm].min) {
            fsl[nm].max = v;
            if (fsl[nm].value > v) fsl[nm].value = v;
            rebuildSliders();
            syncFuncParams();
            draw();
          } else {
            if (fsl && fsl[nm]) inp.value = fsl[nm].max;
          }
        });
      })(name, maxInput, selIdx);

      /* Value display (editable input) */
      var valSpan = document.createElement('input');
      valSpan.type = 'number';
      valSpan.className = 'slider-val';
      valSpan.id = 'slv-' + name;
      valSpan.value = sl.value.toFixed(1);
      valSpan.setAttribute('inputmode', 'decimal');
      valSpan.setAttribute('step', 'any');
      valSpan.style.width = '52px';
      valSpan.style.textAlign = 'right';
      valSpan.style.background = 'var(--bg)';
      valSpan.style.border = '1px solid var(--border)';
      valSpan.style.borderRadius = '4px';
      valSpan.style.fontFamily = 'var(--mono)';
      valSpan.style.fontSize = '0.78rem';
      valSpan.style.color = 'var(--text)';
      valSpan.style.padding = '2px 4px';
      (function(nm, inp, rng) {
        inp.addEventListener('change', function() {
          var v = parseFloat(inp.value);
          if (!isFinite(v)) { inp.value = rng.value; return; }
          var mi = parseFloat(rng.min);
          var ma = parseFloat(rng.max);
          if (v < mi) v = mi;
          if (v > ma) v = ma;
          inp.value = v.toFixed(1);
          rng.value = v;
          onSliderInput(nm, v);
        });
      })(name, valSpan, range);

      var playBtn = document.createElement('button');
      playBtn.className = 'slider-play-btn';
      playBtn.id = 'slp-' + name;
      playBtn.textContent = (state.animation && state.animation.param === name && state.animation.playing) ? '\u23F8' : '\u25B6';
      playBtn.title = 'Animate';
      (function(pn) {
        playBtn.addEventListener('click', function() {
          if (state.animation && state.animation.param === pn && state.animation.playing) {
            stopAnimation();
          } else {
            stopAnimation();
            startAnimation(pn);
          }
          updatePlayButtons();
        });
      })(name);

      /* Top row: label + slider + value + play */
      var topRow = document.createElement('div');
      topRow.className = 'slider-top-row';
      topRow.appendChild(label);
      topRow.appendChild(range);
      topRow.appendChild(valSpan);
      topRow.appendChild(playBtn);

      /* Bottom row: min/max bound inputs */
      var boundRow = document.createElement('div');
      boundRow.className = 'slider-bound-row';
      var minLabel = document.createElement('span');
      minLabel.className = 'slider-bound-label';
      minLabel.textContent = 'min';
      var maxLabel = document.createElement('span');
      maxLabel.className = 'slider-bound-label';
      maxLabel.textContent = 'max';
      boundRow.appendChild(minLabel);
      boundRow.appendChild(minInput);
      boundRow.appendChild(maxLabel);
      boundRow.appendChild(maxInput);

      row.appendChild(topRow);
      row.appendChild(boundRow);
      elSliderList.appendChild(row);
    }

    syncFuncParams();
  }

  /** Update all play/pause button icons to match animation state */
  function updatePlayButtons() {
    var btns = document.querySelectorAll('.slider-play-btn');
    for (var i = 0; i < btns.length; i++) {
      var pn = btns[i].id.replace('slp-', '');
      btns[i].textContent = (state.animation && state.animation.param === pn && state.animation.playing) ? '\u23F8' : '\u25B6';
    }
  }

  /**
   * Handle slider value change.
   */
  function onSliderInput(paramName, value) {
    /* Update selected function's slider state */
    var selFunc = state.funcs[state.selectedFunc];
    if (selFunc && selFunc.sliderState && selFunc.sliderState[paramName]) {
      selFunc.sliderState[paramName].value = value;
    }
    /* Keep global state in sync for animation */
    if (state.sliders[paramName]) state.sliders[paramName].value = value;

    /* Update display */
    var valEl = $('slv-' + paramName);
    if (valEl) valEl.value = value.toFixed(1);

    saveUndo();
    syncFuncParams();
    runAnalysis();
    draw();
  }

  /**
   * Synchronise function params with current slider values.
   */
  function syncFuncParams() {
    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.ast) continue;
      var pNames = extractParams(f.ast);
      if (!f.params) f.params = {};
      if (!f.sliderState) f.sliderState = {};
      for (var j = 0; j < pNames.length; j++) {
        var nm = pNames[j];
        /* Read from this function's own slider state */
        if (f.sliderState[nm]) {
          f.params[nm] = f.sliderState[nm].value;
        } else {
          /* Initialize slider state for new params */
          f.sliderState[nm] = { min: -10, max: 10, step: 0.1, value: 1 };
          f.params[nm] = 1;
        }
      }
    }
  }


  /* ── Expression Validator ─────────────────────────────── */

  /** Reserved names that cannot be used as parameters */
  var RESERVED_NAMES = {};
  (function() {
    var fk = Object.keys(KNOWN_FUNCS);
    for (var i = 0; i < fk.length; i++) RESERVED_NAMES[fk[i]] = 'function';
    var ck = Object.keys(KNOWN_CONSTS);
    for (var j = 0; j < ck.length; j++) RESERVED_NAMES[ck[j]] = 'constant';
    RESERVED_NAMES['x'] = 'variable';
    RESERVED_NAMES['y'] = 'variable';
    RESERVED_NAMES['t'] = 'variable';
  })();

  /**
   * Validate an expression and return warnings (non-fatal) and errors.
   * Returns { warnings: string[], error: string|null }
   */
  function validateExpression(expr, ast) {
    var warnings = [];

    if (!expr) return { warnings: warnings, error: null };

    /* 1. Check for parameter names that collide with reserved names */
    if (ast) {
      var pNames = extractParams(ast);
      for (var i = 0; i < pNames.length; i++) {
        var nm = pNames[i];
        if (RESERVED_NAMES[nm]) {
          if (RESERVED_NAMES[nm] === 'constant') {
            warnings.push('\u26A0 "' + nm + '" is a math constant (' +
              (nm === 'e' ? '2.718...' : nm === 'pi' ? '3.14159...' : nm) +
              '), not a slider parameter. Use a different letter.');
          } else if (RESERVED_NAMES[nm] === 'function') {
            warnings.push('\u26A0 "' + nm + '" is a built-in function name. Use a different parameter name.');
          } else if (RESERVED_NAMES[nm] === 'variable') {
            /* Skip "y" in implicit equations (x\u00B2 + y\u00B2 = 4), where y IS a variable */
            if (!(nm.toLowerCase() === 'y' && expr.indexOf('=') !== -1)) {
              warnings.push('\u2139\uFE0F "' + nm + '" is treated as a slider parameter here \u2014 the independent variable is "x". If you meant the function variable, write it in terms of x.');
            }
          }
        }
      }
    }

    /* 1b. Hint: if 'e' appears as a standalone variable (not followed by ^), note it's Euler's number.
       Skip warning for standard patterns like e^x, e^(bx) where e is clearly the constant. */
    if (/\be\b/.test(expr) && !/\be\s*\^/.test(expr)) {
      /* e appears but NOT in e^ pattern — possibly confused as parameter */
      var hasEParam = ast ? extractParams(ast).indexOf('e') >= 0 : false;
      if (!hasEParam && (/\be\s*\*/.test(expr) || /\*\s*e\b/.test(expr) || /\/\s*e\b/.test(expr))) {
        warnings.push('\u2139\uFE0F "e" is Euler\'s number (2.718...). For a slider, use a different letter like "a" or "k".');
      }
    }

    /* 2. Check for common syntax mistakes */
    /* Unbalanced parentheses */
    var openP = 0;
    for (var c = 0; c < expr.length; c++) {
      if (expr[c] === '(') openP++;
      else if (expr[c] === ')') openP--;
      if (openP < 0) break;
    }
    if (openP !== 0) {
      warnings.push('\u26A0 Unbalanced parentheses — check your brackets.');
    }

    /* 3. Empty parentheses like sin() */
    if (/\w+\(\s*\)/.test(expr)) {
      warnings.push('\u26A0 Empty function call detected — e.g. sin() needs an argument like sin(x).');
    }

    /* 4. Double operators like ++ or ** (except ^) */
    if (/[+\-*/]{2,}/.test(expr.replace(/\*\*/g, '^'))) {
      warnings.push('\u26A0 Double operators detected — check for typos like ++ or */.');
    }

    /* 5. Starts or ends with an operator */
    var trimmed = expr.trim();
    if (/^[*/^]/.test(trimmed)) {
      warnings.push('\u26A0 Expression starts with an operator.');
    }
    if (/[+\-*/^]$/.test(trimmed)) {
      warnings.push('\u26A0 Expression ends with an operator — incomplete expression.');
    }

    return { warnings: warnings, error: null };
  }

  /* S16 ── Expression Sidebar UI ───────────────────────── */

  /**
   * Add a new function to the list.
   * @param {string} expr - Expression string (may be empty)
   * @param {Object} [presetParams] - Initial parameter values
   */
  function addFunction(expr, presetParams) {
    var idx = state.funcs.length;
    if (idx >= FUNC_COLORS.length) return; /* max 8 functions */

    var parsed = null;
    var error = null;
    if (expr) {
      try {
        parsed = parse(expr);
        if (!parsed && parseError) error = parseError;
      } catch (e) {
        error = e.message || 'Parse error';
      }
    }

    var paramNames = parsed ? extractParams(parsed) : [];
    var params = {};
    for (var i = 0; i < paramNames.length; i++) {
      var nm = paramNames[i];
      if (presetParams && presetParams[nm] !== undefined) {
        params[nm] = presetParams[nm];
        if (!state.sliders[nm]) {
          state.sliders[nm] = { min: -10, max: 10, step: 0.1, value: presetParams[nm] };
        } else {
          state.sliders[nm].value = presetParams[nm];
        }
      } else if (state.sliders[nm]) {
        params[nm] = state.sliders[nm].value;
      } else {
        params[nm] = 1;
        state.sliders[nm] = { min: -10, max: 10, step: 0.1, value: 1 };
      }
    }

    /* Build per-function sliderState from params */
    var sliderState = {};
    for (var si = 0; si < paramNames.length; si++) {
      var sn = paramNames[si];
      sliderState[sn] = { min: -10, max: 10, step: 0.1, value: params[sn] !== undefined ? params[sn] : 1 };
    }

    var funcObj = {
      id: uid(),
      expr: expr || '',
      ast: parsed,
      color: FUNC_COLORS[idx % FUNC_COLORS.length],
      visible: true,
      label: FUNC_LABELS[idx % FUNC_LABELS.length],
      error: error,
      params: params,
      sliderState: sliderState,
      type: 'standard'
    };

    /* Detect function type */
    if (expr) {
      var ineq = detectInequality(expr);
      if (ineq) {
        funcObj.inequality = ineq.type;
        try {
          var ineqResult = parse(ineq.funcExpr);
          funcObj.ast = ineqResult;
        } catch (e2) { /* keep original ast */ }
        funcObj.type = 'inequality';
      }
      /* Check for implicit equation */
      var implExpr = parseImplicit(expr);
      if (implExpr && !funcObj.inequality) {
        try {
          var implResult = parse(implExpr);
          if (implResult) {
            funcObj.implicitAst = implResult;
            funcObj.type = 'implicit';
          }
        } catch (e3) { /* not implicit */ }
      }
    }

    state.funcs.push(funcObj);

    state.selectedFunc = idx;
    rebuildSidebar();
    rebuildSliders();
    runAnalysis();
    saveUndo();
    draw();
  }

  /**
   * Remove a function by index.
   */
  function removeFunction(idx) {
    if (idx < 0 || idx >= state.funcs.length) return;
    state.funcs.splice(idx, 1);

    /* Remove and reindex interactive results referencing funcIdx */
    pruneInteractiveResults(idx);

    /* Reassign colours and labels */
    for (var i = 0; i < state.funcs.length; i++) {
      state.funcs[i].color = FUNC_COLORS[i % FUNC_COLORS.length];
      state.funcs[i].label = FUNC_LABELS[i % FUNC_LABELS.length];
    }

    /* Adjust selection */
    if (state.selectedFunc >= state.funcs.length) {
      state.selectedFunc = Math.max(0, state.funcs.length - 1);
    }

    rebuildSidebar();
    rebuildSliders();
    runAnalysis();
    saveUndo();
    draw();
  }

  /**
   * Remove interactive results for a deleted function and reindex remaining.
   * Called after state.funcs.splice(idx, 1).
   */
  function pruneInteractiveResults(removedIdx) {
    /* Filter out results for removed function, shift indices above it */
    function reindex(arr) {
      var kept = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].funcIdx === removedIdx) continue;
        if (arr[i].funcIdx > removedIdx) arr[i].funcIdx--;
        kept.push(arr[i]);
      }
      return kept;
    }
    state.tangents = reindex(state.tangents);
    state.derivSegments = reindex(state.derivSegments);
    state.integralRegions = reindex(state.integralRegions);

    /* Points: remove snapped points for removed func, reindex rest */
    var keptPts = [];
    for (var j = 0; j < state.points.length; j++) {
      var pt = state.points[j];
      if (pt.funcIdx === removedIdx) continue;
      if (pt.funcIdx > removedIdx) pt.funcIdx--;
      keptPts.push(pt);
    }
    state.points = keptPts;

    /* Cancel pending click if it was on the removed function */
    if (state.pendingClick && state.pendingClick.funcIdx === removedIdx) {
      state.pendingClick = null;
    } else if (state.pendingClick && state.pendingClick.funcIdx > removedIdx) {
      state.pendingClick.funcIdx--;
    }
  }

  /**
   * Rebuild the entire expression sidebar from state.funcs.
   */
  function rebuildSidebar() {
    if (!elFuncList) return;
    elFuncList.innerHTML = '';

    for (var i = 0; i < state.funcs.length; i++) {
      (function (idx) {
        var f = state.funcs[idx];
        var isSelected = idx === state.selectedFunc;

        /* ── Card wrapper with left color stripe ── */
        var card = document.createElement('div');
        card.className = 'func-card' + (isSelected ? ' selected' : '') + (f.error ? ' has-error' : '');
        card.style.borderLeft = '4px solid ' + f.color;

        /* ── Card body (clickable area) ── */
        var body = document.createElement('div');
        body.className = 'func-card-body';

        /* ── Top row: label + action buttons ── */
        var topRow = document.createElement('div');
        topRow.className = 'func-card-top';

        /* Selection checkmark */
        if (isSelected) {
          var checkMark = document.createElement('span');
          checkMark.className = 'func-check';
          checkMark.textContent = '\u2713';
          checkMark.style.color = f.color;
          topRow.appendChild(checkMark);
        }

        var label = document.createElement('span');
        label.className = 'func-name';
        label.textContent = f.label + '(x)';

        var actions = document.createElement('span');
        actions.className = 'func-card-actions';

        /* Visibility: eye icon (open = visible, closed/slashed = hidden) */
        var visBtn = document.createElement('button');
        visBtn.className = 'func-vis-btn' + (f.visible ? '' : ' vis-hidden');
        visBtn.style.color = f.color;
        visBtn.title = f.visible ? 'Hide' : 'Show';
        visBtn.innerHTML = f.visible
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        visBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          f.visible = !f.visible;
          findAllIntersections();
          rebuildSidebar();
          draw();
        });

        /* Delete: small x, only visible on hover (CSS handles opacity) */
        var delBtn = document.createElement('button');
        delBtn.className = 'func-del';
        delBtn.title = 'Remove';
        delBtn.innerHTML = '&times;';
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          removeFunction(idx);
        });

        actions.appendChild(visBtn);
        actions.appendChild(delBtn);
        topRow.appendChild(label);
        topRow.appendChild(actions);

        /* Click body to select */
        body.addEventListener('click', function () {
          if (state.selectedFunc === idx) return;
          state.selectedFunc = idx;
          stopAnimation(); /* Stop any running animation when switching */
          runAnalysis();
          rebuildSidebar();
          rebuildSliders();
          draw();
        });

        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'func-expr-input';
        inp.value = f.expr;
        inp.placeholder = 'e.g. x^2 + 1';
        inp.setAttribute('spellcheck', 'false');
        inp.setAttribute('autocomplete', 'off');
        inp.setAttribute('autocorrect', 'off');
        inp.setAttribute('autocapitalize', 'off');

        /* Stop click propagation so input doesn't trigger card select */
        inp.addEventListener('click', function (e) { e.stopPropagation(); });
        inp.addEventListener('mousedown', function (e) { e.stopPropagation(); });

        /* ── KaTeX preview div ── */
        var katexPreview = document.createElement('div');
        katexPreview.className = 'func-katex-preview';
        updateKatexPreview(katexPreview, f.expr, f.label);

        /* ── Math Keyboard trigger button ── */
        var kbdTrigger = document.createElement('button');
        kbdTrigger.className = 'func-kbd-trigger';
        kbdTrigger.type = 'button';
        kbdTrigger.title = 'Open Math Keyboard';
        kbdTrigger.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/></svg> Math Keyboard';
        kbdTrigger.addEventListener('click', function (e) {
          e.stopPropagation();
          openMathKeyboard(inp, f.label);
        });
        kbdTrigger.addEventListener('mousedown', function (e) { e.stopPropagation(); });

        var parseTimer = null;
        function reparseFunc() {
          clearHighlight();
          var newExpr = inp.value.trim();
          f.expr = newExpr;
          f.error = null;
          f.ast = null;
          f.type = 'standard';
          f.inequality = null;
          f.implicitAst = null;
          if (newExpr) {
            var ineq = detectInequality(newExpr);
            if (ineq) {
              f.inequality = ineq.type;
              f.type = 'inequality';
              try { f.ast = parse(ineq.funcExpr); } catch (e) { f.error = e.message || 'Parse error'; }
            }
            if (!f.inequality) {
              var implExpr = parseImplicit(newExpr);
              if (implExpr) {
                try { f.implicitAst = parse(implExpr); f.type = 'implicit'; } catch (e2) { /* not implicit */ }
              }
            }
            if (!f.inequality && !f.implicitAst) {
              try {
                f.ast = parse(newExpr);
                if (!f.ast && parseError) f.error = parseError;
              } catch (e) { f.error = e.message || 'Parse error'; }
            }
          }
          var astForParams = f.ast || f.implicitAst;
          if (astForParams) {
            var pNames = extractParams(astForParams);
            if (!f.params) f.params = {};
            for (var j = 0; j < pNames.length; j++) {
              if (f.params[pNames[j]] === undefined) {
                f.params[pNames[j]] = state.sliders[pNames[j]] ? state.sliders[pNames[j]].value : 1;
              }
            }
          }
          /* Run validation for warnings */
          f.warnings = [];
          var validation = validateExpression(newExpr, f.ast || f.implicitAst);
          f.warnings = validation.warnings;

          /* Update error/warning display */
          var hasIssue = !!(f.error || f.warnings.length);
          if (hasIssue) { card.classList.add('has-error'); } else { card.classList.remove('has-error'); }
          var msgs = [];
          if (f.error) msgs.push('\u274C ' + f.error);
          for (var w = 0; w < f.warnings.length; w++) msgs.push(f.warnings[w]);
          errDiv.innerHTML = msgs.join('<br>');

          /* Update KaTeX preview */
          updateKatexPreview(katexPreview, newExpr, f.label);

          rebuildSliders();
          syncFuncParams();
          findAllIntersections();
          runAnalysis();
          saveUndo();
          draw();
        }
        inp.addEventListener('input', function () {
          clearTimeout(parseTimer);
          parseTimer = setTimeout(reparseFunc, 250);
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { clearTimeout(parseTimer); reparseFunc(); }
        });

        /* ── Error / Warning message ── */
        var errDiv = document.createElement('div');
        errDiv.className = 'func-card-error';
        /* Show existing errors and validate for warnings on initial render */
        if (!f.warnings) {
          var initValidation = validateExpression(f.expr, f.ast);
          f.warnings = initValidation.warnings;
        }
        var initMsgs = [];
        if (f.error) initMsgs.push('\u274C ' + f.error);
        if (f.warnings) { for (var ww = 0; ww < f.warnings.length; ww++) initMsgs.push(f.warnings[ww]); }
        if (initMsgs.length) {
          errDiv.innerHTML = initMsgs.join('<br>');
          card.classList.add('has-error');
        }

        /* ── Assemble card ── */
        body.appendChild(topRow);
        body.appendChild(inp);
        body.appendChild(kbdTrigger);
        body.appendChild(katexPreview);
        card.appendChild(body);
        card.appendChild(errDiv);
        elFuncList.appendChild(card);

        /* Auto-focus new empty entry */
        if (f.expr === '' && isSelected) {
          setTimeout(function () { inp.focus(); }, 50);
        }
      })(i);
    }
  }

  /**
   * Wire checkbox change events for display options.
   */
  function updateOptionsUI() {
    if (elChkGrid) {
      elChkGrid.checked = state.options.grid;
      elChkGrid.addEventListener('change', function () {
        state.options.grid = elChkGrid.checked;
        draw();
      });
    }
    if (elChkMinorGrid) {
      elChkMinorGrid.checked = state.options.minorGrid;
      elChkMinorGrid.addEventListener('change', function () {
        state.options.minorGrid = elChkMinorGrid.checked;
        draw();
      });
    }
    if (elChkAxisNums) {
      elChkAxisNums.checked = state.options.axisNums;
      elChkAxisNums.addEventListener('change', function () {
        state.options.axisNums = elChkAxisNums.checked;
        draw();
      });
    }
    if (elChkDeriv1) {
      elChkDeriv1.checked = state.options.deriv1;
      elChkDeriv1.addEventListener('change', function () {
        state.options.deriv1 = elChkDeriv1.checked;
        draw();
      });
    }
    if (elChkDeriv2) {
      elChkDeriv2.checked = state.options.deriv2;
      elChkDeriv2.addEventListener('change', function () {
        state.options.deriv2 = elChkDeriv2.checked;
        draw();
      });
    }
  }

  /**
   * Wire integral UI controls.
   */
  function updateIntegralUI() {
    function onIntegralChange() {
      state.integral.xFrom = parseFloat(elIntegralFrom.value) || 0;
      state.integral.xTo = parseFloat(elIntegralTo.value) || 0;
      state.integral.visible = true;
      computeAndShowIntegral();
      draw();
    }

    if (elIntegralFrom) {
      elIntegralFrom.value = state.integral.xFrom;
      elIntegralFrom.addEventListener('change', onIntegralChange);
      elIntegralFrom.addEventListener('input', debounce(onIntegralChange, 300));
    }
    if (elIntegralTo) {
      elIntegralTo.value = state.integral.xTo;
      elIntegralTo.addEventListener('change', onIntegralChange);
      elIntegralTo.addEventListener('input', debounce(onIntegralChange, 300));
    }

    /* Auto-open integral when the section is expanded */
    var integralDetails = document.querySelector('#integral-section');
    if (integralDetails) {
      integralDetails.addEventListener('toggle', function () {
        state.integral.visible = integralDetails.open;
        if (integralDetails.open) computeAndShowIntegral();
        draw();
      });
    }
  }

  /** Compute the definite integral of the selected function and display the result */
  function computeAndShowIntegral() {
    var valEl = $('val-integral');
    if (!valEl) return;

    var idx = state.selectedFunc;
    if (idx < 0 || idx >= state.funcs.length) { valEl.textContent = '\u2014'; return; }
    var f = state.funcs[idx];
    if (!f.ast) { valEl.textContent = '\u2014'; return; }

    var xFrom = state.integral.xFrom;
    var xTo = state.integral.xTo;
    if (xFrom >= xTo) { valEl.textContent = '\u2014'; return; }

    var area = computeIntegral(f.ast, xFrom, xTo, f.params || {});
    if (isOk(area)) {
      valEl.textContent = roundSig(area, 6).toString();
    } else {
      valEl.textContent = 'undefined';
    }
  }


  /* S17 ── Table View ──────────────────────────────────── */

  /**
   * Toggle the value table panel visibility.
   */
  function toggleTable() {
    state.tableVisible = !state.tableVisible;
    var panel = $('table-panel');
    if (panel) {
      panel.style.display = state.tableVisible ? '' : 'none';
    }
    var btn = $('btn-toggle-table');
    if (btn) {
      btn.textContent = state.tableVisible ? 'Hide Table' : 'Show Table';
    }
    if (state.tableVisible) renderTable();
  }

  /**
   * Render the value table with columns for x and each visible function.
   */
  function renderTable() {
    var table = $('value-table');
    var tbody = $('value-table-body');
    if (!table || !tbody) return;

    var step = parseFloat(($('table-step') || {}).value) || 0.5;
    if (step <= 0) step = 0.5;

    var v = state.view;
    var visFuncs = [];
    for (var i = 0; i < state.funcs.length; i++) {
      if (state.funcs[i].visible && state.funcs[i].ast) {
        visFuncs.push(state.funcs[i]);
      }
    }

    /* Build header */
    var thead = table.querySelector('thead');
    if (thead) {
      var headerRow = '<tr><th>x</th>';
      for (var h = 0; h < visFuncs.length; h++) {
        headerRow += '<th>' + escHtml(visFuncs[h].label) + '(x)</th>';
      }
      headerRow += '</tr>';
      thead.innerHTML = headerRow;
    }

    /* Build body rows */
    var html = '';
    var xStart = Math.ceil(v.xMin / step) * step;
    var rowCount = 0;
    var maxRows = 500;

    for (var x = xStart; x <= v.xMax && rowCount < maxRows; x += step) {
      var xRound = roundSig(x, 10);
      var isInt = Math.abs(xRound - Math.round(xRound)) < 1e-9;
      html += '<tr' + (isInt ? ' class="table-row-highlight"' : '') + '>';
      html += '<td>' + xRound.toFixed(4) + '</td>';
      for (var fi = 0; fi < visFuncs.length; fi++) {
        var yv = evaluate(visFuncs[fi].ast, xRound, visFuncs[fi].params || {});
        html += '<td>' + (isOk(yv) ? yv.toFixed(4) : '—') + '</td>';
      }
      html += '</tr>';
      rowCount++;
    }

    tbody.innerHTML = html;
  }


  /* S18 ── Presets ─────────────────────────────────────── */

  var PRESETS = [
    { name: 'Quadratic',      slug: 'quadratic',    latex: 'ax^2+bx+c',
      expr: 'a*x^2 + b*x + c',                              params: { a: 1, b: -1, c: -2 },
      view: { xMin: -4, xMax: 5, yMin: -3, yMax: 5 } },
    { name: 'Trigonometric',   slug: 'trigonometric', latex: 'a\\sin(bx),\\;c\\cos(dx)',
      funcs: [
      { expr: 'a*sin(b*x)',     params: { a: 1, b: 1 } },
      { expr: 'c*cos(d*x)',     params: { c: 2, d: 1 } },
      { expr: 'tan(x)/k',       params: { k: 3 }, hidden: true }
    ]},
    { name: 'Exponential',    slug: 'exponential',  latex: 'ae^{bx}',
      expr: 'a*e^(b*x)',                                     params: { a: 1, b: 1 },
      view: { xMin: -3, xMax: 3, yMin: -1, yMax: 8 } },
    { name: 'Logarithm',      slug: 'logarithm',    latex: 'a\\ln(bx)',
      expr: 'a*ln(b*x)',                                     params: { a: 1, b: 1 },
      view: { xMin: -1, xMax: 10, yMin: -3, yMax: 4 } },
    { name: 'Normal Dist',    slug: 'normal-dist',  latex: '\\tfrac{1}{a\\sqrt{2\\pi}}e^{-\\frac{(x-b)^2}{2a^2}}',
      expr: '(1/(a*sqrt(2*pi)))*e^(-0.5*((x-b)/a)^2)',       params: { a: 1, b: 0 },
      view: { xMin: -5, xMax: 5, yMin: -0.05, yMax: 0.5 } },
    { name: 'Cubic',          slug: 'cubic',        latex: 'x^3-ax',
      expr: 'x^3 - a*x',                                     params: { a: 3 },
      view: { xMin: -3, xMax: 3, yMin: -5, yMax: 5 } },
    { name: 'Tangent',        slug: 'tangent',      latex: 'a\\tan(bx)',
      expr: 'a*tan(b*x)',                                     params: { a: 1, b: 1 },
      view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } },
    { name: 'Absolute Value', slug: 'absolute',     latex: 'a|x-b|+c',
      expr: 'a*abs(x - b) + c',                              params: { a: 1, b: 2, c: -1 },
      view: { xMin: -3, xMax: 7, yMin: -2, yMax: 5 } },
    { name: 'Step Function',  slug: 'step',         latex: '\\lfloor x\\rfloor',
      expr: 'floor(x)',                                       params: {},
      view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 } },
    { name: 'Square Root',    slug: 'sqrt',         latex: 'a\\sqrt{x-b}',
      expr: 'a*sqrt(x - b)',                                  params: { a: 1, b: 0 },
      view: { xMin: -2, xMax: 10, yMin: -1, yMax: 5 } },
    { name: 'Reciprocal',     slug: 'reciprocal',   latex: '\\dfrac{a}{x}',
      expr: 'a/x',                                            params: { a: 1 },
      view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 } },
    { name: 'Damped Sine',    slug: 'damped-sine',  latex: 'e^{-ax}\\sin(bx)',
      expr: 'e^(-a*x)*sin(b*x)',                              params: { a: 0.3, b: 3 },
      view: { xMin: -2, xMax: 12, yMin: -1.2, yMax: 1.2 } },
    { name: 'Polynomial',     slug: 'polynomial',   latex: 'ax^4-bx^3+cx^2-dx+1',
      expr: 'a*x^4 - b*x^3 + c*x^2 - d*x + 1',              params: { a: 0.1, b: 0.5, c: 1, d: 1 },
      view: { xMin: -4, xMax: 5, yMin: -5, yMax: 8 } },
    { name: 'Quadratic Eq',   slug: 'quad-equation', latex: 'ax^2+bx+c=0',
      funcs: [
      { expr: 'a*x^2 + b*x + c',  params: { a: 1, b: -2, c: -3 } },
      { expr: '0',                 params: {} }
    ], view: { xMin: -4, xMax: 6, yMin: -5, yMax: 6 } },
    { name: 'Parabola',       slug: 'parabola',     latex: '\\dfrac{(x-h)^2}{4a}+k',
      expr: '(x - h)^2 / (4*a) + k',                         params: { a: 1, h: 0, k: 0 },
      view: { xMin: -6, xMax: 6, yMin: -2, yMax: 8 } },
    { name: 'Sinc',           slug: 'sinc',         latex: '\\dfrac{\\sin(ax)}{ax}',
      expr: 'sin(a*x)/(a*x)',                                 params: { a: 1 },
      view: { xMin: -15, xMax: 15, yMin: -0.4, yMax: 1.2 } },
    { name: 'Hyperbolic',     slug: 'hyperbolic',   latex: '\\sinh(x),\\,\\cosh(x)',
      funcs: [
      { expr: 'sinh(x)',  params: {} },
      { expr: 'cosh(x)',  params: {} },
      { expr: 'tanh(x)',  params: {} }
    ], view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 } },
    { name: 'Power',          slug: 'power',        latex: 'x^a,\\,x^b,\\,x^c',
      funcs: [
      { expr: 'x^a',  params: { a: 2 } },
      { expr: 'x^b',  params: { b: 3 } },
      { expr: 'x^c',  params: { c: 0.5 } }
    ], view: { xMin: -3, xMax: 4, yMin: -4, yMax: 8 } },
    { name: 'Logistic',       slug: 'logistic',     latex: '\\dfrac{L}{1+e^{-k(x-m)}}',
      expr: 'L/(1 + e^(-k*(x - m)))',                         params: { L: 1, k: 1, m: 0 },
      view: { xMin: -8, xMax: 8, yMin: -0.2, yMax: 1.3 } },
    { name: 'Sawtooth',       slug: 'sawtooth',     latex: 'x-\\lfloor x\\rfloor',
      expr: 'x - floor(x)',                                   params: {},
      view: { xMin: -4, xMax: 6, yMin: -0.5, yMax: 1.5 } },
    { name: 'Gaussian',       slug: 'gaussian',     latex: 'ae^{-\\frac{(x-b)^2}{2c^2}}',
      expr: 'a*e^(-((x-b)^2)/(2*c^2))',                       params: { a: 1, b: 0, c: 1 },
      view: { xMin: -5, xMax: 5, yMin: -0.1, yMax: 1.2 } },
    { name: 'Decay',          slug: 'decay',        latex: 'e^{-ax},\\,-e^{-ax}',
      funcs: [
      { expr: 'e^(-a*x)',    params: { a: 0.5 } },
      { expr: '-e^(-a*x)',   params: { a: 0.5 } }
    ], view: { xMin: -2, xMax: 8, yMin: -1.2, yMax: 1.2 } }
  ];

  /**
   * Load a preset by index: clear functions, add the preset, reset view.
   */
  function loadPreset(idx) {
    if (idx < 0 || idx >= PRESETS.length) return;
    var p = PRESETS[idx];

    /* Clear all functions and interactive results */
    state.funcs = [];
    state.sliders = {};
    state.selectedFunc = 0;
    state.tangents = [];
    state.points = [];
    state.intersections = [];
    state.derivSegments = [];
    state.integralRegions = [];
    state.strokes = [];
    state.activeStroke = null;
    state.shapes = [];
    state.activeShape = null;
    state.pendingClick = null;
    stopAnimation();

    if (p.funcs) {
      /* Multi-function preset */
      for (var fi = 0; fi < p.funcs.length; fi++) {
        addFunction(p.funcs[fi].expr, p.funcs[fi].params);
        if (p.funcs[fi].hidden) state.funcs[state.funcs.length - 1].visible = false;
      }
    } else {
      /* Single-function preset (legacy format) */
      addFunction(p.expr, p.params);
    }

    state.selectedFunc = 0;
    saveUndo();

    /* Use preset-specific view if defined, otherwise default */
    if (p.view) {
      state.view.xMin = p.view.xMin;
      state.view.xMax = p.view.xMax;
      state.view.yMin = p.view.yMin;
      state.view.yMax = p.view.yMax;
      runAnalysis();
      findAllIntersections();
      draw();
    } else {
      resetView();
    }
  }

  /**
   * Wire preset pill buttons from the HTML.
   */
  function renderPresetBar() {
    var tabs = $('preset-tabs');
    if (!tabs) return;

    var pills = tabs.querySelectorAll('.pill[data-preset]');
    for (var i = 0; i < pills.length; i++) {
      (function (pill) {
        /* Inject KaTeX rendering into pill label */
        var slug = pill.getAttribute('data-preset');
        for (var j = 0; j < PRESETS.length; j++) {
          if (PRESETS[j].slug === slug) {
            var latex = PRESETS[j].latex;
            if (latex) {
              pill.innerHTML = renderMath(latex);
              pill.classList.add('has-katex');
            }
            break;
          }
        }
        pill.addEventListener('click', function () {
          var s = pill.getAttribute('data-preset');
          for (var k = 0; k < PRESETS.length; k++) {
            if (PRESETS[k].slug === s) {
              loadPreset(k);
              break;
            }
          }
        });
      })(pills[i]);
    }
  }


  /* S19 ── Context Menu & Export ────────────────────────── */

  var ctxMenu = null;

  /**
   * Create context menu DOM element once.
   */
  function ensureCtxMenu() {
    if (ctxMenu) return;
    ctxMenu = document.createElement('div');
    ctxMenu.className = 'graph-ctx-menu';
    ctxMenu.style.display = 'none';
    ctxMenu.style.position = 'fixed';
    ctxMenu.style.zIndex = '9999';

    var items = [
      { label: 'Copy Coordinates',  action: 'coords' },
      { label: 'Copy Expression',   action: 'expr' },
      { label: '—',                 action: 'sep' },
      { label: 'Export PNG',        action: 'png' },
      { label: 'Export Clean',      action: 'png-clean' },
      { label: 'Export CSV',        action: 'csv' },
      { label: '—',                 action: 'sep' },
      { label: 'Reset View',       action: 'reset' },
      { label: 'Zoom to Fit',      action: 'fit' }
    ];

    for (var i = 0; i < items.length; i++) {
      if (items[i].action === 'sep') {
        var sep = document.createElement('div');
        sep.className = 'ctx-sep';
        ctxMenu.appendChild(sep);
        continue;
      }
      var item = document.createElement('div');
      item.className = 'ctx-item';
      item.textContent = items[i].label;
      item.setAttribute('data-action', items[i].action);
      item.addEventListener('click', (function (act) {
        return function () {
          hideCtxMenu();
          handleCtxAction(act);
        };
      })(items[i].action));
      ctxMenu.appendChild(item);
    }

    document.body.appendChild(ctxMenu);

    /* Hide on any outside click */
    document.addEventListener('click', function () {
      hideCtxMenu();
    });
  }

  function showCtxMenu(clientX, clientY) {
    ensureCtxMenu();

    /* Add or remove "Delete Annotation" item based on selection */
    var existingDel = ctxMenu.querySelector('[data-action="delete-annotation"]');
    var existingDelSep = ctxMenu.querySelector('.ctx-sep-annotation');
    if (existingDel) existingDel.remove();
    if (existingDelSep) existingDelSep.remove();

    if (state.selectedAnnotation >= 0) {
      var delSep = document.createElement('div');
      delSep.className = 'ctx-sep ctx-sep-annotation';
      ctxMenu.insertBefore(delSep, ctxMenu.firstChild);

      var delItem = document.createElement('div');
      delItem.className = 'ctx-item ctx-item-danger';
      delItem.textContent = 'Delete ' + (state.selectedAnnotationType === 'shape' ? 'Shape' : 'Sketch');
      delItem.setAttribute('data-action', 'delete-annotation');
      delItem.addEventListener('click', function () {
        hideCtxMenu();
        deleteSelectedAnnotation();
      });
      ctxMenu.insertBefore(delItem, ctxMenu.firstChild);
    }

    ctxMenu.style.display = 'block';

    /* Clamp to viewport */
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var mx = Math.min(clientX, vw - 180);
    var my = Math.min(clientY, vh - 250);
    ctxMenu.style.left = mx + 'px';
    ctxMenu.style.top = my + 'px';
  }

  function hideCtxMenu() {
    if (ctxMenu) ctxMenu.style.display = 'none';
  }

  /**
   * Handle context menu action.
   */
  function handleCtxAction(action) {
    switch (action) {
      case 'coords': copyCoordinates(); break;
      case 'expr':   copyExpression(); break;
      case 'png':    exportPNG(); break;
      case 'png-clean': exportCleanPNG(); break;
      case 'csv':    exportCSV(); break;
      case 'reset':  resetView(); break;
      case 'fit':    zoomToFit(); break;
    }
  }

  /**
   * Export canvas as PNG download.
   */
  /**
   * Draw watermark on canvas (call before toDataURL, then redraw to remove).
   */
  function drawWatermark() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    var text = 'NHIT VisualLab';
    var tx = W - 8, ty = H - 6;
    /* Shadow for readability */
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText(text, tx + 1, ty + 1);
    /* Text */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(text, tx, ty);
    ctx.restore();
  }

  function exportPNG() {
    if (!canvas) return;
    drawWatermark();
    var url = canvas.toDataURL('image/png');
    draw(); /* Redraw to remove watermark from live canvas */
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graph.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportCleanPNG() {
    if (!canvas) return;
    var wasVisible = state.showAnnotations;
    state.showAnnotations = false;
    draw();
    drawWatermark();
    var url = canvas.toDataURL('image/png');
    state.showAnnotations = wasVisible;
    draw(); /* Restore */
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graph-clean.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Export visible function data as CSV.
   */
  function exportCSV() {
    var step = parseFloat(($('table-step') || {}).value) || 0.5;
    if (step <= 0) step = 0.5;
    var v = state.view;

    var visFuncs = [];
    for (var i = 0; i < state.funcs.length; i++) {
      if (state.funcs[i].visible && state.funcs[i].ast) {
        visFuncs.push(state.funcs[i]);
      }
    }

    /* Header */
    var rows = ['x,' + visFuncs.map(function (f) { return f.label + '(x)'; }).join(',')];

    /* Data rows */
    var xStart = Math.ceil(v.xMin / step) * step;
    for (var x = xStart; x <= v.xMax; x += step) {
      var xr = roundSig(x, 10);
      var vals = [xr.toFixed(6)];
      for (var fi = 0; fi < visFuncs.length; fi++) {
        var yv = evaluate(visFuncs[fi].ast, xr, visFuncs[fi].params || {});
        vals.push(isOk(yv) ? yv.toFixed(6) : '');
      }
      rows.push(vals.join(','));
    }

    var csv = rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graph-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy the selected function's expression to clipboard.
   */
  function copyExpression() {
    var idx = state.selectedFunc;
    if (idx < 0 || idx >= state.funcs.length) return;
    var text = state.funcs[idx].label + '(x) = ' + state.funcs[idx].expr;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  /**
   * Copy the current hover point coordinates to clipboard.
   */
  function copyCoordinates() {
    var hp = state.hoverPoint;
    if (!hp) return;
    var text = '(' + hp.wx.toFixed(4) + ', ' + hp.wy.toFixed(4) + ')';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }


  /* S20 ── Undo / Redo ─────────────────────────────────── */

  /**
   * Save current state snapshot to undo stack.
   */
  function makeSnapshot() {
    return {
      funcs: deepClone(state.funcs),
      sliders: deepClone(state.sliders),
      view: deepClone(state.view),
      tangents: deepClone(state.tangents),
      points: deepClone(state.points),
      derivSegments: deepClone(state.derivSegments),
      integralRegions: deepClone(state.integralRegions),
      strokes: deepClone(state.strokes),
      shapes: deepClone(state.shapes)
    };
  }

  function restoreSnapshot(snap) {
    state.funcs = snap.funcs;
    state.sliders = snap.sliders;
    state.view = snap.view;
    state.tangents = snap.tangents || [];
    state.points = snap.points || [];
    state.derivSegments = snap.derivSegments || [];
    state.integralRegions = snap.integralRegions || [];
    state.strokes = snap.strokes || [];
    state.shapes = snap.shapes || [];
    state.activeStroke = null;
    state.activeShape = null;
    state.pendingClick = null;
    state.selectedFunc = clamp(state.selectedFunc, 0, Math.max(0, state.funcs.length - 1));

    rebuildSidebar();
    rebuildSliders();
    runAnalysis();
    draw();
  }

  function saveUndo() {
    state.undoStack.push(makeSnapshot());
    if (state.undoStack.length > 50) {
      state.undoStack.shift();
    }
    state.redoStack = [];
  }

  /**
   * Restore previous state from undo stack.
   */
  function performUndo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(makeSnapshot());
    restoreSnapshot(state.undoStack.pop());
  }

  /**
   * Re-apply state from redo stack.
   */
  function performRedo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(makeSnapshot());
    restoreSnapshot(state.redoStack.pop());
  }

  /* Wire Ctrl+Z / Ctrl+Shift+Z and Delete key */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      performUndo();
    } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'Z')) {
      e.preventDefault();
      performRedo();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedAnnotation >= 0) {
      /* Don't delete if user is typing in an input */
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      deleteSelectedAnnotation();
    }
  });


  /* S21 ── Mode Switching ──────────────────────────────── */

  /**
   * Switch between modes: simulate, explore, practice, quiz.
   */
  function switchMode(m) {
    state.mode = m;

    var simW  = $('sim-wrapper');
    var expW  = $('exp-wrapper');
    var pracW = $('prac-wrapper');
    var quizP = $('quiz-panel');
    var quizB = $('quiz-bar');
    var quizR = $('quiz-result');

    if (simW)  simW.style.display  = m === 'simulate' ? '' : 'none';
    if (expW)  expW.style.display  = m === 'explore'  ? '' : 'none';
    if (pracW) pracW.style.display = m === 'practice' ? '' : 'none';
    if (quizP) quizP.style.display = m === 'quiz'     ? '' : 'none';
    if (quizB) quizB.style.display = m === 'quiz'     ? '' : 'none';
    if (quizR) quizR.style.display = 'none';

    /* Update mode pill active state */
    if (elModeTabs) {
      var pills = elModeTabs.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) {
        if (pills[i].getAttribute('data-mode') === m) {
          pills[i].classList.add('active');
        } else {
          pills[i].classList.remove('active');
        }
      }
    }

    if (m === 'simulate') draw();
    else if (m === 'explore') renderExploreGrid();
    else if (m === 'practice') generateProblem();
    else if (m === 'quiz') startQuiz();
  }

  /* Wire mode tab clicks */
  if (elModeTabs) {
    elModeTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill[data-mode]');
      if (!pill) return;
      var m = pill.getAttribute('data-mode');
      if (m) switchMode(m);
    });
  }


  /* S22 ── Explore Mode ────────────────────────────────── */

  var CONCEPTS = [
    /* algebra */
    { id: 'polynomials',      name: 'Polynomials',          symbol: 'xⁿ',   formula: 'aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀',     cat: 'function-types',
      desc: 'Polynomials are sums of terms with non-negative integer exponents. They appear in physics for projectile motion, in economics for cost functions, and in engineering for curve fitting. The degree of the polynomial determines the maximum number of roots and turning points.',
      example: { problem: 'Find the roots of f(x) = x² − 5x + 6', steps: ['Set f(x) = 0: x² − 5x + 6 = 0', 'Factor: (x − 2)(x − 3) = 0', 'Solve: x = 2 or x = 3'], answer: 'x = 2, x = 3' } },

    { id: 'rational',         name: 'Rational Functions',    symbol: 'p/q',   formula: 'p(x) / q(x)',                              cat: 'function-types',
      desc: 'Rational functions are ratios of two polynomials. They exhibit vertical asymptotes where the denominator is zero and horizontal asymptotes determined by the degrees of numerator and denominator. They model phenomena like electrical resistance in parallel and concentration-time curves in pharmacology.',
      example: { problem: 'Find the vertical asymptotes of f(x) = 1/(x² − 4)', steps: ['Set denominator = 0: x² − 4 = 0', 'Factor: (x − 2)(x + 2) = 0', 'Asymptotes at x = 2 and x = −2'], answer: 'x = 2 and x = −2' } },

    { id: 'absolute-val',     name: 'Absolute Value',        symbol: '|x|',  formula: '|x − h| + k',                              cat: 'function-types',
      desc: 'Absolute value functions create V-shaped graphs with a sharp vertex. They measure distance from zero and are used in error analysis, tolerance specifications in manufacturing, and distance calculations. Transformations shift and stretch the basic V shape.',
      example: { problem: 'Solve |2x − 3| = 7', steps: ['Case 1: 2x − 3 = 7 → x = 5', 'Case 2: 2x − 3 = −7 → x = −2'], answer: 'x = 5 or x = −2' } },

    /* trigonometry */
    { id: 'sine-cosine',      name: 'Sine & Cosine',         symbol: 'sin',   formula: 'A·sin(Bx + C) + D',                        cat: 'function-types',
      desc: 'Sine and cosine functions model periodic phenomena. Amplitude A controls height, B affects frequency, C shifts phase, and D shifts vertically. They appear in vibration analysis, AC circuits, sound waves, and seasonal data modelling.',
      example: { problem: 'Find the period of f(x) = 3sin(2x)', steps: ['Period = 2π / |B|', 'B = 2', 'Period = 2π / 2 = π'], answer: 'π ≈ 3.14' } },

    { id: 'tangent',          name: 'Tangent Function',      symbol: 'tan',   formula: 'a·tan(bx)',                                 cat: 'function-types',
      desc: 'The tangent function has vertical asymptotes at odd multiples of π/2 and a period of π. It is the ratio sin(x)/cos(x) and appears in slope calculations, angle measurements, and surveying. Its graph passes through the origin with unbounded range.',
      example: { problem: 'Find where tan(x) = 1 for 0 ≤ x ≤ 2π', steps: ['tan(x) = 1 when x = π/4 + nπ', 'In [0, 2π]: x = π/4 and x = 5π/4'], answer: 'x = π/4, 5π/4' } },

    { id: 'inverse-trig',     name: 'Inverse Trig',          symbol: 'sin⁻¹', formula: 'arcsin(x), arccos(x), arctan(x)',            cat: 'function-types',
      desc: 'Inverse trigonometric functions return angles from ratios. arcsin and arccos have domain [−1, 1], while arctan accepts all real numbers. They are essential in navigation, robotics for joint angles, and signal processing for phase extraction.',
      example: { problem: 'Evaluate arctan(1)', steps: ['arctan(1) = angle whose tangent is 1', 'tan(π/4) = 1'], answer: 'π/4 ≈ 0.785 radians' } },

    /* exponential */
    { id: 'exponential',      name: 'Exponential Growth',    symbol: 'eˣ',   formula: 'a·eᵇˣ',                                     cat: 'function-types',
      desc: 'Exponential functions model growth and decay processes. When b > 0 the function grows; when b < 0 it decays. Applications include population growth, radioactive decay, compound interest, and thermal cooling described by Newton\'s law.',
      example: { problem: 'A population doubles every 5 years from 1000. Find population at t = 15', steps: ['P(t) = 1000·2^(t/5)', 'P(15) = 1000·2^3', 'P(15) = 1000·8 = 8000'], answer: '8000' } },

    { id: 'logarithmic',      name: 'Logarithmic Functions', symbol: 'ln',    formula: 'a·ln(bx)',                                   cat: 'function-types',
      desc: 'Logarithms are the inverse of exponentials. They compress large ranges into manageable scales and appear in decibel measurements, pH scales, Richter earthquake magnitude, and information entropy. The natural log (ln) uses base e ≈ 2.718.',
      example: { problem: 'Solve ln(x) = 3', steps: ['Apply exponential to both sides', 'x = e³', 'x ≈ 20.09'], answer: 'x ≈ 20.09' } },

    /* transformations */
    { id: 'translations',     name: 'Translations',          symbol: '↔↕',   formula: 'f(x − h) + k',                              cat: 'transformations',
      desc: 'Translations shift a graph horizontally and vertically without changing its shape. Replacing x with (x − h) shifts right by h units; adding k shifts up by k units. Understanding translations helps predict how parameter changes affect any function\'s graph.',
      example: { problem: 'Describe the transformation from y = x² to y = (x − 3)² + 2', steps: ['(x − 3): horizontal shift right 3', '+ 2: vertical shift up 2', 'Vertex moves from (0,0) to (3,2)'], answer: 'Right 3, up 2' } },

    { id: 'reflections',      name: 'Reflections & Scaling', symbol: '−f',    formula: 'a·f(bx)',                                    cat: 'transformations',
      desc: 'Multiplying f(x) by −1 reflects over the x-axis; replacing x with −x reflects over the y-axis. Multiplying by a > 1 stretches vertically; 0 < a < 1 compresses. Replacing x with bx where b > 1 compresses horizontally. These transformations are fundamental to signal processing.',
      example: { problem: 'Graph y = −2sin(x). Describe transformations from y = sin(x)', steps: ['Factor −2: reflection over x-axis and vertical stretch by 2', 'Amplitude becomes 2', 'Graph is flipped upside down'], answer: 'Reflected and stretched ×2' } },

    /* calculus */
    { id: 'derivatives',      name: 'Derivatives',           symbol: "f'",    formula: "f'(x) = lim[h→0] (f(x+h)−f(x))/h",          cat: 'calculus',
      desc: 'The derivative measures instantaneous rate of change — the slope of the tangent line at any point. It is the foundation of differential calculus. Derivatives find velocity from position, marginal cost from total cost, and help locate maxima and minima of functions.',
      example: { problem: 'Find the derivative of f(x) = 3x² + 2x − 1', steps: ['Apply power rule: d/dx(xⁿ) = nxⁿ⁻¹', "f'(x) = 6x + 2"], answer: "f'(x) = 6x + 2" } },

    { id: 'integrals',        name: 'Integrals',             symbol: '∫',     formula: '∫ₐᵇ f(x) dx',                               cat: 'calculus',
      desc: 'Integration computes accumulated quantities — area under a curve, total distance, or work done by a force. The definite integral from a to b gives the signed area. The Fundamental Theorem of Calculus links integration to antidifferentiation.',
      example: { problem: 'Compute ∫₀² (x² + 1) dx', steps: ['Antiderivative: x³/3 + x', 'Evaluate: [8/3 + 2] − [0]', 'Result: 14/3 ≈ 4.67'], answer: '14/3 ≈ 4.67' } },

    { id: 'limits',           name: 'Limits',                symbol: 'lim',   formula: 'lim[x→a] f(x)',                             cat: 'calculus',
      desc: 'Limits describe the value a function approaches as x approaches a specific value or infinity. They underpin all of calculus — derivatives and integrals are defined using limits. Understanding limits is essential for handling asymptotes, discontinuities, and indeterminate forms.',
      example: { problem: 'Evaluate lim[x→0] sin(x)/x', steps: ["Both numerator and denominator → 0 (indeterminate)", "Apply L'Hôpital's rule: lim = cos(x)/1 = 1", 'Or use the standard limit result'], answer: '1' } },

    /* special curves */
    { id: 'step-funcs',       name: 'Step Functions',        symbol: '⌊x⌋',  formula: 'floor(x), ceil(x)',                         cat: 'special-curves',
      desc: 'Step functions have constant values on intervals with jumps at integer boundaries. The floor function rounds down, ceil rounds up. They model pricing tiers, digital signals, and quantised measurements. They are discontinuous at every integer.',
      example: { problem: 'Evaluate floor(3.7) and floor(−2.3)', steps: ['floor(3.7) = greatest integer ≤ 3.7 = 3', 'floor(−2.3) = greatest integer ≤ −2.3 = −3'], answer: '3 and −3' } },

    { id: 'damped-osc',       name: 'Damped Oscillations',   symbol: 'e⁻ˣsin', formula: 'e^(−ax)·sin(bx)',                          cat: 'special-curves',
      desc: 'Damped oscillations combine exponential decay with periodic motion. The exponential envelope shrinks the amplitude over time while the sine term provides oscillation. They model shock absorbers, RLC circuits, vibrating strings, and any system losing energy to friction.',
      example: { problem: 'For y = e^(−0.5x)·sin(3x), find the decay rate and frequency', steps: ['Decay rate a = 0.5', 'Angular frequency b = 3', 'Period = 2π/3 ≈ 2.09'], answer: 'Decay 0.5, period ≈ 2.09' } },

    /* applications */
    { id: 'normal-dist',      name: 'Normal Distribution',   symbol: 'φ',     formula: '(1/(σ√(2π)))·e^(−(x−μ)²/(2σ²))',            cat: 'applications',
      desc: 'The normal (Gaussian) distribution is the bell curve fundamental to statistics. It is defined by mean μ (centre) and standard deviation σ (spread). About 68% of data falls within 1σ, 95% within 2σ. It models measurement errors, test scores, and natural variation.',
      example: { problem: 'For N(0, 1), what percentage lies within ±2σ?', steps: ['Standard normal: μ = 0, σ = 1', 'P(−2 < Z < 2) ≈ 0.9545', 'About 95.45%'], answer: '≈ 95.45%' } },

    { id: 'probability',      name: 'Probability Curves',    symbol: 'P',     formula: 'Various distributions',                     cat: 'applications',
      desc: 'Probability density functions describe the likelihood of continuous random variables taking specific values. Common distributions include uniform, exponential, and chi-squared. The area under the curve over an interval gives the probability of landing in that range.',
      example: { problem: 'For f(x) = 2e^(−2x), x ≥ 0, find P(0 ≤ X ≤ 1)', steps: ['∫₀¹ 2e^(−2x) dx', '= [−e^(−2x)]₀¹', '= −e^(−2) + 1 ≈ 0.865'], answer: '≈ 0.865' } }
  ];

  /** Currently selected explore category */
  var exploreCat = 'function-types';

  /**
   * Render the explore mode: category tabs and concept card grid.
   */
  function renderExploreGrid() {
    var grid = $('concept-grid');
    var info = $('item-info');
    if (!grid) return;

    /* Filter concepts by active category */
    var filtered = [];
    for (var i = 0; i < CONCEPTS.length; i++) {
      if (CONCEPTS[i].cat === exploreCat) {
        filtered.push(CONCEPTS[i]);
      }
    }

    grid.innerHTML = '';
    for (var j = 0; j < filtered.length; j++) {
      (function (c) {
        var card = document.createElement('div');
        card.className = 'is-card';
        card.innerHTML = '<div class="is-icon">' + escHtml(c.symbol) + '</div>' +
                         '<div class="is-name">' + escHtml(c.name) + '</div>';
        card.addEventListener('click', function () {
          renderConceptInfo(c);
        });
        grid.appendChild(card);
      })(filtered[j]);
    }

    if (info) info.style.display = 'none';

    /* Wire category tabs */
    var catTabs = $('cat-tabs');
    if (catTabs) {
      var pills = catTabs.querySelectorAll('.pill');
      for (var k = 0; k < pills.length; k++) {
        if (pills[k].getAttribute('data-cat') === exploreCat) {
          pills[k].classList.add('active');
        } else {
          pills[k].classList.remove('active');
        }
      }
    }
  }

  /**
   * Render detailed info for a selected concept.
   */
  function renderConceptInfo(c) {
    var info = $('item-info');
    if (!info) return;

    var html = '<h2 class="ii-title">' + escHtml(c.name) + '</h2>';
    html += '<div class="ii-formula"><code>' + escHtml(c.formula) + '</code></div>';
    html += '<p class="ii-desc">' + escHtml(c.desc) + '</p>';

    if (c.example) {
      html += '<div class="ii-example">';
      html += '<h3>Worked Example</h3>';
      html += '<p class="ii-problem"><strong>Problem:</strong> ' + escHtml(c.example.problem) + '</p>';
      html += '<ol class="ii-steps">';
      for (var i = 0; i < c.example.steps.length; i++) {
        html += '<li>' + escHtml(c.example.steps[i]) + '</li>';
      }
      html += '</ol>';
      html += '<p class="ii-answer"><strong>Answer:</strong> ' + escHtml(c.example.answer) + '</p>';
      html += '</div>';
    }

    info.innerHTML = html;
    info.style.display = '';
  }

  /* Wire category tab clicks */
  (function () {
    var catTabs = $('cat-tabs');
    if (!catTabs) return;
    catTabs.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill[data-cat]');
      if (!pill) return;
      exploreCat = pill.getAttribute('data-cat');
      renderExploreGrid();
    });
  })();


  /* S23 ── Practice Mode ───────────────────────────────── */

  var practiceState = { score: 0, total: 0, current: null };

  /**
   * Problem generators — each returns { prompt, answer, unit, tol, steps[], isText }
   */
  var PRACTICE_GENERATORS = [
    /* 0: Evaluate f(x) at a given x */
    function () {
      var a = Math.floor(Math.random() * 5) + 1;
      var b = Math.floor(Math.random() * 7) - 3;
      var c = Math.floor(Math.random() * 10) - 5;
      var xv = Math.floor(Math.random() * 9) - 4;
      var ans = a * xv * xv + b * xv + c;
      return {
        prompt: 'Evaluate f(x) = ' + a + 'x² + ' + (b >= 0 ? b : '(' + b + ')') + 'x + ' + (c >= 0 ? c : '(' + c + ')') + ' at x = ' + xv,
        answer: ans, unit: '', tol: 0.01,
        steps: ['Substitute x = ' + xv, 'f(' + xv + ') = ' + a + '·(' + xv + ')² + ' + b + '·(' + xv + ') + ' + c, '= ' + ans],
        isText: false
      };
    },

    /* 1: Find roots of a quadratic */
    function () {
      var r1 = Math.floor(Math.random() * 7) - 3;
      var r2 = Math.floor(Math.random() * 7) - 3;
      var b = -(r1 + r2);
      var c = r1 * r2;
      return {
        prompt: 'Find the roots of f(x) = x² + ' + (b >= 0 ? b : '(' + b + ')') + 'x + ' + (c >= 0 ? c : '(' + c + ')'),
        answer: Math.min(r1, r2) + ', ' + Math.max(r1, r2), unit: '', tol: 0,
        steps: ['Set x² + ' + b + 'x + ' + c + ' = 0',
          'Factor: (x ' + (r1 >= 0 ? '− ' + r1 : '+ ' + (-r1)) + ')(x ' + (r2 >= 0 ? '− ' + r2 : '+ ' + (-r2)) + ') = 0',
          'x = ' + r1 + ' or x = ' + r2],
        isText: true
      };
    },

    /* 2: Count x-intercepts */
    function () {
      var type = Math.floor(Math.random() * 3);
      var desc, count;
      if (type === 0) {
        desc = 'f(x) = x² + 1';
        count = 0;
      } else if (type === 1) {
        desc = 'f(x) = x² − 4';
        count = 2;
      } else {
        desc = 'f(x) = x²';
        count = 1;
      }
      return {
        prompt: 'How many x-intercepts does ' + desc + ' have?',
        answer: count, unit: '', tol: 0,
        steps: ['Set f(x) = 0 and solve', 'Count the real solutions'],
        isText: false
      };
    },

    /* 3: Find y-intercept */
    function () {
      var a = Math.floor(Math.random() * 5) + 1;
      var b = Math.floor(Math.random() * 7) - 3;
      var c = Math.floor(Math.random() * 11) - 5;
      return {
        prompt: 'Find the y-intercept of f(x) = ' + a + 'x² + ' + b + 'x + ' + c,
        answer: c, unit: '', tol: 0.01,
        steps: ['The y-intercept is f(0)', 'f(0) = ' + a + '·0² + ' + b + '·0 + ' + c, '= ' + c],
        isText: false
      };
    },

    /* 4: Identify local max/min of a cubic */
    function () {
      var a = Math.floor(Math.random() * 3) + 1;
      /* f(x) = x³ − a²x has extrema at x = ±a/√3 */
      var a2 = a * a;
      var xExt = roundSig(a / Math.sqrt(3), 4);
      return {
        prompt: 'Does f(x) = x³ − ' + a2 + 'x have a local maximum or minimum at x ≈ ' + xExt.toFixed(2) + '?',
        answer: 'minimum', unit: '', tol: 0,
        steps: ["f'(x) = 3x² − " + a2,
          "Critical points: 3x² = " + a2 + " → x = ±" + xExt.toFixed(2),
          "Second-derivative test: f''(x) = 6x",
          "f''(" + xExt.toFixed(2) + ') = ' + (6 * xExt).toFixed(2) + ' > 0 → local MINIMUM at x = ' + xExt.toFixed(2),
          "f''(−" + xExt.toFixed(2) + ') = ' + (-6 * xExt).toFixed(2) + ' < 0 → local maximum at x = −' + xExt.toFixed(2)],
        isText: true
      };
    },

    /* 5: Compute integral area (simple rectangle) */
    function () {
      var k = Math.floor(Math.random() * 5) + 1;
      var a = 0;
      var b = Math.floor(Math.random() * 4) + 1;
      var area = k * b;
      return {
        prompt: 'Compute ∫₀' + b + ' ' + k + ' dx',
        answer: area, unit: '', tol: 0.01,
        steps: ['∫ ' + k + ' dx = ' + k + 'x + C', 'Evaluate: ' + k + '·' + b + ' − ' + k + '·0', '= ' + area],
        isText: false
      };
    },

    /* 6: Identify function type from description */
    function () {
      var types = [
        { desc: 'a function that doubles every unit increase in x', answer: 'exponential' },
        { desc: 'a function that repeats every 2π', answer: 'trigonometric' },
        { desc: 'a function shaped like a V', answer: 'absolute value' },
        { desc: 'a function with a highest power of 2', answer: 'quadratic' }
      ];
      var pick = types[Math.floor(Math.random() * types.length)];
      return {
        prompt: 'What type of function is described: "' + pick.desc + '"?',
        answer: pick.answer, unit: '', tol: 0,
        steps: ['Consider the characteristics described', 'Match to function family'],
        isText: true
      };
    },

    /* 7: Derivative at a point */
    function () {
      var n = Math.floor(Math.random() * 4) + 2;
      var xv = Math.floor(Math.random() * 5) + 1;
      var deriv = n * Math.pow(xv, n - 1);
      return {
        prompt: "Find f'(" + xv + ') where f(x) = x^' + n,
        answer: deriv, unit: '', tol: 0.01,
        steps: ["f'(x) = " + n + 'x^' + (n - 1), "f'(" + xv + ') = ' + n + '·' + xv + '^' + (n - 1), '= ' + deriv],
        isText: false
      };
    }
  ];

  /**
   * Generate a new practice problem.
   */
  function generateProblem() {
    var idx = Math.floor(Math.random() * PRACTICE_GENERATORS.length);
    var problem = PRACTICE_GENERATORS[idx]();
    practiceState.current = problem;

    var prompt = $('pp-prompt');
    var input = $('pp-input');
    var check = $('pp-check');
    var next = $('pp-next');
    var feedback = $('pp-feedback');
    var solution = $('pp-solution');

    if (prompt) prompt.textContent = problem.prompt;
    if (input) { input.value = ''; input.disabled = false; input.focus(); }
    if (check) check.style.display = '';
    if (next) next.style.display = 'none';
    if (feedback) { feedback.textContent = ''; feedback.className = 'feedback'; }
    if (solution) solution.style.display = 'none';
  }

  /**
   * Check the user's answer for the current practice problem.
   */
  function checkPracticeAnswer() {
    var problem = practiceState.current;
    if (!problem) return;

    var input = $('pp-input');
    var feedback = $('pp-feedback');
    var check = $('pp-check');
    var next = $('pp-next');
    var solution = $('pp-solution');

    var userAns = (input ? input.value.trim() : '');
    var correct = false;

    if (problem.isText) {
      correct = userAns.toLowerCase() === String(problem.answer).toLowerCase();
    } else {
      var numAns = parseFloat(userAns);
      correct = isOk(numAns) && Math.abs(numAns - problem.answer) <= (problem.tol || 0.01);
    }

    practiceState.total++;
    if (correct) practiceState.score++;

    if (feedback) {
      feedback.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + problem.answer;
      feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
    }

    if (input) input.disabled = true;
    if (check) check.style.display = 'none';
    if (next) next.style.display = '';

    /* Show solution steps */
    if (solution && problem.steps) {
      var html = '<ol>';
      for (var i = 0; i < problem.steps.length; i++) {
        html += '<li>' + escHtml(problem.steps[i]) + '</li>';
      }
      html += '</ol>';
      solution.innerHTML = html;
      solution.style.display = '';
    }

    /* Update score display */
    var scoreEl = $('pbar-score-val');
    if (scoreEl) scoreEl.textContent = practiceState.score + ' / ' + practiceState.total;
  }

  /* Wire practice buttons */
  (function () {
    var checkBtn = $('pp-check');
    var nextBtn = $('pp-next');
    var input = $('pp-input');

    if (checkBtn) {
      checkBtn.addEventListener('click', checkPracticeAnswer);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', generateProblem);
    }
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !input.disabled) {
          checkPracticeAnswer();
        }
      });
    }
  })();


  /* S24 ── Quiz Mode ───────────────────────────────────── */

  var QUIZ_POOL = [
    /* MCQ questions */
    { type: 'mcq', q: 'What is the derivative of sin(x)?',
      opts: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'], correct: 0 },

    { type: 'mcq', q: 'Which function has vertical asymptotes at x = π/2 + nπ (odd multiples of π/2)?',
      opts: ['sin(x)', 'cos(x)', 'tan(x)', 'sec(x)'], correct: 2 },

    { type: 'mcq', q: 'The graph of y = |x| is shaped like:',
      opts: ['U-shape (parabola)', 'V-shape', 'S-curve', 'Straight line'], correct: 1 },

    { type: 'mcq', q: 'What is the domain of f(x) = ln(x)?',
      opts: ['All real numbers', 'x > 0', 'x ≥ 0', 'x ≠ 0'], correct: 1 },

    { type: 'mcq', q: 'A function f(x) has a local maximum where:',
      opts: ["f'(x) = 0 and f''(x) < 0", "f'(x) = 0 and f''(x) > 0", "f'(x) > 0", "f''(x) = 0"], correct: 0 },

    { type: 'mcq', q: 'The integral ∫ₐᵇ f(x) dx represents:',
      opts: ['The slope at a point', 'The signed area under the curve', 'The average value', 'The maximum value'], correct: 1 },

    { type: 'mcq', q: 'Which transformation shifts f(x) right by 3 units?',
      opts: ['f(x) + 3', 'f(x + 3)', 'f(x − 3)', 'f(x) − 3'], correct: 2 },

    { type: 'mcq', q: 'The period of sin(2x) is:',
      opts: ['2π', 'π', '4π', 'π/2'], correct: 1 },

    { type: 'mcq', q: 'What does the second derivative tell you about a function?',
      opts: ['Rate of change', 'Concavity', 'Roots', 'Domain'], correct: 1 },

    { type: 'mcq', q: 'The natural exponential function e^x has which property?',
      opts: ['Its derivative is itself', 'It has roots at x = 0', 'It is periodic', 'It is bounded'], correct: 0 },

    /* Numeric questions */
    { type: 'num', q: 'Evaluate: sin(π/2)', answer: 1, tol: 0.01 },
    { type: 'num', q: 'What is ln(e)?', answer: 1, tol: 0.01 },
    { type: 'num', q: 'Compute: d/dx(x³) at x = 2', answer: 12, tol: 0.1 },
    { type: 'num', q: 'Evaluate: ∫₀¹ 2x dx', answer: 1, tol: 0.01 },
    { type: 'num', q: 'How many roots does x² − 9 = 0 have?', answer: 2, tol: 0 }
  ];

  var quizState = { questions: [], current: 0, score: 0, answers: [] };

  /**
   * Start a new quiz: shuffle pool, pick 5 questions.
   */
  function startQuiz() {
    /* Shuffle pool */
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }

    quizState.questions = pool.slice(0, 5);
    quizState.current = 0;
    quizState.score = 0;
    quizState.answers = [];

    var quizR = $('quiz-result');
    if (quizR) quizR.style.display = 'none';

    renderQuizQuestion();
  }

  /**
   * Render the current quiz question.
   */
  function renderQuizQuestion() {
    var panel = $('quiz-panel');
    var bar = $('quiz-bar');
    if (!panel) return;

    if (quizState.current >= quizState.questions.length) {
      showQuizResults();
      return;
    }

    var qq = quizState.questions[quizState.current];
    var numEl = $('qbar-num');
    if (numEl) numEl.textContent = quizState.current + 1;

    if (bar) bar.style.display = '';
    panel.style.display = '';

    var html = '<div class="qp-question">' + escHtml(qq.q) + '</div>';

    if (qq.type === 'mcq') {
      html += '<div class="qp-options">';
      for (var i = 0; i < qq.opts.length; i++) {
        html += '<button class="qp-opt" data-idx="' + i + '">' + escHtml(qq.opts[i]) + '</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="qp-num-row">';
      html += '<input class="qp-num-input" id="quiz-num-input" type="number" step="any" placeholder="Your answer">';
      html += '<button class="btn btn-primary qp-submit" id="quiz-num-submit">Submit</button>';
      html += '</div>';
    }

    panel.innerHTML = html;

    /* Wire MCQ option clicks */
    if (qq.type === 'mcq') {
      var opts = panel.querySelectorAll('.qp-opt');
      for (var o = 0; o < opts.length; o++) {
        opts[o].addEventListener('click', (function (idx) {
          return function () {
            var correct = idx === qq.correct;
            if (correct) quizState.score++;
            quizState.answers.push({ q: qq.q, correct: correct });
            quizState.current++;
            renderQuizQuestion();
          };
        })(o));
      }
    } else {
      /* Wire numeric submit */
      var submitBtn = $('quiz-num-submit');
      var numInput = $('quiz-num-input');
      var submitHandler = function () {
        var val = parseFloat(numInput ? numInput.value : '');
        var correct = isOk(val) && Math.abs(val - qq.answer) <= (qq.tol || 0.01);
        if (correct) quizState.score++;
        quizState.answers.push({ q: qq.q, correct: correct });
        quizState.current++;
        renderQuizQuestion();
      };
      if (submitBtn) submitBtn.addEventListener('click', submitHandler);
      if (numInput) {
        numInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') submitHandler();
        });
        numInput.focus();
      }
    }
  }

  /**
   * Show quiz results with score and retry button.
   */
  function showQuizResults() {
    var panel = $('quiz-panel');
    var bar = $('quiz-bar');
    var result = $('quiz-result');

    if (panel) panel.style.display = 'none';
    if (bar) bar.style.display = 'none';
    if (!result) return;

    var pct = Math.round((quizState.score / quizState.questions.length) * 100);
    var html = '<div class="qr-score">';
    html += '<span class="qr-num">' + quizState.score + '</span>';
    html += '<span class="qr-sep"> / </span>';
    html += '<span class="qr-total">' + quizState.questions.length + '</span>';
    html += '</div>';
    html += '<div class="qr-pct">' + pct + '% correct</div>';

    /* Per-question summary */
    html += '<div class="qr-breakdown">';
    for (var i = 0; i < quizState.answers.length; i++) {
      var a = quizState.answers[i];
      html += '<div class="qr-row ' + (a.correct ? 'qr-correct' : 'qr-wrong') + '">';
      html += '<span class="qr-icon">' + (a.correct ? '&#10003;' : '&#10007;') + '</span> ';
      html += escHtml(a.q);
      html += '</div>';
    }
    html += '</div>';

    html += '<button class="btn btn-primary qr-retry" id="quiz-retry">Try Again</button>';

    result.innerHTML = html;
    result.style.display = '';

    var retryBtn = $('quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        result.style.display = 'none';
        startQuiz();
      });
    }
  }


  /* S25 ── Hint & Init ─────────────────────────────────── */

  /**
   * Dismiss the hint bar.
   */
  function dismissHint() {
    if (elHintBar) elHintBar.style.display = 'none';
  }

  /* Wire hint close button */
  (function () {
    if (!elHintBar) return;
    var closeBtn = elHintBar.querySelector('.hint-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', dismissHint);
    }
  })();

  /* S25b ── Math Keyboard ─────────────────────────────────── */

  /** Currently targeted function input element for the shared keyboard modal */
  var mkbdTargetInput = null;
  var mkbdTargetLabel = 'f';

  /** Open the math keyboard modal targeting a specific function input */
  function openMathKeyboard(inputEl, label) {
    mkbdTargetInput = inputEl;
    mkbdTargetLabel = label || 'f';
    var overlay = $('mkbd-overlay');
    var inp = $('mkbd-input');
    if (!overlay || !inp) return;
    inp.value = inputEl ? inputEl.value : '';
    mkbdUpdatePreview();
    overlay.style.display = 'flex';
    setTimeout(function () { inp.focus(); inp.select(); }, 60);
  }

  function buildMathKeyboard() {
    var overlay  = $('mkbd-overlay');
    var closeBtn = $('mkbd-close');
    var cancelBtn= $('mkbd-cancel');
    var applyBtn = $('mkbd-apply');
    var delBtn   = $('mkbd-del');
    var clrBtn   = $('mkbd-clr');
    var inp      = $('mkbd-input');
    if (!overlay || !inp) return;

    /* ── close ── */
    function closeKeyboard() {
      overlay.style.display = 'none';
      mkbdTargetInput = null;
    }

    if (closeBtn)  closeBtn.addEventListener('click', closeKeyboard);
    if (cancelBtn) cancelBtn.addEventListener('click', closeKeyboard);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeKeyboard();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        e.stopPropagation();
        closeKeyboard();
      }
    });

    /* ── live preview ── */
    function mkbdUpdatePreview() {
      var val = inp.value.trim();
      var previewEl = $('mkbd-preview');
      if (!previewEl) return;
      if (!val) {
        previewEl.innerHTML = '<span class="mkbd-preview-placeholder">' + escHtml(mkbdTargetLabel) + '(x) = \u2026</span>';
        return;
      }
      try {
        var ast = parse(val);
        if (ast) {
          previewEl.innerHTML = renderMath(mkbdTargetLabel + '(x) = ' + astToLatex(ast));
        } else {
          previewEl.innerHTML = '<span class="mkbd-preview-raw">' + escHtml(mkbdTargetLabel) + '(x) = ' + escHtml(val) + '</span>';
        }
      } catch (err) {
        previewEl.innerHTML = '<span class="mkbd-preview-raw">' + escHtml(mkbdTargetLabel) + '(x) = ' + escHtml(val) + '</span>';
      }
    }
    /* expose for openMathKeyboard */
    window._mkbdUpdatePreview = mkbdUpdatePreview;

    inp.addEventListener('input', mkbdUpdatePreview);

    /* ── insert at cursor ── */
    function mkbdInsert(text) {
      var s = inp.selectionStart, e = inp.selectionEnd;
      var selected = inp.value.slice(s, e);
      var isFn = text.charAt(text.length - 1) === '(';
      var inserted, cursorPos;

      if (text === '()') {
        inserted = '()';
        cursorPos = s + 1;
      } else if (isFn && selected) {
        inserted = text + selected + ')';
        cursorPos = s + inserted.length;
      } else if (isFn) {
        /* Default x inside parens, select it */
        inserted = text + 'x)';
        cursorPos = s + text.length + 1;
      } else {
        inserted = text;
        cursorPos = s + text.length;
      }

      inp.value = inp.value.slice(0, s) + inserted + inp.value.slice(e);
      if (isFn && !selected && text !== '()') {
        inp.setSelectionRange(s + text.length, s + text.length + 1);
      } else {
        inp.setSelectionRange(cursorPos, cursorPos);
      }
      mkbdUpdatePreview();
      inp.focus();
    }

    /* ── backspace ── */
    function mkbdDelete() {
      var s = inp.selectionStart, e = inp.selectionEnd;
      if (s !== e) {
        inp.value = inp.value.slice(0, s) + inp.value.slice(e);
        inp.setSelectionRange(s, s);
      } else if (s > 0) {
        inp.value = inp.value.slice(0, s - 1) + inp.value.slice(s);
        inp.setSelectionRange(s - 1, s - 1);
      }
      mkbdUpdatePreview();
      inp.focus();
    }

    if (delBtn) delBtn.addEventListener('click', mkbdDelete);
    if (clrBtn) clrBtn.addEventListener('click', function () {
      inp.value = '';
      mkbdUpdatePreview();
      inp.focus();
    });

    /* ── apply ── */
    if (applyBtn) applyBtn.addEventListener('click', function () {
      var val = inp.value.trim();
      if (!val) return;
      if (mkbdTargetInput) {
        mkbdTargetInput.value = val;
        mkbdTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      closeKeyboard();
    });

    /* ── wire all data-ins buttons ── */
    var allBtns = overlay.querySelectorAll('[data-ins]');
    for (var i = 0; i < allBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          mkbdInsert(btn.getAttribute('data-ins'));
        });
      })(allBtns[i]);
    }

    /* ── tab switching ── */
    var tabs = overlay.querySelectorAll('.mkbd-tab');
    for (var t = 0; t < tabs.length; t++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
          var panels = overlay.querySelectorAll('.mkbd-panel');
          for (var k = 0; k < panels.length; k++) panels[k].classList.remove('active');
          tab.classList.add('active');
          var panel = $('mkbd-panel-' + tab.getAttribute('data-tab'));
          if (panel) panel.classList.add('active');
          inp.focus();
        });
      })(tabs[t]);
    }

    /* ── Enter key triggers apply ── */
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && applyBtn) applyBtn.click();
    });
  }

  /* expose so trigger buttons built in rebuildSidebar can call it after init */
  function mkbdUpdatePreview() {
    if (window._mkbdUpdatePreview) window._mkbdUpdatePreview();
  }


  /**
   * Initialise the graphing calculator.
   */
  function init() {
    /* 1. Set up canvas */
    initCanvas();
    sizeCanvas();

    /* 2. Add default function */
    addFunction('sin(x)');

    /* 3. Wire preset bar */
    renderPresetBar();

    /* 4. Wire Add Function button */
    if (elBtnAddFunc) {
      elBtnAddFunc.addEventListener('click', function () {
        addFunction('');
      });
    }

    /* 5. Attach canvas interaction events */
    attachCanvasEvents();

    /* 6. Attach resize observer */
    attachResizeObserver();

    /* 8. Wire options and integral UI */
    updateOptionsUI();
    updateIntegralUI();

    /* 9. Wire table button */
    var tableBtn = $('btn-toggle-table');
    if (tableBtn) {
      tableBtn.addEventListener('click', toggleTable);
    }
    var tableStepInput = $('table-step');
    if (tableStepInput) {
      tableStepInput.addEventListener('change', function () {
        if (state.tableVisible) renderTable();
      });
    }

    /* 10. Wire zoom toolbar */
    if (elBtnZoomIn) elBtnZoomIn.addEventListener('click', function () {
      var v = state.view;
      zoomAtPoint(0.7, (v.xMin + v.xMax) / 2, (v.yMin + v.yMax) / 2);
      draw();
    });
    if (elBtnZoomOut) elBtnZoomOut.addEventListener('click', function () {
      var v = state.view;
      zoomAtPoint(1.4, (v.xMin + v.xMax) / 2, (v.yMin + v.yMax) / 2);
      draw();
    });
    if (elBtnZoomReset) elBtnZoomReset.addEventListener('click', resetView);
    if (elBtnZoomFit) elBtnZoomFit.addEventListener('click', zoomToFit);

    /* 11. Wire canvas context menu */
    if (canvas) {
      canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        /* Check if right-clicking on an annotation */
        var crect = canvas.getBoundingClientRect();
        var csx = e.clientX - crect.left, csy = e.clientY - crect.top;
        var ctxHit = findNearestAnnotation(csx, csy);
        if (ctxHit) {
          state.selectedAnnotation = ctxHit.idx;
          state.selectedAnnotationType = ctxHit.type;
          draw();
        }
        showCtxMenu(e.clientX, e.clientY);
      });
    }

    /* 12. Set initial mode */
    switchMode('simulate');

    /* 13. Wire tool toolbar and settings panel */
    wireToolbar();
    wireSettings();
    findAllIntersections();

    /* 14. Wire Math Keyboard */
    buildMathKeyboard();

    /* 15. Initial draw */
    draw();
  }

  /* Launch */
  init();

  /* S26 ── Tool Mode System ──────────────────────────────── */

  function setTool(t) {
    /* Cancel any pending 2-click operation */
    state.pendingClick = null;
    /* Finalize any in-progress sketch stroke */
    if (state.activeStroke) {
      if (state.activeStroke.points.length >= 2) state.strokes.push(state.activeStroke);
      state.activeStroke = null;
    }
    /* Cancel any in-progress shape */
    if (state.activeShape) { state.activeShape = null; }
    /* Close dropdowns when switching tools */
    var dd = $('sketch-dropdown');
    if (dd) dd.style.display = 'none';
    var sd = $('shape-dropdown');
    if (sd) sd.style.display = 'none';
    /* Hide text input */
    var ti = $('shape-text-input');
    if (ti) ti.style.display = 'none';

    state.tool = t;
    if (canvas) {
      if (t === 'move') canvas.style.cursor = 'crosshair';
      else if (t === 'point') canvas.style.cursor = 'copy';
      else if (t === 'sketch' || t === 'shape') canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'pointer';
    }
    /* Update toolbar active state */
    var btns = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === t);
    }
    /* Auto-find intersections when switching to intersect tool */
    if (t === 'intersect') {
      findAllIntersections();
      draw();
    }
  }

  function wireToolbar() {
    var btns = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < btns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          setTool(btn.getAttribute('data-tool'));
        });
      })(btns[i]);
    }
  }

  /* S27 ── Intersection Finder ───────────────────────────── */

  function findAllIntersections() {
    state.intersections = [];
    var visible = [];
    for (var i = 0; i < state.funcs.length; i++) {
      if (state.funcs[i].visible && state.funcs[i].ast && state.funcs[i].type !== 'implicit' && state.funcs[i].type !== 'parametric' && state.funcs[i].type !== 'polar') {
        visible.push(i);
      }
    }
    if (visible.length < 2) return;
    var v = state.view;
    var steps = 500;
    var dx = (v.xMax - v.xMin) / steps;
    for (var a = 0; a < visible.length; a++) {
      for (var b = a + 1; b < visible.length; b++) {
        var fA = state.funcs[visible[a]];
        var fB = state.funcs[visible[b]];
        var prevDiff = evaluate(fA.ast, v.xMin, fA.params) - evaluate(fB.ast, v.xMin, fB.params);
        for (var s = 1; s <= steps; s++) {
          var xc = v.xMin + s * dx;
          var diff = evaluate(fA.ast, xc, fA.params) - evaluate(fB.ast, xc, fB.params);
          /* Sample landed exactly on a crossing (diff === 0) */
          if (isFinite(diff) && diff === 0 && isFinite(prevDiff) && prevDiff !== 0) {
            var yEq = evaluate(fA.ast, xc, fA.params);
            if (isFinite(yEq)) {
              state.intersections.push({ x: xc, y: yEq, funcA: visible[a], funcB: visible[b] });
            }
            prevDiff = diff;
            continue;
          }
          if (isFinite(prevDiff) && isFinite(diff) && prevDiff * diff < 0) {
            /* Bisection refine */
            var lo = xc - dx, hi = xc;
            for (var k = 0; k < 50; k++) {
              var mid = (lo + hi) / 2;
              var dm = evaluate(fA.ast, mid, fA.params) - evaluate(fB.ast, mid, fB.params);
              if (dm * (evaluate(fA.ast, lo, fA.params) - evaluate(fB.ast, lo, fB.params)) < 0) hi = mid;
              else lo = mid;
            }
            var xi = (lo + hi) / 2;
            var yiA = evaluate(fA.ast, xi, fA.params);
            var yiB = evaluate(fB.ast, xi, fB.params);
            /* Reject phantom intersections at asymptotes: at a genuine
               crossing the residual |fA − fB| collapses toward 0 and the
               y-value stays near the view; at a pole (tan, 1/x) it does not. */
            var yRange = v.yMax - v.yMin;
            var resTol = Math.max(1e-6, (Math.abs(yiA) + Math.abs(yiB)) * 1e-6, yRange * 1e-6);
            if (isFinite(yiA) && isFinite(yiB) &&
                Math.abs(yiA - yiB) <= resTol &&
                Math.abs(yiA) < Math.abs(v.yMin) + Math.abs(v.yMax) + yRange * 10) {
              state.intersections.push({ x: xi, y: yiA, funcA: visible[a], funcB: visible[b] });
            }
          }
          prevDiff = diff;
        }
      }
    }
  }

  function drawIntersections() {
    if (state.intersections.length === 0) return;
    for (var i = 0; i < state.intersections.length; i++) {
      var pt = state.intersections[i];
      var sx = toSX(pt.x), sy = toSY(pt.y);
      if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
      /* White outer ring */
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      /* Red inner dot */
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      /* Coordinate label */
      var label = '(' + roundSig(pt.x, 3) + ', ' + roundSig(pt.y, 3) + ')';
      ctx.font = '11px ' + (state.options ? 'Courier New, monospace' : 'sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      var lx = sx + 10, ly = sy - 10;
      /* Background for label */
      var tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(lx - 4, ly - 13, tw + 8, 16);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(label, lx, ly);
    }
  }

  /* S28 ── Tangent Line Tool ─────────────────────────────── */

  function addTangentAt(funcIdx, x0) {
    var f = state.funcs[funcIdx];
    if (!f || !f.ast) return;
    var y0 = evaluate(f.ast, x0, f.params);
    var slope = numericalDeriv(f.ast, x0, f.params);
    if (!isFinite(y0) || !isFinite(slope)) return;
    var yInt = y0 - slope * x0;
    state.tangents.push({ funcIdx: funcIdx, x0: x0, slope: slope, yInt: yInt, color: f.color });
    draw();
  }

  function drawTangentLines() {
    for (var i = 0; i < state.tangents.length; i++) {
      var t = state.tangents[i];
      var tf = state.funcs[t.funcIdx];
      if (tf && !tf.visible) continue;
      var v = state.view;
      /* Line: y = slope * x + yInt */
      var x1 = v.xMin, y1 = t.slope * x1 + t.yInt;
      var x2 = v.xMax, y2 = t.slope * x2 + t.yInt;
      ctx.beginPath();
      ctx.moveTo(toSX(x1), toSY(y1));
      ctx.lineTo(toSX(x2), toSY(y2));
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      /* Mark the tangent point */
      var px = toSX(t.x0), py = toSY(t.slope * t.x0 + t.yInt);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Label */
      var label = 'y = ' + formatNum(t.slope) + 'x ' + (t.yInt >= 0 ? '+ ' : '- ') + formatNum(Math.abs(t.yInt));
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(label, px + 10, py - 10);
    }
  }

  /* S28b ── Interactive Derivative & Integral Tools ─────────── */

  /**
   * Handle 2-click tool workflow for derivative and integral tools.
   * First click sets the start point, second click completes the action.
   */
  function handleTwoClickTool() {
    if (!state.hoverPoint) {
      /* Clicked away from any curve — cancel pending */
      state.pendingClick = null;
      draw();
      return;
    }

    var hp = state.hoverPoint;
    var f = state.funcs[hp.funcIdx];
    if (!f || !f.visible || !f.ast) return;

    if (!state.pendingClick) {
      /* First click — store starting point */
      state.pendingClick = { tool: state.tool, funcIdx: hp.funcIdx, wx: hp.wx };
      draw();
      return;
    }

    /* Second click — must be same function */
    if (state.pendingClick.funcIdx !== hp.funcIdx) {
      /* Different function — restart with new first click */
      state.pendingClick = { tool: state.tool, funcIdx: hp.funcIdx, wx: hp.wx };
      draw();
      return;
    }

    var xA = state.pendingClick.wx;
    var xB = hp.wx;
    if (Math.abs(xA - xB) < 1e-9) { state.pendingClick = null; draw(); return; }
    var xFrom = Math.min(xA, xB);
    var xTo = Math.max(xA, xB);
    var color = f.color;

    if (state.tool === 'derivative') {
      state.derivSegments.push({ funcIdx: hp.funcIdx, xFrom: xFrom, xTo: xTo, color: color });
    } else if (state.tool === 'integral') {
      var value = computeIntegral(f.ast, xFrom, xTo, f.params || {});
      state.integralRegions.push({ funcIdx: hp.funcIdx, xFrom: xFrom, xTo: xTo, color: color, value: value });
    }

    state.pendingClick = null;
    draw();
  }

  /**
   * Draw interactive derivative segments (f'(x) between two user-selected points).
   */
  function drawDerivSegments() {
    for (var s = 0; s < state.derivSegments.length; s++) {
      var seg = state.derivSegments[s];
      var f = state.funcs[seg.funcIdx];
      if (!f || !f.ast || !f.visible) continue;
      var params = f.params || {};

      /* Compute pixel range */
      var sxFrom = Math.max(0, toSX(seg.xFrom));
      var sxTo = Math.min(W, toSX(seg.xTo));
      if (sxFrom >= sxTo) continue;

      var samples = Math.ceil(sxTo - sxFrom);
      if (samples < 2) continue;

      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.setLineDash([8, 4]);

      ctx.beginPath();
      var inPath = false;
      var midSx = (sxFrom + sxTo) / 2;
      var midSy = 0;
      var midFound = false;

      for (var i = 0; i <= samples; i++) {
        var sx = sxFrom + i;
        var wx = toWX(sx);
        if (wx < seg.xFrom || wx > seg.xTo) continue;
        var dy = numericalDeriv(f.ast, wx, params);
        if (!isOk(dy)) { inPath = false; continue; }
        var sy = toSY(dy);

        /* Break on discontinuity (world-space threshold, consistent
           with plotFunction / plotDerivLine) */
        if (inPath && i > 0) {
          var prevSx = sxFrom + i - 1;
          var prevWx = toWX(prevSx);
          var prevDy = numericalDeriv(f.ast, prevWx, params);
          var segYRange = state.view.yMax - state.view.yMin;
          if (isOk(prevDy) && Math.abs(dy - prevDy) > segYRange * 2) {
            inPath = false;
          }
        }

        if (!inPath) {
          ctx.moveTo(sx, sy);
          inPath = true;
        } else {
          ctx.lineTo(sx, sy);
        }

        /* Capture midpoint for label */
        if (!midFound && sx >= midSx) { midSy = sy; midFound = true; }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      /* Draw boundary markers */
      drawBoundaryLine(seg.xFrom, seg.color);
      drawBoundaryLine(seg.xTo, seg.color);

      /* Label at midpoint */
      if (midFound) {
        var lbl = "f'(x)";
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        var tw = ctx.measureText(lbl).width;
        var lx = midSx - tw / 2;
        var ly = midSy - 14;
        if (ly < 16) ly = midSy + 22;

        ctx.fillStyle = 'rgba(13,17,23,0.88)';
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = 1;
        roundRect(ctx, lx - 6, ly - 13, tw + 12, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = seg.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(lbl, lx, ly);
      }
    }
  }

  /**
   * Draw interactive integral regions (shaded area + value label).
   */
  function drawIntegralRegions() {
    for (var r = 0; r < state.integralRegions.length; r++) {
      var reg = state.integralRegions[r];
      var f = state.funcs[reg.funcIdx];
      if (!f || !f.ast || !f.visible) continue;
      var params = f.params || {};

      var xFrom = reg.xFrom;
      var xTo = reg.xTo;
      if (xFrom >= xTo) continue;

      var steps = Math.max(200, Math.ceil(W));
      var dx = (xTo - xFrom) / steps;
      var zeroSY = toSY(0);

      /* Shaded area polygon (split at undefined samples, e.g. across poles) */
      ctx.fillStyle = reg.color;
      ctx.globalAlpha = 0.18;
      fillIntegralPolygons(f.ast, params, xFrom, xTo, steps, dx, zeroSY);
      ctx.globalAlpha = 1;

      /* Boundary lines */
      drawBoundaryLine(xFrom, reg.color);
      drawBoundaryLine(xTo, reg.color);

      /* Value label at midpoint */
      var midWx = (xFrom + xTo) / 2;
      var midWy = evaluate(f.ast, midWx, params);
      if (!isOk(midWy)) midWy = 0;
      var midSx = toSX(midWx);
      var midSy = toSY(midWy);

      var valStr = isOk(reg.value) ? roundSig(reg.value, 5).toString() : 'undef';
      var lbl = 'Area = ' + valStr;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      var tw = ctx.measureText(lbl).width;
      /* Position label above the curve (or below if too close to top) */
      var lx = midSx - tw / 2;
      var ly = midSy - 18;
      if (ly < 20) ly = midSy + 28;

      ctx.fillStyle = 'rgba(13,17,23,0.92)';
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = 1.5;
      roundRect(ctx, lx - 8, ly - 14, tw + 16, 22, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = reg.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(lbl, lx, ly);
    }
  }

  /**
   * Draw a dashed vertical boundary line at a given x position.
   */
  function drawBoundaryLine(wx, color) {
    var sx = toSX(wx);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  /**
   * Draw visual feedback for pending first click (pulsing dot + hint).
   */
  function drawPendingClick() {
    if (!state.pendingClick) return;
    var pc = state.pendingClick;
    var f = state.funcs[pc.funcIdx];
    if (!f || !f.ast) return;

    var wy = evaluate(f.ast, pc.wx, f.params || {});
    if (!isOk(wy)) return;
    var sx = toSX(pc.wx);
    var sy = toSY(wy);

    /* Pulsing dot */
    var pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(sx, sy, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* Dashed vertical line at first click */
    drawBoundaryLine(pc.wx, f.color);

    /* Hint label */
    var hint = 'Click 2nd point';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var tw = ctx.measureText(hint).width;
    var hx = sx + 12;
    var hy = sy - 12;
    if (hx + tw + 12 > W) hx = sx - tw - 20;
    if (hy < 16) hy = sy + 22;

    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 1;
    roundRect(ctx, hx - 6, hy - 12, tw + 12, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(hint, hx, hy);
  }

  /* S29 ── Click-to-Place Points ─────────────────────────── */

  /**
   * Add a point — snaps to the nearest visible curve within 40px.
   * If no curve is near, places a free point at the clicked location.
   */
  function addGraphPoint(wx, wy) {
    var screenX = toSX(wx);
    var screenY = toSY(wy);
    var bestFunc = -1;
    var bestDist = Infinity;
    var bestWY = wy;

    /* Find nearest curve */
    for (var i = 0; i < state.funcs.length; i++) {
      var f = state.funcs[i];
      if (!f.visible || !f.ast || f.type !== 'standard') continue;
      var curveY = evaluate(f.ast, wx, f.params || {});
      if (!isOk(curveY)) continue;
      var curveSY = toSY(curveY);
      var dist = Math.abs(curveSY - screenY);
      if (dist < bestDist) { bestDist = dist; bestFunc = i; bestWY = curveY; }
    }

    /* Snap to curve if within 40 CSS pixels */
    var snapped = (bestFunc >= 0 && bestDist < 40);
    var pt = {
      id: uid(),
      wx: wx,
      wy: snapped ? bestWY : wy,
      funcIdx: snapped ? bestFunc : -1,
      color: snapped ? state.funcs[bestFunc].color : '#18b4f5',
      dragging: false
    };
    state.points.push(pt);
    draw();
  }

  function drawFreePoints() {
    for (var i = 0; i < state.points.length; i++) {
      var pt = state.points[i];

      /* If snapped to a curve, recompute Y at current x (params may have changed) */
      if (pt.funcIdx >= 0 && pt.funcIdx < state.funcs.length) {
        var f = state.funcs[pt.funcIdx];
        if (f && !f.visible) continue;
        if (f && f.ast) {
          var liveY = evaluate(f.ast, pt.wx, f.params || {});
          if (isOk(liveY)) pt.wy = liveY;
          pt.color = f.color;
        }
      }

      var sx = toSX(pt.wx), sy = toSY(pt.wy);
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      var col = pt.color || '#18b4f5';

      /* Outer ring */
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      /* Coordinate label with background */
      var label = '(' + roundSig(pt.wx, 4) + ', ' + roundSig(pt.wy, 4) + ')';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      var lx = sx + 12, ly = sy - 10;
      /* Keep label on canvas */
      var tw = ctx.measureText(label).width;
      if (lx + tw + 6 > W) lx = sx - tw - 16;
      if (ly - 14 < 0) ly = sy + 20;
      /* Background pill */
      ctx.fillStyle = 'rgba(13,17,23,0.88)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      roundRect(ctx, lx - 6, ly - 15, tw + 12, 20, 4);
      ctx.fill();
      ctx.stroke();
      /* Text */
      ctx.fillStyle = col;
      ctx.fillText(label, lx, ly);
    }
  }

  function findNearestPoint(sx, sy, threshold) {
    var best = -1, bestDist = threshold * threshold;
    for (var i = 0; i < state.points.length; i++) {
      var px = toSX(state.points[i].wx), py = toSY(state.points[i].wy);
      var d = (px - sx) * (px - sx) + (py - sy) * (py - sy);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  /* ── Annotation Hit-Testing & Selection ────────────────── */

  /**
   * Distance from point (px,py) to line segment (ax,ay)-(bx,by) in screen px.
   */
  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }

  /**
   * Find the nearest shape or stroke to screen position (sx, sy).
   * Returns {type: 'shape'|'stroke', idx} or null.
   */
  /**
   * Reverse-rotate a point (px, py) around center (cx, cy) by -angle.
   * Returns the point in the shape's local (unrotated) coordinate system.
   */
  function unrotatePoint(px, py, cx, cy, angle) {
    if (!angle) return { x: px, y: py };
    var cos = Math.cos(-angle), sin = Math.sin(-angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  function findNearestAnnotation(sx, sy) {
    var threshold = 15;
    var best = null, bestDist = threshold;

    /* Check shapes (reverse order so topmost wins) */
    for (var i = state.shapes.length - 1; i >= 0; i--) {
      var s = state.shapes[i];
      var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);
      var d = Infinity;

      /* Reverse-rotate click point into shape's local space if rotated */
      var lsx = sx, lsy = sy;
      if (s.rotation) {
        var scx = (x1 + x2) / 2, scy = (y1 + y2) / 2;
        var lp = unrotatePoint(sx, sy, scx, scy, s.rotation);
        lsx = lp.x; lsy = lp.y;
      }

      switch (s.type) {
        case 'line': case 'arrow': case 'dblarrow':
          d = distToSegment(lsx, lsy, x1, y1, x2, y2);
          break;
        case 'rect':
          var rx = Math.min(x1, x2), ry = Math.min(y1, y2);
          var rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
          /* Check if inside or near edges */
          if (lsx >= rx - threshold && lsx <= rx + rw + threshold && lsy >= ry - threshold && lsy <= ry + rh + threshold) {
            var dLeft = Math.abs(lsx - rx), dRight = Math.abs(lsx - rx - rw);
            var dTop = Math.abs(lsy - ry), dBottom = Math.abs(lsy - ry - rh);
            d = Math.min(dLeft, dRight, dTop, dBottom);
            if (s.filled && lsx >= rx && lsx <= rx + rw && lsy >= ry && lsy <= ry + rh) d = 0;
          }
          break;
        case 'circle':
          var cdx = x2 - x1, cdy = y2 - y1;
          var radius = Math.sqrt(cdx * cdx + cdy * cdy);
          var dist = Math.sqrt((lsx - x1) * (lsx - x1) + (lsy - y1) * (lsy - y1));
          d = Math.abs(dist - radius);
          if (s.filled && dist <= radius) d = 0;
          break;
        case 'ellipse':
          var ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2;
          var erx = Math.abs(x2 - x1) / 2, ery = Math.abs(y2 - y1) / 2;
          if (erx > 0 && ery > 0) {
            var enorm = Math.sqrt(((lsx - ecx) * (lsx - ecx)) / (erx * erx) + ((lsy - ecy) * (lsy - ecy)) / (ery * ery));
            d = Math.abs(enorm - 1) * Math.min(erx, ery);
            if (s.filled && enorm <= 1) d = 0;
          }
          break;
        case 'text':
          /* Use stored bounding box */
          var ttx = Math.min(x1, x2), tty = Math.min(y1, y2);
          var ttw = Math.abs(x2 - x1), tth = Math.abs(y2 - y1);
          if (ttw < 4) { ttw = 60; tth = 22; } /* fallback */
          if (lsx >= ttx - 4 && lsx <= ttx + ttw + 4 && lsy >= tty - 4 && lsy <= tty + tth + 4) d = 0;
          break;
      }
      if (d < bestDist) { bestDist = d; best = { type: 'shape', idx: i }; }
    }

    /* Check strokes (reverse order) */
    for (var j = state.strokes.length - 1; j >= 0; j--) {
      var pts = state.strokes[j].points;
      for (var k = 1; k < pts.length; k++) {
        var sd = distToSegment(sx, sy, toSX(pts[k - 1].wx), toSY(pts[k - 1].wy), toSX(pts[k].wx), toSY(pts[k].wy));
        if (sd < bestDist) { bestDist = sd; best = { type: 'stroke', idx: j }; break; }
      }
    }

    return best;
  }

  /**
   * Delete the currently selected annotation.
   */
  function deleteSelectedAnnotation() {
    if (state.selectedAnnotation < 0) return;
    saveUndo();
    if (state.selectedAnnotationType === 'shape') {
      state.shapes.splice(state.selectedAnnotation, 1);
    } else if (state.selectedAnnotationType === 'stroke') {
      state.strokes.splice(state.selectedAnnotation, 1);
    }
    state.selectedAnnotation = -1;
    state.selectedAnnotationType = '';
    selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
    draw();
  }

  /**
   * Rotate the currently selected annotation by 15 degrees.
   */
  var lockIconPositions = false;

  function rotateSelectedAnnotation() {
    if (state.selectedAnnotation < 0) return;
    saveUndo();
    if (state.selectedAnnotationType === 'shape') {
      var s = state.shapes[state.selectedAnnotation];
      if (s) s.rotation = ((s.rotation || 0) + Math.PI / 12) % (Math.PI * 2); /* +15 deg */
    } else if (state.selectedAnnotationType === 'stroke') {
      var st = state.strokes[state.selectedAnnotation];
      if (st) st.rotation = ((st.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    }
    lockIconPositions = true;
    draw();
    lockIconPositions = false;
  }

  /**
   * Duplicate the currently selected annotation with a small offset.
   */
  function duplicateSelectedAnnotation() {
    if (state.selectedAnnotation < 0) return;
    saveUndo();
    var offset = (state.view.xMax - state.view.xMin) * 0.03;
    if (state.selectedAnnotationType === 'shape') {
      var orig = state.shapes[state.selectedAnnotation];
      if (!orig) return;
      var dup = deepClone(orig);
      dup.wx1 += offset; dup.wy1 -= offset;
      dup.wx2 += offset; dup.wy2 -= offset;
      state.shapes.push(dup);
      state.selectedAnnotation = state.shapes.length - 1;
    } else if (state.selectedAnnotationType === 'stroke') {
      var origS = state.strokes[state.selectedAnnotation];
      if (!origS) return;
      var dupS = deepClone(origS);
      for (var i = 0; i < dupS.points.length; i++) {
        dupS.points[i].wx += offset;
        dupS.points[i].wy -= offset;
      }
      state.strokes.push(dupS);
      state.selectedAnnotation = state.strokes.length - 1;
    }
    draw();
  }

  /** Selection UI hit areas (screen coords, updated each draw) */
  var selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };

  /**
   * Rotate point (px, py) around (cx, cy) by angle.
   */
  function rotatePoint(px, py, cx, cy, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  /**
   * Compute the selection bounding box in screen coords, accounting for rotation.
   * Returns {minX, minY, maxX, maxY, rotation, cx, cy, corners: [{x,y}x4]} or null.
   */
  function getSelectionBounds() {
    if (state.selectedAnnotation < 0) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var rot = 0, corners = null;

    if (state.selectedAnnotationType === 'shape') {
      var s = state.shapes[state.selectedAnnotation];
      if (!s) return null;
      rot = s.rotation || 0;
      var sx1 = toSX(s.wx1), sy1 = toSY(s.wy1), sx2 = toSX(s.wx2), sy2 = toSY(s.wy2);
      var lMinX, lMinY, lMaxX, lMaxY;
      if (s.type === 'circle') {
        var r = Math.sqrt((sx2 - sx1) * (sx2 - sx1) + (sy2 - sy1) * (sy2 - sy1));
        lMinX = sx1 - r; lMinY = sy1 - r; lMaxX = sx1 + r; lMaxY = sy1 + r;
      } else {
        lMinX = Math.min(sx1, sx2); lMinY = Math.min(sy1, sy2);
        lMaxX = Math.max(sx1, sx2); lMaxY = Math.max(sy1, sy2);
      }
      var pad = 6;
      lMinX -= pad; lMinY -= pad; lMaxX += pad; lMaxY += pad;
      var cx = (lMinX + lMaxX) / 2, cy = (lMinY + lMaxY) / 2;

      /* Compute rotated corner positions */
      var c0 = rotatePoint(lMinX, lMinY, cx, cy, rot); /* NW */
      var c1 = rotatePoint(lMaxX, lMinY, cx, cy, rot); /* NE */
      var c2 = rotatePoint(lMaxX, lMaxY, cx, cy, rot); /* SE */
      var c3 = rotatePoint(lMinX, lMaxY, cx, cy, rot); /* SW */
      corners = [c0, c1, c2, c3];

      /* Axis-aligned bounding box of rotated corners */
      for (var ci = 0; ci < 4; ci++) {
        if (corners[ci].x < minX) minX = corners[ci].x;
        if (corners[ci].y < minY) minY = corners[ci].y;
        if (corners[ci].x > maxX) maxX = corners[ci].x;
        if (corners[ci].y > maxY) maxY = corners[ci].y;
      }
      return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, rotation: rot, cx: cx, cy: cy, corners: corners };
    } else if (state.selectedAnnotationType === 'stroke') {
      var st = state.strokes[state.selectedAnnotation];
      if (!st) return null;
      rot = st.rotation || 0;
      for (var i = 0; i < st.points.length; i++) {
        var px = toSX(st.points[i].wx), py = toSY(st.points[i].wy);
        if (px < minX) minX = px; if (py < minY) minY = py;
        if (px > maxX) maxX = px; if (py > maxY) maxY = py;
      }
      if (!isFinite(minX)) return null;
      var spad = 6;
      minX -= spad; minY -= spad; maxX += spad; maxY += spad;
      var scx = (minX + maxX) / 2, scy = (minY + maxY) / 2;
      if (rot) {
        var sc0 = rotatePoint(minX, minY, scx, scy, rot);
        var sc1 = rotatePoint(maxX, minY, scx, scy, rot);
        var sc2 = rotatePoint(maxX, maxY, scx, scy, rot);
        var sc3 = rotatePoint(minX, maxY, scx, scy, rot);
        corners = [sc0, sc1, sc2, sc3];
        minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
        for (var si = 0; si < 4; si++) {
          if (corners[si].x < minX) minX = corners[si].x;
          if (corners[si].y < minY) minY = corners[si].y;
          if (corners[si].x > maxX) maxX = corners[si].x;
          if (corners[si].y > maxY) maxY = corners[si].y;
        }
      } else {
        var nc0 = {x: minX, y: minY}, nc1 = {x: maxX, y: minY};
        var nc2 = {x: maxX, y: maxY}, nc3 = {x: minX, y: maxY};
        corners = [nc0, nc1, nc2, nc3];
      }
      return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, rotation: rot, cx: scx, cy: scy, corners: corners };
    }
    return null;
  }

  /**
   * Check if screen point (sx, sy) is near a corner handle.
   * Returns 'nw','ne','sw','se' or null.
   */
  function hitCorner(sx, sy, b) {
    if (!b || !b.corners) return null;
    var t = 10; /* hit threshold — generous for touch */
    var labels = ['nw', 'ne', 'se', 'sw'];
    for (var ci = 0; ci < 4; ci++) {
      if (Math.abs(sx - b.corners[ci].x) < t && Math.abs(sy - b.corners[ci].y) < t) return labels[ci];
    }
    return null;
  }

  /**
   * Check if screen point is inside a button rect {x, y, w, h}.
   */
  /**
   * Check if point (px, py) is inside a convex polygon defined by corners array.
   */
  function pointInPolygon(px, py, corners) {
    if (!corners || corners.length < 3) return false;
    var n = corners.length, inside = true;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var cross = (corners[i].x - corners[j].x) * (py - corners[j].y) -
                  (corners[i].y - corners[j].y) * (px - corners[j].x);
      if (i === 0) { inside = cross >= 0; }
      else if ((cross >= 0) !== inside) return false;
    }
    return true;
  }

  function hitBtn(sx, sy, btn) {
    if (!btn) return false;
    return sx >= btn.x && sx <= btn.x + btn.w && sy >= btn.y && sy <= btn.y + btn.h;
  }

  /**
   * Draw selection indicator with corner handles + action icons.
   */
  function drawSelectionIndicator() {
    var b = getSelectionBounds();
    if (!b) { selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null }; return; }

    selectionUI.box = b;

    /* Use rotated corners from getSelectionBounds */
    var c = b.corners; /* [NW, NE, SE, SW] */

    /* Dashed selection polygon (rotated) */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(c[0].x, c[0].y);
    ctx.lineTo(c[1].x, c[1].y);
    ctx.lineTo(c[2].x, c[2].y);
    ctx.lineTo(c[3].x, c[3].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    /* Corner handles at rotated positions */
    var hs = 5;
    ctx.fillStyle = '#4fc3f7';
    ctx.globalAlpha = 1;
    for (var chi = 0; chi < 4; chi++) {
      ctx.fillRect(c[chi].x - hs, c[chi].y - hs, hs * 2, hs * 2);
    }

    /* Action icons above selection: [Delete] [Duplicate] ... [Rotate] */
    var iconSize = 24;
    var gap = 6;
    var totalW = iconSize * 3 + gap * 2;
    var icX, icY;
    if (lockIconPositions && selectionUI.deleteBtn) {
      /* Reuse cached icon positions during rotation */
      icX = selectionUI.deleteBtn.x;
      icY = selectionUI.deleteBtn.y;
    } else {
      icX = (b.minX + b.maxX) / 2 - totalW / 2;
      icY = b.minY - iconSize - 8;
      if (icY < 2) icY = b.maxY + 8; /* flip below if too close to top */
    }

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* Delete button — trash bin icon */
    var delBtn = { x: icX, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1;
    roundRect(ctx, delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5);
    ctx.fill(); ctx.stroke();
    /* Draw trash bin icon */
    var dx = delBtn.x + iconSize / 2, dy = delBtn.y + iconSize / 2;
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dx - 5, dy - 4); ctx.lineTo(dx + 5, dy - 4); /* lid */
    ctx.moveTo(dx - 2, dy - 4); ctx.lineTo(dx - 2, dy - 6);
    ctx.lineTo(dx + 2, dy - 6); ctx.lineTo(dx + 2, dy - 4); /* handle */
    ctx.moveTo(dx - 4, dy - 3); ctx.lineTo(dx - 3, dy + 5);
    ctx.lineTo(dx + 3, dy + 5); ctx.lineTo(dx + 4, dy - 3); /* body */
    ctx.moveTo(dx - 1, dy - 2); ctx.lineTo(dx - 1, dy + 3); /* lines */
    ctx.moveTo(dx + 1, dy - 2); ctx.lineTo(dx + 1, dy + 3);
    ctx.stroke();
    selectionUI.deleteBtn = delBtn;

    /* Duplicate button */
    var dupBtn = { x: icX + iconSize + gap, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1;
    roundRect(ctx, dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('\u2750', dupBtn.x + iconSize / 2, dupBtn.y + iconSize / 2);
    selectionUI.dupBtn = dupBtn;

    /* Rotate button — circular arrow icon */
    var rotBtn = { x: icX + (iconSize + gap) * 2, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1;
    roundRect(ctx, rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5);
    ctx.fill(); ctx.stroke();
    /* Draw rotation arrow icon */
    var rx = rotBtn.x + iconSize / 2, ry = rotBtn.y + iconSize / 2;
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(rx, ry, 5, -Math.PI * 0.8, Math.PI * 0.5);
    ctx.stroke();
    /* Arrowhead on the arc */
    var ax = rx + 5 * Math.cos(Math.PI * 0.5), ay = ry + 5 * Math.sin(Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(ax - 3, ay - 2); ctx.lineTo(ax, ay + 1); ctx.lineTo(ax + 3, ay - 2);
    ctx.stroke();
    selectionUI.rotateBtn = rotBtn;

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  /* S30 ── Slider Animation ──────────────────────────────── */

  var animFrameId = null;

  function startAnimation(paramName) {
    if (state.animation && state.animation.playing) stopAnimation();
    var sl = state.sliders[paramName];
    if (!sl) return;
    state.animation = { param: paramName, dir: 1, playing: true, lastTime: 0 };
    animLoop(0);
  }

  function stopAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    if (state.animation) state.animation.playing = false;
    state.animation = null;
  }

  /** Animation speed: fraction of range per second (0.15 = full sweep in ~6.7s) */
  var ANIM_SPEED = 0.15;

  function animLoop(timestamp) {
    if (!state.animation || !state.animation.playing) return;
    var a = state.animation;
    var sl = state.sliders[a.param];
    if (!sl) { stopAnimation(); return; }

    /* Delta-time based movement (frame-rate independent) */
    var dt = a.lastTime ? (timestamp - a.lastTime) / 1000 : 1 / 60;
    a.lastTime = timestamp;
    /* Clamp dt to avoid huge jumps if tab was hidden */
    if (dt > 0.1) dt = 0.1;

    var range = sl.max - sl.min;
    sl.value += a.dir * ANIM_SPEED * range * dt;

    if (sl.value >= sl.max) { sl.value = sl.max; a.dir = -1; }
    if (sl.value <= sl.min) { sl.value = sl.min; a.dir = 1; }

    /* Update per-function slider state too */
    var selFunc = state.funcs[state.selectedFunc];
    if (selFunc && selFunc.sliderState && selFunc.sliderState[a.param]) {
      selFunc.sliderState[a.param].value = sl.value;
    }

    syncFuncParams();
    /* Update slider UI without full rebuild (preserves play button state) */
    var rangeEl = document.getElementById('sl-' + a.param);
    var valEl = document.getElementById('slv-' + a.param);
    if (rangeEl) rangeEl.value = sl.value;
    if (valEl) valEl.value = sl.value.toFixed(1); /* <input>: set .value, not .textContent */
    draw();
    animFrameId = requestAnimationFrame(animLoop);
  }

  /* S31 ── Inequality Shading ────────────────────────────── */

  function detectInequality(expr) {
    /* Returns {type: '>'|'<'|'>='|'<=', funcExpr} or null */
    var m = expr.match(/^y\s*(>=|<=|>|<)\s*(.+)$/i);
    if (m) return { type: m[1], funcExpr: m[2] };
    var m2 = expr.match(/^(.+?)\s*(>=|<=|>|<)\s*y$/i);
    if (m2) {
      var flip = { '>': '<', '<': '>', '>=': '<=', '<=': '>=' };
      return { type: flip[m2[2]], funcExpr: m2[1] };
    }
    return null;
  }

  function plotInequalityShading(func) {
    if (!func.inequality || !func.ast) return;
    var type = func.inequality; /* '>', '<', '>=', '<=' */
    var color = func.color;
    var v = state.view;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.beginPath();
    var started = false;
    for (var px = 0; px <= W; px++) {
      var wx = toWX(px);
      var wy = evaluate(func.ast, wx, func.params);
      if (!isFinite(wy)) { if (started) { ctx.closePath(); ctx.fill(); ctx.beginPath(); started = false; } continue; }
      var sy = toSY(wy);
      if (!started) { ctx.moveTo(px, sy); started = true; } else { ctx.lineTo(px, sy); }
    }
    /* Close to edge */
    if (started) {
      if (type === '>' || type === '>=') {
        ctx.lineTo(W, 0); ctx.lineTo(0, 0);
      } else {
        ctx.lineTo(W, H); ctx.lineTo(0, H);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    /* Draw boundary line */
    plotFunction(func, 2, (type === '>' || type === '<') ? [6, 4] : [], 1.0);
  }

  /* S32 ── Implicit Equations (Marching Squares) ─────────── */

  function parseImplicit(expr) {
    /* Returns combined expression string for F(x,y) = LHS - RHS if expression contains '=' and 'y' */
    var eqIdx = expr.indexOf('=');
    if (eqIdx === -1) return null;
    /* Don't match <=, >=, or == */
    if (eqIdx > 0 && (expr[eqIdx - 1] === '<' || expr[eqIdx - 1] === '>' || expr[eqIdx - 1] === '!')) return null;
    if (eqIdx < expr.length - 1 && expr[eqIdx + 1] === '=') return null;
    var lhs = expr.substring(0, eqIdx).trim();
    var rhs = expr.substring(eqIdx + 1).trim();
    /* Check if it references y */
    if (!/\by\b/i.test(lhs + rhs)) return null;
    var combined = '(' + lhs + ') - (' + rhs + ')';
    return combined;
  }

  function evaluateImplicit(ast, x, y, params) {
    /* Evaluate with both x and y as variables */
    return evalImplicitNode(ast, x, y, params);
  }

  function evalImplicitNode(node, x, y, params) {
    if (!node) return NaN;
    switch (node.type) {
      case 'num': return node.value;
      case 'var': return x; /* x variable */
      case 'param':
        if (node.name === 'y' || node.name === 'Y') return y;
        return params[node.name] !== undefined ? params[node.name] : NaN;
      case 'unary': return -evalImplicitNode(node.arg, x, y, params);
      case 'binop': {
        var l = evalImplicitNode(node.left, x, y, params);
        var r = evalImplicitNode(node.right, x, y, params);
        switch (node.op) {
          case '+': return l + r; case '-': return l - r;
          case '*': return l * r; case '/': return r === 0 ? NaN : l / r;
          case '^': return Math.pow(l, r); default: return NaN;
        }
      }
      case 'call': {
        var args = [];
        for (var i = 0; i < node.args.length; i++) args.push(evalImplicitNode(node.args[i], x, y, params));
        if (node.name === 'factorial') return factorial(args[0]);
        var fn = KNOWN_FUNCS[node.name];
        if (!fn) return NaN;
        if (node.name === 'min') return Math.min.apply(null, args);
        if (node.name === 'max') return Math.max.apply(null, args);
        return fn.fn.apply(null, args);
      }
      default: return NaN;
    }
  }

  function plotImplicit(func) {
    if (!func.implicitAst) return;
    var v = state.view;
    var res = 3; /* pixels per sample */
    var cols = Math.ceil(W / res) + 1;
    var rows = Math.ceil(H / res) + 1;
    /* Sample grid */
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        var wx = toWX(c * res);
        var wy = toWY(r * res);
        grid[r][c] = evaluateImplicit(func.implicitAst, wx, wy, func.params);
      }
    }
    /* March squares */
    ctx.beginPath();
    ctx.strokeStyle = func.color;
    ctx.lineWidth = 2;
    for (var r2 = 0; r2 < rows - 1; r2++) {
      for (var c2 = 0; c2 < cols - 1; c2++) {
        var tl = grid[r2][c2], tr = grid[r2][c2 + 1];
        var bl = grid[r2 + 1][c2], br = grid[r2 + 1][c2 + 1];
        if (!isFinite(tl) || !isFinite(tr) || !isFinite(bl) || !isFinite(br)) continue;
        var idx = 0;
        if (tl > 0) idx |= 1;
        if (tr > 0) idx |= 2;
        if (br > 0) idx |= 4;
        if (bl > 0) idx |= 8;
        if (idx === 0 || idx === 15) continue;
        var x0 = c2 * res, y0 = r2 * res;
        var x1 = x0 + res, y1 = y0 + res;
        /* Interpolate edge crossings */
        var topPt = interpH(tl, tr, x0, x1, y0);
        var rightPt = interpV(tr, br, x1, y0, y1);
        var bottomPt = interpH(bl, br, x0, x1, y1);
        var leftPt = interpV(tl, bl, x0, y0, y1);
        var segs = [];
        switch (idx) {
          case 1: case 14: segs.push([leftPt, topPt]); break;
          case 2: case 13: segs.push([topPt, rightPt]); break;
          case 3: case 12: segs.push([leftPt, rightPt]); break;
          case 4: case 11: segs.push([rightPt, bottomPt]); break;
          case 5: {
            /* Saddle: disambiguate using center value */
            var cx5 = (x0 + x1) / 2, cy5 = (y0 + y1) / 2;
            var center5 = evaluateImplicit(func.implicitAst, toWX(cx5), toWY(cy5), func.params);
            if (center5 > 0) { segs.push([leftPt, bottomPt], [topPt, rightPt]); }
            else { segs.push([leftPt, topPt], [rightPt, bottomPt]); }
            break;
          }
          case 6: case 9: segs.push([topPt, bottomPt]); break;
          case 7: case 8: segs.push([leftPt, bottomPt]); break;
          case 10: {
            /* Saddle: disambiguate using center value */
            var cx10 = (x0 + x1) / 2, cy10 = (y0 + y1) / 2;
            var center10 = evaluateImplicit(func.implicitAst, toWX(cx10), toWY(cy10), func.params);
            if (center10 > 0) { segs.push([leftPt, topPt], [rightPt, bottomPt]); }
            else { segs.push([leftPt, bottomPt], [topPt, rightPt]); }
            break;
          }
        }
        for (var si = 0; si < segs.length; si++) {
          ctx.moveTo(segs[si][0].x, segs[si][0].y);
          ctx.lineTo(segs[si][1].x, segs[si][1].y);
        }
      }
    }
    ctx.stroke();
  }

  function interpH(v1, v2, xa, xb, yy) { var t = v1 / (v1 - v2); return { x: xa + t * (xb - xa), y: yy }; }
  function interpV(v1, v2, xx, ya, yb) { var t = v1 / (v1 - v2); return { x: xx, y: ya + t * (yb - ya) }; }

  /* S33 ── Parametric Curves ─────────────────────────────── */

  function plotParametric(func) {
    if (!func.paramXast || !func.paramYast) return;
    var tMin = func.tMin || 0, tMax = func.tMax || (2 * Math.PI);
    var steps = 1000;
    var dt = (tMax - tMin) / steps;
    ctx.beginPath();
    ctx.strokeStyle = func.color;
    ctx.lineWidth = 2;
    var started = false;
    for (var i = 0; i <= steps; i++) {
      var t = tMin + i * dt;
      var wx = evaluate(func.paramXast, t, func.params);
      var wy = evaluate(func.paramYast, t, func.params);
      if (!isFinite(wx) || !isFinite(wy)) { started = false; continue; }
      var sx = toSX(wx), sy = toSY(wy);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else { ctx.lineTo(sx, sy); }
    }
    ctx.stroke();
  }

  /* S34 ── Polar Curves ──────────────────────────────────── */

  function plotPolar(func) {
    if (!func.ast) return;
    var thMin = func.thMin || 0, thMax = func.thMax || (2 * Math.PI);
    var steps = 1000;
    var dth = (thMax - thMin) / steps;
    ctx.beginPath();
    ctx.strokeStyle = func.color;
    ctx.lineWidth = 2;
    var started = false;
    for (var i = 0; i <= steps; i++) {
      var th = thMin + i * dth;
      var r = evaluate(func.ast, th, func.params);
      if (!isFinite(r)) { started = false; continue; }
      var wx = r * Math.cos(th);
      var wy = r * Math.sin(th);
      var sx = toSX(wx), sy = toSY(wy);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else { ctx.lineTo(sx, sy); }
    }
    ctx.stroke();
  }

  /* S35 ── Graph Settings Panel ──────────────────────────── */

  function openSettings() {
    var panel = $('settings-panel');
    if (!panel) return;
    /* Populate current values */
    var inXMin = $('set-xmin'), inXMax = $('set-xmax');
    var inYMin = $('set-ymin'), inYMax = $('set-ymax');
    if (inXMin) inXMin.value = state.view.xMin;
    if (inXMax) inXMax.value = state.view.xMax;
    if (inYMin) inYMin.value = state.view.yMin;
    if (inYMax) inYMax.value = state.view.yMax;
    panel.style.display = '';
  }

  function closeSettings() {
    var panel = $('settings-panel');
    if (panel) panel.style.display = 'none';
  }

  function applySettings() {
    var xMin = parseFloat(($('set-xmin') || {}).value);
    var xMax = parseFloat(($('set-xmax') || {}).value);
    var yMin = parseFloat(($('set-ymin') || {}).value);
    var yMax = parseFloat(($('set-ymax') || {}).value);
    if (isFinite(xMin) && isFinite(xMax) && xMin < xMax) {
      state.view.xMin = xMin; state.view.xMax = xMax;
    }
    if (isFinite(yMin) && isFinite(yMax) && yMin < yMax) {
      state.view.yMin = yMin; state.view.yMax = yMax;
    }
    closeSettings();
    draw();
  }

  /* ── Clear All Analysis ─────────────────────────────────────── */

  function wireClearAnalysis() {
    var btnClear = $('btn-clear-all');
    var overlay = $('clear-confirm');
    var btnYes = $('clear-confirm-yes');
    var btnNo = $('clear-confirm-no');
    var selectEl = $('clear-category');
    var hintEl = $('clear-hint');
    if (!btnClear || !overlay) return;

    var hints = {
      all: 'Removes all sketches, shapes, points, tangent lines, derivatives, integrals, and intersections.',
      sketches: 'Removes freehand sketch strokes only.',
      shapes: 'Removes geometric shapes and text labels only.',
      points: 'Removes placed coordinate points only.',
      math: 'Removes tangent lines, derivative segments, integral regions, and intersections.'
    };

    /* Update hint text when dropdown changes */
    if (selectEl && hintEl) {
      selectEl.addEventListener('change', function () {
        hintEl.textContent = hints[selectEl.value] || '';
      });
    }

    btnClear.addEventListener('click', function () {
      /* Only show dialog if there's something to clear */
      if (!state.tangents.length && !state.points.length &&
          !state.derivSegments.length && !state.integralRegions.length &&
          !state.intersections.length && !state.strokes.length &&
          !state.shapes.length) return;
      /* Reset dropdown to "All" */
      if (selectEl) selectEl.value = 'all';
      if (hintEl) hintEl.textContent = hints.all;
      overlay.style.display = '';
    });

    function hideDialog() { overlay.style.display = 'none'; }

    if (btnNo) btnNo.addEventListener('click', hideDialog);

    if (btnYes) btnYes.addEventListener('click', function () {
      saveUndo();
      var cat = selectEl ? selectEl.value : 'all';

      if (cat === 'all' || cat === 'sketches') {
        state.strokes = [];
        state.activeStroke = null;
      }
      if (cat === 'all' || cat === 'shapes') {
        state.shapes = [];
        state.activeShape = null;
      }
      if (cat === 'all' || cat === 'points') {
        state.points = [];
      }
      if (cat === 'all' || cat === 'math') {
        state.tangents = [];
        state.intersections = [];
        state.derivSegments = [];
        state.integralRegions = [];
      }
      state.selectedAnnotation = -1;
      state.selectedAnnotationType = '';
      state.pendingClick = null;
      hideDialog();
      draw();
    });

    /* Close on overlay background click */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideDialog();
    });
  }

  wireClearAnalysis();

  /* ── Sketch Dropdown Wiring ──────────────────────────────── */

  function wireSketchDropdown() {
    var toggle = $('sketch-drop-toggle');
    var dropdown = $('sketch-dropdown');
    var sketchBtn = document.querySelector('[data-tool="sketch"]');
    if (!toggle || !dropdown) return;

    /* Toggle dropdown */
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.style.display === 'none';
      dropdown.style.display = open ? '' : 'none';
    });

    /* Color swatches */
    var swatches = dropdown.querySelectorAll('.swatch');
    for (var i = 0; i < swatches.length; i++) {
      (function(sw) {
        sw.addEventListener('click', function (e) {
          e.stopPropagation();
          state.sketchColor = sw.getAttribute('data-color');
          for (var j = 0; j < swatches.length; j++) swatches[j].classList.remove('active');
          sw.classList.add('active');
          /* Update color indicator on sketch button */
          if (sketchBtn) sketchBtn.style.setProperty('--sketch-color', state.sketchColor);
        });
      })(swatches[i]);
    }

    /* Width buttons */
    var widthBtns = dropdown.querySelectorAll('.width-btn');
    for (var w = 0; w < widthBtns.length; w++) {
      (function(wb) {
        wb.addEventListener('click', function (e) {
          e.stopPropagation();
          state.sketchWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
          for (var k = 0; k < widthBtns.length; k++) widthBtns[k].classList.remove('active');
          wb.classList.add('active');
        });
      })(widthBtns[w]);
    }

    /* Close dropdown on outside click */
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== toggle) {
        dropdown.style.display = 'none';
      }
    });
  }

  wireSketchDropdown();

  /* ── Shape Dropdown Wiring ───────────────────────────────── */

  function wireShapeDropdown() {
    var toggle = $('shape-drop-toggle');
    var dropdown = $('shape-dropdown');
    var shapeBtn = document.querySelector('[data-tool="shape"]');
    if (!toggle || !dropdown) return;

    /* Toggle dropdown */
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.style.display === 'none';
      dropdown.style.display = open ? '' : 'none';
      /* Close sketch dropdown */
      var sd = $('sketch-dropdown');
      if (sd) sd.style.display = 'none';
    });

    /* Shape icons map for dynamic button label */
    var shapeIcons = { arrow: '➜', line: '╱', rect: '▭', circle: '◯', ellipse: '⬭', dblarrow: '⟷', text: 'T' };
    var iconEl = $('shape-icon');

    /* Shape type picker */
    var picks = dropdown.querySelectorAll('.shape-pick');
    for (var p = 0; p < picks.length; p++) {
      (function(pk) {
        pk.addEventListener('click', function (e) {
          e.stopPropagation();
          state.shapeType = pk.getAttribute('data-shape');
          for (var q = 0; q < picks.length; q++) picks[q].classList.remove('active');
          pk.classList.add('active');
          /* Update button icon dynamically */
          if (iconEl) iconEl.textContent = shapeIcons[state.shapeType] || '▭';
          /* Auto-close dropdown and activate shape tool */
          dropdown.style.display = 'none';
          setTool('shape');
        });
      })(picks[p]);
    }

    /* Color swatches */
    var swatches = dropdown.querySelectorAll('.shape-colors .swatch');
    for (var i = 0; i < swatches.length; i++) {
      (function(sw) {
        sw.addEventListener('click', function (e) {
          e.stopPropagation();
          state.shapeColor = sw.getAttribute('data-color');
          for (var j = 0; j < swatches.length; j++) swatches[j].classList.remove('active');
          sw.classList.add('active');
          if (shapeBtn) shapeBtn.style.setProperty('--shape-color', state.shapeColor);
        });
      })(swatches[i]);
    }

    /* Width buttons */
    var widthBtns = dropdown.querySelectorAll('.shape-widths .width-btn');
    for (var w = 0; w < widthBtns.length; w++) {
      (function(wb) {
        wb.addEventListener('click', function (e) {
          e.stopPropagation();
          state.shapeWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
          for (var k = 0; k < widthBtns.length; k++) widthBtns[k].classList.remove('active');
          wb.classList.add('active');
        });
      })(widthBtns[w]);
    }

    /* Fill toggle */
    var fillBtns = dropdown.querySelectorAll('.fill-btn');
    for (var f = 0; f < fillBtns.length; f++) {
      (function(fb) {
        fb.addEventListener('click', function (e) {
          e.stopPropagation();
          state.shapeFilled = fb.getAttribute('data-fill') === 'true';
          for (var m = 0; m < fillBtns.length; m++) fillBtns[m].classList.remove('active');
          fb.classList.add('active');
        });
      })(fillBtns[f]);
    }

    /* Close dropdown on outside click */
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== toggle) {
        dropdown.style.display = 'none';
      }
    });
  }

  wireShapeDropdown();

  /* ── Annotation Toggle + Export Button ───────────────────── */

  var btnToggleAnnotations = $('btn-toggle-annotations');
  if (btnToggleAnnotations) {
    btnToggleAnnotations.addEventListener('click', function () {
      state.showAnnotations = !state.showAnnotations;
      btnToggleAnnotations.classList.toggle('active', state.showAnnotations);
      btnToggleAnnotations.textContent = state.showAnnotations ? '👁' : '🚫';
      btnToggleAnnotations.title = state.showAnnotations ? 'Hide Annotations' : 'Show Annotations';
      draw();
    });
  }

  var btnExportPng = $('btn-export-png');
  if (btnExportPng) {
    btnExportPng.addEventListener('click', function () {
      exportPNG();
    });
  }

  /* ── Fullscreen Mode ──────────────────────────────────────── */

  function wireFullscreen() {
    var btnFs = $('btn-fullscreen');
    var btnSb = $('btn-sidebar-toggle');
    var layout = $('graph-layout');
    var sidebar = $('expr-sidebar');
    if (!btnFs || !layout) return;

    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }

    function enterFullscreen() {
      var el = layout;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    }

    function exitFullscreen() {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    }

    function onFullscreenChange() {
      if (isFullscreen()) {
        layout.classList.add('is-fullscreen');
        btnFs.textContent = '✕';
        btnFs.title = 'Exit Fullscreen';
      } else {
        layout.classList.remove('is-fullscreen');
        btnFs.textContent = '⛶';
        btnFs.title = 'Fullscreen';
        /* Restore sidebar on exit */
        if (sidebar) {
          sidebar.classList.remove('collapsed');
          if (btnSb) { btnSb.textContent = '\u2039'; btnSb.classList.remove('sb-collapsed'); }
        }
      }
      /* Resize canvas after layout settles */
      requestAnimationFrame(function () {
        sizeCanvas();
        draw();
      });
    }

    btnFs.addEventListener('click', function () {
      if (isFullscreen()) exitFullscreen();
      else enterFullscreen();
    });

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);

    /* Sidebar toggle (only visible in fullscreen) */
    if (btnSb && sidebar) {
      btnSb.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        var isCollapsed = sidebar.classList.contains('collapsed');
        btnSb.textContent = isCollapsed ? '\u203A' : '\u2039';
        btnSb.classList.toggle('sb-collapsed', isCollapsed);
        /* Wait for CSS transition then resize */
        setTimeout(function () {
          sizeCanvas();
          draw();
        }, 280);
      });
    }
  }

  wireFullscreen();

  function wireSettings() {
    var btnOpen = $('btn-settings');
    var btnClose = $('settings-close');
    var btnApply = $('settings-apply');
    if (btnOpen) btnOpen.addEventListener('click', openSettings);
    if (btnClose) btnClose.addEventListener('click', closeSettings);
    if (btnApply) btnApply.addEventListener('click', applySettings);
  }

  /* ================================================================
     SHAREABLE URL — the graph (equations + sliders + view + annotations) is
     encoded into the link. makeSnapshot() → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    /* icon-only toolbar button → flash a single glyph, not a text label */
    function flashShare(glyph, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=glyph; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1600); }
    function shareLink(){
      try{
        var U=new TextEncoder().encode(JSON.stringify(makeSnapshot()));
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ flashShare('⚠',false); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(function(){ flashShare('✓',true); }, function(){ flashShare('↑'); });
          } else { flashShare('↑'); }
        }).catch(function(){ flashShare('✗',false); });
      }catch(e){ flashShare('✗',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var snap=JSON.parse(new TextDecoder().decode(U));
        if(!snap || !Array.isArray(snap.funcs)) return;   // shape mismatch → ignore
        restoreSnapshot(snap);                             // reuse the tool's own restore
      }).catch(function(){});                              // corrupt link → keep the seed graph
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // after init() above (rAF-free so it isn't throttled)
  })();

})();
