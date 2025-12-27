function serializeList(list) {
  return {
    id: list.identifier,
    name: list.name,
    itemCount: list.items?.length ?? 0,
  };
}

function serializeItem(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return {
    id: data.identifier,
    listId: data.listId,
    name: data.name,
    details: data.details ?? null,
    quantity: data.quantity ?? null,
    checked: data.checked ?? false,
    categoryMatchId: data.categoryMatchId ?? null,
  };
}

function serializeIngredient(ingredient) {
  const data = ingredient.toJSON ? ingredient.toJSON() : ingredient;
  return {
    rawIngredient: data.rawIngredient ?? null,
    name: data.name ?? null,
    quantity: data.quantity ?? null,
    note: data.note ?? null,
  };
}

function serializeRecipe(recipe) {
  return {
    id: recipe.identifier,
    name: recipe.name,
    note: recipe.note ?? null,
    sourceName: recipe.sourceName ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    servings: recipe.servings ?? null,
    preparationSteps: recipe.preparationSteps ?? [],
    ingredients: recipe.ingredients?.map(serializeIngredient) ?? [],
    scaleFactor: recipe.scaleFactor ?? null,
    rating: recipe.rating ?? null,
    nutritionalInfo: recipe.nutritionalInfo ?? null,
    cookTime: recipe.cookTime ?? null,
    prepTime: recipe.prepTime ?? null,
    timestamp: recipe.timestamp ?? null,
    creationTimestamp: recipe.creationTimestamp ?? null,
  };
}

function formatEventDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return null;
}

function serializeMealPlanEvent(event) {
  return {
    id: event.identifier,
    date: formatEventDate(event.date),
    title: event.title ?? null,
    details: event.details ?? null,
    recipeId: event.recipeId ?? null,
    recipeName: event.recipe?.name ?? null,
    labelId: event.labelId ?? null,
    labelName: event.label?.name ?? null,
    recipeScaleFactor: event.recipeScaleFactor ?? null,
  };
}

function serializeMealPlanLabel(label) {
  return {
    id: label.identifier,
    name: label.name,
    hexColor: label.hexColor,
    sortIndex: label.sortIndex,
  };
}

export {
  serializeIngredient,
  serializeItem,
  serializeList,
  serializeMealPlanEvent,
  serializeMealPlanLabel,
  serializeRecipe,
};
