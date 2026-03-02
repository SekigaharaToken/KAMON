import { sdk } from "@farcaster/miniapp-sdk";
import { useMiniAppContext } from "@/hooks/useMiniAppContext.js";

export function MiniAppLink({ href, children, ...props }) {
  const { isInMiniApp } = useMiniAppContext();

  function handleClick(e) {
    if (isInMiniApp) {
      e.preventDefault();
      sdk.actions.openUrl(href);
    }
  }

  return (
    <a
      href={href}
      target={isInMiniApp ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}
