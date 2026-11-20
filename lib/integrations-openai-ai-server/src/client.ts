import OpenAI from "openai";

const directApiKey = process.env.OPENAI_API_KEY?.trim();
const integrationApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim();
const integrationBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim();
const apiKey = directApiKey || integrationApiKey;

if (!apiKey) {
  throw new Error(
    "Configure OPENAI_API_KEY or the OpenAI AI integration before using OpenAI.",
  );
}
if (!directApiKey && !integrationBaseUrl) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL is required when using the Replit OpenAI integration.",
  );
}

export const openai = new OpenAI({
  apiKey,
  ...(directApiKey ? {} : { baseURL: integrationBaseUrl }),
});
