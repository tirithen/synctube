const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const io = require('socket.io');

const YouTubeVideo = require('./YouTubeVideo');

const httpServer = express();
const server = http.createServer(httpServer);
const socketServer = io(server);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_VIDEO_ID = process.env.YOUTUBE_VIDEO_ID;
const SECRET = process.env.SECRET;
const httpPort = process.env.PORT || 3000;

const youTubeVideo = new YouTubeVideo(YOUTUBE_VIDEO_ID, YOUTUBE_API_KEY);

httpServer.use(express.static(`${__dirname}/../build`));
const jsonOptions = {
  type: 'application/json'
};
httpServer.use(bodyParser.json(jsonOptions));
server.listen(httpPort);

function hasValidSecret(request, response, next) {
  const secret = request.body.secret;

  if (secret === SECRET) {
    next();
  } else {
    response.status(401).send('Invalid or missing secret');
  }
}

httpServer.post('/api/play', hasValidSecret, (request, response) => {
  youTubeVideo.play();
  response.json(true);
});

httpServer.post('/api/pause', hasValidSecret, (request, response) => {
  youTubeVideo.pause();
  response.json(true);
});

setInterval(() => {
  const status = youTubeVideo.getStatus();

  if (status) {
    console.log('Sending status', status);
    socketServer.of('/video').emit('sync', status);
  }
}, 3000);
