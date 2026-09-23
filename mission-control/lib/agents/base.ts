/**
 * Agent Adapter — unified interface for all AI providers.
 * Each provider (Claude, OpenAI/Hermes, Gemini, OpenClaw) implements this.
 */
import type { AgentConfig, ChatMessage } from '@/types';
import { getMemory, saveMemoryEntry, addTeamLog } from '@/lib/db';

// ── Base Interface ─────────────────────────────────────────────────────────────

export interface AgentChatOptions {
  messages: ChatMessage[];
  agent: AgentConfig;
  stream?: boolean;
  injectMemory?: boolean;
}

export interface AgentAdapter {
  chat(options: AgentChatOptions): Promise<string>;
  stream(options: AgentChatOptions): AsyncGenerator<string>;
  ping(): Promise<boolean>;
}

// ── Memory Injection Helper ────────────────────────────────────────────────────

export function buildSystemPromptWithMemory(agent: AgentConfig, basePrompt: string): string {
  const memories = getMemory().filter(m =>
    m.sharedWith.includes('*') || m.sharedWith.includes(agent.id)
  );

  if (memories.length === 0) return basePrompt;

  const memoryBlock = memories
    .slice(-50) // last 50 memories to avoid context overflow
    .map(m => `[${m.type.toUpperCase()}] ${m.key}: ${m.value}`)
    .join('\n');

  return `${basePrompt}

━━━ SHARED KNOWLEDGE BASE ━━━
The following facts and context have been learned by the agent team. Use this to stay in sync:

${memoryBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always consider this shared context when responding.`;
}

// ── Memory Writer Helper ───────────────────────────────────────────────────────

export async function extractAndSaveMemory(
  agentId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  // Simple heuristic: if response contains "I've noted that", "Key insight:", or "[MEMORY]"
  // extract and save. For production, call an LLM to extract entities.
  const memoryMarkers = ['[MEMORY]', 'KEY INSIGHT:', 'IMPORTANT FACT:'];
  for (const marker of memoryMarkers) {
    if (assistantResponse.includes(marker)) {
      const parts = assistantResponse.split(marker);
      for (let i = 1; i < parts.length; i++) {
        const content = parts[i].split('\n')[0].trim();
        if (content.length > 10) {
          saveMemoryEntry({
            key: `${agentId}:${Date.now()}`,
            value: content,
            sourceAgent: agentId,
            type: 'insight',
            tags: ['auto-extracted'],
            sharedWith: ['*'],
          });
          addTeamLog(agentId, `📝 Memory saved: "${content.slice(0, 60)}…"`, 'info');
        }
      }
    }
  }
}

// ── Claude Adapter ────────────────────────────────────────────────────────────

export async function claudeChat(options: AgentChatOptions): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env[options.agent.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing env var: ${options.agent.apiKeyEnv}`);

  const client = new Anthropic({ apiKey });
  const systemPrompt = options.injectMemory
    ? buildSystemPromptWithMemory(options.agent, options.agent.systemPrompt)
    : options.agent.systemPrompt;

  const msgs = options.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const response = await client.messages.create({
    model: options.agent.model,
    max_tokens: options.agent.maxTokens,
    system: systemPrompt,
    messages: msgs,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  await extractAndSaveMemory(options.agent.id, msgs[msgs.length - 1]?.content ?? '', text);
  return text;
}

export async function* claudeStream(options: AgentChatOptions): AsyncGenerator<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env[options.agent.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing env var: ${options.agent.apiKeyEnv}`);

  const client = new Anthropic({ apiKey });
  const systemPrompt = options.injectMemory
    ? buildSystemPromptWithMemory(options.agent, options.agent.systemPrompt)
    : options.agent.systemPrompt;

  const msgs = options.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const stream = client.messages.stream({
    model: options.agent.model,
    max_tokens: options.agent.maxTokens,
    system: systemPrompt,
    messages: msgs,
  });

  let fullText = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
      yield event.delta.text;
    }
  }
  await extractAndSaveMemory(options.agent.id, msgs[msgs.length - 1]?.content ?? '', fullText);
}

// ── OpenAI / Hermes / OpenClaw Adapter ────────────────────────────────────────

export async function openaiChat(options: AgentChatOptions): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env[options.agent.apiKeyEnv] ?? 'ollama';
  const baseURL = options.agent.baseUrl;

  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const systemPrompt = options.injectMemory
    ? buildSystemPromptWithMemory(options.agent, options.agent.systemPrompt)
    : options.agent.systemPrompt;

  const msgs = [
    { role: 'system' as const, content: systemPrompt },
    ...options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: options.agent.model,
    messages: msgs,
    temperature: options.agent.temperature,
    max_tokens: options.agent.maxTokens,
  });

  const text = response.choices[0]?.message?.content ?? '';
  await extractAndSaveMemory(options.agent.id, msgs[msgs.length - 1]?.content ?? '', text);
  return text;
}

export async function* openaiStream(options: AgentChatOptions): AsyncGenerator<string> {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env[options.agent.apiKeyEnv] ?? 'ollama';
  const baseURL = options.agent.baseUrl;

  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const systemPrompt = options.injectMemory
    ? buildSystemPromptWithMemory(options.agent, options.agent.systemPrompt)
    : options.agent.systemPrompt;

  const msgs = [
    { role: 'system' as const, content: systemPrompt },
    ...options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  let fullText = '';
  const stream = await client.chat.completions.create({
    model: options.agent.model,
    messages: msgs,
    temperature: options.agent.temperature,
    max_tokens: options.agent.maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullText += delta;
      yield delta;
    }
  }
  await extractAndSaveMemory(options.agent.id, msgs[msgs.length - 1]?.content ?? '', fullText);
}

// ── Gemini Adapter ────────────────────────────────────────────────────────────

export async function geminiChat(options: AgentChatOptions): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env[options.agent.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing env var: ${options.agent.apiKeyEnv}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: options.agent.model });
  const systemPrompt = options.injectMemory
    ? buildSystemPromptWithMemory(options.agent, options.agent.systemPrompt)
    : options.agent.systemPrompt;

  const history = options.messages
    .filter(m => m.role !== 'system' && m !== options.messages[options.messages.length - 1])
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt,
  });

  const lastMsg = options.messages[options.messages.length - 1];
  const result = await chat.sendMessage(lastMsg?.content ?? '');
  const text = result.response.text();
  await extractAndSaveMemory(options.agent.id, lastMsg?.content ?? '', text);
  return text;
}

// ── Unified Dispatcher ────────────────────────────────────────────────────────

export async function dispatchChat(options: AgentChatOptions): Promise<string> {
  switch (options.agent.provider) {
    case 'claude':   return claudeChat(options);
    case 'openai':   return openaiChat(options);
    case 'hermes':   return openaiChat(options);
    case 'openclaw': return openaiChat(options);
    case 'gemini':   return geminiChat(options);
    default:         throw new Error(`Unknown provider: ${options.agent.provider}`);
  }
}

export async function* dispatchStream(options: AgentChatOptions): AsyncGenerator<string> {
  switch (options.agent.provider) {
    case 'claude':
      yield* claudeStream(options);
      break;
    case 'openai':
    case 'hermes':
    case 'openclaw':
      yield* openaiStream(options);
      break;
    case 'gemini':
      // Gemini doesn't have clean streaming in the JS SDK — fall back to single response
      const text = await geminiChat(options);
      yield text;
      break;
    default:
      throw new Error(`Unknown provider: ${options.agent.provider}`);
  }
}

// ── Ping / Health Check ───────────────────────────────────────────────────────

export async function pingAgent(agent: AgentConfig): Promise<boolean> {
  try {
    await dispatchChat({
      agent,
      injectMemory: false,
      messages: [{ id: 'ping', role: 'user', content: 'Reply with: PONG', agentId: agent.id, timestamp: new Date().toISOString() }],
    });
    return true;
  } catch {
    return false;
  }
}
