import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cm/")({
  beforeLoad: () => {
    throw redirect({ to: "/cm/posts" });
  },
  component: () => null,
});
