import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DigestBuilderService, ChannelDigestItem } from "../src/services/digest-builder.js";
import { ThrottledDeliveryQueue, MessageSender } from "../src/services/delivery-queue.js";

describe("Digest Builder & Throttled Delivery Queue", () => {
  it("formatDigest should generate format matching Section 5", () => {
    const builder = new DigestBuilderService();
    const items: ChannelDigestItem[] = [
      {
        channelUsername: "texno_yangilik",
        channelTitle: "Texno Yangiliklar",
        telegramMsgId: 12345n,
        postUrl: "https://t.me/texno_yangilik/12345",
        summary: "Yangi AI vositasi taqdim etildi va sinovdan o'tkazildi.",
        category: "AI",
        postId: "post-1",
      },
      {
        channelUsername: "biznes_tahlil",
        channelTitle: "Biznes Tahlil",
        telegramMsgId: 67890n,
        postUrl: "https://t.me/biznes_tahlil/67890",
        summary: "Mahalliy startaplar yangi bozorlarga chiqmoqda.",
        category: "Biznes",
        postId: "post-2",
      },
    ];

    const messages = builder.formatDigest(items);
    assert.equal(messages.length, 1);
    const msg = messages[0]!;

    // Verify Section 5 requirements:
    assert.ok(msg.startsWith("📰 Bugungi yangiliklar"));
    assert.ok(msg.includes("▸ @texno_yangilik"));
    assert.ok(msg.includes("Yangi AI vositasi taqdim etildi"));
    assert.ok(msg.includes("Batafsil: https://t.me/texno_yangilik/12345"));
    assert.ok(msg.includes("▸ @biznes_tahlil"));
    assert.ok(msg.includes("Batafsil: https://t.me/biznes_tahlil/67890"));
  });

  it("formatDigest should return empty array for empty items", () => {
    const builder = new DigestBuilderService();
    const messages = builder.formatDigest([]);
    assert.deepEqual(messages, []);
  });

  it("ThrottledDeliveryQueue should throttle messages properly", async () => {
    class MockSender implements MessageSender {
      public sentTimes: number[] = [];
      async sendMessage(_chatId: string | number | bigint, _text: string): Promise<boolean> {
        this.sentTimes.push(Date.now());
        return true;
      }
    }

    const mockSender = new MockSender();
    // Use smaller intervals for test speed: 50ms per chat, 10ms global
    const queue = new ThrottledDeliveryQueue(mockSender, {
      minPerChatIntervalMs: 50,
      minGlobalIntervalMs: 10,
      persistToDb: false,
    });

    const testPayload = [
      {
        userId: "user-1",
        telegramId: 111111n,
        items: [],
        formattedMessages: ["Msg 1 for user 1", "Msg 2 for user 1"],
        postIds: [],
      },
    ];

    await queue.deliverDigests(testPayload);

    assert.equal(mockSender.sentTimes.length, 2);
    const diff = (mockSender.sentTimes[1] ?? 0) - (mockSender.sentTimes[0] ?? 0);
    assert.ok(diff >= 45, `Expected per-chat delay of at least 45ms, got ${diff}ms`);
  });
});
