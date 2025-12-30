import OpenAI from 'openai';
import agent from './agent';

const client = new OpenAI();

// Re-export agent so routes can import from this file
export default agent;

/**
 * Binary Eval: Correct Language
 * Verifies that the translation is actually in the requested target language.
 */
export const correctLanguageEval = agent.createEval('correct-language', {
	description: 'Verifies the translation is in the correct target language',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] correct-language: Starting', {
			targetLanguage: input.toLanguage,
		});

		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You are a language detection expert. Determine if the given text is written in ${input.toLanguage}.

Respond in JSON format:
{
  "isCorrectLanguage": true or false,
  "reason": "brief explanation"
}`,
				},
				{
					role: 'user',
					content: output.translation,
				},
			],
		});

		const content = completion.choices[0]?.message?.content ?? '{}';
		const result = JSON.parse(content) as {
			isCorrectLanguage: boolean;
			reason: string;
		};

		ctx.logger.info('[EVAL] correct-language: Completed', {
			passed: result.isCorrectLanguage,
		});

		return {
			passed: result.isCorrectLanguage,
			metadata: { reason: result.reason },
		};
	},
});

/**
 * Score Eval: Translation Quality
 * Rates the fluency and naturalness of the translation on a 0-1 scale.
 */
export const translationQualityEval = agent.createEval('translation-quality', {
	description: 'Scores the translation fluency and naturalness (0-1)',
	handler: async (ctx, input, output) => {
		ctx.logger.info('[EVAL] translation-quality: Starting');

		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `You are a translation quality expert. Rate the fluency and naturalness of this ${input.toLanguage} translation on a scale of 0 to 1.

Consider:
- Does it read naturally to a native speaker?
- Is the grammar correct?
- Are idioms and expressions properly adapted?
- Is the meaning preserved from the original?

Respond in JSON format:
{
  "score": 0.0 to 1.0,
  "reason": "brief explanation of the score"
}`,
				},
				{
					role: 'user',
					content: `Original text: "${input.text}"

Translation to ${input.toLanguage}: "${output.translation}"`,
				},
			],
		});

		const content = completion.choices[0]?.message?.content ?? '{}';
		const result = JSON.parse(content) as {
			score: number;
			reason: string;
		};

		ctx.logger.info('[EVAL] translation-quality: Completed', {
			score: result.score,
		});

		return {
			passed: result.score >= 0.5,
			score: result.score,
			metadata: { reason: result.reason },
		};
	},
});
