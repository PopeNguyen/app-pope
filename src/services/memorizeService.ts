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
  writeBatch
} from 'firebase/firestore';

const decksCollectionRef = collection(db, 'memorizeDecks');
const cardsCollectionRef = collection(db, 'memorizeCards');

// Decks
export const getDecks = (uid: string, callback: (decks: any[]) => void) => {
  const q = query(decksCollectionRef, where('uid', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const decks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(decks);
  });
};

export const addDeck = (deckData: { name: string; description: string; uid: string }) => {
  return addDoc(decksCollectionRef, deckData);
};

// Cards
export const getCards = (uid: string, deckId: string, callback: (cards: any[]) => void) => {
  const q = query(cardsCollectionRef, where('uid', '==', uid), where('deckId', '==', deckId));
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(cards);
  });
};

export const addCard = (cardData: { numberKey: string; image: string; name: string; deckId: string; uid: string }) => {
  return addDoc(cardsCollectionRef, {
    ...cardData,
    level: 0, // SRS level
    nextReviewDate: new Date().toISOString(),
  });
};

export const updateCardStats = (cardId: string, isCorrect: boolean, currentLevel: number) => {
  const cardDocRef = doc(db, 'memorizeCards', cardId);
  
  // Basic SRS logic simulation
  let newLevel = isCorrect ? currentLevel + 1 : 0;
  
  // Calculate next review date (dummy logic for now: add 'newLevel' days)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (newLevel === 0 ? 0 : Math.pow(2, newLevel)));

  return updateDoc(cardDocRef, {
    level: newLevel,
    nextReviewDate: nextDate.toISOString()
  });
};

export const updateCard = (cardId: string, updatedData: any) => {
  const cardDocRef = doc(db, 'memorizeCards', cardId);
  return updateDoc(cardDocRef, updatedData);
};

export const deleteCard = (cardId: string) => {
  const cardDocRef = doc(db, 'memorizeCards', cardId);
  return deleteDoc(cardDocRef);
};
