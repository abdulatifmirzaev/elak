import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BuiltDigest, ChannelPostItem } from "../src/index.js";

describe("Shared Domain Types", () => {
  it("should define ChannelPostItem structure correctly", () => {
    const item: ChannelPostItem = {
      channelUsername: "testchannel",
      channelTitle: "Test Channel",
      telegramMsgId: 100n,
      postUrl: "https://t.me/testchannel/100",
      summary: "Sinov xabari",
      category: "Texnologiya",
    };

    assert.equal(item.channelUsername, "testchannel");
    assert.equal(item.telegramMsgId, 100n);
  });

  it("should define BuiltDigest structure correctly", () => {
    const digest: BuiltDigest = {
      userId: "u123",
      telegramId: 999999999n,
      items: [],
      formattedMessage: "📰 Bugungi yangiliklar",
      postIds: ["p1", "p2"],
    };

    assert.equal(digest.userId, "u123");
    assert.equal(digest.postIds.length, 2);
  });
});
