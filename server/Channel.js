class Channel {
  constructor(id, playlist, secret, socketNamespace) {
    this.id = id;
    this.playlist = playlist;
    this.socketNamespace = socketNamespace;
    this.confirmSecret = (secretTest) => secretTest === secret;
    this.setupSync();
  }

  setupSync() {
    setInterval(() => {
      const status = this.playlist.getCurrentVideoStatus();
      if (status) {
        this.socketNamespace.emit('sync', status);
      }
    }, 1000);
  }

  toJSON() {
    return { id: this.id, playlist: this.playlist.toJSON() };
  }
}

module.exports = Channel;
