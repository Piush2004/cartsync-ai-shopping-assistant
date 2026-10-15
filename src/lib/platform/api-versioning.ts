import { ApiRequest } from './types';

export class ApiVersioningLayer {
  /**
   * Translates deprecated API requests into the current internal engine format.
   * e.g., mapping old v1 field names to v2 field names.
   */
  public translateRequest(request: ApiRequest): ApiRequest {
    if (request.path.includes('/v1/')) {
      // Example translation: rename 'user_id' to 'userId' in body
      if (request.body && request.body.user_id) {
        request.body.userId = request.body.user_id;
        delete request.body.user_id;
      }
      
      // Update internal path routing to v2 core engine
      request.path = request.path.replace('/v1/', '/v2/');
    }
    return request;
  }
}
