import { Context } from "grammy";
import { prisma } from "@radar/database";
import { UZ_STRINGS } from "../messages/uzbek.js";
import { buildInterestsKeyboard } from "./interests.js";
import { logger } from "../utils/logger.js";

export async function handleStart(ctx: Context): Promise<void> {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const username = ctx.from.username ?? null;

  logger.info(`User initiated /start: TG=${telegramId} (@${username})`);

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      username,
      isActive: true, // reactivate if previously stopped
    },
    create: {
      telegramId,
      username,
      isActive: true,
      digestHourUtc: 4, // 09:00 Tashkent time
    },
  });

  // 1. Send Welcome text
  await ctx.reply(UZ_STRINGS.welcome, { parse_mode: "Markdown" });

  // 2. Send Interest selection keyboard
  const keyboard = await buildInterestsKeyboard(user.id);
  await ctx.reply(UZ_STRINGS.chooseInterestsTitle, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

export async function handleInterestsCommand(ctx: Context): Promise<void> {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    await ctx.reply("Iltimos, avval /start buyrug'ini yuboring.");
    return;
  }

  const keyboard = await buildInterestsKeyboard(user.id);
  await ctx.reply(UZ_STRINGS.chooseInterestsTitle, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}
