import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Extract access token directly from the auth cookie so it can be set
  // as a static Authorization header — this ensures auth.uid() works in RLS
  // regardless of how deep in the async call chain the DB request is made.
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0];
  const authCookieName = `sb-${projectRef}-auth-token`;
  const authCookie = allCookies.find((c) => c.name === authCookieName);
  let accessToken: string | null = null;
  if (authCookie?.value?.startsWith("base64-")) {
    try {
      const decoded = Buffer.from(
        authCookie.value.slice(7).replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8");
      accessToken = JSON.parse(decoded).access_token ?? null;
    } catch {
      // ignore decode errors
    }
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — session refresh handled by proxy
          }
        },
      },
    }
  );
}
