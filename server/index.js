const httpServer = require('express')();
const server = require('http').createServer(httpServer);
const socketServer = require('socket.io')(server);

const httpPort = process.env.PORT || 3000;
const channels = new Map();

httpServer.use(express.static(`${__dirname}/../public`));
server.listen(httpPort);

class Channel {
	constructor(id, playlistId, secret, socketNamespace) {
		this.id = id;
		this.playlistId = playlistId;
		this.socketNamespace = socketNamespace;
		
		this.confirmSecret = (secretTest) => {
			return secretTest === secret;
		};
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
			socketServer.of('/)
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

	setInterval(() => {
					
	}, 1000);
});
