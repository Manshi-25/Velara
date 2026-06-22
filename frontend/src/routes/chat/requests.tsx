import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /chat/requests used to be its own page. Requests now live as a tab
 * inside /chat (see routes/chat/index.tsx), so this route just sends
 * anyone who still has the old link/bookmark to the right place.
 */
export const Route = createFileRoute("/chat/requests")({
  beforeLoad: () => {
    throw redirect({ to: "/chat", search: { tab: "requests" } });
  },
});
