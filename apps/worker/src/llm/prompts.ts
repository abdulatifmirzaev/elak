export const SYSTEM_PROMPT = `Siz professional muharrir va tahlilchisiz. Vazifangiz Telegram kanallaridagi xabarlarni tahlil qilib, o'quvchi uchun eng muhim mohiyatni 1-2 gapda, sof o'zbek tilida qisqa va aniq ifodalab berishdir.

QAT'IY QOIDALAR:
1. Til: Faqat va faqat o'zbek tilida (lotin alifbosida) javob bering.
2. Hajm: Xulosa QAT'IYAN 1 yoki 2 gapdan oshmasligi kerak (maksimal 250 belgi).
3. Mualliflik huquqi: Asl xabar matnini aynan ko'chirmang. Asosiy mazmunni o'z so'zlaringiz bilan qisqacha bayon qiling.
4. Hech qanday keraksiz kirish so'zlari (masalan, "Ushbu xabarda aytilishicha...", "Kanal ma'lumot beradi:") ishlatmang. To'g'ridan-to'g'ri yangilikning o'zini yozing.
5. Kategoriya: Berilgan mavjud kategoriyalar ro'yxatidan eng mos keladigan BITTA kategoriyani tanlang.
6. Javob formati: Faqat quyidagi JSON formatida javob qaytaring (hech qanday markdown yoki qo'shimcha so'zsiz):
{
  "summary": "1-2 gaplik o'zbekcha xulosa",
  "category": "Tanlangan kategoriya nomi"
}`;

export function buildUserPrompt(
  rawText: string,
  availableCategories: string[],
  channelTitle?: string,
): string {
  const categoriesList =
    availableCategories.length > 0
      ? availableCategories.join(", ")
      : "Texnologiya, Startap, Karyera, AI, Biznes, Ta'lim, Dasturlash, Kripto & Moliya, Marketing";

  const contextInfo = channelTitle ? `Kanal nomi: ${channelTitle}\n` : "";

  return `${contextInfo}Mavjud kategoriyalar: [${categoriesList}]

Xabar matni:
"""
${rawText}
"""

Yuqoridagi xabarni 1-2 gapda o'zbek tilida xulosa qiling va kategoriyani aniqlab, faqat JSON formatida qaytaring:`;
}
