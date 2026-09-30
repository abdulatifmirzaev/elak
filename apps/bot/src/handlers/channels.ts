import { Context, Bot, Keyboard } from "grammy";
import { prisma } from "@radar/database";
import { UZ_STRINGS } from "../messages/uzbek.js";
import { validateChannelWithBot, sanitizeChannelUsername } from "../utils/channel-validator.js";
import { logger } from "../utils/logger.js";

const MAX_CHANNELS_PER_USER = 15;

export function getReadyKeyboard(): Keyboard {
  return new Keyboard().text(UZ_STRINGS.readyButton).resized().oneTime();
}

export async function sendOnboardingConfirmation(ctx: Context, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      channels: true,
      interests: {
        include: {
          interest: true,
        },
      },
    },
  });

  if (!user) return;

  const channelCount = user.channels.length;
  const interestNames = user.interests.map((i) => i.interest.name);

  await ctx.reply(UZ_STRINGS.onboardingComplete(channelCount, interestNames), {
    parse_mode: "Markdown",
    reply_markup: { remove_keyboard: true },
  });
}

export async function handleAddChannelCommand(ctx: Context): Promise<void> {
  await ctx.reply(UZ_STRINGS.addChannelPrompt, {
    parse_mode: "Markdown",
    reply_markup: getReadyKeyboard(),
  });
}

export async function handleIncomingMessage(ctx: Context, bot: Bot): Promise<void> {
  if (!ctx.from || !ctx.message) return;

  const text = ctx.message.text?.trim() || "";

  // Check if user clicked "Tayyor ✅"
  if (text === UZ_STRINGS.readyButton || text.toLowerCase() === "tayyor") {
    const telegramId = BigInt(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (user) {
      await sendOnboardingConfirmation(ctx, user.id);
    }
    return;
  }

  // If message starts with a slash command, ignore (it is handled by command handlers)
  if (text.startsWith("/")) return;

  let rawChannelInput = text;

  // Check if forwarded from a channel
  if (ctx.message.forward_origin && ctx.message.forward_origin.type === "channel") {
    const chat = ctx.message.forward_origin.chat;
    if (chat.username) {
      rawChannelInput = chat.username;
    }
  }

  if (!rawChannelInput) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      channels: true,
    },
  });

  if (!user) {
    await ctx.reply("Iltimos, avval /start buyrug'ini yuboring.");
    return;
  }

  // Check channel limit
  if (user.channels.length >= MAX_CHANNELS_PER_USER) {
    await ctx.reply(UZ_STRINGS.channelLimitReached);
    return;
  }

  const cleanUser = sanitizeChannelUsername(rawChannelInput);
  if (!cleanUser) {
    await ctx.reply(UZ_STRINGS.channelInvalid, { parse_mode: "Markdown" });
    return;
  }

  // Check if already in user's channels
  const existingUserChannel = await prisma.userChannel.findFirst({
    where: {
      userId: user.id,
      channel: {
        username: cleanUser,
      },
    },
  });

  if (existingUserChannel) {
    await ctx.reply(UZ_STRINGS.channelAlreadyAdded(cleanUser), {
      parse_mode: "Markdown",
      reply_markup: getReadyKeyboard(),
    });
    return;
  }

  // Validate channel
  const validation = await validateChannelWithBot(bot, cleanUser);
  if (!validation.isValid) {
    await ctx.reply(UZ_STRINGS.channelInvalid, { parse_mode: "Markdown" });
    return;
  }

  // Upsert Channel and connect to User
  const channel = await prisma.channel.upsert({
    where: { username: cleanUser },
    update: {
      title: validation.title ?? undefined,
      isReachable: true,
    },
    create: {
      username: cleanUser,
      title: validation.title ?? undefined,
      isReachable: true,
    },
  });

  await prisma.userChannel.create({
    data: {
      userId: user.id,
      channelId: channel.id,
    },
  });

  const updatedCount = user.channels.length + 1;
  logger.info(`User ${user.id} added channel @${cleanUser} (total: ${updatedCount})`);

  await ctx.reply(UZ_STRINGS.channelAddedSuccess(cleanUser, validation.title, updatedCount), {
    parse_mode: "Markdown",
    reply_markup: getReadyKeyboard(),
  });
}
