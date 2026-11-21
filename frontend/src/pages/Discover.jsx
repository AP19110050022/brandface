import { ReportButton } from "@/components/ReportButton";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Users, Store, MapPin, ChevronDown, Loader2, SearchX, Clock, Plus, Search, Bookmark, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatorCard } from "@/components/CreatorCard";
import { FilterSheet, EMPTY_FILTERS, RadiusChips, LOC_KEYS } from "@/components/FilterSheet";
import { LocationPicker, locLabel } from "@/components/LocationPicker";
import { Seg, Empty } from "@/components/AppBits";
import { CATEGORIES, PLAN_BY_ID } from "@/constants/options";
import { useMe } from "@/context/MeContext";
import { publicApi } from "@/lib/api";

const Banner = ({ me, openPlus }) => {
  if (me.creator?.status === "pending") {
    return (
      <div className="glass rise mb-3 flex items-center gap-3 rounded-[22px] p-4" data-testid="creator-pending-banner">
        <Clock className="h-5 w-5 shrink-0 text-amber-300" />
        <p className="text-[13px]">Your presenter profile is under review. You'll get a notification once it's live.</p>
      </div>
    );
  }
  if (me.creator || me.business) return null;
  return (
    <button onClick={openPlus} data-testid="welcome-plus-button" className="cta rise relative mb-3 flex w-full items-center gap-3 overflow-hidden rounded-[26px] p-4 text-left">
      <span className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[24px] border-white/15" />
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#6C4CF1]"><Plus className="h-6 w-6" strokeWidth={2.6} /></span>
      <span className="relative">
        <b className="block text-[17px]">Hi {me.user.name?.split(" ")[0]}! Get started</b>
        <span className="text-[13px] text-white/90">Become a presenter or hire as a business.</span>
      </span>
    </button>
  );
};

export const pickToFilters = (l) => ({ city: l?.city || "", state: l?.state || "", lat: l?.lat ?? null, lng: l?.lng ?? null, radius_km: l?.city ? 50 : 0 });

const LocationPill = ({ filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const dist = filters.city ? (filters.radius_km ? `+${filters.radius_km} km` : "Only here") : "Anywhere";
  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="location-pill" className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 text-left text-[14px] font-extrabold text-[#1F1B2E] transition-transform active:scale-[.98]">
        <MapPin className="h-4 w-4 shrink-0 text-[#6C4CF1]" /><span className="truncate" data-testid="location-pill-label">{locLabel(filters)}</span>
        <span className="shrink-0 text-[13px] font-semibold text-[#5B5675]">· {dist}</span>
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[#5B5675]" />
      </button>
      <LocationPicker open={open} onOpenChange={setOpen} onPick={(l) => onChange(pickToFilters(l))} />
    </>
  );
};

const locParams = (f) => Object.fromEntries(LOC_KEYS.map((k) => [k, f[k]]).filter(([, v]) => v));

const CreatorGridSkeleton = () => (
  <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4" data-testid="creator-grid-skeleton">
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="creator-skeleton aspect-[3/4.2] rounded-[20px] sm:aspect-[3/4]" />
    ))}
  </div>
);

const CreatorLoadError = ({ onRetry }) => (
  <div className="mt-4 rounded-[22px] border border-white/15 bg-white/[.07] p-5 text-center" data-testid="creator-load-error">
    <p className="text-base font-extrabold">Couldn’t load presenters</p>
    <p className="mt-1 text-sm text-white/70">Check your connection, then try again.</p>
    <button
      type="button"
      onClick={onRetry}
      data-testid="creator-load-retry-button"
      className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#261567] active:scale-[.98]"
    >
      <RefreshCw className="h-4 w-4" />
      Try again
    </button>
  </div>
);

export const BusinessCard = ({ b, i, onOpen, saved, onToggleSave }) => (
  <div className="relative">
  <button onClick={() => onOpen?.(b)} data-testid={`business-card-${b.user_id}`} style={{ animationDelay: `${i * 60}ms` }}
    className="rise card-shadow relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-[#6C4CF1] to-[#3B25A8] p-4 text-left transition-transform active:scale-[.98]">
    <span className="absolute -right-12 -top-12 h-[190px] w-[190px] rounded-full border-[26px] border-white/15" />
    <div className="relative flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white text-lg font-extrabold text-[#6C4CF1]">{b.logo ? <img src={b.logo} alt="" className="h-full w-full object-cover" /> : b.company[0]}</span>
      <div className="min-w-0"><p className="truncate font-extrabold">{b.company}</p><p className="truncate text-xs text-white/80">{b.industry} · {b.city}{b.distance_km != null ? ` · ${b.distance_km} km` : ""}</p></div>
    </div>
    <div className="relative mt-3 flex flex-wrap gap-1.5">
      <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[11px] font-bold">Needs: {(b.need_plans || [b.need_plan]).map((p) => PLAN_BY_ID[p]?.label).join(", ")}</span>
      <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[11px] font-bold">Budget {b.budget}</span>
    </div>
  </button>
  {onToggleSave && (
    <button onClick={() => onToggleSave(b.user_id)} data-testid={`save-business-${b.user_id}`} aria-label="Save business" className="absolute right-2 top-2 grid h-11 w-11 place-items-center active:scale-90">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#6C4CF1]"><Bookmark className={`h-4 w-4 ${saved ? "fill-[#6C4CF1]" : ""}`} /></span>
    </button>
  )}
  </div>
);

export const JobCard = ({ j, i = 0, onInterest, mine }) => (
  <div className="rise card-shadow relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#6C4CF1] to-[#3B25A8] p-4" style={{ animationDelay: `${i * 60}ms` }} data-testid={`job-card-${j.id}`}>
    <span className="absolute -right-12 -top-12 h-[190px] w-[190px] rounded-full border-[26px] border-white/15" />
    {!mine && <div className="absolute right-3 top-3 z-10"><ReportButton type="job" id={j.id} label="Report" testid={`job-report-${j.id}`} className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-black/30" /></div>}
    <Link to={`/app/business/${j.business_id}`} className="relative flex items-center gap-3" data-testid={`job-business-link-${j.id}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white text-lg font-extrabold text-[#6C4CF1]">{j.logo ? <img src={j.logo} alt="" className="h-full w-full object-cover" /> : j.company[0]}</span>
      <div className="min-w-0"><p className="truncate text-[13px] font-bold">{j.company}</p><p className="truncate text-xs text-white/80">{j.city}{j.distance_km != null ? ` · ${Math.round(j.distance_km)} km` : ""}</p></div>
    </Link>
    <p className="relative mt-3 text-lg font-extrabold leading-tight">{j.title}</p>
    <p className="relative mt-1 line-clamp-2 text-[13px] text-white/85">{j.description}</p>
    <div className="relative mt-3 flex flex-wrap gap-1.5">
      {j.plans.map((p) => <span key={p} className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[11px] font-bold">{PLAN_BY_ID[p]?.label}</span>)}
      <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[11px] font-bold">Budget {j.budget}</span>
      {j.languages?.length > 0 && <span className="inline-flex h-6 items-center rounded-full bg-white/20 px-2.5 text-[11px] font-bold">{j.languages.slice(0, 2).join(", ")}</span>}
    </div>
    {!mine && onInterest && (
      <button disabled={j.applied} onClick={() => onInterest(j)} data-testid={`job-interest-${j.id}`}
        className="relative mt-4 h-11 w-full rounded-full bg-white text-sm font-extrabold text-[#3B25A8] transition-transform active:scale-[.98] disabled:opacity-70">
        {j.applied ? "Interest sent" : "I'm interested"}
      </button>
    )}
  </div>
);

const Jobs = ({ loc }) => {
  const { api, me } = useMe();
  const [list, setList] = useState(null);
  const key = JSON.stringify(loc);
  useEffect(() => { setList(null); api.get("/jobs", { params: JSON.parse(key) }).then((r) => setList(r.data)); }, [api, key]);
  const interest = async (j) => {
    if (!me.creator) return toast.error("Set up your presenter profile first. Tap + to start.");
    try { await api.post(`/jobs/${j.id}/interest`, { note: "" }); setList((l) => l.map((x) => (x.id === j.id ? { ...x, applied: true } : x))); toast.success(`Interest sent to ${j.company}`); }
    catch (e) { toast.error(e?.response?.data?.detail || "Couldn't send interest"); }
  };
  if (!list) return <div className="grid place-items-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!list.length) return <Empty icon={Store} title="No open jobs here yet" text="Businesses appear here when they post a job. Try a bigger distance or another location." testid="jobs-empty" />;
  return (
    <>
      <p className="mb-3 text-xs text-white/75">{list.length} businesses are hiring. Tap I'm interested and they can send you an offer.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="job-grid">{list.map((j, i) => <JobCard key={j.id} j={j} i={i} mine={j.business_id === me.user.user_id} onInterest={interest} />)}</div>
    </>
  );
};

const Businesses = ({ saved, onToggleSave, loc }) => {
  const { api } = useMe();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const key = JSON.stringify(loc);
  useEffect(() => { setList(null); api.get("/businesses", { params: JSON.parse(key) }).then((r) => setList(r.data)); }, [api, key]);
  if (!list) return <div className="grid place-items-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!list.length) return <Empty icon={Store} title="No businesses here yet" text="Try a bigger distance or another location." testid="businesses-empty" />;
  return (
    <>
      <p className="mb-3 text-xs text-white/75">{list.length} businesses are looking for faces. Set up a presenter profile so they can send you offers.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="business-grid">{list.map((b, i) => <BusinessCard key={b.user_id} b={b} i={i} onOpen={setOpen} saved={saved.includes(b.user_id)} onToggleSave={onToggleSave} />)}</div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-[28px] border-white/10 text-white" data-testid="business-detail-dialog">
          {open && (<>
            <DialogHeader><DialogTitle className="text-xl font-extrabold text-white">{open.company}</DialogTitle></DialogHeader>
            <p className="text-sm text-white/80">{open.industry} · {open.city}</p>
            <p className="text-sm">Usually hires: <b>{PLAN_BY_ID[open.need_plan]?.label}</b> · Budget <b>{open.budget}</b></p>
            {open.languages?.length > 0 && <p className="text-sm">Languages: {open.languages.join(", ")}</p>}
            {open.website && <p className="truncate text-sm text-white/70">{open.website}</p>}
          </>)}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Discover({ search = false }) {
  const { me, api } = useMe();
  const { openPlus } = useOutletContext();
  const [tab, setTab] = useState("creators");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const sort = filters.sort;
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState([]);

  const load = useCallback(async () => {
    const params = { q, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
    setLoadError("");
    try {
      const { data } = await publicApi.get("/creators", { params });
      setList(data);
    } catch (error) {
      setLoadError(error?.code === "ECONNABORTED" ? "timeout" : "network");
    }
  }, [filters, q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get("/saved/ids").then((r) => setSaved(r.data)).catch(() => {}); }, [api]);

  const toggleSave = async (id, kind = "creator") => {
    const on = saved.includes(id);
    setSaved((s) => (on ? s.filter((x) => x !== id) : [...s, id]));
    await (on ? api.delete(`/saved/${id}`) : api.post(`/saved/${id}`, null, { params: { kind } }));
  };

  return (
    <div data-testid={search ? "search-page" : "home-page"}>
      <Banner me={me} openPlus={openPlus} />
      {search && (
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city or category" className="rounded-full border-[1.5px] border-white/30 bg-white/15 pl-11 font-semibold" data-testid="discover-search-input" />
        </div>
      )}
      {!search && <Seg value={tab} onChange={setTab} options={[["creators", "Presenters", Users], ["businesses", "Jobs by businesses", Store]]} testid="discover-tabs" />}
      <div className="mt-2 flex gap-2">
        {(tab === "creators" || search) && <FilterSheet filters={filters} onApply={setFilters} />}
        <LocationPill filters={filters} onChange={(l) => setFilters((f) => ({ ...f, ...l }))} />
      </div>
      {filters.city && <div className="mt-2"><RadiusChips value={filters.radius_km} onChange={(radius_km) => setFilters((f) => ({ ...f, radius_km }))} testid="pill-radius" /></div>}
      {tab === "businesses" && !search ? <div className="mt-4"><Jobs loc={locParams(filters)} /></div> : (
        <>
          <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4">
            {[{ id: "" }, ...CATEGORIES].map((c) => (
              <button key={c.id || "all"} onClick={() => setFilters((f) => ({ ...f, category: c.id }))} data-testid={`category-chip-${(c.id || "all").toLowerCase().replace(/ /g, "-")}`}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors ${filters.category === c.id ? "bg-white text-[#3B25A8]" : "bg-white/15 text-white hover:bg-white/25"}`}>
                {c.icon && <c.icon className="h-3.5 w-3.5" />}{c.id || "All"}
              </button>
            ))}
          </div>
          {list && <p className="mt-3 text-xs text-white/75" data-testid="discover-count">{list.length} presenters{filters.city ? ` in and around ${filters.city}${filters.radius_km ? ` (${filters.radius_km} km)` : ""}` : filters.state ? ` in ${filters.state}` : " across India"}{sort !== "recommended" ? ` · ${{ nearest: "nearest first", price_asc: "price low to high", price_desc: "price high to low", rating: "top rated", newest: "newest" }[sort]}` : ""}. Profiles marked Sample are examples.</p>}
          {list === null ? (loadError ? <CreatorLoadError onRetry={load} /> : <CreatorGridSkeleton />)
            : list.length === 0 ? (
              <div className="mt-4"><Empty icon={SearchX} title="No presenters match" text={filters.city ? "Try a bigger distance, or choose the whole state." : "Try another location or clear your filters."} testid="discover-empty"
                action={<button className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#3B25A8]" onClick={() => { setFilters(EMPTY_FILTERS); setQ(""); }}>Clear filters</button>} /></div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" data-testid="creator-grid">
                {list.map((c, i) => <CreatorCard key={c.user_id} c={c} index={i} saved={saved.includes(c.user_id)} onToggleSave={toggleSave} />)}
              </div>
            )}
        </>
      )}
    </div>
  );
}
