export const UZ_STRINGS = {
  welcome: `👋 Assalomu alaykum! **Telegram Radar** botiga xush kelibsiz.

Ushbu bot siz kuzatadigan ommaviy Telegram kanallaridagi yuzlab xabarlarni saralab, kuniga **atigi 2 marta** (ertalab va kechqurun) eng muhim yangiliklarning 1-2 gaplik qisqa xulosasini taqdim etadi.

Kun bo'yi vaqtingizni tejang va asosiy voqealardan doimo xabardor bo'ling!`,

  chooseInterestsTitle: `📌 **1-qadam: Qiziqishlaringizni tanlang**

Qaysi mavzudagi xabarlar siz uchun eng muhim? Kerakli mavzularni bosing (bir nechtasini tanlash mumkin) va so'ngra **«Davom etish ➡️»** tugmasini bosing:`,

  continueButton: "Davom etish ➡️",
  readyButton: "Tayyor ✅",

  addChannelsTitle: `📢 **2-qadam: Kuzatmoqchi bo'lgan kanallaringizni qo'shing**

Siz o'zingiz kuzatadigan ommaviy Telegram kanallari username'ini yuboring (masalan: \`@spotuz\` yoki \`spotuz\`) yoki o'sha kanaldan biror xabarni menga forward (yo'naltirish) qiling.

Maksimal 15 tagacha kanal qo'shishingiz mumkin. Barcha kanallarni qo'shib bo'lgach, **«Tayyor ✅»** tugmasini bosing:`,

  channelAddedSuccess: (username: string, title?: string | null, total?: number) =>
    `✅ **Kanal qo'shildi:** ${title ? `${title} (` : ""}@${username}${title ? ")" : ""}
Hozirda jami kanallaringiz: ${total ?? 1} ta.

Yana boshqa kanal yuborishingiz yoki yakunlash uchun **«Tayyor ✅»** tugmasini bosishingiz mumkin.`,

  channelAlreadyAdded: (username: string) =>
    `ℹ️ **@${username}** kanali allaqachon ro'yxatingizda mavjud.`,

  channelInvalid: `⚠️ Kanal nomi noto'g'ri yoki kanal topilmadi. Iltimos, kanal ommaviy (public) ekanligiga ishonch hosil qiling va username'ni to'g'ri kiriting (masalan: \`@kanalnomi\`).`,

  channelLimitReached: `⚠️ Siz ruxsat etilgan maksimal miqdordagi (15 ta) kanallarni qo'shib bo'ldingiz.`,

  onboardingComplete: (channelCount: number, interestNames: string[]) =>
    `🎉 **Tabriklaymiz, barcha sozlamalar muvaffaqiyatli saqlandi!**

📊 **Sizning tanlovlaringiz:**
• Tanlangan mavzular: ${interestNames.length > 0 ? interestNames.join(", ") : "Barchasi"}
• Kuzatilayotgan kanallar: ${channelCount} ta

⏰ **Bülleten jadvali:**
Siz har kuni **2 marta** — ertalab soat 09:00 da va kechqurun 20:00 da saralangan qisqa xulosalarni olasiz. Har bir yangilik ostida asl manbaga havola (\`Batafsil: ...\`) bo'ladi.

💡 **Foydali komandalar:**
/mychannels — Kanallaringizni ko'rish va o'chirish
/addchannel — Yangi kanal qo'shish
/interests — Qiziqishlarni o'zgartirish
/stop — Obunani to'xtatish
/help — Bot bo'yicha yordam`,

  myChannelsTitle: (count: number) =>
    `📋 **Siz kuzatib borayotgan kanallar (${count} ta):**\nO'chirmoqchi bo'lgan kanal ustiga bosing:`,

  noChannelsYet: `Siz hali birorta ham kanal qo'shmadingiz. Kanal qo'shish uchun /addchannel buyrug'idan foydalaning.`,

  channelDeleted: (username: string) =>
    `🗑 **@${username}** kanali ro'yxatingizdan muvaffaqiyatli o'chirildi.`,

  addChannelPrompt: `Qo'shmoqchi bo'lgan ommaviy kanal username'ini yuboring (masalan: \`@kanalnomi\`):`,

  interestsUpdated: `✅ Qiziqishlaringiz muvaffaqiyatli yangilandi!`,

  stopConfirmTitle: `⚠️ **Bülletenlarni to'xtatish**

Haqiqatan ham kunlik yangiliklar xulosasini olishni to'xtatmoqchimisiz? To'xtatilsa, sizga boshqa hech qanday xabar yuborilmaydi.`,

  stopConfirmed: `🛑 Sizning obunangiz to'xtatildi. Endi sizga bülletenlar yuborilmaydi.\n\nQayta faollashtirish uchun istalgan vaqtda /start buyrug'ini yuborishingiz mumkin.`,

  stopCancelled: `✅ Obuna davom ettiriladi. Kunlik bülletenlar o'z vaqtida yetkaziladi.`,

  helpText: `🤖 **Telegram Radar Yordam Qo'llanmasi**

Bot sizga yoqqan Telegram kanallarining eng sara xulosalarini kuniga 2 marta yetkazib beruvchi aqlli yordamchingizdir.

📌 **Mavjud buyruqlar:**
• /start — Botni qayta ishga tushirish va sozlamalarni yangilash
• /mychannels — Kuzatilayotgan kanallar ro'yxati va ularni o'chirish
• /addchannel — Yangi ommaviy kanal qo'shish
• /interests — Qiziqqan mavzularingizni qayta tanlash
• /stop — Yangiliklar bülletenini to'xtatish (obunani bekor qilish)
• /help — Ushbu yordam xabarini ko'rish

Har qanday savol yoki takliflar bo'yicha biz bilan bog'lanishingiz mumkin.`,
};
