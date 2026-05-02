import { api } from "../lib/firebase";

export async function addBalance(userId: string, amount: number, description: string = "Ad Reward") {
  if (description === "Ad Reward") {
    return await api.fetch("/ads/reward", { method: "POST" });
  }
  // Generic reward if needed (e.g. checkin)
  if (description === "Daily Check-in") {
    return await api.fetch("/user/checkin", { method: "POST" });
  }
}
