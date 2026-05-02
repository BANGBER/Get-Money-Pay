import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function register(email: string, password: string, displayName: string, username: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", res.user.uid), {
    uid: res.user.uid,
    email,
    displayName,
    username: username.toLowerCase(),
    balance: 0,
    totalEarned: 0,
    referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    dailyAdsWatched: 0,
    lastAdResetAt: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
  
  return res;
}

export async function login(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}
