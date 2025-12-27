import AnyList from "anylist";
import { requireEnv, resolveCredentialsFile } from "./config.ts";
import { SessionCache } from "./session-cache.ts";
import type {
  AnyListClient,
  AnyListList,
  AnyListMealPlanEvent,
  AnyListRecipe,
} from "./types.ts";

function extractUserIdFromToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    return payload.userId || payload.sub || payload.uid || null;
  } catch {
    return null;
  }
}

function patchUid(any: AnyListClient, userId: string) {
  any.uid = userId;
  const listGroups = [any.lists, any.favoriteItems];
  for (const group of listGroups) {
    if (!Array.isArray(group)) {
      continue;
    }
    for (const list of group) {
      list.uid = userId;
      if (!Array.isArray(list.items)) {
        continue;
      }
      for (const item of list.items) {
        item._uid = userId;
      }
    }
  }

  if (any.recentItems && typeof any.recentItems === "object") {
    for (const items of Object.values(any.recentItems)) {
      if (!Array.isArray(items)) {
        continue;
      }
      for (const item of items) {
        item._uid = userId;
      }
    }
  }

  if (Array.isArray(any.recipes)) {
    for (const recipe of any.recipes) {
      recipe.uid = userId;
    }
  }

  if (Array.isArray(any.mealPlanningCalendarEvents)) {
    for (const event of any.mealPlanningCalendarEvents) {
      event._uid = userId;
    }
  }
}

function findUserIdFromLists(lists: AnyListList[] | undefined) {
  for (const list of lists ?? []) {
    for (const item of list.items ?? []) {
      if (item.userId) {
        return item.userId;
      }
    }
  }
  return null;
}

function findUserIdFromRecent(any: AnyListClient) {
  if (!any.recentItems || typeof any.recentItems !== "object") {
    return null;
  }
  for (const items of Object.values(any.recentItems)) {
    if (!Array.isArray(items)) {
      continue;
    }
    for (const item of items) {
      if (item.userId) {
        return item.userId;
      }
    }
  }
  return null;
}

async function ensureUserId(any: AnyListClient) {
  if (any.uid) {
    return any.uid;
  }

  if (process.env.ANYLIST_USER_ID) {
    patchUid(any, process.env.ANYLIST_USER_ID);
    return any.uid;
  }

  const tokenUserId = extractUserIdFromToken(any.accessToken);
  if (tokenUserId) {
    patchUid(any, tokenUserId);
    return any.uid;
  }

  const lists = await any.getLists();
  const listUserId = findUserIdFromLists(lists) || findUserIdFromRecent(any);
  if (listUserId) {
    patchUid(any, listUserId);
    return any.uid;
  }

  throw new Error(
    "Unable to resolve user id. Set ANYLIST_USER_ID or add an item to a list.",
  );
}

const clientState: {
  client: AnyListClient | null;
  loginPromise: Promise<void> | null;
} = {
  client: null,
  loginPromise: null,
};

const DEFAULT_CACHE_TTL_MS = 30_000;

function resolveCacheTtlMs(): number {
  const raw = process.env.ANYLIST_CACHE_TTL_MS;
  if (!raw) {
    return DEFAULT_CACHE_TTL_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_CACHE_TTL_MS;
  }
  return parsed;
}

const sessionCache = new SessionCache(resolveCacheTtlMs());

async function getClient(): Promise<AnyListClient> {
  requireEnv();
  if (!clientState.client) {
    const credentialsFile = resolveCredentialsFile();
    clientState.client = new AnyList({
      email: process.env.ANYLIST_EMAIL,
      password: process.env.ANYLIST_PASSWORD,
      credentialsFile,
    }) as unknown as AnyListClient;
  }

  if (!clientState.loginPromise) {
    clientState.loginPromise = (async () => {
      await clientState.client.login(false);
      await ensureUserId(clientState.client);
    })();
  }

  await clientState.loginPromise;
  return clientState.client;
}

async function getLists(): Promise<AnyListList[]> {
  return getListsForSession();
}

async function getRecipes(): Promise<AnyListRecipe[]> {
  return getRecipesForSession();
}

async function getMealPlanEvents(): Promise<AnyListMealPlanEvent[]> {
  const client = await getClient();
  const events = await client.getMealPlanningCalendarEvents();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  return events;
}

async function getListsForSession(
  sessionId?: string,
): Promise<AnyListList[]> {
  const cached = sessionCache.get<AnyListList[]>(sessionId, "lists");
  if (cached) {
    return cached;
  }
  const client = await getClient();
  const lists = await client.getLists();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  sessionCache.set(sessionId, "lists", lists);
  return lists;
}

async function getRecipesForSession(
  sessionId?: string,
): Promise<AnyListRecipe[]> {
  const cached = sessionCache.get<AnyListRecipe[]>(sessionId, "recipes");
  if (cached) {
    return cached;
  }
  const client = await getClient();
  const recipes = await client.getRecipes();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  sessionCache.set(sessionId, "recipes", recipes);
  return recipes;
}

function invalidateListsCache(sessionId?: string) {
  sessionCache.invalidate(sessionId, "lists");
}

function invalidateRecipesCache(sessionId?: string) {
  sessionCache.invalidate(sessionId, "recipes");
}

export {
  getClient,
  getLists,
  getListsForSession,
  getMealPlanEvents,
  getRecipes,
  getRecipesForSession,
  invalidateListsCache,
  invalidateRecipesCache,
};
