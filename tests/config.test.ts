import { requireEnv, resolveCredentialsFile } from "../src/config.ts";

const ENV_KEYS = [
  "ANYLIST_EMAIL",
  "ANYLIST_PASSWORD",
  "ANYLIST_CREDENTIALS_FILE",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const ORIGINAL_ENV: Record<EnvKey, string | undefined> = {
  ANYLIST_EMAIL: process.env.ANYLIST_EMAIL,
  ANYLIST_PASSWORD: process.env.ANYLIST_PASSWORD,
  ANYLIST_CREDENTIALS_FILE: process.env.ANYLIST_CREDENTIALS_FILE,
};

function setEnv(key: EnvKey, value?: string) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("config", () => {
  afterEach(() => {
    restoreEnv();
  });

  test("requireEnv throws when ANYLIST_EMAIL is missing", () => {
    setEnv("ANYLIST_PASSWORD", "secret");
    expect(() => requireEnv()).toThrow();
  });

  test("requireEnv throws when ANYLIST_PASSWORD is missing", () => {
    setEnv("ANYLIST_EMAIL", "user@example.com");
    expect(() => requireEnv()).toThrow();
  });

  test("requireEnv passes when both required variables are set", () => {
    setEnv("ANYLIST_EMAIL", "user@example.com");
    setEnv("ANYLIST_PASSWORD", "secret");
    expect(() => requireEnv()).not.toThrow();
  });

  test("resolveCredentialsFile returns undefined when not set", () => {
    expect(resolveCredentialsFile()).toBeUndefined();
  });

  test("resolveCredentialsFile returns null for empty or disabled values", () => {
    setEnv("ANYLIST_CREDENTIALS_FILE", "");
    expect(resolveCredentialsFile()).toBeNull();
    setEnv("ANYLIST_CREDENTIALS_FILE", "null");
    expect(resolveCredentialsFile()).toBeNull();
    setEnv("ANYLIST_CREDENTIALS_FILE", "FALSE");
    expect(resolveCredentialsFile()).toBeNull();
  });

  test("resolveCredentialsFile returns the raw value when set", () => {
    setEnv("ANYLIST_CREDENTIALS_FILE", "/tmp/anylist-creds.json");
    expect(resolveCredentialsFile()).toBe("/tmp/anylist-creds.json");
  });
});
