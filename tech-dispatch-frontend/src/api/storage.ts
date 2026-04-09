const STORAGE_KEY = "token";
const USER_KEY = "user";

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(STORAGE_KEY),
  set: (token: string): void => localStorage.setItem(STORAGE_KEY, token),
  remove: (): void => localStorage.removeItem(STORAGE_KEY),
};

export const userStorage = {
  get: (): unknown => {
    const str = localStorage.getItem(USER_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },
  set: (user: unknown): void => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  remove: (): void => localStorage.removeItem(USER_KEY),
};
