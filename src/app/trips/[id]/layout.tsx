import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TripNav from "@/components/TripNav";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/trips" className="text-gray-400 hover:text-gray-600 shrink-0">
              ← Trips
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900 truncate">{trip.name}</span>
            {trip.destination && (
              <span className="hidden sm:inline text-sm text-indigo-600 shrink-0">
                {trip.destination}
              </span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <span className="text-sm text-gray-500 shrink-0 hidden sm:block">
              {trip.start_date ?? "?"} → {trip.end_date ?? "?"}
            </span>
          )}
        </div>
      </header>

      {/* Tab nav */}
      <TripNav tripId={id} />

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
