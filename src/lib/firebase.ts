/// <reference types="vite/client" />

const API_BASE = "/api";

class ApiClient {
  private token: string | null = localStorage.getItem("gp_token");
  currentUser: any = null;
  private authListeners: ((user: any) => void)[] = [];

  constructor() {
    this.refreshUser();
  }

  async refreshUser() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (res.ok) {
        this.currentUser = await res.json();
        this.notify();
      } else {
        this.logout();
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  }

  private notify() {
    this.authListeners.forEach(l => l(this.currentUser));
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== callback);
    };
  }

  async login(token: string, user: any) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem("gp_token", token);
    this.notify();
  }

  async loginWithTelegram(initData: string) {
    const data = await this.fetch("/auth/telegram", {
       method: "POST",
       body: JSON.stringify({ initData })
    });
    await this.login(data.token, data.user);
    return data;
  }

  async signOut() {
    this.logout();
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem("gp_token");
    this.notify();
  }

  async fetch(path: string, options: RequestInit = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || "API Error");
    }
    return res.json();
  }
}

export const api = new ApiClient();
export const auth = api;

// Compatibility standalone exports
export const doc = (db: any, path: string, id?: string) => ({ path: id ? `${path}/${id}` : path });
export const collection = (db: any, path: string) => ({ path });
export const query = (colRef: any, ...constraints: any[]) => colRef;
export const where = (f: string, o: string, v: any) => null;
export const orderBy = (f: string, d: string) => null;
export const limit = (n: number) => null;

export const getDoc = async (docRef: any) => {
    const parts = docRef.path.split('/');
    if (parts[0] === 'config' || parts[0] === 'stats') {
      const stats = await api.fetch("/stats");
      return { exists: () => true, data: () => ({ ...stats, adReward: stats.ad_reward, minWithdrawal: stats.min_withdrawal, adsContent: stats.ads_content ? JSON.parse(stats.ads_content) : [] }) };
    }
    if (parts[0] === 'users' && parts[1]) {
        const p = await api.fetch("/user/profile");
        const profile = { 
          ...p, 
          uid: p.id, 
          displayName: p.display_name, 
          totalEarned: p.total_earned,
          dailyAdsWatched: p.daily_ads_watched || 0,
          lastAdResetAt: p.last_ad_reset_at
        };
        return { exists: () => true, data: () => profile };
    }
    return { exists: () => false };
};

export const getDocs = async (q: any) => {
    const parts = q.path.split('/');
    if (parts[0] === 'tasks') {
        const tasks = await api.fetch("/tasks");
        return { docs: tasks.map((t: any) => ({ data: () => t, id: t.id })), empty: tasks.length === 0 };
    }
    if (parts[0] === 'leaderboard') {
        const leaders = await api.fetch("/leaderboard");
        return { docs: leaders.map((l: any) => ({ data: () => l, id: l.username })), empty: leaders.length === 0 };
    }
    if (parts[0] === 'referrals') {
        const refs = await api.fetch("/referrals");
        return { docs: refs.map((r: any) => ({ data: () => r, id: r.username })), empty: refs.length === 0 };
    }
    if (parts[0] === 'withdrawals') {
        const wds = await api.fetch("/user/withdrawals");
        return { docs: wds.map((w: any) => ({ data: () => w, id: w.id })), empty: wds.length === 0 };
    }
    if (parts[0] === 'users') {
        const users = await api.fetch("/admin/users");
        return { docs: users.map((u: any) => ({ data: () => u, id: u.id })), empty: users.length === 0 };
    }
    return { docs: [], empty: true };
};

export const onSnapshot = (ref: any, callback: any) => {
    const poll = async () => {
      try {
        const parts = ref.path.split('/');
        if ((parts[0] === 'config' || parts[0] === 'stats') || (parts[0] === 'stats' && parts[1] === 'global')) {
           const stats = await api.fetch("/stats");
           callback({ exists: () => true, data: () => ({ ...stats, adReward: stats.ad_reward, minWithdrawal: stats.min_withdrawal, maxDailyAds: 20, adsContent: stats.ads_content ? JSON.parse(stats.ads_content) : [] }) });
        } else if (parts[0] === 'users' && parts[1]) {
           const p = await api.fetch("/user/profile");
           const profile = { 
             ...p, 
             uid: p.id, 
             displayName: p.display_name, 
             totalEarned: p.total_earned,
             dailyAdsWatched: p.daily_ads_watched || 0,
             lastAdResetAt: p.last_ad_reset_at
           };
           callback({ exists: () => true, data: () => profile, id: p.id });
        } else if (parts[0] === 'transactions') {
           const txs = await api.fetch("/user/transactions");
           callback({ docs: txs.map((t: any) => ({ data: () => t, id: t.id })) });
        } else if (parts[0] === 'withdrawals') {
           const wds = await api.fetch("/user/withdrawals");
           callback({ docs: wds.map((w: any) => ({ data: () => w, id: w.id })) });
        } else if (parts[0] === 'tasks') {
           const tasks = await api.fetch("/tasks");
           callback({ docs: tasks.map((t: any) => ({ data: () => t, id: t.id })) });
        }
      } catch (e) {
        // Silently fail polling error to avoid flood
      }
    };
    const interval = setInterval(poll, 7000);
    poll();
    return () => clearInterval(interval);
};

export const setDoc = async (ref: any, val: any, options?: any) => {
    const parts = ref.path.split('/');
    if (parts[0] === 'config' || parts[0] === 'stats' || parts[0] === 'stats') {
        return api.fetch("/admin/stats", {
            method: "POST",
            body: JSON.stringify(val)
        });
    }
};

export const updateDoc = async (ref: any, updates: any) => {
    const parts = ref.path.split('/');
    if (parts[0] === 'users' && updates.dailyAdsWatched !== undefined) {
         // This is handled via backend trigger usually, but if needed for local state
    }
};

export const addDoc = async (col: any, val: any) => {
    if (col.path === 'withdrawals') {
        return api.fetch("/withdraw/request", {
            method: "POST",
            body: JSON.stringify(val)
        });
    }
    return { id: Math.random().toString(36).substring(2, 9) };
};

export const deleteDoc = async (ref: any) => {
    const parts = ref.path.split('/');
    if (parts[0] === 'tasks') {
        return api.fetch(`/admin/tasks/${parts[1]}`, {
            method: "DELETE"
        });
    }
};

export const onAuthStateChanged = (auth: any, callback: any) => auth.onAuthStateChanged(callback);
export const signOut = (auth: any) => auth.logout();
export const createUserWithEmailAndPassword = async (auth: any, email: string, pass: string) => ({ user: { uid: 'temporary' } });
export const signInWithEmailAndPassword = async (auth: any, email: string, pass: string) => ({ user: { uid: 'temporary' } });
export const sendPasswordResetEmail = async (auth: any, email: string) => { alert("Check email for reset link (Demo mode)"); };

export const increment = (val: number) => val;
export const serverTimestamp = () => new Date().toISOString();
export const db: any = {};
