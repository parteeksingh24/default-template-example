/**
 * Translation Agent - demonstrates AI Gateway, thread state, and structured logging.
 * Schema defines the input/output contract; TypeScript types are inferred automatically.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

// AI Gateway: requests route through Agentuity's gateway, which handles auth and observability
const client = new OpenAI();

const agent = createAgent('translate', {
	description: 'Translates text to different languages',
	schema: {
		input: s.object({
			text: s.string(),
			toLanguage: s.enum(['Spanish', 'French', 'German', 'Chinese']),
		}),
		output: s.object({
			translation: s.string(),
			threadId: s.string(),
			translationCount: s.number(),
		}),
	},
	handler: async (ctx, { text, toLanguage }) => {
		ctx.logger.info('Translation requested', { toLanguage, textLength: text.length });

		// Thread state persists across requests - useful for tracking session-level data
		const count = ((ctx.thread.state.get('count') as number) ?? 0) + 1;
		ctx.thread.state.set('count', count);

		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You are a professional translator. Translate the given text to ${toLanguage}. Respond in JSON: { "translation": "translated text" }`,
				},
				{ role: 'user', content: text },
			],
		});

		const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as { translation: string };

		ctx.logger.info('Translation completed', { tokens: completion.usage?.total_tokens });

		return {
			translation: result.translation,
			threadId: ctx.thread.id,
			translationCount: count,
		};
	},
});

export default agent;
