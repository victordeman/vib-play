import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from './gemini';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the @google/generative-ai module
vi.mock("@google/generative-ai", () => {
  const sendMessageMock = vi.fn().mockResolvedValue({
    response: {
      text: () => "Mocked Response",
      usageMetadata: { totalTokenCount: 100 }
    }
  });

  const startChatMock = vi.fn().mockReturnValue({
    sendMessage: sendMessageMock
  });

  const getGenerativeModelMock = vi.fn().mockReturnValue({
    startChat: startChatMock
  });

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function() {
      return {
        getGenerativeModel: getGenerativeModelMock
      };
    }),
    HarmCategory: {},
    HarmBlockThreshold: {}
  };
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider(apiKey);
  });

  it('should be initialized with the provided API key', () => {
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(apiKey);
  });

  it('should generate a response correctly', async () => {
    const messages = [
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'Hello' }
    ];
    const options = { temperature: 0.5, maxTokens: 1000 };

    const result = await provider.generateResponse('gemini-1.5-pro', messages, options);

    expect(result).toEqual({
      text: 'Mocked Response',
      toolCalls: [],
      usage: { total_tokens: 100 }
    });
  });

  it('should handle messages without a system instruction', async () => {
    const messages = [
      { role: 'user', content: 'Hello' }
    ];

    const result = await provider.generateResponse('gemini-1.5-pro', messages);

    expect(result.text).toBe('Mocked Response');
  });
});
