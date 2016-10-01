/* global localStorage, document, location */

const io = require('socket.io-client');
const request = require('browser-request');
const youtubePlayerReady = require('./youtubePlayer');

const channelSecretField = document.getElementById('channel-secret');
const messageElement = document.getElementById('message');
const playerPlayButton = document.getElementById('player-play');
const playerPauseButton = document.getElementById('player-pause');

messageElement.style.display = 'none';
playerPlayButton.style.display = 'none';
playerPauseButton.style.display = 'none';

youtubePlayerReady().then((youtubePlayer) => {
  const player = youtubePlayer('player');
console.log('hej hopo');
  const socket = io('/video');
  console.log('socket', socket.on);
  socket.on('sync', (videoData) => {
    console.log('sync', videoData);
    const currentTime = Math.round((videoData.time || 0) / 1000);

    if (player.videoDataId !== videoData.id) {
      player.loadVideoById({
        videoId: videoData.id,
        suggestedQuality: 'small',
        startSeconds: currentTime
      });
      player.videoDataId = videoData.id;
    }

    if (currentTime && currentTime !== Math.round(player.getCurrentTime())) {
      player.seekTo(currentTime, true);
    }

    if (videoData.playing) {
      player.playVideo();
    } else {
      player.stopVideo();
    }
  });

  function channelSecretFieldUpdated() {
    if (channelSecretField.value && channelSecretField.value.trim()) {
      playerPlayButton.style.display = '';
      playerPauseButton.style.display = '';
    } else {
      playerPlayButton.style.display = 'none';
      playerPauseButton.style.display = 'none';
    }
  }
  channelSecretField.addEventListener('change', channelSecretFieldUpdated);
  channelSecretField.addEventListener('blur', channelSecretFieldUpdated);
  channelSecretField.addEventListener('keyup', channelSecretFieldUpdated);

  playerPlayButton.addEventListener('click', () => {
    const parameters = {
      secret: channelSecretField.value
    };

    const options = {
      body: parameters,
      url: '/api/play',
      method: 'POST',
      json: true
    };

    request(options, (error, response) => {
      if (response.status === 401) {
        messageElement.innerHTML = 'Invalid secret';
        messageElement.style.display = '';
      } else if (response.status !== 200) {
        messageElement.innerHTML = 'An unknown error has occurred, ' +
                                   'try again later.';
        messageElement.style.display = '';
      } else {
        messageElement.style.display = 'none';
      }
    });
  });

  playerPauseButton.addEventListener('click', () => {
    const parameters = {
      secret: channelSecretField.value
    };

    const options = {
      body: parameters,
      url: '/api/pause',
      method: 'POST',
      json: true
    };

    request(options, (error, response) => {
      if (response.status === 401) {
        messageElement.innerHTML = 'Invalid secret';
        messageElement.style.display = '';
      } else if (response.status !== 200) {
        messageElement.innerHTML = 'An unknown error has occurred, ' +
                                   'try again later.';
        messageElement.style.display = '';
      } else {
        messageElement.style.display = 'none';
      }
    });
  });
});
