import { BaseService } from './base.service';

export class FirestoreService<T> extends BaseService<T> {
  // A generic wrapper that can be instantiated for any collection dynamically
  // or extended by specific services for advanced querying.
  constructor(collectionName: string) {
    super(collectionName);
  }
}
