import { Context } from "grammy";
import { UZ_STRINGS } from "../messages/uzbek.js";

export async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(UZ_STRINGS.helpText, { parse_mode: "Markdown" });
}
