// @ts-nocheck
import api from "@/api/api";

export const facilityApi = {
  list: (body) => api.post("/facilityRequest/list", body).then((r) => r.data),
  summary: () => api.post("/facilityRequest/summary", {}).then((r) => r.data),
  save: (body) => api.post("/facilityRequest/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/facilityRequest/setStatus", { id, status }).then((r) => r.data),
  remove: (id) => api.post("/facilityRequest/delete", { id }).then((r) => r.data),
};
