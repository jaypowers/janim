/*
  JScenes

  A tiny scene system for Janim sketches. Scenes make it easy to present
  animations one after another, or to build a test gallery where each visual
  test owns its own setup and draw logic.

  Example:
    const scenes = jscenes([
      {
        name: "Intro",
        duration: 4,
        setup(scene) {
          scene.grid = jgrid({ spacing: 50 });
        },
        draw(scene) {
          background(20);
          scene.grid.draw({ progress: scene.progress() });
        }
      }
    ]);

    function draw() {
      scenes.draw();
    }
*/
(function (global) {
  "use strict";

  function jscenes(scenes, options) {
    return new SceneManager(scenes, options);
  }

  class Scene {
    constructor(definition) {
      const settings = definition || {};
      this.name = settings.name || "Untitled Scene";
      this.duration = Math.max(0.1, Number(settings.duration) || 5);
      this.setupFn = settings.setup || null;
      this.drawFn = settings.draw || null;
      this.teardownFn = settings.teardown || null;
      this.data = {};
      this.startedAt = 0;
      this.hasSetup = false;
      this.manager = null;
    }

    setup(manager) {
      this.manager = manager;
      this.startedAt = nowSeconds();
      this.hasSetup = true;
      this.data = {};
      if (typeof this.setupFn === "function") this.setupFn(this, manager);
    }

    draw(manager) {
      if (!this.hasSetup) this.setup(manager);
      if (typeof this.drawFn === "function") this.drawFn(this, manager);
    }

    teardown(manager) {
      if (typeof this.teardownFn === "function") this.teardownFn(this, manager);
      this.hasSetup = false;
    }

    elapsed() {
      return nowSeconds() - this.startedAt;
    }

    progress() {
      return clamp(this.elapsed() / this.duration, 0, 1);
    }
  }

  class SceneManager {
    constructor(scenes, options) {
      const settings = options || {};
      this.scenes = (scenes || []).map((scene) => scene instanceof Scene ? scene : new Scene(scene));
      this.index = 0;
      this.loop = settings.loop !== false;
      this.showLabels = settings.showLabels !== false;
      this.started = false;
    }

    current() {
      return this.scenes[this.index] || null;
    }

    start() {
      const scene = this.current();
      this.started = true;
      if (scene) scene.setup(this);
      return this;
    }

    next() {
      const current = this.current();
      if (current) current.teardown(this);

      if (this.index < this.scenes.length - 1) {
        this.index += 1;
      } else if (this.loop) {
        this.index = 0;
      }

      const scene = this.current();
      if (scene) scene.setup(this);
      return this;
    }

    draw() {
      if (!this.started) this.start();

      const scene = this.current();
      if (!scene) return this;

      if (scene.elapsed() >= scene.duration) this.next();

      const active = this.current();
      if (active) {
        active.draw(this);
        if (this.showLabels) this.drawSceneLabel(active);
      }

      return this;
    }

    drawSceneLabel(scene) {
      if (typeof text !== "function") return;

      push();
      noStroke();
      fill("rgba(255,255,255,0.86)");
      textSize(14);
      textAlign(LEFT, TOP);
      text(scene.name, 24, 22);
      fill("rgba(255,255,255,0.45)");
      text((this.index + 1) + " / " + this.scenes.length, 24, 42);
      pop();
    }
  }

  function nowSeconds() {
    if (typeof millis === "function") return millis() / 1000;
    return Date.now() / 1000;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  global.JScenes = {
    Scene,
    SceneManager,
    create: jscenes
  };
  global.jscenes = jscenes;

  global.Janim = global.Janim || {};
  global.Janim.Scene = Scene;
  global.Janim.SceneManager = SceneManager;
  global.Janim.scenes = jscenes;
})(window);
