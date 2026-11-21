import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Show } from "@/lib/clerk";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { MeProvider } from "@/context/MeContext";
import AppShell from "@/components/layout/AppShell";
import Landing from "@/pages/Landing";
import Discover from "@/pages/Discover";
import AdminShell from "@/pages/admin/AdminShell";
import { RouteTracker, authEvent } from "@/lib/track";

const SignInPage = lazy(() => import("@/pages/AuthPages").then((module) => ({
  default: module.SignInPage,
})));
const SignUpPage = lazy(() => import("@/pages/AuthPages").then((module) => ({
  default: module.SignUpPage,
})));
const CreatorProfile = lazy(() => import("@/pages/CreatorProfile"));
const CreatorSetup = lazy(() => import("@/pages/CreatorSetup"));
const BusinessSetup = lazy(() => import("@/pages/BusinessSetup"));
const Deals = lazy(() => import("@/pages/Deals"));
const ChatList = lazy(() => import("@/pages/ChatList"));
const DealRoom = lazy(() => import("@/pages/DealRoom"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Saved = lazy(() => import("@/pages/Saved"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const Posts = lazy(() => import("@/pages/Posts"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const BusinessProfile = lazy(() => import("@/pages/BusinessProfile"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Approvals = lazy(() => import("@/pages/admin/Approvals"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const UserDetail = lazy(() => import("@/pages/admin/UserDetail"));
const Content = lazy(() => import("@/pages/admin/Content"));
const AdminDeals = lazy(() => import("@/pages/admin/AdminDeals"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const Team = lazy(() => import("@/pages/admin/Team"));
const Pricing = lazy(() => import("@/pages/admin/Pricing"));
const Activity = lazy(() => import("@/pages/admin/Activity"));

const RouteLoader = () => (
  <div className="grid min-h-screen place-items-center text-white" data-testid="route-loading">
    <div className="creator-skeleton h-11 w-11 rounded-full" />
  </div>
);

const SignedOut = ({ to }) => {
  const at = Number(sessionStorage.getItem("hmf_auth_attempt") || 0);
  if (at && Date.now() - at < 180000) authEvent("bounced");
  return <Navigate to={to} replace />;
};

const Protected = () => (
  <>
    <Show when="signed-in"><MeProvider><AppShell /></MeProvider></Show>
    <Show when="signed-out"><SignedOut to="/" /></Show>
  </>
);

const ProtectedAdmin = () => (
  <>
    <Show when="signed-in"><MeProvider><AdminShell /></MeProvider></Show>
    <Show when="signed-out"><SignedOut to="/sign-in" /></Show>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <ClerkAuthProvider>
        <RouteTracker />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/app" element={<Protected />}>
              <Route index element={<Discover />} />
              <Route path="search" element={<Discover search />} />
              <Route path="creator/:id" element={<CreatorProfile />} />
              <Route path="setup/creator" element={<CreatorSetup />} />
              <Route path="setup/business" element={<BusinessSetup />} />
              <Route path="deals" element={<Deals />} />
              <Route path="chat" element={<ChatList />} />
              <Route path="chat/:id" element={<DealRoom />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="saved" element={<Saved />} />
              <Route path="upgrade" element={<Navigate to="/app/profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Navigate to="/admin" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="posts" element={<Posts />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="business/:id" element={<BusinessProfile />} />
            </Route>
            <Route path="/admin" element={<ProtectedAdmin />}>
              <Route index element={<AdminDashboard />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="content" element={<Content />} />
              <Route path="deals" element={<AdminDeals />} />
              <Route path="reports" element={<Reports />} />
              <Route path="team" element={<Team />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="activity" element={<Activity />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-center" richColors />
      </ClerkAuthProvider>
    </BrowserRouter>
  );
}

export default App;
