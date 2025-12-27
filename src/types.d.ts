import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { infer as ZodInfer } from "zod";
import type { schemas } from "./schemas.ts";

export type AnyListItem = {
  identifier: string;
  name: string;
  details?: string;
  quantity?: string;
  checked?: boolean;
  categoryMatchId?: string;
  userId?: string;
  save: (isFavorite?: boolean) => Promise<void>;
  _uid?: string;
};

export type AnyListList = {
  identifier: string;
  name: string;
  items: AnyListItem[];
  addItem: (item: AnyListItem) => Promise<AnyListItem>;
  removeItem: (item: AnyListItem) => Promise<void>;
  uncheckAll: () => Promise<void>;
  uid?: string;
  parentId?: string;
};

export type AnyListRecipe = {
  identifier: string;
  name: string;
  note?: string;
  sourceName?: string;
  sourceUrl?: string;
  servings?: string;
  preparationSteps?: string[];
  ingredients?: unknown[];
  scaleFactor?: number;
  rating?: number;
  nutritionalInfo?: string;
  cookTime?: number;
  prepTime?: number;
  timestamp?: number;
  creationTimestamp?: number;
  save: () => Promise<void>;
  delete: () => Promise<void>;
  uid?: string;
};

export type AnyListMealPlanLabel = {
  identifier: string;
  name: string;
  hexColor?: string;
  sortIndex?: number;
};

export type AnyListMealPlanEvent = {
  identifier: string;
  date?: Date;
  title?: string;
  details?: string;
  recipeId?: string;
  labelId?: string;
  recipeScaleFactor?: number;
  recipe?: { name?: string } | null;
  label?: { name?: string } | null;
  save: () => Promise<void>;
  delete: () => Promise<void>;
  _uid?: string;
};

export type AnyListClient = {
  login: (connectWebSocket?: boolean) => Promise<void>;
  getLists: (refreshCache?: boolean) => Promise<AnyListList[]>;
  getRecipes: (refreshCache?: boolean) => Promise<AnyListRecipe[]>;
  getMealPlanningCalendarEvents: (
    refreshCache?: boolean,
  ) => Promise<AnyListMealPlanEvent[]>;
  createItem: (item: Partial<AnyListItem>) => AnyListItem;
  createRecipe: (recipe: Record<string, unknown>) => Promise<AnyListRecipe>;
  createEvent: (event: Record<string, unknown>) => Promise<AnyListMealPlanEvent>;
  uid?: string;
  lists?: AnyListList[];
  favoriteItems?: AnyListList[];
  recentItems?: Record<string, AnyListItem[]>;
  recipes?: AnyListRecipe[];
  mealPlanningCalendarEvents?: AnyListMealPlanEvent[];
  mealPlanningCalendarEventLabels?: AnyListMealPlanLabel[];
  client?: unknown;
  protobuf?: unknown;
  accessToken?: string;
};

export type HandlerExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export type SchemaMap = typeof schemas;
export type InferSchema<K extends keyof SchemaMap> = ZodInfer<SchemaMap[K]>;

export type CacheKey = "lists" | "recipes";

export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type SessionCacheEntry = {
  lists?: CacheEntry<unknown>;
  recipes?: CacheEntry<unknown>;
};

export type ToolHandler<K extends keyof SchemaMap> = ToolCallback<SchemaMap[K]>;

export type ToolEntry<K extends keyof SchemaMap> = {
  name: string;
  description: string;
  inputSchema: SchemaMap[K];
  handler: ToolHandler<K>;
};
