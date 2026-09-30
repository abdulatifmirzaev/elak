import { Context, InlineKeyboard } from "grammy";
import { prisma } from "@radar/database";
import { UZ_STRINGS } from "../messages/uzbek.js";
import { logger } from "../utils/logger.js";

export async function handleStopCommand(ctx: Context): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("Ha, to'xtatish 🛑", "stop:confirm")
    .text("Bekor qilish ↩️", "stop:cancel");

  await ctx.reply(UZ_STRINGS.stopConfirmTitle, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

export async function handleStopCallback(
  ctx: Context,
  action: "confirm" | "cancel",
): Promise<void> {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);

  if (action === "confirm") {
    await prisma.user.updateMany({
      where: { telegramId },
      data: { isActive: false },
    });
    logger.info(`User TG=${telegramId} deactivated subscriptions via /stop`);

    await ctx.answerCallbackQuery({ text: "Obuna to'xtatildi" });
    await ctx.editMessageText(UZ_STRINGS.stopConfirmed);
  } else {
    await ctx.answerCallbackQuery({ text: "Bekor qilindi" });
    await ctx.editMessageText(UZ_STRINGS.stopCancelled);
  }
}
