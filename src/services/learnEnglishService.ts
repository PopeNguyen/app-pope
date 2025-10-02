import { db } from '@/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  increment,
  deleteField
} from 'firebase/firestore';

const learnEnglishCollectionRef = collection(db, 'learnEnglish');

// Get all words for a specific list
export const getWords = (uid: string, listId: string, callback: (words: any[]) => void) => {
  const q = query(learnEnglishCollectionRef, where('uid', '==', uid), where('listId', '==', listId));
  return onSnapshot(q, (snapshot) => {
    const words = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(words);
  });
};

// Add a new word
export const addWord = (wordData: { word: string; meaning: string; uid: string; listId: string }) => {
  return addDoc(learnEnglishCollectionRef, {
    ...wordData,
    correctCount: 0,
    incorrectCount: 0,
  });
};

// Update a word's text
export const updateWord = (wordId: string, updatedData: { word: string; meaning: string }) => {
  const wordDocRef = doc(db, 'learnEnglish', wordId);
  return updateDoc(wordDocRef, updatedData);
};

// Delete multiple words
export const deleteWords = (wordIds: string[]) => {
  const batch = writeBatch(db);
  wordIds.forEach((id) => {
    const wordDocRef = doc(db, 'learnEnglish', id);
    batch.delete(wordDocRef);
  });
  return batch.commit();
};

// Update a word's stats
export const updateWordStats = (wordId: string, isCorrect: boolean) => {
  const wordDocRef = doc(db, 'learnEnglish', wordId);
  const updateData = {
    [isCorrect ? 'correctCount' : 'incorrectCount']: increment(1)
  };
  return updateDoc(wordDocRef, updateData);
};
