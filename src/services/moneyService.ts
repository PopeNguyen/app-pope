import { db } from '@/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

export const addListBank = async (data: any) => {
  const moneyRef = collection(db, 'listBank');
  return await addDoc(moneyRef, data);
};

export const getListBank = async (uid: string): Promise<any[]> => {
  const moneyRef = collection(db, 'listBank');
  const q = query(moneyRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
};

export const updateListBank = async (listBank: any) => {
  if (!listBank.id) return;
  const listBankRef = doc(db, 'listBank', listBank.id);
  const { id, ...data } = listBank;
  await updateDoc(listBankRef, data);
};

export const deleteListBank = async (id: string) => {
  if (!id) return;
  const listBankRef = doc(db, "listBank", id);
  await deleteDoc(listBankRef);
};