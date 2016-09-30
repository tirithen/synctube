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
    clearInterval(this.interval);
    this.timerPromise = new Promise((resolve) => {
      this.interval = setInterval(() => {
        if (this.triggered) {
          resolve();
          clearInterval(this.interval);
        }
      }, 5);
    });
  }

  destroy() {
    this.running = true;
    this.pause();
    this.reset();
    this.triggered = true;
  }
}

module.exports = Timer;
