let d3;
let d6;
let table;
let groupLabel;
let tableN = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  groupLabel = new Equation("D_n = \\langle r, \\sigma \\mid r^n=e,\\ \\sigma^2=e,\\ \\sigma r\\sigma=r^{-1} \\rangle", {
    x: width / 2,
    y: 84,
    size: 26,
    color: color(200, 200, 255),
    shineColor: color(255)
  });

  groupLabel.reveal({
    direction: "left-to-right",
    duration: 2,
    ease: "easeInOutSine",
    letters: true,
    pop: 0.22
  });

  d3 = new DihedralGroup(3, {
    x: width * 0.25,
    y: height / 2 + 80
  });

  d6 = new DihedralGroup(6, {
    x: width * 0.65,
    y: height / 2 + 80,
    theme: "purple"
  });

  table = new DihedralTable(tableN);

  animateDihedralGroup();
  animateDihedralTable();
}

function animateDihedralGroup() {
  for (let i = 0; i < d3.n; i += 1) {
    d3.push("rotate");
  }

  for (let i = 0; i < d3.n; i += 1) {
    d3.push("flip", i + 1);
    d3.push("unflip", i + 1);
  }

  for (let i = 0; i < d6.n; i += 1) {
    d6.push("rotate");
  }

  for (let i = 0; i < d6.n; i += 1) {
    d6.push("flip", i + 1);
    d6.push("unflip", i + 1);
  }

  d3.run({ loop: true });
  d6.run({ loop: true });
}

function animateDihedralTable() {
  const highlightLeft = table.n === 1 ? "e" : "r";

  table.push("revealGrid");
  table.push("revealElements");
  table.push("highlight", highlightLeft, "sigma");

  table.run();
}

function draw() {
  background(5, 16, 32);

  groupLabel.update();
  groupLabel.draw();

  d3.update();
  d3.draw();

  d6.update();
  d6.draw();

  table.update();
  table.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  groupLabel = new Equation("D_n = \\langle r, \\sigma \\mid r^n=e,\\ \\sigma^2=e,\\ \\sigma r\\sigma=r^{-1} \\rangle", {
    x: width / 2,
    y: 84,
    size: 26,
    color: color(200, 200, 255),
    shineColor: color(255)
  });

  groupLabel.reveal({
    direction: "left-to-right",
    duration: 2,
    ease: "easeInOutSine",
    letters: true,
    pop: 0.22
  });

  d3 = new DihedralGroup(3, {
    x: width * 0.25,
    y: height / 2 + 8,
    theme: "blue"
  });

  d6 = new DihedralGroup(6, {
    x: width * 0.65,
    y: height / 2 + 80,
    theme: "purple"
  });

  table = new DihedralTable(tableN);

  animateDihedralGroup();
  animateDihedralTable();
}
