import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Configure QueryClient with safe defaults to prevent infinite re-render loops (React #310).
  // - refetchOnWindowFocus: OFF — prevents re-fetch cascade when user switches tabs
  // - refetchOnReconnect: OFF — prevents re-fetch cascade on network reconnection
  // - refetchOnMount: OFF — prevents re-fetch when component mounts with stale data
  // - staleTime: 30s — data stays fresh for 30s, reducing unnecessary refetches
  // - retry: 1 — fewer retries on failure to reduce re-render pressure
  // - structuralSharing: ON — reuses object references when data hasn't changed,
  //   preventing unnecessary re-renders from new object references on each fetch
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        staleTime: 30_000,
        retry: 1,
        structuralSharing: true,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30_000,
    // Prevent TanStack Router from auto-invalidating on navigation,
    // which can cause cascading re-renders
    defaultPreload: false,
  });

  return router;
};
