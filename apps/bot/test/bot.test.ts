import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeChannelUsername, isValidUsernameFormat } from "../src/utils/channel-validator.js";
import { UZ_STRINGS } from "../src/messages/uzbek.js";

describe("Bot Channel Validation & Uzbek UI Copy", () => {
  it("sanitizeChannelUsername should strip @, urls, and query strings", () => {
    assert.equal(sanitizeChannelUsername("@daryouz"), "daryouz");
    assert.equal(sanitizeChannelUsername("https://t.me/spotuz"), "spotuz");
    assert.equal(sanitizeChannelUsername("https://t.me/s/gazetauz?ref=123"), "gazetauz");
    assert.equal(sanitizeChannelUsername("KunUz"), "kunuz");
  });

  it("isValidUsernameFormat should validate correct Telegram channel handles", () => {
    assert.equal(isValidUsernameFormat("daryouz"), true);
    assert.equal(isValidUsernameFormat("it_news_uz"), true);
    assert.equal(isValidUsernameFormat("a"), false); // too short
    assert.equal(isValidUsernameFormat("invalid@char!"), false);
  });

  it("UZ_STRINGS should have all required Uzbek onboarding texts", () => {
    assert.ok(UZ_STRINGS.welcome.includes("Telegram Radar"));
    assert.ok(UZ_STRINGS.welcome.includes("qisqa xulosa"));
    assert.ok(UZ_STRINGS.chooseInterestsTitle.includes("Qiziqishlaringizni tanlang"));
    assert.ok(UZ_STRINGS.addChannelsTitle.includes("Kuzatmoqchi bo'lgan kanallaringizni"));

    const completeMsg = UZ_STRINGS.onboardingComplete(5, ["AI", "Startap"]);
    assert.ok(completeMsg.includes("5 ta"));
    assert.ok(completeMsg.includes("AI, Startap"));
    assert.ok(completeMsg.includes("09:00"));
    assert.ok(completeMsg.includes("20:00"));
    assert.ok(completeMsg.includes("/stop"));
  });

  it("channelAddedSuccess should format Uzbek notification with channel name and count", () => {
    const msg = UZ_STRINGS.channelAddedSuccess("spotuz", "Spot Yangiliklari", 3);
    assert.ok(msg.includes("Spot Yangiliklari"));
    assert.ok(msg.includes("@spotuz"));
    assert.ok(msg.includes("3 ta"));
  });
});
