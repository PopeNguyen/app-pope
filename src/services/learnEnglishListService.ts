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

// Helper to calculate review dates
const calculateReviewDates = (date1: Date) => {
    const dates: { [key: string]: Timestamp } = {};
    const intervals = [0, 1, 3, 7, 14]; // date1 is 0 days offset
    intervals.forEach((days, index) => {
        const newDate = new Date(date1);
        newDate.setDate(newDate.getDate() + days);
        dates[`date${index + 1}`] = Timestamp.fromDate(newDate);
    });
    return dates;
};

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
export const addVocabularyList = (listData: { name: string; uid: string; date1?: Date }) => {
  const { name, uid, date1 } = listData;
  let data: any = { name, uid };

  if (date1) {
    data = { ...data, ...calculateReviewDates(date1) };
  }

  return addDoc(listCollectionRef, data);
};

// Function to update a vocabulary list
export const updateVocabularyList = (listId: string, data: { name?: string; date1?: Date }) => {
  const listDocRef = doc(db, 'vocabularyLists', listId);
  const updateData: any = { ...data };

  if (data.date1) {
    const newDates = calculateReviewDates(data.date1);
    updateData.date1 = newDates.date1; // ensure it's a timestamp
    updateData.date2 = newDates.date2;
    updateData.date3 = newDates.date3;
    updateData.date4 = newDates.date4;
    updateData.date5 = newDates.date5;
  } else {
    // If date1 is cleared, remove all date fields
    updateData.date1 = null;
    updateData.date2 = null;
    updateData.date3 = null;
    updateData.date4 = null;
    updateData.date5 = null;
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
