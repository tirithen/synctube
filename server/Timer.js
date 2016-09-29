class Timer {
  constructor(time) {
    this.time = time;
    this.reset();
  }

  getRemaining() {
    return this.remaining - (Date.now() - this.started);
  }

  setRemaining(remaining) {
    this.pause();
    this.remaining = remaining;
    this.start();
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
          Promise.resolve(this.timerPromise);
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
      Promise.reject(this.timerPromise);
    }
    this.timerPromise = new Promise(() => {});
  }

  destroy() {
    this.running = true;
    this.pause();
    Promise.reject(this.timerPromise);
    this.reset();
    Promise.reject(this.timerPromise);
  }
}

module.exports = Timer;
