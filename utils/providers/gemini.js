import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export class GeminiProvider {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(modelName, messages, options = {}) {
    const model = this.genAI.getGenerativeModel({
      model: modelName || "gemini-1.5-pro",
    });

    // Convert messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const generationConfig = {
      temperature: options.temperature ?? 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: options.maxTokens ?? 8192,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: chatMessages.slice(0, -1),
      ...(systemInstruction && { systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] } })
    });

    const lastMessage = chatMessages[chatMessages.length - 1].parts[0].text;
    const result = await chatSession.sendMessage(lastMessage);
    const response = result.response;

    return {
      text: response.text(),
      usage: {
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }
}
