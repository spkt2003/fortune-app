import { describe, expect, it } from "vitest";
import { parseFortuneResponse } from "./parseFortuneResponse";

const validJson = '{"career":"งานดี","love":"รักดี","health":"สุขภาพดี","finance":"เงินดี"}';

describe("parseFortuneResponse", () => {
  it("parses plain JSON with all 4 keys", () => {
    expect(parseFortuneResponse(validJson)).toEqual({
      career: "งานดี",
      love: "รักดี",
      health: "สุขภาพดี",
      finance: "เงินดี",
    });
  });

  it("strips a ```json code fence before parsing", () => {
    const fenced = "```json\n" + validJson + "\n```";
    expect(parseFortuneResponse(fenced)).toEqual({
      career: "งานดี",
      love: "รักดี",
      health: "สุขภาพดี",
      finance: "เงินดี",
    });
  });

  it("strips a plain ``` code fence (no json label) before parsing", () => {
    const fenced = "```\n" + validJson + "\n```";
    expect(parseFortuneResponse(fenced)).toEqual({
      career: "งานดี",
      love: "รักดี",
      health: "สุขภาพดี",
      finance: "เงินดี",
    });
  });

  it("returns null when a required key is missing", () => {
    const missingKey = '{"career":"งานดี","love":"รักดี","health":"สุขภาพดี"}';
    expect(parseFortuneResponse(missingKey)).toBeNull();
  });

  it("returns null on invalid JSON syntax rather than throwing", () => {
    expect(parseFortuneResponse("{ not valid json ")).toBeNull();
  });

  it("still parses when extra keys are present", () => {
    const extra = '{"career":"งานดี","love":"รักดี","health":"สุขภาพดี","finance":"เงินดี","extra":"x"}';
    expect(parseFortuneResponse(extra)).toEqual({
      career: "งานดี",
      love: "รักดี",
      health: "สุขภาพดี",
      finance: "เงินดี",
    });
  });
});
