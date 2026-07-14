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
  state.scenes.push(createPermutationScene());
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
    tableN: 1,

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

function createPermutationScene() {
  return {
    title: null,
    permutation: null,

    setup() {
      this.title = new Equation("\\text{Permutations: sets, tuples, and order}", {
        x: width / 2,
        y: 72,
        size: 28,
        color: color(220, 235, 255),
        shineColor: color(255)
      });

      this.title.reveal({
        direction: "left-to-right",
        duration: 1.5,
        ease: "easeInOutSine",
        letters: true
      });

      this.permutation = new Permutation([1, 2, 3], {
        x: width / 2,
        y: height / 2 + 30,
        title: "The same set can be arranged in different orders"
      });

      this.permutation.push("The set {1, 2, 3} does not care about order.", {
        x: 0,
        y: -220,
        size: 18,
        color: color(210, 225, 245)
      });

      this.permutation.push("The tuple (1, 2, 3) does care about order.", {
        x: 0,
        y: -194,
        size: 18,
        color: color(255, 225, 150)
      });

      this.permutation.push("Two-line notation: top row is input, bottom row is image.", {
        x: 0,
        y: 202,
        size: 18,
        color: color(210, 225, 245)
      });

      this.permutation.push("pause");
      this.permutation.push("map", [1, 3, 2]);
      this.permutation.push("pause");
      this.permutation.push("map", [2, 1, 3]);
      this.permutation.push("pause");
      this.permutation.push("map", [2, 3, 1]);
      this.permutation.push("pause");
      this.permutation.push("map", [3, 1, 2]);
      this.permutation.push("pause");
      this.permutation.push("map", [3, 2, 1]);
      this.permutation.push("pause");
      this.permutation.push("map", [1, 2, 3]);
      this.permutation.run({ loop: true });
    },

    update(seconds) {
      this.title.update(seconds);
      this.permutation.update(seconds);
    },

    draw() {
      this.title.draw();
      this.permutation.draw();
    },

    resize() {
      this.setup();
    }
  };
}
