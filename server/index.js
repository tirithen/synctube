const httpServer = require('express')();

const httpPort = process.env.PORT || 3000;
const channels = new Map();
const channelSecrets = new Map();

function hasValidSecret(request, response, next) {
	const channelId = request.params.channel;
	const secret = request.body.secret;

	if (secret && secret === channelSecrets.get(channelId)) {
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
		channels.set(channelId, { playlistId, id: channelId });
		channelSecrets.set(channelId, secret);
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

httpServer.listen(httpPort);
