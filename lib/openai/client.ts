import OpenAI from 'openai';

let instance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!instance) {
    instance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return instance;
}

// Lazily instantiate so the SDK is only constructed at request time (when the
// API key is present) rather than at module load / build time.
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  }
});
