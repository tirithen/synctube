const EventEmitter = require('events').EventEmitter;

class Timer extends EventEmitter {
  constructor(timeout) {
    super();
    this.setTimeout(timeout);
  }

  setTimeout(timeout) {
    this.timeout = timeout;
    this.reset();
  }

  getRemaining() {
    return this.timeout - (Date.now() - this.started);
  }

  setRemaining(remaining) {
    if (this.running) {
      this.pause();
      this.resumeAt = remaining;
      this.start();
    } else {
      this.resumeAt = remaining;
    }
  }

  triggerAlarm() {
    this.pause();
    this.emit('alarm');
  }

  start() {
    if (!this.running) {
      this.running = true;

      let remaining = 0;

      if (this.resumeAt) {
        remaining = this.resumeAt;
        delete this.resumeAt;
      } else {
        this.started = Date.now();
        remaining = this.getRemaining();
      }

      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.triggerAlarm();
      }, remaining);
    }
  }

  pause() {
    if (this.running) {
      this.running = false;
      clearTimeout(this.timer);
      this.resumeAt = this.getRemaining();
    }
  }

  reset() {
    this.pause();
    delete this.resumeAt;
  }

  destroy() {
    this.reset();
    this.removeAllListeners('alarm');
  }
}

module.exports = Timer;
