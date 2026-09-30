import { InlineKeyboard } from "grammy";
import { prisma } from "@radar/database";

export async function buildInterestsKeyboard(userId: string): Promise<InlineKeyboard> {
  const allInterests = await prisma.interest.findMany({
    orderBy: { name: "asc" },
  });

  const userInterests = await prisma.userInterest.findMany({
    where: { userId },
    select: { interestId: true },
  });

  const selectedSet = new Set(userInterests.map((ui) => ui.interestId));

  const keyboard = new InlineKeyboard();

  // Lay out buttons in 2 columns
  for (let i = 0; i < allInterests.length; i += 2) {
    const item1 = allInterests[i]!;
    const isSel1 = selectedSet.has(item1.id);
    const text1 = `${isSel1 ? "✅ " : ""}${item1.name}`;
    keyboard.text(text1, `interest:toggle:${item1.id}`);

    if (i + 1 < allInterests.length) {
      const item2 = allInterests[i + 1]!;
      const isSel2 = selectedSet.has(item2.id);
      const text2 = `${isSel2 ? "✅ " : ""}${item2.name}`;
      keyboard.text(text2, `interest:toggle:${item2.id}`);
    }

    keyboard.row();
  }

  // Add Continue button
  keyboard.row().text("Davom etish ➡️", "interest:continue");

  return keyboard;
}
