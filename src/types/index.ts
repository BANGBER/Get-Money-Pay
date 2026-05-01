export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  balance: number;
  totalEarned: number;
  referralCode: string;
  referredBy?: string;
  dailyAdsWatched: number;
  lastAdResetAt: string;
  isAdmin?: boolean;
  createdAt: string;
  paypalEmail?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  type: 'telegram_join' | 'telegram_bot' | 'youtube_sub' | 'facebook_follow' | 'other';
  isActive: boolean;
  createdAt: string;
}

export interface AdConfig {
  id: string;
  providerName: string;
  scriptUrl: string;
  reward: number;
  duration: number;
  cta: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'ad_reward' | 'task_reward' | 'referral_reward' | 'withdrawal';
  description: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  paypalEmail: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface AppStats {
  minWithdrawal: number;
  adReward: number;
  maxDailyAds: number;
  totalUsers: number;
  totalPaidOut: number;
}
