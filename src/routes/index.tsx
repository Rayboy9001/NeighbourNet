import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, ThumbsUp, Wrench } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeighbourNet — See it. Report it. Fix it together." },
      {
        name: "description",
        content:
          "Report local issues, confirm what your neighbours have seen, and track repairs in your community.",
      },
      { property: "og:title", content: "NeighbourNet — Report local issues" },
      {
        property: "og:description",
        content:
          "A friendly community platform for reporting potholes, broken streetlights, waste, and more.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">
            N
          </div>
          <span className="font-bold text-lg">NeighbourNet</span>
        </div>
        <Link
          to="/auth"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          Open app
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 md:pt-20 pb-16 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          Community reporting, made simple
        </span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          See it. Report it.
          <br />
          <span className="text-primary">Fix it together.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          NeighbourNet helps residents report, discover, and track local issues — potholes, broken
          streetlights, waste, and more. Real problems, real neighbours, real progress.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-lift"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-4 text-left">
          {[
            {
              icon: MapPin,
              title: "Spot an issue",
              body: "Snap a photo and pin the location in seconds.",
            },
            {
              icon: ThumbsUp,
              title: "Confirm together",
              body: "Neighbours verify reports so real problems rise to the top.",
            },
            {
              icon: Wrench,
              title: "Track the fix",
              body: "Follow every issue from reported to resolved.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
