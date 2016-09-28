/* global localStorage, document, location */

const io = require('socket.io-client');
const request = require('browser-request');

console.log('io',io);

const channelField = document.getElementById('channel-id');
const channelSecretField = document.getElementById('channel-secret');
const channelYoutubeField = document.getElementById('channel-youtube-playlist-id');
const createChannelButton = document.getElementById('create-channel');
const messageElement = document.getElementById('message');

messageElement.style.display = 'none';
channelSecretField.style.display = 'none';
channelYoutubeField.style.display = 'none';
createChannelButton.style.display = 'none';

let channel = location.hash.replace('#', '') || localStorage.getItem('channel');
localStorage.setItem('channel', channel);

function subscribeToChannel() {
  const socket = io(`/${channel}`);
  socket.on('sync', (currentVideo) => {
    console.log('sync data', currentVideo);
  });
}

channelField.addEventListener('change', () => {
  channel = channelField.value;
  localStorage.setItem('channel', channel);

  request(`/api/${channel}`, (error, response, body) => {
    console.log('channel resp', error, body, response);
    channelSecretField.style.display = '';

    if (response.status === 404) {
      messageElement.innerHTML = 'The channel could not be found, fill in the details and click the button to create.';
      channelYoutubeField.style.display = '';
      createChannelButton.style.display = '';
      messageElement.style.display = '';
    } else if (response.status === 200) {
      createChannelButton.style.display = 'none';
      messageElement.style.display = 'none';
      console.log('connected', body);
    } else {
      messageElement.innerHTML = 'An unknown error has occurred, try again later.';
      createChannelButton.style.display = 'none';
      messageElement.style.display = '';
    }

    subscribeToChannel();
  });
});

createChannelButton.addEventListener('click', () => {
  const parameters = {
    secret: channelSecretField.value,
    playlistId: channelYoutubeField.value
  };

  const options = {
    body: parameters,
    url: `/api/${channel}`,
    method: 'POST',
    json: true
  };

  request.post(options, (error, response, body) => {
    if (response.status === 200) {
      messageElement.style.display = 'none';
      createChannelButton.style.display = 'none';
      channelYoutubeField.style.display = 'none';
      channelYoutubeField.value = '';
      subscribeToChannel();
    } else if (response.status === 409) {
      messageElement.innerHTML = body;
      channelYoutubeField.style.display = '';
      messageElement.style.display = '';
    } else if (response.status === 400) {
      messageElement.innerHTML = body;
      channelYoutubeField.style.display = '';
      messageElement.style.display = '';
    } else {
      messageElement.innerHTML = 'An unknown error has occurred, try again later.';
      channelYoutubeField.style.display = '';
      messageElement.style.display = '';
    }
  });
});


if (channel) {
  channelField.value = channel;
}
