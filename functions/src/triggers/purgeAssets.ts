import * as functions from 'firebase-functions';
import { db, admin } from '../utils/firebaseAdmin';

export const purgeAssets = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  let purgedCount = 0;

  try {
    // We need a collection group query or to iterate through users.
    // For scale, usually collectionGroup is better, but requires an index.
    // Assuming 'vtonAssets' collectionGroup index is created.
    const expiredAssetsSnapshot = await db.collectionGroup('vtonAssets')
      .where('expiresAt', '<=', now)
      .get();

    if (expiredAssetsSnapshot.empty) {
      functions.logger.info('No expired assets found to purge.');
      return null;
    }

    const batch = db.batch();

    // Limit batches to 500 (Firestore limit)
    let batchCount = 0;

    for (const doc of expiredAssetsSnapshot.docs) {
      // const data = doc.data();
      
      // Note: In a real app, you would also delete the actual files from Firebase Storage here
      // using admin.storage().bucket().file(data.inputImagePath).delete()
      // This is simplified for the demo.
      
      batch.delete(doc.ref);
      purgedCount++;
      batchCount++;

      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    functions.logger.info(`Successfully purged ${purgedCount} expired VTON assets.`);
    return null;
  } catch (error) {
    functions.logger.error('Error during asset purge:', error);
    return null;
  }
});
