let setEquation;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  setEquation = new Equation("S_3 = \\{ e, r, r^2, \\sigma, r \\sigma, r^2 \\sigma\\}", {
    x: width / 2,
    y: height / 2,
    size: 30,
    color: color(200, 200, 255, 255),
    shineColor: color(255),
  });

  setEquation.reveal({
    direction: "left-to-right",
    duration: 3,
    ease: "easeInOutSine",
    letters: true,
    pop: 0.28
  });

  setEquation.translate(width/2, height/4, {
    duration: 3,
    ease: "easeInOutSine"
  });

  setEquation.rotate(2*PI, {
    duration: 3,
    ease: "easeInOutSine"
  });
}

function draw() {
  background(5, 16, 32);

  fill(255, 180);
  noStroke();
  textSize(18);
  text("Reveal directions: left-to-right or right-to-left", width / 2, 90);

  setEquation.update();
  setEquation.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
