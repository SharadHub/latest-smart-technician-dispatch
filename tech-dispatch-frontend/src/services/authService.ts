
import { createService } from "./factory";

const endpoints = {
  register: { path: "/auth/register", method: "post" as const },
  login: { path: "/auth/login", method: "post" as const },
  getMe: { path: "/auth/me", method: "get" as const, deduplicate: true, transform: (r: any) => r.data },
  updateDetails: { path: "/auth/updatedetails", method: "put" as const, transform: (r: any) => r.data },
  updatePassword: { path: "/auth/updatepassword", method: "put" as const, transform: (r: any) => ({ token: r.token }) },
  deleteAccount: { path: "/auth/me", method: "delete" as const },
  updateLocation: { path: "/auth/location", method: "put" as const, transform: (r: any) => r.data },
};

const baseService = createService(endpoints, ["register", "login", "updatePassword"]);

export const authService = {
  ...baseService,
  deleteAccount: async (): Promise<void> => {
    await baseService.deleteAccount();
    authService.logout();
  },
} as typeof baseService & { deleteAccount: () => Promise<void> };

export default authService;
