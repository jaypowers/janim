let setEquation;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  setEquation = new Equation("S_3 = \\{ e, r, r^2, \\sigma, r \\sigma, r^2 \\sigma\\}", {
    x: width / 2,
    y: height / 2,
    size: 30,
    color: color(200, 200, 255),
    shineColor: color(255),
  });

  setEquation.reveal({
    direction: "left-to-right",
    duration: 3,
    ease: "easeInOutSine",
    letters: true,
    pop: 0.28
  });

  animateCharacters();
}

function animateCharacters() {
  if (!setEquation.ready) {
    setTimeout(animateCharacters, 100);
    return;
  }
/*
  setEquation.characters[0].scale(1.5, { duration: 0.8, yoyo: true, loop: true });
  setEquation.characters[4].translate(0, -18, { duration: 0.8, yoyo: true, loop: true });
  setEquation.characters[8].rotate(PI / 8, { duration: 0.8, yoyo: true, loop: true });
  */
}

function draw() {
  background(5, 16, 32);

  fill(255, 180);
  noStroke();
  textSize(18);
  text("Reveal directions: left-to-right, right-to-left, top-to-bottom, bottom-to-top", width / 2, 90);

  setEquation.update();
  setEquation.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
