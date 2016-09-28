const express = require('express');
const httpServer = express();
const bodyParser = require('body-parser');
const server = require('http').createServer(httpServer);
const socketServer = require('socket.io')(server);

const youTubeApiKey = process.env.YOUTUBE_API_KEY;
const httpPort = process.env.PORT || 3000;
const channels = new Map();

const Channel = require('./Channel');
const YoutubePlaylist = require('./YoutubePlaylist');

httpServer.use(express.static(`${__dirname}/../build`));
httpServer.use(bodyParser.json({ type: 'application/json' }))
server.listen(httpPort);

function hasValidSecret(request, response, next) {
  const channelId = request.params.channel;
  const secret = request.body.secret;

  const channel = channels.get(channelId);

  if (channel && channel.confirmSecret(secret)) {
    next();
  } else {
    response.status(401).send('Invalid or missing secret');
  }
}

httpServer.get('/api/:channel', (request, response) => {
  const channel = channels.get(request.params.channel);

  if (channel) {
    response.json(channel);
  } else {
    response.status(404).send('Not Found');
  }
});

httpServer.post('/api/:channel', (request, response) => {
  const channelId = request.params.channel;
  const playlistId = request.body.playlistId;
  const secret = request.body.secret;

  const channel = channels.get(channelId);


  if (channel) {
    response.status(409).send('Channel already exists');
  } else if (channelId && playlistId && secret) {
    channels.set(channelId, new Channel(
      channelId,
      new YoutubePlaylist(youTubeApiKey, playlistId),
      secret,
      socketServer.of(`/${channelId}`)
    ));

    response.status(201).send();
  } else {
    response.status(400).send(
      'Make sure that the manditory parameters playlistId and secret are passed'
    );
  }
});

httpServer.delete('/api/:channel', hasValidSecret, (request, response) => {
  const channel = channels.get(request.params.channel);

  if (channel) {
    channels.delete(channel.id);
    response.send();
  } else {
    response.status(404).send('Not Found');
  }
});
