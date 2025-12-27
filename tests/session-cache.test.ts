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

  test("does nothing when ttl is disabled", () => {
    const cache = new SessionCache(0);

    cache.set("session-a", "lists", ["milk"]);
    expect(cache.get("session-a", "lists")).toBeUndefined();
    cache.invalidate("session-a", "lists");
  });

  test("invalidates all entries for a session", () => {
    const cache = new SessionCache(1000);

    cache.set("session-a", "lists", ["bread"]);
    cache.set("session-a", "recipes", ["toast"]);
    cache.invalidate("session-a");
    expect(cache.get("session-a", "lists")).toBeUndefined();
    expect(cache.get("session-a", "recipes")).toBeUndefined();
  });

  test("ignores invalidation for missing session entries", () => {
    const cache = new SessionCache(1000);

    cache.invalidate("missing-session", "lists");
    expect(cache.get("missing-session", "lists")).toBeUndefined();
  });

  test("uses the default session id when none is provided", () => {
    const cache = new SessionCache(1000);

    cache.set(undefined, "lists", ["apples"]);
    expect(cache.get(undefined, "lists")).toEqual(["apples"]);
  });
});
