import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import OpenAI from 'openai';

const client = new OpenAI();

interface TranslationHistory {
	text: string;
	toLanguage: string;
	translation: string;
	wordCount: number;
	timestamp: string;
}

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
		}),
	},
	handler: async (ctx, { text, toLanguage }) => {
		ctx.logger.info('Translation requested', {
			toLanguage,
			textLength: text.length,
			threadId: ctx.thread.id,
		});

		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You are a professional translator. Translate the given text to ${toLanguage}.

Respond in JSON format:
{
  "translation": "the translated text"
}`,
				},
				{
					role: 'user',
					content: text,
				},
			],
		});

		const content = completion.choices[0]?.message?.content ?? '{}';
		const result = JSON.parse(content) as {
			translation: string;
		};

		const wordCount = result.translation.split(/\s+/).filter(Boolean).length;

		// Store in thread history
		const history = (ctx.thread.state.get('history') as TranslationHistory[]) ?? [];
		const newEntry: TranslationHistory = {
			text: text.length > 100 ? `${text.slice(0, 100)}...` : text,
			toLanguage,
			translation: result.translation.length > 100 ? `${result.translation.slice(0, 100)}...` : result.translation,
			wordCount,
			timestamp: new Date().toISOString(),
		};

		// Keep last 10 translations
		const updatedHistory = [newEntry, ...history].slice(0, 10);
		ctx.thread.state.set('history', updatedHistory);

		ctx.logger.info('Translation completed', {
			toLanguage,
			wordCount,
			historyCount: updatedHistory.length,
		});

		return {
			translation: result.translation,
			wordCount,
		};
	},
});

export default agent;
