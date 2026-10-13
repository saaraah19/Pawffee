import "dotenv/config";
import { ensureSchema, pool } from "../src/lib/db";
import { ensureAdminUser } from "../src/lib/auth";
import { createCategory, getCategoryBySlug } from "../src/lib/data/categories";
import { createRecipe, type RecipeInput } from "../src/lib/data/recipes";
import { query } from "../src/lib/db";

const CATEGORY_SEED: { name: string; description: string }[] = [
  { name: "Cakes", description: "Layer cakes, snacking cakes, and everything in between." },
  { name: "Cookies", description: "Small batches, big flavor." },
  { name: "Pastries", description: "Laminated, filled, and fussed-over." },
  { name: "Breads", description: "Loaves worth the wait." },
  { name: "Desserts", description: "Sweet things that don't fit anywhere else." },
  { name: "Breakfast", description: "Slow mornings and quick ones." },
  { name: "Savory", description: "Dinner, mostly." },
  { name: "Drinks", description: "Something warm (or cold) alongside it all." },
];

const DEMO_RECIPES: (Omit<RecipeInput, "category_id"> & { categorySlug: string })[] = [
  {
    categorySlug: "cookies",
    title: "Brown Butter Chocolate Chip Cookies",
    description:
      "The cookie that started this whole website. Nutty brown butter, flaky salt, and a soft, chewy center.",
    status: "published",
    featured: true,
    is_demo: true,
    tags: ["cookies", "chocolate", "weekend baking"],
    prep_time: 20,
    rest_time: 60,
    cook_time: 12,
    servings: 18,
    difficulty: "medium",
    cost_dzd: 1400,
    before_you_start:
      "Brown the butter ahead of time and let it re-solidify in the fridge for about an hour, because cold brown butter creams properly with the sugar.",
    my_tips:
      "Use a kitchen scale for the flour. Chill the dough for the full hour; rushing this step is the #1 reason these spread too thin.",
    my_secret: "A pinch of flaky salt on top right when they come out of the oven, while they're still soft.",
    cooking_notes:
      "My oven runs slightly hot, so I go 1 minute under the time you'd expect and let them finish setting on the tray.",
    my_verdict:
      "Better on day two. If you can resist eating them all on day one, you'll be rewarded.",
    ingredients: [
      { group: "Dry", name: "all-purpose flour", quantity: "280", unit: "g" },
      { group: "Dry", name: "baking soda", quantity: "1", unit: "tsp" },
      { group: "Dry", name: "fine salt", quantity: "0.5", unit: "tsp" },
      { group: "Wet", name: "unsalted butter", quantity: "225", unit: "g", notes: "browned and cooled" },
      { group: "Wet", name: "brown sugar", quantity: "200", unit: "g" },
      { group: "Wet", name: "granulated sugar", quantity: "50", unit: "g" },
      { group: "Wet", name: "large eggs", quantity: "2" },
      { group: "Wet", name: "vanilla extract", quantity: "2", unit: "tsp" },
      { group: "Mix-ins", name: "dark chocolate", quantity: "220", unit: "g", notes: "roughly chopped" },
      { group: "Mix-ins", name: "flaky sea salt", quantity: "1", unit: "pinch" },
    ],
    steps: [
      { text: "Brown the butter in a light-colored pan over medium heat until it smells nutty and has amber flecks. Cool until solid but soft, about 1 hour in the fridge." },
      { text: "Whisk together the flour, baking soda, and salt in a bowl. Set aside." },
      { text: "Cream the brown butter with both sugars until light and fluffy, about 3 minutes." },
      { text: "Beat in the eggs one at a time, then the vanilla." },
      { text: "Fold in the dry ingredients until just combined, then fold in the chopped chocolate." },
      { text: "Chill the dough for at least 1 hour. This step is not optional." },
      { text: "Scoop into balls, space well apart on a lined tray, and bake at 190°C for 11–13 minutes until the edges are set but the centers still look slightly underdone." },
      { text: "Sprinkle with flaky salt immediately and let cool on the tray for 5 minutes before moving." },
    ],
  },
  {
    categorySlug: "cakes",
    title: "Basbousa with Orange Blossom Syrup",
    description:
      "A dense, syrup-soaked semolina cake, and one of the first things I ever learned to bake properly.",
    status: "published",
    featured: true,
    is_demo: true,
    tags: ["semolina", "syrup cake", "middle eastern"],
    prep_time: 15,
    rest_time: 30,
    cook_time: 35,
    servings: 12,
    difficulty: "easy",
    cost_dzd: 1100,
    before_you_start: "Make the syrup first so it has time to cool completely before it meets the hot cake.",
    my_tips: "Pour the cold syrup over the hot cake, never the other way around, because that is what gives it the right texture.",
    cooking_notes: "Score the cake into diamonds before baking, not after, so it is much easier to cut cleanly.",
    my_verdict: "Keeps well for days at room temperature, if it lasts that long.",
    ingredients: [
      { group: "Cake", name: "fine semolina", quantity: "300", unit: "g" },
      { group: "Cake", name: "plain yogurt", quantity: "200", unit: "g" },
      { group: "Cake", name: "sugar", quantity: "120", unit: "g" },
      { group: "Cake", name: "melted butter", quantity: "100", unit: "g" },
      { group: "Cake", name: "baking powder", quantity: "1.5", unit: "tsp" },
      { group: "Cake", name: "blanched almonds", quantity: "12", unit: null, notes: "for topping" },
      { group: "Syrup", name: "sugar", quantity: "250", unit: "g" },
      { group: "Syrup", name: "water", quantity: "200", unit: "ml" },
      { group: "Syrup", name: "lemon juice", quantity: "1", unit: "tsp" },
      { group: "Syrup", name: "orange blossom water", quantity: "1", unit: "tbsp" },
    ],
    steps: [
      { text: "Make the syrup: simmer sugar, water, and lemon juice for 8 minutes until slightly thickened. Stir in orange blossom water and cool completely." },
      { text: "Mix all cake ingredients except the almonds into a thick batter. Rest for 30 minutes." },
      { text: "Spread into a greased baking dish, score into diamonds, and press an almond into each." },
      { text: "Bake at 180°C for 30–35 minutes until deep golden." },
      { text: "Pour the cold syrup evenly over the hot cake immediately after baking. Let it soak in fully before serving." },
    ],
  },
  {
    categorySlug: "breads",
    title: "No-Fuss Weekend Bread",
    description: "A forgiving, high-hydration loaf for people who don't want to think about a starter.",
    status: "published",
    featured: false,
    is_demo: true,
    tags: ["bread", "weekend project"],
    prep_time: 25,
    rest_time: 720,
    cook_time: 45,
    servings: 10,
    difficulty: "hard",
    cost_dzd: 350,
    before_you_start: "Start this the night before, since most of the time is unattended rise.",
    my_tips: "Don't skip the preheated Dutch oven; it's what gives the crust its crackle.",
    cooking_notes: "Internal temperature should read about 96–98°C when it's fully done.",
    my_verdict: "Worth the wait. This is the loaf I make when people are coming over.",
    ingredients: [
      { group: null, name: "bread flour", quantity: "500", unit: "g" },
      { group: null, name: "water", quantity: "375", unit: "ml", notes: "room temperature" },
      { group: null, name: "instant yeast", quantity: "3", unit: "g" },
      { group: null, name: "fine salt", quantity: "10", unit: "g" },
    ],
    steps: [
      { text: "Mix flour, water, yeast, and salt into a shaggy dough. No kneading needed." },
      { text: "Cover and let rest at room temperature for 12 hours, or overnight." },
      { text: "Turn the dough out onto a floured surface, shape gently into a round, and let rest 30 minutes." },
      { text: "Preheat a Dutch oven at 230°C for 30 minutes." },
      { text: "Score the dough, transfer into the hot pot, cover, and bake 25 minutes." },
      { text: "Uncover and bake a further 15–20 minutes until deep golden brown." },
      { text: "Cool completely on a rack for at least 1 hour before slicing." },
    ],
  },
  {
    categorySlug: "breakfast",
    title: "Shakshuka for One Slow Morning",
    description: "Eggs poached in a spiced tomato sauce. Good with toasted bread for scooping.",
    status: "published",
    featured: false,
    is_demo: true,
    tags: ["eggs", "quick", "savory breakfast"],
    prep_time: 10,
    rest_time: 0,
    cook_time: 20,
    servings: 2,
    difficulty: "easy",
    cost_dzd: 500,
    my_tips: "Make little wells in the sauce for the eggs so they don't spread everywhere.",
    my_verdict: "My go-to when there's good bread in the house and not much else.",
    ingredients: [
      { group: null, name: "olive oil", quantity: "2", unit: "tbsp" },
      { group: null, name: "onion", quantity: "1", unit: null, notes: "diced" },
      { group: null, name: "red bell pepper", quantity: "1", unit: null, notes: "diced" },
      { group: null, name: "garlic cloves", quantity: "3", unit: null, notes: "minced" },
      { group: null, name: "ground cumin", quantity: "1", unit: "tsp" },
      { group: null, name: "sweet paprika", quantity: "1", unit: "tsp" },
      { group: null, name: "canned crushed tomatoes", quantity: "400", unit: "g" },
      { group: null, name: "large eggs", quantity: "4" },
      { group: null, name: "fresh parsley", quantity: "2", unit: "tbsp", notes: "chopped, to finish" },
    ],
    steps: [
      { text: "Warm the olive oil and cook the onion and pepper until soft, about 6 minutes." },
      { text: "Add the garlic, cumin, and paprika and cook 1 minute until fragrant." },
      { text: "Pour in the tomatoes, season, and simmer 10 minutes until slightly thickened." },
      { text: "Make wells in the sauce and crack in the eggs. Cover and cook 5–6 minutes until whites are set but yolks are still soft." },
      { text: "Finish with parsley and serve straight from the pan with warm bread." },
    ],
  },
  {
    categorySlug: "drinks",
    title: "Spiced Moroccan Mint Tea",
    description: "Sweet, bright, and endlessly re-steepable.",
    status: "published",
    featured: false,
    is_demo: true,
    tags: ["tea", "mint"],
    prep_time: 5,
    cook_time: 8,
    servings: 4,
    difficulty: "easy",
    cost_dzd: 200,
    my_verdict: "Simple, but the fresh mint really is non-negotiable here.",
    ingredients: [
      { group: null, name: "gunpowder green tea", quantity: "2", unit: "tbsp" },
      { group: null, name: "fresh mint leaves", quantity: "1", unit: "cup", notes: "packed" },
      { group: null, name: "sugar", quantity: "3", unit: "tbsp", notes: "adjust to taste" },
      { group: null, name: "boiling water", quantity: "700", unit: "ml" },
    ],
    steps: [
      { text: "Rinse the tea leaves briefly with a little boiling water, then discard that water." },
      { text: "Add the mint, sugar, and remaining boiling water to the pot." },
      { text: "Steep for 5–8 minutes." },
      { text: "Pour from a height into small glasses to aerate, and serve hot." },
    ],
  },
  {
    categorySlug: "pastries",
    title: "Pistachio Baklava (testing notes)",
    description: "Still adjusting the syrup ratio, so not ready to publish yet.",
    status: "draft",
    featured: false,
    is_demo: true,
    tags: ["pistachio", "phyllo"],
    prep_time: 40,
    cook_time: 40,
    servings: 20,
    difficulty: "hard",
    cost_dzd: 2200,
    cooking_notes: "Third attempt: the syrup was slightly too sweet, try reducing sugar by 20g next time.",
    ingredients: [
      { group: "Filling", name: "shelled pistachios", quantity: "300", unit: "g", notes: "finely chopped" },
      { group: "Filling", name: "sugar", quantity: "2", unit: "tbsp" },
      { group: "Filling", name: "ground cinnamon", quantity: "0.5", unit: "tsp" },
      { group: "Assembly", name: "phyllo sheets", quantity: "20", unit: null },
      { group: "Assembly", name: "melted butter", quantity: "200", unit: "g" },
      { group: "Syrup", name: "sugar", quantity: "300", unit: "g" },
      { group: "Syrup", name: "water", quantity: "200", unit: "ml" },
      { group: "Syrup", name: "lemon juice", quantity: "1", unit: "tsp" },
    ],
    steps: [
      { text: "Layer half the phyllo sheets in a buttered dish, brushing each with butter." },
      { text: "Spread the pistachio filling evenly over the layered sheets." },
      { text: "Layer the remaining phyllo on top, buttering each sheet." },
      { text: "Score into diamonds and bake at 160°C for about 40 minutes until golden." },
      { text: "Pour cooled syrup over the hot baklava and let it fully absorb before serving." },
    ],
  },
];

async function main() {
  await ensureSchema();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await ensureAdminUser(adminEmail, adminPassword);
    console.log(`OK Admin user ready: ${adminEmail}`);
  } else {
    console.warn("Warning: ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin user creation.");
  }

  for (const cat of CATEGORY_SEED) {
    const existing = await getCategoryBySlug(
      cat.name.toLowerCase().replace(/\s+/g, "-")
    );
    if (!existing) {
      await createCategory(cat.name, cat.description);
      console.log(`OK Category created: ${cat.name}`);
    }
  }

  const existingDemo = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM recipes WHERE is_demo = true`
  );
  if (Number(existingDemo[0].count) > 0) {
    console.log("OK Demo recipes already present, skipping recipe seed.");
  } else {
    for (const demo of DEMO_RECIPES) {
      const category = await getCategoryBySlug(demo.categorySlug);
      const { categorySlug, ...input } = demo;
      void categorySlug;
      await createRecipe({ ...input, category_id: category?.id ?? null });
      console.log(`OK Recipe created: ${demo.title}`);
    }
  }

  console.log("\nSeed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
