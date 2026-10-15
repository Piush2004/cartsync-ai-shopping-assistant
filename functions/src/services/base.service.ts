import { db } from '../config/firebase';

export abstract class BaseService<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get collection() {
    return db.collection(this.collectionName);
  }

  async getById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  }

  async create(id: string, data: Partial<T>): Promise<void> {
    await this.collection.doc(id).set(data);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
