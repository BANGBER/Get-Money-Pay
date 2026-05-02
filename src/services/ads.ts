import { db, doc, getDoc, setDoc } from "../lib/firebase";

export interface AdSystemConfig {
  scriptCode: string;
  isEnabled: boolean;
  networks: string[];
}

export async function getAdConfig(): Promise<AdSystemConfig> {
  const docRef = doc(db, "config", "ads");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AdSystemConfig;
  }
  
  const defaults: AdSystemConfig = {
    scriptCode: "",
    isEnabled: true,
    networks: ["Adsterra", "Monetag"]
  };
  
  await setDoc(docRef, defaults);
  return defaults;
}

export async function updateAdConfig(config: AdSystemConfig) {
  await setDoc(doc(db, "config", "ads"), config);
}
