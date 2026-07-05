export interface VideoDownloadOption {
  id: string;
  type: 'raw' | 'hardcoded';
  resolution: '480p' | '720p' | '1080p';
  sourceName: string; // e.g. "Telegram", "Pixeldrain"
  url: string;
  videoType?: string;
  videoSize?: string;
  additionalDetails?: string;
}

export interface Subtitle {
  id: string;
  slug?: string;
  type: 'movie' | 'series';
  movieTitle: string;
  season?: number;
  episode?: number;
  releaseYear: number;
  language: string;
  genres: string[];
  description: string;
  downloadLink: string;
  telegramLink?: string;
  watchOnlineLink?: string;
  videoOptions?: VideoDownloadOption[];
  videoLinks?: any;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  averageRating: number;
  ratingCount: number;
  downloadCount?: number;
  proOnlyUntil?: string;
  tmdbId?: number;
  posterPath?: string;
  backdropPath?: string;
  isAdult?: boolean;
  parentalRating?: string;
  parentalDescription?: string;
  parentsGuide?: {
    sex: { severity: 'None' | 'Mild' | 'Moderate' | 'Severe'; description: string };
    violence: { severity: 'None' | 'Mild' | 'Moderate' | 'Severe'; description: string };
    profanity: { severity: 'None' | 'Mild' | 'Moderate' | 'Severe'; description: string };
    alcohol: { severity: 'None' | 'Mild' | 'Moderate' | 'Severe'; description: string };
    frightening: { severity: 'None' | 'Mild' | 'Moderate' | 'Severe'; description: string };
  };
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  subtitleId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  userName: string;
  contactInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'paid';
  requestedAt: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'creator' | 'user';
  proExpiry: string | null;
  walletBalance: number;
  dailyDownloadCount: number;
  lastDownloadResetDate: string;
  totalUploads: number;
  totalDownloads: number;
  isEligibleForMonetization: boolean;
  monetizationStatus: 'locked' | 'pending_review' | 'approved';
  isAdultVerified?: boolean;
  bio?: string;
  watchlist?: string[];
  watched?: string[];
  seriesWatchlist?: string[];
}

export interface DownloadRecord {
  id: string;
  userId: string;
  subtitleId: string;
  creatorId: string;
  downloadedAt: string;
  isProDownload: boolean;
  subtitleTitle?: string; // For display in history
  adPaidStatus?: 'unpaid' | 'paid';
  proPaidStatus?: 'unpaid' | 'paid';
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  subtitleId: string;
  subtitleTitle: string;
  reason: 'broken_link' | 'inappropriate' | 'wrong_content' | 'other';
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  campaignName: string;
  type: 'direct' | 'adsterra';
  format?: 'native' | '160x600' | '160x300' | '320x50' | '728x90' | '300x250' | '468x60';
  zone: string;
  imageUrl?: string;
  targetUrl?: string;
  isActive: boolean;
  createdAt: string;
  displayFrequency?: number;
}

export interface SubtitleRequest {
  id: string;
  userId: string;
  userName: string;
  isPro: boolean;
  title: string;
  type: 'movie' | 'series';
  year?: number;
  additionalInfo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'rating' | 'approval' | 'general' | 'comment';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Comment {
  id: string;
  subtitleId: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  content: string;
  createdAt: string;
  parentId?: string;
  likesCount?: number;
  likedBy?: string[];
  rootUserId?: string;
}
