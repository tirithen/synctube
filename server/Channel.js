const SYNC_INTERVAL = process.env.SYNC_INTERVAL || 5000;

class Channel {
  constructor(id, playlist, secret, socketNamespace) {
    this.id = id;
    this.playlist = playlist;
    this.secret = secret;
    this.socketNamespace = socketNamespace;
    this.confirmSecret = secretTest => secretTest === secret;
    this.setupSync();
    console.log(`Created channel ${this.id}`);
  }

  setupSync() {
    setInterval(() => {
      const status = this.playlist.getCurrentVideoStatus();

      if (status) {
        console.log(`Channel ${this.id} emitting status`, status);
        this.socketNamespace.emit('sync', status);
      }
    }, SYNC_INTERVAL);
  }

  play() {
    this.playlist.play();
    console.log(`Playing on channel ${this.id}`);
  }

  pause() {
    this.playlist.pause();
    console.log(`Paused channel ${this.id}`);
  }

  setCurrentVideo(videoId) {
    this.playlist.setCurrentVideo(videoId);
    console.log(`Set video ${videoId} on channel ${this.id}`);
  }

  getCurrentVideoStatus() {
    return this.playlist.getCurrentVideoStatus();
  }

  setCurrentVideoRemaining(remaining) {
    this.playlist.setCurrentVideoRemaining(remaining);
  }

  toJSON() {
    return {
      id: this.id,
      playlist: this.playlist.toJSON()
    };
  }
}

module.exports = Channel;
