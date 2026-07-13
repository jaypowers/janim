/*
  JPrim3D

  Flat-shaded 3D primitives for JGrid3D.

  Usage:
    const prim = jprim3d(grid3d);
    prim.sphere({ x: 0, y: 0, z: 0 }, 1);
    prim.torus({ x: 0, y: 0, z: 0 }, { majorRadius: 2, minorRadius: 0.4 });
    prim.sphere({ x: 0, y: 0, z: 0 }, 1, { wireframe: true });
*/
(function (global) {
  "use strict";

  /**
   * Creates a 3D primitive drawer bound to a `JGrid3D.MathGrid3D` instance.
   *
   * @param {MathGrid3D} grid - Grid used for projection and line drawing.
   * @returns {Primitives3D} Primitive drawing helper.
   *
   * @example
   * const grid = jgrid3d({ range: 4 });
   * const prim = jprim3d(grid);
   *
   * function draw() {
   *   grid.draw();
   *   prim.sphere({ x: 0, y: 0, z: 0 }, 1, { wireframe: true });
   * }
   */
  function jprim3d(grid) {
    return new Primitives3D(grid);
  }

  /**
   * Draws flat-shaded and wireframe 3D primitives through a 3D grid.
   *
   * @example
   * const prim = new JPrim3D.Primitives3D(grid);
   * prim.cone({ x: 0, y: 0, z: 0 }, { radius: 1, height: 2 });
   */
  class Primitives3D {
    /**
     * Creates a primitive renderer.
     *
     * @param {MathGrid3D} grid - Projection and drawing grid.
     *
     * @example
     * const prim = new JPrim3D.Primitives3D(jgrid3d());
     */
    constructor(grid) {
      this.grid = grid;
      this.light = normalize({ x: -0.35, y: -0.55, z: 1 });
    }

    /**
     * Draws a flat-shaded sphere and optional guide wireframe.
     *
     * @param {{x: number, y: number, z: number}} center - Sphere center.
     * @param {number} radius - Sphere radius.
     * @param {Object} [options] - Drawing options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.sphere({ x: 0, y: 0, z: 0 }, 1, {
     *   color: "rgba(255,255,255,0.85)",
     *   fill: "rgba(255,120,120,0.45)",
     *   wireframe: true,
     *   progress: scene.progress()
     * });
     */
    sphere(center, radius, options) {
      const settings = options || {};
      const c = point3(center);
      const r = Number(radius) || 1;
      const segments = Number(settings.segments) || 48;
      const rings = Number(settings.rings) || 12;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const vertices = [];
      const faces = [];

      for (let ring = 0; ring <= rings; ring += 1) {
        const phi = -Math.PI / 2 + Math.PI * ring / rings;
        const row = [];

        for (let segment = 0; segment < segments; segment += 1) {
          const theta = Math.PI * 2 * segment / segments;
          row.push({
            x: c.x + Math.cos(phi) * Math.cos(theta) * r,
            y: c.y + Math.cos(phi) * Math.sin(theta) * r,
            z: c.z + Math.sin(phi) * r
          });
        }

        vertices.push(row);
      }

      for (let ring = 0; ring < rings; ring += 1) {
        for (let segment = 0; segment < segments; segment += 1) {
          faces.push([
            vertices[ring][segment],
            vertices[ring][(segment + 1) % segments],
            vertices[ring + 1][(segment + 1) % segments],
            vertices[ring + 1][segment]
          ]);
        }
      }

      this.drawFaces(faces, {
        color: settings.fill || color,
        progress,
        shade: settings.shade
      });

      if (settings.wireframe) {
        this.drawSphereWireframe(c, r, {
          color: settings.wireColor || color,
          progress,
          segments,
          rings,
          weight: settings.wireWeight || 1.3
        });
      }
      return this;
    }

    /**
     * Draws a cone centered around a point.
     *
     * @param {{x: number, y: number, z: number}} center - Cone center.
     * @param {Object} [options] - Cone geometry and drawing options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.cone({ x: 2, y: 0, z: 0 }, {
     *   radius: 0.8,
     *   height: 2,
     *   wireframe: true,
     *   color: "rgba(120,255,170,0.85)"
     * });
     */
    cone(center, options) {
      const settings = options || {};
      const c = point3(center);
      const radius = Number(settings.radius) || 1;
      const height = Number(settings.height) || 2;
      const segments = Number(settings.segments) || 48;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const baseZ = c.z - height / 2;
      const tip = { x: c.x, y: c.y, z: c.z + height / 2 };
      const faces = [];

      for (let i = 0; i < segments; i += 1) {
        const a = Math.PI * 2 * i / segments;
        const b = Math.PI * 2 * (i + 1) / segments;
        const baseA = {
          x: c.x + Math.cos(a) * radius,
          y: c.y + Math.sin(a) * radius,
          z: baseZ
        };
        const baseB = {
          x: c.x + Math.cos(b) * radius,
          y: c.y + Math.sin(b) * radius,
          z: baseZ
        };

        faces.push([baseA, baseB, tip]);
        faces.push([{ x: c.x, y: c.y, z: baseZ }, baseB, baseA]);
      }

      this.drawFaces(faces, {
        color: settings.fill || color,
        progress,
        shade: settings.shade
      });

      if (settings.wireframe) {
        this.drawConeWireframe(c, radius, height, {
          color: settings.wireColor || color,
          progress,
          segments,
          weight: settings.wireWeight || 1.3
        });
      }

      return this;
    }

    /**
     * Draws a torus centered around a point.
     *
     * @param {{x: number, y: number, z: number}} center - Torus center.
     * @param {Object} [options] - Torus geometry and drawing options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.torus({ x: 0, y: 2, z: 0 }, {
     *   majorRadius: 1.2,
     *   minorRadius: 0.25,
     *   wireframe: true
     * });
     */
    torus(center, options) {
      const settings = options || {};
      const c = point3(center);
      const majorRadius = Number(settings.majorRadius) || 1.6;
      const minorRadius = Number(settings.minorRadius) || 0.35;
      const majorSegments = Number(settings.majorSegments) || 56;
      const minorSegments = Number(settings.minorSegments) || 18;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const vertices = [];
      const faces = [];

      for (let i = 0; i < majorSegments; i += 1) {
        const u = Math.PI * 2 * i / majorSegments;
        const row = [];

        for (let j = 0; j < minorSegments; j += 1) {
          const v = Math.PI * 2 * j / minorSegments;
          row.push({
            x: c.x + (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
            y: c.y + (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
            z: c.z + minorRadius * Math.sin(v)
          });
        }

        vertices.push(row);
      }

      for (let i = 0; i < majorSegments; i += 1) {
        for (let j = 0; j < minorSegments; j += 1) {
          faces.push([
            vertices[i][j],
            vertices[(i + 1) % majorSegments][j],
            vertices[(i + 1) % majorSegments][(j + 1) % minorSegments],
            vertices[i][(j + 1) % minorSegments]
          ]);
        }
      }

      this.drawFaces(faces, {
        color: settings.fill || color,
        progress,
        shade: settings.shade
      });

      if (settings.wireframe) {
        this.drawTorusWireframe(c, majorRadius, minorRadius, {
          color: settings.wireColor || color,
          progress,
          majorSegments,
          minorSegments,
          weight: settings.wireWeight || 1.15
        });
      }

      return this;
    }

    /**
     * Alias for `torus()` kept for misspelled calls.
     *
     * @param {{x: number, y: number, z: number}} center - Torus center.
     * @param {Object} [options] - Torus options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.taurus({ x: 0, y: 0, z: 0 }, { majorRadius: 1.5 });
     */
    taurus(center, options) {
      return this.torus(center, options);
    }

    /**
     * Draws a 3D circle on one coordinate plane.
     *
     * @param {Object} center - Circle center.
     * @param {number} radius - Circle radius.
     * @param {Object} [options] - Drawing options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.circle({ x: 0, y: 0, z: 0 }, 2, {
     *   plane: "xz",
     *   color: "white",
     *   progress: 0.75
     * });
     */
    circle(center, radius, options) {
      const settings = options || {};
      const c = point3(center);
      const r = Number(radius) || 1;
      const segments = Number(settings.segments) || 64;
      const points = [];

      for (let i = 0; i <= segments; i += 1) {
        const angle = Math.PI * 2 * i / segments;
        points.push(pointOnPlane(c, r, angle, settings.plane || "xy"));
      }

      this.grid.polyline(points, {
        color: settings.color || "rgba(255,255,255,0.85)",
        weight: settings.weight || 1.8,
        progress: settings.progress
      });
      return this;
    }

    /**
     * Draws a filled 3D circle on one coordinate plane.
     *
     * @param {Object} center - Circle center.
     * @param {number} radius - Circle radius.
     * @param {Object} [options] - Fill and wireframe options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.filledCircle({ x: 0, y: 0, z: 0 }, 1.5, {
     *   plane: "xy",
     *   fill: "rgba(255,255,255,0.15)",
     *   wireframe: true
     * });
     */
    filledCircle(center, radius, options) {
      const settings = options || {};
      const c = point3(center);
      const r = Number(radius) || 1;
      const segments = Number(settings.segments) || 64;
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const count = Math.max(3, Math.floor(segments * progress));

      push();
      noStroke();
      fill(settings.fill || "rgba(255,255,255,0.12)");
      beginShape();

      for (let i = 0; i <= count; i += 1) {
        const angle = Math.PI * 2 * i / segments;
        const projected = this.grid.project(pointOnPlane(c, r, angle, settings.plane || "xy"));
        if (projected) vertex(projected.x, projected.y);
      }

      endShape(CLOSE);
      pop();

      if (settings.wireframe) this.circle(c, r, settings);
      return this;
    }

    /**
     * Draws latitude and longitude guide curves for a sphere.
     *
     * @param {Object} center - Sphere center.
     * @param {number} radius - Sphere radius.
     * @param {Object} [options] - Wireframe options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.drawSphereWireframe({ x: 0, y: 0, z: 0 }, 1, {
     *   longitudes: 10,
     *   color: "rgba(255,255,255,0.8)"
     * });
     */
    drawSphereWireframe(center, radius, options) {
      const settings = options || {};
      const segments = Number(settings.segments) || 48;
      const rings = Number(settings.rings) || 12;
      const longitudeCount = Number(settings.longitudes) || 8;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const weight = settings.weight || 1.3;

      for (let ring = 1; ring < rings; ring += 1) {
        const phi = -Math.PI / 2 + Math.PI * ring / rings;
        const ringRadius = Math.cos(phi) * radius;
        const z = Math.sin(phi) * radius;
        this.circle({ x: center.x, y: center.y, z: center.z + z }, ringRadius, {
          plane: "xy",
          color,
          segments,
          progress,
          weight
        });
      }

      for (let longitude = 0; longitude < longitudeCount; longitude += 1) {
        const theta = Math.PI * 2 * longitude / longitudeCount;
        const points = [];

        for (let i = 0; i <= segments; i += 1) {
          const phi = -Math.PI / 2 + Math.PI * i / segments;
          points.push({
            x: center.x + Math.cos(phi) * Math.cos(theta) * radius,
            y: center.y + Math.cos(phi) * Math.sin(theta) * radius,
            z: center.z + Math.sin(phi) * radius
          });
        }

        this.grid.polyline(points, { color, weight, progress });
      }

      return this;
    }

    /**
     * Draws base rings and meridians for a cone.
     *
     * @param {Object} center - Cone center.
     * @param {number} radius - Base radius.
     * @param {number} height - Cone height.
     * @param {Object} [options] - Wireframe options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.drawConeWireframe({ x: 0, y: 0, z: 0 }, 1, 2, { meridians: 12 });
     */
    drawConeWireframe(center, radius, height, options) {
      const settings = options || {};
      const segments = Number(settings.segments) || 48;
      const meridians = Number(settings.meridians) || 8;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const weight = settings.weight || 1.3;
      const baseZ = center.z - height / 2;
      const tip = { x: center.x, y: center.y, z: center.z + height / 2 };

      this.circle({ x: center.x, y: center.y, z: baseZ }, radius, {
        plane: "xy",
        color,
        segments,
        progress,
        weight
      });

      for (let i = 1; i <= 2; i += 1) {
        const t = i / 3;
        this.circle({ x: center.x, y: center.y, z: baseZ + height * t }, radius * (1 - t), {
          plane: "xy",
          color,
          segments,
          progress,
          weight: weight * 0.8
        });
      }

      for (let i = 0; i < meridians; i += 1) {
        const angle = Math.PI * 2 * i / meridians;
        const base = {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          z: baseZ
        };
        this.grid.polyline([base, tip], { color, weight, progress });
      }

      return this;
    }

    /**
     * Draws major and minor guide curves for a torus.
     *
     * @param {Object} center - Torus center.
     * @param {number} majorRadius - Distance from center to tube center.
     * @param {number} minorRadius - Tube radius.
     * @param {Object} [options] - Wireframe options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.drawTorusWireframe({ x: 0, y: 0, z: 0 }, 1.6, 0.35, {
     *   majorSegments: 72,
     *   minorSegments: 24
     * });
     */
    drawTorusWireframe(center, majorRadius, minorRadius, options) {
      const settings = options || {};
      const majorSegments = Number(settings.majorSegments) || 56;
      const minorSegments = Number(settings.minorSegments) || 18;
      const color = settings.color || "rgba(255,255,255,0.82)";
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const weight = settings.weight || 1.15;

      for (let j = 0; j < minorSegments; j += 3) {
        const v = Math.PI * 2 * j / minorSegments;
        const points = [];

        for (let i = 0; i <= majorSegments; i += 1) {
          const u = Math.PI * 2 * i / majorSegments;
          points.push({
            x: center.x + (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
            y: center.y + (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
            z: center.z + minorRadius * Math.sin(v)
          });
        }

        this.grid.polyline(points, { color, weight, progress });
      }

      for (let i = 0; i < majorSegments; i += 7) {
        const u = Math.PI * 2 * i / majorSegments;
        const points = [];

        for (let j = 0; j <= minorSegments; j += 1) {
          const v = Math.PI * 2 * j / minorSegments;
          points.push({
            x: center.x + (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
            y: center.y + (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
            z: center.z + minorRadius * Math.sin(v)
          });
        }

        this.grid.polyline(points, { color, weight, progress });
      }

      return this;
    }

    /**
     * Depth-sorts and draws shaded polygon faces.
     *
     * @param {Object[][]} faces - Array of polygon faces, each as 3D points.
     * @param {Object} [options] - Fill, shade, and progress options.
     * @returns {Primitives3D} This renderer for chaining.
     *
     * @example
     * prim.drawFaces([
     *   [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]
     * ], { color: "rgba(255,255,255,0.7)", shade: 0.6 });
     */
    drawFaces(faces, options) {
      const settings = options || {};
      const progress = settings.progress === undefined ? 1 : settings.progress;
      const faceCount = Math.floor(faces.length * clamp(progress, 0, 1));
      const color = parseColor(settings.color || "rgba(255,255,255,0.7)");
      const shadeAmount = settings.shade === undefined ? 0.72 : Number(settings.shade);

      faces
        .slice(0, faceCount)
        .map((face) => ({
          points: face,
          depth: average(face.map((point) => this.grid.cameraDepth(point)))
        }))
        .sort((a, b) => b.depth - a.depth)
        .forEach((face) => {
          const projected = face.points.map((point) => this.grid.project(point));
          if (projected.some((point) => !point)) return;

          const normal = faceNormal(face.points);
          const light = Math.max(0, dot(normal, this.light));
          const brightness = 1 - shadeAmount + shadeAmount * light;

          push();
          noStroke();
          fill(shadeColor(color, brightness));
          beginShape();
          projected.forEach((point) => vertex(point.x, point.y));
          endShape(CLOSE);
          pop();
        });

      return this;
    }
  }

  /**
   * Returns a point on a circle lying on a named coordinate plane.
   *
   * @param {Object} center - Circle center.
   * @param {number} radius - Circle radius.
   * @param {number} angle - Angle in radians.
   * @param {"xy"|"xz"|"yz"} plane - Coordinate plane.
   * @returns {{x: number, y: number, z: number}} Point on the plane.
   *
   * @example
   * pointOnPlane({ x: 0, y: 0, z: 0 }, 1, Math.PI / 2, "xy");
   * // { x: 0, y: 1, z: 0 } approximately
   */
  function pointOnPlane(center, radius, angle, plane) {
    const u = Math.cos(angle) * radius;
    const v = Math.sin(angle) * radius;

    if (plane === "xz") return { x: center.x + u, y: center.y, z: center.z + v };
    if (plane === "yz") return { x: center.x, y: center.y + u, z: center.z + v };
    return { x: center.x + u, y: center.y + v, z: center.z };
  }

  /**
   * Converts a loose value into a numeric 3D point.
   *
   * @param {Object} value - Object with optional x, y, and z fields.
   * @returns {{x: number, y: number, z: number}} Normalized point.
   *
   * @example
   * point3({ x: "2", z: 5 }); // { x: 2, y: 0, z: 5 }
   */
  function point3(value) {
    return {
      x: Number(value && value.x) || 0,
      y: Number(value && value.y) || 0,
      z: Number(value && value.z) || 0
    };
  }

  /**
   * Subtracts point `b` from point `a`.
   *
   * @param {Object} a - First point.
   * @param {Object} b - Point to subtract.
   * @returns {Object} Difference point.
   *
   * @example
   * subtract({ x: 3, y: 2, z: 1 }, { x: 1, y: 1, z: 1 });
   * // { x: 2, y: 1, z: 0 }
   */
  function subtract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z
    };
  }

  /**
   * Computes the cross product of two vectors.
   *
   * @param {Object} a - First vector.
   * @param {Object} b - Second vector.
   * @returns {Object} Cross product.
   *
   * @example
   * cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
   * // { x: 0, y: 0, z: 1 }
   */
  function cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  /**
   * Computes the dot product of two vectors.
   *
   * @param {Object} a - First vector.
   * @param {Object} b - Second vector.
   * @returns {number} Dot product.
   *
   * @example
   * dot({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }); // 32
   */
  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * Normalizes a vector to unit length.
   *
   * @param {Object} point - Vector to normalize.
   * @returns {Object} Unit vector.
   *
   * @example
   * normalize({ x: 0, y: 0, z: 2 }); // { x: 0, y: 0, z: 1 }
   */
  function normalize(point) {
    const length = Math.hypot(point.x, point.y, point.z) || 1;
    return {
      x: point.x / length,
      y: point.y / length,
      z: point.z / length
    };
  }

  /**
   * Computes a polygon face normal from its first three points.
   *
   * @param {Object[]} points - Face vertices.
   * @returns {Object} Unit normal vector.
   *
   * @example
   * faceNormal([{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]);
   * // { x: 0, y: 0, z: 1 }
   */
  function faceNormal(points) {
    if (points.length < 3) return { x: 0, y: 0, z: 1 };
    return normalize(cross(subtract(points[1], points[0]), subtract(points[2], points[0])));
  }

  /**
   * Computes the average of numeric values.
   *
   * @param {number[]} values - Values to average.
   * @returns {number} Average, or 0 for an empty array.
   *
   * @example
   * average([2, 4, 6]); // 4
   */
  function average(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
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
   * clamp(1.2, 0, 1); // 1
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Parses simple CSS `rgb()`, `rgba()`, or six-digit hex colors.
   *
   * @param {string} value - Color string.
   * @returns {{r: number, g: number, b: number, a: number}} Parsed color.
   *
   * @example
   * parseColor("#ff0000"); // { r: 255, g: 0, b: 0, a: 1 }
   * parseColor("rgba(10,20,30,0.5)"); // { r: 10, g: 20, b: 30, a: 0.5 }
   */
  function parseColor(value) {
    const text = String(value || "").trim();
    let match = text.match(/^rgba?\(([^)]+)\)$/i);

    if (match) {
      const parts = match[1].split(",").map((part) => Number(part.trim()));
      return {
        r: parts[0] || 255,
        g: parts[1] || 255,
        b: parts[2] || 255,
        a: parts[3] === undefined ? 1 : parts[3]
      };
    }

    match = text.match(/^#([0-9a-f]{6})$/i);
    if (match) {
      return {
        r: parseInt(match[1].slice(0, 2), 16),
        g: parseInt(match[1].slice(2, 4), 16),
        b: parseInt(match[1].slice(4, 6), 16),
        a: 1
      };
    }

    return { r: 255, g: 255, b: 255, a: 0.7 };
  }

  /**
   * Applies brightness to a parsed color and returns an rgba string.
   *
   * @param {{r: number, g: number, b: number, a: number}} color - Parsed color.
   * @param {number} brightness - Brightness multiplier.
   * @returns {string} CSS rgba color.
   *
   * @example
   * shadeColor({ r: 100, g: 100, b: 100, a: 1 }, 1.2);
   * // "rgba(120,120,120,1)"
   */
  function shadeColor(color, brightness) {
    const amount = clamp(brightness, 0, 1.4);
    return "rgba(" +
      Math.round(clamp(color.r * amount, 0, 255)) + "," +
      Math.round(clamp(color.g * amount, 0, 255)) + "," +
      Math.round(clamp(color.b * amount, 0, 255)) + "," +
      color.a + ")";
  }

  global.JPrim3D = {
    Primitives3D,
    create: jprim3d
  };
  global.jprim3d = jprim3d;
})(window);
