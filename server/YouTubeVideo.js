const request = require('request');
const parseDuration = require('parse-duration');

const Timer = require('./Timer');

class YouTubeVideo {
  constructor(id, apiKey) {
    this.apiKey = apiKey;
    this.id = id;
    this.setupVideoSync();
    this.syncVideo();
  }

  setupVideoSync() {
    setInterval(() => {
      this.syncVideo();
    }, 20000);
  }

  syncVideo() {
    this.fetchVideoDetails(this.id).then((videos) => {
      if (videos && videos[0]) {
        this.loaded = true;
        this.title = videos[0].title;
        this.duration = videos[0].duration;
        this.thumbnail = videos[0].thumbnail;
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

  fetchVideoDetails(videoId) {
    return new Promise((resolve, reject) => {
      const url = `/videos?id=${videoId}` +
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

  play() {
    if (!this.playing) {
      this.playing = true;
console.log('now playing');
      if (!this.timer) {
        this.timer = new Timer(this.duration);
      }

      this.timer.start();
    }
  }

  pause() {
    if (this.playing) {
      delete this.playing;

      if (this.timer) {
        this.timer.pause();
      }
    }
  }

  getStatus() {
    if (this.loaded) {
      const timer = this.timer;
      const remaining = timer ? timer.getRemaining() : this.duration;
      const result = {
        id: this.id,
        title: this.title,
        remaining,
        time: this.duration - remaining,
        duration: this.duration,
        playing: !!this.playing
      };

      return result;
    }

    return undefined;
  }
}

module.exports = YouTubeVideo;
