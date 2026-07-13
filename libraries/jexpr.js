/*
  JExpr

  Tiny LaTeX-ish expression compiler for Janim sketches.
  Supports common forms such as:
    y = x^2
    z = \sin(x) + \cos(y)
    \sqrt{x^2 + y^2}
*/
(function (global) {
  "use strict";

  const FUNCTIONS = [
    "sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "abs",
    "log", "ln", "exp", "floor", "ceil", "round", "min", "max"
  ];

  /**
   * Compiles a LaTeX-ish math expression into an evaluatable Expression object.
   *
   * @param {string} source - Expression text such as `"y = x^2"` or `"z = \\sin(x) + \\cos(y)"`.
   * @returns {Expression} A compiled expression with `evaluate()`, `y()`, and `z()` helpers.
   *
   * @example
   * const parabola = jexpr("y = x^2");
   * console.log(parabola.y(3)); // 9
   *
   * @example
   * const surface = jexpr("z = \\sin(x) + \\cos(y)");
   * console.log(surface.z(0, 0)); // 1
   */
  function jexpr(source) {
    return new Expression(source);
  }

  /**
   * Compiled math expression created by `jexpr()`.
   *
   * @example
   * const expr = new JExpr.Expression("\\sqrt{x^2 + y^2}");
   * const radius = expr.evaluate({ x: 3, y: 4 }); // 5
   */
  class Expression {
    /**
     * Creates and compiles an expression.
     *
     * @param {string} source - Raw expression or equation-like string.
     *
     * @example
     * const expr = new JExpr.Expression("y = \\frac{x}{2}");
     * expr.y(8); // 4
     */
    constructor(source) {
      this.source = String(source || "0");
      const parsed = splitEquation(this.source);
      this.output = parsed.output;
      this.body = parsed.body;
      this.js = latexToJs(this.body);
      this.fn = compile(this.js);
    }

    /**
     * Evaluates the expression against a scope of variables.
     *
     * Supported variables include `x`, `y`, `z`, `t`, `r`, and `theta`.
     *
     * @param {Object<string, number>} [scope] - Variable values used by the expression.
     * @returns {number} The numeric result.
     *
     * @example
     * jexpr("x^2 + y^2").evaluate({ x: 3, y: 4 }); // 25
     */
    evaluate(scope) {
      return this.fn(scope || {});
    }

    /**
     * Evaluates a one-variable expression as `y(x)`.
     *
     * @param {number} x - Input x value.
     * @param {Object<string, number>} [scope] - Extra variables such as `t` or `theta`.
     * @returns {number} The resulting y value.
     *
     * @example
     * const wave = jexpr("y = \\sin(x + t)");
     * wave.y(Math.PI / 2, { t: 0 }); // 1
     */
    y(x, scope) {
      return this.evaluate(Object.assign({}, scope || {}, { x }));
    }

    /**
     * Evaluates a two-variable expression as `z(x, y)`.
     *
     * @param {number} x - Input x value.
     * @param {number} y - Input y value.
     * @param {Object<string, number>} [scope] - Extra variables such as `t`.
     * @returns {number} The resulting z value.
     *
     * @example
     * const surface = jexpr("z = x^2 + y^2");
     * surface.z(2, 3); // 13
     */
    z(x, y, scope) {
      return this.evaluate(Object.assign({}, scope || {}, { x, y }));
    }
  }

  /**
   * Splits equation-like input into an optional output name and expression body.
   *
   * @param {string} source - Raw expression text.
   * @returns {{output: string|null, body: string}} Parsed equation parts.
   *
   * @example
   * splitEquation("y = x^2"); // { output: "y", body: "x^2" }
   * splitEquation("\\sqrt{x}"); // { output: null, body: "\\sqrt{x}" }
   */
  function splitEquation(source) {
    const normalized = String(source || "0").trim();
    const match = normalized.match(/^\\?([a-zA-Z]+)\s*=\s*(.+)$/);
    if (!match) return { output: null, body: normalized };
    return { output: match[1], body: match[2] };
  }

  /**
   * Converts the supported LaTeX-ish syntax into a JavaScript expression string.
   *
   * @param {string} source - LaTeX-ish expression body.
   * @returns {string} JavaScript expression text suitable for `compile()`.
   *
   * @example
   * JExpr.latexToJs("\\frac{x}{2} + \\sqrt{y}"); // "((x)/(2))+sqrt(y)"
   */
  function latexToJs(source) {
    let text = String(source || "0");

    text = text
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\cdot|\\times/g, "*")
      .replace(/\\pi/g, "pi")
      .replace(/\\theta/g, "theta")
      .replace(/\\,/g, "")
      .replace(/\s+/g, "");

    text = replaceLatexCommand(text, "frac", (a, b) => "((" + a + ")/(" + b + "))");
    text = replaceLatexCommand(text, "sqrt", (a) => "sqrt(" + a + ")");

    FUNCTIONS.forEach((name) => {
      text = text.replace(new RegExp("\\\\" + name, "g"), name);
    });

    text = text.replace(/\^/g, "**");
    text = insertImplicitMultiplication(text);

    return text;
  }

  /**
   * Replaces simple braced LaTeX commands such as `\\frac{a}{b}`.
   *
   * @param {string} text - Source text to scan.
   * @param {string} command - Command name without the leading backslash.
   * @param {Function} replacer - Callback receiving command arguments.
   * @returns {string} Text with supported command calls replaced.
   *
   * @example
   * replaceLatexCommand("\\sqrt{x}", "sqrt", (a) => "sqrt(" + a + ")");
   * // "sqrt(x)"
   */
  function replaceLatexCommand(text, command, replacer) {
    let index = text.indexOf("\\" + command);

    while (index !== -1) {
      let cursor = index + command.length + 1;
      const args = [];

      while (text[cursor] === "{") {
        const group = readGroup(text, cursor);
        args.push(group.value);
        cursor = group.end + 1;
      }

      if (args.length === 0) {
        index = text.indexOf("\\" + command, cursor);
        continue;
      }

      text = text.slice(0, index) + replacer.apply(null, args) + text.slice(cursor);
      index = text.indexOf("\\" + command, index + 1);
    }

    return text;
  }

  /**
   * Reads a balanced `{...}` group from a LaTeX-ish string.
   *
   * @param {string} text - Source text.
   * @param {number} start - Index of the opening `{`.
   * @returns {{value: string, end: number}} Group contents and closing-brace index.
   * @throws {Error} If the group is not closed.
   *
   * @example
   * readGroup("{x^2}", 0); // { value: "x^2", end: 4 }
   */
  function readGroup(text, start) {
    let depth = 0;

    for (let i = start; i < text.length; i += 1) {
      if (text[i] === "{") depth += 1;
      if (text[i] === "}") depth -= 1;
      if (depth === 0) {
        return {
          value: text.slice(start + 1, i),
          end: i
        };
      }
    }

    throw new Error("Unclosed LaTeX group in expression.");
  }

  /**
   * Inserts multiplication signs for compact math notation.
   *
   * @param {string} text - JavaScript-ish expression text.
   * @returns {string} Expression text with implicit products made explicit.
   *
   * @example
   * insertImplicitMultiplication("2x+3(y+1)"); // "2*x+3*(y+1)"
   */
  function insertImplicitMultiplication(text) {
    let result = text;
    result = result.replace(/(theta|pi|\d|\)|x|y|z|t|r)(?=\()/g, "$1*");
    result = result.replace(/(theta|pi|\d|\)|x|y|z|t|r)(?=[a-zA-Z])/g, "$1*");
    result = result.replace(/(\))(?=\d)/g, "$1*");

    FUNCTIONS.forEach((name) => {
      result = result.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\*\\(", "g"), name + "(");
      result = result.replace(new RegExp("Math\\*" + name, "g"), "Math." + name);
    });

    return result;
  }

  /**
   * Builds the JavaScript function used to evaluate a compiled expression.
   *
   * @param {string} jsExpression - JavaScript expression body.
   * @returns {(scope: Object<string, number>) => number} Evaluator function.
   *
   * @example
   * // Internal use:
   * const fn = compile("x**2");
   * fn({ x: 5 }); // 25
   */
  function compile(jsExpression) {
    const body = "const {x=0,y=0,z=0,t=0,r=0,theta=0} = scope;" +
      "const pi = Math.PI;" +
      "const sin=Math.sin, cos=Math.cos, tan=Math.tan, asin=Math.asin, acos=Math.acos, atan=Math.atan;" +
      "const sqrt=Math.sqrt, abs=Math.abs, log=Math.log10, ln=Math.log, exp=Math.exp;" +
      "const floor=Math.floor, ceil=Math.ceil, round=Math.round, min=Math.min, max=Math.max;" +
      "return " + jsExpression + ";";

    return new Function("scope", body);
  }

  global.JExpr = {
    Expression,
    compile: jexpr,
    latexToJs
  };
  global.jexpr = jexpr;
})(window);
