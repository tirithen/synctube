/* global localStorage, document, location */

const io = require('socket.io-client');
const request = require('browser-request');
const youtubePlayerReady = require('./youtubePlayer');

const channelField = document.getElementById('channel-id');
const channelSecretField = document.getElementById('channel-secret');
const channelYoutubeField = document.getElementById('channel-youtube-playlist-id');
const createChannelButton = document.getElementById('create-channel');
const messageElement = document.getElementById('message');
const playerPlayButton = document.getElementById('player-play');
const playerPauseButton = document.getElementById('player-pause');

messageElement.style.display = 'none';
channelYoutubeField.style.display = 'none';
createChannelButton.style.display = 'none';
playerPlayButton.style.display = 'none';
playerPauseButton.style.display = 'none';

youtubePlayerReady().then((youtubePlayer) => {
  const player = youtubePlayer('player');

  //player.setVolume(100);

  function subscribeToChannel(channel) {
    const socket = io(`/${channel}`);
    socket.on('sync', (currentVideo) => {
      console.log('currentVideo', currentVideo);
      const currentTime = Math.round((currentVideo.time || 0) / 1000);

      if (player.currentVideoId !== currentVideo.id) {
        console.log('change video');
        player.loadVideoById({
          videoId: currentVideo.id,
          suggestedQuality: 'small',
          startSeconds: currentTime
        });
        player.currentVideoId = currentVideo.id;
      }

      if (currentTime && currentTime !== Math.round(player.getCurrentTime())) {
        player.seekTo(currentTime, true);
      }

      if (currentVideo.playing) {
        player.playVideo();
      } else {
        player.stopVideo();
      }
    });
  }

  function getChannel() {
    return channelField.value;
  }

  function setChannel(channel) {
    if (channelField.value !== channel) {
      channelField.value = channel;
      localStorage.setItem('channel', channel);
      subscribeToChannel(channel);
    }
  }

  let channelFieldUpdatedTimer;
  function channelFieldUpdated() {
    clearTimeout(channelFieldUpdatedTimer);
    channelFieldUpdatedTimer = setTimeout(() => {
      const channel = channelField.value;
      setChannel(channel);

      request(`/api/${channel}`, (error, response) => {
        if (response.status === 404) {
          messageElement.innerHTML = 'The channel could not be found, fill in ' +
                                     'the details and click the button to create.';
          channelYoutubeField.style.display = '';
          createChannelButton.style.display = '';
          messageElement.style.display = '';
        } else if (response.status === 200) {
          createChannelButton.style.display = 'none';
          messageElement.style.display = 'none';
        } else {
          messageElement.innerHTML = 'An unknown error has occurred, ' +
                                     'try again later.';
          createChannelButton.style.display = 'none';
          messageElement.style.display = '';
        }
      });
    }, 500);
  }
  channelField.addEventListener('change', channelFieldUpdated);
  channelField.addEventListener('blur', channelFieldUpdated);
  channelField.addEventListener('keyup', channelFieldUpdated);

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
      url: `/api/${getChannel()}/play`,
      method: 'POST',
      json: true
    };

    request(options, (error, response) => {
      if (response.status === 401) {
        messageElement.innerHTML = 'Invalid secret for this channel';
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
      url: `/api/${getChannel()}/pause`,
      method: 'POST',
      json: true
    };

    request(options, (error, response) => {
      if (response.status === 401) {
        messageElement.innerHTML = 'Invalid secret for this channel';
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

  createChannelButton.addEventListener('click', () => {
    const parameters = {
      secret: channelSecretField.value,
      playlistId: channelYoutubeField.value
    };

    const options = {
      body: parameters,
      url: `/api/${getChannel()}`,
      method: 'POST',
      json: true
    };

    request(options, (error, response, body) => {
      if (response.status === 200) {
        messageElement.style.display = 'none';
        createChannelButton.style.display = 'none';
        channelYoutubeField.style.display = 'none';
        channelYoutubeField.value = '';
        channelSecretFieldUpdated();
        subscribeToChannel(getChannel());
      } else if (response.status === 409) {
        messageElement.innerHTML = body;
        createChannelButton.style.display = '';
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      } else if (response.status === 400) {
        messageElement.innerHTML = body;
        createChannelButton.style.display = '';
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      } else {
        messageElement.innerHTML = 'An unknown error has occurred, ' +
                                   'try again later.';
        createChannelButton.style.display = '';
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      }
    });
  });

  setChannel(location.hash.replace('#', '') || localStorage.getItem('channel'));
});
