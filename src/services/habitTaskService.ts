import { db } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  orderBy,
  onSnapshot,
  increment
} from 'firebase/firestore';

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type TaskType = "day" | "month" | "year";

export interface HabitTask {
  id: string;
  uid: string;
  name: string;
  description?: string | null;
  targetDuration?: number | null;
  actualDuration?: number | null;
  status: TaskStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
  isDeleted: boolean;
}

const nameDB = 'habitTasks';
const taskCollectionRef = collection(db, nameDB);

// Add a new task
export const addHabitTask = (task: Omit<HabitTask, 'id'>) => {
  return addDoc(taskCollectionRef, task);
};

// Get all tasks for a user (Real-time)
export const subscribeHabitTasks = (uid: string, callback: (tasks: HabitTask[]) => void) => {
  const q = query(
    taskCollectionRef,
    where('uid', '==', uid),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HabitTask[];
    callback(tasks);
  });
};

// Update a task
export const updateHabitTask = (id: string, updates: Partial<Omit<HabitTask, 'id' | 'uid'>>) => {
  const taskDocRef = doc(db, nameDB, id);
  return updateDoc(taskDocRef, updates);
};

// Update actual duration safely
export const updateTaskDuration = (id: string, minutes: number) => {
  const taskDocRef = doc(db, nameDB, id);
  return updateDoc(taskDocRef, {
    actualDuration: increment(minutes),
    updatedAt: Timestamp.now()
  });
};

// Soft delete a task
export const deleteHabitTask = (id: string) => {
  const taskDocRef = doc(db, nameDB, id);
  return updateDoc(taskDocRef, {
    isDeleted: true,
    deletedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};
