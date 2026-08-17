import { z } from "zod";

export const ingredientSchema = z.object({
  group: z.string().nullable().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const stepSchema = z.object({
  text: z.string().min(1, "Step text is required"),
  image: z.string().nullable().optional(),
});

export const galleryImageSchema = z.object({
  url: z.string().min(1),
  caption: z.string().nullable().optional(),
});

export const recipeSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  category_id: z.number().int().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  prep_time: z.number().int().nullable().optional(),
  rest_time: z.number().int().nullable().optional(),
  cook_time: z.number().int().nullable().optional(),
  servings: z.number().int().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  cost_dzd: z.number().int().nullable().optional(),
  before_you_start: z.string().nullable().optional(),
  my_tips: z.string().nullable().optional(),
  my_secret: z.string().nullable().optional(),
  cooking_notes: z.string().nullable().optional(),
  my_verdict: z.string().nullable().optional(),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
  steps: z.array(stepSchema).min(1, "Add at least one instruction step"),
  images: z.array(galleryImageSchema).optional(),
});

export type RecipeFormPayload = z.infer<typeof recipeSchema>;
