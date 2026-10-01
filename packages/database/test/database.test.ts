import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serializeBigInt } from "../src/index.js";

describe("Database Utilities & Serialization", () => {
  it("serializeBigInt should convert BigInt values into strings cleanly", () => {
    const raw = {
      id: "user-1",
      telegramId: 123456789012345n,
      posts: [
        {
          telegramMsgId: 987654321n,
          title: "Post Title",
        },
      ],
    };

    const serialized = serializeBigInt(raw);

    assert.equal(serialized.id, "user-1");
    assert.equal(serialized.telegramId, "123456789012345");
    assert.equal(serialized.posts[0]?.telegramMsgId, "987654321");

    // Must be safely JSON serializable
    const jsonStr = JSON.stringify(serialized);
    assert.ok(jsonStr.includes('"123456789012345"'));
  });
});
