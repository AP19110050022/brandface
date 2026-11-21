import { Link } from "react-router-dom";
import { Bookmark, MapPin, Star } from "lucide-react";
import { inr } from "@/lib/api";
import { PLAN_BY_ID } from "@/constants/options";

export const CreatorCard = ({ c, saved, onToggleSave, to, index = 0 }) => (
  <div className="rise group relative" style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }} data-testid={`creator-card-${c.user_id}`}>
    <Link to={to || `/app/creator/${c.user_id}`} className="card-shadow relative block aspect-[3/4.2] overflow-hidden rounded-[20px] bg-[#6C4CF1] text-white transition-transform duration-200 active:scale-[.98] sm:aspect-[3/4]">
      <img src={c.photo} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,5,40,.28)_0%,rgba(10,5,40,0)_26%,rgba(10,5,40,0)_42%,rgba(10,5,40,.92)_100%)]" />
      <div className="absolute left-2.5 right-12 top-2.5 flex flex-wrap gap-1">
        {(c.plans || []).slice(0, 1).map((p) => <span key={p} className="flex h-[22px] items-center rounded-full bg-[rgba(10,5,40,.5)] px-2.5 text-[10.5px] font-bold backdrop-blur" data-testid={`card-plan-${p}`}>{PLAN_BY_ID[p]?.label}</span>)}
        {(c.plans || []).length > 1 && <span className="flex h-[22px] items-center rounded-full bg-[rgba(10,5,40,.5)] px-2 text-[10.5px] font-bold backdrop-blur" data-testid="card-plan-more">+{c.plans.length - 1}</span>}
        {c.is_sample && <span className="flex h-[22px] items-center rounded-full bg-[rgba(10,5,40,.5)] px-2.5 text-[10.5px] font-bold backdrop-blur">Sample</span>}
      </div>
      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
          <b className="truncate">{c.name}</b>
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#5CE0A0] shadow-[0_0_8px_#5CE0A0]" />
        </div>
        <p className="truncate text-xs opacity-90">{(c.categories || [c.category]).join(" · ")}</p>
        <p className="flex items-center gap-2 truncate text-xs opacity-90">
          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.distance_km != null ? `${c.city} · ${c.distance_km < 1 ? "<1" : Math.round(c.distance_km)} km` : c.city}</span>
          {c.rating_count > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-300 text-amber-300" />{c.rating_avg}</span>}
        </p>
        <span className="mt-2 inline-flex h-[26px] items-center whitespace-nowrap rounded-full bg-white px-3 text-[11.5px] font-extrabold text-[#3B25A8]" data-testid={`creator-card-price-${c.user_id}`}>
          from {inr(c.from_price ?? c.rate_per_video)} {PLAN_BY_ID[c.from_plan || "per_video"]?.unit.replace("/", "/ ")}
        </span>
      </div>
    </Link>
    {onToggleSave && (
      <button onClick={() => onToggleSave(c.user_id)} data-testid={`save-creator-${c.user_id}`} aria-label="Save presenter"
        className="absolute right-1 top-1 grid h-11 w-11 place-items-center transition-transform duration-200 active:scale-90">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#6C4CF1]">
          <Bookmark className={`h-4 w-4 ${saved ? "fill-[#6C4CF1]" : ""}`} />
        </span>
      </button>
    )}
  </div>
);
