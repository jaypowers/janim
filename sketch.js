const state = {
  scenes: null
};

function preload() {
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  state.scenes = SceneQueue();
  state.scenes.push(createDihedralScene());
  state.scenes.push(createDihedralPermutationScene());
  state.scenes.push(createSymmetricScene());
  state.scenes.run();
}

function draw() {
  background(5, 16, 32);

  state.scenes.update();
  state.scenes.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  if (state.scenes) {
    state.scenes.resize();
  }
}

function keyPressed() {
  if (!state.scenes) return true;

  if (keyCode === RIGHT_ARROW) {
    state.scenes.next();
    return false;
  }

  if (keyCode === LEFT_ARROW) {
    state.scenes.previous();
    return false;
  }

  return true;
}

function createDihedralScene() {
  return {
    groupLabel: null,
    d3: null,
    d6: null,
    table: null,
    tableN: 3,

    setup() {
      this.groupLabel = new Equation("D_n = \\langle r, \\sigma \\mid r^n=e,\\ \\sigma^2=e,\\ \\sigma r\\sigma=r^{-1} \\rangle", {
        x: width / 2,
        y: 84,
        size: 26,
        color: color(200, 200, 255),
        shineColor: color(255)
      });

      this.groupLabel.reveal({
        direction: "left-to-right",
        duration: 2,
        ease: "easeInOutSine",
        letters: true,
        pop: 0.22
      });

      this.d3 = new DihedralGroup(3, {
        x: width * 0.25,
        y: height / 2 + 80,
        theme: "blue"
      });

      this.d6 = new DihedralGroup(6, {
        x: width * 0.65,
        y: height / 2 + 80,
        theme: "purple"
      });

      this.table = new DihedralTable(this.tableN);

      this.animateDihedralGroup();
      this.animateDihedralTable();
    },

    animateDihedralGroup() {
      for (let i = 0; i < this.d3.n; i += 1) {
        this.d3.push("rotate");
      }

      for (let i = 0; i < this.d3.n; i += 1) {
        this.d3.push("flip", i + 1);
        this.d3.push("unflip", i + 1);
      }

      for (let i = 0; i < this.d6.n; i += 1) {
        this.d6.push("rotate");
      }

      for (let i = 0; i < this.d6.n; i += 1) {
        this.d6.push("flip", i + 1);
        this.d6.push("unflip", i + 1);
      }

      this.d3.run({ loop: true });
      this.d6.run({ loop: true });
    },

    animateDihedralTable() {
      const highlightLeft = this.table.n === 1 ? "e" : "r";

      this.table.push("revealGrid");
      this.table.push("revealElements");
      this.table.push("highlight", highlightLeft, "sigma");
      this.table.run();
    },

    update(seconds) {
      this.groupLabel.update(seconds);
      this.d3.update(seconds);
      this.d6.update(seconds);
      this.table.update(seconds);
    },

    draw() {
      this.groupLabel.draw();
      this.d3.draw();
      this.d6.draw();
      this.table.draw();
    },

    resize() {
      this.setup();
    }
  };
}

function createSymmetricScene() {
  return {
    title: null,
    s4: null,
    note: null,
    contrast: null,

    setup() {
      this.title = new Equation("S_4 = \\text{all bijections } \\{1,2,3,4\\}\\to\\{1,2,3,4\\}", {
        x: width / 2,
        y: 76,
        size: 25,
        color: color(220, 245, 240),
        shineColor: color(255)
      });

      this.title.reveal({
        direction: "left-to-right",
        duration: 1.8,
        ease: "easeInOutSine",
        letters: true,
        pop: 0.2
      });

      this.s4 = new SymmetricGroup(4, {
        x: width / 2,
        y: height / 2 + 22,
        spacing: Math.min(82, Math.max(62, width * 0.06)),
        title: "S_4 contains every rearrangement of the four labels",
        accentColor: [255, 218, 105],
        secondaryColor: [130, 225, 205]
      });

      this.note = FloatingText("D_4 has 8 square motions. S_4 has 24 permutations, including label switches no square can physically do.", {
        x: width / 2,
        y: height - 76,
        size: 18,
        color: color(210, 225, 245)
      });

      this.contrast = FloatingText("Example: swapping only 1 and 2 is in S_4, but it is not a symmetry of the square.", {
        x: width / 2,
        y: height - 48,
        size: 17,
        color: color(255, 225, 150)
      });

      this.s4.push("pause", 1.2);
      this.s4.push("swap", 1, 2, { duration: 1.6 });
      this.s4.push("pause", 0.7);
      this.s4.push("cycle", [1, 2, 3, 4], { duration: 1.8 });
      this.s4.push("pause", 0.7);
      this.s4.push("map", [3, 1, 4, 2], { duration: 1.8 });
      this.s4.push("pause", 0.7);
      this.s4.push("map", [4, 2, 1, 3], { duration: 1.8 });
      this.s4.push("pause", 0.7);
      this.s4.push("map", [1, 2, 3, 4], { duration: 1.8 });
      this.s4.run({ loop: true });
    },

    update(seconds) {
      this.title.update(seconds);
      this.s4.update(seconds);
      this.note.update(seconds);
      this.contrast.update(seconds);
    },

    draw() {
      this.title.draw();
      this.s4.draw();
      this.note.draw();
      this.contrast.draw();
    },

    resize() {
      this.setup();
    }
  };
}

function createDihedralPermutationScene() {
  return {
    title: null,
    square: null,
    permutation: null,
    differenceNote: null,

    setup() {
      this.title = new Equation("D_4 \\hookrightarrow S_4\\text{: symmetries as vertex permutations}", {
        x: width / 2,
        y: 72,
        size: 26,
        color: color(220, 235, 255),
        shineColor: color(255)
      });

      this.title.reveal({
        direction: "left-to-right",
        duration: 1.5,
        ease: "easeInOutSine",
        letters: true
      });

      this.square = new SquareVertexPermutation({
        x: width * 0.27,
        y: height / 2 + 42,
        size: Math.min(190, Math.max(138, width * 0.16)),
        title: "The square motion"
      });

      this.permutation = new Permutation([1, 2, 3, 4], {
        x: width * 0.68,
        y: height / 2 + 42,
        spacing: Math.min(76, Math.max(58, width * 0.055)),
        title: "The same motion as a permutation"
      });

      this.permutation.push("Label the square vertices 1, 2, 3, 4.", {
        x: 0,
        y: -220,
        size: 18,
        color: color(210, 225, 245)
      });

      this.permutation.push("A symmetry is recorded by where those labels land.", {
        x: 0,
        y: -194,
        size: 18,
        color: color(255, 225, 150)
      });

      this.differenceNote = FloatingText("D_4 gives only the 8 label-switches that come from rigid square motions. S_4 has all 24 possible label-switches.", {
        x: width / 2,
        y: height - 50,
        size: 18,
        color: color(210, 225, 245)
      });

      queueD4VertexMoves(this.square);
      queueD4VertexMoves(this.permutation);
      this.square.run({ loop: true });
      this.permutation.run({ loop: true });
    },

    update(seconds) {
      this.title.update(seconds);
      this.square.update(seconds);
      this.permutation.update(seconds);
      this.differenceNote.update(seconds);
    },

    draw() {
      this.title.draw();
      this.square.draw();
      this.permutation.draw();
      this.differenceNote.draw();
    },

    resize() {
      this.setup();
    }
  };
}

function queueD4VertexMoves(target) {
  const moves = [
    [2, 3, 4, 1],
    [3, 4, 1, 2],
    [4, 1, 2, 3],
    [1, 2, 3, 4],
    [2, 1, 4, 3],
    [3, 2, 1, 4],
    [4, 3, 2, 1],
    [1, 4, 3, 2],
    [1, 2, 3, 4]
  ];

  target.push("pause", 1.1);
  for (let i = 0; i < moves.length; i += 1) {
    target.push("map", moves[i], { duration: 1.7 });
    target.push("pause", 0.65);
  }
}

class SquareVertexPermutationObject {
  constructor(options = {}) {
    this.x = options.x || width / 2;
    this.y = options.y || height / 2;
    this.size = options.size || 160;
    this.title = options.title || "Square vertices";
    this.order = [1, 2, 3, 4];
    this.fromPositions = this.positionsForOrder(this.order);
    this.toPositions = this.positionsForOrder(this.order);
    this.progress = 1;
    this.steps = [];
    this.animations = [];
    this.running = false;
    this.loopSteps = false;
    this.stepIndex = 0;
    this.color = [235, 245, 255];
    this.accentColor = [255, 220, 110];
    this.cardColor = [18, 45, 76];
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
      if (animation.finishOrder) {
        this.order = animation.finishOrder.slice();
        this.fromPositions = this.positionsForOrder(this.order);
        this.toPositions = this.positionsForOrder(this.order);
      }
      return false;
    });

    if (this.running && this.animations.length === 0) this.startNextStep();
    return this;
  }

  draw() {
    this.drawTitle();
    this.drawSquare();
    this.drawCards();
    this.drawCaption();
    return this;
  }

  drawTitle() {
    fill(235, 245, 255, 230);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text(this.title, this.x, this.y - this.size * 0.74);
  }

  drawSquare() {
    const half = this.size / 2;

    push();
    rectMode(CENTER);
    fill(20, 48, 78, 80);
    stroke(180, 220, 255, 230);
    strokeWeight(3);
    rect(this.x, this.y, this.size, this.size, 8);

    stroke(180, 220, 255, 80);
    strokeWeight(1.5);
    line(this.x - half, this.y - half, this.x + half, this.y + half);
    line(this.x + half, this.y - half, this.x - half, this.y + half);
    pop();
  }

  drawCards() {
    for (let value = 1; value <= 4; value += 1) {
      const fromIndex = this.fromPositions[value];
      const toIndex = this.toPositions[value];
      const fromPoint = this.cornerPoint(fromIndex);
      const toPoint = this.cornerPoint(toIndex);
      const x = lerp(fromPoint.x, toPoint.x, this.progress);
      const y = lerp(fromPoint.y, toPoint.y, this.progress);

      push();
      rectMode(CENTER);
      fill(this.cardColor[0], this.cardColor[1], this.cardColor[2], 240);
      stroke(this.accentColor[0], this.accentColor[1], this.accentColor[2], 220);
      strokeWeight(2);
      rect(x, y, 48, 48, 8);

      fill(this.color[0], this.color[1], this.color[2], 255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(22);
      text(value, x, y);
      pop();
    }
  }

  drawCaption() {
    fill(235, 245, 255, 170);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text("same vertex labels, shown on the square", this.x, this.y + this.size * 0.76);
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
    return this;
  }

  pause(duration = 0.9, options = {}) {
    this.progress = 1;
    this.animations = [{
      property: "progress",
      from: 1,
      to: 1,
      duration,
      delay: options.delay || 0,
      elapsed: 0,
      ease: squareVertexEasing(options.ease)
    }];
    return this;
  }

  map(nextOrder, options = {}) {
    this.fromPositions = this.positionsForOrder(this.order);
    this.toPositions = this.positionsForOrder(nextOrder);
    this.progress = 0;
    this.animations = [{
      property: "progress",
      from: 0,
      to: 1,
      duration: options.duration || 1.7,
      delay: options.delay || 0,
      elapsed: 0,
      ease: squareVertexEasing(options.ease),
      finishOrder: nextOrder
    }];
    return this;
  }

  cornerPoint(index) {
    const half = this.size / 2;
    const points = [
      { x: this.x - half, y: this.y - half },
      { x: this.x + half, y: this.y - half },
      { x: this.x + half, y: this.y + half },
      { x: this.x - half, y: this.y + half }
    ];
    return points[index];
  }

  positionsForOrder(order) {
    const positions = {};
    for (let i = 0; i < order.length; i += 1) positions[order[i]] = i;
    return positions;
  }
}

function SquareVertexPermutation(options = {}) {
  return new SquareVertexPermutationObject(options);
}

function squareVertexEasing(name) {
  if (typeof name === "function") return name;
  if (name === "linear") return (t) => t;
  return (t) => -(Math.cos(Math.PI * t) - 1) / 2;
}
