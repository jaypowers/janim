let d3;
let d4;
let table;
let groupLabel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  makeGroupLabel();
  makeDihedralGroup();
  makeDihedralTable();
  animateDihedralGroup();
  animateDihedralTable();
}

function makeGroupLabel() {
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
}

function makeDihedralGroup() {
  d3 = new DihedralGroup(3, {
    x: width * 0.15,
    y: height / 2 + 80,
    radius: 72,
    fillColor: color(45, 95, 150),
    strokeColor: color(180, 220, 255),
    labelColor: color(255),
    axisColor: color(255, 220, 120)
  });

  d4 = new DihedralGroup(4, {
    x: width * 0.35,
    y: height / 2 + 80,
    radius: 72,
    fillColor: color(80, 70, 150),
    strokeColor: color(215, 205, 255),
    labelColor: color(255),
    axisColor: color(255, 220, 120)
  });
}

function makeDihedralTable() {
  const cellSize = Math.min(54, Math.max(36, (width * 0.42) / 7));
  const tableWidth = cellSize * 7;

  table = new DihedralTable(3, {
    x: width - tableWidth - 36,
    y: 150,
    cellSize: cellSize,
    title: "D_3",
    gridProgress: 0,
    elementProgress: 0,
    backgroundColor: color(9, 24, 45),
    headerColor: color(22, 55, 92),
    cellColor: color(11, 31, 58),
    gridColor: color(170, 220, 255),
    textColor: color(245, 250, 255),
    highlightColor: color(255, 220, 110)
  });
}

function animateDihedralGroup() {
  const d3Options = {
    duration: 2,
    ease: "easeInOutSine"
  };
  const d4Options = {
    duration: 2,
    ease: "easeInOutSine"
  };

  d3.pushAllRotations(d3Options);
  d3.pushAllFlips(d3Options);

  d4.pushAllRotations(d4Options);
  d4.pushAllFlips(d4Options);

  d3.run({ loop: true });
  d4.run({ loop: true });
}

function animateDihedralTable() {
  table.pushRevealGrid({
    duration: 2.5,
    ease: "easeInOutSine"
  });

  table.pushRevealElements({
    duration: 4,
    ease: "linear"
  });

  table.pushHighlight("r", "sigma", {
    duration: 1.25,
    ease: "easeInOutSine"
  });

  table.run();
}

function draw() {
  background(5, 16, 32);
  drawTitle();

  groupLabel.update();
  groupLabel.draw();

  d3.update();
  d3.draw();

  d4.update();
  d4.draw();

  table.update();
  table.draw();

  drawGroupNames();
}

function drawTitle() {
  fill(255, 180);
  noStroke();
  textSize(18);
  text("Dihedral symmetries and their multiplication table", width / 2, 34);
}

function drawGroupNames() {
  fill(255, 210);
  noStroke();
  textSize(16);
  text("D3: all rotations, then all flips", d3.x, d3.y + d3.radius + 48);
  text("D4: all rotations, then all flips", d4.x, d4.y + d4.radius + 48);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  makeGroupLabel();
  makeDihedralGroup();
  makeDihedralTable();
  animateDihedralGroup();
  animateDihedralTable();
}
