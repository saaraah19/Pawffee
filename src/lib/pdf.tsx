import { Document, Page, Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import type { FullRecipe } from "@/lib/data/recipes";
import { DIFFICULTY_LABELS, formatCost, formatMinutes, totalTime } from "@/lib/utils";

const COLORS = {
  cream: "#F9F2E6",
  espresso: "#2C1F17",
  coffee: "#5B4230",
  taupeSoft: "#E7DCC9",
  gold: "#B1793A",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 42,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: COLORS.espresso,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  brand: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: COLORS.espresso,
    marginLeft: 6,
  },
  category: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.coffee,
    marginBottom: 6,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 24,
    color: COLORS.espresso,
    marginBottom: 6,
  },
  description: {
    fontSize: 10.5,
    color: COLORS.coffee,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.taupeSoft,
    paddingVertical: 10,
    marginBottom: 18,
  },
  metaItem: { width: "16.6%", marginBottom: 4 },
  metaLabel: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: COLORS.coffee },
  metaValue: { fontFamily: "Times-Bold", fontSize: 11, color: COLORS.espresso, marginTop: 2 },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: COLORS.espresso,
    marginBottom: 8,
    marginTop: 4,
  },
  row: { flexDirection: "row" },
  colIngredients: { width: "34%", paddingRight: 16 },
  colInstructions: { width: "66%" },
  groupName: { fontFamily: "Times-Bold", fontSize: 10, marginBottom: 4, marginTop: 8 },
  ingredientLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderColor: COLORS.taupeSoft,
    paddingVertical: 3,
  },
  ingredientName: { fontSize: 9.5, flex: 1, paddingRight: 4 },
  ingredientQty: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  step: { flexDirection: "row", marginBottom: 8 },
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.espresso,
    color: "#FFFFFF",
    fontSize: 8,
    textAlign: "center",
    marginRight: 8,
    paddingTop: 3,
  },
  stepText: { fontSize: 9.7, lineHeight: 1.45, flex: 1 },
  note: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.cream,
    borderRadius: 4,
  },
  noteLabel: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLORS.coffee,
    marginBottom: 4,
  },
  noteText: { fontSize: 9.5, lineHeight: 1.5, color: COLORS.espresso },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    fontSize: 7.5,
    color: COLORS.coffee,
    textAlign: "center",
    borderTopWidth: 1,
    borderColor: COLORS.taupeSoft,
    paddingTop: 8,
  },
});

function PawMark() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path
        d="M12 15.2m-5.6 0a5.6 4.6 0 1 0 11.2 0a5.6 4.6 0 1 0 -11.2 0"
        fill={COLORS.gold}
      />
      <Path d="M4.6 9.4m-2.1 0a2.1 2.6 0 1 0 4.2 0a2.1 2.6 0 1 0 -4.2 0" fill={COLORS.gold} />
      <Path d="M9.4 5.6m-2.1 0a2.1 2.7 0 1 0 4.2 0a2.1 2.7 0 1 0 -4.2 0" fill={COLORS.gold} />
      <Path d="M14.7 5.6m-2.1 0a2.1 2.7 0 1 0 4.2 0a2.1 2.7 0 1 0 -4.2 0" fill={COLORS.gold} />
      <Path d="M19.4 9.4m-2.1 0a2.1 2.6 0 1 0 4.2 0a2.1 2.6 0 1 0 -4.2 0" fill={COLORS.gold} />
    </Svg>
  );
}

function Note({ label, content }: { label: string; content?: string | null }) {
  if (!content) return null;
  return (
    <View style={styles.note}>
      <Text style={styles.noteLabel}>{label}</Text>
      <Text style={styles.noteText}>{content}</Text>
    </View>
  );
}

export function RecipePdfDocument({ recipe }: { recipe: FullRecipe }) {
  const total = totalTime(recipe.prep_time, recipe.rest_time, recipe.cook_time);

  const groups = new Map<string, typeof recipe.ingredients>();
  for (const ing of recipe.ingredients) {
    const key = ing.group_name || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  const metaItems = [
    ["Prep", formatMinutes(recipe.prep_time)],
    ["Rest", formatMinutes(recipe.rest_time)],
    ["Cook", formatMinutes(recipe.cook_time)],
    ["Total", formatMinutes(total)],
    ["Servings", recipe.servings ? String(recipe.servings) : null],
    [
      "Difficulty",
      recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty : null,
    ],
    ["Cost", formatCost(recipe.cost_dzd)],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Document
      title={recipe.title}
      author="Pawffee"
      subject={recipe.description || undefined}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <PawMark />
          <Text style={styles.brand}>Pawffee</Text>
        </View>

        {recipe.category_name && <Text style={styles.category}>{recipe.category_name}</Text>}
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

        {metaItems.length > 0 && (
          <View style={styles.metaRow}>
            {metaItems.map(([label, value]) => (
              <View key={label} style={styles.metaItem}>
                <Text style={styles.metaLabel}>{label}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        <Note label="Before you start" content={recipe.before_you_start} />

        <View style={styles.row}>
          <View style={styles.colIngredients}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {Array.from(groups.entries()).map(([groupName, items]) => (
              <View key={groupName || "default"}>
                {groupName && <Text style={styles.groupName}>{groupName}</Text>}
                {items.map((ing) => (
                  <View key={ing.id} style={styles.ingredientLine}>
                    <Text style={styles.ingredientName}>
                      {ing.name}
                      {ing.notes ? ` — ${ing.notes}` : ""}
                    </Text>
                    {(ing.quantity || ing.unit) && (
                      <Text style={styles.ingredientQty}>
                        {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.colInstructions}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.steps.map((step, idx) => (
              <View key={step.id} style={styles.step} wrap={false}>
                <Text style={styles.stepNum}>{idx + 1}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}

            <Note label="My tips" content={recipe.my_tips} />
            <Note label="My little secret" content={recipe.my_secret} />
            <Note label="Cooking notes" content={recipe.cooking_notes} />
            <Note label="My verdict" content={recipe.my_verdict} />
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Pawffee — pawffee.example  ·  Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
