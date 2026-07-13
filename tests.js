/*
  Janim unit tests.

  runUnitTests() checks the core math helpers. Visual scene builders live in
  sketch.js, which is the main implementation file for Janim animations.
*/
(function (global) {
  "use strict";

  function runUnitTests() {
    const results = [];

    test(results, "jexpr compiles powers", () => closeTo(jexpr("y = x^2").y(3), 9));
    test(results, "jexpr compiles fractions", () => closeTo(jexpr("y = \\frac{x}{2}").y(8), 4));
    test(results, "jexpr compiles 3D surfaces", () => closeTo(jexpr("z = \\sin(x) + \\cos(y)").z(0, 0), 1));
    test(results, "Janimation tween reaches end", () => {
      const t = Janimation.tween(0, 10, 1, { ease: "linear" });
      t.update(1);
      return closeTo(t.value(), 10);
    });
    test(results, "Janimation path interpolates", () => {
      const p = Janimation.path([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
      return closeTo(p.pointAt(0.5).x, 5);
    });
    test(results, "JGrid3D projects finite points", () => {
      const grid = jgrid3d({ camera: { x: 4, y: 3, z: 5 }, scale: 100 });
      const point = grid.project({ x: 1, y: 1, z: 1 });
      return point && Number.isFinite(point.x) && Number.isFinite(point.y);
    });

    console.table(results);
    return results;
  }

  function test(results, name, fn) {
    let pass = false;
    let error = "";

    try {
      pass = Boolean(fn());
    } catch (err) {
      error = err && err.message ? err.message : String(err);
    }

    results.push({ name, pass, error });
  }

  function closeTo(actual, expected, tolerance) {
    return Math.abs(actual - expected) <= (tolerance || 0.000001);
  }

  global.JanimTests = {
    runUnitTests
  };
})(window);
