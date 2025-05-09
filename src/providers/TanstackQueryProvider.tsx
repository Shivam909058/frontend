// lib
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// types
import type { ReactElement, ReactNode } from "react";

const queryClient = new QueryClient();

const isDevEnv = process.env.NODE_ENV === "development";

export const TanstackQueryProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => (
  <QueryClientProvider client={queryClient}>
    {children}
    {isDevEnv ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
);
