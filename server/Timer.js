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
    if (!this.started) {
      return this.timeout;
    }

    if (!this.running) {
      return this.resumeAt || 0;
    }

    return this.timeout - (Date.now() - this.started);
  }

  triggerAlarm() {
    this.alarmTriggered = true;
    clearTimeout(this.timer);
    delete this.timer;
    delete this.running;
    this.emit('alarm');
  }

  start() {
    let remaining = 0;

    if (!this.running) {
      this.running = true;

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
    clearTimeout(this.timer);
    delete this.timer;

    if (this.running) {
      this.resumeAt = this.getRemaining();
      if (this.resumeAt < 0) {
        this.resumeAt = 0;
      }
      delete this.running;
    }
  }

  reset() {
    delete this.alarmTriggered;
    delete this.resumeAt;
    clearTimeout(this.timer);
    delete this.timer;
    delete this.running;
    delete this.started;
  }

  destroy() {
    this.reset();
    this.removeAllListeners('alarm');
  }
}

module.exports = Timer;
