import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { ThemeProvider } from "next-themes";
import { sdk } from "@farcaster/miniapp-sdk";
import { Toaster } from "@/components/ui/sonner.jsx";
import { MiniAppAutoConnect } from "@/components/auth/MiniAppAutoConnect.jsx";
import { FarcasterProvider } from "@/context/FarcasterProvider.jsx";
import { HouseProvider } from "@/context/HouseContext.jsx";
import { LoginModalProvider } from "@/context/LoginModalContext.jsx";
import { wagmiConfig } from "@/config/wagmi.js";
import App from "./App.jsx";
import "./i18n";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

// Signal ready to Farcaster immediately — must fire even if React crashes.
// MiniAppAutoConnect also calls this, but this top-level call is the safety net.
sdk.actions.ready().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
    },
  },
});

const authKitConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: typeof window !== "undefined" ? window.location.host : "localhost",
  siweUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
};

import { ErrorBoundary } from "@/components/layout/ErrorBoundary.jsx";

try {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <MiniAppAutoConnect />
              <AuthKitProvider config={authKitConfig}>
                <RainbowKitProvider
                  theme={darkTheme({
                    accentColor: "#c92a22",
                    borderRadius: "medium",
                  })}
                >
                  <FarcasterProvider>
                    <HouseProvider>
                      <LoginModalProvider>
                        <BrowserRouter>
                          <App />
                          <Toaster />
                        </BrowserRouter>
                      </LoginModalProvider>
                    </HouseProvider>
                  </FarcasterProvider>
                </RainbowKitProvider>
              </AuthKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (err) {
  // Vanilla DOM fallback — visible even if React or providers crash
  const root = document.getElementById("root");
  root.innerHTML = `<div style="padding:2rem;color:#fff;background:#1a0505;font-family:monospace;min-height:100vh">
    <h1 style="color:#c92a22">KAMON failed to start</h1>
    <pre style="white-space:pre-wrap;margin-top:1rem;color:#dccf8e">${String(err?.message || err)}</pre>
    <pre style="white-space:pre-wrap;margin-top:0.5rem;color:#6f5652;font-size:0.8rem">${String(err?.stack || "")}</pre>
  </div>`;
}
