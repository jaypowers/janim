let equation;
let setEquation;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  setEquation = new Equation("S_3 = \\{ e, r, r^2, \\sigma, r \\sigma, r^2 \\sigma\\}", {
    x: width / 2,
    y: height / 2,
    size: 42,
    color: "rgba(255, 255, 255, 0.5)",
  });

/*
  equation = new Equation("e^{i\\pi} + 1 = 0", {
    x: width / 2 - 140,
    y: height / 2,
    size: 42,
    color: "rgba(255, 255, 255, 0.5)",
  });

  equation.translate(width / 2, height / 2);

  equation.rotate(TWO_PI, {
    duration: 4,
    ease: "easeInOutSine",
    loop: true
  });

  equation.scale(1.5, {
    duration: 2,
    ease: "easeInOutSine",
    loop: true,
    yoyo: true
  });
  */
}

function draw() {
  background(5, 16, 32);

  setEquation.update();
  setEquation.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}