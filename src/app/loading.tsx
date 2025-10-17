import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center text-blue-500 p-4 m-4 min-h-screen">
      <span className="text-xl text-zinc-400 font-mono">Loading...</span>
      <Loader2 />
    </div>
  );
}
