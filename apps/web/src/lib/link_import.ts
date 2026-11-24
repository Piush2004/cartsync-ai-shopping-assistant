import { apiClient } from "./client";
import { StylistRecommendation } from "./stylist";

export interface LinkImportResult {
  name: string;
  brand: string | null;
  image_url: string;
  price: number | null;
  source_url: string;
  // Read off the product title by the backend. department is null when the
  // title doesn't say whether it's men's or women's.
  category: "top" | "bottom" | "dress";
  department: "women" | "men" | null;
  // null when the user has no measurements on file yet, or the page's
  // brand couldn't be determined -- not an error, just no fit guide yet.
  fit_guide: StylistRecommendation | null;
}

export const linkImportApi = {
  preview: async (token: string, url: string): Promise<LinkImportResult> => {
    return apiClient<LinkImportResult>("/link-import/preview", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
  },
};
