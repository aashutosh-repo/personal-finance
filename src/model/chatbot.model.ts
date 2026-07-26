export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'assistant'; // user or assistant
  content: string;
  timestamp?: string;
  isLoading?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: {
    response: string;
    conversationId?: string;
  };
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}
