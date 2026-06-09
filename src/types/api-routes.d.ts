// Type declarations for API route modules that are resolved at runtime
// by TanStack Start / Nitro but don't have TypeScript declarations

declare module "@tanstack/react-start/api" {
  export function createAPIFileRoute(path: string): {
    (config: {
      GET?: (ctx: { request: Request }) => Promise<Response> | Response;
      POST?: (ctx: { request: Request }) => Promise<Response> | Response;
    }): { APIRoute: typeof config };
  };
}

declare module "vinxi/http" {
  export function defineEventHandler(
    handler: (event: { method: string; [key: string]: any }) => Promise<Response> | Response
  ): any;
}
