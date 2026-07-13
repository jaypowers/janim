/*
  Janimation

  Small p5 animation helpers for math sketches.

  Usage:
    const path = Janimation.path([{ x: -120, y: 0 }, { x: 120, y: 0 }]);
    const eq = Janimation.formula(img, { x: width / 2, y: height / 2 });
    eq.uncover(1).follow(path, 3, { loop: true });

    function draw() {
      eq.update();
      eq.draw();
    }
*/
(function (global) {
  "use strict";

  const TAU = Math.PI * 2;

  const Easings = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3)
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerpValue(a, b, t) {
    return a + (b - a) * t;
  }

  function getEase(ease) {
    if (typeof ease === "function") return ease;
    return Easings[ease] || Easings.easeInOutQuad;
  }

  function pointFrom(value) {
    return {
      x: Number(value && value.x) || 0,
      y: Number(value && value.y) || 0
    };
  }

  function tween(from, to, duration, options) {
    return new Tween(from, to, duration, options);
  }

  class Tween {
    constructor(from, to, duration, options) {
      const settings = options || {};
      this.from = Number(from) || 0;
      this.to = Number(to) || 0;
      this.duration = Math.max(0.0001, Number(duration) || 1);
      this.delay = Math.max(0, Number(settings.delay) || 0);
      this.elapsed = 0;
      this.loop = Boolean(settings.loop);
      this.yoyo = Boolean(settings.yoyo);
      this.done = false;
      this.ease = getEase(settings.ease || "easeInOutQuad");
      this.onComplete = settings.onComplete;
    }

    update(dt) {
      if (this.done) return this.value();

      this.elapsed += Number(dt) || getDeltaSeconds();

      if (this.elapsed >= this.delay + this.duration) {
        if (this.loop) {
          this.elapsed -= this.duration;
          if (this.yoyo) {
            const from = this.from;
            this.from = this.to;
            this.to = from;
          }
        } else {
          this.elapsed = this.delay + this.duration;
          this.done = true;
          if (typeof this.onComplete === "function") this.onComplete();
        }
      }

      return this.value();
    }

    value() {
      const raw = clamp((this.elapsed - this.delay) / this.duration, 0, 1);
      return lerpValue(this.from, this.to, this.ease(raw));
    }

    reset() {
      this.elapsed = 0;
      this.done = false;
      return this;
    }
  }

  function path(points, options) {
    return new MotionPath(points, options);
  }

  class MotionPath {
    constructor(points, options) {
      const settings = options || {};
      this.points = (points || []).map(pointFrom);
      this.closed = Boolean(settings.closed);
      this.lengths = [];
      this.totalLength = 0;
      this.recalculate();
    }

    recalculate() {
      this.lengths = [];
      this.totalLength = 0;

      const segmentCount = this.closed ? this.points.length : this.points.length - 1;
      for (let i = 0; i < segmentCount; i += 1) {
        const a = this.points[i];
        const b = this.points[(i + 1) % this.points.length];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        this.lengths.push(length);
        this.totalLength += length;
      }
    }

    pointAt(t) {
      if (this.points.length === 0) return { x: 0, y: 0 };
      if (this.points.length === 1 || this.totalLength === 0) return pointFrom(this.points[0]);

      let target = clamp(t, 0, 1) * this.totalLength;

      for (let i = 0; i < this.lengths.length; i += 1) {
        const length = this.lengths[i];
        if (target <= length || i === this.lengths.length - 1) {
          const a = this.points[i];
          const b = this.points[(i + 1) % this.points.length];
          const localT = length === 0 ? 0 : target / length;
          return {
            x: lerpValue(a.x, b.x, localT),
            y: lerpValue(a.y, b.y, localT)
          };
        }
        target -= length;
      }

      return pointFrom(this.points[this.points.length - 1]);
    }

    draw(options) {
      if (this.points.length < 2 || typeof beginShape !== "function") return;

      const settings = options || {};
      push();
      noFill();
      stroke(settings.color || "rgba(255,255,255,0.45)");
      strokeWeight(settings.weight || 2);
      beginShape();
      this.points.forEach((point) => vertex(point.x, point.y));
      if (this.closed) endShape(CLOSE);
      else endShape();
      pop();
    }
  }

  function formula(img, options) {
    return new FormulaAnimation(img, options);
  }

  class FormulaAnimation {
    constructor(img, options) {
      const settings = options || {};
      this.img = img;
      this.x = Number(settings.x) || 0;
      this.y = Number(settings.y) || 0;
      this.rotation = Number(settings.rotation) || 0;
      this.scale = settings.scale === undefined ? 1 : Number(settings.scale);
      this.alpha = settings.alpha === undefined ? 255 : Number(settings.alpha);
      this.reveal = settings.reveal === undefined ? 1 : Number(settings.reveal);
      this.anchorX = settings.anchorX === undefined ? 0.5 : Number(settings.anchorX);
      this.anchorY = settings.anchorY === undefined ? 0.5 : Number(settings.anchorY);
      this.revealDirection = settings.revealDirection || "left";
      this.animations = [];
    }

    animate(property, to, duration, options) {
      const settings = options || {};
      const animation = {
        type: "property",
        property,
        tween: tween(this[property], to, duration, settings)
      };
      this.animations.push(animation);
      return this;
    }

    moveTo(x, y, duration, options) {
      const settings = options || {};
      this.animate("x", x, duration, settings);
      this.animate("y", y, duration, settings);
      return this;
    }

    rotateTo(angle, duration, options) {
      return this.animate("rotation", angle, duration, options);
    }

    uncover(duration, options) {
      const settings = options || {};
      this.reveal = settings.from === undefined ? 0 : Number(settings.from);
      this.revealDirection = settings.direction || this.revealDirection;
      return this.animate("reveal", settings.to === undefined ? 1 : settings.to, duration, settings);
    }

    follow(motionPath, duration, options) {
      const settings = options || {};
      this.animations.push({
        type: "path",
        path: motionPath,
        tween: tween(0, 1, duration, settings),
        offsetX: Number(settings.offsetX) || 0,
        offsetY: Number(settings.offsetY) || 0
      });
      return this;
    }

    update(dt) {
      const seconds = Number(dt) || getDeltaSeconds();
      this.animations = this.animations.filter((animation) => {
        const value = animation.tween.update(seconds);

        if (animation.type === "property") {
          this[animation.property] = value;
        }

        if (animation.type === "path") {
          const point = animation.path.pointAt(value);
          this.x = point.x + animation.offsetX;
          this.y = point.y + animation.offsetY;
        }

        return !animation.tween.done || animation.tween.loop;
      });

      return this;
    }

    draw() {
      if (!this.img || typeof image !== "function") return this;

      const w = this.img.width;
      const h = this.img.height;
      const drawX = -w * this.anchorX;
      const drawY = -h * this.anchorY;

      push();
      translate(this.x, this.y);
      rotate(this.rotation);
      scale(this.scale);
      imageMode(CORNER);

      if (this.alpha < 255) tint(255, clamp(this.alpha, 0, 255));

      if (this.reveal < 1) {
        drawClippedImage(this.img, drawX, drawY, w, h, this.reveal, this.revealDirection);
      } else {
        image(this.img, drawX, drawY);
      }

      pop();
      return this;
    }
  }

  function drawClippedImage(img, x, y, w, h, reveal, direction) {
    const amount = clamp(reveal, 0, 1);
    const ctx = drawingContext;
    let clipX = x;
    let clipY = y;
    let clipW = w;
    let clipH = h;

    if (direction === "right") {
      clipX = x + w * (1 - amount);
      clipW = w * amount;
    } else if (direction === "up") {
      clipY = y + h * (1 - amount);
      clipH = h * amount;
    } else if (direction === "down") {
      clipH = h * amount;
    } else {
      clipW = w * amount;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipW, clipH);
    ctx.clip();
    image(img, x, y);
    ctx.restore();
  }

  function getDeltaSeconds() {
    if (typeof deltaTime === "number" && deltaTime > 0) return deltaTime / 1000;
    return 1 / 60;
  }

  global.Janimation = {
    Ease: Easings,
    Formula: FormulaAnimation,
    MotionPath,
    Tween,
    clamp,
    formula,
    path,
    tween
  };
})(window);
