import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>
      ) => string;

      remove: (
        widgetId?: string
      ) => void;
    };
  }
}

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function Turnstile({
  onToken
}: {
  onToken: (token: string) => void;
}) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const widgetId =
    useRef<string | null>(null);

  useEffect(() => {
    function renderWidget() {
      if (
        !containerRef.current ||
        !window.turnstile
      ) {
        return;
      }

      if (widgetId.current) {
        return;
      }

      console.log(
        "Rendering Turnstile..."
      );

      widgetId.current =
        window.turnstile.render(
          containerRef.current,
          {
            sitekey:
              TURNSTILE_SITE_KEY,

            theme: "dark",

            callback: (
              token: string
            ) => {
              console.log(
                "TURNSTILE TOKEN:",
                token
              );

              onToken(token);
            },

            "expired-callback":
              () => {
                console.log(
                  "Token expired"
                );

                onToken("");
              },

            "error-callback":
              () => {
                console.log(
                  "Turnstile error"
                );

                onToken("");
              }
          }
        );
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript =
        document.querySelector(
          `script[src="${SCRIPT_URL}"]`
        );

      if (!existingScript) {
        const script =
          document.createElement(
            "script"
          );

        script.src =
          SCRIPT_URL;

        script.async =
          true;

        script.defer =
          true;

        script.onload =
          renderWidget;

        document.body.appendChild(
          script
        );
      } else {
        renderWidget();
      }
    }

    return () => {
      if (
        widgetId.current &&
        window.turnstile
      ) {
        window.turnstile.remove(
          widgetId.current
        );

        widgetId.current =
          null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex justify-center"
    />
  );
}