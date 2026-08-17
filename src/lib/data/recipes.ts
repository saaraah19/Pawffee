import { ensureSchema, query, queryOne, transaction } from "@/lib/db";
import { slugify } from "@/lib/utils";

export type RecipeStatus = "draft" | "published";
export type Difficulty = "easy" | "medium" | "hard";

export type IngredientInput = {
  group?: string | null;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
};

export type StepInput = {
  text: string;
  image?: string | null;
};

export type RecipeInput = {
  title: string;
  description?: string | null;
  cover_image?: string | null;
  category_id?: number | null;
  tags?: string[];
  status: RecipeStatus;
  featured?: boolean;
  prep_time?: number | null;
  rest_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: Difficulty | null;
  cost_dzd?: number | null;
  before_you_start?: string | null;
  my_tips?: string | null;
  my_secret?: string | null;
  cooking_notes?: string | null;
  my_verdict?: string | null;
  ingredients: IngredientInput[];
  steps: StepInput[];
  is_demo?: boolean;
};

export type RecipeRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  category_id: number | null;
  tags: string[] | null;
  status: RecipeStatus;
  featured: boolean;
  prep_time: number | null;
  rest_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  cost_dzd: number | null;
  before_you_start: string | null;
  my_tips: string | null;
  my_secret: string | null;
  cooking_notes: string | null;
  my_verdict: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_slug?: string | null;
};

export type RecipeIngredientRow = {
  id: number;
  group_id: number | null;
  group_name: string | null;
  name: string;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  position: number;
};

export type StepRow = {
  id: number;
  position: number;
  text: string;
  image: string | null;
};

export type FullRecipe = RecipeRow & {
  ingredients: RecipeIngredientRow[];
  steps: StepRow[];
  tagList: string[];
};

const RECIPE_SELECT = `
  SELECT r.*, c.name as category_name, c.slug as category_slug
  FROM recipes r
  LEFT JOIN categories c ON c.id = r.category_id
`;

async function attachRelations(row: RecipeRow | undefined): Promise<FullRecipe | undefined> {
  if (!row) return undefined;
  const ingredients = await query<RecipeIngredientRow>(
    `SELECT i.*, g.name as group_name FROM ingredients i
     LEFT JOIN ingredient_groups g ON g.id = i.group_id
     WHERE i.recipe_id = $1 ORDER BY g.position ASC NULLS FIRST, i.position ASC`,
    [row.id]
  );
  const steps = await query<StepRow>(
    `SELECT * FROM steps WHERE recipe_id = $1 ORDER BY position ASC`,
    [row.id]
  );
  const tagList: string[] = Array.isArray(row.tags) ? row.tags : [];
  return { ...row, ingredients, steps, tagList };
}

export async function getRecipeBySlug(slug: string): Promise<FullRecipe | undefined> {
  await ensureSchema();
  const row = await queryOne<RecipeRow>(`${RECIPE_SELECT} WHERE r.slug = $1`, [slug]);
  return attachRelations(row);
}

export async function getRecipeById(id: number): Promise<FullRecipe | undefined> {
  await ensureSchema();
  const row = await queryOne<RecipeRow>(`${RECIPE_SELECT} WHERE r.id = $1`, [id]);
  return attachRelations(row);
}

export async function getPublishedRecipeBySlug(slug: string): Promise<FullRecipe | undefined> {
  await ensureSchema();
  const row = await queryOne<RecipeRow>(
    `${RECIPE_SELECT} WHERE r.slug = $1 AND r.status = 'published'`,
    [slug]
  );
  return attachRelations(row);
}

export type ListFilters = {
  status?: RecipeStatus;
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  excludeId?: number;
  limit?: number;
  offset?: number;
};

export async function listRecipes(
  filters: ListFilters = {}
): Promise<{ rows: RecipeRow[]; total: number }> {
  await ensureSchema();
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  let i = 0;
  const next = () => `$${++i}`;

  if (filters.status) {
    clauses.push(`r.status = ${next()}`);
    params.push(filters.status);
  }
  if (filters.categorySlug) {
    clauses.push(`c.slug = ${next()}`);
    params.push(filters.categorySlug);
  }
  if (filters.featured) {
    clauses.push(`r.featured = true`);
  }
  if (filters.excludeId) {
    clauses.push(`r.id != ${next()}`);
    params.push(filters.excludeId);
  }
  if (filters.search) {
    const like = `%${filters.search}%`;
    const p1 = next();
    params.push(like);
    const p2 = next();
    params.push(like);
    const p3 = next();
    params.push(like);
    const p4 = next();
    params.push(like);
    const p5 = next();
    params.push(like);
    clauses.push(`(
      r.title ILIKE ${p1} OR r.description ILIKE ${p2} OR c.name ILIKE ${p3}
      OR r.tags::text ILIKE ${p4} OR r.id IN (
        SELECT recipe_id FROM ingredients WHERE name ILIKE ${p5}
      )
    )`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const totalRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM recipes r LEFT JOIN categories c ON c.id = r.category_id ${where}`,
    params
  );
  const total = Number(totalRow?.count || 0);

  let sql = `${RECIPE_SELECT} ${where} ORDER BY r.created_at DESC`;
  if (filters.limit) {
    sql += ` LIMIT ${next()}`;
    params.push(filters.limit);
    if (filters.offset) {
      sql += ` OFFSET ${next()}`;
      params.push(filters.offset);
    }
  }
  const rows = await query<RecipeRow>(sql, params);
  return { rows, total };
}

export async function relatedRecipes(recipe: FullRecipe, limit = 3): Promise<RecipeRow[]> {
  if (!recipe.category_id) return [];
  const { rows } = await listRecipes({
    status: "published",
    categorySlug: recipe.category_slug || undefined,
    excludeId: recipe.id,
    limit,
  });
  return rows;
}

async function insertIngredientsAndSteps(
  q: <R extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ) => Promise<R[]>,
  recipeId: number,
  ingredients: IngredientInput[],
  steps: StepInput[]
) {
  const groupOrder: string[] = [];
  for (const ing of ingredients) {
    const g = ing.group?.trim() || "";
    if (g && !groupOrder.includes(g)) groupOrder.push(g);
  }
  const groupIdMap = new Map<string, number>();
  for (let idx = 0; idx < groupOrder.length; idx++) {
    const name = groupOrder[idx];
    const rows = await q<{ id: number }>(
      `INSERT INTO ingredient_groups (recipe_id, name, position) VALUES ($1, $2, $3) RETURNING id`,
      [recipeId, name, idx]
    );
    groupIdMap.set(name, rows[0].id);
  }

  for (let idx = 0; idx < ingredients.length; idx++) {
    const ing = ingredients[idx];
    const g = ing.group?.trim() || "";
    const groupId = g ? groupIdMap.get(g) ?? null : null;
    await q(
      `INSERT INTO ingredients (recipe_id, group_id, name, quantity, unit, notes, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [recipeId, groupId, ing.name, ing.quantity || null, ing.unit || null, ing.notes || null, idx]
    );
  }

  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx];
    await q(
      `INSERT INTO steps (recipe_id, position, text, image) VALUES ($1, $2, $3, $4)`,
      [recipeId, idx, s.text, s.image || null]
    );
  }
}

async function uniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;
   
  while (true) {
    const existing = await queryOne<{ id: number }>(`SELECT id FROM recipes WHERE slug = $1`, [
      slug,
    ]);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${++i}`;
  }
}

export async function createRecipe(input: RecipeInput): Promise<FullRecipe> {
  await ensureSchema();
  const slug = await uniqueSlug(input.title);

  const recipeId = await transaction(async (q) => {
    const rows = await q<{ id: number }>(
      `INSERT INTO recipes (
        title, slug, description, cover_image, category_id, tags, status, featured,
        prep_time, rest_time, cook_time, servings, difficulty, cost_dzd,
        before_you_start, my_tips, my_secret, cooking_notes, my_verdict, is_demo, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, now())
      RETURNING id`,
      [
        input.title,
        slug,
        input.description || null,
        input.cover_image || null,
        input.category_id || null,
        JSON.stringify(input.tags || []),
        input.status,
        !!input.featured,
        input.prep_time ?? null,
        input.rest_time ?? null,
        input.cook_time ?? null,
        input.servings ?? null,
        input.difficulty || null,
        input.cost_dzd ?? null,
        input.before_you_start || null,
        input.my_tips || null,
        input.my_secret || null,
        input.cooking_notes || null,
        input.my_verdict || null,
        !!input.is_demo,
      ]
    );
    const id = rows[0].id;
    await insertIngredientsAndSteps(q, id, input.ingredients, input.steps);
    return id;
  });

  return (await getRecipeById(recipeId))!;
}

export async function updateRecipe(id: number, input: RecipeInput): Promise<FullRecipe> {
  await ensureSchema();
  const current = await getRecipeById(id);
  if (!current) throw new Error("Recipe not found");
  const slug = current.title === input.title ? current.slug : await uniqueSlug(input.title, id);

  await transaction(async (q) => {
    await q(
      `UPDATE recipes SET
        title = $1, slug = $2, description = $3, cover_image = $4, category_id = $5, tags = $6,
        status = $7, featured = $8, prep_time = $9, rest_time = $10, cook_time = $11, servings = $12,
        difficulty = $13, cost_dzd = $14, before_you_start = $15, my_tips = $16, my_secret = $17,
        cooking_notes = $18, my_verdict = $19, updated_at = now()
       WHERE id = $20`,
      [
        input.title,
        slug,
        input.description || null,
        input.cover_image || null,
        input.category_id || null,
        JSON.stringify(input.tags || []),
        input.status,
        !!input.featured,
        input.prep_time ?? null,
        input.rest_time ?? null,
        input.cook_time ?? null,
        input.servings ?? null,
        input.difficulty || null,
        input.cost_dzd ?? null,
        input.before_you_start || null,
        input.my_tips || null,
        input.my_secret || null,
        input.cooking_notes || null,
        input.my_verdict || null,
        id,
      ]
    );
    await q(`DELETE FROM ingredients WHERE recipe_id = $1`, [id]);
    await q(`DELETE FROM ingredient_groups WHERE recipe_id = $1`, [id]);
    await q(`DELETE FROM steps WHERE recipe_id = $1`, [id]);
    await insertIngredientsAndSteps(q, id, input.ingredients, input.steps);
  });

  return (await getRecipeById(id))!;
}

export async function setRecipeStatus(id: number, status: RecipeStatus): Promise<void> {
  await ensureSchema();
  await query(`UPDATE recipes SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
}

export async function deleteRecipe(id: number): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM recipes WHERE id = $1`, [id]);
}

export async function dashboardCounts() {
  await ensureSchema();
  const [total, published, drafts, categories] = await Promise.all([
    queryOne<{ c: string }>(`SELECT COUNT(*) as c FROM recipes`),
    queryOne<{ c: string }>(`SELECT COUNT(*) as c FROM recipes WHERE status = 'published'`),
    queryOne<{ c: string }>(`SELECT COUNT(*) as c FROM recipes WHERE status = 'draft'`),
    queryOne<{ c: string }>(`SELECT COUNT(*) as c FROM categories`),
  ]);
  return {
    total: Number(total?.c || 0),
    published: Number(published?.c || 0),
    drafts: Number(drafts?.c || 0),
    categories: Number(categories?.c || 0),
  };
}
