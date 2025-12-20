import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch, Timestamp, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize only if config is present to prevent crashing during dev if .env is missing
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const initializeAuth = () => {
  return new Promise((resolve) => {
    //Check if an user is allready signed in
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth).then(({ user }) => resolve(user)).catch((error) => console.error("Auth Error:", error));
      }
    });
  });
};

// history cleanup
export const cleanupOldHistory = async () => {
  if (!auth.currentUser) return;
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const q = query(collection(db, "users", auth.currentUser.uid, "history"), where("createdAt", "<", Timestamp.fromDate(tenDaysAgo)));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    //Efficient deletion of multiple docs
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleanup: Deleted ${snapshot.size} old history items.`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
};

// Clear all history for the current user
export const clearAllHistory = async () => {
  if (!auth.currentUser) return;
  try {
    const q = query(collection(db, "users", auth.currentUser.uid, "history"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Clear All: Deleted ${snapshot.size} history items.`);
  } catch (error) {
    console.error("Error clearing history:", error);
    throw error;
  }
};

//Delete individual items
export const deleteHistoryItem = async (docId) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, "users", auth.currentUser.uid, "history", docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

// Updated saveHistory to include sourceLang and targetLang
export const saveHistory = async (type, input, output, sourceLang = null, targetLang = null) => {
  if (!auth.currentUser) return;
  try {
    const data = {
      type,
      input: input, 
      fullOutput: output, 
      createdAt: new Date() 
    };

    // Only save if provided
    if (sourceLang) data.sourceLang = sourceLang;
    if (targetLang) data.targetLang = targetLang;

    await addDoc(collection(db, "users", auth.currentUser.uid, "history"), data);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export const getHistory = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, "users", auth.currentUser.uid, "history"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  try {
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};