class SceneQueueObject {
  constructor() {
    this.steps = [];
    this.stepIndex = 0;
    this.currentIndex = -1;
    this.current = null;
    this.elapsed = 0;
    this.running = false;
    this.loopSteps = false;
  }

  push(scene, options = {}) {
    if (typeof scene === "string") {
      this.steps.push(Object.assign({ type: scene }, options));
      return this;
    }

    this.steps.push({
      type: "scene",
      scene,
      duration: options.duration === undefined ? null : options.duration
    });
    return this;
  }

  run(options = {}) {
    this.running = true;
    this.loopSteps = Boolean(options.loop);
    this.stepIndex = 0;
    this.currentIndex = -1;
    this.current = null;
    this.elapsed = 0;
    this.goTo(0);
    return this;
  }

  update(dt) {
    const seconds = dt || deltaTime / 1000 || 1 / 60;

    if (this.current && typeof this.current.update === "function") {
      this.current.update(seconds);
    }

    if (!this.running || !this.current) return this;

    this.elapsed += seconds;
    if (this.currentDuration !== null && this.elapsed >= this.currentDuration) {
      this.next();
    }

    return this;
  }

  draw() {
    if (this.current && typeof this.current.draw === "function") {
      this.current.draw();
    }
    return this;
  }

  resize() {
    if (this.current && typeof this.current.resize === "function") {
      this.current.resize();
    }
    return this;
  }

  startNextStep() {
    return this.goTo(this.stepIndex);
  }

  goTo(index) {
    if (this.steps.length === 0) {
      this.running = false;
      return this;
    }

    if (this.loopSteps) {
      index = (index + this.steps.length) % this.steps.length;
    } else {
      index = Math.max(0, Math.min(index, this.steps.length - 1));
    }

    if (index === this.currentIndex && this.current) {
      return this;
    }

    const step = this.steps[index];
    this.currentIndex = index;
    this.stepIndex = index + 1;

    if (step.type === "scene") {
      this.current = step.scene;
      this.currentDuration = step.duration;
      this.elapsed = 0;
      if (this.current && typeof this.current.setup === "function") {
        this.current.setup();
      }
      return this;
    }

    return this.goTo(index + 1);
  }

  next() {
    return this.goTo(this.currentIndex + 1);
  }

  previous() {
    return this.goTo(this.currentIndex - 1);
  }
}

function SceneQueue() {
  return new SceneQueueObject();
}
