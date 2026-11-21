import axios from "axios";
import { useMemo } from "react";
import { useAuth } from "@/lib/clerk";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const REQUEST_TIMEOUT_MS = 12000;
export const publicApi = axios.create({ baseURL: API, timeout: REQUEST_TIMEOUT_MS });

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => {
    const inst = axios.create({ baseURL: API, timeout: REQUEST_TIMEOUT_MS });
    inst.interceptors.request.use(async (cfg) => {
      const t = await getToken();
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    return inst;
  }, [getToken]);
}

export function errMsg(e, fallback = "Something went wrong") {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]) {
    const field = d[0].loc?.[d[0].loc.length - 1];
    return `${field ? field.replace(/_/g, " ") + ": " : ""}${d[0].msg}`;
  }
  return fallback;
}

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function timeAgo(isoStr) {
  const s = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
