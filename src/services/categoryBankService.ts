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

export const addCategoryBank = async (data: any) => {
  const moneyRef = collection(db, 'categoryBank');
  return await addDoc(moneyRef, data);
};

export const getCategoryBank = async (uid: string): Promise<any[]> => {
  const moneyRef = collection(db, 'categoryBank');
  const q = query(moneyRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
};

export const updateCategoryBank = async (categoryBank: any) => {
  if (!categoryBank.id) return;
  const categoryBankRef = doc(db, 'categoryBank', categoryBank.id);
  const { id, ...data } = categoryBank;
  await updateDoc(categoryBankRef, data);
};

export const deleteCategoryBank = async (id: string) => {
  if (!id) return;
  const categoryBankRef = doc(db, "categoryBank", id);
  await deleteDoc(categoryBankRef);
};