export interface EngineAnswer {
  answer: string;
  citations: string[];
  webSearchUsed: boolean;
}

/** An AI answer-engine we probe to see whether a brand gets surfaced/cited. */
export interface AnswerEngine {
  id: string;
  label: string;
  /** True when the engine has the credentials it needs to run. */
  available(): boolean;
  ask(prompt: string): Promise<EngineAnswer>;
}
