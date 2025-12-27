import Ingredient from "anylist/lib/ingredient.js";
import {
  getClient,
  getListsForSession,
  getMealPlanEvents,
  getRecipesForSession,
  invalidateListsCache,
  invalidateRecipesCache,
} from "./anylist-client.ts";
import {
  serializeItem,
  serializeList,
  serializeMealPlanEvent,
  serializeMealPlanLabel,
  serializeRecipe,
} from "./serializers.ts";
import { jsonResponse, normalizeName } from "./utils.ts";
import type { HandlerExtra, InferSchema } from "./types.ts";

function hasOwn(obj: object, key: string | number | symbol): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function findBy<T extends object, K extends keyof T>(
  collection: T[],
  prop: K,
  value: T[K] | undefined | null,
): T | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return collection.find((item) => {
    const candidate = item?.[prop];
    if (typeof candidate === "string" && typeof value === "string") {
      return normalizeName(candidate) === normalizeName(value);
    }
    return candidate === value;
  });
}

async function handleListLists(
  _input: InferSchema<"listLists">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  return jsonResponse({ lists: lists.map(serializeList) });
}

async function handleListItems(
  input: InferSchema<"listItems">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  const list = input.listId
    ? findBy(lists, "identifier", input.listId)
    : findBy(lists, "name", input.listName);
  if (!list) {
    throw new Error("List not found.");
  }
  return jsonResponse({
    list: serializeList(list),
    items: list.items.map(serializeItem),
  });
}

async function handleAddItem(
  input: InferSchema<"addItem">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  const list = input.listId
    ? findBy(lists, "identifier", input.listId)
    : findBy(lists, "name", input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const existing = input.reuseExisting
    ? findBy(list.items, "name", input.name)
    : null;
  if (existing) {
    if (input.quantity !== undefined) {
      existing.quantity = input.quantity;
    }
    if (input.details !== undefined) {
      existing.details = input.details;
    }
    existing.checked = input.checked;
    await existing.save();
    invalidateListsCache(extra.sessionId);
    return jsonResponse({ item: serializeItem(existing), reused: true });
  }

  const client = await getClient();
  const item = client.createItem({
    name: input.name,
    quantity: input.quantity,
    details: input.details,
    checked: input.checked,
  });

  const saved = await list.addItem(item);
  invalidateListsCache(extra.sessionId);
  return jsonResponse({ item: serializeItem(saved), reused: false });
}

async function handleUpdateItem(
  input: InferSchema<"updateItem">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  const list = input.listId
    ? findBy(lists, "identifier", input.listId)
    : findBy(lists, "name", input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const item = input.itemId
    ? findBy(list.items, "identifier", input.itemId)
    : findBy(list.items, "name", input.itemName);
  if (!item) {
    throw new Error("Item not found.");
  }

  if (hasOwn(input, "name")) {
    item.name = input.name;
  }
  if (hasOwn(input, "quantity")) {
    item.quantity = input.quantity === null ? "" : input.quantity;
  }
  if (hasOwn(input, "details")) {
    item.details = input.details === null ? "" : input.details;
  }
  if (hasOwn(input, "checked")) {
    item.checked = input.checked;
  }

  await item.save();
  invalidateListsCache(extra.sessionId);
  return jsonResponse({ item: serializeItem(item) });
}

async function handleRemoveItem(
  input: InferSchema<"removeItem">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  const list = input.listId
    ? findBy(lists, "identifier", input.listId)
    : findBy(lists, "name", input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const item = input.itemId
    ? findBy(list.items, "identifier", input.itemId)
    : findBy(list.items, "name", input.itemName);
  if (!item) {
    throw new Error("Item not found.");
  }

  await list.removeItem(item);
  invalidateListsCache(extra.sessionId);
  return jsonResponse({ removed: serializeItem(item) });
}

async function handleUncheckAll(
  input: InferSchema<"uncheckAll">,
  extra: HandlerExtra,
) {
  const lists = await getListsForSession(extra.sessionId);
  const list = input.listId
    ? findBy(lists, "identifier", input.listId)
    : findBy(lists, "name", input.listName);
  if (!list) {
    throw new Error("List not found.");
  }
  await list.uncheckAll();
  invalidateListsCache(extra.sessionId);
  return jsonResponse({ list: serializeList(list), status: "ok" });
}

async function handleListRecipes(
  input: InferSchema<"listRecipes">,
  extra: HandlerExtra,
) {
  const recipes = await getRecipesForSession(extra.sessionId);
  let filtered = recipes;
  if (input.name) {
    const needle = normalizeName(input.name);
    filtered = recipes.filter((recipe) =>
      normalizeName(recipe.name).includes(needle),
    );
  }
  if (input.limit !== undefined) {
    filtered = filtered.slice(0, input.limit);
  }
  return jsonResponse({ recipes: filtered.map(serializeRecipe) });
}

async function handleGetRecipe(
  input: InferSchema<"getRecipe">,
  extra: HandlerExtra,
) {
  const recipes = await getRecipesForSession(extra.sessionId);
  const recipe = input.recipeId
    ? findBy(recipes, "identifier", input.recipeId)
    : findBy(recipes, "name", input.recipeName);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleCreateRecipe(
  input: InferSchema<"createRecipe">,
  extra: HandlerExtra,
) {
  const client = await getClient();
  const now = Date.now() / 1000;
  const recipe = await client.createRecipe({
    name: input.name,
    note: input.note,
    preparationSteps: input.preparationSteps,
    servings: input.servings,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    scaleFactor: input.scaleFactor,
    rating: input.rating,
    ingredients: input.ingredients,
    nutritionalInfo: input.nutritionalInfo,
    cookTime: input.cookTime,
    prepTime: input.prepTime,
    creationTimestamp: now,
    timestamp: now,
  });

  await recipe.save();
  invalidateRecipesCache(extra.sessionId);
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleUpdateRecipe(
  input: InferSchema<"updateRecipe">,
  extra: HandlerExtra,
) {
  const recipes = await getRecipesForSession(extra.sessionId);
  const recipe = input.recipeId
    ? findBy(recipes, "identifier", input.recipeId)
    : findBy(recipes, "name", input.recipeName);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  if (hasOwn(input, "name")) {
    recipe.name = input.name;
  }
  if (hasOwn(input, "note")) {
    recipe.note = input.note === null ? "" : input.note;
  }
  if (hasOwn(input, "preparationSteps")) {
    recipe.preparationSteps = input.preparationSteps ?? [];
  }
  if (hasOwn(input, "servings")) {
    recipe.servings = input.servings === null ? "" : input.servings;
  }
  if (hasOwn(input, "sourceName")) {
    recipe.sourceName = input.sourceName === null ? "" : input.sourceName;
  }
  if (hasOwn(input, "sourceUrl")) {
    recipe.sourceUrl = input.sourceUrl === null ? "" : input.sourceUrl;
  }
  if (hasOwn(input, "scaleFactor")) {
    recipe.scaleFactor =
      input.scaleFactor === null ? undefined : input.scaleFactor;
  }
  if (hasOwn(input, "rating")) {
    recipe.rating = input.rating === null ? undefined : input.rating;
  }
  if (hasOwn(input, "ingredients")) {
    if (input.ingredients === null) {
      recipe.ingredients = [];
    } else {
      const any = await getClient();
      recipe.ingredients = input.ingredients.map(
        (ingredient) =>
          new Ingredient(ingredient, {
            client: any.client,
            protobuf: any.protobuf,
            uid: any.uid,
          }),
      );
    }
  }
  if (hasOwn(input, "nutritionalInfo")) {
    recipe.nutritionalInfo =
      input.nutritionalInfo === null ? "" : input.nutritionalInfo;
  }
  if (hasOwn(input, "cookTime")) {
    recipe.cookTime = input.cookTime === null ? undefined : input.cookTime;
  }
  if (hasOwn(input, "prepTime")) {
    recipe.prepTime = input.prepTime === null ? undefined : input.prepTime;
  }

  await recipe.save();
  invalidateRecipesCache(extra.sessionId);
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleDeleteRecipe(
  input: InferSchema<"deleteRecipe">,
  extra: HandlerExtra,
) {
  const recipes = await getRecipesForSession(extra.sessionId);
  const recipe = input.recipeId
    ? findBy(recipes, "identifier", input.recipeId)
    : findBy(recipes, "name", input.recipeName);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }
  await recipe.delete();
  invalidateRecipesCache(extra.sessionId);
  return jsonResponse({
    deleted: { id: recipe.identifier, name: recipe.name },
  });
}

async function handleMealPlanEvents(
  input: InferSchema<"mealPlanEvents">,
  _extra: HandlerExtra,
) {
  const events = await getMealPlanEvents();
  let filtered = events;
  if (input.startDate) {
    filtered = filtered.filter((event) =>
      event.date ? event.date >= input.startDate : false,
    );
  }
  if (input.endDate) {
    filtered = filtered.filter((event) =>
      event.date ? event.date <= input.endDate : false,
    );
  }
  return jsonResponse({ events: filtered.map(serializeMealPlanEvent) });
}

async function handleMealPlanLabels(
  _input: InferSchema<"mealPlanLabels">,
  _extra: HandlerExtra,
) {
  await getMealPlanEvents();
  const client = await getClient();
  const labels = client.mealPlanningCalendarEventLabels ?? [];
  return jsonResponse({ labels: labels.map(serializeMealPlanLabel) });
}

async function handleCreateMealPlanEvent(
  input: InferSchema<"createMealPlanEvent">,
  _extra: HandlerExtra,
) {
  const client = await getClient();
  const event = await client.createEvent({
    date: input.date,
    title: input.title,
    details: input.details,
    recipeId: input.recipeId,
    labelId: input.labelId,
    recipeScaleFactor: input.recipeScaleFactor,
  });

  await event.save();
  return jsonResponse({ event: serializeMealPlanEvent(event) });
}

async function handleDeleteMealPlanEvent(
  input: InferSchema<"deleteMealPlanEvent">,
  _extra: HandlerExtra,
) {
  const events = await getMealPlanEvents();
  const event = events.find((entry) => entry.identifier === input.eventId);
  if (!event) {
    throw new Error("Event not found.");
  }
  await event.delete();
  return jsonResponse({ deleted: serializeMealPlanEvent(event) });
}

const TOOL_HANDLERS = {
  anylist_lists: handleListLists,
  anylist_list_items: handleListItems,
  anylist_add_item: handleAddItem,
  anylist_update_item: handleUpdateItem,
  anylist_remove_item: handleRemoveItem,
  anylist_uncheck_all: handleUncheckAll,
  anylist_recipes: handleListRecipes,
  anylist_get_recipe: handleGetRecipe,
  anylist_create_recipe: handleCreateRecipe,
  anylist_update_recipe: handleUpdateRecipe,
  anylist_delete_recipe: handleDeleteRecipe,
  anylist_meal_plan_events: handleMealPlanEvents,
  anylist_meal_plan_labels: handleMealPlanLabels,
  anylist_create_meal_plan_event: handleCreateMealPlanEvent,
  anylist_delete_meal_plan_event: handleDeleteMealPlanEvent,
};

export { TOOL_HANDLERS };
