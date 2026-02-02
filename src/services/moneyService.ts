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

// list bank
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

// list transaction
export const addListTransaction = async (data: any) => {
  const moneyRef = collection(db, 'listTransaction');
  return await addDoc(moneyRef, data);
};

export const getListTransaction = async (uid: string): Promise<any[]> => {
  const moneyRef = collection(db, 'listTransaction');
  const q = query(moneyRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
};

export const updateListTransaction = async (transaction: any) => {
  if (!transaction.id) return;
  const transactionRef = doc(db, 'listTransaction', transaction.id);
  const { id, ...data } = transaction;
  await updateDoc(transactionRef, data);
};

export const deleteListTransaction = async (id: string) => {
  if (!id) return;
  const transactionRef = doc(db, "listTransaction", id);
  await deleteDoc(transactionRef);
};

// list template
export const addListTemplate = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, "templates"), data);
    return docRef.id;
  } catch (e) {
    console.error("Error adding template: ", e);
    throw e;
  }
};

export const updateListTemplate = async (data: any) => {
  try {
    const docRef = doc(db, "templates", data.id);
    await updateDoc(docRef, data);
  } catch (e) {
    console.error("Error updating template: ", e);
    throw e;
  }
};

export const getListTemplate = async (uid: string) => {
  try {
    const q = query(collection(db, "templates"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const data: any[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  } catch (e) {
    console.error("Error getting templates: ", e);
    throw e;
  }
};

export const deleteListTemplate = async (id: string) => {
  try {
    await deleteDoc(doc(db, "templates", id));
  } catch (e) {
    console.error("Error deleting template: ", e);
    throw e;
  }
};