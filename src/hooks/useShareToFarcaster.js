import { useCallback } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniAppContext } from "./useMiniAppContext.js";

/**
 * Generic hook for sharing a cast to Farcaster.
 * Uses sdk.actions.composeCast inside MiniApp,
 * falls back to Warpcast compose URL in standalone browser.
 *
 * @param {Object} options
 * @param {string} options.channelKey — Farcaster channel (default: none)
 */
export function useShareToFarcaster({ channelKey } = {}) {
  const { isInMiniApp } = useMiniAppContext();

  /**
   * Open the Farcaster compose flow.
   * @param {string} text — Cast text
   * @param {string} [embedUrl] — Optional URL to embed in the cast
   */
  const share = useCallback(async (text, embedUrl) => {
    if (isInMiniApp) {
      const opts = { text };
      if (embedUrl) opts.embeds = [embedUrl];
      if (channelKey) opts.channelKey = channelKey;
      await sdk.actions.composeCast(opts);
    } else {
      const params = new URLSearchParams();
      params.set("text", text);
      if (embedUrl) params.append("embeds[]", embedUrl);
      if (channelKey) params.set("channelKey", channelKey);
      window.open(`https://warpcast.com/~/compose?${params.toString()}`, "_blank");
    }
  }, [isInMiniApp, channelKey]);

  return { share };
}
