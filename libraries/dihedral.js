class DihedralGroupObject {
  constructor(n, ...args) {
    const options = groupOptionsFrom(args);
    this.n = Math.max(3, Math.floor(n || 3));
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.radius = options.radius || 72;
    this.rotation = options.rotation || -HALF_PI;
    this.scaleAmount = options.scale || 1;
    this.flipAxis = options.flipAxis || 0;
    this.flipAmount = options.flip ? 1 : 0;
    this.rotationName = options.rotationName || "r";
    this.reflectionName = options.reflectionName || "sigma";
    this.rotationStep = TWO_PI / this.n;
    this.presentation = {
      rotation: this.rotationName,
      reflection: this.reflectionName,
      relations: [
        this.rotationName + "^" + this.n + " = e",
        this.reflectionName + "^2 = e",
        this.reflectionName + " " + this.rotationName + " " + this.reflectionName + " = " + this.rotationName + "^-1"
      ]
    };
    const theme = groupTheme(options.theme);
    this.fillColor = colorParts(options.fillColor || theme.fillColor);
    this.strokeColor = colorParts(options.strokeColor || theme.strokeColor);
    this.labelColor = colorParts(options.labelColor || [255, 255, 255]);
    this.axisColor = colorParts(options.axisColor || [255, 220, 120]);
    this.caption = options.caption === undefined ? "D" + this.n + ": all rotations, then all flips" : options.caption;
    this.captionColor = colorParts(options.captionColor || [255, 255, 255]);
    this.captionSize = options.captionSize || 16;
    this.showAxis = options.showAxis !== false;
    this.animations = [];
    this.steps = [];
    this.running = false;
    this.loopSteps = false;
    this.stepIndex = 0;
    this.nextFlipAxisIndex = 0;
    this.currentFlipAxis = null;
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
    if (typeof angle === "object" || angle === undefined) {
      options = angle || {};
      angle = this.rotation + this.rotationStep;
    }

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
    const nextAxis = this.axisAngle(axisAngle);

    if (this.flipAmount > 0.5 && Math.abs(nextAxis - this.flipAxis) > 0.0001) {
      this.rotation += 2 * (nextAxis - this.flipAxis);
    }

    this.flipAxis = nextAxis;

    if (options.duration) {
      const target = options.to === undefined ? this.nextFlipAmount() : options.to;
      this.animate("flipAmount", target, options);
    } else {
      this.stopAnimation("flipAmount");
      this.flipAmount = options.to === undefined ? this.nextFlipAmount() : options.to;
    }

    return this;
  }

  nextFlipAmount() {
    return this.flipAmount < 0.5 ? 1 : 0;
  }

  push(...args) {
    const step = this.stepFrom(args);
    this.steps.push(step);
    return this;
  }

  stepFrom(args) {
    if (typeof args[0] === "object" && args[0]) return args[0];

    const type = args[0];
    const value = args[1];
    const extraOptions = typeof value === "object" && value ? value : args[2] || {};
    const options = Object.assign({ duration: 2, ease: "easeInOutSine" }, extraOptions);

    const hasOptionsAsSecondArgument = typeof value === "object" && value;
    const stepValue = hasOptionsAsSecondArgument ? undefined : value;

    if (type === "rotate") return { type: "rotate", angle: stepValue === undefined ? null : stepValue, options };
    if (type === "flip") return { type: "flip", axisAngle: this.flipAxisFrom(stepValue), options };
    if (type === "unflip") return { type: "flip", axisAngle: this.unflipAxisFrom(stepValue), options: Object.assign({}, options, { to: 0 }) };
    if (type === "scale") return { type: "scale", amount: value, options };

    return { type: "rotate", angle: null, options };
  }

  flipAxisFrom(axis) {
    if (axis !== undefined) {
      const axisNumber = this.symmetryAxisNumber(axis);
      this.currentFlipAxis = this.symmetryAxis(axisNumber);
      this.nextFlipAxisIndex = axisNumber % this.n;
      return this.currentFlipAxis;
    }

    this.currentFlipAxis = this.rotation + this.nextFlipAxisIndex * Math.PI / this.n;
    return this.currentFlipAxis;
  }

  unflipAxisFrom(axis) {
    if (axis !== undefined) {
      const axisNumber = this.symmetryAxisNumber(axis);
      this.currentFlipAxis = this.symmetryAxis(axisNumber);
      this.nextFlipAxisIndex = axisNumber % this.n;
      return this.currentFlipAxis;
    }

    const currentAxis = this.currentFlipAxis === null ? this.flipAxisFrom() : this.currentFlipAxis;
    this.nextFlipAxisIndex = (this.nextFlipAxisIndex + 1) % this.n;
    return currentAxis;
  }

  symmetryAxis(axisNumber) {
    return this.rotation + (axisNumber - 1) * Math.PI / this.n;
  }

  symmetryAxisNumber(axisNumber) {
    const wholeNumber = Math.floor(Number(axisNumber) || 1);
    return ((wholeNumber - 1) % this.n + this.n) % this.n + 1;
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
    if (typeof angle === "object" || angle === undefined) {
      options = angle || {};
      angle = null;
    }

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

  relationText() {
    return "D_" + this.n + " = <" + this.rotationName + ", " + this.reflectionName + " | " + this.presentation.relations.join(", ") + ">";
  }

  axisAngle(axis) {
    if (typeof axis === "number") return axis;
    if (axis === "x") return 0;
    if (axis === "horizontal") return 0;
    if (axis === "y") return HALF_PI;
    if (axis === "vertical") return HALF_PI;
    if (axis === "vertex") return -HALF_PI;
    return this.defaultReflectionAxis();
  }

  defaultReflectionAxis() {
    return -HALF_PI;
  }

  symmetryAxes() {
    const axes = [];

    for (let i = 0; i < this.n; i += 1) {
      axes.push(this.rotation + i * Math.PI / this.n);
    }

    return axes;
  }

  run(options = {}) {
    this.running = true;
    this.loopSteps = Boolean(options.loop || options.repeat);
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
    this.drawCaption();
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

  drawCaption() {
    if (!this.caption) return;

    fill(this.captionColor.r, this.captionColor.g, this.captionColor.b, 210);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.captionSize);
    text(this.caption, this.x, this.y + this.radius + 48);
  }

  flipScale() {
    const amount = Math.cos(Math.PI * constrain(this.flipAmount, 0, 1));
    if (Math.abs(amount) < 0.001) return 0.001;
    return amount;
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
      if (this.loopSteps && this.steps.length > 0) {
        this.stepIndex = 0;
      } else {
        this.running = false;
        return this;
      }
    }

    if (this.stepIndex >= this.steps.length) {
      this.running = false;
      return this;
    }

    const step = this.steps[this.stepIndex];
    this.stepIndex += 1;

    if (step.type === "translate") this.translate(step.x, step.y, step.options);
    if (step.type === "rotate" && step.angle === null) this.rotate(step.options);
    if (step.type === "rotate" && step.angle !== null) this.rotate(step.angle, step.options);
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

function DihedralGroup(n, ...args) {
  if (typeof n === "object" && n) {
    args = [n];
    n = n.n || n.sides || 3;
  }

  return new DihedralGroupObject(n, ...args);
}

function groupOptionsFrom(args) {
  const options = {};

  if (typeof args[0] === "number") {
    options.x = args[0];
    options.y = args[1] || 0;
    Object.assign(options, args[2] || {});
    return options;
  }

  for (let i = 0; i < args.length; i += 1) {
    Object.assign(options, args[i] || {});
  }

  return options;
}

function groupTheme(name) {
  if (name === "purple") {
    return {
      fillColor: [80, 70, 150],
      strokeColor: [215, 205, 255]
    };
  }

  return {
    fillColor: [45, 95, 150],
    strokeColor: [180, 220, 255]
  };
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
