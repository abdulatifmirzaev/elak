/**
 * Domain entity types and shared contracts for Telegram Trend & Pain-Point Radar.
 */

export type DigestStatus = "sent" | "failed" | "skipped_no_updates";

export interface UserDTO {
  id: string;
  telegramId: string; // Serialized BigInt
  username?: string | null;
  isActive: boolean;
  digestHourUtc: number;
  createdAt: Date;
}

export interface InterestDTO {
  id: string;
  name: string;
}

export interface ChannelDTO {
  id: string;
  username: string;
  title?: string | null;
  lastScrapedAt?: Date | null;
  isReachable: boolean;
}

export interface PostDTO {
  id: string;
  channelId: string;
  telegramMsgId: string; // Serialized BigInt
  rawText?: string | null;
  summary?: string | null;
  category?: string | null;
  postedAt?: Date | null;
  fetchedAt: Date;
}

export interface DigestDTO {
  id: string;
  userId: string;
  sentAt: Date;
  status: DigestStatus;
  postIds: string[];
}

export interface ChannelPostItem {
  channelUsername: string;
  channelTitle?: string;
  telegramMsgId: number | bigint;
  postUrl: string;
  summary: string;
  category?: string;
}

export interface BuiltDigest {
  userId: string;
  telegramId: number | bigint;
  items: ChannelPostItem[];
  formattedMessage: string;
  postIds: string[];
}

export interface RawScrapedPost {
  telegramMsgId: bigint;
  rawText: string;
  postedAt?: Date;
  mediaType?: "text" | "photo" | "video" | "document";
}

export interface ChannelSourceResult {
  channelUsername: string;
  channelTitle?: string;
  isReachable: boolean;
  posts: RawScrapedPost[];
  error?: string;
}
