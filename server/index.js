const express = require('express');
const httpServer = express();
const bodyParser = require('body-parser');
const server = require('http').createServer(httpServer);
const socketServer = require('socket.io')(server);
const youTubePlayList = require('youtube-playlist-info').playlistInfo;

const youTubeApiKey = process.env.YOUTUBE_API_KEY;
const httpPort = process.env.PORT || 3000;
const channels = new Map();

httpServer.use(express.static(`${__dirname}/../public`));
httpServer.use(bodyParser.json({ type: 'application/json' }))
server.listen(httpPort);

class Channel {
	constructor(id, playlistId, secret, socketNamespace) {
		this.id = id;
		this.playlistId = playlistId;
		this.socketNamespace = socketNamespace;

		this.confirmSecret = (secretTest) => {
			return secretTest === secret;
		};

		this.setupPlaylistSync();
		this.syncPlaylist();
		this.setupSync();
	}

	syncPlaylist() {
		youTubePlayList(youTubeApiKey, this.playlistId, (items) => {
			console.log(items);
		});
	}

	setupPlaylistSync() {
		setInterval(() => {
			this.syncPlaylist();
		}, 1000 * 30);
	}

	setupSync() {
		setInterval(() => {
			if (this.currentVideo) {
				this.socketNamespace.emit('sync', this.currentVideo);
			}
		}, 1000);
	}

	toJSON() {
		return { id: this.id, playlistId: this.playlistId };
	}
}

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
		response.status(420).send('Channel already exists');
	} else if (channelId && playlistId && secret) {
		channels.set(channelId, new Channel(
			channelId,
			playlistId,
			secret,
			socketServer.of(`/${channelId}`)
		));
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

socketServer.on('connection', (socket) => {
	socket.on('channel subscribe', (channel) => {
		socket.channel = channels.get(channel);
	});
});
