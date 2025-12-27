import { jest } from "@jest/globals";
import { SessionCache } from "../src/session-cache.ts";

describe("SessionCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("stores and retrieves values until TTL expires", () => {
    const cache = new SessionCache(100);

    cache.set("session-a", "lists", ["milk"]);
    expect(cache.get("session-a", "lists")).toEqual(["milk"]);

    jest.advanceTimersByTime(101);
    expect(cache.get("session-a", "lists")).toBeUndefined();
  });

  test("scopes cache entries by session", () => {
    const cache = new SessionCache(1000);

    cache.set("session-a", "recipes", ["toast"]);
    expect(cache.get("session-b", "recipes")).toBeUndefined();
    expect(cache.get("session-a", "recipes")).toEqual(["toast"]);
  });

  test("invalidates entries", () => {
    const cache = new SessionCache(1000);

    cache.set("session-a", "lists", ["eggs"]);
    cache.invalidate("session-a", "lists");
    expect(cache.get("session-a", "lists")).toBeUndefined();
  });
});
