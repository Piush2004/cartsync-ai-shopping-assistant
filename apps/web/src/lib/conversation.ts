import { apiClient } from "./client";

export interface ConversationResponse {
  answer: string;
  sources?: string[];
}

export const conversationApi = {
  chat: async (token: string, question: string): Promise<ConversationResponse> => {
    return apiClient<ConversationResponse>("/conversation/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });
  },
};
