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
channelSecretField.style.display = 'none';
channelYoutubeField.style.display = 'none';
createChannelButton.style.display = 'none';
//playerPlayButton.style.display = 'none';
//playerPauseButton.style.display = 'none';

youtubePlayerReady().then((youtubePlayer) => {
  const player = youtubePlayer('player');

  //player.setVolume(100);

  function getChannel() {
    return channelField.value;
  }

  function setChannel(channel) {
    channelField.value = channel;
    localStorage.setItem('channel', channel);
  }

  function subscribeToChannel(channel) {
    const socket = io(`/${channel}`);
    socket.on('sync', (currentVideo) => {
      console.log('currentVideo', currentVideo);
      if (player.currentVideoId !== currentVideo.id) {
        console.log('change video');
        player.loadVideoById({
          videoId: currentVideo.id,
          suggestedQuality: 'small'
        });
        player.currentVideoId = currentVideo.id;
      }

      const currentTime = Math.round(currentVideo.time / 1000);
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

  channelField.addEventListener('change', () => {
    const channel = channelField.value;
    localStorage.setItem('channel', channel);

    request(`/api/${channel}`, (error, response) => {
      channelSecretField.style.display = '';

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

      subscribeToChannel(channel);
    });
  });

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

    request(options, () => {});
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

    request(options, () => {});
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
        subscribeToChannel(getChannel());
      } else if (response.status === 409) {
        messageElement.innerHTML = body;
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      } else if (response.status === 400) {
        messageElement.innerHTML = body;
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      } else {
        messageElement.innerHTML = 'An unknown error has occurred, ' +
                                   'try again later.';
        channelYoutubeField.style.display = '';
        messageElement.style.display = '';
      }
    });
  });

  setChannel(location.hash.replace('#', '') || localStorage.getItem('channel'));
});
