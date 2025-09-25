import { db } from '@/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDoc
} from 'firebase/firestore';

const matchCollectionRef = collection(db, 'matches');

// Function to get all matches for a user with real-time updates
export const getMatches = (uid: string, callback: (matches: any[]) => void) => {
  const q = query(matchCollectionRef, where('uid', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(matches);
  });
};

// Function to add a new match
export const addMatch = (matchData: { name: string; uid: string }) => {
  return addDoc(matchCollectionRef, matchData);
};

// Function to get a single match document
export const getMatch = (matchId: string) => {
    const matchDocRef = doc(db, "matches", matchId);
    return getDoc(matchDocRef);
}

// Function to update a match (e.g., add players, rounds)
export const updateMatch = (matchId: string, updatedData: any) => {
  const matchDocRef = doc(db, 'matches', matchId);
  return updateDoc(matchDocRef, updatedData);
};

// Function to delete a match
export const deleteMatch = (matchId: string) => {
  const matchDocRef = doc(db, 'matches', matchId);
  return deleteDoc(matchDocRef);
};
