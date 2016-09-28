class Timer {
  constructor(time) {
    this.time = time;
    this.reset();
  }

  getRemaining() {
    return this.remaining - Date.now() - this.started;
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.started = Date.now();

      if (!this.triggered) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.running = false;
          this.triggered = true;
          this.timerPromise.resolve();
        }, this.remaining);
      }
    }

    return this.timerPromise;
  }

  pause() {
    if (this.running) {
      clearTimeout(this.timer);
      this.remaining -= Date.now() - this.started;
      this.running = false;
    }
  }

  reset() {
    this.pause();
    this.remaining = this.time;
    delete this.running;
    delete this.started;
    delete this.triggered;
    if (this.timerPromise) {
      this.timerPromise.reject();
    }
    this.timerPromise = new Promise();
  }

  destroy() {
    this.running = true;
    this.pause();
    this.timerPromise.reject();
    this.reset();
    this.timerPromise.reject();
  }
}

module.exports = Timer;
