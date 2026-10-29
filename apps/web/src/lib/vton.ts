import { API_BASE_URL, ApiError, extractErrorMessage } from "./client";

export interface VTONResponse {
  image_url: string;
}

// Garment source is either a directly uploaded file, or a URL surfaced by
// the link-import preview flow -- lets the backend fetch that image
// server-side instead of the browser downloading and re-uploading it.
export type GarmentSource = File | { imageUrl: string };

export const vtonApi = {
  tryOn: async (token: string, personImage: File, garment: GarmentSource): Promise<VTONResponse> => {
    const formData = new FormData();
    formData.append("person_image", personImage);
    if (garment instanceof File) {
      formData.append("garment_image", garment);
    } else {
      formData.append("garment_image_url", garment.imageUrl);
    }

    let response: Response;
    try {
      // No Content-Type header here on purpose -- apiClient's default JSON
      // Content-Type would break multipart uploads, since the browser must
      // set the multipart boundary itself when given a FormData body. That's
      // why this bypasses apiClient (which always assumes a JSON body)
      // rather than calling it.
      response = await fetch(`${API_BASE_URL}/vton/try-on`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (networkErr) {
      throw new ApiError(
        networkErr instanceof Error ? networkErr.message : "Network request failed",
        undefined
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(extractErrorMessage(errorData, response.status), response.status);
    }

    return response.json();
  },
};
