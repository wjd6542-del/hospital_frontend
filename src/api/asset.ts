// @ts-nocheck
import api from "@/api/api";

export const assetApi = {
  list: (body) => api.post("/asset/list", body).then((r) => r.data),
  summary: () => api.post("/asset/summary", {}).then((r) => r.data),
  save: (body) => api.post("/asset/save", body).then((r) => r.data),
  remove: (id) => api.post("/asset/delete", { id }).then((r) => r.data),
};
