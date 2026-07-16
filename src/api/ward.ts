// @ts-nocheck
import api from "@/api/api";

export const admissionApi = {
  list: (body) => api.post("/admission/list", body).then((r) => r.data),
  summary: () => api.post("/admission/summary", {}).then((r) => r.data),
  save: (body) => api.post("/admission/save", body).then((r) => r.data),
  discharge: (id, discharged_at) => api.post("/admission/discharge", { id, discharged_at }).then((r) => r.data),
  remove: (id) => api.post("/admission/delete", { id }).then((r) => r.data),
};
