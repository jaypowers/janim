class Equation {
  constructor(latex, options = {}) {
    this.latex = latex;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.rotation = options.rotation || 0;
    this.scaleAmount = options.scale || 1;
    this.image = null;
    this.animations = [];

    latexImage(latex, {
      size: options.size || 36,
      color: options.color || "black",
      display: options.display
    }).then((img) => {
      this.image = img;
    });
  }

  translate(x, y, options = {}) {
    if (options.duration) {
      this.animate("x", x, options);
      this.animate("y", y, options);
    } else {
      this.stopAnimation("x");
      this.stopAnimation("y");
      this.x = x;
      this.y = y;
    }
    return this;
  }

  rotate(angle, options = {}) {
    if (options.duration) {
      this.animate("rotation", angle, options);
    } else {
      this.stopAnimation("rotation");
      this.rotation = angle;
    }
    return this;
  }

  scale(amount, options = {}) {
    if (options.duration) {
      this.animate("scaleAmount", amount, options);
    } else {
      this.stopAnimation("scaleAmount");
      this.scaleAmount = amount;
    }
    return this;
  }

  update(dt) {
    const seconds = dt || deltaTime / 1000 || 1 / 60;

    this.animations = this.animations.filter((animation) => {
      animation.elapsed += seconds;

      const raw = constrain((animation.elapsed - animation.delay) / animation.duration, 0, 1);
      const value = lerp(animation.from, animation.to, animation.ease(raw));
      this[animation.property] = value;

      if (raw < 1) return true;
      if (!animation.loop) return false;

      animation.elapsed = 0;
      if (animation.yoyo) {
        const from = animation.from;
        animation.from = animation.to;
        animation.to = from;
      }
      return true;
    });

    return this;
  }

  draw() {
    if (!this.image) return this;

    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scaleAmount);
    image(this.image, 0, 0);
    pop();

    return this;
  }

  animate(property, to, options = {}) {
    this.stopAnimation(property);
    this.animations.push({
      property,
      from: options.from === undefined ? this[property] : options.from,
      to,
      duration: Math.max(0.0001, options.duration || 1),
      delay: options.delay || 0,
      elapsed: 0,
      ease: easing(options.ease),
      loop: Boolean(options.loop),
      yoyo: Boolean(options.yoyo)
    });
    return this;
  }

  stopAnimation(property) {
    this.animations = this.animations.filter((animation) => animation.property !== property);
    return this;
  }
}

function easing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return (t) => t;
  if (name === "easeInQuad") return (t) => t * t;
  if (name === "easeOutQuad") return (t) => t * (2 - t);
  return (t) => -(Math.cos(Math.PI * t) - 1) / 2;
}
