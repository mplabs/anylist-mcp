import { TOOL_HANDLERS } from "./handlers.ts";
import { schemas } from "./schemas.ts";
import type { SchemaMap, ToolEntry } from "./types.ts";

function defineTool<K extends keyof SchemaMap>(entry: ToolEntry<K>): ToolEntry<K> {
  return entry;
}

const TOOL_REGISTRY = [
  defineTool({
    name: "anylist_lists",
    description: "List shopping lists.",
    inputSchema: schemas.listLists,
    handler: TOOL_HANDLERS.anylist_lists,
  }),
  defineTool({
    name: "anylist_list_items",
    description: "List items in a shopping list by id or name.",
    inputSchema: schemas.listItems,
    handler: TOOL_HANDLERS.anylist_list_items,
  }),
  defineTool({
    name: "anylist_add_item",
    description: "Add a shopping list item.",
    inputSchema: schemas.addItem,
    handler: TOOL_HANDLERS.anylist_add_item,
  }),
  defineTool({
    name: "anylist_update_item",
    description: "Update a shopping list item by id or name.",
    inputSchema: schemas.updateItem,
    handler: TOOL_HANDLERS.anylist_update_item,
  }),
  defineTool({
    name: "anylist_remove_item",
    description: "Remove a shopping list item by id or name.",
    inputSchema: schemas.removeItem,
    handler: TOOL_HANDLERS.anylist_remove_item,
  }),
  defineTool({
    name: "anylist_uncheck_all",
    description: "Uncheck all items in a shopping list.",
    inputSchema: schemas.uncheckAll,
    handler: TOOL_HANDLERS.anylist_uncheck_all,
  }),
  defineTool({
    name: "anylist_recipes",
    description: "List recipes.",
    inputSchema: schemas.listRecipes,
    handler: TOOL_HANDLERS.anylist_recipes,
  }),
  defineTool({
    name: "anylist_get_recipe",
    description: "Get a recipe by id or name.",
    inputSchema: schemas.getRecipe,
    handler: TOOL_HANDLERS.anylist_get_recipe,
  }),
  defineTool({
    name: "anylist_create_recipe",
    description: "Create a recipe.",
    inputSchema: schemas.createRecipe,
    handler: TOOL_HANDLERS.anylist_create_recipe,
  }),
  defineTool({
    name: "anylist_update_recipe",
    description: "Update a recipe by id or name.",
    inputSchema: schemas.updateRecipe,
    handler: TOOL_HANDLERS.anylist_update_recipe,
  }),
  defineTool({
    name: "anylist_delete_recipe",
    description: "Delete a recipe by id or name.",
    inputSchema: schemas.deleteRecipe,
    handler: TOOL_HANDLERS.anylist_delete_recipe,
  }),
  defineTool({
    name: "anylist_meal_plan_events",
    description: "List meal planning calendar events.",
    inputSchema: schemas.mealPlanEvents,
    handler: TOOL_HANDLERS.anylist_meal_plan_events,
  }),
  defineTool({
    name: "anylist_meal_plan_labels",
    description: "List meal planning calendar labels.",
    inputSchema: schemas.mealPlanLabels,
    handler: TOOL_HANDLERS.anylist_meal_plan_labels,
  }),
  defineTool({
    name: "anylist_create_meal_plan_event",
    description: "Create a meal planning calendar event.",
    inputSchema: schemas.createMealPlanEvent,
    handler: TOOL_HANDLERS.anylist_create_meal_plan_event,
  }),
  defineTool({
    name: "anylist_delete_meal_plan_event",
    description: "Delete a meal planning calendar event.",
    inputSchema: schemas.deleteMealPlanEvent,
    handler: TOOL_HANDLERS.anylist_delete_meal_plan_event,
  }),
];

export { TOOL_REGISTRY };
