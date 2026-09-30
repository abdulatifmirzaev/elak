import { Bot } from "grammy";
import { prisma } from "@radar/database";
import { handleStart, handleInterestsCommand } from "./handlers/start.js";
import { buildInterestsKeyboard } from "./handlers/interests.js";
import {
  handleIncomingMessage,
  handleAddChannelCommand,
  getReadyKeyboard,
} from "./handlers/channels.js";
import { handleMyChannels, handleChannelDeleteCallback } from "./handlers/mychannels.js";
import { handleStopCommand, handleStopCallback } from "./handlers/stop.js";
import { handleHelp } from "./handlers/help.js";
import { UZ_STRINGS } from "./messages/uzbek.js";
import { logger } from "./utils/logger.js";

export function createBot(token?: string): Bot {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to initialize Telegram Bot");
  }

  const bot = new Bot(botToken);

  // Set bot commands menu for Telegram clients
  bot.api
    .setMyCommands([
      { command: "start", description: "Botni ishga tushirish" },
      { command: "mychannels", description: "Kuzatilayotgan kanallar" },
      { command: "addchannel", description: "Yangi kanal qo'shish" },
      { command: "interests", description: "Mavzularni tanlash" },
      { command: "stop", description: "Bülletenlarni to'xtatish" },
      { command: "help", description: "Yordam va qo'llanma" },
    ])
    .catch((err) => {
      logger.warn("Could not set bot commands menu", { error: String(err) });
    });

  // 1. Register Commands
  bot.command("start", handleStart);
  bot.command("interests", handleInterestsCommand);
  bot.command("mychannels", handleMyChannels);
  bot.command("removechannel", handleMyChannels);
  bot.command("addchannel", handleAddChannelCommand);
  bot.command("stop", handleStopCommand);
  bot.command("help", handleHelp);

  // 2. Register Callback Queries
  bot.callbackQuery(/^interest:toggle:(.+)$/, async (ctx) => {
    if (!ctx.from) return;
    const telegramId = BigInt(ctx.from.id);
    const interestId = ctx.match[1];
    if (!interestId) return;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return;

    // Toggle user interest
    const existing = await prisma.userInterest.findUnique({
      where: {
        userId_interestId: {
          userId: user.id,
          interestId,
        },
      },
    });

    if (existing) {
      await prisma.userInterest.delete({
        where: {
          userId_interestId: {
            userId: user.id,
            interestId,
          },
        },
      });
    } else {
      await prisma.userInterest.create({
        data: {
          userId: user.id,
          interestId,
        },
      });
    }

    const updatedKeyboard = await buildInterestsKeyboard(user.id);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: updatedKeyboard });
      await ctx.answerCallbackQuery();
    } catch {
      // Ignore identical markup error
      await ctx.answerCallbackQuery();
    }
  });

  bot.callbackQuery("interest:continue", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(UZ_STRINGS.addChannelsTitle, {
      parse_mode: "Markdown",
      reply_markup: getReadyKeyboard(),
    });
  });

  bot.callbackQuery(/^channel:delete:(.+)$/, async (ctx) => {
    const channelId = ctx.match[1];
    if (channelId) {
      await handleChannelDeleteCallback(ctx, channelId);
    }
  });

  bot.callbackQuery("stop:confirm", async (ctx) => {
    await handleStopCallback(ctx, "confirm");
  });

  bot.callbackQuery("stop:cancel", async (ctx) => {
    await handleStopCallback(ctx, "cancel");
  });

  // 3. Register Incoming Message Handler
  bot.on("message", async (ctx) => {
    await handleIncomingMessage(ctx, bot);
  });

  bot.catch((err) => {
    logger.error("Unhandled error in bot update handler", { error: String(err) });
  });

  return bot;
}
