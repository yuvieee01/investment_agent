import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, AIMessageChunk } from "@langchain/core/messages";

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a Gemini LLM instance.
 */
function createGeminiLLM(apiKey?: string) {
  const key = apiKey || process.env.GOOGLE_API_KEY;
  if (!key) return null;

  return new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: key,
    temperature: 0.3,
    maxOutputTokens: 8192,
  });
}

/**
 * Creates a Groq LLM instance (fallback).
 * Uses llama-3.1-8b-instant — fast and capable.
 */
function createGroqLLM(apiKey?: string) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) return null;

  return new ChatGroq({
    model: "llama-3.1-8b-instant",
    apiKey: key,
    temperature: 0.3,
    maxTokens: 8192,
  });
}

/**
 * Wraps an LLM with exponential backoff for rate limits.
 */
function withExponentialBackoff(llm: any, providerName: string) {
  return {
    async invoke(
      messages: BaseMessage[] | { role: string; content: string }[]
    ): Promise<AIMessageChunk> {
      const maxRetries = 4;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await llm.invoke(messages);
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const errorMsg = lastError.message;

          if (
            errorMsg.includes("429") ||
            errorMsg.includes("quota") ||
            errorMsg.includes("rate limit") ||
            errorMsg.includes("Too Many Requests")
          ) {
            const baseDelay = 10000 * Math.pow(2, attempt); // 10s, 20s, 40s, 80s
            const jitter = Math.random() * 2000;
            const delay = baseDelay + jitter;

            console.log(
              `[LLM - ${providerName}] Rate limited (attempt ${
                attempt + 1
              }/${maxRetries}). Retrying in ${Math.round(delay / 1000)}s...`
            );
            await sleep(delay);
          } else {
            // Not a rate limit error, throw immediately
            throw lastError;
          }
        }
      }

      throw (
        lastError ||
        new Error(`[LLM - ${providerName}] Failed after ${maxRetries} retries.`)
      );
    }
  };
}

/**
 * Rate-limit-aware LLM wrapper with exponential backoff and Groq fallback.
 */
export function createLLM(apiKey?: string) {
  const gemini = createGeminiLLM(apiKey);
  const groq = createGroqLLM();

  if (!gemini && !groq) {
    throw new Error(
      "No LLM API key found. Set GOOGLE_API_KEY or GROQ_API_KEY in .env.local"
    );
  }

  const geminiWithBackoff = gemini
    ? withExponentialBackoff(gemini, "Gemini")
    : null;
  const groqWithBackoff = groq ? withExponentialBackoff(groq, "Groq") : null;

  return {
    async invoke(
      messages: BaseMessage[] | { role: string; content: string }[]
    ): Promise<AIMessageChunk> {
      // Try Gemini first
      if (geminiWithBackoff) {
        try {
          return await geminiWithBackoff.invoke(messages);
        } catch (error: unknown) {
          console.log(
            `[LLM] Gemini failed after retries: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          if (!groqWithBackoff) throw error; // No fallback available
          console.log("[LLM] Switching to Groq fallback...");
        }
      }

      // Try Groq fallback
      if (groqWithBackoff) {
        return await groqWithBackoff.invoke(messages);
      }

      throw new Error("No LLM available");
    }
  };
}

/**
 * Default LLM instance using env keys
 */
export const defaultLLM = createLLM();
