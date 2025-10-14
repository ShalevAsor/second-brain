import { prisma } from "@/lib/prisma";

async function forceEmbeddingRegeneration() {
  console.log(
    "🔄 Forcing embedding regeneration by updating contentUpdatedAt..."
  );

  const result = await prisma.note.updateMany({
    data: {
      contentUpdatedAt: new Date(),
    },
  });

  console.log(
    `✅ Updated ${result.count} notes. Embeddings will regenerate on next search.`
  );
}

forceEmbeddingRegeneration()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
