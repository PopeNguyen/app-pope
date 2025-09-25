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
  Timestamp
} from 'firebase/firestore';

export type TodoStatus = 'todo' | 'inprogress' | 'done';
export type TodoPriority = 'High' | 'Medium' | 'Low';

export interface Todo {
  id: string;
  uid: string;
  title: string;
  content?: string;
  priority: TodoPriority;
  dueDate?: Timestamp;
  status: TodoStatus;
}

const nameDB = 'todos';
const todoCollectionRef = collection(db, nameDB);

// Add a new todo
export const addTodo = (todo: Omit<Todo, 'id'>) => {
  return addDoc(todoCollectionRef, todo);
};

// Get all todos for a user
export const getTodos = async (uid: string): Promise<Todo[]> => {
  const q = query(todoCollectionRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Todo[];
};

// Update a todo
export const updateTodo = (id: string, updates: Partial<Omit<Todo, 'id' | 'uid'>>) => {
  const todoDocRef = doc(db, nameDB, id);
  return updateDoc(todoDocRef, updates);
};

// Delete a todo
export const deleteTodo = (id: string) => {
  const todoDocRef = doc(db, nameDB, id);
  return deleteDoc(todoDocRef);
};
