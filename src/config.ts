const REQUIRED_ENV = ["ANYLIST_EMAIL", "ANYLIST_PASSWORD"];

function requireEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

function resolveCredentialsFile() {
  const raw = process.env.ANYLIST_CREDENTIALS_FILE;
  if (raw === undefined) {
    return undefined;
  }
  if (
    raw === "" ||
    raw.toLowerCase() === "null" ||
    raw.toLowerCase() === "false"
  ) {
    return null;
  }
  return raw;
}

export { REQUIRED_ENV, requireEnv, resolveCredentialsFile };
