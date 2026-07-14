/**
 * Renders a LaTeX expression into a p5 image and animates it.
 *
 * Use `Equation(...)` for mathematical labels, notation, and titles that should
 * be typeset by MathJax.
 *
 * @example
 * const title = new Equation("\\text{Permutations}", {
 *   x: width / 2,
 *   y: 72,
 *   size: 28,
 *   color: color(220, 235, 255)
 * });
 *
 * title.reveal({ duration: 1.5, letters: true });
 */
class EquationObject {
  /**
   * @param {string} latex - LaTeX source.
   * @param {Object} [options] - Display and animation options.
   * @param {number} [options.x=0] - Center x-position.
   * @param {number} [options.y=0] - Center y-position.
   * @param {number} [options.size=36] - MathJax render size.
   * @param {*} [options.color="black"] - p5 color or RGB-like value.
   * @param {*} [options.shineColor] - Highlight color used during reveal.
   */
  constructor(latex, options = {}) {
    this.latex = latex;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.rotation = options.rotation || 0;
    this.scaleAmount = options.scale || 1;
    this.revealAmount = options.reveal === undefined ? 1 : options.reveal;
    this.revealDirection = options.revealDirection || "left-to-right";
    this.revealStyle = options.revealStyle || "smooth";
    this.revealPieces = options.revealPieces || 0;
    this.baseColor = colorParts(options.color || "black");
    this.shineColor = colorParts(options.shineColor || [255, 255, 220]);
    this.letterPop = options.letterPop || 0.24;
    this.shineAmount = 0;
    this.image = null;
    this.animations = [];

    latexImage(latex, {
      size: options.size || 36,
      color: "white",
      display: options.display
    }).then((img) => {
      this.image = img;
    });
  }

  /**
   * Moves the equation immediately or over time.
   *
   * @param {number} x - Target x-position.
   * @param {number} y - Target y-position.
   * @param {Object} [options] - Animation options.
   * @returns {EquationObject} This object.
   */
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

  /**
   * Reveals the equation with an optional letter-by-letter effect.
   *
   * @param {Object} [options] - Reveal options.
   * @param {number} [options.duration=1] - Duration in seconds.
   * @param {boolean} [options.letters=false] - Reveal by approximate letter slices.
   * @param {string} [options.direction="left-to-right"] - Reveal direction.
   * @returns {EquationObject} This object.
   */
  reveal(options = {}) {
    this.revealDirection = options.direction || this.revealDirection;
    this.revealStyle = options.letters ? "letters" : options.style || this.revealStyle;
    this.revealPieces = options.pieces || this.revealPieces;
    this.shineColor = colorParts(options.shineColor || this.shineColor);
    this.letterPop = options.pop || this.letterPop;
    this.revealAmount = options.from === undefined ? 0 : options.from;
    this.shineAmount = 1;

    this.animate("revealAmount", options.to === undefined ? 1 : options.to, {
      duration: options.duration || 1,
      delay: options.delay || 0,
      ease: options.ease || "easeInOutSine",
      loop: options.loop,
      yoyo: options.yoyo
    });

    this.animate("shineAmount", 0, {
      from: 1,
      duration: options.duration || 1,
      delay: options.delay || 0,
      ease: "easeOutQuad"
    });

    return this;
  }

  /**
   * Advances equation animations. Call once per p5 `draw()` frame.
   *
   * @param {number} [dt] - Delta time in seconds.
   * @returns {EquationObject} This object.
   */
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

  /**
   * Draws the rendered equation image.
   *
   * @returns {EquationObject} This object.
   */
  draw() {
    if (!this.image) return this;

    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scaleAmount * this.popScale());
    this.drawRevealedImage();
    pop();

    return this;
  }

  drawRevealedImage() {
    if (this.revealStyle === "letters") {
      this.drawLetterReveal();
      return;
    }

    if (this.revealAmount >= 1) {
      tint(this.baseColor.r, this.baseColor.g, this.baseColor.b);
      image(this.image, 0, 0);
      noTint();
      return;
    }

    const clip = this.revealClip();

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(clip.x, clip.y, clip.w, clip.h);
    drawingContext.clip();
    tint(this.baseColor.r, this.baseColor.g, this.baseColor.b);
    image(this.image, 0, 0);
    noTint();
    drawingContext.restore();

    this.drawShine(clip);
  }

  drawLetterReveal() {
    const pieces = this.revealPieces || this.estimateRevealPieces();
    const progress = constrain(this.revealAmount, 0, 1) * pieces;
    const direction = normalizeRevealDirection(this.revealDirection);
    const w = this.image.width;
    const h = this.image.height;
    const left = -w / 2;
    const top = -h / 2;

    push();
    imageMode(CORNER);

    for (let i = 0; i < pieces; i += 1) {
      const revealIndex = direction === "right-to-left" ? pieces - 1 - i : i;
      const local = constrain(progress - revealIndex, 0, 1);
      if (local <= 0) continue;

      const sx = Math.floor(i * w / pieces);
      const nextSx = Math.floor((i + 1) * w / pieces);
      const sw = Math.max(1, nextSx - sx);
      const dx = left + sx;
      const cx = dx + sw / 2;
      const cy = top + h / 2;
      const flash = Math.sin(Math.PI * local);
      const scaleAmount = 1 + this.letterPop * flash;
      const flashColor = this.revealFlashColor(flash);
      const alpha = 255 * local;

      tint(flashColor.r, flashColor.g, flashColor.b, alpha);
      image(
        this.image,
        cx - sw * scaleAmount / 2,
        cy - h * scaleAmount / 2,
        sw * scaleAmount,
        h * scaleAmount,
        sx,
        0,
        sw,
        h
      );
    }

    noTint();
    pop();
  }

  estimateRevealPieces() {
    return Math.max(1, Math.ceil(this.image.width / 24));
  }

  revealClip() {
    const amount = constrain(this.revealAmount, 0, 1);
    const w = this.image.width;
    const h = this.image.height;
    const left = -w / 2;
    const top = -h / 2;
    const direction = normalizeRevealDirection(this.revealDirection);

    if (direction === "right-to-left") {
      return { x: left + w * (1 - amount), y: top, w: w * amount, h };
    }

    return { x: left, y: top, w: w * amount, h };
  }

  drawShine(clip) {
    if (this.shineAmount <= 0 || this.revealAmount <= 0 || this.revealAmount >= 1) return;

    const direction = normalizeRevealDirection(this.revealDirection);
    const alpha = 170 * this.shineAmount;

    push();
    blendMode(ADD);
    noStroke();
    fill(this.shineColor.r, this.shineColor.g, this.shineColor.b, alpha);

    if (direction === "right-to-left") {
      rect(clip.x - 6, clip.y, 12, clip.h);
    } else {
      rect(clip.x + clip.w - 6, clip.y, 12, clip.h);
    }

    blendMode(BLEND);
    pop();
  }

  popScale() {
    if (this.shineAmount <= 0 || this.revealAmount >= 1) return 1;
    return 1 + 0.08 * Math.sin(Math.PI * constrain(this.revealAmount, 0, 1)) * this.shineAmount;
  }

  revealFlashColor(amount) {
    return {
      r: lerp(this.baseColor.r, this.shineColor.r, amount),
      g: lerp(this.baseColor.g, this.shineColor.g, amount),
      b: lerp(this.baseColor.b, this.shineColor.b, amount)
    };
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

/**
 * Creates a LaTeX equation object.
 *
 * @param {string} latex - LaTeX source.
 * @param {Object} [options] - Display options passed to {@link EquationObject}.
 * @returns {EquationObject}
 */
function Equation(latex, options = {}) {
  return new EquationObject(latex, options);
}

/**
 * Simple p5 text label that can be attached to scene objects.
 *
 * Use this when plain text is better than LaTeX. `Permutation.push("text")`
 * creates one of these automatically for unrecognized string commands.
 *
 * @example
 * const note = FloatingText("top row is input", {
 *   x: 0,
 *   y: 180,
 *   size: 18
 * });
 *
 * permutation.push(note);
 */
class FloatingTextObject {
  /**
   * @param {string} textValue - Text to draw.
   * @param {Object} [options] - Display options.
   * @param {number} [options.x=0] - Local x-position.
   * @param {number} [options.y=0] - Local y-position.
   * @param {number} [options.size=18] - Font size.
   * @param {*} [options.color] - p5 color or RGB-like value.
   * @param {number} [options.alpha=230] - Text alpha.
   */
  constructor(textValue, options = {}) {
    this.textValue = textValue;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.size = options.size || 18;
    this.align = options.align || CENTER;
    this.color = colorParts(options.color || [255, 255, 255]);
    this.alpha = options.alpha === undefined ? 230 : options.alpha;
    this.animations = [];
  }

  /**
   * Changes the text.
   *
   * @param {string} textValue - New text.
   * @returns {FloatingTextObject} This object.
   */
  text(textValue) {
    this.textValue = textValue;
    return this;
  }

  translate(x, y, options = {}) {
    if (options.duration) {
      this.animate("x", x, options);
      this.animate("y", y, options);
    } else {
      this.x = x;
      this.y = y;
    }
    return this;
  }

  update(dt) {
    const seconds = dt || deltaTime / 1000 || 1 / 60;

    this.animations = this.animations.filter((animation) => {
      animation.elapsed += seconds;
      const raw = constrain((animation.elapsed - animation.delay) / animation.duration, 0, 1);
      this[animation.property] = lerp(animation.from, animation.to, animation.ease(raw));
      return raw < 1;
    });

    return this;
  }

  /**
   * Draws the text, optionally offset by a parent object's position.
   *
   * @param {number} [offsetX=0] - Parent x-offset.
   * @param {number} [offsetY=0] - Parent y-offset.
   * @returns {FloatingTextObject} This object.
   */
  draw(offsetX = 0, offsetY = 0) {
    fill(this.color.r, this.color.g, this.color.b, this.alpha);
    noStroke();
    textAlign(this.align, CENTER);
    textSize(this.size);
    text(this.textValue, offsetX + this.x, offsetY + this.y);
    return this;
  }

  animate(property, to, options = {}) {
    this.animations.push({
      property,
      from: options.from === undefined ? this[property] : options.from,
      to,
      duration: Math.max(0.0001, options.duration || 1),
      delay: options.delay || 0,
      elapsed: 0,
      ease: easing(options.ease)
    });
    return this;
  }
}

/**
 * Creates a simple floating p5 text object.
 *
 * @param {string} textValue - Text to draw.
 * @param {Object} [options] - Display options passed to {@link FloatingTextObject}.
 * @returns {FloatingTextObject}
 */
function FloatingText(textValue, options = {}) {
  return new FloatingTextObject(textValue, options);
}

function easing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return (t) => t;
  if (name === "easeInQuad") return (t) => t * t;
  if (name === "easeOutQuad") return (t) => t * (2 - t);
  return (t) => -(Math.cos(Math.PI * t) - 1) / 2;
}

function normalizeRevealDirection(direction) {
  const key = String(direction || "left-to-right").toLowerCase();
  if (key === "left" || key === "left-to-right" || key === "ltr") return "left-to-right";
  if (key === "right" || key === "right-to-left" || key === "rtl") return "right-to-left";
  return "left-to-right";
}

function colorParts(value) {
  if (Array.isArray(value)) {
    return {
      r: value[0] === undefined ? 255 : value[0],
      g: value[1] === undefined ? 255 : value[1],
      b: value[2] === undefined ? 220 : value[2]
    };
  }

  if (typeof value === "object" && value) {
    if (value.r !== undefined || value.g !== undefined || value.b !== undefined) {
      return {
        r: value.r === undefined ? 255 : value.r,
        g: value.g === undefined ? 255 : value.g,
        b: value.b === undefined ? 220 : value.b
      };
    }

    if (typeof red === "function" && typeof green === "function" && typeof blue === "function") {
      return { r: red(value), g: green(value), b: blue(value) };
    }
  }

  const text = String(value || "").trim();
  const rgb = text.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((part) => Number(part.trim()));
    return {
      r: parts[0] === undefined ? 255 : parts[0],
      g: parts[1] === undefined ? 255 : parts[1],
      b: parts[2] === undefined ? 220 : parts[2]
    };
  }

  const hex = text.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    return {
      r: parseInt(hex[1].slice(0, 2), 16),
      g: parseInt(hex[1].slice(2, 4), 16),
      b: parseInt(hex[1].slice(4, 6), 16)
    };
  }

  return { r: 255, g: 255, b: 220 };
}
