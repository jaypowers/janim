class DihedralTable {
  constructor(n, options = {}) {
    this.n = Math.max(3, Math.floor(n || 3));
    this.x = options.x || 40;
    this.y = options.y || 120;
    this.cellSize = options.cellSize || 54;
    this.title = options.title || "D_" + this.n;
    this.gridProgress = options.gridProgress === undefined ? 0 : options.gridProgress;
    this.elementProgress = options.elementProgress === undefined ? 0 : options.elementProgress;
    this.highlightProgress = 0;
    this.highlightLeft = null;
    this.highlightTop = null;
    this.backgroundColor = tableColorParts(options.backgroundColor || [9, 24, 45]);
    this.headerColor = tableColorParts(options.headerColor || [20, 52, 86]);
    this.cellColor = tableColorParts(options.cellColor || [11, 31, 58]);
    this.gridColor = tableColorParts(options.gridColor || [170, 220, 255]);
    this.textColor = tableColorParts(options.textColor || [245, 250, 255]);
    this.highlightColor = tableColorParts(options.highlightColor || [255, 218, 105]);
    this.titleLatex = options.titleLatex || "D_{" + this.n + "}\\text{ multiplication table}";
    this.operationLatex = options.operationLatex || "\\circ";
    this.elements = this.makeElements();
    this.latexImages = {};
    this.titleImage = null;
    this.animations = [];
    this.steps = [];
    this.running = false;
    this.stepIndex = 0;

    this.loadLatexImages();
  }

  makeElements() {
    const elements = [];

    for (let i = 0; i < this.n; i += 1) {
      elements.push({
        rotation: i,
        reflection: false,
        label: this.rotationLabel(i),
        latex: this.rotationLatex(i)
      });
    }

    for (let i = 0; i < this.n; i += 1) {
      elements.push({
        rotation: i,
        reflection: true,
        label: this.reflectionLabel(i),
        latex: this.reflectionLatex(i)
      });
    }

    return elements;
  }

  rotationLabel(power) {
    if (power === 0) return "e";
    if (power === 1) return "r";
    return "r^" + power;
  }

  reflectionLabel(power) {
    if (power === 0) return "sigma";
    if (power === 1) return "r sigma";
    return "r^" + power + " sigma";
  }

  rotationLatex(power) {
    if (power === 0) return "e";
    if (power === 1) return "r";
    return "r^{" + power + "}";
  }

  reflectionLatex(power) {
    if (power === 0) return "\\sigma";
    if (power === 1) return "r\\sigma";
    return "r^{" + power + "}\\sigma";
  }

  multiply(left, top) {
    const sign = left.reflection ? -1 : 1;
    const rotation = mod(left.rotation + sign * top.rotation, this.n);
    const reflection = left.reflection !== top.reflection;

    if (reflection) {
      return {
        rotation,
        reflection,
        label: this.reflectionLabel(rotation),
        latex: this.reflectionLatex(rotation)
      };
    }

    return {
      rotation,
      reflection,
      label: this.rotationLabel(rotation),
      latex: this.rotationLatex(rotation)
    };
  }

  revealGrid(options = {}) {
    this.gridProgress = 0;
    this.animate("gridProgress", 1, options);
    return this;
  }

  revealElements(options = {}) {
    this.elementProgress = 0;
    this.animate("elementProgress", 1, options);
    return this;
  }

  highlight(leftLabel, topLabel, options = {}) {
    this.highlightLeft = this.findElement(leftLabel);
    this.highlightTop = this.findElement(topLabel);
    this.highlightProgress = 0;
    this.animate("highlightProgress", 1, options);
    return this;
  }

  pushRevealGrid(options = {}) {
    this.steps.push({ type: "revealGrid", options });
    return this;
  }

  pushRevealElements(options = {}) {
    this.steps.push({ type: "revealElements", options });
    return this;
  }

  pushHighlight(leftLabel, topLabel, options = {}) {
    this.steps.push({
      type: "highlight",
      leftLabel,
      topLabel,
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

    this.animations = this.animations.filter(updateTableAnimationFor(this, seconds));
    if (this.running && this.animations.length === 0) this.startNextStep();
    return this;
  }

  draw() {
    this.drawTitle();
    this.drawCells();
    this.drawHighlights();
    this.drawGrid();
    this.drawLabels();
    return this;
  }

  drawTitle() {
    if (this.titleImage) {
      push();
      imageMode(CORNER);
      tint(this.textColor.r, this.textColor.g, this.textColor.b, 235);
      image(this.titleImage, this.x, this.y - 42);
      noTint();
      pop();
      return;
    }

    this.drawFallbackText(this.title + " multiplication table", this.x, this.y - 24, 18, 235, LEFT);
  }

  drawCells() {
    const size = this.tableSize();

    noStroke();
    fill(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, 230);
    rect(this.x, this.y, this.totalWidth(), this.totalWidth());

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (row === 0 || col === 0) {
          fill(this.headerColor.r, this.headerColor.g, this.headerColor.b, 210);
        } else {
          fill(this.cellColor.r, this.cellColor.g, this.cellColor.b, 190);
        }

        rect(this.x + col * this.cellSize, this.y + row * this.cellSize, this.cellSize, this.cellSize);
      }
    }
  }

  drawHighlights() {
    if (!this.highlightLeft || !this.highlightTop) return;

    const row = this.indexOfElement(this.highlightLeft) + 1;
    const col = this.indexOfElement(this.highlightTop) + 1;
    const alpha = 150 * this.highlightProgress;

    noStroke();
    fill(this.highlightColor.r, this.highlightColor.g, this.highlightColor.b, alpha * 0.35);
    rect(this.x, this.y + row * this.cellSize, this.totalWidth(), this.cellSize);
    rect(this.x + col * this.cellSize, this.y, this.cellSize, this.totalWidth());

    fill(this.highlightColor.r, this.highlightColor.g, this.highlightColor.b, alpha);
    rect(this.x + col * this.cellSize, this.y + row * this.cellSize, this.cellSize, this.cellSize);
  }

  drawGrid() {
    const size = this.tableSize();
    const total = this.totalWidth();
    const lineCount = size + size + 2;
    const visible = this.gridProgress * lineCount;

    stroke(this.gridColor.r, this.gridColor.g, this.gridColor.b, 180);
    strokeWeight(1.5);

    for (let i = 0; i <= size; i += 1) {
      this.drawAnimatedLine(i, visible, this.x, this.y + i * this.cellSize, this.x + total, this.y + i * this.cellSize);
    }

    for (let i = 0; i <= size; i += 1) {
      this.drawAnimatedLine(size + 1 + i, visible, this.x + i * this.cellSize, this.y, this.x + i * this.cellSize, this.y + total);
    }
  }

  drawAnimatedLine(index, visible, x1, y1, x2, y2) {
    const amount = constrain(visible - index, 0, 1);
    if (amount <= 0) return;

    line(x1, y1, lerp(x1, x2, amount), lerp(y1, y2, amount));
  }

  drawLabels() {
    const size = this.tableSize();

    textAlign(CENTER, CENTER);

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        this.drawLabelAt(row, col);
      }
    }
  }

  drawLabelAt(row, col) {
    const entry = this.entryAt(row, col);
    if (!entry) return;

    const order = row * this.tableSize() + col;
    const visible = constrain(this.elementProgress * this.tableSize() * this.tableSize() - order, 0, 1);
    if (visible <= 0) return;

    const popAmount = Math.sin(Math.PI * visible) * 0.22;
    const scaleAmount = 0.86 + visible * 0.14 + popAmount;
    const alpha = 255 * visible;
    const x = this.x + col * this.cellSize + this.cellSize / 2;
    const y = this.y + row * this.cellSize + this.cellSize / 2;
    const image = this.latexImages[entry.latex];

    push();
    translate(x, y);
    scale(scaleAmount);
    if (image) {
      this.drawLatexImage(image, alpha);
    } else {
      const fontSize = this.fitTextSize(entry.label);
      this.drawFallbackText(entry.label, 0, 0, fontSize, alpha, CENTER);
    }
    pop();
  }

  drawLatexImage(img, alpha) {
    const maxWidth = this.cellSize * 0.76;
    const maxHeight = this.cellSize * 0.45;
    const amount = Math.min(1, maxWidth / img.width, maxHeight / img.height);

    imageMode(CENTER);
    tint(this.textColor.r, this.textColor.g, this.textColor.b, alpha);
    image(img, 0, 0, img.width * amount, img.height * amount);
    noTint();
  }

  drawFallbackText(value, x, y, size, alpha, alignment) {
    fill(this.textColor.r, this.textColor.g, this.textColor.b, alpha);
    noStroke();
    textAlign(alignment || CENTER, CENTER);
    textSize(size);
    text(value, x, y);
  }

  entryAt(row, col) {
    if (row === 0 && col === 0) return { label: "compose", latex: this.operationLatex };
    if (row === 0) return this.elements[col - 1];
    if (col === 0) return this.elements[row - 1];
    return this.multiply(this.elements[row - 1], this.elements[col - 1]);
  }

  fitTextSize(label) {
    let fontSize = Math.max(10, this.cellSize * 0.24);
    const maxWidth = this.cellSize * 0.82;

    textSize(fontSize);
    while (textWidth(label) > maxWidth && fontSize > 8) {
      fontSize -= 1;
      textSize(fontSize);
    }

    return fontSize;
  }

  tableSize() {
    return this.elements.length + 1;
  }

  totalWidth() {
    return this.tableSize() * this.cellSize;
  }

  findElement(label) {
    for (let i = 0; i < this.elements.length; i += 1) {
      if (this.elements[i].label === label) return this.elements[i];
    }
    return null;
  }

  indexOfElement(element) {
    for (let i = 0; i < this.elements.length; i += 1) {
      if (this.elements[i].rotation === element.rotation && this.elements[i].reflection === element.reflection) return i;
    }
    return -1;
  }

  loadLatexImages() {
    const latexValues = [this.operationLatex];

    for (let i = 0; i < this.elements.length; i += 1) {
      latexValues.push(this.elements[i].latex);
    }

    for (let row = 1; row < this.tableSize(); row += 1) {
      for (let col = 1; col < this.tableSize(); col += 1) {
        latexValues.push(this.multiply(this.elements[row - 1], this.elements[col - 1]).latex);
      }
    }

    this.loadTitleLatex();
    this.loadCellLatex(latexValues);
  }

  loadTitleLatex() {
    latexImage(this.titleLatex, {
      size: Math.max(18, this.cellSize * 0.5),
      color: "white",
      display: false
    }).then(function saveTitle(img) {
      this.titleImage = img;
    }.bind(this));
  }

  loadCellLatex(latexValues) {
    const unique = {};

    for (let i = 0; i < latexValues.length; i += 1) {
      unique[latexValues[i]] = true;
    }

    Object.keys(unique).forEach(function loadOne(latex) {
      latexImage(latex, {
        size: Math.max(16, this.cellSize * 0.48),
        color: "white",
        display: false
      }).then(function saveImage(img) {
        this.latexImages[latex] = img;
      }.bind(this));
    }.bind(this));
  }

  startNextStep() {
    if (this.stepIndex >= this.steps.length) {
      this.running = false;
      return this;
    }

    const step = this.steps[this.stepIndex];
    this.stepIndex += 1;

    if (step.type === "revealGrid") this.revealGrid(step.options);
    if (step.type === "revealElements") this.revealElements(step.options);
    if (step.type === "highlight") this.highlight(step.leftLabel, step.topLabel, step.options);

    return this;
  }

  animate(property, to, options = {}) {
    this.stopAnimation(property);
    this.animations.push(makeTableAnimation(this[property], property, to, options));
    return this;
  }

  stopAnimation(property) {
    this.animations = this.animations.filter(function keep(animation) {
      return animation.property !== property;
    });
    return this;
  }
}

function updateTableAnimationFor(target, seconds) {
  return function update(animation) {
    animation.elapsed += seconds;

    const raw = constrain((animation.elapsed - animation.delay) / animation.duration, 0, 1);
    target[animation.property] = lerp(animation.from, animation.to, animation.ease(raw));

    return raw < 1;
  };
}

function makeTableAnimation(current, property, to, options = {}) {
  return {
    property,
    from: options.from === undefined ? current : options.from,
    to,
    duration: Math.max(0.0001, options.duration || 1),
    delay: options.delay || 0,
    elapsed: 0,
    ease: tableEasing(options.ease)
  };
}

function tableEasing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return function linear(t) { return t; };
  if (name === "easeInQuad") return function easeInQuad(t) { return t * t; };
  if (name === "easeOutQuad") return function easeOutQuad(t) { return t * (2 - t); };
  return function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  };
}

function mod(value, base) {
  return ((value % base) + base) % base;
}

function tableColorParts(value) {
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
