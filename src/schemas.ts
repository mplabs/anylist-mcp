import { z } from "zod";

const stringOrNumberSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? value.toString() : value));

const stringOrNumberOrNullSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null;
    }
    return typeof value === "number" ? value.toString() : value;
  });

const nullableStringSchema = z.union([z.string(), z.null()]);
const nullableNumberSchema = z.union([z.number(), z.null()]);
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format.")
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Invalid date.",
  );
const dateSchema = dateStringSchema.transform(
  (value) => new Date(`${value}T00:00:00Z`),
);

const emptySchema = z.object({}).strict().default({});

function hasOwn(obj: object, key: string | number | symbol): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const listTargetBase = z
  .object({
    listId: z.string().min(1).optional(),
    listName: z.string().min(1).optional(),
  })
  .strict();

const itemTargetBase = z
  .object({
    itemId: z.string().min(1).optional(),
    itemName: z.string().min(1).optional(),
  })
  .strict();

const recipeTargetBase = z
  .object({
    recipeId: z.string().min(1).optional(),
    recipeName: z.string().min(1).optional(),
  })
  .strict();

function withListTarget<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const hasListId = value.listId !== undefined;
    const hasListName = value.listName !== undefined;
    if (hasListId === hasListName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of listId or listName.",
      });
    }
  });
}

function withItemTarget<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const hasItemId = value.itemId !== undefined;
    const hasItemName = value.itemName !== undefined;
    if (hasItemId === hasItemName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of itemId or itemName.",
      });
    }
  });
}

function withRecipeTarget<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const hasRecipeId = value.recipeId !== undefined;
    const hasRecipeName = value.recipeName !== undefined;
    if (hasRecipeId === hasRecipeName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of recipeId or recipeName.",
      });
    }
  });
}

const ingredientSchema = z
  .object({
    rawIngredient: z.string().optional(),
    name: z.string().optional(),
    quantity: stringOrNumberSchema.optional(),
    note: z.string().optional(),
  })
  .strict();

const listItemsSchema = withListTarget(listTargetBase);

const addItemSchema = withListTarget(
  listTargetBase
    .extend({
      name: z.string().min(1),
      quantity: stringOrNumberSchema.optional(),
      details: z.string().optional(),
      checked: z.boolean().optional().default(false),
      reuseExisting: z.boolean().optional().default(true),
    })
    .strict(),
);

const updateItemSchema = withListTarget(
  withItemTarget(
    listTargetBase
      .merge(itemTargetBase)
      .extend({
        name: z.string().min(1).optional(),
        quantity: stringOrNumberOrNullSchema.optional(),
        details: nullableStringSchema.optional(),
        checked: z.boolean().optional(),
      })
      .strict(),
  ),
).superRefine((value, ctx) => {
  const updateKeys = ["name", "quantity", "details", "checked"];
  const hasUpdate = updateKeys.some((key) => hasOwn(value, key));
  if (!hasUpdate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide at least one field to update.",
    });
  }
});

const removeItemSchema = withListTarget(
  withItemTarget(listTargetBase.merge(itemTargetBase).strict()),
);

const listRecipesSchema = z
  .object({
    name: z.string().min(1).optional(),
    limit: z.number().optional(),
  })
  .strict();

const createRecipeSchema = z
  .object({
    name: z.string().min(1),
    note: z.string().optional(),
    preparationSteps: z.array(z.string()).optional().default([]),
    servings: z.string().optional(),
    sourceName: z.string().optional(),
    sourceUrl: z.string().optional(),
    scaleFactor: z.number().optional(),
    rating: z.number().optional(),
    ingredients: z.array(ingredientSchema).optional().default([]),
    nutritionalInfo: z.string().optional(),
    cookTime: z.number().optional(),
    prepTime: z.number().optional(),
  })
  .strict();

const updateRecipeSchema = withRecipeTarget(
  recipeTargetBase
    .extend({
      name: z.string().min(1).optional(),
      note: nullableStringSchema.optional(),
      preparationSteps: z.union([z.array(z.string()), z.null()]).optional(),
      servings: nullableStringSchema.optional(),
      sourceName: nullableStringSchema.optional(),
      sourceUrl: nullableStringSchema.optional(),
      scaleFactor: nullableNumberSchema.optional(),
      rating: nullableNumberSchema.optional(),
      ingredients: z.union([z.array(ingredientSchema), z.null()]).optional(),
      nutritionalInfo: nullableStringSchema.optional(),
      cookTime: nullableNumberSchema.optional(),
      prepTime: nullableNumberSchema.optional(),
    })
    .strict(),
).superRefine((value, ctx) => {
  const updateKeys = [
    "name",
    "note",
    "preparationSteps",
    "servings",
    "sourceName",
    "sourceUrl",
    "scaleFactor",
    "rating",
    "ingredients",
    "nutritionalInfo",
    "cookTime",
    "prepTime",
  ];
  const hasUpdate = updateKeys.some((key) => hasOwn(value, key));
  if (!hasUpdate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide at least one field to update.",
    });
  }
});

const mealPlanEventsSchema = z
  .object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
  })
  .strict();

const createMealPlanEventSchema = z
  .object({
    date: dateSchema,
    title: z.string().optional(),
    details: z.string().optional(),
    recipeId: z.string().optional(),
    labelId: z.string().optional(),
    recipeScaleFactor: z.number().optional(),
  })
  .strict();

const deleteMealPlanEventSchema = z
  .object({
    eventId: z.string().min(1),
  })
  .strict();

const schemas = {
  listLists: emptySchema,
  listItems: listItemsSchema,
  addItem: addItemSchema,
  updateItem: updateItemSchema,
  removeItem: removeItemSchema,
  uncheckAll: withListTarget(listTargetBase),
  listRecipes: listRecipesSchema,
  getRecipe: withRecipeTarget(recipeTargetBase),
  createRecipe: createRecipeSchema,
  updateRecipe: updateRecipeSchema,
  deleteRecipe: withRecipeTarget(recipeTargetBase),
  mealPlanEvents: mealPlanEventsSchema,
  mealPlanLabels: emptySchema,
  createMealPlanEvent: createMealPlanEventSchema,
  deleteMealPlanEvent: deleteMealPlanEventSchema,
} as const;

export { schemas };
