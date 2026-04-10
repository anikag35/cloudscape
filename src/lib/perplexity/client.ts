/**
 * Perplexity Agent API client.
 *
 * Uses the OpenAI-compatible chat/completions endpoint with Sonar Reasoning Pro.
 * web_search_options is enabled so the model can search the live web during
 * reasoning — critical for checking AWS outage pages and known issues.
 */

const PERPLEXITY_BASE = "https://api.perplexity.ai";

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityRequestOptions {
  model?: string;
  messages: PerplexityMessage[];
  /** Controls how much web context Perplexity retrieves per search. */
  searchContextSize?: "low" | "medium" | "high";
  temperature?: number;
  maxTokens?: number;
}

interface PerplexityResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
}

export async function queryPerplexity(
  options: PerplexityRequestOptions
): Promise<{ content: string; citations: string[] }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  const res = await fetch(`${PERPLEXITY_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // sonar-reasoning-pro: best for multi-step analysis with web search
      model: options.model ?? "sonar-reasoning-pro",
      messages: options.messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
      web_search_options: {
        search_context_size: options.searchContextSize ?? "high",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${err}`);
  }

  const data: PerplexityResponse = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const citations = data.citations ?? [];

  return { content, citations };
}

/**
 * Helper to parse JSON from Perplexity's response.
 * The model sometimes wraps JSON in markdown code fences.
 */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned);
}
