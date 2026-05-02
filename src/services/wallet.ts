import { db } from "../lib/firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function addBalance(userId: string, amount: number, description: string = "Ad Reward") {
  const userRef = doc(db, "users", userId);
  
  // Update balance and total earned
  await updateDoc(userRef, {
    balance: increment(amount),
    totalEarned: increment(amount)
  });

  // Log transaction
  await addDoc(collection(db, "transactions"), {
    userId,
    amount,
    type: "credit",
    description,
    createdAt: serverTimestamp()
  });
}
