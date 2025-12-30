/**
 * Evals run automatically after each agent execution to assess output quality.
 * Results are logged and available in the console (they don't block responses).
 */

import OpenAI from 'openai';
import agent from './agent';

const client = new OpenAI();

export default agent;

// Binary eval: checks if translation is in the correct language
export const correctLanguageEval = agent.createEval('correct-language', {
	description: 'Verifies the translation is in the correct target language',
	handler: async (ctx, input, output) => {
		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `Is this text written in ${input.toLanguage}? Respond: { "correct": true/false, "reason": "brief explanation" }`,
				},
				{ role: 'user', content: output.translation },
			],
		});

		const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
			correct: boolean;
			reason: string;
		};

		return { passed: result.correct, metadata: { reason: result.reason } };
	},
});

// Score eval: rates translation quality from 0-1
export const translationQualityEval = agent.createEval('translation-quality', {
	description: 'Scores translation fluency and naturalness (0-1)',
	handler: async (ctx, input, output) => {
		const completion = await client.chat.completions.create({
			model: 'gpt-5-nano',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: `Rate this ${input.toLanguage} translation's fluency (0-1). Consider grammar, naturalness, and meaning preservation. Respond: { "score": 0.0-1.0, "reason": "brief explanation" }`,
				},
				{ role: 'user', content: `Original: "${input.text}"\n\nTranslation: "${output.translation}"` },
			],
		});

		const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
			score: number;
			reason: string;
		};

		return { passed: result.score >= 0.5, score: result.score, metadata: { reason: result.reason } };
	},
});
