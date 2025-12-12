import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para RomXD
const firebaseConfig = {
  apiKey: "AIzaSyAeqtNKCjCDI_xGqFzNrZpEq-PkksY4eBA",
  authDomain: "romxd-9efa0.firebaseapp.com",
  projectId: "romxd-9efa0",
  storageBucket: "romxd-9efa0.firebasestorage.app",
  messagingSenderId: "519440092010",
  appId: "1:519440092010:web:f56d54fba1016d2090f313"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();