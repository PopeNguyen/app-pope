import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const scoresCollectionRef = collection(db, 'learningSessions');

// Function to save a learning session score
export const saveScore = (sessionData: { 
  uid: string; 
  listId: string; 
  score: number; 
  totalWords: number; 
}) => {
  return addDoc(scoresCollectionRef, {
    ...sessionData,
    timestamp: serverTimestamp(),
  });
};
