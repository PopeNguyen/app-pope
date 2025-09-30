import { db } from '@/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

const listCollectionRef = collection(db, 'vocabularyLists');
const wordsCollectionRef = collection(db, 'learnEnglish');

// Function to get all vocabulary lists for a user
export const getVocabularyLists = (uid: string, callback: (lists: any[]) => void) => {
  const q = query(listCollectionRef, where('uid', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(lists);
  });
};

// Function to add a new vocabulary list
export const addVocabularyList = (listData: { name: string; uid: string; firstReviewDate?: Date }) => {
  const { name, uid, firstReviewDate } = listData;
  const srsLevel = firstReviewDate ? 1 : 0;
  const nextReviewDate = firstReviewDate ? Timestamp.fromDate(firstReviewDate) : null;

  return addDoc(listCollectionRef, { 
    name, 
    uid, 
    srsLevel, 
    nextReviewDate 
  });
};

// Function to update a vocabulary list's name or start the SRS cycle
export const updateVocabularyList = (listId: string, data: { name?: string; firstReviewDate?: Date }) => {
  const listDocRef = doc(db, 'vocabularyLists', listId);
  const updateData: any = { ...data };

  if (data.firstReviewDate) {
    updateData.srsLevel = 1;
    updateData.nextReviewDate = Timestamp.fromDate(data.firstReviewDate);
    delete updateData.firstReviewDate; // Don't save this field
  }

  return updateDoc(listDocRef, updateData);
};

// Function to delete a vocabulary list and all its words
export const deleteVocabularyList = async (listId: string) => {
  const listDocRef = doc(db, 'vocabularyLists', listId);
  await deleteDoc(listDocRef);

  const q = query(wordsCollectionRef, where('listId', '==', listId));
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  return batch.commit();
};

// === SRS LOGIC ===
const getNextReviewDate = (level: number): Date => {
    const now = new Date();
    const intervals = [1, 3, 7, 14]; // Days from previous review
    // Level 1 is 1 day, Level 2 is 3 days after that, etc.
    const daysToAdd = intervals[level - 1] || 1;
    now.setDate(now.getDate() + daysToAdd);
    return now;
}

// Updates the list to the next SRS level
export const completeListReview = (listId: string, currentSrsLevel: number) => {
  const listDocRef = doc(db, 'vocabularyLists', listId);
  const newSrsLevel = currentSrsLevel + 1;
  const newNextReviewDate = Timestamp.fromDate(getNextReviewDate(newSrsLevel));

  return updateDoc(listDocRef, {
    srsLevel: newSrsLevel,
    nextReviewDate: newNextReviewDate,
  });
};
