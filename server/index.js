const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const io = require('socket.io');
const Cache = require('promised-cache');

const httpServer = express();
const server = http.createServer(httpServer);
const socketServer = io(server);

const youTubeApiKey = process.env.YOUTUBE_API_KEY;
const httpPort = process.env.PORT || 3000;
const channels = new Map();

const Channel = require('./Channel');
const YoutubePlaylist = require('./YoutubePlaylist');

const channelsCache = new Cache('cache/channels', 1000 * 3600 * 30);
channelsCache.get('channels').then((cachedChannels) => {
  const numberOfChannels = cachedChannels && cachedChannels.length ?
                              cachedChannels.length : 0;

  console.log(`Found ${numberOfChannels} channels in cache`);

  if (cachedChannels) {
    cachedChannels.forEach((cachedChannel) => {
      try {
        const channel = new Channel(
          cachedChannel.id,
          new YoutubePlaylist(youTubeApiKey, cachedChannel.playlistId),
          cachedChannel.secret,
          socketServer.of(`/${cachedChannel.id}`)
        );

        if (cachedChannel.status) {
          channel.setCurrentVideo(cachedChannel.status.id);
          channel.setCurrentVideoRemaining(cachedChannel.status.remaining);
          if (cachedChannel.status.playing) {
            channel.play();
          }
        }

        channels.set(cachedChannel.id, channel);
      } catch (error) {
        console.error(error);
      }
    });
  }
});

function saveChannelsToCache() {
  const channelsCacheData = [];

  channels.forEach((channel) => {
    channelsCacheData.push({
      id: channel.id,
      playlistId: channel.playlist.id,
      secret: channel.secret,
      status: channel.getCurrentVideoStatus()
    });
  });

  return channelsCache.set('channels', channelsCacheData);
}

setInterval(saveChannelsToCache, 10 * 1000);

httpServer.use(express.static(`${__dirname}/../build`));
const jsonOptions = {
  type: 'application/json'
};
httpServer.use(bodyParser.json(jsonOptions));
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

    response.status(200).send();
  } else {
    response.status(400).send(
      'Make sure that the manditory parameters playlistId and secret are passed'
    );
  }
});

httpServer.post('/api/:channel/play', hasValidSecret, (request, response) => {
  const channelId = request.params.channel;

  const channel = channels.get(channelId);

  if (channel) {
    channel.play();
    response.send();
  } else {
    response.status(404).send('Not Found');
  }
});

httpServer.post('/api/:channel/pause', hasValidSecret, (request, response) => {
  const channelId = request.params.channel;

  const channel = channels.get(channelId);

  if (channel) {
    channel.pause();
    response.send();
  } else {
    response.status(404).send('Not Found');
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

function exitHandler(exitCode, error) {
  saveChannelsToCache().then(() => {
    if (error) {
      console.error(error.stack);
    }

    process.exit(exitCode);
  });
}

// Do something when app is closing
process.on('exit', exitHandler.bind(undefined, 0));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(undefined, 1));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(undefined, 1));
