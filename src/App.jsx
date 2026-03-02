import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Home, ArrowLeftRight, Layers, Trophy, Activity, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header.jsx";
import { Footer } from "@/components/layout/Footer.jsx";
import { BottomNav } from "@/components/layout/BottomNav.jsx";
import { PageWrapper } from "@/components/layout/PageWrapper.jsx";
import { NetworkGuardBanner } from "@/components/layout/NetworkGuardBanner.jsx";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary.jsx";
import { LoginModal } from "@/components/auth/LoginModal.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import HomePage from "@/pages/HomePage.jsx";

const SwapPage = lazy(() => import("@/pages/SwapPage.jsx"));
const StakingPage = lazy(() => import("@/pages/StakingPage.jsx"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage.jsx"));
const ActivityPage = lazy(() => import("@/pages/ActivityPage.jsx"));
const AdminPage = lazy(() => import("@/pages/AdminPage.jsx"));
const ChatPage = lazy(() => import("@/pages/ChatPage.jsx"));

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <NetworkGuardBanner />
      <Header />
      <ErrorBoundary>
        <PageWrapper>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/staking" element={<StakingPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </Suspense>
        </PageWrapper>
      </ErrorBoundary>
      <Footer />
      <BottomNav
        items={[
          { to: "/", icon: Home, labelKey: "nav.home" },
          { to: "/swap", icon: ArrowLeftRight, labelKey: "nav.swap" },
          { to: "/staking", icon: Layers, labelKey: "nav.staking" },
          { to: "/leaderboard", icon: Trophy, labelKey: "nav.leaderboard" },
          { to: "/activity", icon: Activity, labelKey: "nav.activity" },
          { to: "/chat", icon: MessageCircle, labelKey: "nav.chat" },
        ]}
      />
      <LoginModal />
    </div>
  );
}

export default App;
