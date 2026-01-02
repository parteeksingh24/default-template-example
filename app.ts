import { createApp } from '@agentuity/runtime';

const { server, logger } = await createApp({
	setup: async () => {
		// Initialize shared resources here (database connections, API clients, etc.)
		// Whatever you return becomes available as ctx.app in all agents and routes
	},
	shutdown: async (_state) => {
		// Clean up resources when the server stops
		// The state parameter is whatever you returned from setup
	},
});

logger.debug('Running %s', server.url);
