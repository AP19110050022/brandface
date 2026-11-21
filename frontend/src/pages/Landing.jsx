import { useAuth } from "@/lib/clerk";
import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, Play, Store, Video, CalendarClock, Crown, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { publicApi, inr } from "@/lib/api";

const Peek = () => {
  const [list, setList] = useState([]);
  useEffect(() => { publicApi.get("/creators", { params: { limit: 8 } }).then((r) => setList(r.data)).catch(() => {}); }, []);
  if (!list.length) return null;
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2" data-testid="landing-creator-strip">
      {list.map((c, i) => (
        <Link to="/sign-up" key={c.user_id} className="rise card-shadow relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-[22px] sm:w-44" style={{ animationDelay: `${i * 60}ms` }}>
          <img src={c.photo} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,5,40,.9)] via-transparent to-transparent" />
          <div className="absolute inset-x-2.5 bottom-2.5">
            <p className="flex items-center gap-1 truncate text-sm font-extrabold">{c.name}<span className="h-1.5 w-1.5 rounded-full bg-[#5CE0A0]" /></p>
            <span className="mt-1 inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[10.5px] font-extrabold text-[#3B25A8]">from {inr(c.from_price ?? c.rate_per_video)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

const PLAN_PILLS = [
  { icon: Video, t: "Per Video", d: "One finished video, from the presenter's price" },
  { icon: CalendarClock, t: "Part-time", d: "Up to 8 videos + 1 shoot day a month" },
  { icon: Crown, t: "Full-time", d: "Your dedicated face, up to 20 videos a month" },
];

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && isSignedIn) return <Navigate to="/app" replace />;
  return (
    <div className="min-h-screen text-white" data-testid="landing-page">
      <div className="landing-content mx-auto max-w-xl px-5 pb-12 pt-10 sm:pt-16">
        <div className="flex items-center justify-between">
          <Logo size="text-[34px]" />
          <Link to="/sign-in" className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/25" data-testid="landing-login-button">Log in</Link>
        </div>
        <h1 className="rise mt-8 text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-5xl">Be the face of a brand.<br />Or find yours.</h1>
        <p className="rise mt-3 text-[17px] text-white/80" style={{ animationDelay: "80ms" }}>Presenters get hired to promote. Businesses find on-camera talent in minutes.</p>
        <div className="mt-7"><Peek /></div>
        <div className="mt-7 space-y-3">
          <Link to="/sign-up" data-testid="landing-signup-button" className="flex h-[54px] items-center justify-center rounded-[27px] bg-white text-base font-extrabold text-[#2E1C8C] shadow-lg transition-transform active:scale-[.98]">Create account</Link>
          <Link to="/sign-in" data-testid="landing-signin-button" className="glass flex h-[54px] items-center justify-center rounded-[27px] text-base font-bold transition-colors hover:bg-white/20">I already have an account</Link>
          <p className="text-center text-xs text-white/60">Continue with Google or email. Choose presenter or business after you sign in.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3">
          {[[Play, "Presenters", "Join free, set your own prices, and receive business offers.", "from-[#7C5CFF] to-[#FF5FA2]"], [Store, "Businesses", "Message presenters and send offers.", "from-[#3B82F6] to-[#7C5CFF]"]].map(([Icon, t, d, tone]) => (
            <div key={t} className="glass rounded-[22px] p-4" data-testid={`landing-side-${t.toLowerCase()}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${tone}`}><Icon className="h-5 w-5" /></span>
              <p className="mt-3 font-extrabold">{t}</p>
              <p className="text-[13px] leading-snug text-white/75">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xs font-bold uppercase tracking-widest text-white/60">Three simple ways to hire</p>
        <div className="mt-3 space-y-2.5">
          {PLAN_PILLS.map((p) => (
            <Link to="/sign-up" key={p.t} className="glass-soft flex items-center gap-3 rounded-[22px] p-3.5 transition-colors hover:bg-white/15" data-testid={`landing-plan-${p.t.toLowerCase().replace(/ /g, "-")}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-white/40"><p.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-extrabold">{p.t}</p><p className="truncate text-[13px] text-white/70">{p.d}</p></div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </Link>
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-white/60"><ShieldCheck className="h-4 w-4" />Businesses can send presenters an offer to start a conversation.</p>
        <p className="mt-6 text-center text-xs text-white/40">© {new Date().getFullYear()} HireAvatar</p>
      </div>
    </div>
  );
}
