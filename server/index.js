const server = require('express')();

const channels = new Map();

server.get('/api/:channel', (request, response) => {
	const channel = channels.get(request.params.channel);

	if (channel) {
		response.json(channel);
	} else {
		response.status(404).send('Not Found');
	}
});

server.post('/api/:channel', () => {
	
});
