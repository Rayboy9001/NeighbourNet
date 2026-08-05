import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/square")({
  ssr: false,
  component: SquareLayout,
});

function SquareLayout() {
  return <Outlet />;
}
