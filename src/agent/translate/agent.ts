import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const client = new OpenAI();

const agent = createAgent('translate', {
	description: 'Translates text to different languages',
	schema: {
		input: s.object({
			text: s.string(),
			toLanguage: s.enum(['Spanish', 'French', 'German', 'Japanese', 'Chinese']),
		}),
		output: s.object({
			translation: s.string(),
			wordCount: s.number(),
			tokens: s.number(),
			threadId: s.string(),
			translationCount: s.number(),
		}),
	},
	handler: async (ctx, { text, toLanguage }) => {
		ctx.logger.info('Translation requested', { toLanguage, textLength: text.length });

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
		const wordCount = result.translation.split(/\s+/).filter(Boolean).length;

		// Track translation count in thread state (persists across requests)
		const count = ((ctx.thread.state.get('count') as number) ?? 0) + 1;
		ctx.thread.state.set('count', count);

		ctx.logger.info('Translation completed', { wordCount, tokens: completion.usage?.total_tokens ?? 0 });

		return {
			translation: result.translation,
			wordCount,
			tokens: completion.usage?.total_tokens ?? 0,
			threadId: ctx.thread.id,
			translationCount: count,
		};
	},
});

export default agent;
