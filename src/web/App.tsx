import { type ChangeEvent, useCallback, useState } from 'react';
import { useAPI } from '@agentuity/react';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;

const DEFAULT_TEXT =
	'Welcome to Agentuity! This translation agent shows what you can build with the platform. It connects to AI models through our gateway, tracks usage with thread state, and runs quality checks automatically. Try translating this text into different languages to see the agent in action.';

const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese'] as const;

export function App() {
	const [text, setText] = useState(DEFAULT_TEXT);
	const [toLanguage, setToLanguage] = useState<(typeof LANGUAGES)[number]>('Spanish');

	// useAPI hook handles loading state and response typing automatically
	const { data: result, invoke, isLoading: translating } = useAPI('POST /api/translate');

	const handleTranslate = useCallback(async () => {
		await invoke({ text, toLanguage });
	}, [text, toLanguage, invoke]);

	return (
		<div className="app-container">
			<div className="content-wrapper">
				<div className="header">
					<svg
						aria-hidden="true"
						aria-label="Agentuity Logo"
						className="logo"
						fill="none"
						height="191"
						viewBox="0 0 220 191"
						width="220"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							clipRule="evenodd"
							d="M220 191H0L31.427 136.5H0L8 122.5H180.5L220 191ZM47.5879 136.5L24.2339 177H195.766L172.412 136.5H47.5879Z"
							fill="#00FFFF"
							fillRule="evenodd"
						/>
						<path
							clipRule="evenodd"
							d="M110 0L157.448 82.5H189L197 96.5H54.5L110 0ZM78.7021 82.5L110 28.0811L141.298 82.5H78.7021Z"
							fill="#00FFFF"
							fillRule="evenodd"
						/>
					</svg>

					<h1 className="title">Translation Agent</h1>

					<p className="subtitle">
						Powered by <span className="italic">Agentuity</span>
					</p>
				</div>

				<div className="card card-interactive">
					<div className="controls-row">
						<span className="control-label">
							Translate to{' '}
							<select
								className="inline-select"
								disabled={translating}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									setToLanguage(e.currentTarget.value as (typeof LANGUAGES)[number])
								}
								value={toLanguage}
							>
								{LANGUAGES.map((lang) => (
									<option key={lang} value={lang}>
										{lang}
									</option>
								))}
							</select>
						</span>

						<div className="glow-btn">
							<div className="glow-bg" />
							<div className="glow-effect" />
							<button
								className={`button ${translating ? 'disabled' : ''}`}
								disabled={translating}
								onClick={handleTranslate}
								type="button"
							>
								{translating ? 'Translating...' : 'Translate'}
							</button>
						</div>
					</div>

					<textarea
						className="textarea"
						disabled={translating}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.currentTarget.value)}
						placeholder="Enter text to translate..."
						rows={4}
						value={text}
					/>

					{result?.translation ? (
						<div className="result">
							<div className={`translation-output ${translating ? 'loading' : ''}`}>
								{result.translation}
							</div>
							<div className="result-meta">
								{result.threadId && (
									<span>
										Thread: <strong>{result.threadId.slice(0, 12)}...</strong>
									</span>
								)}
								{result.translationCount > 0 && (
									<>
										<span className="separator">|</span>
										<span>
											Translations: <strong>{result.translationCount}</strong>
										</span>
									</>
								)}
							</div>
						</div>
					) : (
						<div className="output">
							{translating ? (
								<span className="loading-text">Translating to {toLanguage}...</span>
							) : (
								'Translation will appear here'
							)}
						</div>
					)}
				</div>

				<div className="card">
					<h3 className="section-title">Features Demonstrated</h3>

					<div className="steps-list">
						{[
							{
								key: 'schemas',
								title: 'Typed Schemas',
								text: (
									<>
										Input uses <code>s.string()</code> and <code>s.enum()</code> for type-safe
										validation.
									</>
								),
							},
							{
								key: 'useapi',
								title: 'useAPI Hook',
								text: (
									<>
										Frontend uses <code>useAPI()</code> for typed API calls with automatic loading
										state.
									</>
								),
							},
							{
								key: 'evals',
								title: 'Automatic Evaluations',
								text: (
									<>
										Two evals run in background: <code>correct-language</code> (binary) and{' '}
										<code>translation-quality</code> (score).
									</>
								),
							},
							{
								key: 'threads',
								title: 'Thread State',
								text: <>Translation count persists across requests using thread state.</>,
							},
							WORKBENCH_PATH
								? {
										key: 'workbench',
										title: (
											<>
												Try{' '}
												<a href={WORKBENCH_PATH} className="workbench-link">
													Workbench
												</a>
											</>
										),
										text: <>Test the translate agent directly in the dev UI.</>,
									}
								: null,
						]
							.filter(Boolean)
							.map((step) => (
								<div key={step!.key} className="step">
									<div className="step-icon">
										<svg
											aria-hidden="true"
											className="checkmark"
											fill="none"
											height="24"
											stroke="#00c951"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											viewBox="0 0 24 24"
											width="24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M20 6 9 17l-5-5"></path>
										</svg>
									</div>

									<div>
										<h4 className="step-title">{step!.title}</h4>
										<p className="step-text">{step!.text}</p>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>

			<style>
				{`
					body {
						background-color: #09090b;
					}

					.app-container {
						background-color: #09090b;
						color: #fff;
						display: flex;
						font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
						justify-content: center;
						min-height: 100vh;
					}

					.content-wrapper {
						display: flex;
						flex-direction: column;
						gap: 2rem;
						max-width: 48rem;
						padding: 4rem;
						width: 100%;
					}

					.header {
						align-items: center;
						display: flex;
						flex-direction: column;
						gap: 0.5rem;
						justify-content: center;
						margin-bottom: 2rem;
						position: relative;
						text-align: center;
					}

					.workbench-link {
						background: linear-gradient(90deg, #155e75, #3b82f6, #9333ea, #155e75);
						background-size: 300% 100%;
						background-clip: text;
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						color: transparent;
						text-decoration: none;
						animation: gradientShift 2s ease-in-out infinite alternate;
						position: relative;
					}

					.workbench-link::after {
						content: '';
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						height: 1px;
						background: linear-gradient(90deg, #155e75, #3b82f6, #9333ea, #155e75);
						background-size: 300% 100%;
						animation: gradientShift 2s ease-in-out infinite alternate;
						opacity: 0;
						transition: opacity 0.3s ease;
					}

					.workbench-link:hover::after {
						opacity: 1;
					}

					@keyframes gradientShift {
						0% {
							background-position: 0% 50%;
						}
						100% {
							background-position: 100% 50%;
						}
					}

					.logo {
						height: auto;
						margin-bottom: 1rem;
						width: 3rem;
					}

					.title {
						font-size: 3rem;
						font-weight: 100;
						margin: 0;
					}

					.subtitle {
						color: #a1a1aa;
						font-size: 1.15rem;
						margin: 0;
					}

					.italic {
						font-family: Georgia, "Times New Roman", Times, serif;
						font-style: italic;
						font-weight: 100;
					}

					.card {
						background: #000;
						border: 1px solid #18181b;
						border-radius: 0.5rem;
						padding: 2rem;
					}

					.card-interactive {
						box-shadow: 0 1.5rem 3rem -0.75rem #00000040;
						display: flex;
						flex-direction: column;
						gap: 1.5rem;
						overflow: hidden;
					}

					.card-title {
						color: #a1a1aa;
						font-size: 1.25rem;
						font-weight: 400;
						line-height: 1.5;
						margin: 0;
					}

					.inline-select {
						appearance: none;
						background: transparent;
						border: none;
						border-bottom: 1px dashed #3f3f46;
						color: #fff;
						cursor: pointer;
						font-size: inherit;
						font-weight: 400;
						outline: none;
						padding: 0 1.25rem 0.125rem 0;
						background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
						background-repeat: no-repeat;
						background-position: right 0 center;
					}

					.inline-select:hover {
						border-bottom-color: #22d3ee;
					}

					.inline-select:focus {
						border-bottom-color: #22d3ee;
						border-bottom-style: solid;
					}

					.inline-select option {
						background: #09090b;
						color: #fff;
					}

					.highlight {
						color: #fff;
					}

					.controls-row {
						align-items: center;
						display: flex;
						gap: 2.5rem;
					}

					.control-label {
						color: #a1a1aa;
						font-size: 1rem;
					}

					.textarea {
						background: #09090b;
						border: 1px solid #2b2b30;
						border-radius: 0.375rem;
						color: #fff;
						font-family: inherit;
						font-size: 0.95rem;
						line-height: 1.6;
						outline: none;
						padding: 0.75rem 1rem;
						resize: vertical;
						min-height: 100px;
					}

					.textarea:focus {
						border-color: #3b82f6;
					}

					.glow-btn {
						position: relative;
						z-index: 1;
						align-self: flex-start;
					}

					.glow-bg {
						background: linear-gradient(to right, #155e75, #3b82f6, #9333ea);
						border-radius: 0.5rem;
						inset: 0;
						position: absolute;
						filter: blur(1.25rem);
						opacity: 0.75;
						transition: all 700ms;
					}

					.glow-btn:hover .glow-bg {
						filter: blur(2rem);
						opacity: 1;
					}

					.glow-effect {
						background: #0891b280;
						border-radius: 0.5rem;
						filter: blur(2.5rem);
						inset: 0;
						opacity: 0.5;
						position: absolute;
					}

					.button {
						background-color: #030712;
						border: none;
						border-radius: 0.5rem;
						color: #fff;
						cursor: pointer;
						padding: 0.75rem 1.5rem;
						position: relative;
						transition: opacity 0.2s;
						white-space: nowrap;
					}

					.button.disabled {
						cursor: not-allowed;
						opacity: 0.5;
					}

					.result {
						display: flex;
						flex-direction: column;
						gap: 0.75rem;
					}

					.translation-output {
						background: #09090b;
						border: 1px solid #2b2b30;
						border-radius: 0.375rem;
						color: #22d3ee;
						font-size: 0.95rem;
						line-height: 1.6;
						padding: 0.75rem 1rem;
					}

					.result-meta {
						color: #71717a;
						display: flex;
						flex-wrap: wrap;
						font-size: 0.75rem;
						gap: 0.5rem;
					}

					.result-meta strong {
						color: #a1a1aa;
					}

					.separator {
						color: #3f3f46;
					}

					.output {
						background: #09090b;
						border: 1px solid #2b2b30;
						border-radius: 0.375rem;
						color: #52525b;
						font-size: 0.95rem;
						line-height: 1.6;
						min-height: 3rem;
						padding: 0.75rem 1rem;
					}

					.loading-text {
						color: #22d3ee;
					}

					.translation-output.loading {
						opacity: 0.5;
					}

					.section-title {
						color: #fff;
						font-size: 1.25rem;
						font-weight: 400;
						line-height: 1;
						margin: 0 0 1.5rem 0;
					}

					.steps-list {
						display: flex;
						flex-direction: column;
						gap: 1.5rem;
					}

					.step {
						align-items: flex-start;
						display: flex;
						gap: 0.75rem;
					}

					.step-icon {
						align-items: center;
						background-color: #002810;
						border: 1px solid #00c951;
						border-radius: 0.25rem;
						display: flex;
						height: 1rem;
						justify-content: center;
						width: 1rem;
					}

					.checkmark {
						height: 0.65rem;
						width: 0.65rem;
					}

					.step-title {
						color: #fff;
						font-size: 0.875rem;
						font-weight: 400;
						margin: 0 0 0.25rem 0;
					}

					.step-text {
						color: #a1a1aa;
						font-size: 0.75rem;
						margin: 0;
					}

					.step-text code {
						color: #fff;
					}

					@keyframes ellipsis {
						0% { content: ""; }
						25% { content: "."; }
						50% { content: ".."; }
						75% { content: "..."; }
						100% { content: ""; }
					}

					[data-loading="true"]::after {
						animation: ellipsis 1.2s steps(1, end) infinite;
						content: ".";
						display: inline-block;
						width: 1em;
					}
				`}
			</style>
		</div>
	);
}
