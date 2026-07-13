/*
  JGrid

  Reusable p5 math grids with screen/math coordinate conversion.

  Usage:
    const grid = jgrid({ spacing: 48 });

    function draw() {
      grid.draw();
      const p = grid.gridToScreen(2, 1);
      circle(p.x, p.y, 8);
    }
*/
(function (global) {
  "use strict";

  /**
   * Creates a reusable 2D math grid for p5 sketches.
   *
   * @param {Object} [options] - Grid configuration.
   * @param {number} [options.spacing=50] - Pixel distance for one grid unit.
   * @param {number} [options.majorEvery=5] - Minor-grid intervals between major lines.
   * @param {number} [options.unit=1] - Math units represented by `spacing` pixels.
   * @returns {MathGrid} A grid instance with draw and plotting helpers.
   *
   * @example
   * const grid = jgrid({ spacing: 48, majorEvery: 2 });
   *
   * function draw() {
   *   background(20);
   *   grid.draw();
   * }
   */
  function jgrid(options) {
    return new MathGrid(options);
  }

  /**
   * 2D Cartesian grid with screen/math coordinate conversion and plotting.
   *
   * @example
   * const grid = new JGrid.MathGrid({ spacing: 56, unit: 1 });
   * grid.draw({ progress: 1 });
   * grid.plot("y = \\sin(x)", { color: "cyan" });
   */
  class MathGrid {
    /**
     * Creates a 2D grid.
     *
     * @param {Object} [options] - Grid configuration.
     *
     * @example
     * const grid = new JGrid.MathGrid({
     *   spacing: 40,
     *   originX: width / 2,
     *   originY: height / 2,
     *   showLabels: true
     * });
     */
    constructor(options) {
      const settings = options || {};
      this.spacing = Number(settings.spacing) || 50;
      this.majorEvery = Number(settings.majorEvery) || 5;
      this.originX = settings.originX;
      this.originY = settings.originY;
      this.minorColor = settings.minorColor || "rgba(255,255,255,0.16)";
      this.majorColor = settings.majorColor || "rgba(255,255,255,0.28)";
      this.axisColor = settings.axisColor || "rgba(255,255,255,0.85)";
      this.labelColor = settings.labelColor || "rgba(255,255,255,0.74)";
      this.showLabels = settings.showLabels !== false;
      this.showAxes = settings.showAxes !== false;
      this.showMinor = settings.showMinor !== false;
      this.labelEvery = Number(settings.labelEvery) || this.majorEvery;
      this.unit = Number(settings.unit) || 1;
    }

    /**
     * Returns the pixel position of the grid origin.
     *
     * @returns {{x: number, y: number}} Screen-space origin.
     *
     * @example
     * const origin = grid.center();
     * circle(origin.x, origin.y, 8);
     */
    center() {
      return {
        x: this.originX === undefined ? width / 2 : this.originX,
        y: this.originY === undefined ? height / 2 : this.originY
      };
    }

    /**
     * Draws minor lines, major lines, axes, and labels.
     *
     * @param {Object|number} [options] - Options object or progress number.
     * @param {number} [options.progress=1] - Reveal amount from 0 to 1.
     * @returns {MathGrid} This grid for chaining.
     *
     * @example
     * grid.draw();
     *
     * @example
     * const reveal = min(1, frameCount / 90);
     * grid.draw({ progress: reveal });
     */
    draw(options) {
      if (typeof line !== "function") return this;

      const settings = typeof options === "number" ? { progress: options } : options || {};
      const progress = clamp(settings.progress === undefined ? 1 : settings.progress, 0, 1);
      const origin = this.center();
      push();

      if (this.showMinor) this.drawLines(origin, this.spacing, this.minorColor, 1, progress);
      this.drawLines(origin, this.spacing * this.majorEvery, this.majorColor, 1.4, progress);

      if (this.showAxes) {
        stroke(this.axisColor);
        strokeWeight(2);
        drawLineProgress(origin.x, origin.y, 0, origin.y, progress);
        drawLineProgress(origin.x, origin.y, width, origin.y, progress);
        drawLineProgress(origin.x, origin.y, origin.x, 0, progress);
        drawLineProgress(origin.x, origin.y, origin.x, height, progress);
      }

      if (this.showLabels) this.drawLabels(origin, progress);

      pop();
      return this;
    }

    /**
     * Draws a repeated set of grid lines around an origin.
     *
     * @param {{x: number, y: number}} origin - Screen-space grid origin.
     * @param {number} step - Pixel spacing between lines.
     * @param {string} color - p5-compatible stroke color.
     * @param {number} weight - Stroke weight in pixels.
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawLines(grid.center(), 50, "rgba(255,255,255,0.2)", 1, 1);
     */
    drawLines(origin, step, color, weight, progress) {
      stroke(color);
      strokeWeight(weight);

      for (let x = origin.x % step; x <= width; x += step) {
        drawLineProgress(x, origin.y, x, 0, progress);
        drawLineProgress(x, origin.y, x, height, progress);
      }

      for (let y = origin.y % step; y <= height; y += step) {
        drawLineProgress(origin.x, y, 0, y, progress);
        drawLineProgress(origin.x, y, width, y, progress);
      }
    }

    /**
     * Draws numeric axis labels.
     *
     * @param {{x: number, y: number}} origin - Screen-space grid origin.
     * @param {number} progress - Label opacity from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawLabels(grid.center(), 0.75);
     */
    drawLabels(origin, progress) {
      const step = this.spacing * this.labelEvery;
      const unitsPerLabel = this.unit * this.labelEvery;

      drawingContext.save();
      drawingContext.globalAlpha = progress;
      noStroke();
      fill(this.labelColor);
      textSize(12);
      textAlign(CENTER, TOP);

      for (let x = origin.x + step, value = unitsPerLabel; x <= width; x += step, value += unitsPerLabel) {
        text(formatNumber(value), x, origin.y + 6);
      }

      for (let x = origin.x - step, value = -unitsPerLabel; x >= 0; x -= step, value -= unitsPerLabel) {
        text(formatNumber(value), x, origin.y + 6);
      }

      textAlign(LEFT, CENTER);

      for (let y = origin.y - step, value = unitsPerLabel; y >= 0; y -= step, value += unitsPerLabel) {
        text(formatNumber(value), origin.x + 6, y);
      }

      for (let y = origin.y + step, value = -unitsPerLabel; y <= height; y += step, value -= unitsPerLabel) {
        text(formatNumber(value), origin.x + 6, y);
      }

      drawingContext.restore();
    }

    /**
     * Converts math-grid coordinates to p5 screen coordinates.
     *
     * @param {number} x - Grid x coordinate.
     * @param {number} y - Grid y coordinate.
     * @returns {{x: number, y: number}} Screen point.
     *
     * @example
     * const p = grid.gridToScreen(2, 1);
     * circle(p.x, p.y, 10);
     */
    gridToScreen(x, y) {
      const origin = this.center();
      return {
        x: origin.x + (Number(x) || 0) * this.spacing / this.unit,
        y: origin.y - (Number(y) || 0) * this.spacing / this.unit
      };
    }

    /**
     * Converts p5 screen coordinates to math-grid coordinates.
     *
     * @param {number} x - Screen x coordinate.
     * @param {number} y - Screen y coordinate.
     * @returns {{x: number, y: number}} Grid point.
     *
     * @example
     * const mousePoint = grid.screenToGrid(mouseX, mouseY);
     * console.log(mousePoint.x, mousePoint.y);
     */
    screenToGrid(x, y) {
      const origin = this.center();
      return {
        x: (Number(x) - origin.x) * this.unit / this.spacing,
        y: (origin.y - Number(y)) * this.unit / this.spacing
      };
    }

    /**
     * Plots a JavaScript function onto the grid.
     *
     * @param {(x: number) => number} fn - Function that maps grid x to grid y.
     * @param {Object} [options] - Drawing options.
     * @param {string} [options.color="white"] - Stroke color.
     * @param {number} [options.weight=2] - Stroke weight.
     * @param {number} [options.step=3] - Pixel step between sampled points.
     * @returns {MathGrid} This grid for chaining.
     *
     * @example
     * grid.draw();
     * grid.plotFunction((x) => Math.sin(x), { color: "yellow", weight: 3 });
     */
    plotFunction(fn, options) {
      const settings = options || {};
      const startX = settings.startX === undefined ? 0 : settings.startX;
      const endX = settings.endX === undefined ? width : settings.endX;
      const step = Math.max(1, Number(settings.step) || 3);

      push();
      noFill();
      stroke(settings.color || "white");
      strokeWeight(settings.weight || 2);
      beginShape();

      for (let screenX = startX; screenX <= endX; screenX += step) {
        const gridPoint = this.screenToGrid(screenX, 0);
        const y = fn(gridPoint.x);
        const screenPoint = this.gridToScreen(gridPoint.x, y);
        vertex(screenPoint.x, screenPoint.y);
      }

      endShape();
      pop();
      return this;
    }

    /**
     * Plots either a JavaScript function or a LaTeX-ish expression.
     *
     * @param {string|((x: number) => number)} expression - Function or expression such as `"y = x^2"`.
     * @param {Object} [options] - Drawing options passed to `plotFunction()`.
     * @returns {MathGrid} This grid for chaining.
     *
     * @example
     * grid.plot("y = \\sin(x)", { color: "rgb(105,170,255)" });
     *
     * @example
     * grid.plot((x) => 0.25 * x * x - 2, { color: "white" });
     */
    plot(expression, options) {
      const expr = typeof expression === "function" ? null : global.jexpr(expression);
      const fn = typeof expression === "function" ? expression : (x) => expr.y(x);
      return this.plotFunction(fn, options);
    }
  }

  /**
   * Formats axis-label numbers with integers left clean and decimals rounded.
   *
   * @param {number} value - Number to format.
   * @returns {string} Label text.
   *
   * @example
   * formatNumber(2); // "2"
   * formatNumber(2.5); // "2.50"
   */
  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  /**
   * Constrains a number to a closed interval.
   *
   * @param {number} value - Value to constrain.
   * @param {number} min - Lower bound.
   * @param {number} max - Upper bound.
   * @returns {number} Clamped value.
   *
   * @example
   * clamp(1.4, 0, 1); // 1
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Draws a partial line from its start point toward its end point.
   *
   * @param {number} x1 - Start x coordinate.
   * @param {number} y1 - Start y coordinate.
   * @param {number} x2 - End x coordinate.
   * @param {number} y2 - End y coordinate.
   * @param {number} progress - Reveal amount from 0 to 1.
   * @returns {void}
   *
   * @example
   * drawLineProgress(100, 100, 300, 100, 0.5); // Draws halfway across.
   */
  function drawLineProgress(x1, y1, x2, y2, progress) {
    const t = clamp(progress, 0, 1);
    line(x1, y1, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  }

  global.JGrid = {
    MathGrid,
    create: jgrid
  };
  global.jgrid = jgrid;
})(window);
