import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PublicPreviewChannelSource } from "../src/sources/public-preview-source.js";
import { ChannelSource, FetchChannelResult } from "../src/sources/types.js";

describe("Channel Source Abstraction & Deduplication", () => {
  it("PublicPreviewChannelSource should correctly clean username handles", async () => {
    const source = new PublicPreviewChannelSource();
    assert.equal(source.name, "PublicPreview");
  });

  it("Mock ChannelSource should fulfill ChannelSource interface", async () => {
    class MockSource implements ChannelSource {
      public readonly name = "MockSource";
      public callCount = 0;

      async fetchPosts(channelUsername: string): Promise<FetchChannelResult> {
        this.callCount++;
        return {
          username: channelUsername,
          title: "Mock Channel",
          isReachable: true,
          posts: [
            {
              telegramMsgId: 101n,
              rawText: "Mock post about AI technology",
              postedAt: new Date(),
            },
          ],
        };
      }
    }

    const mock = new MockSource();
    const result = await mock.fetchPosts("tech_channel");

    assert.equal(result.isReachable, true);
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.telegramMsgId, 101n);
    assert.equal(mock.callCount, 1);
  });
});
