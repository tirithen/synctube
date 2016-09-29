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
    this.cache = new Cache(
      'cache/YouTubePlayList',
      this.playlistSyncDuration - 1000
    );
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
    this.cache.get(this.id).then((cacheResult) => {
    if (cacheResult) {
        this.applyResult(cacheResult);
      } else {
        this.fetchPlaylistInfo().then((playlistResult) => {
          this.cache.set(this.id, playlistResult);
          this.applyResult(playlistResult);
        }, error => console.error(error));
      }
    });
  }

  callYoutubeApi(url) {
    return new Promise((resolve, reject) => {
      request(
        `https://www.googleapis.com/youtube/v3${url}&key=${this.apiKey}`,
        (error, response, body) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            try {
              const result = JSON.parse(body);

              if (response.statusCode === 200) {
                resolve(result);
              } else if (
                response.statusCode === 400 &&
                result.error && result.error.errors &&
                result.error.errors[0].reason === 'keyInvalid'
              ) {
                console.error(new Error('The Youtube key is invalid'));
                reject(result);
              } else {
                console.error(new Error('Unknown error while making Youtube API call'));
                reject(result);
              }
            } catch (parseError) {
              console.error(parseError);
              reject(parseError);
            }
          }
        }
      );
    });
  }

  fetchPlaylistInfo() {
    const promises = [];

    promises.push(new Promise((resolve, reject) => {
      const url = `/playlistItems?playlistId=${this.id}` +
                  '&part=contentDetails&maxResults=50';
      this.callYoutubeApi(url).then((result) => {
        const videoIds = result.items.map(item => item.contentDetails.videoId);
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
      const url = `/videos?id=${videoIds.join(',')}` +
                  '&part=contentDetails,snippet&maxResults=50';
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

          if (video.id === videoId) {
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
        this.playing = true;
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

    if (this.list.has(this.currentVideo)) {
      const video = this.list.get(this.currentVideo);
      const timer = this.currentVideoTimer;
      const remaining = timer ? timer.getRemaining() : video.duration;

      result = {
        id: video.id,
        title: video.title,
        remaining,
        time: video.duration - remaining,
        duration: video.duration,
        playing: this.playing
      };
    }

    return result;
  }

  setCurrentVideoRemaining(remaining) {
    if (this.currentVideoTimer) {
      this.currentVideoTimer.setRemaining(remaining);
    }
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
