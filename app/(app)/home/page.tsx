import type { Metadata } from "next";
import { Suspense } from "react";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { firstNameOf } from "@/lib/people/defaults";
import { HOME_PREVIEWS, homeCopy, type HomePreview } from "./_data";
import { HomeContent } from "./_components/home-content";
import { HomeSkeleton } from "./_components/home-states";

export const metadata: Metadata = { title: homeCopy.metaTitle };

function previewFrom(value: string | undefined): HomePreview | null {
  if (process.env.NODE_ENV === "production" || value === undefined) return null;
  return (HOME_PREVIEWS as readonly string[]).includes(value)
    ? (value as HomePreview)
    : null;
}

export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const { person } = await requireAppContext(routes.app);
  const preview = previewFrom(firstParam((await searchParams).preview));
  const firstName = firstNameOf(person.displayName);
  const skeleton = <HomeSkeleton firstName={firstName} />;

  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      {preview === "loading" ? (
        skeleton
      ) : (
        <Suspense fallback={skeleton}>
          <HomeContent
            personId={person.id}
            firstName={firstName}
            forceEmpty={preview === "empty"}
          />
        </Suspense>
      )}
    </div>
  );
}
