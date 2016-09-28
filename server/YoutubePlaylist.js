const request = require('request');
const parseDuration = require('parse-duration');
const Cache = require('promised-cache');

const Timer = require('./Timer');

class YoutubePlaylist {
  constructor(apiKey, id, playlistSyncDuration = 60 * 1000) {
    this.apiKey = apiKey;
    this.id = id;
    this.playlistSyncDuration = playlistSyncDuration;
    this.list = new Map();
    this.cache = new Cache('cache/YouTubePlayList', this.playlistSyncDuration - 1000);
    this.setupPlaylistSync();
    this.syncPlaylist();
  }

  applyResult(result) {
    this.title = result.title;
    this.thumbnail = result.thumbnail;
    this.list.clear();
    result.items.forEach((item) => {
      this.list.set(item.id, item);
    });
  }

  syncPlaylist() {
    this.cache.get(this.id).then((result) => {
      if (result) {
        this.applyResult(result);
      } else {
        this.fetchPlaylistInfo().then((result) => {
          this.cache.set(this.id, result);
          this.applyResult(result);
        }, error => console.error(error));
      }
    });
  }

  callYoutubeApi(url) {
    return new Promise((resolve, reject) => {
      request(`https://www.googleapis.com/youtube/v3${url}&key=${this.apiKey}`, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });
  }

  fetchPlaylistInfo() {
    const promises = [];

    promises.push(new Promise((resolve, reject) => {
      const url = `/playlistItems?playlistId=${this.id}&part=contentDetails&maxResults=50`;
      this.callYoutubeApi(url).then((result) => {
        const videoIds = result.items.map(item => item.contentDetails.videoId)
        this.fetchPlaylistVideoDetails(videoIds).then(resolve, reject);
      }, reject);
    }));

    promises.push(new Promise((resolve, reject) => {
      const url = `/playlists?id=${this.id}&part=snippet&maxResults=1`;
      this.callYoutubeApi(url).then((result) => {
        if (result.items.length > 0) {
          resolve({
            id: result.items[0].id,
            title: result.items[0].snippet.title,
            thumbnail: result.items[0].snippet.thumbnails.high.url
          });
        } else {
          reject(new Error(`Unable to get info for playlist ${this.id}`));
        }
      }, reject);
    }));

    return new Promise((resolve, reject) => {
      Promise.all(promises).then((results) => {
        results[1].items = results[0];
        resolve(results[1]);
      }, reject);
    });
  }

  fetchPlaylistVideoDetails(videoIds) {
    return new Promise((resolve, reject) => {
      const url = `/videos?id=${videoIds.join(',')}&part=contentDetails,snippet&maxResults=50`;
      this.callYoutubeApi(url).then((result) => {
        resolve(result.items.map((video) => {
          return {
            id: video.id,
            title: video.snippet.title,
            duration: parseDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.high.url
          };
        }));
      }, reject);
    });
  }

  setupPlaylistSync() {
    setInterval(() => {
      this.syncPlaylist();
    }, this.playlistSyncDuration);
  }

  getNextVideo(videoId) {
    let result;

    if (videoId) {
      let setNext = false;
      this.list.forEach((video) => {
        if (!result) {
          if (setNext) {
            result = video;
          }

          if(video.id === videoId) {
            setNext = true;
          }
        }
      });
    }

    if (!result) {
      const next = this.list.values().next();
      if (next && next.value) {
        result = next.value;
      }
    }

    return result;
  }

  play() {
    if (!this.currentVideo) {
      const nextVideo = this.getNextVideo();
      if (nextVideo) {
        this.setCurrentVideo(nextVideo.id);
      }
    }

    if (!this.playing) {
      const video = this.list.get(this.currentVideo);
      if (video) {
        if (this.currentVideoTimer) {
          this.currentVideoTimer.destroy();
        }
        this.currentVideoTimer = new Timer(video.duration);
        this.currentVideoTimer.start().then(() => {
          const nextVideo = this.getNextVideo(video.id);
          this.setCurrentVideo(nextVideo ? nextVideo.id : undefined);
          this.pause();
          this.play();
        });
      }
    }
  }

  pause() {
    this.playing = false;

    if (this.currentVideoTimer) {
      this.currentVideoTimer.pause();
    }
  }

  setCurrentVideo(videoId) {
    this.pause();

    if (this.list.has(videoId)) {
      this.currentVideo = videoId;
    } else {
      delete this.currentVideo;
    }
  }

  getCurrentVideoStatus() {
    let result;

    if (this.currentVideo) {
      result = {
        id: this.currentVideo,
        remaining: this.currentVideoTimer ? this.currentVideoTimer.getRemaining() : undefined
      };
    }

    return result;
  }

  toJSON() {
    const videos = [];

    this.list.forEach((video) => {
      videos.push(video);
    });

    const data = {
      title: this.title,
      thumbnail: this.thumbnail,
      currentVideo: this.getCurrentVideoStatus(),
      videos
    };

    return data;
  }
}

module.exports = YoutubePlaylist;
