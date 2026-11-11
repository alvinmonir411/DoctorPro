import { redirect } from "next/navigation";

/** Redirects legacy `/admin` and `/admin/*` URLs cleanly to `/dashboard`. */
export default async function LegacyAdminRedirectPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  if (!slug || slug.length === 0 || slug[0] === "login") {
    redirect("/dashboard");
  }

  redirect(`/dashboard/${slug.join("/")}`);
}
