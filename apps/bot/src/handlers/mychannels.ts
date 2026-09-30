import { Context, InlineKeyboard } from "grammy";
import { prisma } from "@radar/database";
import { UZ_STRINGS } from "../messages/uzbek.js";
import { logger } from "../utils/logger.js";

export async function handleMyChannels(ctx: Context): Promise<void> {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      channels: {
        include: {
          channel: true,
        },
      },
    },
  });

  if (!user || user.channels.length === 0) {
    await ctx.reply(UZ_STRINGS.noChannelsYet);
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const uc of user.channels) {
    const titleText = uc.channel.title
      ? `${uc.channel.title} (@${uc.channel.username})`
      : `@${uc.channel.username}`;
    keyboard.text(`🗑 ${titleText}`, `channel:delete:${uc.channelId}`).row();
  }

  await ctx.reply(UZ_STRINGS.myChannelsTitle(user.channels.length), {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

export async function handleChannelDeleteCallback(ctx: Context, channelId: string): Promise<void> {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  await prisma.userChannel.deleteMany({
    where: {
      userId: user.id,
      channelId,
    },
  });

  const username = channel ? channel.username : "kanal";
  logger.info(`User ${user.id} removed channel @${username}`);

  await ctx.answerCallbackQuery({
    text: `@${username} ro'yxatdan o'chirildi`,
  });

  // Fetch remaining channels
  const remaining = await prisma.userChannel.findMany({
    where: { userId: user.id },
    include: { channel: true },
  });

  if (remaining.length === 0) {
    await ctx.editMessageText(UZ_STRINGS.noChannelsYet);
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const uc of remaining) {
    const titleText = uc.channel.title
      ? `${uc.channel.title} (@${uc.channel.username})`
      : `@${uc.channel.username}`;
    keyboard.text(`🗑 ${titleText}`, `channel:delete:${uc.channelId}`).row();
  }

  await ctx.editMessageText(UZ_STRINGS.myChannelsTitle(remaining.length), {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}
