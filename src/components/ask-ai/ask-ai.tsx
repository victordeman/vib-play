import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import TerminalOutput from './terminal-output';

// Icons (you can replace these with your preferred icon library)
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NewChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const PreviewIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const AgentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Interfaces
interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  providerUsed?: string;
}

interface ModelParameters {
  provider: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
  baseUrl?: string;
}

interface AskAIProps {
  agentTurnLimit?: number;
  html: string;
  setHtml: (html: string) => void;
  onScrollToBottom: () => void;
  isAiWorking: boolean;
  setIsAiWorking: (working: boolean) => void;
  setView: (view: "editor" | "preview") => void;
  selectedTemplateId?: string;
  modelParams?: ModelParameters;
}

// Provider options
const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-3.5 models' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Multiple models via OpenRouter' },
  { value: 'xai', label: 'XAI (Grok)', description: 'Grok models with real-time data' },
  { value: 'groq', label: 'Groq', description: 'Ultra-fast inference' },
  { value: 'perplexity', label: 'Perplexity', description: 'Web-connected AI' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude models' },
  { value: 'cohere', label: 'Cohere', description: 'Enterprise language models' },
  { value: 'gemini', label: 'Google Gemini', description: 'Gemini Pro/Flash models' }
];

const STACK_OPTIONS = [
  { value: 'Next.js (fullstack)', label: 'Next.js (Fullstack)' },
  { value: 'React + Express', label: 'React + Express' },
  { value: 'React + Flask (Python)', label: 'React + Flask (Python)' },
  { value: 'SvelteKit', label: 'SvelteKit' },
  { value: 'Vue + Node.js', label: 'Vue + Node.js' }
];

const AskAI: React.FC<AskAIProps> = ({
  agentTurnLimit = 5,
  html,
  setHtml,
  onScrollToBottom,
  isAiWorking,
  setIsAiWorking,
  setView,
  selectedTemplateId,
  modelParams
}) => {
  // State management
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState(modelParams?.provider || 'openai');
  const [selectedStack, setSelectedStack] = useState('React + Express');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<{
    command: string;
    stdout: string;
    stderr?: string;
    exitCode?: number;
    timestamp: number;
  }[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [agentTurns, setAgentTurns] = useState(0);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize session and load history
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    const savedSessionId = localStorage.getItem('sessionId');
    
    if (savedHistory && savedSessionId) {
      try {
        const parsedHistory: ChatMessage[] = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
        setSessionId(savedSessionId);
      } catch (error) {
        console.error('Failed to parse chat history:', error);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
      }
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [chatHistory, sessionId]);

  // Check available providers
  useEffect(() => {
    const checkProviders = async () => {
      try {
        const response = await fetch('/api/check-env');
        if (response.ok) {
          const data = await response.json();
          const configured = Object.entries(data.env || {})
            .filter(([, config]: [string, any]) => config.apiKeyConfigured)
            .map(([provider]) => provider);
          
          setAvailableProviders(configured);
          
          // Set default provider to first available if current selection isn't available
          if (configured.length > 0 && !configured.includes(selectedProvider)) {
            setSelectedProvider(configured[0]);
          }
        }
      } catch (error) {
        console.error('Failed to check providers:', error);
      }
    };

    checkProviders();
  }, [selectedProvider]);

  // Progress bar animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    if (isAiWorking) {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          if (prevProgress < 90) {
            return prevProgress + Math.random() * 10;
          }
          return prevProgress;
        });
      }, 500);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isAiWorking]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatHistory, showHistory, scrollToBottom]);

  // Execute agent command
  const executeCommand = async (command: string) => {
    setTerminalOutput(prev => [...prev, {
      command,
      stdout: "Executing...",
      timestamp: Date.now()
    }]);
    setShowTerminal(true);

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sessionId })
      });
      const data = await response.json();
      
      setTerminalOutput(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          command,
          stdout: data.output,
          stderr: data.error,
          exitCode: data.exitCode,
          timestamp: Date.now()
        };
        return updated;
      });

      return data;
    } catch (error) {
      console.error("Command execution failed:", error);
      toast.error("Agent failed to execute command");
    }
  };

  // Main AI call function
  const callAi = async (isAgentRecursive = false) => {
    if (isAiWorking || !prompt.trim() || !sessionId) return;

    if (!isAgentRecursive) {
      setAgentTurns(0);
    } else if (agentTurns >= agentTurnLimit) {
      toast.warn(`Agent reached turn limit (${agentTurnLimit}). Stopping loop.`);
      return;
    }

    setIsAiWorking(true);
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: uuidv4(),
      session_id: sessionId,
      role: 'user',
      content: prompt.trim(),
      timestamp: Date.now()
    };

    // Optimistically add user message
    setChatHistory(prev => [...prev, userMessage]);
    const currentPrompt = prompt.trim();
    setPrompt("");

    try {
      const requestBody = {
        prompt: currentPrompt,
        provider: selectedProvider,
        sessionId: sessionId,
        stack: selectedStack,
        ...(isAgentMode && selectedProvider === 'gemini' && {
          tools: [{
            function_declarations: [{
              name: "execute_command",
              description: "Execute a shell command in a sandboxed environment",
              parameters: {
                type: "object",
                properties: {
                  command: { type: "string", description: "The command to execute" }
                },
                required: ["command"]
              }
            }]
          }]
        }),
        ...(selectedTemplateId && { templateId: selectedTemplateId }),
        ...(modelParams?.model && { model: modelParams.model }),
        ...(modelParams?.maxTokens && { maxTokens: modelParams.maxTokens }),
        ...(modelParams?.temperature !== undefined && { temperature: modelParams.temperature })
      };

      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.message || 'Invalid response from server');
      }

      // Handle tool calls if any
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const call of data.toolCalls) {
          if (call.name === 'execute_command') {
            const toolResult = await executeCommand(call.args.command);
            toast.info(`Agent executed: ${call.args.command}`);

            // Add function response to history and call AI again
            const functionMessage: ChatMessage = {
              id: uuidv4(),
              session_id: sessionId,
              role: 'system', // Map to function role on server
              content: JSON.stringify(toolResult),
              timestamp: Date.now()
            };
            // Note: In a real implementation, we'd need a specific 'function' role in the ChatMessage interface
            // or handle it specifically in the next request.
            // For now, we'll append it and trigger another call if needed.
            setChatHistory(prev => [...prev, functionMessage]);
            
            // Re-call AI with the results (recursive agent loop)
            setAgentTurns(prev => prev + 1);
            setTimeout(() => {
              setPrompt("The command was executed. Output: " + JSON.stringify(toolResult.output) + ". Please continue.");
              callAi(true);
            }, 1000);
          }
        }
      }

      if (!data.response) {
        setIsAiWorking(false);
        return;
      }

      // Add AI response to chat history
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        session_id: sessionId,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        providerUsed: data.providerUsed
      };

      setChatHistory(prev => [...prev, aiMessage]);

      // Update HTML if response contains HTML
      if (data.response.includes('<!DOCTYPE html>') || data.response.includes('<html')) {
        setHtml(data.response);
        setView('preview');
        onScrollToBottom();
      }

      toast.success(`Response generated using ${data.providerUsed || selectedProvider}`);

    } catch (error: any) {
      console.error('Error calling AI:', error);
      
      // Remove optimistic user message on error
      setChatHistory(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      if (error.name === 'AbortError') {
        toast.info('Generation stopped');
      } else {
        toast.error(error.message || 'Failed to generate response');
      }
    } finally {
      setIsAiWorking(false);
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setChatHistory([]);
    setSessionId(uuidv4());
    setPrompt("");
    setShowHistory(false);
    toast.info('New conversation started');
  };

  // Clear all history
  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('sessionId');
    setSessionId(uuidv4());
    toast.success('Chat history cleared');
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      callAi();
    }
  };

  // ZIP Export function
  const downloadAsZip = async (content: string) => {
    const zip = new JSZip();
    
    // Pattern to match: # /path/to/file.ext followed by code block
    const filePattern = /#\s+([^\n\r]+)[\r\n]+```[^\n\r]*[\r\n]+([\s\S]*?)```/g;
    let match;
    let fileCount = 0;

    while ((match = filePattern.exec(content)) !== null) {
      const filePath = match[1].trim().replace(/^\//, ''); // remove leading slash
      const fileContent = match[2].trim();
      zip.file(filePath, fileContent);
      fileCount++;
    }

    if (fileCount === 0) {
      toast.error("No project files found in the response to export.");
      return;
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `project-${Date.now()}.zip`);
      toast.success(`Exported ${fileCount} files as ZIP`);
    } catch (error) {
      console.error('ZIP generation failed:', error);
      toast.error("Failed to generate ZIP file");
    }
  };

  // Format message content
  const formatMessageContent = (message: ChatMessage) => {
    const { content, role } = message;
    
    if (role === 'assistant') {
      const hasProjectFiles = content.includes('# /') && content.includes('```');
      const isHtml = content.includes('<!DOCTYPE html>') || content.includes('<html');

      if (isHtml) {
        return (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Generated HTML Content</div>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
              {content.substring(0, 200)}...
            </div>
          </div>
        );
      }

      if (hasProjectFiles) {
        // Extract project name or use timestamp
        const projectName = `deepsite-project-${message.timestamp}`;
        const repoUrl = window.location.origin.includes('localhost') 
          ? 'https://github.com/MadScientist85/Mydeepsite2.0' 
          : window.location.href; // Try to use current URL if deployed

        // Deployment URLs
        const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}&project-name=${projectName}`;
        const netlifyDeployUrl = `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(repoUrl)}`;
        const railwayDeployUrl = `https://railway.app/new/template?template=${encodeURIComponent(repoUrl)}`;

        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Full Project Generated</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadAsZip(content)}
                  className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  title="Download ZIP"
                >
                  <DownloadIcon />
                  ZIP
                </button>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-bold">One-Click Deploy (Generator Template)</div>
              <div className="flex flex-wrap gap-2">
                <a 
                  href={vercelDeployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-[10px] bg-black text-white rounded hover:opacity-80 transition-opacity"
                >
                  Deploy to Vercel
                </a>
                <a 
                  href={netlifyDeployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-[10px] bg-[#00AD9F] text-white rounded hover:opacity-80 transition-opacity"
                >
                  Deploy to Netlify
                </a>
                <a 
                  href={railwayDeployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-[10px] bg-[#0B0D0E] text-white rounded hover:opacity-80 transition-opacity"
                >
                  Deploy to Railway
                </a>
              </div>
              <p className="mt-1.5 text-[9px] text-gray-500 leading-tight">
                * Links clone the DeepSite template. To deploy your specific generated code, download the ZIP and push it to your own repository.
              </p>
            </div>

            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
              {content.substring(0, 500)}...
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">AI Assistant</h2>
          {availableProviders.length > 0 && (
            <div className="flex items-center mt-1 space-x-2">
              <label className="text-sm text-gray-600">Provider:</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={isAiWorking}
                className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROVIDER_OPTIONS
                  .filter(option => availableProviders.includes(option.value))
                  .map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>

              <label className="text-sm text-gray-600 ml-4">Stack:</label>
              <select
                value={selectedStack}
                onChange={(e) => setSelectedStack(e.target.value)}
                disabled={isAiWorking}
                className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STACK_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={startNewConversation}
            disabled={isAiWorking}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="New conversation"
          >
            <NewChatIcon />
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            disabled={isAiWorking}
            className={`p-2 rounded-full transition-colors ${
              showHistory 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Toggle chat history"
          >
            <HistoryIcon />
          </button>

          <button
            onClick={() => setView('preview')}
            disabled={isAiWorking}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Switch to preview"
          >
            <PreviewIcon />
          </button>

          {selectedProvider === 'gemini' && (
            <button
              onClick={() => setIsAgentMode(!isAgentMode)}
              disabled={isAiWorking}
              className={`p-2 rounded-full transition-colors ${
                isAgentMode 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              title="Toggle Agentic Mode (Vibe Agent)"
            >
              <AgentIcon />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isAiWorking && (
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Chat history */}
      {showHistory && (
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start a conversation below!
            </div>
          ) : (
            <>
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {formatMessageContent(message)}
                    
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {message.providerUsed && ` • ${message.providerUsed}`}
                      {message.modelUsed && ` • ${message.modelUsed}`}
                    </div>
                  </div>
                </div>
              ))}

              {chatHistory.length > 0 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={clearHistory}
                    disabled={isAiWorking}
                    className="text-sm text-red-600 hover:text-red-700 hover:underline"
                  >
                    Clear all history
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to create or modify your website..."
              disabled={isAiWorking}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              rows={1}
              style={{ minHeight: '50px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex space-x-2">
            {isAiWorking ? (
              <button
                onClick={stopGeneration}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Stop generation"
              >
                <StopIcon />
              </button>
            ) : (
              <button
                onClick={callAi}
                disabled={!prompt.trim() || !sessionId || availableProviders.length === 0}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>
              {availableProviders.length === 0 
                ? 'No AI providers configured' 
                : `${availableProviders.length} provider(s) available`}
            </span>
            {isAgentMode && (
              <span className="flex items-center text-purple-600 font-medium">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse mr-1.5"></span>
                Vibe Agent Active
              </span>
            )}
          </div>
          <div>
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>

      <TerminalOutput 
        output={terminalOutput} 
        isVisible={showTerminal} 
        onClose={() => setShowTerminal(false)} 
      />
    </div>
  );
};

export default AskAI;
