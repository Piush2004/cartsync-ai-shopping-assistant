import { apiClient } from "./client";

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export const authApi = {
  login: async (formData: URLSearchParams): Promise<Token> => {
    return apiClient<Token>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
  },

  register: async (data: { email: string; password: string }): Promise<User> => {
    return apiClient<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (token: string): Promise<User> => {
    return apiClient<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
