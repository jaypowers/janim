let d4;
let groupLabel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  makeGroupLabel();
  makeDihedralGroup();
  animateDihedralGroup();
}

function makeGroupLabel() {
  groupLabel = new Equation("D_4 = \\{ e, r, r^2, r^3, \\sigma, r\\sigma, r^2\\sigma, r^3\\sigma \\}", {
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
  d4 = new DihedralGroup(4, {
    x: width / 2 - 180,
    y: height / 2 + 60,
    radius: 90,
    fillColor: color(45, 95, 150),
    strokeColor: color(180, 220, 255),
    labelColor: color(255),
    axisColor: color(255, 220, 120)
  });
}

function animateDihedralGroup() {
  d4.pushTranslate(width / 2 + 180, height / 2 + 60, {
    duration: 2,
    ease: "easeInOutSine"
  });

  d4.pushRotate(d4.rotation + HALF_PI, {
    duration: 2,
    ease: "easeInOutSine"
  });

  d4.pushScale(1.25, {
    duration: 1.5,
    ease: "easeInOutSine"
  });

  d4.pushScale(1, {
    duration: 1.5,
    ease: "easeInOutSine"
  });

  d4.pushFlip(0, {
    duration: 2,
    ease: "easeInOutSine"
  });

  d4.pushTranslate(width / 2 - 180, height / 2 + 60, {
    duration: 2,
    ease: "easeInOutSine"
  });

  d4.run();
}

function draw() {
  background(5, 16, 32);
  drawTitle();

  groupLabel.update();
  groupLabel.draw();

  d4.update();
  d4.draw();
}

function drawTitle() {
  fill(255, 180);
  noStroke();
  textSize(18);
  text("D4 as symmetries of a square: translate, rotate, scale, flip", width / 2, 34);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
