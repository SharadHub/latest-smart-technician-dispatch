import { tokenStorage, userStorage } from "./storage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retry = async <T>(fn: () => Promise<T>, attempts: number, delay: number): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 0) throw error;
    await sleep(delay);
    return retry(fn, attempts - 1, delay * 1.5);
  }
};

interface RequestConfig {
  deduplicate?: boolean;
  retries?: number;
  retryDelay?: number;
}

const pending = new Map<string, Promise<unknown>>();

export const createRequestMethods = (client: { get: <T>(url: string) => Promise<{ data: T }>; post: <T>(url: string, data?: unknown) => Promise<{ data: T }>; put: <T>(url: string, data?: unknown) => Promise<{ data: T }>; delete: <T>(url: string) => Promise<{ data: T }> }) => ({
  get: async <T>(url: string, config?: RequestConfig): Promise<T> => {
    if (!config?.deduplicate) {
      const response = await client.get<T>(url);
      return response.data;
    }

    const key = `GET_${url}`;
    if (pending.has(key)) return pending.get(key) as Promise<T>;

    const promise = retry(
      () => client.get<T>(url).then((r) => r.data),
      config.retries ?? 0,
      config.retryDelay ?? 1000
    );

    pending.set(key, promise);
    promise.finally(() => pending.delete(key));
    return promise;
  },

  post: <T>(url: string, data?: unknown): Promise<T> =>
    client.post<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown): Promise<T> =>
    client.put<T>(url, data).then((r) => r.data),

  delete: <T>(url: string): Promise<T> =>
    client.delete<T>(url).then((r) => r.data),

  auth: {
    getToken: tokenStorage.get,
    setToken: tokenStorage.set,
    removeToken: tokenStorage.remove,
    getUser: userStorage.get,
    setUser: userStorage.set,
    removeUser: userStorage.remove,
  },
});
