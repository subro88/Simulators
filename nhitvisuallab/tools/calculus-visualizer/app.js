(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     S1 ── Helpers & Utilities
     ═══════════════════════════════════════════════════════════ */

  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function isOk(v) { return typeof v === 'number' && isFinite(v); }

  function roundSig(v, sig) {
    if (v === 0) return 0;
    if (!isFinite(v)) return v;
    var m = Math.pow(10, sig - Math.ceil(Math.log10(Math.abs(v))));
    return Math.round(v * m) / m;
  }

  function formatNum(v) {
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs >= 1e6 || (abs < 1e-4 && abs > 0)) return v.toExponential(2);
    var r = roundSig(v, 6);
    var s = String(r);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  function formatAxisNum(v) {
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) return v.toExponential(1);
    var r = roundSig(v, 4);
    var s = String(r);
    if (s.indexOf('.') !== -1) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return s;
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  function escHtml(t) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(t));
    return d.innerHTML;
  }

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

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


  /* ═══════════════════════════════════════════════════════════
     S2 ── Constants & Colors
     ═══════════════════════════════════════════════════════════ */

  var BG_COLOR = '#0d1117';
  var GRID_MAJOR_COLOR = 'rgba(255,255,255,0.08)';
  var GRID_MINOR_COLOR = 'rgba(255,255,255,0.03)';
  var AXIS_COLOR = 'rgba(255,255,255,0.35)';
  var AXIS_NUM_COLOR = 'rgba(255,255,255,0.5)';

  var COLOR_FUNC    = '#18b4f5';     /* f(x) curve */
  var COLOR_DERIV   = '#ff6b6b';     /* f'(x) derivative */
  var COLOR_INTEG   = '#51cf66';     /* integral fill */
  var COLOR_TANGENT = '#ffd43b';     /* tangent line */
  var COLOR_RIEMANN = 'rgba(81,207,102,0.35)';

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

  var KNOWN_CONSTS = {
    pi:  Math.PI,
    e:   Math.E,
    inf: Infinity
  };


  /* ═══════════════════════════════════════════════════════════
     S3 ── Tokenizer
     ═══════════════════════════════════════════════════════════ */

  var TK_NUM    = 'NUM';
  var TK_ID     = 'ID';
  var TK_OP     = 'OP';
  var TK_LPAREN = 'LPAREN';
  var TK_RPAREN = 'RPAREN';
  var TK_COMMA  = 'COMMA';
  var TK_PIPE   = 'PIPE';

  var tokenizeError = '';

  function tokenize(expr) {
    tokenizeError = '';
    /* Normalize common Unicode math characters to ASCII equivalents */
    expr = expr
      .replace(/π/g, 'pi')     /* π */
      .replace(/−/g, '-')      /* − minus sign */
      .replace(/×/g, '*')      /* × */
      .replace(/÷/g, '/')      /* ÷ */
      .replace(/√/g, 'sqrt')   /* √ */
      .replace(/²/g, '^2')     /* ² */
      .replace(/³/g, '^3');    /* ³ */
    var tokens = [];
    var i = 0;
    var len = expr.length;
    var numRe = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
    var idRe  = /^[a-zA-Z_]\w*/;

    while (i < len) {
      if (expr[i] === ' ' || expr[i] === '\t') { i++; continue; }
      var ch = expr[i];
      var pos = i;

      var numMatch = expr.slice(i).match(numRe);
      if (numMatch) {
        tokens.push({ type: TK_NUM, value: parseFloat(numMatch[0]), pos: pos });
        i += numMatch[0].length;
        continue;
      }

      var idMatch = expr.slice(i).match(idRe);
      if (idMatch) {
        tokens.push({ type: TK_ID, value: idMatch[0], pos: pos });
        i += idMatch[0].length;
        continue;
      }

      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
        tokens.push({ type: TK_OP, value: ch, pos: pos });
        i++; continue;
      }
      if (ch === '!') { tokens.push({ type: TK_OP, value: '!', pos: pos }); i++; continue; }
      if (ch === '(') { tokens.push({ type: TK_LPAREN, value: '(', pos: pos }); i++; continue; }
      if (ch === ')') { tokens.push({ type: TK_RPAREN, value: ')', pos: pos }); i++; continue; }
      if (ch === ',') { tokens.push({ type: TK_COMMA, value: ',', pos: pos }); i++; continue; }
      if (ch === '|') { tokens.push({ type: TK_PIPE, value: '|', pos: pos }); i++; continue; }

      tokenizeError = 'Unexpected character "' + ch + '" at position ' + (pos + 1);
      return null;
    }

    /* Insert implicit multiplication */
    var out = [];
    for (var j = 0; j < tokens.length; j++) {
      var cur = tokens[j];
      if (j > 0) {
        var prev = tokens[j - 1];
        var needMul = false;
        if (prev.type === TK_NUM && cur.type === TK_ID) needMul = true;
        if (prev.type === TK_NUM && cur.type === TK_LPAREN) needMul = true;
        if (prev.type === TK_NUM && cur.type === TK_PIPE) needMul = true;
        if (prev.type === TK_RPAREN && cur.type === TK_LPAREN) needMul = true;
        if (prev.type === TK_RPAREN && cur.type === TK_ID) needMul = true;
        if (prev.type === TK_RPAREN && cur.type === TK_NUM) needMul = true;
        if (prev.type === TK_RPAREN && cur.type === TK_PIPE) needMul = true;
        if (prev.type === TK_ID && cur.type === TK_LPAREN) {
          if (!KNOWN_FUNCS[prev.value.toLowerCase()]) needMul = true;
        }
        if (prev.type === TK_ID && cur.type === TK_NUM) needMul = true;
        if (prev.type === TK_ID && cur.type === TK_ID) needMul = true;
        if (needMul) out.push({ type: TK_OP, value: '*', pos: cur.pos });
      }
      out.push(cur);
    }
    return out;
  }


  /* ═══════════════════════════════════════════════════════════
     S4 ── Parser / AST Builder
     ═══════════════════════════════════════════════════════════ */

  var parseError = '';

  function parse(expr) {
    parseError = '';
    if (!expr || !expr.trim()) { parseError = 'Empty expression'; return null; }

    var tokens = tokenize(expr);
    if (!tokens) { parseError = tokenizeError || 'Tokenization failed'; return null; }

    var pos = 0;
    function peek() { return pos < tokens.length ? tokens[pos] : null; }
    function next() { return tokens[pos++]; }
    function match(type, value) {
      var t = peek();
      if (!t || t.type !== type) return false;
      if (value !== undefined && t.value !== value) return false;
      return true;
    }
    function expect(type, value) {
      if (match(type, value)) return next();
      var t = peek();
      parseError = 'Expected ' + type + (value ? ' "' + value + '"' : '') +
        ' but got ' + (t ? t.type + ' "' + t.value + '"' : 'end of expression');
      return null;
    }

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

    function parseUnary() {
      if (match(TK_OP, '-')) {
        next();
        var arg = parseUnary();
        if (!arg) return null;
        if (arg.type === 'num') { arg.value = -arg.value; return arg; }
        return { type: 'unary', op: '-', arg: arg };
      }
      if (match(TK_OP, '+')) { next(); return parseUnary(); }
      return parsePower();
    }

    function parsePower() {
      var base = parsePostfix();
      if (!base) return null;
      if (match(TK_OP, '^')) {
        next();
        var exp = parseUnary();
        if (!exp) return null;
        return { type: 'binop', op: '^', left: base, right: exp };
      }
      return base;
    }

    function parsePostfix() {
      var node = parseAtom();
      if (!node) return null;
      while (match(TK_OP, '!')) {
        next();
        node = { type: 'call', name: 'factorial', args: [node] };
      }
      return node;
    }

    function parseAtom() {
      var t = peek();
      if (!t) { parseError = 'Unexpected end of expression'; return null; }

      if (t.type === TK_NUM) { next(); return { type: 'num', value: t.value }; }

      if (t.type === TK_ID) {
        var name = t.value;
        var lower = name.toLowerCase();
        next();
        if (KNOWN_CONSTS[lower] !== undefined) return { type: 'num', value: KNOWN_CONSTS[lower] };
        if (lower === 'x') return { type: 'var' };
        if (match(TK_LPAREN)) {
          next();
          var args = [];
          if (!match(TK_RPAREN)) {
            var firstArg = parseAddSub();
            if (!firstArg) return null;
            args.push(firstArg);
            while (match(TK_COMMA)) {
              next();
              var a = parseAddSub();
              if (!a) return null;
              args.push(a);
            }
          }
          if (!expect(TK_RPAREN)) return null;
          return { type: 'call', name: lower, args: args };
        }
        /* Unknown identifier → user-defined parameter (e.g. a, k, A) */
        return { type: 'param', name: name };
      }

      if (t.type === TK_LPAREN) {
        next();
        var inner = parseAddSub();
        if (!inner) return null;
        if (!expect(TK_RPAREN)) return null;
        return inner;
      }

      if (t.type === TK_PIPE) {
        next();
        var absArg = parseAddSub();
        if (!absArg) return null;
        if (!expect(TK_PIPE)) return null;
        return { type: 'call', name: 'abs', args: [absArg] };
      }

      parseError = 'Unexpected token: "' + t.value + '"';
      return null;
    }

    var ast = parseAddSub();
    if (!ast) { if (!parseError) parseError = 'Parse error'; return null; }
    if (pos < tokens.length) {
      parseError = 'Unexpected token after expression: "' + tokens[pos].value + '"';
      return null;
    }
    return ast;
  }


  /* ═══════════════════════════════════════════════════════════
     S5 ── Evaluator
     ═══════════════════════════════════════════════════════════ */

  function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n > 170) return Infinity;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  function evaluate(node, x) {
    try { return evalNode(node, x); }
    catch (e) { return NaN; }
  }

  function evalNode(node, x) {
    if (!node) return NaN;
    switch (node.type) {
      case 'num': return node.value;
      case 'var': return x;
      case 'param': return (state.params[node.name] !== undefined) ? +state.params[node.name] : 1;
      case 'unary': return -evalNode(node.arg, x);
      case 'binop': {
        var l = evalNode(node.left, x);
        var r = evalNode(node.right, x);
        switch (node.op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return l / r;
          case '^': return Math.pow(l, r);
          default:  return NaN;
        }
      }
      case 'call': {
        var args = [];
        for (var i = 0; i < node.args.length; i++) {
          args.push(evalNode(node.args[i], x));
        }
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


  /* ═══════════════════════════════════════════════════════════
     S6 ── Numerical Methods
     ═══════════════════════════════════════════════════════════ */

  function numericalDeriv(ast, x) {
    var h = 1e-7;
    var yP = evaluate(ast, x + h);
    var yM = evaluate(ast, x - h);
    if (!isOk(yP) || !isOk(yM)) return NaN;
    return (yP - yM) / (2 * h);
  }

  function numericalDeriv2(ast, x) {
    var h = 1e-5;
    var yP = evaluate(ast, x + h);
    var yM = evaluate(ast, x - h);
    var y0 = evaluate(ast, x);
    if (!isOk(yP) || !isOk(yM) || !isOk(y0)) return NaN;
    return (yP - 2 * y0 + yM) / (h * h);
  }

  function computeIntegral(ast, xFrom, xTo) {
    var n = 1000;
    var h = (xTo - xFrom) / n;
    if (h === 0) return 0;
    var sum = evaluate(ast, xFrom) + evaluate(ast, xTo);
    if (!isOk(sum)) return NaN;
    for (var i = 1; i < n; i++) {
      var x = xFrom + i * h;
      var y = evaluate(ast, x);
      if (!isOk(y)) return NaN;
      sum += (i % 2 === 0) ? 2 * y : 4 * y;
    }
    return (h / 3) * sum;
  }

  /** Pre-compute arrays of derivative or integral values for animation */
  function precomputeDerivPoints(ast, xMin, xMax, count) {
    var pts = [];
    var dx = (xMax - xMin) / (count - 1);
    for (var i = 0; i < count; i++) {
      var x = xMin + i * dx;
      var d = numericalDeriv(ast, x);
      pts.push({ x: x, y: d });
    }
    return pts;
  }

  function precomputeIntegralPoints(ast, xMin, xMax, count) {
    var raw = [];
    var dx = (xMax - xMin) / (count - 1);
    for (var i = 0; i < count; i++) {
      var x = xMin + i * dx;
      var area = computeIntegral(ast, xMin, x);
      raw.push({ x: x, y: area });
    }
    /* Normalize: shift so F(0) = 0 when origin is in view range.
       This gives the accumulation function F(x) = ∫₀ˣ f(t) dt with F(0) = 0
       (e.g. for f = sin, F(x) = 1 - cos(x), which is 0 at x = 0) */
    var pts = [];
    var offset = 0;
    var zeroIdx = Math.round((0 - xMin) / (xMax - xMin) * (count - 1));
    zeroIdx = clamp(zeroIdx, 0, count - 1);
    if (isOk(raw[zeroIdx].y)) offset = raw[zeroIdx].y;
    for (var j = 0; j < count; j++) {
      pts.push({ x: raw[j].x, y: isOk(raw[j].y) ? raw[j].y - offset : NaN });
    }
    return pts;
  }


  /* ═══════════════════════════════════════════════════════════
     S7 ── Symbolic Differentiation
     ═══════════════════════════════════════════════════════════ */

  /**
   * Recursively differentiate an AST with respect to x.
   * Returns { ast: node, rule: string }.
   */
  function symbolicDiff(node) {
    if (!node) return { ast: { type: 'num', value: 0 }, rule: '' };

    switch (node.type) {
      case 'num':
        return { ast: { type: 'num', value: 0 }, rule: 'constant rule' };

      case 'var':
        return { ast: { type: 'num', value: 1 }, rule: 'basic derivative' };

      case 'unary':
        if (node.op === '-') {
          var inner = symbolicDiff(node.arg);
          return { ast: { type: 'unary', op: '-', arg: inner.ast }, rule: inner.rule };
        }
        return { ast: { type: 'num', value: 0 }, rule: '' };

      case 'binop':
        return diffBinop(node);

      case 'call':
        return diffCall(node);

      default:
        return { ast: { type: 'num', value: 0 }, rule: '' };
    }
  }

  function diffBinop(node) {
    var op = node.op;

    if (op === '+' || op === '-') {
      var dL = symbolicDiff(node.left);
      var dR = symbolicDiff(node.right);
      return {
        ast: { type: 'binop', op: op, left: dL.ast, right: dR.ast },
        rule: 'sum/difference rule'
      };
    }

    if (op === '*') {
      /* Product rule: d(uv) = u'v + uv' */
      var du = symbolicDiff(node.left);
      var dv = symbolicDiff(node.right);
      return {
        ast: {
          type: 'binop', op: '+',
          left:  { type: 'binop', op: '*', left: du.ast, right: deepCopy(node.right) },
          right: { type: 'binop', op: '*', left: deepCopy(node.left), right: dv.ast }
        },
        rule: 'product rule'
      };
    }

    if (op === '/') {
      /* Quotient rule: d(u/v) = (u'v - uv') / v^2 */
      var du2 = symbolicDiff(node.left);
      var dv2 = symbolicDiff(node.right);
      return {
        ast: {
          type: 'binop', op: '/',
          left: {
            type: 'binop', op: '-',
            left:  { type: 'binop', op: '*', left: du2.ast, right: deepCopy(node.right) },
            right: { type: 'binop', op: '*', left: deepCopy(node.left), right: dv2.ast }
          },
          right: { type: 'binop', op: '^', left: deepCopy(node.right), right: { type: 'num', value: 2 } }
        },
        rule: 'quotient rule'
      };
    }

    if (op === '^') {
      /* Check if exponent is constant (no x) */
      if (!containsVar(node.right)) {
        /* Power rule: d(u^n) = n * u^(n-1) * u' */
        var du3 = symbolicDiff(node.left);
        return {
          ast: {
            type: 'binop', op: '*',
            left: {
              type: 'binop', op: '*',
              left: deepCopy(node.right),
              right: { type: 'binop', op: '^', left: deepCopy(node.left),
                       right: { type: 'binop', op: '-', left: deepCopy(node.right), right: { type: 'num', value: 1 } } }
            },
            right: du3.ast
          },
          rule: 'power rule' + (du3.rule === 'basic derivative' ? '' : ' + chain rule')
        };
      }
      /* Check if base is constant (no x) — e.g. a^x → a^x * ln(a) * x' */
      if (!containsVar(node.left)) {
        var dExp = symbolicDiff(node.right);
        return {
          ast: {
            type: 'binop', op: '*',
            left: {
              type: 'binop', op: '*',
              left: deepCopy(node),
              right: { type: 'call', name: 'ln', args: [deepCopy(node.left)] }
            },
            right: dExp.ast
          },
          rule: 'exponential rule'
        };
      }
      /* General case: f(x)^g(x) — logarithmic differentiation:
         d/dx[f^g] = f^g * ( g'*ln(f) + g*f'/f ) */
      var dF = symbolicDiff(node.left);
      var dG = symbolicDiff(node.right);
      return {
        ast: {
          type: 'binop', op: '*',
          left: deepCopy(node),
          right: {
            type: 'binop', op: '+',
            left: {
              type: 'binop', op: '*',
              left: dG.ast,
              right: { type: 'call', name: 'ln', args: [deepCopy(node.left)] }
            },
            right: {
              type: 'binop', op: '*',
              left: deepCopy(node.right),
              right: { type: 'binop', op: '/', left: dF.ast, right: deepCopy(node.left) }
            }
          }
        },
        rule: 'logarithmic differentiation (general power rule)'
      };
    }

    return { ast: { type: 'num', value: 0 }, rule: '' };
  }

  function diffCall(node) {
    var name = node.name;
    var arg = node.args[0];
    var du = symbolicDiff(arg);
    var isChain = du.rule !== 'basic derivative' && du.rule !== 'constant rule';
    var ruleTag = isChain ? ' + chain rule' : '';

    switch (name) {
      case 'sin':
        return {
          ast: mulNodes({ type: 'call', name: 'cos', args: [deepCopy(arg)] }, du.ast),
          rule: 'sin derivative' + ruleTag
        };
      case 'cos':
        return {
          ast: mulNodes({ type: 'unary', op: '-', arg: { type: 'call', name: 'sin', args: [deepCopy(arg)] } }, du.ast),
          rule: 'cos derivative' + ruleTag
        };
      case 'tan':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '^', left: { type: 'call', name: 'cos', args: [deepCopy(arg)] }, right: { type: 'num', value: 2 } } },
            du.ast),
          rule: 'tan derivative' + ruleTag
        };
      case 'ln':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 }, right: deepCopy(arg) },
            du.ast),
          rule: 'ln derivative' + ruleTag
        };
      case 'log':
      case 'log10':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '*', left: deepCopy(arg), right: { type: 'call', name: 'ln', args: [{ type: 'num', value: 10 }] } } },
            du.ast),
          rule: 'log10 derivative' + ruleTag
        };
      case 'exp':
        return {
          ast: mulNodes(deepCopy(node), du.ast),
          rule: 'exp derivative' + ruleTag
        };
      case 'sqrt':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '*', left: { type: 'num', value: 2 }, right: deepCopy(node) } },
            du.ast),
          rule: 'sqrt derivative' + ruleTag
        };
      case 'abs':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: deepCopy(arg), right: { type: 'call', name: 'abs', args: [deepCopy(arg)] } },
            du.ast),
          rule: 'abs derivative' + ruleTag
        };
      case 'asin':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'call', name: 'sqrt', args: [
                { type: 'binop', op: '-', left: { type: 'num', value: 1 },
                  right: { type: 'binop', op: '^', left: deepCopy(arg), right: { type: 'num', value: 2 } } }
              ]}},
            du.ast),
          rule: 'arcsin derivative' + ruleTag
        };
      case 'acos':
        return {
          ast: mulNodes(
            { type: 'unary', op: '-', arg:
              { type: 'binop', op: '/', left: { type: 'num', value: 1 },
                right: { type: 'call', name: 'sqrt', args: [
                  { type: 'binop', op: '-', left: { type: 'num', value: 1 },
                    right: { type: 'binop', op: '^', left: deepCopy(arg), right: { type: 'num', value: 2 } } }
                ]}}
            },
            du.ast),
          rule: 'arccos derivative' + ruleTag
        };
      case 'atan':
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '+', left: { type: 'num', value: 1 },
                       right: { type: 'binop', op: '^', left: deepCopy(arg), right: { type: 'num', value: 2 } } } },
            du.ast),
          rule: 'arctan derivative' + ruleTag
        };
      case 'sinh':
        return {
          ast: mulNodes({ type: 'call', name: 'cosh', args: [deepCopy(arg)] }, du.ast),
          rule: 'sinh derivative' + ruleTag
        };
      case 'cosh':
        return {
          ast: mulNodes({ type: 'call', name: 'sinh', args: [deepCopy(arg)] }, du.ast),
          rule: 'cosh derivative' + ruleTag
        };
      case 'tanh':
        return {
          ast: mulNodes(
            { type: 'binop', op: '-', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '^', left: { type: 'call', name: 'tanh', args: [deepCopy(arg)] }, right: { type: 'num', value: 2 } } },
            du.ast),
          rule: 'tanh derivative' + ruleTag
        };
      case 'cbrt':
        /* d/dx[∛u] = 1/(3 * cbrt(u²)) * u' */
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '*', left: { type: 'num', value: 3 },
                right: { type: 'call', name: 'cbrt', args: [
                  { type: 'binop', op: '^', left: deepCopy(arg), right: { type: 'num', value: 2 } }
                ]}}},
            du.ast),
          rule: 'cbrt derivative' + ruleTag
        };
      case 'log2':
        /* d/dx[log₂(u)] = 1/(u * ln(2)) * u' */
        return {
          ast: mulNodes(
            { type: 'binop', op: '/', left: { type: 'num', value: 1 },
              right: { type: 'binop', op: '*', left: deepCopy(arg), right: { type: 'call', name: 'ln', args: [{ type: 'num', value: 2 }] } } },
            du.ast),
          rule: 'log2 derivative' + ruleTag
        };
      default:
        return { ast: { type: 'num', value: NaN }, rule: 'unknown function' };
    }
  }

  /** Helper: multiply two AST nodes, with shortcut for 1*x */
  function mulNodes(a, b) {
    if (b.type === 'num' && b.value === 1) return a;
    if (a.type === 'num' && a.value === 1) return b;
    return { type: 'binop', op: '*', left: a, right: b };
  }

  /** Check if an AST node contains the variable x */
  function containsVar(node) {
    if (!node) return false;
    if (node.type === 'var') return true;
    if (node.type === 'binop') return containsVar(node.left) || containsVar(node.right);
    if (node.type === 'unary') return containsVar(node.arg);
    if (node.type === 'call') {
      for (var i = 0; i < node.args.length; i++) {
        if (containsVar(node.args[i])) return true;
      }
    }
    return false;
  }

  /** Deep copy an AST node */
  function deepCopy(node) {
    return JSON.parse(JSON.stringify(node));
  }


  /* ═══════════════════════════════════════════════════════════
     S8 ── AST Simplification
     ═══════════════════════════════════════════════════════════ */

  function simplify(node) {
    if (!node) return node;

    if (node.type === 'unary') {
      var sa = simplify(node.arg);
      if (sa.type === 'num') return { type: 'num', value: -sa.value };
      /* --x → x */
      if (sa.type === 'unary' && sa.op === '-') return sa.arg;
      return { type: 'unary', op: '-', arg: sa };
    }

    if (node.type === 'call') {
      var sargs = [];
      for (var i = 0; i < node.args.length; i++) sargs.push(simplify(node.args[i]));
      return { type: 'call', name: node.name, args: sargs };
    }

    if (node.type !== 'binop') return node;

    var left  = simplify(node.left);
    var right = simplify(node.right);
    var op = node.op;

    /* Constant folding */
    if (left.type === 'num' && right.type === 'num') {
      var val;
      switch (op) {
        case '+': val = left.value + right.value; break;
        case '-': val = left.value - right.value; break;
        case '*': val = left.value * right.value; break;
        case '/': val = right.value !== 0 ? left.value / right.value : NaN; break;
        case '^': val = Math.pow(left.value, right.value); break;
        default: val = NaN;
      }
      if (isOk(val)) return { type: 'num', value: val };
    }

    /* Additive identity: x + 0, 0 + x */
    if (op === '+') {
      if (left.type === 'num' && left.value === 0) return right;
      if (right.type === 'num' && right.value === 0) return left;
    }

    /* Subtractive identity: x - 0 */
    if (op === '-') {
      if (right.type === 'num' && right.value === 0) return left;
      /* x - x → 0 */
      if (astEqual(left, right)) return { type: 'num', value: 0 };
    }

    /* Multiplicative identities */
    if (op === '*') {
      if (left.type === 'num' && left.value === 0) return { type: 'num', value: 0 };
      if (right.type === 'num' && right.value === 0) return { type: 'num', value: 0 };
      if (left.type === 'num' && left.value === 1) return right;
      if (right.type === 'num' && right.value === 1) return left;
      if (left.type === 'num' && left.value === -1) return { type: 'unary', op: '-', arg: right };
      if (right.type === 'num' && right.value === -1) return { type: 'unary', op: '-', arg: left };
    }

    /* Division identities */
    if (op === '/') {
      if (left.type === 'num' && left.value === 0) return { type: 'num', value: 0 };
      if (right.type === 'num' && right.value === 1) return left;
    }

    /* Power identities */
    if (op === '^') {
      if (right.type === 'num' && right.value === 0) return { type: 'num', value: 1 };
      if (right.type === 'num' && right.value === 1) return left;
    }

    return { type: 'binop', op: op, left: left, right: right };
  }

  /** Check structural equality of two AST nodes */
  function astEqual(a, b) {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'num') return a.value === b.value;
    if (a.type === 'var') return true;
    if (a.type === 'param') return a.name === b.name;
    if (a.type === 'unary') return a.op === b.op && astEqual(a.arg, b.arg);
    if (a.type === 'binop') return a.op === b.op && astEqual(a.left, b.left) && astEqual(a.right, b.right);
    if (a.type === 'call') {
      if (a.name !== b.name || a.args.length !== b.args.length) return false;
      for (var i = 0; i < a.args.length; i++) {
        if (!astEqual(a.args[i], b.args[i])) return false;
      }
      return true;
    }
    return false;
  }


  /* ═══════════════════════════════════════════════════════════
     S9 ── AST to String
     ═══════════════════════════════════════════════════════════ */

  function astToString(node) {
    if (!node) return '?';
    switch (node.type) {
      case 'num': {
        var v = node.value;
        if (v === Math.PI) return 'pi';
        if (v === Math.E) return 'e';
        if (!isFinite(v)) return String(v);
        /* Show nice integer or short decimal */
        if (v === Math.floor(v) && Math.abs(v) < 1e10) return String(v);
        return formatNum(v);
      }
      case 'var': return 'x';
      case 'unary':
        return '-' + wrapIf(node.arg, needsParens(node.arg, 'unary'));
      case 'binop': {
        var lStr = wrapIf(node.left, needsParensLeft(node));
        var rStr = wrapIf(node.right, needsParensRight(node));
        if (node.op === '^') return lStr + '^' + rStr;
        return lStr + ' ' + node.op + ' ' + rStr;
      }
      case 'call':
        return node.name + '(' + node.args.map(astToString).join(', ') + ')';
      default: return '?';
    }
  }

  function wrapIf(node, wrap) {
    var s = astToString(node);
    return wrap ? '(' + s + ')' : s;
  }

  /* ── AST → LaTeX ── */
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
      case 'var': return 'x';
      case 'param': return node.name;
      case 'unary': return '-' + latexWrapNode(node.arg, needsParens(node.arg, 'unary'));
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
             parenthesised inside a product, e.g. x^x (ln(x) + 1). */
          var lAdd = node.left.type === 'binop' && (node.left.op === '+' || node.left.op === '-');
          var rAdd = (node.right.type === 'binop' && (node.right.op === '+' || node.right.op === '-')) ||
                     node.right.type === 'unary';
          var lL = lAdd ? '\\left(' + astToLatex(node.left) + '\\right)' : astToLatex(node.left);
          var rL = rAdd ? '\\left(' + astToLatex(node.right) + '\\right)' : astToLatex(node.right);
          /* Juxtapose: number × variable/function, or two functions */
          var lIsNum  = node.left.type === 'num';
          var rIsExpr = node.right.type === 'var' || node.right.type === 'call' || node.right.type === 'binop';
          if (lIsNum && rIsExpr) return lL + ' ' + rL;
          if (node.left.type === 'var' && node.right.type === 'call') return lL + ' ' + rL;
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
        if (node.name === 'abs')  return '\\left|' + astToLatex(arg0) + '\\right|';
        var fnMap = { sin: '\\sin', cos: '\\cos', tan: '\\tan', ln: '\\ln' };
        var fn = fnMap[node.name] || node.name;
        var argsLatex = node.args.map(astToLatex).join(', ');
        return fn + '\\!\\left(' + argsLatex + '\\right)';
      }
      default: return '?';
    }
  }

  function latexWrapNode(node, wrap) {
    var s = astToLatex(node);
    return wrap ? '\\left(' + s + '\\right)' : s;
  }

  /** Render a LaTeX string to HTML via KaTeX, fall back to escaped text */
  function renderMath(latex, display) {
    if (typeof katex !== 'undefined') {
      try {
        return katex.renderToString(latex, { throwOnError: false, displayMode: !!display });
      } catch (e) { /* fall through */ }
    }
    return escHtml(latex);
  }

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

  function needsParens(node, context) {
    if (node.type === 'binop') return true;
    return false;
  }


  /* ═══════════════════════════════════════════════════════════
     S10 ── Presets
     ═══════════════════════════════════════════════════════════ */

  var PRESETS = [
    { name: 'x^2',       latex: 'x^2',                       expr: 'x^2',         derivative: '2x',              integral: 'x^3/3',           view: { xMin: -5, xMax: 5, yMin: -2, yMax: 10 },    rule: 'power rule' },
    { name: 'x^3',       latex: 'x^3',                       expr: 'x^3',         derivative: '3x^2',            integral: 'x^4/4',           view: { xMin: -3, xMax: 3, yMin: -10, yMax: 10 },   rule: 'power rule' },
    { name: 'sin(x)',    latex: '\\sin(x)',                   expr: 'sin(x)',      derivative: 'cos(x)',           integral: '-cos(x)',          view: { xMin: -7, xMax: 7, yMin: -2, yMax: 2 },     rule: 'sin derivative' },
    { name: 'cos(x)',    latex: '\\cos(x)',                   expr: 'cos(x)',      derivative: '-sin(x)',          integral: 'sin(x)',           view: { xMin: -7, xMax: 7, yMin: -2, yMax: 2 },     rule: 'cos derivative' },
    { name: 'e^x',       latex: 'e^x',                       expr: 'exp(x)',      derivative: 'e^x',              integral: 'e^x',              view: { xMin: -4, xMax: 4, yMin: -2, yMax: 20 },    rule: 'exp derivative' },
    { name: 'ln(x)',     latex: '\\ln(x)',                    expr: 'ln(x)',       derivative: '1/x',              integral: 'x\\ln(x) - x',    view: { xMin: -1, xMax: 10, yMin: -4, yMax: 4 },    rule: 'ln derivative' },
    { name: '1/x',       latex: '\\dfrac{1}{x}',             expr: '1/x',         derivative: '-1/x^2',           integral: 'ln|x|',            view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },     rule: 'power rule' },
    { name: 'sqrt(x)',   latex: '\\sqrt{x}',                  expr: 'sqrt(x)',     derivative: '1/(2*sqrt(x))',    integral: '(2/3)*x^(3/2)',    view: { xMin: -1, xMax: 10, yMin: -1, yMax: 5 },    rule: 'sqrt derivative' },
    { name: 'x*sin(x)',  latex: 'x\\sin(x)',                  expr: 'x*sin(x)',    derivative: 'sin(x)+x*cos(x)', integral: 'sin(x)-x*cos(x)', view: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }, rule: 'product rule' },
    { name: 'sin(x^2)',  latex: '\\sin(x^2)',                  expr: 'sin(x^2)',    derivative: '2x*cos(x^2)',      integral: 'numerical',        view: { xMin: -4, xMax: 4, yMin: -1.5, yMax: 1.5 },rule: 'chain rule' },
    { name: 'x^2*e^x',  latex: 'x^2 e^x',                   expr: 'x^2*exp(x)',  derivative: 'e^x(x^2+2x)',      integral: 'numerical',        view: { xMin: -6, xMax: 3, yMin: -3, yMax: 15 },   rule: 'product rule' },
    { name: 'tan(x)',    latex: '\\tan(x)',                   expr: 'tan(x)',      derivative: 'sec^2(x)',          integral: '-\\ln|\\cos(x)|',  view: { xMin: -4, xMax: 4, yMin: -6, yMax: 6 },    rule: 'tan derivative' },
    { name: '|x|',       latex: '|x|',                       expr: 'abs(x)',      derivative: 'x/|x|',            integral: 'x|x|/2',           view: { xMin: -5, xMax: 5, yMin: -1, yMax: 5 },    rule: 'abs derivative' },
    { name: 'x/(1+x^2)',latex: '\\dfrac{x}{1+x^2}',          expr: 'x/(1+x^2)',   derivative: '(1-x^2)/(1+x^2)^2', integral: 'numerical',      view: { xMin: -6, xMax: 6, yMin: -1, yMax: 1 },    rule: 'quotient rule' },
    { name: 'Gaussian',  latex: 'e^{-x^2}',                  expr: 'exp(-x^2)',   derivative: '-2x\\,e^{-x^2}',  integral: 'numerical',        view: { xMin: -4, xMax: 4, yMin: -0.5, yMax: 1.2 },rule: 'chain rule' }
  ];


  /* ═══════════════════════════════════════════════════════════
     S11 ── Application State
     ═══════════════════════════════════════════════════════════ */

  var state = {
    mode: 'simulate',
    view: { xMin: -10, xMax: 10, yMin: -7, yMax: 7 },
    expr: 'x^2',
    ast: null,

    /* Split panel */
    split: false,
    splitRatio: 0.55,
    lowerView: { yMin: -5, yMax: 5 },

    /* Animation */
    animState: 'idle',  /* idle | animating | result */
    animType: null,     /* 'diff' | 'int' */
    animT: 0,           /* 0..1 progress */
    animSpeed: 1,
    animRAF: null,
    animStartTime: 0,

    /* Pre-computed points */
    derivPts: [],
    integPts: [],

    /* Riemann rectangles state */
    riemannN: 8,
    riemannPhase: 0, /* 0=coarse, 1=mid, 2=fine, 3=smooth */

    /* Symbolic result */
    symbResult: null,
    symbRule: '',

    /* Pan state */
    panning: false,
    panStart: { x: 0, y: 0 },
    panViewStart: null,
    panWhich: 'upper', /* which panel is being panned */

    /* Active preset */
    activePreset: -1,

    /* ── Annotation state ── */
    tool: 'move',
    strokes: [],
    activeStroke: null,
    sketchColor: '#ffffff',
    sketchWidth: 2,
    shapes: [],
    activeShape: null,
    shapeType: 'rect',
    shapeColor: '#ffffff',
    shapeWidth: 2,
    shapeFilled: false,
    selectedAnnotation: -1,
    selectedAnnotationType: '',
    dragAnnotation: null,
    showAnnotations: true,
    cursorPos: null,

    /* Graph points (placed via Point tool) */
    points: [],

    /* Interactive calculus tools */
    tangents: [],          /* [{x0, slope, yInt, color}] */
    derivSegments: [],     /* [{xFrom, xTo, color}] */
    integralRegions: [],   /* [{xFrom, xTo, color, value}] */
    pendingClick: null,    /* {tool, wx} for 2-click tools */
    hoverPoint: null,      /* {wx, wy} or null */

    /* Highlight (analysis chip → canvas) */
    highlight: null,  /* {wx, wy, color, type, panel, animStart} */

    /* Undo / redo */
    undoStack: [],
    redoStack: [],

    /* User-defined parameters (a, k, A, etc.) */
    params: {},

    /* Definite integral limits (null = use view xMin/xMax) */
    integA: null,
    integB: null
  };


  /* ═══════════════════════════════════════════════════════════
     S12 ── Canvas Setup & Coordinate Transforms
     ═══════════════════════════════════════════════════════════ */

  var canvas, ctx;
  var W = 800, H = 520;
  var dpr = window.devicePixelRatio || 1;

  function sizeCanvas() {
    var wrap = $('canvas-wrap');
    if (!wrap) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = wrap.clientWidth;
    if (cw < 100) cw = 800;
    W = cw;
    H = Math.round(cw * 0.5); /* 2:1 aspect ratio — 75% of 3:2 height */
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
  }

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

  /** Get the canvas area for the upper panel (or full if not split) */
  function upperRect() {
    if (!state.split) return { x: 0, y: 0, w: W, h: H };
    var h = Math.round(H * state.splitRatio);
    return { x: 0, y: 0, w: W, h: h };
  }

  /** Get the canvas area for the lower panel */
  function lowerRect() {
    var h = Math.round(H * state.splitRatio);
    return { x: 0, y: h, w: W, h: H - h };
  }

  /* Coordinate transforms for upper panel */
  function toSX(wx, rect, view) {
    return rect.x + (wx - view.xMin) / (view.xMax - view.xMin) * rect.w;
  }
  function toSY(wy, rect, view) {
    return rect.y + rect.h - (wy - view.yMin) / (view.yMax - view.yMin) * rect.h;
  }
  function toWX(sx, rect, view) {
    return view.xMin + (sx - rect.x) / rect.w * (view.xMax - view.xMin);
  }
  function toWY(sy, rect, view) {
    return view.yMax - (sy - rect.y) / rect.h * (view.yMax - view.yMin);
  }


  /* ═══════════════════════════════════════════════════════════
     S12a ── Canvas Coordinate Helpers
     ═══════════════════════════════════════════════════════════ */

  function canvasCoords(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function touchCoords(touch) {
    var rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  /** Shorthand world-to-screen using the upper panel */
  function toSXu(wx) {
    var r = upperRect(), v = state.view;
    return r.x + (wx - v.xMin) / (v.xMax - v.xMin) * r.w;
  }
  function toSYu(wy) {
    var r = upperRect(), v = state.view;
    return r.y + r.h - (wy - v.yMin) / (v.yMax - v.yMin) * r.h;
  }
  function toWXu(sx) {
    var r = upperRect(), v = state.view;
    return v.xMin + (sx - r.x) / r.w * (v.xMax - v.xMin);
  }
  function toWYu(sy) {
    var r = upperRect(), v = state.view;
    return v.yMax - (sy - r.y) / r.h * (v.yMax - v.yMin);
  }

  /** Lower panel coordinate transforms */
  function toSXl(wx) {
    var r = lowerRect(), v = state.view;
    return r.x + (wx - v.xMin) / (v.xMax - v.xMin) * r.w;
  }
  function toSYl(wy) {
    var r = lowerRect(), lv = state.lowerView;
    return r.y + r.h - (wy - lv.yMin) / (lv.yMax - lv.yMin) * r.h;
  }
  function toWXl(sx) {
    var r = lowerRect(), v = state.view;
    return v.xMin + (sx - r.x) / r.w * (v.xMax - v.xMin);
  }
  function toWYl(sy) {
    var r = lowerRect(), lv = state.lowerView;
    return lv.yMax - (sy - r.y) / r.h * (lv.yMax - lv.yMin);
  }

  /** Detect which panel a screen-Y coordinate falls in */
  function whichPanel(sy) {
    if (!state.split) return 'upper';
    var uR = upperRect();
    return sy <= uR.y + uR.h ? 'upper' : 'lower';
  }


  /* ═══════════════════════════════════════════════════════════
     S12b ── Annotation Rendering & Interaction
     ═══════════════════════════════════════════════════════════ */

  /* ── Freehand Stroke Rendering ── */

  function renderStroke(stroke) {
    var pts = stroke.points;
    if (pts.length < 2) return;

    var sRot = stroke.rotation || 0;
    if (sRot) {
      var sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
      for (var ri = 0; ri < pts.length; ri++) {
        var rpx = toSXu(pts[ri].wx), rpy = toSYu(pts[ri].wy);
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

    var hasPressure = false;
    for (var k = 0; k < pts.length; k++) {
      if (pts[k].p > 0 && Math.abs(pts[k].p - 0.5) > 0.05) { hasPressure = true; break; }
    }

    if (!hasPressure) {
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(toSXu(pts[0].wx), toSYu(pts[0].wy));
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (toSXu(pts[i].wx) + toSXu(pts[i + 1].wx)) / 2;
        var my = (toSYu(pts[i].wy) + toSYu(pts[i + 1].wy)) / 2;
        ctx.quadraticCurveTo(toSXu(pts[i].wx), toSYu(pts[i].wy), mx, my);
      }
      ctx.lineTo(toSXu(pts[pts.length - 1].wx), toSYu(pts[pts.length - 1].wy));
      ctx.stroke();
    } else {
      for (var j = 1; j < pts.length; j++) {
        var p0 = pts[j - 1], p1 = pts[j];
        ctx.lineWidth = stroke.width * (0.4 + p1.p * 0.8);
        ctx.beginPath();
        ctx.moveTo(toSXu(p0.wx), toSYu(p0.wy));
        ctx.lineTo(toSXu(p1.wx), toSYu(p1.wy));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (sRot) ctx.restore();
  }

  function drawStrokes() {
    for (var i = 0; i < state.strokes.length; i++) {
      renderStroke(state.strokes[i]);
    }
    if (state.activeStroke) renderStroke(state.activeStroke);
  }

  /* ── Shape Rendering ── */

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

  function renderShape(s) {
    var x1 = toSXu(s.wx1), y1 = toSYu(s.wy1), x2 = toSXu(s.wx2), y2 = toSYu(s.wy2);
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
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      case 'arrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawArrowhead(x2, y2, Math.atan2(y2 - y1, x2 - x1), headSize, s.color);
        break;
      case 'dblarrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        var a1 = Math.atan2(y2 - y1, x2 - x1);
        var a2 = Math.atan2(y1 - y2, x1 - x2);
        drawArrowhead(x2, y2, a1, headSize, s.color);
        drawArrowhead(x1, y1, a2, headSize, s.color);
        break;
      case 'rect':
        var rx = Math.min(x1, x2), ry = Math.min(y1, y2);
        var rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fillRect(rx, ry, rw, rh); ctx.globalAlpha = 0.9; }
        ctx.strokeRect(rx, ry, rw, rh);
        break;
      case 'circle':
        var cdx = x2 - x1, cdy = y2 - y1;
        var radius = Math.sqrt(cdx * cdx + cdy * cdy);
        ctx.beginPath(); ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke();
        break;
      case 'ellipse':
        var ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2;
        var erx = Math.abs(x2 - x1) / 2, ery = Math.abs(y2 - y1) / 2;
        if (erx < 1 || ery < 1) break;
        ctx.beginPath(); ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke();
        break;
      case 'text':
        if (!s.text) break;
        var tbW = Math.abs(x2 - x1), tbH = Math.abs(y2 - y1);
        if (tbW < 4) tbW = 60;
        if (tbH < 4) tbH = 22;
        var fontSize = Math.max(8, Math.round(tbH * 0.64));
        ctx.font = 'bold ' + fontSize + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        var tbX = Math.min(x1, x2), tbY = Math.min(y1, y2);
        ctx.fillStyle = 'rgba(13,17,23,0.85)';
        ctx.strokeStyle = s.color; ctx.lineWidth = 1;
        roundRect(ctx, tbX, tbY, tbW, tbH, 5);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, tbX + 6, tbY + (tbH - fontSize) / 2);
        break;
    }
    ctx.globalAlpha = 1;
    if (rot) ctx.restore();
  }

  function drawShapes() {
    for (var i = 0; i < state.shapes.length; i++) {
      renderShape(state.shapes[i]);
    }
    if (state.activeShape) renderShape(state.activeShape);
  }

  /* ── Cursor Dot ── */

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
   * Live guidance for curve-snap tools (tangent / derivative / area).
   * These only act when the cursor is on the plotted curve, so when it is in
   * empty space in the upper panel we show a "move onto the curve" hint by the
   * pointer — turning a silent no-op into visible feedback.
   */
  function drawToolGuide() {
    if (!state.cursorPos) return;
    var t = state.tool;
    if (t !== 'tangent' && t !== 'derivative' && t !== 'integral') return;
    if (state.hoverPoint) return; /* On the curve — hover trace already guides */
    var uRect = upperRect();
    /* Only in the upper (function) panel where these tools operate */
    if (state.cursorPos.y < uRect.y || state.cursorPos.y > uRect.y + uRect.h) return;

    var label = (state.pendingClick && (t === 'derivative' || t === 'integral'))
      ? 'Click 2nd point on the curve'
      : 'Move onto the curve';
    var x = state.cursorPos.x + 14;
    var y = state.cursorPos.y - 14;

    ctx.save();
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    var tw = ctx.measureText(label).width;
    var padX = 8, boxH = 22;
    if (x + tw + padX * 2 > uRect.x + uRect.w) x = state.cursorPos.x - 14 - tw - padX * 2;
    if (y - boxH < uRect.y) y = state.cursorPos.y + 26;

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(20,24,33,0.92)';
    roundRect(ctx, x, y - boxH + 5, tw + padX * 2, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e7ecf3';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + padX, y - boxH / 2 + 5);
    ctx.restore();
  }

  /* ── Selection System ── */

  var selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
  var lockIconPositions = false;

  function rotatePoint(px, py, cx, cy, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  function unrotatePoint(px, py, cx, cy, angle) {
    if (!angle) return { x: px, y: py };
    var cos = Math.cos(-angle), sin = Math.sin(-angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }

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

  function hitCorner(sx, sy, b) {
    if (!b || !b.corners) return null;
    var t = 10;
    var labels = ['nw', 'ne', 'se', 'sw'];
    for (var ci = 0; ci < 4; ci++) {
      if (Math.abs(sx - b.corners[ci].x) < t && Math.abs(sy - b.corners[ci].y) < t) return labels[ci];
    }
    return null;
  }

  function findNearestAnnotation(sx, sy) {
    var threshold = 15;
    var best = null, bestDist = threshold;

    for (var i = state.shapes.length - 1; i >= 0; i--) {
      var s = state.shapes[i];
      var x1 = toSXu(s.wx1), y1 = toSYu(s.wy1), x2 = toSXu(s.wx2), y2 = toSYu(s.wy2);
      var d = Infinity;

      var lsx = sx, lsy = sy;
      if (s.rotation) {
        var scx = (x1 + x2) / 2, scy = (y1 + y2) / 2;
        var lp = unrotatePoint(sx, sy, scx, scy, s.rotation);
        lsx = lp.x; lsy = lp.y;
      }

      switch (s.type) {
        case 'line': case 'arrow': case 'dblarrow':
          d = distToSegment(lsx, lsy, x1, y1, x2, y2); break;
        case 'rect':
          var rrx = Math.min(x1, x2), rry = Math.min(y1, y2);
          var rrw = Math.abs(x2 - x1), rrh = Math.abs(y2 - y1);
          if (lsx >= rrx - threshold && lsx <= rrx + rrw + threshold && lsy >= rry - threshold && lsy <= rry + rrh + threshold) {
            var dL = Math.abs(lsx - rrx), dR = Math.abs(lsx - rrx - rrw);
            var dT = Math.abs(lsy - rry), dB = Math.abs(lsy - rry - rrh);
            d = Math.min(dL, dR, dT, dB);
            if (s.filled && lsx >= rrx && lsx <= rrx + rrw && lsy >= rry && lsy <= rry + rrh) d = 0;
          }
          break;
        case 'circle':
          var ccdx = x2 - x1, ccdy = y2 - y1;
          var crad = Math.sqrt(ccdx * ccdx + ccdy * ccdy);
          var cdist = Math.sqrt((lsx - x1) * (lsx - x1) + (lsy - y1) * (lsy - y1));
          d = Math.abs(cdist - crad);
          if (s.filled && cdist <= crad) d = 0;
          break;
        case 'ellipse':
          var eecx = (x1 + x2) / 2, eecy = (y1 + y2) / 2;
          var eerx = Math.abs(x2 - x1) / 2, eery = Math.abs(y2 - y1) / 2;
          if (eerx > 0 && eery > 0) {
            var enorm = Math.sqrt(((lsx - eecx) * (lsx - eecx)) / (eerx * eerx) + ((lsy - eecy) * (lsy - eecy)) / (eery * eery));
            d = Math.abs(enorm - 1) * Math.min(eerx, eery);
            if (s.filled && enorm <= 1) d = 0;
          }
          break;
        case 'text':
          var ttx = Math.min(x1, x2), tty = Math.min(y1, y2);
          var ttw = Math.abs(x2 - x1), tth = Math.abs(y2 - y1);
          if (ttw < 4) { ttw = 60; tth = 22; }
          if (lsx >= ttx - 4 && lsx <= ttx + ttw + 4 && lsy >= tty - 4 && lsy <= tty + tth + 4) d = 0;
          break;
      }
      if (d < bestDist) { bestDist = d; best = { type: 'shape', idx: i }; }
    }

    for (var j = state.strokes.length - 1; j >= 0; j--) {
      var pts = state.strokes[j].points;
      for (var k = 1; k < pts.length; k++) {
        var sd = distToSegment(sx, sy, toSXu(pts[k - 1].wx), toSYu(pts[k - 1].wy), toSXu(pts[k].wx), toSYu(pts[k].wy));
        if (sd < bestDist) { bestDist = sd; best = { type: 'stroke', idx: j }; break; }
      }
    }

    /* Check free points (using panel-aware transforms) */
    for (var p = state.points.length - 1; p >= 0; p--) {
      var ppx = ptToSX(state.points[p]), ppy = ptToSY(state.points[p]);
      var pd = Math.sqrt((sx - ppx) * (sx - ppx) + (sy - ppy) * (sy - ppy));
      if (pd < bestDist) { bestDist = pd; best = { type: 'point', idx: p }; }
    }

    return best;
  }

  function getSelectionBounds() {
    if (state.selectedAnnotation < 0) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var rot = 0, corners = null;

    if (state.selectedAnnotationType === 'shape') {
      var s = state.shapes[state.selectedAnnotation];
      if (!s) return null;
      rot = s.rotation || 0;
      var sx1 = toSXu(s.wx1), sy1 = toSYu(s.wy1), sx2 = toSXu(s.wx2), sy2 = toSYu(s.wy2);
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
      var c0 = rotatePoint(lMinX, lMinY, cx, cy, rot);
      var c1 = rotatePoint(lMaxX, lMinY, cx, cy, rot);
      var c2 = rotatePoint(lMaxX, lMaxY, cx, cy, rot);
      var c3 = rotatePoint(lMinX, lMaxY, cx, cy, rot);
      corners = [c0, c1, c2, c3];
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
        var px = toSXu(st.points[i].wx), py = toSYu(st.points[i].wy);
        if (px < minX) minX = px; if (py < minY) minY = py;
        if (px > maxX) maxX = px; if (py > maxY) maxY = py;
      }
      if (!isFinite(minX)) return null;
      var spad = 6;
      minX -= spad; minY -= spad; maxX += spad; maxY += spad;
      var scx2 = (minX + maxX) / 2, scy2 = (minY + maxY) / 2;
      if (rot) {
        var sc0 = rotatePoint(minX, minY, scx2, scy2, rot);
        var sc1 = rotatePoint(maxX, minY, scx2, scy2, rot);
        var sc2b = rotatePoint(maxX, maxY, scx2, scy2, rot);
        var sc3 = rotatePoint(minX, maxY, scx2, scy2, rot);
        corners = [sc0, sc1, sc2b, sc3];
        minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
        for (var si = 0; si < 4; si++) {
          if (corners[si].x < minX) minX = corners[si].x;
          if (corners[si].y < minY) minY = corners[si].y;
          if (corners[si].x > maxX) maxX = corners[si].x;
          if (corners[si].y > maxY) maxY = corners[si].y;
        }
      } else {
        corners = [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
      }
      return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, rotation: rot, cx: scx2, cy: scy2, corners: corners };
    } else if (state.selectedAnnotationType === 'point') {
      var pt = state.points[state.selectedAnnotation];
      if (!pt) return null;
      var psx = ptToSX(pt), psy = ptToSY(pt);
      var pr = 14;
      corners = [{x: psx - pr, y: psy - pr}, {x: psx + pr, y: psy - pr},
                 {x: psx + pr, y: psy + pr}, {x: psx - pr, y: psy + pr}];
      return { minX: psx - pr, minY: psy - pr, maxX: psx + pr, maxY: psy + pr,
               rotation: 0, cx: psx, cy: psy, corners: corners, isPoint: true };
    }
    return null;
  }

  function drawSelectionIndicator() {
    var b = getSelectionBounds();
    if (!b) { selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null }; return; }

    selectionUI.box = b;
    var c = b.corners;

    ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]); ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(c[0].x, c[0].y); ctx.lineTo(c[1].x, c[1].y);
    ctx.lineTo(c[2].x, c[2].y); ctx.lineTo(c[3].x, c[3].y);
    ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);

    var hs = 5;
    ctx.fillStyle = '#4fc3f7'; ctx.globalAlpha = 1;
    for (var chi = 0; chi < 4; chi++) {
      ctx.fillRect(c[chi].x - hs, c[chi].y - hs, hs * 2, hs * 2);
    }

    var iconSize = 24, gap = 6;
    var totalW = iconSize * 3 + gap * 2;
    var icX, icY;
    if (lockIconPositions && selectionUI.deleteBtn) {
      icX = selectionUI.deleteBtn.x; icY = selectionUI.deleteBtn.y;
    } else {
      icX = (b.minX + b.maxX) / 2 - totalW / 2;
      icY = b.minY - iconSize - 8;
      if (icY < 2) icY = b.maxY + 8;
    }

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* Delete button */
    var delBtn = { x: icX, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1;
    roundRect(ctx, delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5);
    ctx.fill(); ctx.stroke();
    var ddx = delBtn.x + iconSize / 2, ddy = delBtn.y + iconSize / 2;
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ddx - 5, ddy - 4); ctx.lineTo(ddx + 5, ddy - 4);
    ctx.moveTo(ddx - 2, ddy - 4); ctx.lineTo(ddx - 2, ddy - 6);
    ctx.lineTo(ddx + 2, ddy - 6); ctx.lineTo(ddx + 2, ddy - 4);
    ctx.moveTo(ddx - 4, ddy - 3); ctx.lineTo(ddx - 3, ddy + 5);
    ctx.lineTo(ddx + 3, ddy + 5); ctx.lineTo(ddx + 4, ddy - 3);
    ctx.moveTo(ddx - 1, ddy - 2); ctx.lineTo(ddx - 1, ddy + 3);
    ctx.moveTo(ddx + 1, ddy - 2); ctx.lineTo(ddx + 1, ddy + 3);
    ctx.stroke();
    selectionUI.deleteBtn = delBtn;

    /* Duplicate button */
    var dupBtn = { x: icX + iconSize + gap, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1;
    roundRect(ctx, dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('\u2750', dupBtn.x + iconSize / 2, dupBtn.y + iconSize / 2);
    selectionUI.dupBtn = dupBtn;

    /* Rotate button */
    var rotBtn = { x: icX + (iconSize + gap) * 2, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1;
    roundRect(ctx, rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5);
    ctx.fill(); ctx.stroke();
    var rrx = rotBtn.x + iconSize / 2, rry = rotBtn.y + iconSize / 2;
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(rrx, rry, 5, -Math.PI * 0.8, Math.PI * 0.5); ctx.stroke();
    var ax = rrx + 5 * Math.cos(Math.PI * 0.5), ay = rry + 5 * Math.sin(Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(ax - 3, ay - 2); ctx.lineTo(ax, ay + 1); ctx.lineTo(ax + 3, ay - 2);
    ctx.stroke();
    selectionUI.rotateBtn = rotBtn;

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  /* ── Annotation Actions ── */

  function deleteSelectedAnnotation() {
    if (state.selectedAnnotation < 0) return;
    saveUndo();
    if (state.selectedAnnotationType === 'shape') {
      state.shapes.splice(state.selectedAnnotation, 1);
    } else if (state.selectedAnnotationType === 'stroke') {
      state.strokes.splice(state.selectedAnnotation, 1);
    } else if (state.selectedAnnotationType === 'point') {
      state.points.splice(state.selectedAnnotation, 1);
    }
    state.selectedAnnotation = -1;
    state.selectedAnnotationType = '';
    selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
    draw();
  }

  function rotateSelectedAnnotation() {
    if (state.selectedAnnotation < 0) return;
    saveUndo();
    if (state.selectedAnnotationType === 'shape') {
      var s = state.shapes[state.selectedAnnotation];
      if (s) s.rotation = ((s.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    } else if (state.selectedAnnotationType === 'stroke') {
      var st = state.strokes[state.selectedAnnotation];
      if (st) st.rotation = ((st.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    }
    lockIconPositions = true;
    draw();
    lockIconPositions = false;
  }

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
        dupS.points[i].wx += offset; dupS.points[i].wy -= offset;
      }
      state.strokes.push(dupS);
      state.selectedAnnotation = state.strokes.length - 1;
    } else if (state.selectedAnnotationType === 'point') {
      var origP = state.points[state.selectedAnnotation];
      if (!origP) return;
      var dupP = deepClone(origP);
      dupP.id = ++pointUid;
      dupP.wx += offset; dupP.wy -= offset;
      dupP.snapped = false;
      state.points.push(dupP);
      state.selectedAnnotation = state.points.length - 1;
    }
    draw();
  }

  /* ── Text Shape Editing ── */

  function editTextShape(idx, shape) {
    var inp = $('shape-text-input');
    if (!inp || !canvas) return;
    var rect = canvas.getBoundingClientRect();
    var parent = canvas.parentElement;
    var parentRect = parent.getBoundingClientRect();
    var ssx = toSXu(shape.wx1), ssy = toSYu(shape.wy1);
    inp.style.display = '';
    inp.style.left = (rect.left - parentRect.left + ssx) + 'px';
    inp.style.top = (rect.top - parentRect.top + ssy) + 'px';
    inp.value = shape.text || '';
    inp.focus(); inp.select();

    function commit() {
      var txt = inp.value.trim();
      if (txt) {
        saveUndo();
        shape.text = txt;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        var twPx = ctx.measureText(txt).width + 12;
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
    var ssx = toSXu(wx), ssy = toSYu(wy);
    inp.style.display = '';
    inp.style.left = (rect.left - parentRect.left + ssx) + 'px';
    inp.style.top = (rect.top - parentRect.top + ssy) + 'px';
    inp.value = '';
    inp.focus();

    function commit() {
      var txt = inp.value.trim();
      if (txt) {
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        var twPx = ctx.measureText(txt).width + 12;
        var thPx = 22;
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

  /* ── Point Tool ── */

  var pointUid = 0;

  /**
   * Add a coordinate point. panel = 'upper' or 'lower'.
   * wx/wy are in the world coords of that panel.
   * For upper: snaps to f(x). For lower: snaps to f'(x) or ∫f(x).
   */
  function addGraphPoint(wx, wy, panel) {
    panel = panel || 'upper';
    var snapped = false;
    var bestWY = wy;

    if (panel === 'upper' && state.ast) {
      var curveY = evaluate(state.ast, wx, {});
      if (isOk(curveY)) {
        var curveSY = toSYu(curveY), screenY = toSYu(wy);
        if (Math.abs(curveSY - screenY) < 40) {
          bestWY = curveY; snapped = true;
        }
      }
    } else if (panel === 'lower' && state.split) {
      /* Snap to derivative or integral curve in lower panel */
      var lPts = state.animType === 'diff' ? state.derivPts : state.integPts;
      if (lPts && lPts.length > 0) {
        var bestIdx = -1, bestSnapDist = Infinity;
        for (var k = 0; k < lPts.length; k++) {
          if (!isOk(lPts[k].y)) continue;
          var dx = Math.abs(lPts[k].x - wx);
          if (dx < bestSnapDist) { bestSnapDist = dx; bestIdx = k; }
        }
        if (bestIdx >= 0) {
          var snapWY = lPts[bestIdx].y;
          var snapSY = toSYl(snapWY), clickSY = toSYl(wy);
          if (Math.abs(snapSY - clickSY) < 40) {
            bestWY = snapWY; snapped = true;
          }
        }
      }
    }

    var pt = {
      id: ++pointUid,
      wx: wx,
      wy: snapped ? bestWY : wy,
      panel: panel,
      snapped: snapped
    };
    state.points.push(pt);
    draw();
  }

  /** Convert point screen coords based on its panel */
  function ptToSX(pt) { return pt.panel === 'lower' ? toSXl(pt.wx) : toSXu(pt.wx); }
  function ptToSY(pt) { return pt.panel === 'lower' ? toSYl(pt.wy) : toSYu(pt.wy); }

  function drawFreePoints() {
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00bfa5';
    var derivCol = COLOR_DERIV || '#ff6b6b';
    var integCol = COLOR_INTEG || '#51cf66';

    for (var i = 0; i < state.points.length; i++) {
      var pt = state.points[i];

      /* Skip lower-panel points when not in split mode */
      if (pt.panel === 'lower' && !state.split) continue;

      /* If snapped to upper curve, recompute Y */
      if (pt.snapped && pt.panel === 'upper' && state.ast) {
        var liveY = evaluate(state.ast, pt.wx, {});
        if (isOk(liveY)) pt.wy = liveY;
      }
      /* If snapped to lower curve, recompute Y from precomputed points */
      if (pt.snapped && pt.panel === 'lower' && state.split) {
        var lPts = state.animType === 'diff' ? state.derivPts : state.integPts;
        if (lPts && lPts.length > 0) {
          var nearIdx = -1, nearDx = Infinity;
          for (var k = 0; k < lPts.length; k++) {
            var ddx = Math.abs(lPts[k].x - pt.wx);
            if (ddx < nearDx) { nearDx = ddx; nearIdx = k; }
          }
          if (nearIdx >= 0 && isOk(lPts[nearIdx].y)) pt.wy = lPts[nearIdx].y;
        }
      }

      var sx = ptToSX(pt), sy = ptToSY(pt);
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

      /* Color: accent for upper, derivative/integral color for lower */
      var col;
      if (!pt.snapped) col = '#ffffff';
      else if (pt.panel === 'lower') col = state.animType === 'diff' ? derivCol : integCol;
      else col = accent;

      /* Outer ring */
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      /* Coordinate label with background pill */
      var label = '(' + roundSig(pt.wx, 4) + ', ' + roundSig(pt.wy, 4) + ')';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      var lx = sx + 12, ly = sy - 10;
      var tw = ctx.measureText(label).width;
      if (lx + tw + 6 > W) lx = sx - tw - 16;
      if (ly - 14 < 0) ly = sy + 20;
      ctx.fillStyle = 'rgba(13,17,23,0.88)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      roundRect(ctx, lx - 6, ly - 15, tw + 12, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillText(label, lx, ly);
    }
  }

  function findNearestPoint(sx, sy, threshold) {
    var best = -1, bestDist = threshold * threshold;
    for (var i = 0; i < state.points.length; i++) {
      var px = ptToSX(state.points[i]), py = ptToSY(state.points[i]);
      var d = (px - sx) * (px - sx) + (py - sy) * (py - sy);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  /* ── Tool Mode System ── */

  function setTool(t) {
    state.pendingClick = null;
    if (state.activeStroke) {
      if (state.activeStroke.points.length >= 2) state.strokes.push(state.activeStroke);
      state.activeStroke = null;
    }
    if (state.activeShape) { state.activeShape = null; }
    var dd = $('sketch-dropdown');
    if (dd) dd.style.display = 'none';
    var sd = $('shape-dropdown');
    if (sd) sd.style.display = 'none';
    var ti = $('shape-text-input');
    if (ti) ti.style.display = 'none';

    state.tool = t;
    if (canvas) {
      if (t === 'move') canvas.style.cursor = 'crosshair';
      else if (t === 'point') canvas.style.cursor = 'copy';
      else if (t === 'sketch' || t === 'shape') canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'pointer';
    }
    var btns = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === t);
    }
  }

  /* ── Undo / Redo ── */

  function makeSnapshot() {
    return {
      view: deepClone(state.view),
      expr: state.expr,
      strokes: deepClone(state.strokes),
      shapes: deepClone(state.shapes),
      points: deepClone(state.points),
      tangents: deepClone(state.tangents),
      derivSegments: deepClone(state.derivSegments),
      integralRegions: deepClone(state.integralRegions)
    };
  }

  function restoreSnapshot(snap) {
    state.view = snap.view;
    state.expr = snap.expr;
    state.strokes = snap.strokes || [];
    state.shapes = snap.shapes || [];
    state.points = snap.points || [];
    state.tangents = snap.tangents || [];
    state.derivSegments = snap.derivSegments || [];
    state.integralRegions = snap.integralRegions || [];
    state.activeStroke = null;
    state.activeShape = null;
    state.selectedAnnotation = -1;
    state.selectedAnnotationType = '';
    $('expr-input').value = state.expr;
    state.ast = parse(state.expr);
    draw();
  }

  function saveUndo() {
    state.undoStack.push(makeSnapshot());
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
  }

  function performUndo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(makeSnapshot());
    restoreSnapshot(state.undoStack.pop());
  }

  function performRedo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(makeSnapshot());
    restoreSnapshot(state.redoStack.pop());
  }


  /* ═══════════════════════════════════════════════════════════
     S13 ── Grid & Axis Drawing
     ═══════════════════════════════════════════════════════════ */

  function niceStep(range) {
    var raw = range / 8;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var nice;
    if (norm < 1.5) nice = 1;
    else if (norm < 3.5) nice = 2;
    else if (norm < 7.5) nice = 5;
    else nice = 10;
    return nice * mag;
  }

  function drawGrid(rect, view) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    var xRange = view.xMax - view.xMin;
    var yRange = view.yMax - view.yMin;
    var xStep = niceStep(xRange);
    var yStep = niceStep(yRange);

    /* Minor grid */
    ctx.strokeStyle = GRID_MINOR_COLOR;
    ctx.lineWidth = 0.5;
    var xMinorStep = xStep / 5;
    var yMinorStep = yStep / 5;
    var xStart = Math.floor(view.xMin / xMinorStep) * xMinorStep;
    var yStart = Math.floor(view.yMin / yMinorStep) * yMinorStep;

    ctx.beginPath();
    for (var gx = xStart; gx <= view.xMax; gx += xMinorStep) {
      var sx = toSX(gx, rect, view);
      ctx.moveTo(sx, rect.y);
      ctx.lineTo(sx, rect.y + rect.h);
    }
    for (var gy = yStart; gy <= view.yMax; gy += yMinorStep) {
      var sy = toSY(gy, rect, view);
      ctx.moveTo(rect.x, sy);
      ctx.lineTo(rect.x + rect.w, sy);
    }
    ctx.stroke();

    /* Major grid */
    ctx.strokeStyle = GRID_MAJOR_COLOR;
    ctx.lineWidth = 0.8;
    xStart = Math.floor(view.xMin / xStep) * xStep;
    yStart = Math.floor(view.yMin / yStep) * yStep;

    ctx.beginPath();
    for (gx = xStart; gx <= view.xMax; gx += xStep) {
      sx = toSX(gx, rect, view);
      ctx.moveTo(sx, rect.y);
      ctx.lineTo(sx, rect.y + rect.h);
    }
    for (gy = yStart; gy <= view.yMax; gy += yStep) {
      sy = toSY(gy, rect, view);
      ctx.moveTo(rect.x, sy);
      ctx.lineTo(rect.x + rect.w, sy);
    }
    ctx.stroke();

    /* Axes */
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    /* X axis */
    if (view.yMin <= 0 && view.yMax >= 0) {
      var axY = toSY(0, rect, view);
      ctx.moveTo(rect.x, axY);
      ctx.lineTo(rect.x + rect.w, axY);
    }
    /* Y axis */
    if (view.xMin <= 0 && view.xMax >= 0) {
      var axX = toSX(0, rect, view);
      ctx.moveTo(axX, rect.y);
      ctx.lineTo(axX, rect.y + rect.h);
    }
    ctx.stroke();

    /* Axis numbers */
    ctx.font = '11px ' + getComputedStyle(document.documentElement).getPropertyValue('--font').trim();
    ctx.fillStyle = AXIS_NUM_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var axisYPos = view.yMin <= 0 && view.yMax >= 0 ? toSY(0, rect, view) : rect.y + rect.h;
    for (gx = xStart; gx <= view.xMax; gx += xStep) {
      if (Math.abs(gx) < xStep * 0.01) continue;
      sx = toSX(gx, rect, view);
      if (sx > rect.x + 20 && sx < rect.x + rect.w - 20) {
        ctx.fillText(formatAxisNum(gx), sx, clamp(axisYPos + 4, rect.y, rect.y + rect.h - 14));
      }
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var axisXPos = view.xMin <= 0 && view.xMax >= 0 ? toSX(0, rect, view) : rect.x;
    for (gy = yStart; gy <= view.yMax; gy += yStep) {
      if (Math.abs(gy) < yStep * 0.01) continue;
      sy = toSY(gy, rect, view);
      if (sy > rect.y + 8 && sy < rect.y + rect.h - 8) {
        ctx.fillText(formatAxisNum(gy), clamp(axisXPos - 4, rect.x + 30, rect.x + rect.w), sy);
      }
    }

    ctx.restore();
  }


  /* ═══════════════════════════════════════════════════════════
     S14 ── Function Plotting
     ═══════════════════════════════════════════════════════════ */

  function plotFunction(ast, rect, view, color, lineWidth) {
    if (!ast) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    var steps = Math.max(rect.w * 2, 400);
    var dx = (view.xMax - view.xMin) / steps;
    var drawing = false;
    var prevOk = false;

    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var x = view.xMin + i * dx;
      var y = evaluate(ast, x);
      if (isOk(y) && y > view.yMin - 50 && y < view.yMax + 50) {
        var sx = toSX(x, rect, view);
        var sy = toSY(y, rect, view);
        if (!prevOk) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
        prevOk = true;
      } else {
        prevOk = false;
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Plot pre-computed points up to a given fraction (0..1) */
  function plotPoints(pts, fraction, rect, view, color, lineWidth) {
    if (!pts || !pts.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    var endIdx = Math.min(Math.floor(pts.length * clamp(fraction, 0, 1)), pts.length - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    var prevOk = false;
    ctx.beginPath();
    for (var i = 0; i <= endIdx; i++) {
      var p = pts[i];
      if (isOk(p.y)) {
        var sx = toSX(p.x, rect, view);
        var sy = toSY(p.y, rect, view);
        if (!prevOk) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
        prevOk = true;
      } else {
        prevOk = false;
      }
    }
    ctx.stroke();
    ctx.restore();
  }


  /* ═══════════════════════════════════════════════════════════
     S15 ── Tangent Line Drawing
     ═══════════════════════════════════════════════════════════ */

  function drawTangent(ast, x0, rect, view) {
    var y0 = evaluate(ast, x0);
    var slope = numericalDeriv(ast, x0);
    if (!isOk(y0) || !isOk(slope)) return;

    var xRange = view.xMax - view.xMin;
    var tangentHalf = xRange * 0.15;
    var x1 = x0 - tangentHalf;
    var x2 = x0 + tangentHalf;
    var y1 = y0 + slope * (x1 - x0);
    var y2 = y0 + slope * (x2 - x0);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    /* Tangent line */
    ctx.strokeStyle = COLOR_TANGENT;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toSX(x1, rect, view), toSY(y1, rect, view));
    ctx.lineTo(toSX(x2, rect, view), toSY(y2, rect, view));
    ctx.stroke();
    ctx.setLineDash([]);

    /* Point on curve */
    var sx0 = toSX(x0, rect, view);
    var sy0 = toSY(y0, rect, view);
    ctx.fillStyle = COLOR_TANGENT;
    ctx.beginPath();
    ctx.arc(sx0, sy0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return { sx: sx0, sy: sy0, slope: slope };
  }


  /* ═══════════════════════════════════════════════════════════
     S16 ── Riemann Rectangles
     ═══════════════════════════════════════════════════════════ */

  function drawRiemann(ast, rect, view, a, b, n, fillFraction) {
    if (!ast) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    var xMin = a;
    var xMax = b;
    var dx = (xMax - xMin) / n;
    var endN = Math.floor(n * clamp(fillFraction, 0, 1));

    for (var i = 0; i < endN; i++) {
      var x = xMin + i * dx;
      var y = evaluate(ast, x + dx / 2); /* midpoint rule */
      if (!isOk(y)) continue;

      var sx = toSX(x, rect, view);
      var sw = toSX(x + dx, rect, view) - sx;
      var sy0 = toSY(0, rect, view);
      var syY = toSY(y, rect, view);

      ctx.fillStyle = y >= 0 ? COLOR_RIEMANN : 'rgba(255,107,107,0.25)';
      ctx.strokeStyle = y >= 0 ? 'rgba(81,207,102,0.6)' : 'rgba(255,107,107,0.5)';
      ctx.lineWidth = 1;
      ctx.fillRect(sx, Math.min(sy0, syY), sw, Math.abs(syY - sy0));
      ctx.strokeRect(sx, Math.min(sy0, syY), sw, Math.abs(syY - sy0));
    }

    ctx.restore();
  }

  /** Draw smooth shaded area under f(x) over [a, b] */
  function drawShadedArea(ast, rect, view, a, b, alpha) {
    if (!ast) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    var steps = Math.max(rect.w, 200);
    var dx = (b - a) / steps;
    var zeroY = toSY(0, rect, view);

    ctx.fillStyle = 'rgba(81,207,102,' + (alpha * 0.3) + ')';
    ctx.beginPath();
    ctx.moveTo(toSX(a, rect, view), zeroY);

    for (var i = 0; i <= steps; i++) {
      var x = a + i * dx;
      var y = evaluate(ast, x);
      if (!isOk(y)) y = 0;
      ctx.lineTo(toSX(x, rect, view), toSY(y, rect, view));
    }

    ctx.lineTo(toSX(b, rect, view), zeroY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }


  /* ═══════════════════════════════════════════════════════════
     S17 ── Split Panel Divider
     ═══════════════════════════════════════════════════════════ */

  function drawSplitDivider() {
    if (!state.split) return;
    var splitY = Math.round(H * state.splitRatio);
    var barH = 6;

    /* Thick solid separator bar */
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(0, splitY - barH / 2, W, barH);

    /* Bright accent line in center of bar */
    ctx.strokeStyle = 'rgba(0,191,165,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(W, splitY);
    ctx.stroke();

    /* Panel labels with background pills */
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';

    /* Upper panel label: f(x) */
    ctx.textBaseline = 'bottom';
    var topLbl = 'f(x) = ' + state.expr;
    var topW = ctx.measureText(topLbl).width;
    ctx.fillStyle = 'rgba(13,17,23,0.8)';
    roundRect(ctx, 6, splitY - barH / 2 - 20, topW + 12, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#18b4f5';
    ctx.fillText(topLbl, 12, splitY - barH / 2 - 6);

    /* Lower panel label: f'(x) or ∫f(x)dx */
    ctx.textBaseline = 'top';
    var botLbl = state.animType === 'diff' ? "f'(x)" : "F(x) = \u222B\u2080\u02E3 f(t) dt";
    var botW = ctx.measureText(botLbl).width;
    ctx.fillStyle = 'rgba(13,17,23,0.8)';
    roundRect(ctx, 6, splitY + barH / 2 + 4, botW + 12, 18, 4);
    ctx.fill();
    ctx.fillStyle = state.animType === 'diff' ? '#ff6b6b' : '#51cf66';
    ctx.fillText(botLbl, 12, splitY + barH / 2 + 7);
  }


  /* ═══════════════════════════════════════════════════════════
     S18 ── Main Draw Function (pure render)
     ═══════════════════════════════════════════════════════════ */

  function draw() {
    if (!ctx) return;
    /* Update integral limit placeholders to reflect current view */
    var iaEl = $('integ-a'), ibEl = $('integ-b');
    if (iaEl && !iaEl.value) iaEl.placeholder = formatNum(state.view.xMin);
    if (ibEl && !ibEl.value) ibEl.placeholder = formatNum(state.view.xMax);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    var uRect = upperRect();
    var uView = state.view;

    /* Draw upper panel: grid + f(x) */
    drawGrid(uRect, uView);
    plotFunction(state.ast, uRect, uView, COLOR_FUNC, 2.5);

    /* Animation overlays on upper panel */
    if (state.animState !== 'idle' && state.animType === 'diff') {
      /* Tangent line sweeping */
      var t = state.animT;
      var xAnim = lerp(uView.xMin, uView.xMax, t);
      var tangentInfo = drawTangent(state.ast, xAnim, uRect, uView);

      /* Update floating label */
      if (tangentInfo) {
        showFloatingLabel(tangentInfo.sx, tangentInfo.sy - 30,
          'slope = ' + formatNum(tangentInfo.slope));
      }
    }

    if (state.animState !== 'idle' && state.animType === 'int') {
      var tI = state.animT;
      var iLims = getIntegLimits();
      /* Phase breakdown for integration:
         0.00-0.25: n=8 rectangles fill
         0.25-0.50: n=32 rectangles fill
         0.50-0.75: n=128 rectangles fill
         0.75-1.00: transition to smooth shade */
      if (tI < 0.25) {
        drawRiemann(state.ast, uRect, uView, iLims.a, iLims.b, 8, tI / 0.25);
      } else if (tI < 0.50) {
        drawRiemann(state.ast, uRect, uView, iLims.a, iLims.b, 32, (tI - 0.25) / 0.25);
      } else if (tI < 0.75) {
        drawRiemann(state.ast, uRect, uView, iLims.a, iLims.b, 128, (tI - 0.50) / 0.25);
      } else {
        var fadeT = (tI - 0.75) / 0.25;
        /* Fade from rectangles to smooth */
        if (fadeT < 0.5) {
          drawRiemann(state.ast, uRect, uView, iLims.a, iLims.b, 128, 1);
        }
        drawShadedArea(state.ast, uRect, uView, iLims.a, iLims.b, fadeT);
      }

      /* Running total label */
      var xAnimI = lerp(iLims.a, iLims.b, clamp(tI * 1.2, 0, 1));
      var area = computeIntegral(state.ast, iLims.a, xAnimI);
      if (isOk(area)) {
        var lsx = toSX(xAnimI, uRect, uView);
        var lsy = toSY(evaluate(state.ast, xAnimI), uRect, uView);
        showFloatingLabel(lsx, Math.max(lsy - 30, uRect.y + 20),
          '∫ = ' + formatNum(area));
      }
    }

    /* Draw result overlay on upper panel after animation */
    if (state.animState === 'result') {
      if (state.animType === 'int') {
        var resLims = getIntegLimits();
        drawShadedArea(state.ast, uRect, uView, resLims.a, resLims.b, 1);
      }
    }

    /* Lower panel (only when split) */
    if (state.split) {
      var lRect = lowerRect();
      var lView = { xMin: uView.xMin, xMax: uView.xMax,
                    yMin: state.lowerView.yMin, yMax: state.lowerView.yMax };

      drawGrid(lRect, lView);

      if (state.animType === 'diff') {
        plotPoints(state.derivPts, state.animState === 'result' ? 1 : state.animT, lRect, lView, COLOR_DERIV, 2.5);
      }
      if (state.animType === 'int') {
        plotPoints(state.integPts, state.animState === 'result' ? 1 : state.animT, lRect, lView, COLOR_INTEG, 2.5);
      }

      drawSplitDivider();
    }

    /* ── All annotations (toggled by eye button) ── */
    if (state.showAnnotations) {
      /* Clip annotation overlays to the upper panel so they never
         bleed into the lower panel in split mode */
      ctx.save();
      ctx.beginPath();
      ctx.rect(uRect.x, uRect.y, uRect.w, uRect.h);
      ctx.clip();
      drawTangentLines();
      drawDerivSegments();
      drawIntegralRegions();
      ctx.restore();
      drawPendingClick();
      drawStrokes();
      drawShapes();
      drawFreePoints();
      drawSelectionIndicator();
    }

    /* Hover trace stays visible always (navigation aid) */
    drawHoverTrace();
    drawToolGuide();
    drawHighlight();
    drawCursorDot();

    ctx.restore();
  }


  /* ═══════════════════════════════════════════════════════════
     S19 ── Animation Engine
     ═══════════════════════════════════════════════════════════ */

  var DIFF_DURATION = 3000;  /* ms at 1x speed */
  var INT_DURATION  = 4000;

  function getIntegLimits() {
    var a = (state.integA !== null && isFinite(state.integA)) ? state.integA : state.view.xMin;
    var b = (state.integB !== null && isFinite(state.integB)) ? state.integB : state.view.xMax;
    return { a: a, b: b };
  }

  function startAnimation(type) {
    if (state.animState === 'animating') cancelAnimation();
    if (!state.ast) return;

    /* Auto-dismiss the hint bar once the user starts exploring */
    var hintBar = $('hint-bar');
    if (hintBar) hintBar.style.display = 'none';

    state.animType = type;
    state.animT = 0;
    state.animState = 'animating';

    /* Pre-compute points */
    var ptCount = 400;
    if (type === 'diff') {
      state.derivPts = precomputeDerivPoints(state.ast, state.view.xMin, state.view.xMax, ptCount);
      autoScaleLowerView(state.derivPts);
    } else {
      var lims = getIntegLimits();
      state.integPts = precomputeIntegralPoints(state.ast, lims.a, lims.b, ptCount);
      autoScaleLowerView(state.integPts);
    }

    /* Symbolic differentiation for diff */
    if (type === 'diff') {
      try {
        var result = symbolicDiff(state.ast);
        var simplified = simplify(result.ast);
        /* Run simplify a second time for deeper folding */
        simplified = simplify(simplified);
        state.symbResult = simplified;
        state.symbRule = result.rule;
      } catch (e) {
        state.symbResult = null;
        state.symbRule = 'numerical only';
      }
    } else {
      state.symbResult = null;
      state.symbRule = '';
    }

    /* Enable split panel */
    state.split = true;

    /* Show progress bar */
    $('progress-section').style.display = '';
    $('progress-fill').style.width = '0%';
    hideFloatingLabel();

    /* Disable buttons */
    $('btn-diff').disabled = true;
    $('btn-int').disabled = true;

    state.animStartTime = performance.now();
    state.animRAF = requestAnimationFrame(animLoop);
  }

  function animLoop(ts) {
    var duration = (state.animType === 'diff' ? DIFF_DURATION : INT_DURATION) / state.animSpeed;
    var elapsed = ts - state.animStartTime;
    state.animT = clamp(elapsed / duration, 0, 1);

    /* Update progress bar */
    $('progress-fill').style.width = (state.animT * 100) + '%';

    try { draw(); } catch (e) { console.error('draw() error:', e); }

    if (state.animT >= 1) {
      finishAnimation();
      return;
    }
    state.animRAF = requestAnimationFrame(animLoop);
  }

  function finishAnimation() {
    state.animState = 'result';
    state.animT = 1;
    hideFloatingLabel();

    /* Re-enable buttons */
    $('btn-diff').disabled = false;
    $('btn-int').disabled = false;

    /* Show result */
    showResult();
    draw();
  }

  function cancelAnimation() {
    if (state.animRAF) {
      cancelAnimationFrame(state.animRAF);
      state.animRAF = null;
    }
    state.animState = 'idle';
    state.animT = 0;
    hideFloatingLabel();
    $('btn-diff').disabled = false;
    $('btn-int').disabled = false;
    $('progress-section').style.display = 'none';
  }

  function resetToIdle() {
    cancelAnimation();
    state.split = false;
    state.animType = null;
    state.symbResult = null;
    state.symbRule = '';
    state.tangents = [];
    state.derivSegments = [];
    state.integralRegions = [];
    state.pendingClick = null;
    state.highlight = null;
    if (highlightAnimId) { cancelAnimationFrame(highlightAnimId); highlightAnimId = null; }
    $('result-section').style.display = 'none';
    $('analysis-section').style.display = 'none';
    $('progress-section').style.display = 'none';
    draw();
  }

  /** Auto-scale the lower panel Y range based on pre-computed points */
  function autoScaleLowerView(pts) {
    /* Fundamental Theorem of Calculus constraint:
       The shaded area under f(x) in the upper panel must visually equal
       the height of F(x) in the lower panel. This requires IDENTICAL
       pixels-per-unit scale in both panels.

       Upper panel: uRange units mapped to topH pixels → scale = topH / uRange
       Lower panel: must use same scale → lRange = botH / scale = botH * uRange / topH

       The lower panel is then centered on the data midpoint. */

    var yMin = Infinity, yMax = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      var y = pts[i].y;
      if (isOk(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = -5; yMax = 5;
    }

    var uRange = state.view.yMax - state.view.yMin;
    var topH = Math.round(H * state.splitRatio);
    var botH = H - topH;

    /* Strict FTC constraint: identical pixels-per-unit in both panels.
       No fallback — if data overflows, user can zoom out. */
    var lRange = uRange * botH / topH;
    var dataMid = (yMin + yMax) / 2;

    state.lowerView.yMin = dataMid - lRange / 2;
    state.lowerView.yMax = dataMid + lRange / 2;
  }


  /* ═══════════════════════════════════════════════════════════
     S20 ── Result Display
     ═══════════════════════════════════════════════════════════ */

  /** True if the AST contains any NaN numeric node */
  function astHasNaN(node) {
    if (!node) return false;
    if (node.type === 'num') return isNaN(node.value);
    if (node.type === 'unary') return astHasNaN(node.arg);
    if (node.type === 'binop') return astHasNaN(node.left) || astHasNaN(node.right);
    if (node.type === 'call') {
      for (var i = 0; i < node.args.length; i++) {
        if (astHasNaN(node.args[i])) return true;
      }
    }
    return false;
  }

  function showResult() {
    var box = $('result-box');
    var html = '';

    if (state.animType === 'diff') {
      html += '<div class="result-label">Derivative</div>';
      if (state.symbResult && !astHasNaN(state.symbResult)) {
        var latexExpr = astToLatex(state.symbResult);
        html += '<div class="result-expr">' + renderMath("f'(x) = " + latexExpr) + '</div>';
      } else {
        html += '<div class="result-expr">' + renderMath("f'(x) =") + ' <em>numerical</em></div>';
      }
      if (state.symbRule) {
        html += '<div class="result-rule">Rule: ' + escHtml(state.symbRule) + '</div>';
      }
    } else {
      html += '<div class="result-label">Definite Integral</div>';
      var rLims = getIntegLimits();
      var area = computeIntegral(state.ast, rLims.a, rLims.b);
      var aStr = formatNum(rLims.a), bStr = formatNum(rLims.b);
      html += '<div class="result-expr">' + renderMath('\\displaystyle\\int_{' + aStr + '}^{' + bStr + '} f(x)\\,dx \\approx ' + formatNum(area)) + '</div>';
      html += '<div class="result-limits-hint">Adjust limits above to recompute</div>';
    }

    box.innerHTML = html;
    $('result-section').style.display = '';

    /* Analysis */
    showAnalysis();
  }

  /* ═══════════════════════════════════════════════════════════
     Analysis Panel — Clickable Chips with Canvas Highlight
     ═══════════════════════════════════════════════════════════ */

  var highlightAnimId = null;

  function fmtA(v) { return roundSig(v, 5); }

  function makeChip(text, cls, wx, wy, color, panel) {
    var chip = document.createElement('span');
    chip.className = 'sb-analysis-chip ' + cls;
    chip.textContent = text;
    chip.addEventListener('click', function () {
      var all = document.querySelectorAll('.sb-analysis-chip.active');
      for (var c = 0; c < all.length; c++) all[c].classList.remove('active');
      chip.classList.add('active');
      setHighlight(wx, wy, color, cls, panel || 'upper');
    });
    return chip;
  }

  function setHighlight(wx, wy, color, type, panel) {
    /* Toggle off if clicking same point */
    if (state.highlight && Math.abs(state.highlight.wx - wx) < 1e-6 &&
        Math.abs(state.highlight.wy - wy) < 1e-6) {
      clearHighlight(); return;
    }
    state.highlight = { wx: wx, wy: wy, color: color, type: type, panel: panel || 'upper', animStart: performance.now() };
    if (highlightAnimId) cancelAnimationFrame(highlightAnimId);
    function pulse() {
      if (!state.highlight) return;
      draw();
      highlightAnimId = requestAnimationFrame(pulse);
    }
    pulse();
    setTimeout(function () {
      if (highlightAnimId) { cancelAnimationFrame(highlightAnimId); highlightAnimId = null; }
      draw();
    }, 2000);
  }

  function clearHighlight() {
    var all = document.querySelectorAll('.sb-analysis-chip.active');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    state.highlight = null;
    if (highlightAnimId) { cancelAnimationFrame(highlightAnimId); highlightAnimId = null; }
    draw();
  }

  function drawHighlight() {
    var h = state.highlight;
    if (!h) return;
    var isLower = h.panel === 'lower' && state.split;
    var sx = isLower ? toSXl(h.wx) : toSXu(h.wx);
    var sy = isLower ? toSYl(h.wy) : toSYu(h.wy);
    var pRect = isLower ? lowerRect() : upperRect();

    /* Clip to panel bounds */
    if (sx < pRect.x - 10 || sx > pRect.x + pRect.w + 10 ||
        sy < pRect.y - 10 || sy > pRect.y + pRect.h + 10) return;

    var elapsed = (performance.now() - h.animStart) / 1000;
    var pulsePhase = Math.sin(elapsed * 4) * 0.5 + 0.5;

    /* Pulsing outer ring */
    var ringR = 8 + pulsePhase * 8;
    ctx.beginPath();
    ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 - pulsePhase * 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* Dashed crosshair */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(sx, pRect.y); ctx.lineTo(sx, pRect.y + pRect.h);
    ctx.moveTo(pRect.x, sy); ctx.lineTo(pRect.x + pRect.w, sy);
    ctx.stroke();
    ctx.restore();

    /* Solid inner dot */
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = h.color; ctx.fill();

    /* Coordinate label */
    var label = '(' + fmtA(h.wx) + ', ' + fmtA(h.wy) + ')';
    ctx.font = 'bold 12px "Courier New", monospace';
    var tw = ctx.measureText(label).width;
    var lx = sx + 14, ly = sy - 14;
    if (lx + tw + 10 > pRect.x + pRect.w) lx = sx - tw - 18;
    if (ly - 16 < pRect.y) ly = sy + 22;
    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.strokeStyle = h.color; ctx.lineWidth = 1;
    roundRect(ctx, lx - 6, ly - 14, tw + 12, 20, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = h.color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, lx, ly);
  }

  /** Bisection refinement: find x where pts cross zero between idx a and b */
  function bisectZero(ast, xA, xB, params) {
    var yA = evaluate(ast, xA, params || {});
    for (var iter = 0; iter < 50; iter++) {
      var xM = (xA + xB) / 2;
      var yM = evaluate(ast, xM, params || {});
      if (!isOk(yM)) return xM;
      if (Math.abs(yM) < 1e-12) return xM;
      if ((yA > 0) !== (yM > 0)) { xB = xM; } else { xA = xM; yA = yM; }
    }
    return (xA + xB) / 2;
  }

  /** Generic bisection: find x in [xA, xB] where fn(x) crosses zero */
  function bisectFnZero(fn, xA, xB) {
    var yA = fn(xA);
    for (var iter = 0; iter < 60; iter++) {
      var xM = (xA + xB) / 2;
      var yM = fn(xM);
      if (!isOk(yM)) return xM;
      if (Math.abs(yM) < 1e-12) return xM;
      if ((yA > 0) !== (yM > 0)) { xB = xM; } else { xA = xM; yA = yM; }
    }
    return (xA + xB) / 2;
  }

  function showAnalysis() {
    var section = $('analysis-section');
    if (!state.ast || state.animState !== 'result') {
      section.style.display = 'none'; return;
    }

    var rootsEl = $('val-roots'), extEl = $('val-extrema'),
        inflEl = $('val-inflection'), yintEl = $('val-yintercept');
    var cntRoots = $('cnt-roots'), cntExt = $('cnt-extrema'), cntInfl = $('cnt-inflection');

    /* Clear old chips */
    rootsEl.innerHTML = ''; extEl.innerHTML = '';
    inflEl.innerHTML = ''; cntRoots.textContent = '';
    cntExt.textContent = ''; cntInfl.textContent = '';

    var v = state.view;
    var funcColor = COLOR_FUNC;
    var derivColor = COLOR_DERIV;
    var integColor = COLOR_INTEG;

    if (state.animType === 'diff') {
      showDiffAnalysis(rootsEl, extEl, inflEl, yintEl, cntRoots, cntExt, cntInfl, v, funcColor, derivColor);
    } else {
      showIntegAnalysis(rootsEl, extEl, inflEl, yintEl, cntRoots, cntExt, cntInfl, v, funcColor, integColor);
    }

    section.style.display = '';
  }

  function showDiffAnalysis(rootsEl, extEl, inflEl, yintEl, cntR, cntE, cntI, v, fCol, dCol) {
    /* ── Roots of f(x) ── */
    var roots = [];
    var nSamples = 500;
    var step = (v.xMax - v.xMin) / nSamples;
    var prevY = evaluate(state.ast, v.xMin);
    for (var i = 1; i <= nSamples; i++) {
      var x = v.xMin + i * step;
      var y = evaluate(state.ast, x);
      if (isOk(prevY) && isOk(y)) {
        if (Math.abs(y) < 1e-10) {
          roots.push(x);
        } else if (prevY * y < 0) {
          /* Verify the sign change is a true root, not a pole (e.g. 1/x) */
          var rCand = bisectZero(state.ast, x - step, x);
          var fCand = evaluate(state.ast, rCand);
          var rootTol = Math.max(1e-8, (Math.abs(prevY) + Math.abs(y)) * 1e-6);
          if (isOk(fCand) && Math.abs(fCand) < rootTol) roots.push(rCand);
        }
      }
      prevY = y;
    }
    /* Dedup */
    var uniqueRoots = [];
    for (var ri = 0; ri < roots.length; ri++) {
      var dup = false;
      for (var rj = 0; rj < uniqueRoots.length; rj++) {
        if (Math.abs(roots[ri] - uniqueRoots[rj]) < step * 0.5) { dup = true; break; }
      }
      if (!dup) uniqueRoots.push(roots[ri]);
    }
    cntR.textContent = uniqueRoots.length;
    if (uniqueRoots.length === 0) {
      rootsEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var r = 0; r < uniqueRoots.length; r++) {
        rootsEl.appendChild(makeChip('x = ' + fmtA(uniqueRoots[r]), 'root', uniqueRoots[r], 0, fCol, 'upper'));
      }
    }

    /* ── Extrema (critical points: f'(x) sign change) ── */
    var crits = [];
    for (var ei = 1; ei < state.derivPts.length - 1; ei++) {
      var dp = state.derivPts[ei], dpPrev = state.derivPts[ei - 1], dpNext = state.derivPts[ei + 1];
      if (isOk(dp.y) && isOk(dpPrev.y) && isOk(dpNext.y)) {
        if ((dpPrev.y > 0 && dpNext.y < 0) || (dpPrev.y < 0 && dpNext.y > 0)) {
          /* Refine the critical point by bisecting f'(x) to zero */
          var cx = bisectFnZero(function (xx) { return numericalDeriv(state.ast, xx); },
                                dpPrev.x, dpNext.x);
          var fx = evaluate(state.ast, cx);
          if (isOk(fx)) {
            crits.push({ x: cx, y: fx, type: dpPrev.y > 0 ? 'max' : 'min' });
          }
        }
      }
    }
    /* Dedup extrema (merge points within 0.5 step of each other) */
    var uCrits = [], cStep = (v.xMax - v.xMin) / 500;
    for (var cdi = 0; cdi < crits.length; cdi++) {
      var cdup = false;
      for (var cdj = 0; cdj < uCrits.length; cdj++) {
        if (Math.abs(crits[cdi].x - uCrits[cdj].x) < cStep * 2) { cdup = true; break; }
      }
      if (!cdup) uCrits.push(crits[cdi]);
    }
    crits = uCrits;
    cntE.textContent = crits.length;
    if (crits.length === 0) {
      extEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var ci = 0; ci < Math.min(crits.length, 8); ci++) {
        var c = crits[ci];
        var cls = c.type === 'max' ? 'ext-max' : 'ext-min';
        var col = c.type === 'max' ? '#3ddc84' : '#ff5555';
        extEl.appendChild(makeChip('(' + fmtA(c.x) + ', ' + fmtA(c.y) + ')', cls, c.x, c.y, col, 'upper'));
      }
    }

    /* ── Inflection points (f''(x) sign change) ── */
    var inflections = [];
    var h = (v.xMax - v.xMin) / 500;
    /* Track the last significant (non-zero) f'' sample so an exact
       grid hit on f'' = 0 doesn't hide the sign change */
    var prevD2 = numericalDeriv2(state.ast, v.xMin);
    var prevD2x = v.xMin;
    if (!isOk(prevD2) || Math.abs(prevD2) < 1e-12) prevD2 = null;
    for (var ii = 1; ii <= 500; ii++) {
      var ix = v.xMin + ii * h;
      var d2 = numericalDeriv2(state.ast, ix);
      if (!isOk(d2) || Math.abs(d2) < 1e-12) {
        if (!isOk(d2)) { prevD2 = null; prevD2x = ix; }
        continue;
      }
      if (prevD2 !== null && prevD2 * d2 < 0 && ix - prevD2x <= 2 * h + 1e-12) {
        /* Refine, then reject poles/discontinuities (e.g. 1/x at x=0):
           at a true inflection f is finite and f'' shrinks toward 0;
           at a pole f blows up and |f''| at the refined point exceeds
           the bracket endpoints. */
        var rx = bisectFnZero(function (xx) { return numericalDeriv2(state.ast, xx); },
                              prevD2x, ix);
        var ify = evaluate(state.ast, rx);
        var rd2 = numericalDeriv2(state.ast, rx);
        var d2Tol = Math.max(1e-6, Math.min(Math.abs(prevD2), Math.abs(d2)));
        if (isOk(ify) && Math.abs(ify) < 1e8 &&
            isOk(rd2) && Math.abs(rd2) <= d2Tol) {
          inflections.push({ x: rx, y: ify });
        }
      }
      prevD2 = d2;
      prevD2x = ix;
    }
    cntI.textContent = inflections.length;
    if (inflections.length === 0) {
      inflEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var ini = 0; ini < Math.min(inflections.length, 8); ini++) {
        var ip = inflections[ini];
        inflEl.appendChild(makeChip('(' + fmtA(ip.x) + ', ' + fmtA(ip.y) + ')', 'inflect', ip.x, ip.y, '#f5c842', 'upper'));
      }
    }

    /* ── Y-intercept ── */
    if (v.xMin <= 0 && v.xMax >= 0) {
      var y0 = evaluate(state.ast, 0);
      if (isOk(y0)) {
        yintEl.textContent = 'f(0) = ' + fmtA(y0);
        yintEl.style.cursor = 'pointer';
        yintEl.onclick = function () {
          var all = document.querySelectorAll('.sb-analysis-chip.active');
          for (var a = 0; a < all.length; a++) all[a].classList.remove('active');
          yintEl.classList.add('active');
          setHighlight(0, y0, fCol, 'yint', 'upper');
        };
      } else {
        yintEl.textContent = '\u2014';
        yintEl.onclick = null;
      }
    } else {
      yintEl.textContent = 'x=0 not in view';
      yintEl.onclick = null;
    }
  }

  function showIntegAnalysis(rootsEl, extEl, inflEl, yintEl, cntR, cntE, cntI, v, fCol, iCol) {
    var pts = state.integPts;
    if (!pts || pts.length === 0) { return; }

    /* ── Zeros of F(x) (sign changes in integral curve) ── */
    var zeros = [];
    for (var i = 1; i < pts.length; i++) {
      if (isOk(pts[i].y) && isOk(pts[i - 1].y)) {
        if (Math.abs(pts[i].y) < 1e-10) {
          zeros.push({ x: pts[i].x, y: 0 });
        } else if (pts[i - 1].y * pts[i].y < 0) {
          /* Linear interpolation for zero crossing */
          var t = pts[i - 1].y / (pts[i - 1].y - pts[i].y);
          var zx = pts[i - 1].x + t * (pts[i].x - pts[i - 1].x);
          zeros.push({ x: zx, y: 0 });
        }
      }
    }
    /* Dedup */
    var uZeros = [];
    var zStep = (v.xMax - v.xMin) / 500;
    for (var zi = 0; zi < zeros.length; zi++) {
      var zdup = false;
      for (var zj = 0; zj < uZeros.length; zj++) {
        if (Math.abs(zeros[zi].x - uZeros[zj].x) < zStep * 3) { zdup = true; break; }
      }
      if (!zdup) uZeros.push(zeros[zi]);
    }
    cntR.textContent = uZeros.length;
    if (uZeros.length === 0) {
      rootsEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var zr = 0; zr < uZeros.length; zr++) {
        rootsEl.appendChild(makeChip('x = ' + fmtA(uZeros[zr].x), 'root integ', uZeros[zr].x, 0, iCol, 'lower'));
      }
    }

    /* ── Extrema of F(x) — where f(x) crosses zero (F'(x) = f(x)) ── */
    var fExtrema = [];
    var nS = 500;
    var fStep = (v.xMax - v.xMin) / nS;
    var prevFy = evaluate(state.ast, v.xMin);
    for (var fi = 1; fi <= nS; fi++) {
      var fx = v.xMin + fi * fStep;
      var fy = evaluate(state.ast, fx);
      if (isOk(prevFy) && isOk(fy) && prevFy * fy < 0) {
        /* f(x) crosses zero → F(x) has extremum */
        var extType = prevFy > 0 ? 'max' : 'min';
        /* Find F(x) value at this point via interpolation in integPts */
        var Fy = 0;
        for (var pi = 0; pi < pts.length; pi++) {
          if (pts[pi].x >= fx) { Fy = isOk(pts[pi].y) ? pts[pi].y : 0; break; }
        }
        fExtrema.push({ x: fx, y: Fy, type: extType });
      }
      prevFy = fy;
    }
    cntE.textContent = fExtrema.length;
    if (fExtrema.length === 0) {
      extEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var fei = 0; fei < Math.min(fExtrema.length, 8); fei++) {
        var fe = fExtrema[fei];
        var feCls = fe.type === 'max' ? 'ext-max' : 'ext-min';
        var feCol = fe.type === 'max' ? '#3ddc84' : '#ff5555';
        extEl.appendChild(makeChip('(' + fmtA(fe.x) + ', ' + fmtA(fe.y) + ')', feCls, fe.x, fe.y, feCol, 'lower'));
      }
    }

    /* ── Inflection of F(x) — where f'(x) = 0 (i.e. extrema of f(x)) ── */
    var fInflect = [];
    var prevDy = numericalDeriv(state.ast, v.xMin);
    for (var ii = 1; ii <= nS; ii++) {
      var ix = v.xMin + ii * fStep;
      var dy = numericalDeriv(state.ast, ix);
      if (isOk(prevDy) && isOk(dy) && prevDy * dy < 0) {
        var Fiy = 0;
        for (var pi2 = 0; pi2 < pts.length; pi2++) {
          if (pts[pi2].x >= ix) { Fiy = isOk(pts[pi2].y) ? pts[pi2].y : 0; break; }
        }
        fInflect.push({ x: ix, y: Fiy });
      }
      prevDy = dy;
    }
    cntI.textContent = fInflect.length;
    if (fInflect.length === 0) {
      inflEl.innerHTML = '<span class="sb-analysis-none">&mdash;</span>';
    } else {
      for (var ini2 = 0; ini2 < Math.min(fInflect.length, 8); ini2++) {
        var ip2 = fInflect[ini2];
        inflEl.appendChild(makeChip('(' + fmtA(ip2.x) + ', ' + fmtA(ip2.y) + ')', 'inflect', ip2.x, ip2.y, '#f5c842', 'lower'));
      }
    }

    /* ── Y-intercept of F(x) — F(0) ── */
    if (v.xMin <= 0 && v.xMax >= 0) {
      var F0 = 0;
      for (var p0 = 0; p0 < pts.length; p0++) {
        if (pts[p0].x >= 0) { F0 = isOk(pts[p0].y) ? pts[p0].y : 0; break; }
      }
      yintEl.textContent = 'F(0) = ' + fmtA(F0);
      yintEl.style.cursor = 'pointer';
      yintEl.onclick = function () {
        var all = document.querySelectorAll('.sb-analysis-chip.active');
        for (var a = 0; a < all.length; a++) all[a].classList.remove('active');
        yintEl.classList.add('active');
        setHighlight(0, F0, iCol, 'yint', 'lower');
      };
    } else {
      yintEl.textContent = 'x=0 not in view';
      yintEl.onclick = null;
    }
  }


  /* ═══════════════════════════════════════════════════════════
     S21 ── Floating Label
     ═══════════════════════════════════════════════════════════ */

  function showFloatingLabel(sx, sy, text) {
    var el = $('floating-label');
    el.textContent = text;
    el.style.display = '';
    el.style.left = clamp(sx - 40, 0, W - 120) + 'px';
    el.style.top  = clamp(sy, 0, H - 24) + 'px';
  }

  function hideFloatingLabel() {
    $('floating-label').style.display = 'none';
  }


  /* ═══════════════════════════════════════════════════════════
     S22 ── Pan & Zoom
     ═══════════════════════════════════════════════════════════ */

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (e.target !== canvas) return;
    var pos = canvasCoords(e);

    /* Sketch tool — begin new stroke */
    if (state.tool === 'sketch') {
      state.activeStroke = {
        points: [{ wx: toWXu(pos.x), wy: toWYu(pos.y), p: e.pressure || 0.5 }],
        color: state.sketchColor, width: state.sketchWidth
      };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    /* Shape tool — begin new shape */
    if (state.tool === 'shape' && state.shapeType !== 'text') {
      var swx = toWXu(pos.x), swy = toWYu(pos.y);
      state.activeShape = {
        type: state.shapeType, wx1: swx, wy1: swy, wx2: swx, wy2: swy,
        color: state.shapeColor, width: state.shapeWidth, filled: state.shapeFilled, rotation: 0
      };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    /* Point tool — place coordinate point on upper or lower panel */
    if (state.tool === 'point') {
      var ptPanel = whichPanel(pos.y);
      saveUndo();
      if (ptPanel === 'lower' && state.split) {
        addGraphPoint(toWXl(pos.x), toWYl(pos.y), 'lower');
      } else {
        addGraphPoint(toWXu(pos.x), toWYu(pos.y), 'upper');
      }
      e.preventDefault();
      return;
    }

    /* Move mode — check annotation interactions */
    if (state.tool === 'move') {
      /* Check action icon clicks */
      if (state.selectedAnnotation >= 0) {
        if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn)) { deleteSelectedAnnotation(); return; }
        if (hitBtn(pos.x, pos.y, selectionUI.dupBtn)) { duplicateSelectedAnnotation(); return; }
        if (hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) { rotateSelectedAnnotation(); return; }
        var bounds = getSelectionBounds();
        var corner = hitCorner(pos.x, pos.y, bounds);
        if (corner) {
          state.dragAnnotation = {
            type: state.selectedAnnotationType, idx: state.selectedAnnotation,
            lastWx: toWXu(pos.x), lastWy: toWYu(pos.y), corner: corner
          };
          canvas.setPointerCapture(e.pointerId);
          canvas.style.cursor = (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize';
          return;
        }
      }

      var hit = findNearestAnnotation(pos.x, pos.y);
      if (hit) {
        state.selectedAnnotation = hit.idx;
        state.selectedAnnotationType = hit.type;
        saveUndo();
        var hitIsLower = hit.type === 'point' && state.points[hit.idx] && state.points[hit.idx].panel === 'lower';
        state.dragAnnotation = { type: hit.type, idx: hit.idx,
          lastWx: hitIsLower ? toWXl(pos.x) : toWXu(pos.x),
          lastWy: hitIsLower ? toWYl(pos.y) : toWYu(pos.y), corner: null };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'move';
        draw();
        return;
      }
      /* Click inside selection box */
      if (state.selectedAnnotation >= 0) {
        var sBounds = getSelectionBounds();
        if (sBounds && sBounds.corners && pointInPolygon(pos.x, pos.y, sBounds.corners)) {
          var sbIsLower = state.selectedAnnotationType === 'point' && state.points[state.selectedAnnotation] && state.points[state.selectedAnnotation].panel === 'lower';
          state.dragAnnotation = {
            type: state.selectedAnnotationType, idx: state.selectedAnnotation,
            lastWx: sbIsLower ? toWXl(pos.x) : toWXu(pos.x),
            lastWy: sbIsLower ? toWYl(pos.y) : toWYu(pos.y), corner: null
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

    /* Fall through to pan */
    var sx = pos.x, sy = pos.y;
    state.panning = true;
    state.panStart = { x: sx, y: sy };

    if (state.split && sy > H * state.splitRatio) {
      state.panWhich = 'lower';
      state.panViewStart = {
        xMin: state.view.xMin, xMax: state.view.xMax,
        yMin: state.lowerView.yMin, yMax: state.lowerView.yMax
      };
    } else {
      state.panWhich = 'upper';
      state.panViewStart = {
        xMin: state.view.xMin, xMax: state.view.xMax,
        yMin: state.view.yMin, yMax: state.view.yMax
      };
    }

    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onPointerMove(e) {
    var pos = canvasCoords(e);
    state.cursorPos = pos;

    /* Sketch — append point */
    if (state.tool === 'sketch' && state.activeStroke) {
      state.activeStroke.points.push({ wx: toWXu(pos.x), wy: toWYu(pos.y), p: e.pressure || 0.5 });
      draw();
      return;
    }

    /* Annotation drag */
    if (state.dragAnnotation) {
      /* Use panel-aware transforms for lower-panel points */
      var dragIsLower = state.dragAnnotation.type === 'point' &&
                        state.points[state.dragAnnotation.idx] &&
                        state.points[state.dragAnnotation.idx].panel === 'lower';
      var nowWx = dragIsLower ? toWXl(pos.x) : toWXu(pos.x);
      var nowWy = dragIsLower ? toWYl(pos.y) : toWYu(pos.y);

      if (state.dragAnnotation.corner) {
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
          var rst = state.strokes[state.dragAnnotation.idx];
          if (rst && rst.points.length > 0) {
            var dwx = nowWx - state.dragAnnotation.lastWx;
            var dwy = nowWy - state.dragAnnotation.lastWy;
            var sb = getSelectionBounds();
            if (sb) {
              var anchorWx, anchorWy;
              var rc = state.dragAnnotation.corner;
              if (rc === 'nw')      { anchorWx = toWXu(sb.maxX); anchorWy = toWYu(sb.maxY); }
              else if (rc === 'ne') { anchorWx = toWXu(sb.minX); anchorWy = toWYu(sb.maxY); }
              else if (rc === 'sw') { anchorWx = toWXu(sb.maxX); anchorWy = toWYu(sb.minY); }
              else                  { anchorWx = toWXu(sb.minX); anchorWy = toWYu(sb.minY); }
              var oldW = toWXu(sb.maxX) - toWXu(sb.minX);
              var oldH = toWYu(sb.minY) - toWYu(sb.maxY);
              var newW = oldW + (rc === 'nw' || rc === 'sw' ? -dwx : dwx);
              var newH = oldH + (rc === 'nw' || rc === 'ne' ? dwy : -dwy);
              if (Math.abs(oldW) > 0.001 && Math.abs(oldH) > 0.001) {
                var ssx = newW / oldW, ssy = newH / oldH;
                for (var si = 0; si < rst.points.length; si++) {
                  rst.points[si].wx = anchorWx + (rst.points[si].wx - anchorWx) * ssx;
                  rst.points[si].wy = anchorWy + (rst.points[si].wy - anchorWy) * ssy;
                }
              }
            }
          }
        }
      } else {
        var tdwx = nowWx - state.dragAnnotation.lastWx;
        var tdwy = nowWy - state.dragAnnotation.lastWy;
        if (state.dragAnnotation.type === 'shape') {
          var sh = state.shapes[state.dragAnnotation.idx];
          if (sh) { sh.wx1 += tdwx; sh.wy1 += tdwy; sh.wx2 += tdwx; sh.wy2 += tdwy; }
        } else if (state.dragAnnotation.type === 'stroke') {
          var stk = state.strokes[state.dragAnnotation.idx];
          if (stk) {
            for (var pi = 0; pi < stk.points.length; pi++) {
              stk.points[pi].wx += tdwx;
              stk.points[pi].wy += tdwy;
            }
          }
        } else if (state.dragAnnotation.type === 'point') {
          var dpt = state.points[state.dragAnnotation.idx];
          if (dpt) {
            dpt.wx += tdwx; dpt.wy += tdwy;
            dpt.snapped = false;
            /* Re-snap to appropriate curve based on panel */
            if (dpt.panel === 'upper' && state.ast) {
              var curveY = evaluate(state.ast, dpt.wx, {});
              if (isOk(curveY)) {
                var csy = toSYu(curveY), psy = toSYu(dpt.wy);
                if (Math.abs(csy - psy) < 40) { dpt.wy = curveY; dpt.snapped = true; }
              }
            } else if (dpt.panel === 'lower' && state.split) {
              var dlPts = state.animType === 'diff' ? state.derivPts : state.integPts;
              if (dlPts && dlPts.length > 0) {
                var dNear = -1, dNearDx = Infinity;
                for (var dk = 0; dk < dlPts.length; dk++) {
                  var ddx2 = Math.abs(dlPts[dk].x - dpt.wx);
                  if (ddx2 < dNearDx) { dNearDx = ddx2; dNear = dk; }
                }
                if (dNear >= 0 && isOk(dlPts[dNear].y)) {
                  var dcsy = toSYl(dlPts[dNear].y), dpsy = toSYl(dpt.wy);
                  if (Math.abs(dcsy - dpsy) < 40) { dpt.wy = dlPts[dNear].y; dpt.snapped = true; }
                }
              }
            }
          }
        }
      }
      state.dragAnnotation.lastWx = nowWx;
      state.dragAnnotation.lastWy = nowWy;
      draw();
      return;
    }

    /* Hover cursor feedback in move mode */
    if (state.tool === 'move' && !state.panning) {
      var hBounds = getSelectionBounds();
      var hCorner = hitCorner(pos.x, pos.y, hBounds);
      if (hCorner) {
        canvas.style.cursor = (hCorner === 'nw' || hCorner === 'se') ? 'nwse-resize' : 'nesw-resize';
      } else if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn) || hitBtn(pos.x, pos.y, selectionUI.dupBtn) || hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) {
        canvas.style.cursor = 'pointer';
      } else if (hBounds && hBounds.corners && pointInPolygon(pos.x, pos.y, hBounds.corners)) {
        canvas.style.cursor = 'move';
      } else if (findNearestAnnotation(pos.x, pos.y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }

    /* Calculus tool hover — update trace point */
    if (state.tool === 'tangent' || state.tool === 'derivative' || state.tool === 'integral') {
      updateHoverPoint(pos.x, pos.y);
      canvas.style.cursor = state.hoverPoint ? 'pointer' : 'crosshair';
      draw();
    }

    /* Shape tool — update endpoint */
    if (state.tool === 'shape' && state.activeShape) {
      state.activeShape.wx2 = toWXu(pos.x);
      state.activeShape.wy2 = toWYu(pos.y);
      draw();
      return;
    }

    /* Pan */
    if (!state.panning) return;
    var sx = pos.x, sy = pos.y;
    var dx = sx - state.panStart.x;
    var dy = sy - state.panStart.y;

    var pv = state.panViewStart;
    var xRange = pv.xMax - pv.xMin;
    var yRange = pv.yMax - pv.yMin;

    var panRect = state.panWhich === 'lower' ? lowerRect() : upperRect();
    var wxDelta = -dx / panRect.w * xRange;
    var wyDelta = dy / panRect.h * yRange;

    if (state.panWhich === 'upper') {
      state.view.xMin = pv.xMin + wxDelta;
      state.view.xMax = pv.xMax + wxDelta;
      state.view.yMin = pv.yMin + wyDelta;
      state.view.yMax = pv.yMax + wyDelta;
    } else {
      state.view.xMin = pv.xMin + wxDelta;
      state.view.xMax = pv.xMax + wxDelta;
      state.lowerView.yMin = pv.yMin + wyDelta;
      state.lowerView.yMax = pv.yMax + wyDelta;
    }

    draw();
  }

  function onPointerUp(e) {
    /* Annotation drag — finalize */
    if (state.dragAnnotation) {
      state.dragAnnotation = null;
      if (canvas) canvas.style.cursor = 'crosshair';
      draw();
      return;
    }

    /* Sketch — finalize and auto-exit */
    if (state.tool === 'sketch' && state.activeStroke) {
      if (state.activeStroke.points.length >= 2) {
        state.strokes.push(state.activeStroke);
      }
      state.activeStroke = null;
      draw();
      setTool('move');
      return;
    }

    /* Shape — finalize and auto-exit */
    if (state.tool === 'shape') {
      if (state.activeShape) {
        var sdx = toSXu(state.activeShape.wx2) - toSXu(state.activeShape.wx1);
        var sdy = toSYu(state.activeShape.wy2) - toSYu(state.activeShape.wy1);
        if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) {
          state.shapes.push(state.activeShape);
        }
        state.activeShape = null;
        draw();
        setTool('move');
        return;
      }
      if (state.shapeType === 'text') {
        var tpos = canvasCoords(e);
        showShapeTextInput(toWXu(tpos.x), toWYu(tpos.y));
        return;
      }
    }

    /* Calculus tools — tangent, derivative, integral */
    if (!state.panning || (state.panning && state.panStart)) {
      var clickPos = canvasCoords(e);
      updateHoverPoint(clickPos.x, clickPos.y);
      if (state.tool === 'tangent' && state.hoverPoint) {
        addTangentAt(state.hoverPoint.wx);
      } else if ((state.tool === 'derivative' || state.tool === 'integral') && state.hoverPoint) {
        handleTwoClickTool();
      }
    }

    if (state.panning) {
      state.panning = false;
      canvas.style.cursor = state.tool === 'move' ? 'crosshair' : 'crosshair';
    }
  }

  function zoom(factor, centerX, centerY) {
    /* Default to center of upper panel */
    if (centerX === undefined) centerX = (state.view.xMin + state.view.xMax) / 2;
    if (centerY === undefined) centerY = (state.view.yMin + state.view.yMax) / 2;

    var xRange = state.view.xMax - state.view.xMin;
    var yRange = state.view.yMax - state.view.yMin;
    var newXRange = xRange * factor;
    var newYRange = yRange * factor;

    /* Clamp zoom range */
    if (newXRange < 0.01 || newXRange > 10000) return;

    var xFrac = (centerX - state.view.xMin) / xRange;
    var yFrac = (centerY - state.view.yMin) / yRange;

    state.view.xMin = centerX - xFrac * newXRange;
    state.view.xMax = centerX + (1 - xFrac) * newXRange;
    state.view.yMin = centerY - yFrac * newYRange;
    state.view.yMax = centerY + (1 - yFrac) * newYRange;

    draw();
  }

  function onWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var uR = upperRect();
    var wx = toWX(sx, uR, state.view);
    var wy = toWY(sy, uR, state.view);
    var factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    zoom(factor, wx, wy);
  }


  /* ═══════════════════════════════════════════════════════════
     S23 ── Export PNG
     ═══════════════════════════════════════════════════════════ */

  function drawWatermark() {
    ctx.save();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.scale(dpr, dpr);
    ctx.font = 'bold 14px ' + getComputedStyle(document.documentElement).getPropertyValue('--font').trim();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('NHIT VisualLab', W - 12, H - 10);
    ctx.restore();
  }

  function exportPNG() {
    draw();
    drawWatermark();
    var link = document.createElement('a');
    link.download = 'calculus-visualizer.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    draw();
  }

  function exportCleanPNG() {
    var wasVisible = state.showAnnotations;
    state.showAnnotations = false;
    draw();
    drawWatermark();
    var url = canvas.toDataURL('image/png');
    state.showAnnotations = wasVisible;
    draw();
    var link = document.createElement('a');
    link.download = 'calculus-visualizer-clean.png';
    link.href = url;
    link.click();
  }


  /* ═══════════════════════════════════════════════════════════
     S24 ── Fullscreen
     ═══════════════════════════════════════════════════════════ */

  var isFullscreen = false;

  function toggleFullscreen() {
    var wrap = $('canvas-wrap');
    if (!isFullscreen) {
      if (wrap.requestFullscreen) wrap.requestFullscreen();
      else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
      wrap.classList.add('fullscreen');
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      wrap.classList.remove('fullscreen');
      isFullscreen = false;
    }
    setTimeout(function () { sizeCanvas(); draw(); }, 200);
  }

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) {
      $('canvas-wrap').classList.remove('fullscreen');
      isFullscreen = false;
      sizeCanvas();
      draw();
    }
  });


  /* ═══════════════════════════════════════════════════════════
     S25 ── Mode Switching
     ═══════════════════════════════════════════════════════════ */

  function switchMode(mode) {
    state.mode = mode;

    /* Update pills */
    var pills = document.querySelectorAll('#mode-tabs .pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', pills[i].getAttribute('data-value') === mode);
    }

    /* Hide all panels */
    $('sim-panel').style.display = 'none';
    $('preset-bar').style.display = 'none';
    $('explore-wrapper').style.display = 'none';
    $('practice-wrapper').style.display = 'none';
    $('quiz-wrapper').style.display = 'none';

    if (mode === 'simulate') {
      $('sim-panel').style.display = '';
      $('preset-bar').style.display = '';
    } else if (mode === 'explore') {
      $('explore-wrapper').style.display = '';
      renderExplore();
    } else if (mode === 'practice') {
      $('practice-wrapper').style.display = '';
      if (!practiceState.started) initPractice();
    } else if (mode === 'quiz') {
      $('quiz-wrapper').style.display = '';
      if (!quizState.started) renderQuizStart();
    }
  }


  /* ═══════════════════════════════════════════════════════════
     S25a ── Explore Mode — 12 Concept Cards
     ═══════════════════════════════════════════════════════════ */

  var CONCEPTS = [
    {
      name: 'Limit Definition of Derivative',
      formula: "f'(x) = lim(h->0) [f(x+h) - f(x)] / h",
      desc: 'The derivative is defined as the limit of the difference quotient as h approaches zero. This captures the instantaneous rate of change at a point.',
      example: "f(x) = x^2: lim(h->0) [(x+h)^2 - x^2]/h = lim(h->0) [2xh + h^2]/h = 2x"
    },
    {
      name: 'Power Rule',
      formula: 'd/dx [x^n] = n * x^(n-1)',
      desc: 'The most fundamental differentiation rule. Multiply by the exponent, then reduce the exponent by one.',
      example: "d/dx [x^5] = 5x^4,  d/dx [x^(-2)] = -2x^(-3)"
    },
    {
      name: 'Product Rule',
      formula: "d/dx [u*v] = u'*v + u*v'",
      desc: 'When differentiating a product of two functions, take the derivative of the first times the second, plus the first times the derivative of the second.',
      example: "d/dx [x*sin(x)] = sin(x) + x*cos(x)"
    },
    {
      name: 'Quotient Rule',
      formula: "d/dx [u/v] = (u'*v - u*v') / v^2",
      desc: 'For a ratio of two functions: the derivative of the top times the bottom, minus the top times the derivative of the bottom, all over the bottom squared.',
      example: "d/dx [sin(x)/x] = (cos(x)*x - sin(x)) / x^2"
    },
    {
      name: 'Chain Rule',
      formula: "d/dx [f(g(x))] = f'(g(x)) * g'(x)",
      desc: 'For composite functions, differentiate the outer function (keeping the inner function unchanged) and multiply by the derivative of the inner function.',
      example: "d/dx [sin(x^2)] = cos(x^2) * 2x"
    },
    {
      name: 'Trigonometric Derivatives',
      formula: "d/dx [sin(x)] = cos(x),  d/dx [cos(x)] = -sin(x)",
      desc: 'Sine differentiates to cosine, cosine differentiates to negative sine. This cyclic pattern repeats every four derivatives.',
      example: "d/dx [tan(x)] = sec^2(x) = 1/cos^2(x)"
    },
    {
      name: 'Exponential & Log Derivatives',
      formula: "d/dx [e^x] = e^x,  d/dx [ln(x)] = 1/x",
      desc: 'The exponential function is its own derivative. The natural log differentiates to the reciprocal function.',
      example: "d/dx [e^(3x)] = 3e^(3x) (chain rule),  d/dx [ln(x^2)] = 2/x"
    },
    {
      name: 'Riemann Sums',
      formula: 'Sum(i=1..n) f(x_i) * dx',
      desc: 'Approximate the area under a curve by dividing it into n rectangles. As n approaches infinity, the sum converges to the definite integral.',
      example: "integral(0 to 1) x^2 dx: midpoint rule with n=4 rectangles, approx = 0.328125; more rectangles converge to the exact value 1/3"
    },
    {
      name: 'Fundamental Theorem of Calculus',
      formula: 'integral(a to b) f(x)dx = F(b) - F(a)',
      desc: 'Connects differentiation and integration. The definite integral of f(x) from a to b equals the antiderivative evaluated at b minus at a.',
      example: "integral(0 to pi) sin(x)dx = [-cos(x)](0 to pi) = -cos(pi) + cos(0) = 2"
    },
    {
      name: 'Integration by Substitution',
      formula: 'integral f(g(x)) * g\'(x) dx = integral f(u) du',
      desc: 'The reverse of the chain rule. Substitute u = g(x) to simplify the integral, then convert back to the original variable.',
      example: "integral 2x*cos(x^2) dx: let u = x^2, du = 2x dx => integral cos(u) du = sin(u) = sin(x^2)"
    },
    {
      name: 'Mean Value Theorem',
      formula: "f'(c) = [f(b) - f(a)] / (b - a)",
      desc: 'For a continuous, differentiable function on [a,b], there exists at least one point c where the instantaneous rate equals the average rate over the interval.',
      example: "f(x) = x^2 on [1,3]: avg rate = (9-1)/2 = 4, f'(c) = 2c = 4 => c = 2"
    },
    {
      name: 'Applications: Area Under Curve',
      formula: 'A = integral(a to b) |f(x)| dx',
      desc: 'The definite integral computes the signed area between f(x) and the x-axis. Use absolute value for total (unsigned) area.',
      example: "Area under y = x^2 from 0 to 3: integral(0 to 3) x^2 dx = [x^3/3](0 to 3) = 9"
    }
  ];

  function renderExplore() {
    var el = $('explore-content');
    var html = '<div class="explore-grid">';
    for (var i = 0; i < CONCEPTS.length; i++) {
      var c = CONCEPTS[i];
      html += '<div class="concept-card">';
      html += '<div class="concept-card-name">' + escHtml(c.name) + '</div>';
      html += '<div class="concept-card-formula">' + escHtml(c.formula) + '</div>';
      html += '<div class="concept-card-desc">' + escHtml(c.desc) + '</div>';
      html += '<div class="concept-card-example">' + escHtml(c.example) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }


  /* ═══════════════════════════════════════════════════════════
     S25b ── Practice Mode — 6 Problem Types
     ═══════════════════════════════════════════════════════════ */

  var practiceState = {
    started: false,
    current: null,
    score: 0,
    total: 0,
    answered: false
  };

  var PRACTICE_POOL = [
    /* Type 1: Symbolic derivative */
    {
      type: 'symbolic_deriv',
      generate: function () {
        var variants = [
          { expr: '3x^4', answer: '12x^3', display: 'Find f\'(x) for f(x) = 3x^4' },
          { expr: '5x^3', answer: '15x^2', display: 'Find f\'(x) for f(x) = 5x^3' },
          { expr: '2x^5', answer: '10x^4', display: 'Find f\'(x) for f(x) = 2x^5' },
          { expr: '7x^2', answer: '14x', display: 'Find f\'(x) for f(x) = 7x^2' },
          { expr: '4x^6', answer: '24x^5', display: 'Find f\'(x) for f(x) = 4x^6' }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    },
    /* Type 2: Derivative at a point */
    {
      type: 'deriv_at_point',
      generate: function () {
        var variants = [
          { display: "Find f'(2) for f(x) = sin(x)", answer: String(roundSig(Math.cos(2), 4)), tolerance: 0.01 },
          { display: "Find f'(1) for f(x) = e^x", answer: String(roundSig(Math.E, 4)), tolerance: 0.05 },
          { display: "Find f'(3) for f(x) = x^2", answer: '6', tolerance: 0.01 },
          { display: "Find f'(0) for f(x) = cos(x)", answer: '0', tolerance: 0.01 },
          { display: "Find f'(1) for f(x) = ln(x)", answer: '1', tolerance: 0.01 }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    },
    /* Type 3: Definite integral */
    {
      type: 'definite_integral',
      generate: function () {
        var variants = [
          { display: 'Evaluate: integral(0 to pi) sin(x) dx = ?', answer: '2', tolerance: 0.05 },
          { display: 'Evaluate: integral(0 to 1) x^2 dx = ?', answer: String(roundSig(1/3, 4)), tolerance: 0.02 },
          { display: 'Evaluate: integral(1 to e) 1/x dx = ?', answer: '1', tolerance: 0.05 },
          { display: 'Evaluate: integral(0 to pi/2) cos(x) dx = ?', answer: '1', tolerance: 0.05 },
          { display: 'Evaluate: integral(0 to 1) e^x dx = ?', answer: String(roundSig(Math.E - 1, 4)), tolerance: 0.05 }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    },
    /* Type 4: Critical point */
    {
      type: 'critical_point',
      generate: function () {
        var variants = [
          { display: 'At what x does f(x) = x^3 - 3x have a local max?', answer: '-1', tolerance: 0.1, hint: "f'(x) = 3x^2 - 3 = 0 => x = -1 (max), x = 1 (min)" },
          { display: 'At what x does f(x) = -x^2 + 4x have a local max?', answer: '2', tolerance: 0.1, hint: "f'(x) = -2x + 4 = 0 => x = 2" },
          { display: 'At what x does f(x) = x^3 - 12x have a local min?', answer: '2', tolerance: 0.1, hint: "f'(x) = 3x^2 - 12 = 0 => x = 2 (min)" }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    },
    /* Type 5: Slope at a point */
    {
      type: 'slope_at_point',
      generate: function () {
        var variants = [
          { display: 'What is the slope of x^2 at x = 3?', answer: '6', tolerance: 0.01 },
          { display: 'What is the slope of x^3 at x = 2?', answer: '12', tolerance: 0.01 },
          { display: 'What is the slope of sin(x) at x = 0?', answer: '1', tolerance: 0.01 },
          { display: 'What is the slope of e^x at x = 0?', answer: '1', tolerance: 0.01 },
          { display: 'What is the slope of x^2 at x = -1?', answer: '-2', tolerance: 0.01 }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    },
    /* Type 6: Monotonicity */
    {
      type: 'monotonicity',
      generate: function () {
        var variants = [
          { display: 'Is f(x) = x^3 increasing or decreasing at x = -1?', answer: 'increasing', hint: "f'(-1) = 3(-1)^2 = 3 > 0" },
          { display: 'Is f(x) = -x^2 increasing or decreasing at x = 3?', answer: 'decreasing', hint: "f'(3) = -6 < 0" },
          { display: 'Is f(x) = e^x increasing or decreasing at x = -5?', answer: 'increasing', hint: "f'(x) = e^x > 0 always" },
          { display: 'Is f(x) = cos(x) increasing or decreasing at x = 1?', answer: 'decreasing', hint: "f'(1) = -sin(1) < 0" },
          { display: 'Is f(x) = ln(x) increasing or decreasing at x = 2?', answer: 'increasing', hint: "f'(2) = 1/2 > 0" }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
      }
    }
  ];

  function initPractice() {
    practiceState.started = true;
    practiceState.score = 0;
    practiceState.total = 0;
    practiceState.answered = false;
    nextPractice();
  }

  function nextPractice() {
    var poolIdx = Math.floor(Math.random() * PRACTICE_POOL.length);
    practiceState.current = PRACTICE_POOL[poolIdx].generate();
    practiceState.current._type = PRACTICE_POOL[poolIdx].type;
    practiceState.answered = false;
    renderPractice();
  }

  function renderPractice() {
    var el = $('practice-content');
    var p = practiceState.current;
    var isWordAnswer = p._type === 'monotonicity';

    var html = '<div class="practice-panel">';
    html += '<div class="practice-problem">';
    html += '<div class="practice-problem-label">Problem ' + (practiceState.total + 1) + '</div>';
    html += '<div class="practice-problem-text">' + escHtml(p.display) + '</div>';

    if (isWordAnswer) {
      html += '<div class="practice-input-row">';
      html += '<button class="practice-btn secondary" id="ans-increasing" onclick="">Increasing</button>';
      html += '<button class="practice-btn secondary" id="ans-decreasing" onclick="">Decreasing</button>';
      html += '</div>';
    } else {
      html += '<div class="practice-input-row">';
      html += '<input type="text" class="practice-input" id="practice-answer" placeholder="Your answer" autocomplete="off" />';
      html += '<button class="practice-btn" id="practice-check">Check</button>';
      html += '</div>';
    }

    html += '<div id="practice-feedback"></div>';
    html += '</div>';
    html += '<div class="practice-score">Score: ' + practiceState.score + ' / ' + practiceState.total + '</div>';
    html += '</div>';

    el.innerHTML = html;

    /* Bind events */
    if (isWordAnswer) {
      var btnInc = $('ans-increasing');
      var btnDec = $('ans-decreasing');
      if (btnInc) btnInc.addEventListener('click', function () { checkPractice('increasing'); });
      if (btnDec) btnDec.addEventListener('click', function () { checkPractice('decreasing'); });
    } else {
      var checkBtn = $('practice-check');
      var inp = $('practice-answer');
      if (checkBtn) checkBtn.addEventListener('click', function () { checkPractice(inp.value.trim()); });
      if (inp) inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkPractice(inp.value.trim());
      });
    }
  }

  function checkPractice(userAnswer) {
    if (practiceState.answered) return;
    practiceState.answered = true;
    practiceState.total++;

    var p = practiceState.current;
    var correct = false;
    var fb = $('practice-feedback');
    var feedHtml = '';

    if (p._type === 'monotonicity') {
      correct = userAnswer.toLowerCase() === p.answer.toLowerCase();
    } else if (p._type === 'symbolic_deriv') {
      /* Normalize: remove spaces, lowercase compare */
      var norm = userAnswer.replace(/\s+/g, '').replace(/\*/g, '').toLowerCase();
      var ans = p.answer.replace(/\s+/g, '').replace(/\*/g, '').toLowerCase();
      correct = norm === ans;
    } else {
      /* Numerical comparison */
      var numVal = parseFloat(userAnswer);
      var expected = parseFloat(p.answer);
      var tol = p.tolerance || 0.1;
      if (!isNaN(numVal) && !isNaN(expected)) {
        correct = Math.abs(numVal - expected) <= tol;
      }
    }

    if (correct) {
      practiceState.score++;
      feedHtml = '<div class="practice-feedback correct">Correct!</div>';
    } else {
      feedHtml = '<div class="practice-feedback wrong">Incorrect. The answer is: ' + escHtml(p.answer) + '</div>';
      if (p.hint) feedHtml += '<div style="font-size:0.82rem;color:var(--text-dim);margin-top:6px">' + escHtml(p.hint) + '</div>';
    }

    feedHtml += '<div class="practice-actions">';
    feedHtml += '<button class="practice-btn" id="practice-next">Next Problem</button>';
    feedHtml += '</div>';
    feedHtml += '<div class="practice-score" style="margin-top:8px">Score: ' + practiceState.score + ' / ' + practiceState.total + '</div>';

    fb.innerHTML = feedHtml;
    $('practice-next').addEventListener('click', nextPractice);
  }


  /* ═══════════════════════════════════════════════════════════
     S25c ── Quiz Mode — 15 questions, 5 per round
     ═══════════════════════════════════════════════════════════ */

  var QUIZ_POOL = [
    { q: "What is d/dx [x^4]?", opts: ['4x^3', '3x^4', 'x^3', '4x^4'], correct: 0 },
    { q: "What is d/dx [sin(x)]?", opts: ['sin(x)', '-cos(x)', 'cos(x)', 'tan(x)'], correct: 2 },
    { q: "What is d/dx [e^x]?", opts: ['x*e^(x-1)', 'e^x', 'e^(x-1)', 'x*e^x'], correct: 1 },
    { q: "What is d/dx [ln(x)]?", opts: ['ln(x)/x', '1/x', 'x', '1/x^2'], correct: 1 },
    { q: "What is integral(0 to 1) 2x dx?", opts: ['0.5', '1', '2', '0'], correct: 1 },
    { q: "Using the product rule, d/dx [x*cos(x)] = ?", opts: ['cos(x) - x*sin(x)', '-x*sin(x)', 'cos(x) + x*sin(x)', 'x*cos(x) - sin(x)'], correct: 0 },
    { q: "What is the derivative of tan(x)?", opts: ['sec(x)', 'cos^2(x)', '1/cos^2(x)', 'sin^2(x)'], correct: 2 },
    { q: "integral(0 to pi) sin(x) dx = ?", opts: ['0', '1', 'pi', '2'], correct: 3 },
    { q: "If f'(x) = 0 and f''(x) < 0, then x is a:", opts: ['Local minimum', 'Inflection point', 'Local maximum', 'Saddle point'], correct: 2 },
    { q: "What is d/dx [x^2 * e^x]?", opts: ['2x*e^x', 'e^x*(x^2 + 2x)', 'x^2*e^x', '2x*e^x + x^2'], correct: 1 },
    { q: "The Fundamental Theorem of Calculus states that:", opts: ['All functions are differentiable', 'Differentiation and integration are inverse processes', 'Every function has an antiderivative', 'Limits always exist'], correct: 1 },
    { q: "What is d/dx [cos(3x)]?", opts: ['3*sin(3x)', '-sin(3x)', '-3*sin(3x)', 'cos(3x)'], correct: 2 },
    { q: "What is integral(0 to 1) x^2 dx?", opts: ['1/2', '1', '1/3', '2/3'], correct: 2 },
    { q: "If f(x) = x^3 - 3x, f'(x) = 0 at:", opts: ['x = 0', 'x = 1 and x = -1', 'x = 3', 'x = sqrt(3)'], correct: 1 },
    { q: "d/dx [sqrt(x)] = ?", opts: ['1/(2*sqrt(x))', 'sqrt(x)/2', '2*sqrt(x)', '1/sqrt(x)'], correct: 0 }
  ];

  var quizState = {
    started: false,
    questions: [],
    current: 0,
    score: 0,
    selected: -1,
    answered: false,
    timer: 0,
    timerInterval: null,
    totalTime: 120  /* 2 minutes per round */
  };

  function renderQuizStart() {
    var el = $('quiz-content');
    var html = '<div class="quiz-panel">';
    html += '<div class="quiz-results">';
    html += '<h2>Calculus Quiz</h2>';
    html += '<p class="score-label">5 multiple-choice questions, 2 minutes<br>Test your knowledge of derivatives and integrals</p>';
    html += '<div class="quiz-actions"><button class="practice-btn" id="quiz-start-btn">Start Quiz</button></div>';
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
    $('quiz-start-btn').addEventListener('click', startQuiz);
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startQuiz() {
    quizState.started = true;
    quizState.questions = shuffleArray(QUIZ_POOL).slice(0, 5);
    quizState.current = 0;
    quizState.score = 0;
    quizState.selected = -1;
    quizState.answered = false;
    quizState.timer = quizState.totalTime;

    if (quizState.timerInterval) clearInterval(quizState.timerInterval);
    quizState.timerInterval = setInterval(function () {
      quizState.timer--;
      updateQuizTimer();
      if (quizState.timer <= 0) {
        clearInterval(quizState.timerInterval);
        quizState.timerInterval = null;
        showQuizResults();
      }
    }, 1000);

    renderQuizQuestion();
  }

  function updateQuizTimer() {
    var el = document.getElementById('quiz-timer');
    if (el) {
      var m = Math.floor(quizState.timer / 60);
      var s = quizState.timer % 60;
      el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }
  }

  function renderQuizQuestion() {
    var el = $('quiz-content');
    var q = quizState.questions[quizState.current];
    var m = Math.floor(quizState.timer / 60);
    var s = quizState.timer % 60;
    var letters = ['A', 'B', 'C', 'D'];

    var html = '<div class="quiz-panel">';
    /* Header */
    html += '<div class="quiz-header">';
    html += '<span class="quiz-header-item">Q <strong>' + (quizState.current + 1) + '</strong> / 5</span>';
    html += '<span class="quiz-header-item">Score: <strong>' + quizState.score + '</strong></span>';
    html += '<span class="quiz-timer" id="quiz-timer">' + m + ':' + (s < 10 ? '0' : '') + s + '</span>';
    html += '</div>';

    /* Question */
    html += '<div class="quiz-question">';
    html += '<div class="quiz-q-label">Question ' + (quizState.current + 1) + '</div>';
    html += '<div class="quiz-q-text">' + escHtml(q.q) + '</div>';
    html += '<div class="quiz-options" id="quiz-options">';
    for (var i = 0; i < q.opts.length; i++) {
      html += '<div class="quiz-option" data-idx="' + i + '">';
      html += '<span class="quiz-option-letter">' + letters[i] + '</span>';
      html += '<span>' + escHtml(q.opts[i]) + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div id="quiz-feedback"></div>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;

    /* Bind option clicks */
    var opts = document.querySelectorAll('#quiz-options .quiz-option');
    for (var j = 0; j < opts.length; j++) {
      opts[j].addEventListener('click', onQuizOptionClick);
    }
  }

  function onQuizOptionClick(e) {
    if (quizState.answered) return;
    quizState.answered = true;

    var chosen = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
    quizState.selected = chosen;
    var q = quizState.questions[quizState.current];

    /* Style options */
    var opts = document.querySelectorAll('#quiz-options .quiz-option');
    for (var i = 0; i < opts.length; i++) {
      var idx = parseInt(opts[i].getAttribute('data-idx'), 10);
      if (idx === q.correct) opts[i].classList.add('correct');
      else if (idx === chosen && chosen !== q.correct) opts[i].classList.add('wrong');
    }

    if (chosen === q.correct) quizState.score++;

    /* Show next button */
    var fb = document.getElementById('quiz-feedback');
    var isLast = quizState.current >= 4;
    var btnLabel = isLast ? 'See Results' : 'Next Question';
    fb.innerHTML = '<div class="quiz-actions" style="margin-top:16px"><button class="practice-btn" id="quiz-next-btn">' + btnLabel + '</button></div>';
    $('quiz-next-btn').addEventListener('click', function () {
      if (isLast) {
        if (quizState.timerInterval) { clearInterval(quizState.timerInterval); quizState.timerInterval = null; }
        showQuizResults();
      } else {
        quizState.current++;
        quizState.answered = false;
        quizState.selected = -1;
        renderQuizQuestion();
      }
    });
  }

  function showQuizResults() {
    if (quizState.timerInterval) { clearInterval(quizState.timerInterval); quizState.timerInterval = null; }
    var pct = Math.round((quizState.score / 5) * 100);
    var el = $('quiz-content');
    var grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : pct >= 40 ? 'Keep practicing.' : 'Review the concepts and try again.';

    var html = '<div class="quiz-panel">';
    html += '<div class="quiz-results">';
    html += '<h2>Quiz Complete</h2>';
    html += '<div class="score-big">' + quizState.score + '/5</div>';
    html += '<p class="score-label">' + pct + '% &mdash; ' + grade + '</p>';
    html += '<div class="quiz-actions"><button class="practice-btn" id="quiz-retry-btn">Try Again</button></div>';
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
    quizState.started = false;
    $('quiz-retry-btn').addEventListener('click', function () { startQuiz(); });
  }


  /* ═══════════════════════════════════════════════════════════
     S26 ── Preset Management
     ═══════════════════════════════════════════════════════════ */

  function buildPresetPills() {
    var container = $('preset-pills');
    container.innerHTML = '';
    for (var i = 0; i < PRESETS.length; i++) {
      var pill = document.createElement('button');
      pill.className = 'preset-pill';
      pill.innerHTML = renderMath(PRESETS[i].latex || PRESETS[i].name);
      pill.setAttribute('data-idx', i);
      pill.setAttribute('title', PRESETS[i].name);
      pill.addEventListener('click', onPresetClick);
      container.appendChild(pill);
    }
  }

  function onPresetClick(e) {
    var idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
    loadPreset(idx);
  }

  function loadPreset(idx) {
    if (idx < 0 || idx >= PRESETS.length) return;
    var p = PRESETS[idx];

    resetToIdle();
    state.activePreset = idx;
    state.expr = p.expr;
    state.ast = parse(p.expr);
    state.view = {
      xMin: p.view.xMin, xMax: p.view.xMax,
      yMin: p.view.yMin, yMax: p.view.yMax
    };

    $('expr-input').value = p.expr;
    $('parse-error').textContent = '';
    updateParamsPanel(state.ast);

    /* Update preset pill styling */
    var pills = document.querySelectorAll('.preset-pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', i === idx);
    }

    draw();
  }


  /* ═══════════════════════════════════════════════════════════
     S27 ── Expression Input Handling
     ═══════════════════════════════════════════════════════════ */

  function onExprInput() {
    var val = $('expr-input').value.trim();
    if (!val) {
      state.ast = null;
      state.expr = '';
      $('parse-error').textContent = '';
      resetToIdle();
      draw();
      return;
    }

    var ast = parse(val);
    if (ast) {
      state.ast = ast;
      state.expr = val;
      state.activePreset = -1;
      $('parse-error').textContent = '';

      /* Clear preset highlight */
      var pills = document.querySelectorAll('.preset-pill');
      for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');

      updateParamsPanel(ast);

      /* Reset animation state when expression changes */
      resetToIdle();
      draw();
    } else {
      $('parse-error').textContent = parseError || 'Invalid expression';
    }
  }


  /* ═══════════════════════════════════════════════════════════
     S28 ── Speed Control
     ═══════════════════════════════════════════════════════════ */

  function onSpeedClick(e) {
    var val = parseFloat(e.currentTarget.getAttribute('data-value'));
    if (isNaN(val)) return;
    state.animSpeed = val;

    var pills = document.querySelectorAll('#speed-pills .pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', parseFloat(pills[i].getAttribute('data-value')) === val);
    }
  }


  /* ═══════════════════════════════════════════════════════════
     S28b ── Parameter Sliders
     ═══════════════════════════════════════════════════════════ */

  var paramPlayIds = {}; /* { paramName: animFrameId } */

  function collectParams(ast) {
    var found = {};
    function walk(node) {
      if (!node) return;
      if (node.type === 'param') { found[node.name] = true; return; }
      if (node.arg)  walk(node.arg);
      if (node.left) walk(node.left);
      if (node.right) walk(node.right);
      if (node.args) { for (var i = 0; i < node.args.length; i++) walk(node.args[i]); }
    }
    walk(ast);
    return Object.keys(found).sort();
  }

  function updateParamsPanel(ast) {
    var panel = $('params-panel');
    if (!panel) return;
    var names = ast ? collectParams(ast) : [];

    /* Hide panel and stop animations if no params */
    if (names.length === 0) {
      panel.style.display = 'none';
      var toStop = Object.keys(paramPlayIds);
      for (var s = 0; s < toStop.length; s++) stopParamPlay(toStop[s]);
      return;
    }

    panel.style.display = '';

    /* Stop animations for params no longer in expression */
    var toStop2 = Object.keys(paramPlayIds);
    for (var s2 = 0; s2 < toStop2.length; s2++) {
      if (names.indexOf(toStop2[s2]) < 0) stopParamPlay(toStop2[s2]);
    }

    /* Find existing row names */
    var existingRows = panel.querySelectorAll('.param-row');
    var existingNames = [];
    for (var r = 0; r < existingRows.length; r++) {
      existingNames.push(existingRows[r].getAttribute('data-param'));
    }

    /* Remove rows for params no longer present */
    for (var r2 = 0; r2 < existingRows.length; r2++) {
      if (names.indexOf(existingRows[r2].getAttribute('data-param')) < 0) {
        panel.removeChild(existingRows[r2]);
      }
    }

    /* Add rows for new params */
    for (var n = 0; n < names.length; n++) {
      var name = names[n];
      if (existingNames.indexOf(name) >= 0) continue;

      /* Default param value */
      if (state.params[name] === undefined) state.params[name] = 1;
      var cur = state.params[name];

      var row = document.createElement('div');
      row.className = 'param-row';
      row.setAttribute('data-param', name);
      row.innerHTML =
        '<div class="param-top">' +
          '<span class="param-label">' + name + '</span>' +
          '<input type="range" class="param-slider" min="-5" max="5" step="0.05" value="' + cur + '">' +
          '<span class="param-value">' + (+cur).toFixed(2) + '</span>' +
          '<button class="param-play-btn" title="Animate ' + name + '">&#x25B6;</button>' +
        '</div>' +
        '<div class="param-limits">' +
          '<span class="param-limits-label">min</span>' +
          '<input type="number" class="param-min" value="-5" step="0.5">' +
          '<span class="param-limits-sep">→</span>' +
          '<span class="param-limits-label">max</span>' +
          '<input type="number" class="param-max" value="5" step="0.5">' +
        '</div>';

      panel.appendChild(row);
      wireParamRow(row, name);
    }
  }

  function wireParamRow(row, name) {
    var slider   = row.querySelector('.param-slider');
    var valDisp  = row.querySelector('.param-value');
    var minInput = row.querySelector('.param-min');
    var maxInput = row.querySelector('.param-max');
    var playBtn  = row.querySelector('.param-play-btn');

    function applyVal(v) {
      v = parseFloat(v);
      if (isNaN(v)) return;
      state.params[name] = v;
      slider.value = v;
      valDisp.textContent = v.toFixed(2);
      draw();
    }

    slider.addEventListener('input', function () {
      stopParamPlay(name);
      applyVal(slider.value);
    });

    minInput.addEventListener('change', function () {
      var m = parseFloat(minInput.value);
      if (!isNaN(m)) slider.min = m;
    });

    maxInput.addEventListener('change', function () {
      var m = parseFloat(maxInput.value);
      if (!isNaN(m)) slider.max = m;
    });

    playBtn.addEventListener('click', function () {
      if (paramPlayIds[name]) {
        stopParamPlay(name);
      } else {
        startParamPlay(name);
      }
    });
  }

  function startParamPlay(name) {
    var row = document.querySelector('.param-row[data-param="' + name + '"]');
    if (!row) return;
    var slider  = row.querySelector('.param-slider');
    var valDisp = row.querySelector('.param-value');
    var playBtn = row.querySelector('.param-play-btn');

    playBtn.innerHTML = '&#x25A0;';
    playBtn.classList.add('playing');

    var dir = 1;
    var lastTs = null;

    function step(ts) {
      if (!paramPlayIds[name]) return;
      var mn = parseFloat(slider.min), mx = parseFloat(slider.max);
      var val = state.params[name] !== undefined ? +state.params[name] : 1;

      if (lastTs !== null) {
        var dt = (ts - lastTs) / 1000;
        var range = mx - mn || 10;
        val += dir * (range / 5) * dt; /* full sweep in ~5 s */
      }

      if (val >= mx) { val = mx; dir = -1; }
      if (val <= mn) { val = mn; dir =  1; }

      state.params[name] = val;
      slider.value = val;
      valDisp.textContent = val.toFixed(2);
      draw();

      lastTs = ts;
      paramPlayIds[name] = requestAnimationFrame(step);
    }

    paramPlayIds[name] = requestAnimationFrame(step);
  }

  function stopParamPlay(name) {
    if (paramPlayIds[name]) {
      cancelAnimationFrame(paramPlayIds[name]);
      delete paramPlayIds[name];
    }
    var row = document.querySelector('.param-row[data-param="' + name + '"]');
    if (!row) return;
    var btn = row.querySelector('.param-play-btn');
    if (btn) { btn.innerHTML = '&#x25B6;'; btn.classList.remove('playing'); }
  }


  /* ═══════════════════════════════════════════════════════════
     S29 ── Initialization
     ═══════════════════════════════════════════════════════════ */

  function init() {
    canvas = $('canvas');
    ctx = canvas.getContext('2d');

    sizeCanvas();

    /* Parse default expression */
    state.ast = parse(state.expr);
    $('expr-input').value = state.expr;
    updateParamsPanel(state.ast);

    /* Build preset pills */
    buildPresetPills();

    /* Event: expression input */
    $('expr-input').addEventListener('input', debounce(onExprInput, 200));

    /* Event: action buttons */
    $('btn-diff').addEventListener('click', function () { startAnimation('diff'); });
    $('btn-int').addEventListener('click', function () { startAnimation('int'); });

    /* Event: integral limit inputs */
    function updateIntegPlaceholders() {
      $('integ-a').placeholder = formatNum(state.view.xMin);
      $('integ-b').placeholder = formatNum(state.view.xMax);
    }
    updateIntegPlaceholders();

    function onIntegLimitChange() {
      var va = parseFloat($('integ-a').value);
      var vb = parseFloat($('integ-b').value);
      state.integA = isNaN(va) ? null : va;
      state.integB = isNaN(vb) ? null : vb;
      /* If result is already showing, refresh it */
      if (state.animState === 'result' && state.animType === 'int') {
        showResult();
        draw();
      }
    }
    $('integ-a').addEventListener('change', onIntegLimitChange);
    $('integ-b').addEventListener('change', onIntegLimitChange);
    $('integ-a').addEventListener('input', onIntegLimitChange);
    $('integ-b').addEventListener('input', onIntegLimitChange);

    /* Event: speed pills */
    var speedBtns = document.querySelectorAll('#speed-pills .pill');
    for (var i = 0; i < speedBtns.length; i++) {
      speedBtns[i].addEventListener('click', onSpeedClick);
    }

    /* Event: mode tabs */
    var modeBtns = document.querySelectorAll('#mode-tabs .pill');
    for (i = 0; i < modeBtns.length; i++) {
      modeBtns[i].addEventListener('click', function (e) {
        switchMode(e.currentTarget.getAttribute('data-value'));
      });
    }

    /* Event: toolbar */
    $('btn-reset').addEventListener('click', function () {
      state.view = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };
      resetToIdle();
      draw();
    });
    $('btn-zin').addEventListener('click', function () { zoom(1 / 1.4); });
    $('btn-zout').addEventListener('click', function () { zoom(1.4); });
    $('btn-export').addEventListener('click', exportPNG);
    $('btn-fs').addEventListener('click', toggleFullscreen);

    /* Event: canvas interactions */
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    /* ResizeObserver for responsive canvas */
    attachResizeObserver();

    /* Hint bar dismiss */
    var hintClose = $('hint-close');
    if (hintClose) {
      hintClose.addEventListener('click', function () {
        $('hint-bar').style.display = 'none';
      });
    }

    canvas.addEventListener('pointerleave', function () {
      state.cursorPos = null;
      if (state.panning) {
        state.panning = false;
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

    /* Right-click context menu for annotations */
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var crect = canvas.getBoundingClientRect();
      var csx = e.clientX - crect.left, csy = e.clientY - crect.top;
      var ctxHit = findNearestAnnotation(csx, csy);
      if (ctxHit) {
        state.selectedAnnotation = ctxHit.idx;
        state.selectedAnnotationType = ctxHit.type;
        draw();
      }
    });

    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';

    /* Touch events for pinch zoom + sketch/shape on mobile */
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    /* Resize */
    window.addEventListener('resize', debounce(function () {
      sizeCanvas();
      draw();
    }, 100));

    /* Wire annotation toolbar */
    wireToolbar();
    wireSketchDropdown();
    wireShapeDropdown();
    wireClearDialog();
    buildMathKeyboard();
    wireAnnotationToggle();

    /* Load first preset */
    loadPreset(0);

    draw();
  }

  /* ═══════════════════════════════════════════════════════════
     S30 ── Touch Handlers
     ═══════════════════════════════════════════════════════════ */

  var pinch = null;

  function getTouchDistance(t1, t2) {
    var dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMidpoint(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  function onTouchStart(e) {
    if (e.target !== canvas) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      if (state.activeStroke) { state.activeStroke = null; }
      if (state.activeShape) { state.activeShape = null; }
      var t1 = e.touches[0], t2 = e.touches[1];
      pinch = { dist: getTouchDistance(t1, t2), mid: getTouchMidpoint(t1, t2), view: deepClone(state.view) };
      state.panning = false;
    } else if (e.touches.length === 1) {
      if (state.tool === 'sketch') {
        e.preventDefault();
        var spos = touchCoords(e.touches[0]);
        state.activeStroke = {
          points: [{ wx: toWXu(spos.x), wy: toWYu(spos.y), p: e.touches[0].force || 0.5 }],
          color: state.sketchColor, width: state.sketchWidth
        };
      } else if (state.tool === 'shape' && state.shapeType !== 'text') {
        e.preventDefault();
        var shpos = touchCoords(e.touches[0]);
        var shwx = toWXu(shpos.x), shwy = toWYu(shpos.y);
        state.activeShape = {
          type: state.shapeType, wx1: shwx, wy1: shwy, wx2: shwx, wy2: shwy,
          color: state.shapeColor, width: state.shapeWidth, filled: state.shapeFilled, rotation: 0
        };
      } else if (state.tool === 'move') {
        var tpos = touchCoords(e.touches[0]);
        var thit = findNearestAnnotation(tpos.x, tpos.y);
        if (thit) {
          e.preventDefault();
          state.selectedAnnotation = thit.idx;
          state.selectedAnnotationType = thit.type;
          state.dragAnnotation = { type: thit.type, idx: thit.idx, lastWx: toWXu(tpos.x), lastWy: toWYu(tpos.y), corner: null };
          draw();
        }
      }
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && pinch) {
      e.preventDefault();
      var t1 = e.touches[0], t2 = e.touches[1];
      var newDist = getTouchDistance(t1, t2);
      var scale = pinch.dist / newDist;
      var mid = getTouchMidpoint(t1, t2);
      var rect = canvas.getBoundingClientRect();
      var sx = mid.x - rect.left, sy = mid.y - rect.top;
      var uR = upperRect();
      var pv = pinch.view;
      var wx = pv.xMin + (sx - uR.x) / uR.w * (pv.xMax - pv.xMin);
      var wy = pv.yMax - (sy - uR.y) / uR.h * (pv.yMax - pv.yMin);

      var xRange = (pv.xMax - pv.xMin) * scale;
      var yRange = (pv.yMax - pv.yMin) * scale;
      if (xRange < 0.01 || xRange > 10000) return;

      var xFrac = (wx - pv.xMin) / (pv.xMax - pv.xMin);
      var yFrac = (wy - pv.yMin) / (pv.yMax - pv.yMin);
      state.view.xMin = wx - xFrac * xRange;
      state.view.xMax = wx + (1 - xFrac) * xRange;
      state.view.yMin = wy - yFrac * yRange;
      state.view.yMax = wy + (1 - yFrac) * yRange;

      /* Pan offset */
      var origMid = pinch.mid;
      var dx = (mid.x - origMid.x) / uR.w * xRange;
      var dy = (mid.y - origMid.y) / uR.h * yRange;
      state.view.xMin -= dx; state.view.xMax -= dx;
      state.view.yMin += dy; state.view.yMax += dy;

      draw();
    } else if (e.touches.length === 1 && state.dragAnnotation) {
      e.preventDefault();
      var apos = touchCoords(e.touches[0]);
      var anWx = toWXu(apos.x), anWy = toWYu(apos.y);
      var adwx = anWx - state.dragAnnotation.lastWx;
      var adwy = anWy - state.dragAnnotation.lastWy;
      if (state.dragAnnotation.type === 'shape') {
        var ash = state.shapes[state.dragAnnotation.idx];
        if (ash) { ash.wx1 += adwx; ash.wy1 += adwy; ash.wx2 += adwx; ash.wy2 += adwy; }
      } else if (state.dragAnnotation.type === 'stroke') {
        var astk = state.strokes[state.dragAnnotation.idx];
        if (astk) {
          for (var ai = 0; ai < astk.points.length; ai++) {
            astk.points[ai].wx += adwx; astk.points[ai].wy += adwy;
          }
        }
      } else if (state.dragAnnotation.type === 'point') {
        var apt = state.points[state.dragAnnotation.idx];
        if (apt) { apt.wx += adwx; apt.wy += adwy; apt.snapped = false; }
      }
      state.dragAnnotation.lastWx = anWx;
      state.dragAnnotation.lastWy = anWy;
      draw();
    } else if (e.touches.length === 1 && state.tool === 'sketch' && state.activeStroke) {
      e.preventDefault();
      var sspos = touchCoords(e.touches[0]);
      state.activeStroke.points.push({ wx: toWXu(sspos.x), wy: toWYu(sspos.y), p: e.touches[0].force || 0.5 });
      draw();
    } else if (e.touches.length === 1 && state.tool === 'shape' && state.activeShape) {
      e.preventDefault();
      var shpos2 = touchCoords(e.touches[0]);
      state.activeShape.wx2 = toWXu(shpos2.x);
      state.activeShape.wy2 = toWYu(shpos2.y);
      draw();
    }
  }

  function onTouchEnd(e) {
    if (pinch && e.touches.length < 2) { pinch = null; }
    if (state.dragAnnotation) { state.dragAnnotation = null; draw(); }
    if (state.activeStroke) {
      if (state.activeStroke.points.length >= 2) state.strokes.push(state.activeStroke);
      state.activeStroke = null;
      setTool('move');
      draw();
    }
    if (state.activeShape) {
      var sdx = toSXu(state.activeShape.wx2) - toSXu(state.activeShape.wx1);
      var sdy = toSYu(state.activeShape.wy2) - toSYu(state.activeShape.wy1);
      if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) state.shapes.push(state.activeShape);
      state.activeShape = null;
      setTool('move');
      draw();
    }
    state.panning = false;
  }


  /* ═══════════════════════════════════════════════════════════
     S31 ── Annotation Toolbar Wiring
     ═══════════════════════════════════════════════════════════ */

  function wireToolbar() {
    var btns = document.querySelectorAll('.tool-btn[data-tool]');
    for (var i = 0; i < btns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function () {
          setTool(btn.getAttribute('data-tool'));
        });
      })(btns[i]);
    }
  }

  function wireSketchDropdown() {
    var toggle = $('sketch-drop-toggle');
    var dropdown = $('sketch-dropdown');
    var sketchBtn = document.querySelector('[data-tool="sketch"]');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.style.display === 'none';
      dropdown.style.display = open ? '' : 'none';
    });

    var swatches = dropdown.querySelectorAll('.swatch');
    for (var i = 0; i < swatches.length; i++) {
      (function(sw) {
        sw.addEventListener('click', function (e) {
          e.stopPropagation();
          state.sketchColor = sw.getAttribute('data-color');
          for (var j = 0; j < swatches.length; j++) swatches[j].classList.remove('active');
          sw.classList.add('active');
          if (sketchBtn) sketchBtn.style.setProperty('--sketch-color', state.sketchColor);
        });
      })(swatches[i]);
    }

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

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== toggle) {
        dropdown.style.display = 'none';
      }
    });
  }

  function wireShapeDropdown() {
    var toggle = $('shape-drop-toggle');
    var dropdown = $('shape-dropdown');
    var shapeBtn = document.querySelector('[data-tool="shape"]');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.style.display === 'none';
      dropdown.style.display = open ? '' : 'none';
      var sd = $('sketch-dropdown');
      if (sd) sd.style.display = 'none';
    });

    var shapeIcons = { arrow: '\u279C', line: '\u2571', rect: '\u2785', circle: '\u25CB', ellipse: '\u2B2D', dblarrow: '\u27F7', text: 'T' };
    var iconEl = $('shape-icon');

    var picks = dropdown.querySelectorAll('.shape-pick');
    for (var p = 0; p < picks.length; p++) {
      (function(pk) {
        pk.addEventListener('click', function (e) {
          e.stopPropagation();
          state.shapeType = pk.getAttribute('data-shape');
          for (var q = 0; q < picks.length; q++) picks[q].classList.remove('active');
          pk.classList.add('active');
          if (iconEl) iconEl.textContent = shapeIcons[state.shapeType] || '\u2785';
          dropdown.style.display = 'none';
          setTool('shape');
        });
      })(picks[p]);
    }

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

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== toggle) {
        dropdown.style.display = 'none';
      }
    });
  }

  function wireClearDialog() {
    var btnClear = $('btn-clear-all');
    var overlay = $('clear-confirm');
    var btnYes = $('clear-confirm-yes');
    var btnNo = $('clear-confirm-no');
    var selectEl = $('clear-category');
    var hintEl = $('clear-hint');
    if (!btnClear || !overlay) return;

    var hints = {
      all: 'Removes all sketches, shapes, points, tangent lines, derivatives, and integrals.',
      sketches: 'Removes freehand sketch strokes only.',
      shapes: 'Removes geometric shapes and text labels only.',
      points: 'Removes coordinate points only.',
      math: 'Removes tangent lines, derivative segments, and integral shading.'
    };

    if (selectEl && hintEl) {
      selectEl.addEventListener('change', function () {
        hintEl.textContent = hints[selectEl.value] || '';
      });
    }

    btnClear.addEventListener('click', function () {
      if (!state.strokes.length && !state.shapes.length && !state.points.length &&
          !state.tangents.length && !state.derivSegments.length && !state.integralRegions.length) return;
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
        state.strokes = []; state.activeStroke = null;
      }
      if (cat === 'all' || cat === 'shapes') {
        state.shapes = []; state.activeShape = null;
      }
      if (cat === 'all' || cat === 'points') {
        state.points = [];
      }
      if (cat === 'all' || cat === 'math') {
        state.tangents = [];
        state.derivSegments = [];
        state.integralRegions = [];
        state.pendingClick = null;
      }
      state.selectedAnnotation = -1;
      state.selectedAnnotationType = '';
      hideDialog();
      draw();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideDialog();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     S27 ── Math Keyboard
     ═══════════════════════════════════════════════════════════ */

  function buildMathKeyboard() {
    var overlay  = $('mkbd-overlay');
    var trigger  = $('mkbd-trigger');
    var closeBtn = $('mkbd-close');
    var cancelBtn= $('mkbd-cancel');
    var applyBtn = $('mkbd-apply');
    var delBtn   = $('mkbd-del');
    var clrBtn   = $('mkbd-clr');
    var inp      = $('mkbd-input');
    if (!overlay || !trigger || !inp) return;

    /* ── open / close ── */
    function openKeyboard() {
      inp.value = $('expr-input').value;
      mkbUpdatePreview();
      overlay.style.display = 'flex';
      setTimeout(function () { inp.focus(); inp.select(); }, 60);
    }

    function closeKeyboard() {
      overlay.style.display = 'none';
    }

    trigger.addEventListener('click', openKeyboard);
    closeBtn.addEventListener('click', closeKeyboard);
    cancelBtn.addEventListener('click', closeKeyboard);
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
    function mkbUpdatePreview() {
      var val = inp.value.trim();
      var previewEl = $('mkbd-preview');
      if (!val) {
        previewEl.innerHTML = '<span class="mkbd-preview-placeholder">f(x) = \u2026</span>';
        return;
      }
      try {
        var ast = parse(val);
        if (ast) {
          previewEl.innerHTML = renderMath('f(x) = ' + astToLatex(ast));
        } else {
          previewEl.innerHTML = '<span class="mkbd-preview-raw">f(x) = ' + escHtml(val) + '</span>';
        }
      } catch (err) {
        previewEl.innerHTML = '<span class="mkbd-preview-raw">f(x) = ' + escHtml(val) + '</span>';
      }
    }

    inp.addEventListener('input', mkbUpdatePreview);

    /* ── insert at cursor ── */
    function mkbInsert(text) {
      var s = inp.selectionStart, e = inp.selectionEnd;
      var selected = inp.value.slice(s, e);
      var isFn = text.endsWith('(');
      var inserted, cursorPos;

      if (text === '()') {
        /* Special: empty parens with cursor inside */
        inserted = '()';
        cursorPos = s + 1;
      } else if (isFn && selected) {
        /* Wrap selection in the function */
        inserted = text + selected + ')';
        cursorPos = s + inserted.length;
      } else if (isFn) {
        /* Default x inside parens, select it so user can type over it */
        inserted = text + 'x)';
        cursorPos = s + text.length + 1; /* after 'x', will set selection below */
      } else {
        inserted = text;
        cursorPos = s + text.length;
      }

      inp.value = inp.value.slice(0, s) + inserted + inp.value.slice(e);
      /* For fn(x) case: select the 'x' so user can immediately type over it */
      if (isFn && !selected && text !== '()') {
        inp.setSelectionRange(s + text.length, s + text.length + 1);
      } else {
        inp.setSelectionRange(cursorPos, cursorPos);
      }
      mkbUpdatePreview();
      inp.focus();
    }

    /* ── backspace ── */
    function mkbDelete() {
      var s = inp.selectionStart, e = inp.selectionEnd;
      if (s !== e) {
        inp.value = inp.value.slice(0, s) + inp.value.slice(e);
        inp.setSelectionRange(s, s);
      } else if (s > 0) {
        inp.value = inp.value.slice(0, s - 1) + inp.value.slice(s);
        inp.setSelectionRange(s - 1, s - 1);
      }
      mkbUpdatePreview();
      inp.focus();
    }

    delBtn.addEventListener('click', mkbDelete);
    clrBtn.addEventListener('click', function () {
      inp.value = '';
      mkbUpdatePreview();
      inp.focus();
    });

    /* ── apply ── */
    applyBtn.addEventListener('click', function () {
      var val = inp.value.trim();
      if (!val) return;
      var exprInp = $('expr-input');
      exprInp.value = val;
      exprInp.dispatchEvent(new Event('input', { bubbles: true }));
      closeKeyboard();
    });

    /* ── wire all data-ins buttons ── */
    var allBtns = overlay.querySelectorAll('[data-ins]');
    for (var i = 0; i < allBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          mkbInsert(btn.getAttribute('data-ins'));
        });
      })(allBtns[i]);
    }

    /* ── tab switching ── */
    var tabs = overlay.querySelectorAll('.mkbd-tab');
    for (var t = 0; t < tabs.length; t++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          /* deactivate all tabs + panels */
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
          var panels = overlay.querySelectorAll('.mkbd-panel');
          for (var k = 0; k < panels.length; k++) panels[k].classList.remove('active');
          /* activate selected */
          tab.classList.add('active');
          var panel = $('mkbd-panel-' + tab.getAttribute('data-tab'));
          if (panel) panel.classList.add('active');
          inp.focus();
        });
      })(tabs[t]);
    }

    /* ── Enter key in mkbd-input triggers apply ── */
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { applyBtn.click(); }
    });
  }


  /* ═══════════════════════════════════════════════════════════
     Interactive Calculus Tools — Tangent, f' Deriv, ∫ Area
     ═══════════════════════════════════════════════════════════ */

  function updateHoverPoint(sx, sy) {
    if (!state.ast) { state.hoverPoint = null; return; }
    var uRect = upperRect();
    if (sy > uRect.y + uRect.h) { state.hoverPoint = null; return; }
    var wx = toWXu(sx);
    var wy = evaluate(state.ast, wx);
    if (!isOk(wy)) { state.hoverPoint = null; return; }
    var screenY = toSYu(wy);
    /* Snap tolerance for tangent / derivative / area tools — wider = easier to hit */
    if (Math.abs(screenY - sy) < 30) {
      state.hoverPoint = { wx: wx, wy: wy };
    } else {
      state.hoverPoint = null;
    }
  }

  function addTangentAt(wx) {
    if (!state.ast) return;
    var y0 = evaluate(state.ast, wx);
    var slope = numericalDeriv(state.ast, wx);
    if (!isFinite(y0) || !isFinite(slope)) return;
    saveUndo();
    var yInt = y0 - slope * wx;
    state.tangents.push({ x0: wx, slope: slope, yInt: yInt, color: COLOR_FUNC });
    draw();
  }

  function handleTwoClickTool() {
    if (!state.hoverPoint) {
      state.pendingClick = null;
      draw();
      return;
    }
    var hp = state.hoverPoint;
    if (!state.pendingClick) {
      state.pendingClick = { tool: state.tool, wx: hp.wx };
      draw();
      return;
    }
    var xA = state.pendingClick.wx;
    var xB = hp.wx;
    if (Math.abs(xA - xB) < 1e-9) { state.pendingClick = null; draw(); return; }
    var xFrom = Math.min(xA, xB);
    var xTo = Math.max(xA, xB);

    saveUndo();
    if (state.tool === 'derivative') {
      state.derivSegments.push({ xFrom: xFrom, xTo: xTo, color: COLOR_DERIV });
    } else if (state.tool === 'integral') {
      var value = computeIntegral(state.ast, xFrom, xTo);
      state.integralRegions.push({ xFrom: xFrom, xTo: xTo, color: COLOR_INTEG, value: value });
    }
    state.pendingClick = null;
    draw();
  }

  function drawTangentLines() {
    var uRect = upperRect();
    for (var i = 0; i < state.tangents.length; i++) {
      var t = state.tangents[i];
      var v = state.view;
      var x1 = v.xMin, y1 = t.slope * x1 + t.yInt;
      var x2 = v.xMax, y2 = t.slope * x2 + t.yInt;
      ctx.beginPath();
      ctx.moveTo(toSXu(x1), toSYu(y1));
      ctx.lineTo(toSXu(x2), toSYu(y2));
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      /* Point dot */
      var px = toSXu(t.x0), py = toSYu(t.slope * t.x0 + t.yInt);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd43b';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      /* Label */
      var label = 'y = ' + formatNum(t.slope) + 'x ' + (t.yInt >= 0 ? '+ ' : '- ') + formatNum(Math.abs(t.yInt));
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffd43b';
      ctx.fillText(label, px + 10, py - 10);
    }
  }

  function drawDerivSegments() {
    var uRect = upperRect();
    for (var s = 0; s < state.derivSegments.length; s++) {
      var seg = state.derivSegments[s];
      if (!state.ast) continue;
      var sxFrom = Math.max(0, toSXu(seg.xFrom));
      var sxTo = Math.min(W, toSXu(seg.xTo));
      if (sxFrom >= sxTo) continue;
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      var inPath = false;
      for (var sx = sxFrom; sx <= sxTo; sx++) {
        var wx = toWXu(sx);
        var dy = numericalDeriv(state.ast, wx);
        if (!isOk(dy)) { inPath = false; continue; }
        var sy = toSYu(dy);
        if (!inPath) { ctx.moveTo(sx, sy); inPath = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      /* Boundary lines */
      drawDashedVLine(toSXu(seg.xFrom), seg.color);
      drawDashedVLine(toSXu(seg.xTo), seg.color);
      /* Label */
      var midSx = (sxFrom + sxTo) / 2;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = seg.color;
      ctx.textAlign = 'center';
      ctx.fillText("f'(x)", midSx, toSYu(numericalDeriv(state.ast, toWXu(midSx))) - 14);
      ctx.textAlign = 'left';
    }
  }

  function drawIntegralRegions() {
    var uRect = upperRect();
    for (var r = 0; r < state.integralRegions.length; r++) {
      var reg = state.integralRegions[r];
      if (!state.ast) continue;
      var xFrom = reg.xFrom, xTo = reg.xTo;
      var steps = Math.max(200, Math.ceil(W));
      var dx = (xTo - xFrom) / steps;
      var zeroSY = toSYu(0);
      ctx.fillStyle = reg.color;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(toSXu(xFrom), zeroSY);
      for (var i = 0; i <= steps; i++) {
        var wx = xFrom + i * dx;
        var wy = evaluate(state.ast, wx);
        if (!isOk(wy)) wy = 0;
        ctx.lineTo(toSXu(wx), toSYu(wy));
      }
      ctx.lineTo(toSXu(xTo), zeroSY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      drawDashedVLine(toSXu(xFrom), reg.color);
      drawDashedVLine(toSXu(xTo), reg.color);
      /* Value label */
      var midWx = (xFrom + xTo) / 2;
      var midWy = evaluate(state.ast, midWx);
      if (!isOk(midWy)) midWy = 0;
      var valStr = isOk(reg.value) ? formatNum(reg.value) : 'undef';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      var tw = ctx.measureText('∫ = ' + valStr).width;
      var lx = toSXu(midWx) - tw / 2;
      var ly = toSYu(midWy) - 18;
      if (ly < 20) ly = toSYu(midWy) + 28;
      ctx.fillStyle = 'rgba(13,17,23,0.92)';
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = 1.5;
      roundRect(ctx, lx - 8, ly - 14, tw + 16, 22, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = reg.color;
      ctx.textAlign = 'left';
      ctx.fillText('∫ = ' + valStr, lx, ly);
    }
  }

  function drawDashedVLine(sx, color) {
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

  function drawPendingClick() {
    if (!state.pendingClick || !state.ast) return;
    var pc = state.pendingClick;
    var wy = evaluate(state.ast, pc.wx);
    if (!isOk(wy)) return;
    var sx = toSXu(pc.wx), sy = toSYu(wy);
    var pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(sx, sy, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_FUNC;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawDashedVLine(sx, COLOR_FUNC);
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var tw = ctx.measureText('Click 2nd point').width;
    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.strokeStyle = COLOR_FUNC;
    ctx.lineWidth = 1;
    roundRect(ctx, sx + 6, sy - 18, tw + 12, 18, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.fillText('Click 2nd point', sx + 12, sy - 6);
  }

  function drawHoverTrace() {
    if (!state.hoverPoint) return;
    var hp = state.hoverPoint;
    var sx = toSXu(hp.wx), sy = toSYu(hp.wy);
    var uRect = upperRect();

    /* Dashed vertical crosshair line */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, uRect.y);
    ctx.lineTo(sx, uRect.y + uRect.h);
    ctx.stroke();

    /* Dashed horizontal crosshair line */
    ctx.beginPath();
    ctx.moveTo(uRect.x, sy);
    ctx.lineTo(uRect.x + uRect.w, sy);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();
    ctx.restore();

    /* Point marker */
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_FUNC;
    ctx.fill();

    /* Coordinate tooltip with background pill */
    var label = 'f(' + formatNum(hp.wx) + ') = ' + formatNum(hp.wy);
    ctx.font = '11px monospace';
    var tw = ctx.measureText(label).width;
    var lx = sx + 12, ly = sy - 8;
    /* Keep tooltip on canvas */
    if (lx + tw + 10 > uRect.x + uRect.w) lx = sx - tw - 16;
    if (ly - 16 < uRect.y) ly = sy + 20;
    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.strokeStyle = COLOR_FUNC;
    ctx.lineWidth = 1;
    roundRect(ctx, lx - 6, ly - 14, tw + 12, 18, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx, ly);
  }

  function wireAnnotationToggle() {
    var btnToggle = $('btn-toggle-annotations');
    if (!btnToggle) return;
    btnToggle.addEventListener('click', function () {
      state.showAnnotations = !state.showAnnotations;
      btnToggle.classList.toggle('active', state.showAnnotations);
      btnToggle.textContent = state.showAnnotations ? '\uD83D\uDC41' : '\uD83D\uDEAB';
      btnToggle.title = state.showAnnotations ? 'Hide Annotations' : 'Show Annotations';
      draw();
    });
  }

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      performUndo();
    } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'Z')) {
      e.preventDefault();
      performRedo();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedAnnotation >= 0) {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      deleteSelectedAnnotation();
    } else if (e.key === 'Escape') {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (state.pendingClick) {
        state.pendingClick = null;
        draw();
      } else if (state.selectedAnnotation >= 0) {
        state.selectedAnnotation = -1;
        state.selectedAnnotationType = '';
        draw();
      } else if (state.tool !== 'move') {
        setTool('move');
      }
    }
  });

  /* Boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ================================================================
     SHAREABLE URL — the function + view + annotations are encoded into the link.
     makeSnapshot() → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
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
        if(!snap || typeof snap.expr!=='string') return;   // shape mismatch → ignore
        restoreSnapshot(snap);                              // reuse the tool's own restore (re-parses the AST)
      }).catch(function(){});                               // corrupt link → keep the seed function
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // after boot above (rAF-free so it isn't throttled)
  })();

})();
