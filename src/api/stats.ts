// @ts-nocheck
import api from "@/api/api";

export const statsApi = {
  overview: () => api.post("/stats/overview", {}).then((r) => r.data),
};
