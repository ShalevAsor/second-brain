// Temporary test file: src/app/test-ai/page.tsx
import { analyzeContentForOrganization } from "@/actions/aiActions";

export default async function TestPage() {
  const result = await analyzeContentForOrganization(`
    def quicksort(arr):
        if len(arr) <= 1:
            return arr
        pivot = arr[len(arr) // 2]
        left = [x for x in arr if x < pivot]
        middle = [x for x in arr if x == pivot]
        right = [x for x in arr if x > pivot]
        return quicksort(left) + middle + quicksort(right)
  `);

  return (
    <div className="p-8">
      <h1>AI Test</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
