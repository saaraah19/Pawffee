import { ensureSchema, query, queryOne } from "@/lib/db";
import { slugify } from "@/lib/utils";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
};

export async function listCategories(): Promise<Category[]> {
  await ensureSchema();
  return query<Category>(`SELECT * FROM categories ORDER BY name ASC`);
}

export async function listCategoriesWithCounts(): Promise<(Category & { recipe_count: number })[]> {
  await ensureSchema();
  const rows = await query<Category & { recipe_count: string }>(
    `SELECT c.*,
        (SELECT COUNT(*) FROM recipes r WHERE r.category_id = c.id AND r.status = 'published') as recipe_count
     FROM categories c ORDER BY c.name ASC`
  );
  return rows.map((r) => ({ ...r, recipe_count: Number(r.recipe_count) }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  await ensureSchema();
  return queryOne<Category>(`SELECT * FROM categories WHERE slug = $1`, [slug]);
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  await ensureSchema();
  return queryOne<Category>(`SELECT * FROM categories WHERE id = $1`, [id]);
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  await ensureSchema();
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (await getCategoryBySlug(slug)) {
    slug = `${baseSlug}-${++i}`;
  }
  const row = await queryOne<Category>(
    `INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *`,
    [name, slug, description || null]
  );
  return row!;
}

export async function updateCategory(
  id: number,
  name: string,
  description?: string
): Promise<Category | undefined> {
  await ensureSchema();
  return queryOne<Category>(
    `UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
    [name, description || null, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  await ensureSchema();
  // Recipes keep existing (category_id set to NULL via FK ON DELETE SET NULL)
  await query(`DELETE FROM categories WHERE id = $1`, [id]);
}
