import AnyList from "anylist";
import { requireEnv, resolveCredentialsFile } from "./config.ts";

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

function patchUid(any, userId) {
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

function findUserIdFromLists(lists) {
  for (const list of lists ?? []) {
    for (const item of list.items ?? []) {
      if (item.userId) {
        return item.userId;
      }
    }
  }
  return null;
}

function findUserIdFromRecent(any) {
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

async function ensureUserId(any) {
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

const clientState = {
  client: null,
  loginPromise: null,
};

async function getClient() {
  requireEnv();
  if (!clientState.client) {
    const credentialsFile = resolveCredentialsFile();
    clientState.client = new AnyList({
      email: process.env.ANYLIST_EMAIL,
      password: process.env.ANYLIST_PASSWORD,
      credentialsFile,
    });
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

async function getLists() {
  const client = await getClient();
  const lists = await client.getLists();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  return lists;
}

async function getRecipes() {
  const client = await getClient();
  const recipes = await client.getRecipes();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  return recipes;
}

async function getMealPlanEvents() {
  const client = await getClient();
  const events = await client.getMealPlanningCalendarEvents();
  if (client.uid) {
    patchUid(client, client.uid);
  }
  return events;
}

export { getClient, getLists, getMealPlanEvents, getRecipes };
