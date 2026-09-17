// Browser-to-OpenRouter LLM client. No DOM access: this module only ever touches
// fetch() and plain data, so it runs unmodified in a browser tab or under Node
// (used by the Node-side live-key check and the parity harness).
//
// Ported behavior, matching hidden_layer/oracle.py's openrouter_call_with_retry()
// and the HS26 notebook port's conventions (see spy-game/CLAUDE.md):
//   - one model slug for every call: MODEL
//   - reasoning effort off (Gemini's thinking tokens otherwise eat max_tokens and
//     the call comes back with an empty completion)
//   - retry on HTTP 429 and 5xx with exponential backoff: 2s, then 4s, 3 attempts
//   - anything else (401 bad key, 402 no credit, a 4xx body problem) raises
//     immediately, tagged with a `kind` the UI can turn into a plain-language
//     message
//   - response content is read None-safe: `content ?? ""`, never assumed present

export const MODEL = "google/gemini-2.5-flash";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterError extends Error {
  constructor(message, { status = null, kind = "other" } = {}) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
    this.kind = kind; // "auth" | "credit" | "rate_limit" | "server" | "network" | "other"
  }
}

function classify(status) {
  if (status === 401) return "auth";
  if (status === 402) return "credit";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "other";
}

function friendlyMessage(kind, status, bodyText) {
  if (kind === "auth") {
    return "OpenRouter rejected this API key (401). Check the key in Settings and save it again.";
  }
  if (kind === "credit") {
    return "OpenRouter says this key is out of credit (402). Add credit at openrouter.ai, or keep playing manually without a key.";
  }
  if (kind === "rate_limit") {
    return "OpenRouter is rate-limiting this key (429). Retrying automatically.";
  }
  if (kind === "server") {
    return `OpenRouter had a server error (${status}). Retrying automatically.`;
  }
  return `OpenRouter request failed (${status}): ${(bodyText || "").slice(0, 200)}`;
}

// Single, unretried call. Throws OpenRouterError on any non-2xx response or
// network failure. Returns the parsed JSON body on success.
async function chatCompletionOnce({ apiKey, messages, maxTokens, temperature = 0.3 }) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        reasoning: { effort: "none" },
      }),
    });
  } catch (e) {
    throw new OpenRouterError(`Network error reaching OpenRouter: ${e.message}`, { kind: "network" });
  }

  if (!response.ok) {
    const status = response.status;
    const kind = classify(status);
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch (_e) {
      // ignore
    }
    throw new OpenRouterError(friendlyMessage(kind, status, bodyText), { status, kind });
  }

  return response.json();
}

// Retrying wrapper: 3 attempts, exponential backoff starting at 2s, only for
// HTTP 429 and 5xx. Everything else (network errors, 401, 402, other 4xx)
// raises on the first attempt, matching hidden_layer/oracle.py.
export async function chatCompletionWithRetry(opts, { maxRetries = 3, onRetry = null } = {}) {
  let delayMs = 2000;
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chatCompletionOnce(opts);
    } catch (e) {
      lastError = e;
      const retryable = e instanceof OpenRouterError && (e.kind === "rate_limit" || e.kind === "server");
      if (!retryable || attempt === maxRetries - 1) {
        throw e;
      }
      if (onRetry) onRetry(e, attempt + 1, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  // Unreachable, but keeps control-flow analysis happy.
  throw lastError;
}

// Convenience: extract the first choice's message content, None-safe.
export function firstContent(response) {
  const choice = response && response.choices && response.choices[0];
  const content = choice && choice.message && choice.message.content;
  return content || "";
}
