import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export async function addBalance(userId: string, amount: number) {
  await updateDoc(doc(db, "users", userId), {
    balance: increment(amount)
  });
}
