/*
  JGrid3D

  A perspective right-handed 3D math grid for 2D p5 canvases.
  Coordinates follow x cross y = z.

  Usage:
    const grid = jgrid3d({ range: 4 });

    function draw() {
      grid.draw({ progress: 1 });
    }
*/
(function (global) {
  "use strict";

  /**
   * Creates a perspective 3D math grid that renders into a 2D p5 canvas.
   *
   * @param {Object} [options] - Grid and camera configuration.
   * @returns {MathGrid3D} A 3D grid instance.
   *
   * @example
   * const grid = jgrid3d({ range: 4, scale: 80 });
   *
   * function draw() {
   *   background(10);
   *   grid.draw();
   *   grid.surface("z = \\sin(x) + \\cos(y)");
   * }
   */
  function jgrid3d(options) {
    return new MathGrid3D(options);
  }

  /**
   * Perspective right-handed 3D coordinate grid for p5 sketches.
   *
   * @example
   * const grid = new JGrid3D.MathGrid3D({
   *   camera: { x: 6, y: 4.5, z: 7 },
   *   target: { x: 0, y: 0, z: 0 }
   * });
   */
  class MathGrid3D {
    /**
     * Creates the grid, camera basis, colors, and axes.
     *
     * @param {Object} [options] - Grid and camera configuration.
     *
     * @example
     * const grid = new JGrid3D.MathGrid3D({
     *   range: 5,
     *   step: 1,
     *   focalLength: 18,
     *   showPlanes: true
     * });
     */
    constructor(options) {
      const settings = options || {};
      this.range = Number(settings.range) || 4;
      this.step = Number(settings.step) || 1;
      this.scale = Number(settings.scale) || 70;
      this.focalLength = Number(settings.focalLength) || 12;
      this.originX = settings.originX;
      this.originY = settings.originY;
      this.camera = settings.camera || { x: 6, y: 4.5, z: 7 };
      this.target = settings.target || { x: 0, y: 0, z: 0 };
      this.up = settings.up || { x: 0, y: 1, z: 0 };
      this.baseScale = this.scale;
      this.gridColor = settings.gridColor || "rgba(255,255,255,0.16)";
      this.planeColor = settings.planeColor || "rgba(255,255,255,0.08)";
      this.xGridColor = settings.xGridColor || "rgba(255, 120, 120, 0.13)";
      this.yGridColor = settings.yGridColor || "rgba(120, 255, 170, 0.13)";
      this.zGridColor = settings.zGridColor || "rgba(120, 178, 255, 0.13)";
      this.xColor = settings.xColor || "rgb(255, 96, 96)";
      this.yColor = settings.yColor || "rgb(92, 230, 142)";
      this.zColor = settings.zColor || "rgb(88, 166, 255)";
      this.labelColor = settings.labelColor || "rgba(255,255,255,0.86)";
      this.showLabels = settings.showLabels !== false;
      this.showPlanes = settings.showPlanes !== false;
      this.axesLength = Number(settings.axesLength) || this.range + 0.75;
      this.recalculateCamera();
    }

    /**
     * Sets the camera position and optionally target, up vector, and scale.
     *
     * @param {{x: number, y: number, z: number}} camera - Camera position.
     * @param {Object} [options] - Camera options.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.setCamera(
     *   { x: 8, y: 5, z: 8 },
     *   { target: { x: 0, y: 0, z: 0 }, scale: 90 }
     * );
     */
    setCamera(camera, options) {
      const settings = options || {};
      this.camera = point3(camera);
      if (settings.target) this.target = point3(settings.target);
      if (settings.up) this.up = point3(settings.up);
      if (settings.scale !== undefined) this.scale = Number(settings.scale);
      this.recalculateCamera();
      return this;
    }

    /**
     * Computes camera settings for a named canonical view.
     *
     * Supported names include `xy+`, `xy-`, `yz+`, `yz-`, `xz+`, `xz-`,
     * `q1` through `q4`, and octant names such as `octant+++`.
     *
     * @param {string} name - View name.
     * @param {Object} [options] - View options.
     * @returns {{camera: Object, target: Object, up: Object}} Camera configuration.
     *
     * @example
     * const top = grid.cameraForView("xy+", { distance: 8 });
     * grid.setCamera(top.camera, { target: top.target, up: top.up });
     */
    cameraForView(name, options) {
      const settings = options || {};
      const distance = Number(settings.distance) || 10;
      const direction = viewDirection(name);
      const target = settings.target ? point3(settings.target) : this.target;
      const up = viewUp(name, direction);

      return {
        camera: add(target, scalePoint(direction, distance)),
        target,
        up
      };
    }

    /**
     * Immediately moves the camera to a named canonical view.
     *
     * @param {string} name - View name such as `"xy+"` or `"octant+++"`.
     * @param {Object} [options] - Options passed to `cameraForView()`.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.snapToView("yz-", { distance: 9 });
     */
    snapToView(name, options) {
      const view = this.cameraForView(name, options);
      this.setCamera(view.camera, { target: view.target, up: view.up });
      return this;
    }

    /**
     * Animates the camera through named snap views using elapsed scene time.
     *
     * @param {string[]} sequence - Ordered view names.
     * @param {number} elapsedSeconds - Current elapsed time in seconds.
     * @param {Object} [options] - Animation options.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.animateSnapViews(["octant+++", "xy+", "yz-", "xz-"], scene.elapsed(), {
     *   transition: 1.6,
     *   hold: 0.55,
     *   distance: 8,
     *   zoom: 1.12
     * });
     */
    animateSnapViews(sequence, elapsedSeconds, options) {
      if (!sequence || sequence.length === 0) return this;

      const settings = options || {};
      const transition = Number(settings.transition) || 1.8;
      const hold = Number(settings.hold) || 0.85;
      const distance = Number(settings.distance) || 10;
      const zoom = Number(settings.zoom) || 1.16;
      const stepDuration = transition + hold;
      const cycleDuration = stepDuration * sequence.length;
      const cycleTime = positiveModulo(elapsedSeconds, cycleDuration);
      const index = Math.floor(cycleTime / stepDuration);
      const localTime = cycleTime - index * stepDuration;
      const from = sequence[index];
      const to = sequence[(index + 1) % sequence.length];
      const rawT = clamp(localTime / transition, 0, 1);
      const t = easeInOutSine(rawT);
      const fromView = this.cameraForView(from, { distance });
      const toView = this.cameraForView(to, { distance });
      const camera = lerpPoint(fromView.camera, toView.camera, t);
      const up = normalize(lerpPoint(fromView.up, toView.up, t));
      const zoomPulse = Math.sin(Math.PI * clamp(localTime / stepDuration, 0, 1));

      this.setCamera(camera, {
        target: lerpPoint(fromView.target, toView.target, t),
        up,
        scale: this.baseScale * (1 + (zoom - 1) * zoomPulse)
      });

      return this;
    }

    /**
     * Recalculates camera basis vectors after camera, target, or up changes.
     *
     * @returns {void}
     *
     * @example
     * grid.camera = { x: 4, y: 3, z: 5 };
     * grid.recalculateCamera();
     */
    recalculateCamera() {
      const forward = normalize(subtract(this.target, this.camera));
      let right = normalize(cross(forward, this.up));
      if (magnitude(right) < 0.0001) right = { x: 1, y: 0, z: 0 };
      const trueUp = normalize(cross(right, forward));

      this.forward = forward;
      this.right = right;
      this.trueUp = trueUp;
    }

    /**
     * Returns the 2D canvas center used for projection.
     *
     * @returns {{x: number, y: number}} Screen-space center.
     *
     * @example
     * const c = grid.center();
     * circle(c.x, c.y, 6);
     */
    center() {
      return {
        x: this.originX === undefined ? width / 2 : this.originX,
        y: this.originY === undefined ? height / 2 + 40 : this.originY
      };
    }

    /**
     * Draws grid planes and axes.
     *
     * @param {Object|number} [options] - Options object or progress number.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.draw();
     *
     * @example
     * grid.draw({ progress: min(1, frameCount / 90) });
     */
    draw(options) {
      if (typeof line !== "function") return this;

      const settings = typeof options === "number" ? { progress: options } : options || {};
      const progress = clamp(settings.progress === undefined ? 1 : settings.progress, 0, 1);

      push();
      this.drawGridPlanes(progress);
      this.drawAxes(progress);
      pop();

      return this;
    }

    /**
     * Draws a wireframe surface from a function or LaTeX-ish expression.
     *
     * @param {string|((x: number, y: number) => number)} expression - Surface function.
     * @param {Object} [options] - Surface drawing options.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.surface("z = \\sin(x) + \\cos(y)", {
     *   xRange: [-3, 3],
     *   yRange: [-3, 3],
     *   xSteps: 24,
     *   ySteps: 24
     * });
     *
     * @example
     * grid.surface((x, y) => Math.sin(x * y), { color: "white" });
     */
    surface(expression, options) {
      const expr = typeof expression === "function" ? null : global.jexpr(expression);
      const fn = typeof expression === "function" ? expression : (x, y) => expr.z(x, y);
      const settings = options || {};
      const xRange = settings.xRange || [-this.range, this.range];
      const yRange = settings.yRange || [-this.range, this.range];
      const xSteps = Math.max(2, Number(settings.xSteps) || 28);
      const ySteps = Math.max(2, Number(settings.ySteps) || 28);
      const color = settings.color || "rgba(255,255,255,0.72)";
      const weight = Number(settings.weight) || 1.4;
      const progress = clamp(settings.progress === undefined ? 1 : settings.progress, 0, 1);
      const lines = [];
      const rows = [];

      for (let yi = 0; yi <= ySteps; yi += 1) {
        const y = lerpValue(yRange[0], yRange[1], yi / ySteps);
        const row = [];

        for (let xi = 0; xi <= xSteps; xi += 1) {
          const x = lerpValue(xRange[0], xRange[1], xi / xSteps);
          const z = fn(x, y);
          row.push(Number.isFinite(z) ? vec(x, y, z) : null);
        }

        rows.push(row);
      }

      for (let y = 0; y < rows.length; y += 1) {
        for (let x = 0; x < rows[y].length - 1; x += 1) {
          if (rows[y][x] && rows[y][x + 1]) lines.push({ a: rows[y][x], b: rows[y][x + 1], color, weight });
        }
      }

      for (let x = 0; x <= xSteps; x += 1) {
        for (let y = 0; y < rows.length - 1; y += 1) {
          if (rows[y][x] && rows[y + 1][x]) lines.push({ a: rows[y][x], b: rows[y + 1][x], color, weight });
        }
      }

      push();
      noFill();
      this.drawSortedLines(lines, progress);
      pop();
      return this;
    }

    /**
     * Draws connected 3D points with optional progressive reveal.
     *
     * @param {{x: number, y: number, z: number}[]} points - Points to connect.
     * @param {Object} [options] - Stroke and progress options.
     * @returns {MathGrid3D} This grid for chaining.
     *
     * @example
     * grid.polyline([
     *   { x: -2, y: 0, z: 0 },
     *   { x: 0, y: 1, z: 1 },
     *   { x: 2, y: 0, z: 0 }
     * ], { color: "yellow", weight: 3 });
     */
    polyline(points, options) {
      const settings = options || {};
      const progress = clamp(settings.progress === undefined ? 1 : settings.progress, 0, 1);
      const lineCount = Math.max(0, Math.floor((points.length - 1) * progress));
      const partial = (points.length - 1) * progress - lineCount;

      push();
      noFill();
      stroke(settings.color || "white");
      strokeWeight(settings.weight || 2);

      for (let i = 0; i < lineCount; i += 1) {
        this.line3d(point3(points[i]), point3(points[i + 1]));
      }

      if (lineCount < points.length - 1 && partial > 0) {
        const a = point3(points[lineCount]);
        const b = point3(points[lineCount + 1]);
        this.line3d(a, lerpPoint(a, b, partial));
      }

      pop();
      return this;
    }

    /**
     * Draws the colored coordinate grid planes.
     *
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawGridPlanes(1);
     */
    drawGridPlanes(progress) {
      const lines = [];
      const r = this.range;

      for (let i = -r; i <= r; i += this.step) {
        if (this.showPlanes) {
          lines.push({ a: vec(-r, i, 0), b: vec(r, i, 0), color: this.xGridColor, weight: 1 });
          lines.push({ a: vec(i, -r, 0), b: vec(i, r, 0), color: this.yGridColor, weight: 1 });
          lines.push({ a: vec(-r, 0, i), b: vec(r, 0, i), color: this.xGridColor, weight: 1 });
          lines.push({ a: vec(i, 0, -r), b: vec(i, 0, r), color: this.zGridColor, weight: 1 });
        }

        lines.push({ a: vec(0, -r, i), b: vec(0, r, i), color: this.yGridColor, weight: 1 });
        lines.push({ a: vec(0, i, -r), b: vec(0, i, r), color: this.zGridColor, weight: 1 });
      }

      this.drawSortedLines(lines, progress);
    }

    /**
     * Draws the x, y, and z axes.
     *
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawAxes(0.8);
     */
    drawAxes(progress) {
      const l = this.axesLength;

      this.drawAxis(vec(-l, 0, 0), vec(l, 0, 0), this.xColor, "x", progress);
      this.drawAxis(vec(0, -l, 0), vec(0, l, 0), this.yColor, "y", progress);
      this.drawAxis(vec(0, 0, -l), vec(0, 0, l), this.zColor, "z", progress);
    }

    /**
     * Draws one axis line, arrowhead, and label.
     *
     * @param {Object} a - Negative endpoint.
     * @param {Object} b - Positive endpoint.
     * @param {string} color - Axis color.
     * @param {string} label - Axis label text without sign.
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawAxis({ x: -4, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, "red", "x", 1);
     */
    drawAxis(a, b, color, label, progress) {
      const mid = vec(0, 0, 0);
      const neg = lerpPoint(mid, a, progress);
      const pos = lerpPoint(mid, b, progress);

      stroke(color);
      strokeWeight(2.6);
      this.line3d(neg, pos);

      if (progress > 0.96) {
        this.drawArrowHead(a, b, color);
        if (this.showLabels) this.drawLabel(b, "+" + label, color);
      }
    }

    /**
     * Sorts 3D line segments by depth and draws them back-to-front.
     *
     * @param {{a: Object, b: Object, color: string, weight: number}[]} lines - Line segment descriptors.
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.drawSortedLines([{ a: vec(0,0,0), b: vec(1,1,1), color: "white", weight: 2 }], 1);
     */
    drawSortedLines(lines, progress) {
      lines
        .map((gridLine) => Object.assign({
          depth: this.cameraDepth(midpoint(gridLine.a, gridLine.b))
        }, gridLine))
        .sort((a, b) => b.depth - a.depth)
        .forEach((gridLine) => {
          stroke(gridLine.color);
          strokeWeight(gridLine.weight);
          this.line3dProgress(gridLine.a, gridLine.b, progress);
        });
    }

    /**
     * Projects and draws a complete 3D line segment.
     *
     * @param {Object} a - Start point.
     * @param {Object} b - End point.
     * @returns {void}
     *
     * @example
     * grid.line3d({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
     */
    line3d(a, b) {
      const pa = this.project(a);
      const pb = this.project(b);
      if (!pa || !pb) return;
      line(pa.x, pa.y, pb.x, pb.y);
    }

    /**
     * Draws a 3D line from its midpoint outward according to progress.
     *
     * @param {Object} a - Start point.
     * @param {Object} b - End point.
     * @param {number} progress - Reveal amount from 0 to 1.
     * @returns {void}
     *
     * @example
     * grid.line3dProgress({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 0.5);
     */
    line3dProgress(a, b, progress) {
      const center = midpoint(a, b);
      this.line3d(lerpPoint(center, a, progress), lerpPoint(center, b, progress));
    }

    /**
     * Projects a 3D point into 2D screen coordinates.
     *
     * @param {{x: number, y: number, z: number}} point - World-space point.
     * @returns {{x: number, y: number, depth: number}|null} Projected point, or null behind camera.
     *
     * @example
     * const p = grid.project({ x: 1, y: 1, z: 1 });
     * if (p) circle(p.x, p.y, 6);
     */
    project(point) {
      const relative = subtract(point, this.camera);
      const depth = dot(relative, this.forward);
      if (depth <= 0.001) return null;

      const center = this.center();
      const x = dot(relative, this.right);
      const y = dot(relative, this.trueUp);
      const perspective = this.focalLength / (this.focalLength + depth);

      return {
        x: center.x + x * this.scale * perspective,
        y: center.y - y * this.scale * perspective,
        depth
      };
    }

    /**
     * Returns a point's depth along the camera forward vector.
     *
     * @param {Object} point - World-space point.
     * @returns {number} Camera-relative depth.
     *
     * @example
     * const depth = grid.cameraDepth({ x: 0, y: 0, z: 0 });
     */
    cameraDepth(point) {
      return dot(subtract(point, this.camera), this.forward);
    }

    /**
     * Draws a 2D arrowhead at the projected end of a 3D axis.
     *
     * @param {Object} a - Axis start point.
     * @param {Object} b - Axis end point.
     * @param {string} color - Fill color.
     * @returns {void}
     *
     * @example
     * grid.drawArrowHead({ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, "red");
     */
    drawArrowHead(a, b, color) {
      const start = this.project(a);
      const end = this.project(b);
      if (!start || !end) return;

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const size = 12;

      push();
      noStroke();
      fill(color);
      triangle(
        end.x,
        end.y,
        end.x - Math.cos(angle - 0.45) * size,
        end.y - Math.sin(angle - 0.45) * size,
        end.x - Math.cos(angle + 0.45) * size,
        end.y - Math.sin(angle + 0.45) * size
      );
      pop();
    }

    /**
     * Draws a projected text label next to a 3D point.
     *
     * @param {Object} point - World-space label anchor.
     * @param {string} label - Text to draw.
     * @param {string} [color] - Fill color.
     * @returns {void}
     *
     * @example
     * grid.drawLabel({ x: 4, y: 0, z: 0 }, "+x", "red");
     */
    drawLabel(point, label, color) {
      const projected = this.project(point);
      if (!projected) return;

      push();
      noStroke();
      fill(color || this.labelColor);
      textSize(16);
      textAlign(CENTER, CENTER);
      text(label, projected.x + 18, projected.y - 8);
      pop();
    }
  }

  /**
   * Creates a 3D point object.
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} z - Z coordinate.
   * @returns {{x: number, y: number, z: number}} Point object.
   *
   * @example
   * vec(1, 2, 3); // { x: 1, y: 2, z: 3 }
   */
  function vec(x, y, z) {
    return { x, y, z };
  }

  /**
   * Converts a loose value into a numeric 3D point.
   *
   * @param {Object} value - Object with optional x, y, and z values.
   * @returns {{x: number, y: number, z: number}} Normalized point.
   *
   * @example
   * point3({ x: "2", y: null }); // { x: 2, y: 0, z: 0 }
   */
  function point3(value) {
    return vec(
      Number(value && value.x) || 0,
      Number(value && value.y) || 0,
      Number(value && value.z) || 0
    );
  }

  /**
   * Adds two 3D points.
   *
   * @param {Object} a - First point.
   * @param {Object} b - Second point.
   * @returns {Object} Sum point.
   *
   * @example
   * add(vec(1, 2, 3), vec(4, 5, 6)); // { x: 5, y: 7, z: 9 }
   */
  function add(a, b) {
    return vec(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  /**
   * Subtracts point `b` from point `a`.
   *
   * @param {Object} a - First point.
   * @param {Object} b - Point to subtract.
   * @returns {Object} Difference point.
   *
   * @example
   * subtract(vec(4, 5, 6), vec(1, 2, 3)); // { x: 3, y: 3, z: 3 }
   */
  function subtract(a, b) {
    return vec(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /**
   * Multiplies a point by a scalar.
   *
   * @param {Object} a - Point to scale.
   * @param {number} amount - Scalar multiplier.
   * @returns {Object} Scaled point.
   *
   * @example
   * scalePoint(vec(1, 2, 3), 2); // { x: 2, y: 4, z: 6 }
   */
  function scalePoint(a, amount) {
    return vec(a.x * amount, a.y * amount, a.z * amount);
  }

  /**
   * Computes the dot product of two 3D vectors.
   *
   * @param {Object} a - First vector.
   * @param {Object} b - Second vector.
   * @returns {number} Dot product.
   *
   * @example
   * dot(vec(1, 0, 0), vec(0, 1, 0)); // 0
   */
  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * Computes the cross product of two 3D vectors.
   *
   * @param {Object} a - First vector.
   * @param {Object} b - Second vector.
   * @returns {Object} Cross product vector.
   *
   * @example
   * cross(vec(1, 0, 0), vec(0, 1, 0)); // { x: 0, y: 0, z: 1 }
   */
  function cross(a, b) {
    return vec(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }

  /**
   * Normalizes a vector to unit length.
   *
   * @param {Object} a - Vector to normalize.
   * @returns {Object} Unit vector, or zero-like fallback if length is zero.
   *
   * @example
   * normalize(vec(3, 0, 0)); // { x: 1, y: 0, z: 0 }
   */
  function normalize(a) {
    const length = Math.hypot(a.x, a.y, a.z) || 1;
    return scalePoint(a, 1 / length);
  }

  /**
   * Computes vector magnitude.
   *
   * @param {Object} a - Vector to measure.
   * @returns {number} Euclidean length.
   *
   * @example
   * magnitude(vec(3, 4, 0)); // 5
   */
  function magnitude(a) {
    return Math.hypot(a.x, a.y, a.z);
  }

  /**
   * Computes the midpoint between two points.
   *
   * @param {Object} a - First point.
   * @param {Object} b - Second point.
   * @returns {Object} Midpoint.
   *
   * @example
   * midpoint(vec(0, 0, 0), vec(2, 2, 2)); // { x: 1, y: 1, z: 1 }
   */
  function midpoint(a, b) {
    return scalePoint(add(a, b), 0.5);
  }

  /**
   * Linearly interpolates between two 3D points.
   *
   * @param {Object} a - Start point.
   * @param {Object} b - End point.
   * @param {number} t - Interpolation amount from 0 to 1.
   * @returns {Object} Interpolated point.
   *
   * @example
   * lerpPoint(vec(0, 0, 0), vec(10, 0, 0), 0.25); // { x: 2.5, y: 0, z: 0 }
   */
  function lerpPoint(a, b, t) {
    const amount = clamp(t, 0, 1);
    return vec(
      a.x + (b.x - a.x) * amount,
      a.y + (b.y - a.y) * amount,
      a.z + (b.z - a.z) * amount
    );
  }

  /**
   * Linearly interpolates between numbers with clamped progress.
   *
   * @param {number} a - Start value.
   * @param {number} b - End value.
   * @param {number} t - Interpolation amount from 0 to 1.
   * @returns {number} Interpolated value.
   *
   * @example
   * lerpValue(10, 20, 0.5); // 15
   */
  function lerpValue(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  /**
   * Constrains a value to a closed interval.
   *
   * @param {number} value - Value to constrain.
   * @param {number} min - Lower bound.
   * @param {number} max - Upper bound.
   * @returns {number} Clamped value.
   *
   * @example
   * clamp(-0.4, 0, 1); // 0
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Smooth sine-based easing from 0 to 1.
   *
   * @param {number} t - Raw progress from 0 to 1.
   * @returns {number} Eased progress.
   *
   * @example
   * easeInOutSine(0); // 0
   * easeInOutSine(1); // 1
   */
  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
  }

  /**
   * Computes a modulo result that is always non-negative.
   *
   * @param {number} value - Value to wrap.
   * @param {number} divisor - Cycle length.
   * @returns {number} Positive modulo result.
   *
   * @example
   * positiveModulo(-1, 4); // 3
   */
  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  /**
   * Returns the normalized camera direction for a named view.
   *
   * @param {string} name - View name.
   * @returns {Object} Unit direction vector.
   *
   * @example
   * viewDirection("xy+"); // looks along positive z toward the xy plane
   */
  function viewDirection(name) {
    const key = String(name || "octant+++").toLowerCase();
    const views = {
      xy: vec(0, 0, 1),
      "xy+": vec(0, 0, 1),
      "xy-": vec(0, 0, -1),
      yz: vec(1, 0, 0),
      "yz+": vec(1, 0, 0),
      "yz-": vec(-1, 0, 0),
      xz: vec(0, 1, 0),
      "xz+": vec(0, 1, 0),
      "xz-": vec(0, -1, 0),
      q1: vec(1, 1, 1),
      q2: vec(-1, 1, 1),
      q3: vec(-1, 1, -1),
      q4: vec(1, 1, -1),
      "octant+++": vec(1, 1, 1),
      "octant-++": vec(-1, 1, 1),
      "octant--+": vec(-1, -1, 1),
      "octant+-+": vec(1, -1, 1),
      "octant++-": vec(1, 1, -1),
      "octant-+-": vec(-1, 1, -1),
      "octant---": vec(-1, -1, -1),
      "octant+--": vec(1, -1, -1)
    };

    return normalize(views[key] || views["octant+++"]);
  }

  /**
   * Chooses an up vector for a named camera view.
   *
   * @param {string} name - View name.
   * @param {Object} direction - Camera direction.
   * @returns {Object} Up vector.
   *
   * @example
   * viewUp("xz+", vec(0, 1, 0)); // { x: 0, y: 0, z: -1 }
   */
  function viewUp(name, direction) {
    const key = String(name || "").toLowerCase();
    if (key.startsWith("xz+")) return vec(0, 0, -1);
    if (key.startsWith("xz-")) return vec(0, 0, 1);
    if (Math.abs(direction.y) > 0.92) return vec(0, 0, direction.y > 0 ? -1 : 1);
    return vec(0, 1, 0);
  }

  global.JGrid3D = {
    MathGrid3D,
    create: jgrid3d
  };
  global.jgrid3d = jgrid3d;
})(window);
