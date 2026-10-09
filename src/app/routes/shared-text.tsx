import { createRoute } from "@tanstack/react-router";
import { SharedTextView } from "@/features/public-share/components/shared-text-view";
import { rootRoute } from "./root";

export const sharedTextRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/s/$code",
  component: SharedTextPage,
});

function SharedTextPage() {
  const { code } = sharedTextRoute.useParams();

  return (
    <section className="stack">
      <SharedTextView code={code} />
    </section>
  );
}
