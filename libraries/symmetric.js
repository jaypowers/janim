class SymmetricGroupObject {
  constructor(n, options = {}) {
    this.n = Math.max(2, Math.floor(n || 3));
    this.x = options.x || width / 2;
    this.y = options.y || height / 2;
    this.spacing = options.spacing || Math.min(88, Math.max(54, width * 0.42 / this.n));
    this.order = this.identity();
    this.fromOrder = this.order.slice();
    this.toOrder = this.order.slice();
    this.progress = 1;
    this.title = options.title || "S_" + this.n + ": all permutations of " + this.n + " objects";
    this.color = symmetricColor(options.color || [235, 245, 255]);
    this.accentColor = symmetricColor(options.accentColor || [255, 220, 110]);
    this.cardColor = symmetricColor(options.cardColor || [20, 48, 78]);
    this.secondaryColor = symmetricColor(options.secondaryColor || [120, 210, 190]);
    this.labelImages = {};
    this.permutationImage = null;
    this.permutationLatex = "";
    this.countImage = null;
    this.steps = [];
    this.animations = [];
    this.running = false;
    this.loopSteps = false;
    this.stepIndex = 0;
    this.loadLatexImages();
  }

  push(command, ...args) {
    this.steps.push({ command, args });
    return this;
  }

  run(options = {}) {
    this.running = true;
    this.loopSteps = Boolean(options.loop);
    this.stepIndex = 0;
    this.animations = [];
    this.startNextStep();
    return this;
  }

  update(dt) {
    const seconds = dt || deltaTime / 1000 || 1 / 60;

    this.animations = this.animations.filter((animation) => {
      animation.elapsed += seconds;
      const raw = constrain((animation.elapsed - animation.delay) / animation.duration, 0, 1);
      this[animation.property] = lerp(animation.from, animation.to, animation.ease(raw));

      if (raw < 1) return true;
      this.order = this.toOrder.slice();
      this.loadPermutationLatex();
      return false;
    });

    if (this.running && this.animations.length === 0) this.startNextStep();
    return this;
  }

  draw() {
    this.drawHeading();
    this.drawRows();
    this.drawPermutation();
    this.drawCount();
    return this;
  }

  drawHeading() {
    fill(this.color.r, this.color.g, this.color.b, 235);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text(this.title, this.x, this.y - 178);
  }

  drawRows() {
    fill(this.color.r, this.color.g, this.color.b, 180);
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(16);
    text("input", this.slotX(0) - 46, this.y - 70);
    text("image", this.slotX(0) - 46, this.y + 52);

    for (let i = 0; i < this.n; i += 1) {
      this.drawTopNode(i);
      this.drawImageCard(i);
      this.drawArrow(i);
    }
  }

  drawTopNode(index) {
    const x = this.slotX(index);
    const y = this.y - 70;

    stroke(this.secondaryColor.r, this.secondaryColor.g, this.secondaryColor.b, 210);
    strokeWeight(2);
    fill(8, 28, 48, 235);
    circle(x, y, 48);

    this.drawElementLabel(index + 1, x, y, 28, 28, 255, 22);
  }

  drawImageCard(index) {
    const from = this.fromIndexForValue(index + 1);
    const to = this.toIndexForValue(index + 1);
    const point = this.movePoint(from, to);

    push();
    rectMode(CENTER);
    fill(this.cardColor.r, this.cardColor.g, this.cardColor.b, 235);
    stroke(this.accentColor.r, this.accentColor.g, this.accentColor.b, 210);
    strokeWeight(2);
    rect(point.x, point.y, 58, 58, 8);

    this.drawElementLabel(index + 1, point.x, point.y, 30, 30, 255, 24);
    pop();
  }

  drawArrow(index) {
    const x1 = this.slotX(index);
    const y1 = this.y - 40;
    const value = this.displayOrder()[index];
    const x2 = this.slotX(value - 1);
    const y2 = this.y + 18;

    stroke(this.secondaryColor.r, this.secondaryColor.g, this.secondaryColor.b, 120);
    strokeWeight(1.6);
    line(x1, y1, x2, y2);
  }

  drawPermutation() {
    if (this.permutationImage) {
      this.drawLatexImage(this.permutationImage, this.x, this.y + 134, 260, 74, 235, this.accentColor);
      return;
    }

    this.drawFallbackText(this.twoLineText(), this.x, this.y + 134, 20, 235, this.accentColor);
  }

  drawCount() {
    if (this.countImage) {
      this.drawLatexImage(this.countImage, this.x, this.y + 176, 210, 42, 190, this.color);
      return;
    }

    this.drawFallbackText("|S_" + this.n + "| = " + this.n + "! = " + factorial(this.n), this.x, this.y + 176, 17, 175, this.color);
  }

  drawElementLabel(value, x, y, maxWidth, maxHeight, alpha, fallbackSize) {
    const image = this.labelImages[String(value)];
    if (image) {
      this.drawLatexImage(image, x, y, maxWidth, maxHeight, alpha, this.color);
      return;
    }

    this.drawFallbackText(String(value), x, y, fallbackSize, alpha, this.color);
  }

  drawLatexImage(img, x, y, maxWidth, maxHeight, alpha, tintColor) {
    const amount = Math.min(1, maxWidth / img.width, maxHeight / img.height);

    imageMode(CENTER);
    tint(tintColor.r, tintColor.g, tintColor.b, alpha);
    image(img, x, y, img.width * amount, img.height * amount);
    noTint();
  }

  drawFallbackText(value, x, y, size, alpha, textColor) {
    fill(textColor.r, textColor.g, textColor.b, alpha);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(size);
    text(value, x, y);
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

    const step = this.steps[this.stepIndex];
    this.stepIndex += 1;

    if (step.command === "pause") this.pause(step.args[0], step.args[1] || {});
    if (step.command === "map") this.map(step.args[0], step.args[1] || {});
    if (step.command === "swap") this.swap(step.args[0], step.args[1], step.args[2] || {});
    if (step.command === "cycle") this.cycle(step.args[0], step.args[1] || {});

    return this;
  }

  pause(duration = 0.8, options = {}) {
    this.fromOrder = this.order.slice();
    this.toOrder = this.order.slice();
    this.progress = 1;
    this.animations = [{
      property: "progress",
      from: 1,
      to: 1,
      duration,
      delay: options.delay || 0,
      elapsed: 0,
      ease: symmetricEasing(options.ease)
    }];
    return this;
  }

  map(nextOrder, options = {}) {
    this.animateOrder(nextOrder.slice(), options);
    return this;
  }

  swap(a, b, options = {}) {
    const next = this.order.slice();
    const left = this.clampValue(a) - 1;
    const right = this.clampValue(b) - 1;
    const held = next[left];
    next[left] = next[right];
    next[right] = held;
    this.animateOrder(next, options);
    return this;
  }

  cycle(values, options = {}) {
    const next = this.order.slice();
    const positions = values.map((value) => this.clampValue(value) - 1);
    const lastValue = next[positions[positions.length - 1]];

    for (let i = positions.length - 1; i > 0; i -= 1) {
      next[positions[i]] = next[positions[i - 1]];
    }

    next[positions[0]] = lastValue;
    this.animateOrder(next, options);
    return this;
  }

  animateOrder(nextOrder, options = {}) {
    this.fromOrder = this.order.slice();
    this.toOrder = nextOrder.slice();
    this.progress = 0;
    this.animations = [{
      property: "progress",
      from: 0,
      to: 1,
      duration: options.duration || 1.8,
      delay: options.delay || 0,
      elapsed: 0,
      ease: symmetricEasing(options.ease)
    }];
    return this;
  }

  displayOrder() {
    const order = [];

    for (let i = 0; i < this.n; i += 1) {
      order.push(Math.round(lerp(this.fromOrder[i], this.toOrder[i], this.progress)));
    }

    return order;
  }

  movePoint(fromIndex, toIndex) {
    const x = lerp(this.slotX(fromIndex), this.slotX(toIndex), this.progress);
    const y = this.y + 52 - Math.sin(Math.PI * this.progress) * Math.abs(toIndex - fromIndex) * 22;
    return { x, y };
  }

  slotX(index) {
    return this.x + (index - (this.n - 1) / 2) * this.spacing;
  }

  fromIndexForValue(value) {
    return this.fromOrder.indexOf(value);
  }

  toIndexForValue(value) {
    return this.toOrder.indexOf(value);
  }

  twoLineText() {
    return "(" + this.identity().join("  ") + ")\n(" + this.order.join("  ") + ")";
  }

  permutationLatexText() {
    return "\\begin{pmatrix}" + this.identity().join(" & ") + "\\\\" + this.order.join(" & ") + "\\end{pmatrix}";
  }

  countLatexText() {
    return "|S_{" + this.n + "}| = " + this.n + "! = " + factorial(this.n);
  }

  loadLatexImages() {
    for (let i = 1; i <= this.n; i += 1) {
      this.loadElementLatex(i);
    }

    this.loadPermutationLatex();
    this.loadCountLatex();
  }

  loadElementLatex(value) {
    latexImage(String(value), {
      size: 28,
      color: "white",
      display: false
    }).then((img) => {
      this.labelImages[String(value)] = img;
    });
  }

  loadPermutationLatex() {
    const latex = this.permutationLatexText();
    this.permutationLatex = latex;

    latexImage(latex, {
      size: 30,
      color: "white",
      display: false
    }).then((img) => {
      if (this.permutationLatex === latex) {
        this.permutationImage = img;
      }
    });
  }

  loadCountLatex() {
    latexImage(this.countLatexText(), {
      size: 24,
      color: "white",
      display: false
    }).then((img) => {
      this.countImage = img;
    });
  }

  identity() {
    const values = [];
    for (let i = 1; i <= this.n; i += 1) values.push(i);
    return values;
  }

  clampValue(value) {
    return Math.max(1, Math.min(this.n, Math.floor(Number(value) || 1)));
  }
}

function SymmetricGroup(n, options = {}) {
  return new SymmetricGroupObject(n, options);
}

function symmetricEasing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return (t) => t;
  return (t) => -(Math.cos(Math.PI * t) - 1) / 2;
}

function factorial(n) {
  let product = 1;
  for (let i = 2; i <= n; i += 1) product *= i;
  return product;
}

function symmetricColor(value) {
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
  }

  return { r: 255, g: 255, b: 255 };
}
