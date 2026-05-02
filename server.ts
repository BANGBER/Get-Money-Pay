import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("getmoneypay.db");
const JWT_SECRET = process.env.JWT_SECRET || "gp-secret-key-2024";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8217284139:AAFnPKUhFQEDTryal2QukDNV8t_MTRmpPUY";

// Verification helper for Telegram WebApp data
function verifyTelegramData(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(TELEGRAM_BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    display_name TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    balance REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    last_checkin TEXT,
    daily_ads_watched INTEGER DEFAULT 0,
    last_ad_reset_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    reward REAL,
    category TEXT,
    type TEXT,
    icon TEXT,
    link TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    task_id TEXT,
    status TEXT, -- pending, completed, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id)
  );

  CREATE TABLE IF NOT EXISTS ads_config (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount REAL,
    type TEXT, -- credit, debit
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount REAL,
    paypal_email TEXT,
    status TEXT, -- pending, completed, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    ad_reward REAL DEFAULT 0.04,
    min_withdrawal REAL DEFAULT 1.0,
    total_payouts REAL DEFAULT 0
  );

  INSERT OR IGNORE INTO app_stats (id, ad_reward, min_withdrawal, total_payouts) VALUES (1, 0.04, 1.0, 0);
`);

// Migration: Ensure columns exist
try {
  db.exec("ALTER TABLE users ADD COLUMN daily_ads_watched INTEGER DEFAULT 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN last_ad_reset_at TEXT");
} catch (e) {}

// Add default admin if not exists
const adminEmail = "tedysyahrul03@gmail.com";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (id, username, email, password, display_name, referral_code, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run("admin", "admin", adminEmail, hashedPassword, "Main Admin", "ADMIN", 1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // For development and iframe
  }));
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", (req, res) => {
    const { email, username, password, displayName, referralCode } = req.body;
    try {
      const id = Math.random().toString(36).substring(2, 15);
      const hashedPassword = bcrypt.hashSync(password, 10);
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check referral
      let referredBy = null;
      if (referralCode) {
        const referrer = db.prepare("SELECT id FROM users WHERE referral_code = ?").get(referralCode) as any;
        if (referrer) referredBy = referrer.id;
      }

      db.prepare("INSERT INTO users (id, email, username, password, display_name, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, email, username, hashedPassword, displayName, myReferralCode, referredBy);

      const user = { id, email, username, displayName, isAdmin: false };
      const token = jwt.sign({ ...user }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { login, password } = req.body; // login can be email or username
    const user = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?").get(login, login) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      displayName: user.display_name,
      isAdmin: !!user.is_admin 
    }, JWT_SECRET, { expiresIn: "7d" });
    
    res.json({ token, user: { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      displayName: user.display_name,
      balance: user.balance,
      isAdmin: !!user.is_admin 
    }});
  });

  app.post("/api/auth/telegram", (req, res) => {
    const { initData } = req.body;
    if (!initData || !verifyTelegramData(initData)) {
      return res.status(401).json({ error: "Invalid Telegram data" });
    }

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get("user") || "{}");
    const tgId = tgUser.id?.toString();

    if (!tgId) return res.status(400).json({ error: "No user data" });

    // Check if user exists
    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(tgId) as any;

    if (!user) {
      // Auto-register
      const username = tgUser.username || `tg_${tgId}`;
      const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || username;
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      db.prepare("INSERT INTO users (id, username, display_name, referral_code) VALUES (?, ?, ?, ?)")
        .run(tgId, username, displayName, myReferralCode);
      
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(tgId);
    }

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      displayName: user.display_name,
      isAdmin: !!user.is_admin 
    }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { 
      id: user.id, 
      username: user.username, 
      displayName: user.display_name,
      balance: user.balance,
      isAdmin: !!user.is_admin 
    }});
  });

  // --- User Routes ---
  app.get("/api/user/profile", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    // Server-side daily reset check
    const today = new Date().toISOString().split("T")[0];
    if (user.last_ad_reset_at !== today) {
       db.prepare("UPDATE users SET daily_ads_watched = 0, last_ad_reset_at = ? WHERE id = ?")
         .run(today, req.user.id);
       user.daily_ads_watched = 0;
       user.last_ad_reset_at = today;
    }

    res.json(user);
  });

  app.post("/api/user/checkin", authenticate, (req: any, res) => {
    const today = new Date().toISOString().split("T")[0];
    const user = db.prepare("SELECT last_checkin FROM users WHERE id = ?").get(req.user.id) as any;
    if (user.last_checkin === today) {
      return res.status(400).json({ error: "Already checked in today" });
    }
    const reward = 0.01;
    db.prepare("UPDATE users SET balance = balance + ?, total_earned = total_earned + ?, last_checkin = ? WHERE id = ?")
      .run(reward, reward, today, req.user.id);
    
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 9), req.user.id, reward, "credit", "Daily Check-in");
    
    res.json({ reward });
  });

  // --- Ads & Tasks Routes ---
  app.get("/api/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM app_stats WHERE id = 1").get();
    res.json(stats);
  });

  app.post("/api/ads/reward", authenticate, (req: any, res) => {
    const stats = db.prepare("SELECT ad_reward FROM app_stats WHERE id = 1").get() as any;
    const reward = stats.ad_reward;
    
    db.prepare("UPDATE users SET balance = balance + ?, total_earned = total_earned + ?, daily_ads_watched = daily_ads_watched + 1 WHERE id = ?")
      .run(reward, reward, req.user.id);
    
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 9), req.user.id, reward, "credit", "Ad Watch Reward");
    
    res.json({ reward });
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE is_active = 1").all();
    res.json(tasks);
  });

  app.post("/api/tasks/claim", authenticate, (req: any, res) => {
    const { taskId } = req.body;
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as any;
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Check if already completed
    const existing = db.prepare("SELECT * FROM task_completions WHERE user_id = ? AND task_id = ?").get(req.user.id, taskId);
    if (existing) return res.status(400).json({ error: "Task already claimed or pending" });

    db.prepare("INSERT INTO task_completions (id, user_id, task_id, status) VALUES (?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 9), req.user.id, taskId, "pending");

    res.json({ message: "Task completion submitted for verification" });
  });

  // --- Wallet & Withdrawals ---
  app.get("/api/user/transactions", authenticate, (req: any, res) => {
    const txs = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(txs);
  });

  app.get("/api/user/withdrawals", authenticate, (req: any, res) => {
    const wds = db.prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(wds);
  });

  app.post("/api/withdraw/request", authenticate, (req: any, res) => {
    const { amount, paypalEmail } = req.body;
    const stats = db.prepare("SELECT min_withdrawal FROM app_stats WHERE id = 1").get() as any;
    
    if (amount < stats.min_withdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal is $${stats.min_withdrawal}` });
    }

    const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id) as any;
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?")
      .run(amount, req.user.id);

    db.prepare("INSERT INTO withdrawals (id, user_id, amount, paypal_email, status) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 9), req.user.id, amount, paypalEmail, "pending");

    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(Math.random().toString(36).substring(2, 9), req.user.id, amount, "debit", "Withdrawal Request");

    res.json({ message: "Withdrawal request submitted" });
  });

  // --- Social ---
  app.get("/api/referrals", authenticate, (req: any, res) => {
    const refs = db.prepare("SELECT username, display_name, created_at FROM users WHERE referred_by = ?").all(req.user.id);
    res.json(refs);
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaders = db.prepare("SELECT username, total_earned, created_at FROM users ORDER BY total_earned DESC LIMIT 10").all();
    res.json(leaders);
  });

  // --- Admin Routes ---
  app.get("/api/admin/users", authenticate, isAdmin, (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.get("/api/admin/withdrawals", authenticate, isAdmin, (req, res) => {
    const wds = db.prepare("SELECT w.*, u.username as user_username FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC").all();
    res.json(wds);
  });

  app.post("/api/admin/withdrawals/:id/status", authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    db.prepare("UPDATE withdrawals SET status = ? WHERE id = ?").run(status, id);
    
    if (status === "rejected") {
      const wd = db.prepare("SELECT user_id, amount FROM withdrawals WHERE id = ?").get(id) as any;
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(wd.amount, wd.user_id);
      db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
        .run(Math.random().toString(36).substring(2, 9), wd.user_id, wd.amount, "credit", "Withdrawal Rejected Refund");
    }
    res.json({ success: true });
  });

  app.post("/api/admin/stats", authenticate, isAdmin, (req, res) => {
    const { ad_reward, min_withdrawal } = req.body;
    db.prepare("UPDATE app_stats SET ad_reward = ?, min_withdrawal = ? WHERE id = 1")
      .run(ad_reward, min_withdrawal);
    res.json({ success: true });
  });

  app.post("/api/admin/tasks", authenticate, isAdmin, (req, res) => {
    const { title, reward, category, type, icon, link } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    db.prepare("INSERT INTO tasks (id, title, reward, category, type, icon, link) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, title, reward, category, type, icon, link);
    res.json({ id });
  });

  app.delete("/api/admin/tasks/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
