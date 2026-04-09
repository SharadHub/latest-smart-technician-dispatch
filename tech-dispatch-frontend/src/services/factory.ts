import { api } from "../api/client";

type ApiMethod = "get" | "post" | "put" | "delete";

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  token?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EndpointConfig<T = any, R = T> {
  path: string | ((id: string) => string);
  method: ApiMethod;
  transform?: (response: ApiResponse<T>) => R;
  deduplicate?: boolean;
}

const applyAuth = <T>(response: ApiResponse<T>): void => {
  if (response.token) api.auth.setToken(response.token);
  if (response.data) api.auth.setUser(response.data);
};

const buildPath = (path: string | ((id: string) => string), id?: string): string =>
  typeof path === "function" && id ? path(id) : (path as string);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createService = <T extends Record<string, EndpointConfig>>(config: T, authEndpoints?: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service: any = {};

  for (const [key, { path, method, transform, deduplicate }] of Object.entries(config)) {
    const isDynamic = typeof path === "function";

    service[key] = isDynamic
      ? async (id: string, data?: unknown) => {
          const url = buildPath(path, id);
          const response = await (api[method] as (url: string, data?: unknown) => Promise<ApiResponse>)(url, data);
          if (authEndpoints?.includes(key as string)) applyAuth(response);
          return transform ? transform(response) : response.data ?? response;
        }
      : async (...args: unknown[]) => {
          const hasData = method === "post" || method === "put";
          const data = hasData ? args[0] : undefined;
          const cfg = deduplicate && method === "get" ? { deduplicate: true } : undefined;
          const response = cfg
            ? await api.get<unknown>(path as string, cfg) as ApiResponse
            : await (api[method] as (url: string, data?: unknown) => Promise<ApiResponse>)(path as string, data);
          if (authEndpoints?.includes(key as string)) applyAuth(response);
          return transform ? transform(response) : response.data ?? response;
        };
  }

  return {
    ...service,
    logout: (): void => {
      api.auth.removeToken();
      api.auth.removeUser();
    },
    isAuthenticated: (): boolean => !!api.auth.getToken(),
    getToken: (): string | null => api.auth.getToken(),
    getStoredUser: (): unknown => api.auth.getUser(),
  } as Record<keyof T, (...args: any[]) => Promise<any>> & {
    logout: () => void;
    isAuthenticated: () => boolean;
    getToken: () => string | null;
    getStoredUser: () => unknown;
  };
};
