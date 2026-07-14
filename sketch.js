const state = {
  title: null,
  permutation: null
};

function preload() {
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  state.title = new Equation("\\text{Permutations: sets, tuples, and order}", {
    x: width / 2,
    y: 72,
    size: 28,
    color: color(220, 235, 255),
    shineColor: color(255)
  });

  state.title.reveal({
    direction: "left-to-right",
    duration: 1.5,
    ease: "easeInOutSine",
    letters: true
  });

  state.permutation = new Permutation([1, 2, 3], {
    x: width / 2,
    y: height / 2 + 30,
    title: "The same set can be arranged in different orders"
  });

  state.permutation.push("The set {1, 2, 3} does not care about order.", {
    x: 0,
    y: -220,
    size: 18,
    color: color(210, 225, 245)
  });

  state.permutation.push("The tuple (1, 2, 3) does care about order.", {
    x: 0,
    y: -194,
    size: 18,
    color: color(255, 225, 150)
  });

  state.permutation.push("Two-line notation: top row is input, bottom row is image.", {
    x: 0,
    y: 202,
    size: 18,
    color: color(210, 225, 245)
  });

  state.permutation.push("pause");
  state.permutation.push("map", [1, 3, 2]);
  state.permutation.push("pause");
  state.permutation.push("map", [2, 1, 3]);
  state.permutation.push("pause");
  state.permutation.push("map", [2, 3, 1]);
  state.permutation.push("pause");
  state.permutation.push("map", [3, 1, 2]);
  state.permutation.push("pause");
  state.permutation.push("map", [3, 2, 1]);
  state.permutation.push("pause");
  state.permutation.push("map", [1, 2, 3]);
  state.permutation.run({ loop: true });
}

function draw() {
  background(5, 16, 32);

  state.title.update();
  state.title.draw();

  state.permutation.update();
  state.permutation.draw();
}
