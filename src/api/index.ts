import { createRouter } from '@agentuity/runtime';
import translate from '@agent/translate';

const api = createRouter();

// POST /api/translate - Create a translation
api.post('/translate', translate.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await translate.run(data);

	// Return translation result + thread context for UI updates
	const history = c.var.thread.state.get('history') ?? [];
	return c.json({
		...result,
		history,
		threadId: c.var.thread.id,
		translationCount: Array.isArray(history) ? history.length : 0,
	});
});

// GET /api/translate/history - Query translation history
api.get('/translate/history', async (c) => {
	const history = c.var.thread.state.get('history') ?? [];
	return c.json(history);
});

export default api;
