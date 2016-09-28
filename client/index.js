/* localStorage, document */

const io = require('socket.io-client');
const request = require('browser-request');

console.log('io',io);

const channelField = document.getElementById('channel-field');
let channel = localStorage.getItem('channel');
channelField.addEventListener('change', () => {
  channel = channelField.value;
  localStorage.setItem('channel', channel);

  request(`/api/${channel}`, (error, response, body) => {
    console.log('channel resp', error, body);
  });

  const socket = io(`/${channel}`);
  socket.on('sync', (currentVideo) => {
    console.log('sync data', currentVideo);
  });
});
