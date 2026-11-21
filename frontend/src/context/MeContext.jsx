import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useApi, publicApi } from "@/lib/api";
import { authEvent } from "@/lib/track";

const MeCtx = createContext(null);

export function MeProvider({ children }) {
  const api = useApi();
  const [me, setMe] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/me");
      setMe(data);
      setError(false);
      authEvent("signed_in");
      sessionStorage.removeItem("hmf_auth_attempt");
    } catch (e) {
      if (e?.response?.data?.detail === "account_blocked") { setBlocked(true); authEvent("blocked"); }
      else if (!sessionStorage.getItem("hmf_auth_signed_in")) authEvent("me_failed");
      setError(true);
    }
  }, [api]);

  useEffect(() => {
    refresh();
    publicApi.get("/config").then((r) => setConfig(r.data)).catch(() => setConfig(null));
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  return <MeCtx.Provider value={{ me, config, refresh, api, error, blocked }}>{children}</MeCtx.Provider>;
}

export const useMe = () => useContext(MeCtx);
