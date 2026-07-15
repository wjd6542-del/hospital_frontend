// @ts-nocheck
import api from "@/api/api";

// 휴가유형 마스터 (연차·병가·경조사·공가·무급)
export const leaveTypeApi = {
  list: (body = {}) => api.post("/leaveType/list", body).then((r) => r.data),
  save: (body) => api.post("/leaveType/save", body).then((r) => r.data),
  remove: (id) => api.post("/leaveType/delete", { id }).then((r) => r.data),
};

// 연차 부여 (직원 × 연도 — 부여/사용/잔여 + 법정 제안값)
export const leaveGrantApi = {
  list: (body) => api.post("/leaveGrant/list", body).then((r) => r.data),
  save: (body) => api.post("/leaveGrant/save", body).then((r) => r.data),
  remove: (id) => api.post("/leaveGrant/delete", { id }).then((r) => r.data),
};

// 휴가 신청 / 승인
export const leaveRequestApi = {
  list: (body = {}) => api.post("/leaveRequest/list", body).then((r) => r.data),
  create: (body) => api.post("/leaveRequest/create", body).then((r) => r.data),
  approve: (id) => api.post("/leaveRequest/approve", { id }).then((r) => r.data),
  reject: (id, reason) => api.post("/leaveRequest/reject", { id, reason }).then((r) => r.data),
  cancel: (id) => api.post("/leaveRequest/cancel", { id }).then((r) => r.data),
  remove: (id) => api.post("/leaveRequest/delete", { id }).then((r) => r.data),
};
