import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkProvider as NativeClerkProvider } from "capacitor-clerk";
import { Capacitor } from "@capacitor/core";
import { ClerkProvider as WebClerkProvider } from "@clerk/react";
import { ClerkHooksBridge } from "@/lib/clerk";

const appearance = {
  variables: {
    colorPrimary: "#7C3AED",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#0F172A",
    colorBorder: "#E2E8F0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    formFieldInput: "border-2 border-slate-500 shadow-sm focus:border-violet-600 focus:ring-2 focus:ring-violet-300",
    socialButtonsBlockButton: "border-2 border-slate-500 shadow-sm hover:border-violet-600",
  },
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Starts Clerk from the backend's runtime config, so deploy's live keys need no rebuild.
export default function ClerkAuthProvider({ children }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    const root = document.documentElement;
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewport?.getAttribute("content");
    root.classList.add("native-app");
    viewport?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    );

    return () => {
      root.classList.remove("native-app");
      if (previousViewport) {
        viewport?.setAttribute("content", previousViewport);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${BACKEND_URL}/api/clerk/config`, {
          signal: controller.signal,
        });
        const cfg = await response.json();
        if (cfg.enabled) return cancelled || setConfig(cfg);
      } catch {
        // The retry below handles offline launches and backend restarts.
      } finally {
        window.clearTimeout(timeout);
      }
      if (cancelled) return;
      if (attempt >= 20) return setUnavailable(true);
      setTimeout(() => load(attempt + 1), 1500);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const isNative = Capacitor.isNativePlatform();

  if (unavailable) return (
    <div className="grid min-h-screen place-items-center px-6 text-center text-white" data-testid="signin-unavailable">
      <div className="glass max-w-sm rounded-[28px] p-8">
        <p className="text-xl font-extrabold">Sign-in is unavailable right now</p>
        <p className="mt-1 text-sm text-white/75">We couldn't reach the sign-in service.</p>
        <button onClick={() => window.location.reload()} className="mt-5 h-11 rounded-full bg-white px-6 text-sm font-extrabold text-[#3B25A8]" data-testid="signin-unavailable-retry">Try again</button>
      </div>
    </div>
  );
  if (!config) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-white" data-testid="auth-config-loading">
        <div>
          <p className="text-lg font-extrabold">Opening HireAvatar</p>
          <div className="creator-skeleton mx-auto mt-4 h-2 w-28 rounded-full" />
        </div>
      </div>
    );
  }
  if (isNative) {
    return (
      <NativeClerkProvider publishableKey={config.publishable_key}>
        <ClerkHooksBridge>{children}</ClerkHooksBridge>
      </NativeClerkProvider>
    );
  }

  return (
    <WebClerkProvider
      publishableKey={config.publishable_key}
      proxyUrl={config.proxy_url || undefined}
      appearance={appearance}
      localization={{
        signIn: { start: { title: "Continue to HireAvatar", titleCombined: "Continue to HireAvatar" } },
        signUp: { start: { title: "Create your HireAvatar account", titleCombined: "Create your HireAvatar account" } },
      }}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={isNative ? "co.hireavatar.app://auth/callback" : "/app"}
      signUpFallbackRedirectUrl={isNative ? "co.hireavatar.app://auth/callback" : "/app"}
      afterSignOutUrl="/"
    >
      <ClerkHooksBridge>{children}</ClerkHooksBridge>
    </WebClerkProvider>
  );
}
