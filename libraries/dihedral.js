class DihedralGroup {
  constructor(n, options = {}) {
    this.n = Math.max(3, Math.floor(n || 3));
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.radius = options.radius || 120;
    this.rotation = options.rotation || -HALF_PI;
    this.scaleAmount = options.scale || 1;
    this.flipAxis = options.flipAxis || 0;
    this.flipAmount = options.flip ? 1 : 0;
    this.fillColor = colorParts(options.fillColor || [45, 95, 150]);
    this.strokeColor = colorParts(options.strokeColor || [180, 220, 255]);
    this.labelColor = colorParts(options.labelColor || [255, 255, 255]);
    this.axisColor = colorParts(options.axisColor || [255, 255, 255]);
    this.showAxis = options.showAxis !== false;
    this.animations = [];
    this.steps = [];
    this.running = false;
    this.stepIndex = 0;
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

  flip(axisAngle, options = {}) {
    this.flipAxis = axisAngle || 0;

    if (options.duration) {
      const target = this.flipAmount < 0.5 ? 1 : 0;
      this.animate("flipAmount", target, options);
    } else {
      this.stopAnimation("flipAmount");
      this.flipAmount = this.flipAmount < 0.5 ? 1 : 0;
    }

    return this;
  }

  pushTranslate(x, y, options = {}) {
    this.steps.push({
      type: "translate",
      x,
      y,
      options
    });
    return this;
  }

  pushRotate(angle, options = {}) {
    this.steps.push({
      type: "rotate",
      angle,
      options
    });
    return this;
  }

  pushScale(amount, options = {}) {
    this.steps.push({
      type: "scale",
      amount,
      options
    });
    return this;
  }

  pushFlip(axisAngle, options = {}) {
    this.steps.push({
      type: "flip",
      axisAngle,
      options
    });
    return this;
  }

  run() {
    this.running = true;
    this.stepIndex = 0;
    this.animations = [];
    this.startNextStep();
    return this;
  }

  update(dt) {
    const seconds = dt || deltaTime / 1000 || 1 / 60;

    this.animations = this.animations.filter(updateAnimationFor(this, seconds));
    if (this.running && this.animations.length === 0) this.startNextStep();
    return this;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.flipAxis);
    scale(1, this.flipScale());
    rotate(-this.flipAxis);
    rotate(this.rotation);
    scale(this.scaleAmount);

    this.drawPolygon();

    pop();

    this.drawVertexLabels();
    if (this.showAxis) this.drawSymmetryAxis();
    return this;
  }

  drawPolygon() {
    fill(this.fillColor.r, this.fillColor.g, this.fillColor.b, 130);
    stroke(this.strokeColor.r, this.strokeColor.g, this.strokeColor.b);
    strokeWeight(3);

    beginShape();
    for (let i = 0; i < this.n; i += 1) {
      const angle = TWO_PI * i / this.n;
      vertex(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
    }
    endShape(CLOSE);

    stroke(this.strokeColor.r, this.strokeColor.g, this.strokeColor.b, 120);
    strokeWeight(1.5);
    for (let i = 0; i < this.n; i += 1) {
      const angle = TWO_PI * i / this.n;
      line(0, 0, Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
    }
  }

  drawVertexLabels() {
    noStroke();
    fill(this.labelColor.r, this.labelColor.g, this.labelColor.b);
    textSize(18);
    textAlign(CENTER, CENTER);

    for (let i = 0; i < this.n; i += 1) {
      const point = this.transformedPoint(TWO_PI * i / this.n, this.radius + 24);
      text(String(i + 1), point.x, point.y);
    }
  }

  drawSymmetryAxis() {
    const length = this.radius * this.scaleAmount * 1.45;

    push();
    translate(this.x, this.y);
    rotate(this.flipAxis);
    stroke(this.axisColor.r, this.axisColor.g, this.axisColor.b, 120);
    strokeWeight(2);
    line(-length, 0, length, 0);
    pop();
  }

  flipScale() {
    return Math.cos(Math.PI * constrain(this.flipAmount, 0, 1));
  }

  transformedPoint(angle, radius) {
    let px = Math.cos(angle) * radius * this.scaleAmount;
    let py = Math.sin(angle) * radius * this.scaleAmount;
    let point = rotatePoint(px, py, this.rotation);

    point = rotatePoint(point.x, point.y, -this.flipAxis);
    point.y *= this.flipScale();
    point = rotatePoint(point.x, point.y, this.flipAxis);

    return {
      x: this.x + point.x,
      y: this.y + point.y
    };
  }

  startNextStep() {
    if (this.stepIndex >= this.steps.length) {
      this.running = false;
      return this;
    }

    const step = this.steps[this.stepIndex];
    this.stepIndex += 1;

    if (step.type === "translate") this.translate(step.x, step.y, step.options);
    if (step.type === "rotate") this.rotate(step.angle, step.options);
    if (step.type === "scale") this.scale(step.amount, step.options);
    if (step.type === "flip") this.flip(step.axisAngle, step.options);

    return this;
  }

  animate(property, to, options = {}) {
    this.stopAnimation(property);
    this.animations.push(makeAnimation(this[property], property, to, options));
    return this;
  }

  stopAnimation(property) {
    this.animations = this.animations.filter(function keep(animation) {
      return animation.property !== property;
    });
    return this;
  }
}

function updateAnimationFor(target, seconds) {
  return function update(animation) {
    animation.elapsed += seconds;

    const raw = constrain((animation.elapsed - animation.delay) / animation.duration, 0, 1);
    target[animation.property] = lerp(animation.from, animation.to, animation.ease(raw));

    if (raw < 1) return true;
    if (!animation.loop) return false;

    animation.elapsed = 0;
    if (animation.yoyo) {
      const from = animation.from;
      animation.from = animation.to;
      animation.to = from;
    }
    return true;
  };
}

function rotatePoint(x, y, angle) {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
}

function makeAnimation(current, property, to, options = {}) {
  return {
    property,
    from: options.from === undefined ? current : options.from,
    to,
    duration: Math.max(0.0001, options.duration || 1),
    delay: options.delay || 0,
    elapsed: 0,
    ease: easing(options.ease),
    loop: Boolean(options.loop),
    yoyo: Boolean(options.yoyo)
  };
}

function easing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return function linear(t) { return t; };
  if (name === "easeInQuad") return function easeInQuad(t) { return t * t; };
  if (name === "easeOutQuad") return function easeOutQuad(t) { return t * (2 - t); };
  return function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  };
}

function colorParts(value) {
  if (Array.isArray(value)) {
    return {
      r: value[0] === undefined ? 255 : value[0],
      g: value[1] === undefined ? 255 : value[1],
      b: value[2] === undefined ? 255 : value[2]
    };
  }

  if (typeof value === "object" && value) {
    if (value.r !== undefined || value.g !== undefined || value.b !== undefined) {
      return {
        r: value.r === undefined ? 255 : value.r,
        g: value.g === undefined ? 255 : value.g,
        b: value.b === undefined ? 255 : value.b
      };
    }

    if (typeof red === "function" && typeof green === "function" && typeof blue === "function") {
      return { r: red(value), g: green(value), b: blue(value) };
    }
  }

  return { r: 255, g: 255, b: 255 };
}
