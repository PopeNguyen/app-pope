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
  onSnapshot
} from 'firebase/firestore';

export type TrangThaiPhien =
  | "da_len_ke_hoach"
  | "dang_thuc_hien"
  | "tam_dung"
  | "hoan_thanh"
  | "huy";

export interface PhienLamViec {
  id: string;
  uid: string;
  taskId?: string | null;
  ten: string;
  ghiChu?: string | null;
  ngayLam: Timestamp;
  gioBatDau: string;
  gioKetThuc: string;
  trangThai: TrangThaiPhien;
  thoiGianTao: Timestamp;
  thoiGianCapNhat: Timestamp;
  thoiGianXoa?: Timestamp;
  daXoa: boolean;
}

const nameDB = 'sessions';
const sessionCollectionRef = collection(db, nameDB);

// Add a new session
export const addSession = (session: Omit<PhienLamViec, 'id'>) => {
  return addDoc(sessionCollectionRef, session);
};

// Get all sessions for a user (Real-time)
export const subscribeSessions = (uid: string, callback: (sessions: PhienLamViec[]) => void) => {
  const q = query(
    sessionCollectionRef,
    where('uid', '==', uid),
    where('daXoa', '==', false),
    orderBy('thoiGianTao', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PhienLamViec[];
    callback(sessions);
  });
};

// Update a session
export const updateSession = (id: string, updates: Partial<Omit<PhienLamViec, 'id' | 'uid'>>) => {
  const sessionDocRef = doc(db, nameDB, id);
  return updateDoc(sessionDocRef, updates);
};

// Soft delete a session
export const deleteSession = (id: string) => {
  const sessionDocRef = doc(db, nameDB, id);
  return updateDoc(sessionDocRef, {
    daXoa: true,
    thoiGianXoa: Timestamp.now(),
    thoiGianCapNhat: Timestamp.now()
  });
};
