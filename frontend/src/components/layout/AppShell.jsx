import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useClerk } from "@/lib/clerk";
import { ArrowLeft, Compass, Plus, Briefcase, MessageCircle, User, Bell, Search, Loader2, Bookmark, ShieldCheck, Ban } from "lucide-react";
import { Logo } from "@/components/Logo";
import { RoleChooser } from "@/components/RoleChooser";
import { useMe } from "@/context/MeContext";

const NAV = [
  { to: "/app", label: "Discover", icon: Compass, end: true, id: "home" },
  { to: "/app/deals", label: "Deals", icon: Briefcase, id: "deals" },
  null,
  { to: "/app/chat", label: "Chat", icon: MessageCircle, id: "chat" },
  { to: "/app/profile", label: "Profile", icon: User, id: "profile" },
];

const IconBtn = ({ to, icon: Icon, badge, testid, label }) => (
  <Link to={to} data-testid={testid} aria-label={label} className="relative grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition-[background-color,transform] hover:bg-white/25 active:scale-90">
    <Icon className="h-5 w-5" />
    {badge > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#3B25A8] bg-[#FF4D8D] px-1 text-[10px] font-extrabold" data-testid={`${testid}-badge`}>{badge > 9 ? "9+" : badge}</span>}
  </Link>
);

export const TopBar = ({ me, showBack }) => (
  <header className="topbar sticky top-0 z-30">
    <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        {showBack && <Link to="/app" data-testid="app-back-button" aria-label="Back to Discover" title="Back to Discover" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"><ArrowLeft className="h-5 w-5" /></Link>}
        <Logo to="/app" />
        {me?.user?.active_mode && (
          <span data-testid="mode-chip" className="hidden rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider sm:inline">{me.user.active_mode === "creator" ? "presenter" : me.user.active_mode}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {["owner", "admin"].includes(me?.user?.role) && <IconBtn to="/admin" icon={ShieldCheck} testid="top-admin-link" label="Admin" />}
        <IconBtn to="/app/search" icon={Search} testid="top-search-link" label="Search" />
        <IconBtn to="/app/saved" icon={Bookmark} testid="top-saved-link" label="Saved" />
        <IconBtn to="/app/notifications" icon={Bell} badge={me?.unread_notifications} testid="top-notifications-link" label="Notifications" />
      </div>
    </div>
  </header>
);

const BottomNav = ({ onPlus }) => (
  <nav className="mobile-bottom-nav fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md">
    <div className="flex h-[66px] items-center justify-around rounded-[33px] bg-white/[.97] px-1.5 shadow-[0_12px_30px_rgba(10,5,40,.4)]">
      {NAV.map((n, i) =>
        n ? (
          <NavLink key={n.id} to={n.to} end={n.end} data-testid={`nav-${n.id}`}
            className={({ isActive }) => `flex h-[54px] min-w-[62px] flex-col items-center justify-center gap-0.5 rounded-[25px] px-2.5 text-[10px] font-bold transition-colors ${isActive ? "bg-[#EDE8FF] text-[#3B25A8]" : "text-[#5B5675] hover:text-[#3B25A8]"}`}>
            <n.icon className="h-[22px] w-[22px]" /><span>{n.label}</span>
          </NavLink>
        ) : (
          <button key={i} onClick={onPlus} data-testid="nav-plus-fab" aria-label="Become a presenter or hire"
            className="cta grid h-[50px] w-[50px] place-items-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-90">
            <Plus className="h-7 w-7" strokeWidth={2.6} />
          </button>
        ),
      )}
    </div>
  </nav>
);

export const SignInFailed = () => {
  const { signOut } = useClerk();
  return (
    <div className="glass max-w-sm rounded-[28px] p-8 text-center" data-testid="signin-failed-screen">
      <p className="text-xl font-extrabold">We couldn't finish signing you in</p>
      <p className="mt-1 text-sm text-white/75">Please try again. If it keeps happening, sign out and sign in once more.</p>
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={() => window.location.reload()} className="h-11 rounded-full bg-white px-6 text-sm font-extrabold text-[#3B25A8]" data-testid="signin-failed-retry">Try again</button>
        <button onClick={() => signOut({ redirectUrl: "/sign-in" })} className="h-11 rounded-full bg-white/15 px-5 text-sm font-bold" data-testid="signin-failed-signout">Sign out</button>
      </div>
    </div>
  );
};

export const BlockedScreen = () => {
  const { signOut } = useClerk();
  useEffect(() => { const t = setTimeout(() => signOut({ redirectUrl: "/" }), 6000); return () => clearTimeout(t); }, [signOut]);
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center text-white" data-testid="account-blocked-screen">
      <div className="glass max-w-sm rounded-[28px] p-8">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-500/30"><Ban className="h-7 w-7" /></span>
        <p className="mt-4 text-xl font-extrabold">Your account is blocked</p>
        <p className="mt-1 text-sm text-white/75">Our team blocked this account for breaking the HireAvatar rules. You're being signed out.</p>
        <button onClick={() => signOut({ redirectUrl: "/" })} className="mt-5 h-11 rounded-full bg-white px-6 text-sm font-extrabold text-[#3B25A8]" data-testid="blocked-signout-button">Sign out</button>
      </div>
    </div>
  );
};

export default function AppShell() {
  const { me, error, blocked } = useMe();
  const [plus, setPlus] = useState(false);
  const { pathname } = useLocation();
  const hasPageBack = /^\/app\/(creator\/[^/]+|business\/[^/]+|chat\/[^/]+|posts|settings|setup\/(creator|business))$/.test(pathname);
  const showBack = pathname !== "/app" && !hasPageBack;
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  if (blocked) return <BlockedScreen />;
  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center text-white" data-testid="app-loading">
        {error ? <SignInFailed /> : <Loader2 className="h-8 w-8 animate-spin" />}
      </div>
    );
  }
  return (
    <div className="min-h-screen text-white">
      <TopBar me={me} showBack={showBack} />
      <main className="app-main-content mx-auto max-w-6xl px-3.5 pb-32 pt-4 sm:px-6">
        <Outlet context={{ openPlus: () => setPlus(true) }} />
      </main>
      <BottomNav onPlus={() => setPlus(true)} />
      <RoleChooser open={plus} onOpenChange={setPlus} />
    </div>
  );
}
