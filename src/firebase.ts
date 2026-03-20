import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, collection, addDoc, onSnapshot, query, orderBy, limit, doc, getDoc, getDocFromServer, getDocs, getDocsFromServer, Timestamp, serverTimestamp, deleteDoc, updateDoc, where, setDoc, terminate } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup,
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  getDocFromServer, 
  getDocs,
  getDocsFromServer,
  Timestamp, 
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteDoc,
  updateDoc,
  where,
  setDoc,
  terminate
};
export type { User };
