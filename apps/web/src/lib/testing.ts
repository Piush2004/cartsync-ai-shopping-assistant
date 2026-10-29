import { apiClient } from "./client";

export interface TestSessionFeedbackPayload {
  capture_easy?: boolean;
  instructions_clear?: boolean;
  photo_accepted?: boolean;
  measurements_believable?: boolean;
  measurement_that_seemed_wrong?: string;
  recommended_size_correct?: boolean;
  product_recommendations_relevant?: boolean;
  stylist_understood_question?: boolean;
  confusing_notes?: string;
  general_notes?: string;
}

export interface TestSessionFeedbackResponse extends TestSessionFeedbackPayload {
  id: string;
  created_at: string;
}

export const testingApi = {
  submitFeedback: async (token: string, payload: TestSessionFeedbackPayload): Promise<TestSessionFeedbackResponse> => {
    return apiClient<TestSessionFeedbackResponse>("/testing/feedback", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
};
