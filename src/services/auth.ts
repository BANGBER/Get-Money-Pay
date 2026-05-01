import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function register(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", res.user.uid), {
    email,
    balance: 0,
    createdAt: new Date()
  });
}

export async function login(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
                                          }
