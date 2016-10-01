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
    console.log(this.timeout, Date.now(), this.started, this.resumeAt);

    if (this.started) {
      if (!this.running && typeof this.resumeAt === 'number') {
        return this.resumeAt;
      } else {
        return this.timeout - (Date.now() - this.started);
      }
    } else {
      return this.timeout;
    }
  }

  setRemaining(remaining) {
    this.started = Date.now();
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
console.log('triggerAlarm', this);
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
      if (this.resumeAt < 0) {
        this.resumeAt = 0;
      }
    }
  }

  reset() {
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
