// "use client";

// import { Toaster } from "@/components/ui/sonner";
// import { ModalProvider } from "@/components/providers/ModalProvider";
// import { ClerkProvider } from "@clerk/nextjs";

// interface ProvidersProps {
//   children: React.ReactNode;
// }

// export const Providers = ({ children }: ProvidersProps) => (
//   <ClerkProvider afterSignOutUrl={"/sign-in"}>
//     {children}
//     <ModalProvider />
//     <Toaster position="bottom-right" richColors closeButton />
//   </ClerkProvider>
// );
// components/providers/Providers.tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/lib/queryClient";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  // Create QueryClient instance once per component lifecycle
  // This is SSR-safe and prevents data leaking between requests
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <ClerkProvider afterSignOutUrl={"/sign-in"}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ModalProvider />
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </ClerkProvider>
  );
};
