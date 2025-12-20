import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch, Timestamp, where 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const initializeAuth = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) resolve(user);
      else signInAnonymously(auth).then(({ user }) => resolve(user));
    });
  });
};

export const deleteHistoryItem = async (docId) => {
  if (!auth.currentUser) return;
  await deleteDoc(doc(db, "users", auth.currentUser.uid, "history", docId));
};

export const clearAllHistory = async () => {
  if (!auth.currentUser) return;
  const q = query(collection(db, "users", auth.currentUser.uid, "history"));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

export const saveHistory = async (type, input, output, sourceLang = null, targetLang = null) => {
  if (!auth.currentUser) return;
  const data = { type, input, fullOutput: output, createdAt: new Date() };
  if (sourceLang) data.sourceLang = sourceLang;
  if (targetLang) data.targetLang = targetLang;
  await addDoc(collection(db, "users", auth.currentUser.uid, "history"), data);
};

export const getHistory = async () => {
  if (!auth.currentUser) return [];
  const q = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const cleanupOldHistory = async () => {
  if (!auth.currentUser) return;
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const q = query(collection(db, "users", auth.currentUser.uid, "history"), where("createdAt", "<", Timestamp.fromDate(tenDaysAgo)));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};