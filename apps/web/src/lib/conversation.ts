import { apiClient } from "./client";

export interface ConversationResponse {
  answer: string;
  sources?: string[];
  // "model" when the local language model wrote the answer, "rules" when
  // the built-in fallback did.
  answered_by?: "model" | "rules";
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
