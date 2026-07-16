// @ts-nocheck
import api from "@/api/api";

export const claimApi = {
  list: (body) => api.post("/insuranceClaim/list", body).then((r) => r.data),
  summary: () => api.post("/insuranceClaim/summary", {}).then((r) => r.data),
  save: (body) => api.post("/insuranceClaim/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/insuranceClaim/setStatus", { id, status }).then((r) => r.data),
  remove: (id) => api.post("/insuranceClaim/delete", { id }).then((r) => r.data),
};
