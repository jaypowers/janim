let scenes;
let testResults;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  testResults = JanimTests.runUnitTests();
  scenes = jscenes(buildScenes(), sceneManagerOptions());
}

function buildScenes() {
  return listOf(
    unitTestsScene(testResults),
    formulaAnimationScene(),
    grid2DScene(),
    surface3DScene(),
    flatPrimitiveScene(),
    wirePrimitiveScene(),
    cameraSnapScene()
  );
}

function unitTestsScene(results) {
  const scene = sceneDef("Unit Tests", 5);

  scene.draw = function () {
    background(5, 16, 32);
    drawTitle("Janim Unit Tests");
    drawTestResults(results || listOf());
  };

  return scene;
}

function formulaAnimationScene() {
  const scene = sceneDef("Janimation + JanimTex", 7);

  scene.setup = function (activeScene) {
    activeScene.data.path = formulaPath();

    jtex("\\sqrt{x^2 + y^2} = 1", texOptions(42, "white"))
      .then((img) => {
        activeScene.data.formula = Janimation.formula(img, formulaStartOptions());
        activeScene.data.formula
          .uncover(2.2, uncoverOptions())
          .follow(activeScene.data.path, 5.5, loopingEaseOptions());
      });
  };

  scene.draw = function (activeScene) {
    background(5, 16, 32);
    drawTitle("Formula Reveal And Path Follow");
    activeScene.data.path.draw(pathDrawOptions());
    if (activeScene.data.formula) {
      activeScene.data.formula.update();
      activeScene.data.formula.draw();
    }
  };

  return scene;
}

function grid2DScene() {
  const scene = sceneDef("JGrid 2D Plot", 7);

  scene.setup = function (activeScene) {
    activeScene.data.grid = jgrid(grid2DOptions());
  };

  scene.draw = function (activeScene) {
    const progress = activeScene.progress();

    background(5, 16, 32);
    drawTitle("2D Grid: grid.plot(\"y = \\\\sin(x)\")");
    activeScene.data.grid.draw(progressOptions(progress));
    activeScene.data.grid.plot("y = \\sin(x)", plotOptions());
  };

  return scene;
}

function surface3DScene() {
  const scene = sceneDef("JGrid3D Surface", 8);

  scene.setup = function (activeScene) {
    activeScene.data.grid = makeGrid3D();
  };

  scene.draw = function (activeScene) {
    const grid = activeScene.data.grid;
    const progress = activeScene.progress();

    background(5, 16, 32);
    drawTitle("3D Wire Surface: z = sin(x) + cos(y)");
    grid.draw(progressOptions(progress));
    grid.surface("z = \\sin(x) + \\cos(y)", surfaceOptions(progress));
  };

  return scene;
}

function flatPrimitiveScene() {
  const scene = primitiveScene("Flat-Shaded Primitives", "Flat Shading Is The Default");
  scene.data.wireframe = false;
  return scene;
}

function wirePrimitiveScene() {
  const scene = primitiveScene("Optional Wireframes", "wireframe: true Adds Descriptive Guide Curves");
  scene.data.wireframe = true;
  return scene;
}

function primitiveScene(name, title) {
  const scene = sceneDef(name, 8);

  scene.setup = function (activeScene) {
    activeScene.data.grid = makeGrid3D();
    activeScene.data.prim = jprim3d(activeScene.data.grid);
    activeScene.data.wireframe = scene.data.wireframe;
  };

  scene.draw = function (activeScene) {
    const progress = activeScene.progress();

    background(5, 16, 32);
    drawTitle(title);
    activeScene.data.grid.draw(progressOptions(progress));
    drawPrimitiveSet(activeScene.data.prim, progress, activeScene.data.wireframe);
  };

  return scene;
}

function cameraSnapScene() {
  const scene = sceneDef("JScenes + Camera Snaps", 12);
  scene.data.views = cameraViews();

  scene.setup = function (activeScene) {
    activeScene.data.grid = makeGrid3D();
    activeScene.data.views = scene.data.views;
  };

  scene.draw = function (activeScene) {
    background(5, 16, 32);
    drawTitle("Scene Switching And Orbit Snaps");
    activeScene.data.grid.animateSnapViews(
      activeScene.data.views,
      activeScene.elapsed(),
      cameraSnapOptions()
    );
    activeScene.data.grid.draw(progressOptions(1));
    activeScene.data.grid.surface("z = \\sin(x) + \\cos(y)", cameraSurfaceOptions());
  };

  return scene;
}

function makeGrid3D() {
  return jgrid3d(grid3DOptions());
}

function drawPrimitiveSet(prim, progress, wireframe) {
  prim.sphere(xyz(-2.4, -2.2, 1.1), 0.65, sphereOptions(progress, wireframe));
  prim.cone(xyz(2.4, -2.1, 0.8), coneOptions(progress, wireframe));
  prim.torus(xyz(0, 2.25, 0.85), torusOptions(progress, wireframe));
}

function formulaPath() {
  return Janimation.path(listOf(
    xy(width * 0.25, height * 0.58),
    xy(width * 0.5, height * 0.38),
    xy(width * 0.75, height * 0.58)
  ));
}

function cameraViews() {
  return listOf(
    "octant+++",
    "xy+",
    "octant-++",
    "yz-",
    "octant--+",
    "xz-",
    "octant---",
    "xy-"
  );
}

function sceneDef(name, duration) {
  const scene = {};
  scene.name = name;
  scene.duration = duration;
  scene.data = {};
  return scene;
}

function sceneManagerOptions() {
  const options = {};
  options.loop = true;
  options.showLabels = true;
  return options;
}

function texOptions(size, color) {
  const options = {};
  options.size = size;
  options.color = color;
  return options;
}

function formulaStartOptions() {
  const options = {};
  options.x = width * 0.25;
  options.y = height * 0.58;
  options.reveal = 0;
  return options;
}

function uncoverOptions() {
  const options = {};
  options.direction = "left";
  options.ease = "easeInOutSine";
  return options;
}

function loopingEaseOptions() {
  const options = {};
  options.ease = "easeInOutSine";
  options.loop = true;
  return options;
}

function pathDrawOptions() {
  const options = {};
  options.color = "rgba(255,255,255,0.25)";
  options.weight = 2;
  return options;
}

function grid2DOptions() {
  const options = {};
  options.spacing = 56;
  options.majorEvery = 2;
  options.unit = 1;
  options.minorColor = "rgba(255,255,255,0.12)";
  options.majorColor = "rgba(255,255,255,0.24)";
  return options;
}

function plotOptions() {
  const options = {};
  options.color = "rgba(105,170,255,0.95)";
  options.weight = 3;
  options.step = 3;
  return options;
}

function surfaceOptions(progress) {
  const options = {};
  options.xRange = range(-3.2, 3.2);
  options.yRange = range(-3.2, 3.2);
  options.xSteps = 24;
  options.ySteps = 24;
  options.color = "rgba(255,255,255,0.72)";
  options.weight = 1.25;
  options.progress = progress;
  return options;
}

function cameraSurfaceOptions() {
  const options = {};
  options.xRange = range(-3, 3);
  options.yRange = range(-3, 3);
  options.color = "rgba(255,255,255,0.66)";
  options.weight = 1.2;
  return options;
}

function cameraSnapOptions() {
  const options = {};
  options.transition = 1.6;
  options.hold = 0.55;
  options.distance = 7.5;
  options.zoom = 1.12;
  return options;
}

function grid3DOptions() {
  const options = {};
  options.range = 4;
  options.step = 1;
  options.scale = Math.min(width, height) * 0.26;
  options.focalLength = 18;
  options.originX = width * 0.5;
  options.originY = height * 0.62;
  options.camera = xyz(4.4, 3.4, 5.2);
  options.target = xyz(0, 0, 0);
  options.xGridColor = "rgba(255, 115, 115, 0.22)";
  options.yGridColor = "rgba(105, 255, 165, 0.22)";
  options.zGridColor = "rgba(105, 170, 255, 0.22)";
  return options;
}

function sphereOptions(progress, wireframe) {
  const options = {};
  options.color = "rgba(255, 132, 132, 0.82)";
  options.fill = "rgba(255, 104, 104, 0.42)";
  options.wireframe = wireframe;
  options.progress = progress;
  return options;
}

function coneOptions(progress, wireframe) {
  const options = {};
  options.radius = 0.7;
  options.height = 1.45;
  options.color = "rgba(117, 255, 174, 0.82)";
  options.fill = "rgba(105, 255, 165, 0.42)";
  options.wireframe = wireframe;
  options.progress = progress;
  return options;
}

function torusOptions(progress, wireframe) {
  const options = {};
  options.majorRadius = 0.85;
  options.minorRadius = 0.22;
  options.color = "rgba(115, 174, 255, 0.82)";
  options.fill = "rgba(105, 170, 255, 0.42)";
  options.wireframe = wireframe;
  options.progress = progress;
  return options;
}

function progressOptions(progress) {
  const options = {};
  options.progress = progress;
  return options;
}

function xy(x, y) {
  const point = {};
  point.x = x;
  point.y = y;
  return point;
}

function xyz(x, y, z) {
  const point = xy(x, y);
  point.z = z;
  return point;
}

function range(min, max) {
  return listOf(min, max);
}

function listOf() {
  return Array.prototype.slice.call(arguments);
}

function drawTitle(label) {
  push();
  noStroke();
  fill("rgba(255,255,255,0.92)");
  textSize(22);
  textAlign(LEFT, TOP);
  text(label, 24, 72);
  pop();
}

function drawTestResults(results) {
  push();
  textSize(16);
  textAlign(LEFT, TOP);
  results.forEach((result, index) => {
    fill(result.pass ? "rgba(105,255,165,0.9)" : "rgba(255,115,115,0.95)");
    text((result.pass ? "PASS " : "FAIL ") + result.name, 48, 130 + index * 28);
  });
  pop();
}

function draw() {
  scenes.draw();
}

function keyPressed() {
  if (key === " " || keyCode === RIGHT_ARROW) scenes.next();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  scenes = jscenes(buildScenes(), sceneManagerOptions());
}
