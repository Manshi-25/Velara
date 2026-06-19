
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/archive")({
  component: ArchiveLayout,
});

function ArchiveLayout() {
  return <Outlet />;
}