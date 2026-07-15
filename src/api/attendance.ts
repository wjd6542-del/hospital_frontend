// @ts-nocheck
import api from "@/api/api";

// 근무유형 (D/E/N/OFF/ANNUAL/SICK)
export const shiftTypeApi = {
  list: (body = {}) => api.post("/shiftType/list", body).then((r) => r.data),
  save: (body) => api.post("/shiftType/save", body).then((r) => r.data),
  remove: (id) => api.post("/shiftType/delete", { id }).then((r) => r.data),
};

// 근무표 (직원 × 날짜 그리드)
export const shiftScheduleApi = {
  grid: (department_id, year, month) =>
    api.post("/shiftSchedule/grid", { department_id, year, month }).then((r) => r.data),
  saveCell: (body) => api.post("/shiftSchedule/saveCell", body).then((r) => r.data),
  saveBulk: (cells) => api.post("/shiftSchedule/saveBulk", { cells }).then((r) => r.data),
  copyMonth: (body) => api.post("/shiftSchedule/copyMonth", body).then((r) => r.data),
  deleteCell: (employee_id, work_date) =>
    api.post("/shiftSchedule/deleteCell", { employee_id, work_date }).then((r) => r.data),
};

// 출퇴근
export const attendanceApi = {
  list: (body) => api.post("/attendance/list", body).then((r) => r.data),
  save: (body) => api.post("/attendance/save", body).then((r) => r.data),
  bulkGenerate: (department_id, work_date) =>
    api.post("/attendance/bulkGenerate", { department_id, work_date }).then((r) => r.data),
  summary: (department_id, year, month) =>
    api.post("/attendance/summary", { department_id, year, month }).then((r) => r.data),
  remove: (id) => api.post("/attendance/delete", { id }).then((r) => r.data),
};
