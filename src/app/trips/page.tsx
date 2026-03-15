import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import Link from "next/link";

export default async function TripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  async function createTrip(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const name = formData.get("name") as string;
    const destination = (formData.get("destination") as string) || null;
    const description = (formData.get("description") as string) || null;
    const start_date = (formData.get("start_date") as string) || null;
    const end_date = (formData.get("end_date") as string) || null;

    const tripId = randomUUID();
    const { error } = await supabase
      .from("trips")
      .insert({ id: tripId, name, destination, description, start_date, end_date, created_by: user.id });

    if (error) redirect(`/trips?createError=${encodeURIComponent(error.code + ': ' + error.message)}`);
    redirect(`/trips/${tripId}/calendar`);
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900">tae-atlas</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action={signOut}>
              <button className="text-sm text-gray-500 hover:text-gray-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your trips</h1>
        </div>

        {/* Trip list */}
        {trips && trips.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 mb-10">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}/calendar`}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <h2 className="font-semibold text-gray-900">{trip.name}</h2>
                {trip.destination && (
                  <p className="text-sm text-indigo-600 mt-0.5">{trip.destination}</p>
                )}
                {(trip.start_date || trip.end_date) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {trip.start_date ?? "?"} → {trip.end_date ?? "?"}
                  </p>
                )}
                {trip.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {trip.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-10">No trips yet. Create your first one below.</p>
        )}

        {/* Create trip */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">New trip</h2>
          <form action={createTrip} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="trip-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Trip name <span className="text-red-500">*</span>
                </label>
                <input
                  id="trip-name"
                  name="name"
                  required
                  placeholder="Scotland 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="trip-destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  id="trip-destination"
                  name="destination"
                  placeholder="Scotland"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="trip-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start date
                </label>
                <input
                  id="trip-start-date"
                  name="start_date"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="trip-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End date
                </label>
                <input
                  id="trip-end-date"
                  name="end_date"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="trip-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="trip-description"
                name="description"
                rows={2}
                placeholder="A quick note about this trip..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create trip
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
