/**
 * Translation Agent: translates text using AI models via the Agentuity AI Gateway.
 * Stores translation history in thread state for persistence across requests.
 */
import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import OpenAI from 'openai';

/**
 * AI Gateway: Routes requests to OpenAI, Anthropic, and other LLM providers.
 * One SDK key, unified observability and billing; no separate API keys needed.
 */
const client = new OpenAI();

const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;
const MODELS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'] as const;

// History entry stored in thread state
export const HistoryEntrySchema = z.object({
	text: z.string(),
	toLanguage: z.string(),
	translation: z.string(),
	sessionId: z.string(),
	timestamp: z.string(),
	model: z.string(),
	tokens: z.number(),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const AgentInput = z.object({
	text: z.string(),
	toLanguage: z.enum(LANGUAGES).optional(),
	model: z.enum(MODELS).optional(),
});
export type AgentInputType = z.infer<typeof AgentInput>;

export const AgentOutput = z.object({
	translation: z.string(),
	threadId: z.string(),
	sessionId: z.string(),
	translationCount: z.number(),
	tokens: z.number(),
	history: z.array(HistoryEntrySchema),
});
export type AgentOutputType = z.infer<typeof AgentOutput>;

// Agent definition with automatic schema validation
const agent = createAgent('translate', {
	description: 'Translates text to different languages',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, { text, toLanguage = 'Spanish', model = 'gpt-5-nano' }) => {
		// Agentuity logger: structured logs visible in terminal and Agentuity console
		ctx.logger.info('──── Translation ────');
		ctx.logger.info({ toLanguage, model, textLength: text.length });
		ctx.logger.info('Request IDs', { threadId: ctx.thread.id, sessionId: ctx.sessionId });

		const prompt = `Translate to ${toLanguage}:\n\n${text}`;

		// Call OpenAI via AI Gateway (automatically routed and tracked)
		const completion = await client.chat.completions.create({
			model,
			messages: [{ role: 'user', content: prompt }],
		});

		const translation = completion.choices[0]?.message?.content ?? '';
		// Token usage from the response (also available via x-agentuity-tokens header)
		const tokens = completion.usage?.total_tokens ?? 0;

		// Add translation to history
		const truncate = (str: string, len: number) => (str.length > len ? `${str.slice(0, len)}...` : str);
		const newEntry: HistoryEntry = {
			text: truncate(text, 50),
			toLanguage,
			translation: truncate(translation, 50),
			sessionId: ctx.sessionId,
			timestamp: new Date().toISOString(),
			model,
			tokens,
		};

		// Append to history (sliding window, keeps last 5 entries)
		await ctx.thread.state.push('history', newEntry, 5);
		const history = (await ctx.thread.state.get<HistoryEntry[]>('history')) ?? [];

		ctx.logger.info('Translation complete', { tokens, historyCount: history.length });

		return {
			translation,
			threadId: ctx.thread.id,
			sessionId: ctx.sessionId,
			translationCount: history.length,
			tokens,
			history,
		};
	},
});

export default agent;
