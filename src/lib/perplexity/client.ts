/**
 * Perplexity Agent API client.
 *
 * Uses the OpenAI-compatible chat/completions endpoint with Sonar Reasoning Pro.
 * web_search_options is enabled so the model can search the live web during
 * reasoning — critical for checking AWS outage pages and known issues.
 */

const PERPLEXITY_BASE = "https://api.perplexity.ai";
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${PERPLEXITY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? "sonar-reasoning-pro",
        messages: options.messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 4096,
        web_search_options: {
          search_context_size: options.searchContextSize ?? "high",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 429) throw new Error("Perplexity API rate limited — try again shortly");
      if (status >= 500) throw new Error(`Perplexity API server error (${status})`);
      throw new Error(`Perplexity API error (${status})`);
    }

    const data: PerplexityResponse = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const citations = data.citations ?? [];

    return { content, citations };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Helper to parse JSON from Perplexity's response.
 * The model sometimes wraps JSON in markdown code fences.
 * Wrapped in try-catch to provide clear error messages.
 */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object or array from the response
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to error
      }
    }
    throw new Error(
      `Failed to parse AI response as JSON. Raw response starts with: "${cleaned.slice(0, 100)}..."`
    );
  }
}
