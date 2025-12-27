import Ingredient from "anylist/lib/ingredient.js";
import {
  getClient,
  getLists,
  getMealPlanEvents,
  getRecipes,
} from "./anylist-client.ts";
import {
  serializeItem,
  serializeList,
  serializeMealPlanEvent,
  serializeMealPlanLabel,
  serializeRecipe,
} from "./serializers.ts";
import { jsonResponse, normalizeName } from "./utils.ts";

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function findListByName(lists, name) {
  const needle = normalizeName(name);
  return lists.find((list) => normalizeName(list.name) === needle);
}

function findItemByName(list, name) {
  const needle = normalizeName(name);
  return list.items.find((item) => normalizeName(item.name) === needle);
}

function findRecipeByName(recipes, name) {
  const needle = normalizeName(name);
  return recipes.find((recipe) => normalizeName(recipe.name) === needle);
}

async function handleListLists() {
  const lists = await getLists();
  return jsonResponse({ lists: lists.map(serializeList) });
}

async function handleListItems(input) {
  const lists = await getLists();
  const list = input.listId
    ? lists.find((entry) => entry.identifier === input.listId)
    : findListByName(lists, input.listName);
  if (!list) {
    throw new Error("List not found.");
  }
  return jsonResponse({
    list: serializeList(list),
    items: list.items.map(serializeItem),
  });
}

async function handleAddItem(input) {
  const lists = await getLists();
  const list = input.listId
    ? lists.find((entry) => entry.identifier === input.listId)
    : findListByName(lists, input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const existing = input.reuseExisting
    ? findItemByName(list, input.name)
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
  return jsonResponse({ item: serializeItem(saved), reused: false });
}

async function handleUpdateItem(input) {
  const lists = await getLists();
  const list = input.listId
    ? lists.find((entry) => entry.identifier === input.listId)
    : findListByName(lists, input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const item = input.itemId
    ? list.items.find((entry) => entry.identifier === input.itemId)
    : findItemByName(list, input.itemName);
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
  return jsonResponse({ item: serializeItem(item) });
}

async function handleRemoveItem(input) {
  const lists = await getLists();
  const list = input.listId
    ? lists.find((entry) => entry.identifier === input.listId)
    : findListByName(lists, input.listName);
  if (!list) {
    throw new Error("List not found.");
  }

  const item = input.itemId
    ? list.items.find((entry) => entry.identifier === input.itemId)
    : findItemByName(list, input.itemName);
  if (!item) {
    throw new Error("Item not found.");
  }

  await list.removeItem(item);
  return jsonResponse({ removed: serializeItem(item) });
}

async function handleUncheckAll(input) {
  const lists = await getLists();
  const list = input.listId
    ? lists.find((entry) => entry.identifier === input.listId)
    : findListByName(lists, input.listName);
  if (!list) {
    throw new Error("List not found.");
  }
  await list.uncheckAll();
  return jsonResponse({ list: serializeList(list), status: "ok" });
}

async function handleListRecipes(input) {
  const recipes = await getRecipes();
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

async function handleGetRecipe(input) {
  const recipes = await getRecipes();
  const recipe = input.recipeId
    ? recipes.find((entry) => entry.identifier === input.recipeId)
    : findRecipeByName(recipes, input.recipeName);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleCreateRecipe(input) {
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
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleUpdateRecipe(input) {
  const recipes = await getRecipes();
  const recipe = input.recipeId
    ? recipes.find((entry) => entry.identifier === input.recipeId)
    : findRecipeByName(recipes, input.recipeName);
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
  return jsonResponse({ recipe: serializeRecipe(recipe) });
}

async function handleDeleteRecipe(input) {
  const recipes = await getRecipes();
  const recipe = input.recipeId
    ? recipes.find((entry) => entry.identifier === input.recipeId)
    : findRecipeByName(recipes, input.recipeName);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }
  await recipe.delete();
  return jsonResponse({
    deleted: { id: recipe.identifier, name: recipe.name },
  });
}

async function handleMealPlanEvents(input) {
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

async function handleMealPlanLabels() {
  await getMealPlanEvents();
  const client = await getClient();
  const labels = client.mealPlanningCalendarEventLabels ?? [];
  return jsonResponse({ labels: labels.map(serializeMealPlanLabel) });
}

async function handleCreateMealPlanEvent(input) {
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

async function handleDeleteMealPlanEvent(input) {
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
