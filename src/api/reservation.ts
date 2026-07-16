// @ts-nocheck
import api from "@/api/api";

export const appointmentApi = {
  list: (body) => api.post("/appointment/list", body).then((r) => r.data),
  save: (body) => api.post("/appointment/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/appointment/setStatus", { id, status }).then((r) => r.data),
  remove: (id) => api.post("/appointment/delete", { id }).then((r) => r.data),
};
