// @ts-nocheck
import api from "@/api/api";

// 계정과목 (수입/지출 분류)
export const accountApi = {
  list: (body = {}) => api.post("/financeAccount/list", body).then((r) => r.data),
  save: (body) => api.post("/financeAccount/save", body).then((r) => r.data),
  remove: (id) => api.post("/financeAccount/delete", { id }).then((r) => r.data),
};

// 수입·지출 거래
export const txnApi = {
  list: (body) => api.post("/financeTxn/list", body).then((r) => r.data),
  save: (body) => api.post("/financeTxn/save", body).then((r) => r.data),
  summary: (body) => api.post("/financeTxn/summary", body).then((r) => r.data),
  remove: (id) => api.post("/financeTxn/delete", { id }).then((r) => r.data),
  // 영수증/증빙 업로드 (multipart) → [{ path, filename, mime_type, size, is_image }]
  upload: (files) => {
    const fd = new FormData();
    for (const f of files) fd.append("file", f);
    return api.post("/upload", fd).then((r) => r.data);
  },
};
