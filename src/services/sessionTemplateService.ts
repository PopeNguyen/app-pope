import { db } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export interface TemplateSession {
  id: string; // Using a client-generated ID like nanoid would be good here
  ten: string;
  ghiChu?: string | null;
  gioBatDau: string; // "HH:mm"
  gioKetThuc: string; // "HH:mm"
  taskId?: string | null;
}

export interface SessionTemplate {
  id: string;
  uid: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  name: string; // e.g., "Thứ Hai"
  sessions: TemplateSession[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const nameDB = 'sessionTemplates';
const templateCollectionRef = collection(db, nameDB);

// Subscribe to all templates for a user
export const subscribeSessionTemplates = (uid: string, callback: (templates: SessionTemplate[]) => void) => {
  const q = query(
    templateCollectionRef,
    where('uid', '==', uid)
  );
  
  return onSnapshot(q, (snapshot) => {
    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SessionTemplate[];
    callback(templates);
  });
};

// Create or update a template for a specific day of the week
export const upsertSessionTemplate = async (uid: string, dayOfWeek: number, name: string, sessions: TemplateSession[]) => {
  const q = query(
    templateCollectionRef,
    where('uid', '==', uid),
    where('dayOfWeek', '==', dayOfWeek)
  );

  const snapshot = await getDocs(q);
  const now = Timestamp.now();

  if (snapshot.empty) {
    // Create new
    return addDoc(templateCollectionRef, {
      uid,
      dayOfWeek,
      name,
      sessions,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    // Update existing
    const docId = snapshot.docs[0].id;
    const docRef = doc(db, nameDB, docId);
    return updateDoc(docRef, {
      name,
      sessions,
      updatedAt: now,
    });
  }
};

// Apply a template to a specific date
export const applySessionTemplate = async (uid: string, template: SessionTemplate, date: Date) => {
  const batch = writeBatch(db);
  const sessionCollectionRef = collection(db, 'sessions');
  const applyDate = Timestamp.fromDate(date);

  template.sessions.forEach(session => {
    const newSessionRef = doc(sessionCollectionRef);
    batch.set(newSessionRef, {
      uid,
      ten: session.ten,
      ghiChu: session.ghiChu || null,
      gioBatDau: session.gioBatDau,
      gioKetThuc: session.gioKetThuc,
      taskId: session.taskId || null,
      ngayLam: applyDate,
      trangThai: 'da_len_ke_hoach',
      daXoa: false,
      thoiGianTao: Timestamp.now(),
      thoiGianCapNhat: Timestamp.now(),
    });
  });

  await batch.commit();
};
