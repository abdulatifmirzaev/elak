import { Bot } from "grammy";

export interface ChannelValidationResult {
  isValid: boolean;
  username: string;
  title?: string;
  error?: string;
}

export function sanitizeChannelUsername(input: string): string {
  let clean = input.trim();
  // Remove full t.me/ URL if user pasted a link
  clean = clean.replace(/^https?:\/\/t\.me\/(s\/)?/, "");
  // Remove @ symbol
  clean = clean.replace(/^@/, "");
  // Remove query params or trailing slashes
  clean = clean.split("/")[0] || "";
  clean = clean.split("?")[0] || "";
  return clean.toLowerCase().trim();
}

export function isValidUsernameFormat(username: string): boolean {
  // Telegram channel usernames are 4-32 characters, alphanumeric + underscore, cannot start with number or underscore
  return /^[a-zA-Z0-9_]{4,32}$/.test(username);
}

export async function validateChannelWithBot(
  bot: Bot,
  rawInput: string,
): Promise<ChannelValidationResult> {
  const username = sanitizeChannelUsername(rawInput);

  if (!isValidUsernameFormat(username)) {
    return {
      isValid: false,
      username,
      error: "Username formati noto'g'ri (faqat 4-32 ta harf, raqam va pastki chiziq)",
    };
  }

  // 1. Try official Bot API getChat
  try {
    const chat = await bot.api.getChat(`@${username}`);
    const title = "title" in chat ? chat.title : undefined;
    return {
      isValid: true,
      username,
      title,
    };
  } catch (err: unknown) {
    const errStr = String(err);
    // If not found in Bot API (e.g. chat not found), try public preview fallback check
    if (errStr.includes("chat not found") || errStr.includes("400")) {
      try {
        const previewUrl = `https://t.me/s/${username}`;
        const res = await fetch(previewUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; TelegramRadarBot/1.0)",
          },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const text = await res.text();
          if (
            !text.includes("tgme_page_error") &&
            !text.includes("If you have <strong>Telegram</strong>, you can contact")
          ) {
            // Extract title roughly from title tag
            const titleMatch = text.match(/<title>Telegram: Contact @([^<]+)<\/title>/);
            const title = titleMatch ? titleMatch[1] : undefined;
            return {
              isValid: true,
              username,
              title,
            };
          }
        }
      } catch {
        // Fallback network error
      }
    }

    return {
      isValid: false,
      username,
      error: "Kanal topilmadi yoki yopiq (private) kanal.",
    };
  }
}
