import * as functions from 'firebase-functions';
import { db, admin } from '../utils/firebaseAdmin';
import { INITIAL_CREDITS, CreditLog } from '../utils/types';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const userRef = db.collection('users').doc(uid);
  const logRef = userRef.collection('creditLogs').doc();

  const batch = db.batch();

  // Create user doc
  batch.set(userRef, {
    uid: uid,
    email: user.email || '',
    displayName: user.displayName || 'Fashionista',
    credits: INITIAL_CREDITS,
    tier: 'free',
    gender: 'non-binary', // Default, user can update later
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Create initial credit log
  const logEntry: CreditLog = {
    type: 'INITIAL_GRANT',
    amount: INITIAL_CREDITS,
    reason: 'Welcome bonus - free style credits',
    functionName: 'onUserCreate',
    timestamp: admin.firestore.Timestamp.now(),
    balanceAfter: INITIAL_CREDITS
  };
  
  batch.set(logRef, logEntry);

  try {
    await batch.commit();
    functions.logger.info(`Successfully initialized user ${uid} with ${INITIAL_CREDITS} credits.`);
  } catch (error) {
    functions.logger.error(`Error initializing user ${uid}:`, error);
  }
});
