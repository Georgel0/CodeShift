import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

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

signInAnonymously(auth).catch((error) => {
  console.error("Auth Error:", error);
});

export const saveHistory = async (type, input, output) => {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
      type,
      input: input, 
      fullOutput: output, 
      createdAt: new Date()
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export const getHistory = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    collection(db, "users", auth.currentUser.uid, "history"), 
    orderBy("createdAt", "desc"), 
    limit(20)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
