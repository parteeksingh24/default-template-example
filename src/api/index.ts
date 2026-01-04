/**
 * API route that exposes the translation agent.
 * The agent handles all actions (translate, history, clear) via its input schema.
 */
import { createRouter } from '@agentuity/runtime';
import translate from '@agent/translate';

const api = createRouter();

api.post('/translate', translate.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await translate.run(data);
	return c.json(result);
});

export default api;
