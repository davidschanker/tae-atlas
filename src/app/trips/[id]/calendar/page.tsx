import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editing?: string }>;
}) {
  const { id: tripId } = await params;
  const { editing } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: days }, { data: accommodations }] = await Promise.all([
    supabase
      .from("itinerary_days")
      .select("*, accommodations(name)")
      .eq("trip_id", tripId)
      .order("date"),
    supabase
      .from("accommodations")
      .select("id, name")
      .eq("trip_id", tripId)
      .order("name"),
  ]);

  async function addDay(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tripId = formData.get("trip_id") as string;
    const date = formData.get("date") as string;
    const location = (formData.get("location") as string) || null;
    const accommodation_id = (formData.get("accommodation_id") as string) || null;
    const notes = (formData.get("notes") as string) || null;

    const { data: existing } = await supabase
      .from("itinerary_days")
      .select("id")
      .eq("trip_id", tripId)
      .eq("date", date)
      .single();

    if (existing) {
      await supabase
        .from("itinerary_days")
        .update({ location, accommodation_id, notes })
        .eq("id", existing.id);
    } else {
      await supabase.from("itinerary_days").insert({
        trip_id: tripId,
        date,
        location,
        accommodation_id,
        notes,
      });
    }
    revalidatePath(`/trips/${tripId}/calendar`);
  }

  async function updateDay(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const dayId = formData.get("day_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase
      .from("itinerary_days")
      .update({
        location: (formData.get("location") as string) || null,
        accommodation_id: (formData.get("accommodation_id") as string) || null,
        notes: (formData.get("notes") as string) || null,
      })
      .eq("id", dayId);
    revalidatePath(`/trips/${tripId}/calendar`);
    redirect(`/trips/${tripId}/calendar`);
  }

  async function deleteDay(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const dayId = formData.get("day_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase.from("itinerary_days").delete().eq("id", dayId);
    revalidatePath(`/trips/${tripId}/calendar`);
    redirect(`/trips/${tripId}/calendar`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Calendar</h2>

      {/* Day list */}
      {days && days.length > 0 ? (
        <div className="space-y-3">
          {days.map((day) => {
            const isEditing = editing === day.id;
            const acc = day.accommodations as unknown as { name: string } | null;
            return (
              <div
                key={day.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {formatDate(day.date)}
                    </p>
                    {day.location && (
                      <p className="text-sm text-indigo-600 mt-0.5">
                        📍 {day.location}
                      </p>
                    )}
                    {acc && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        🛏 {acc.name}
                      </p>
                    )}
                    {day.notes && (
                      <p className="text-sm text-gray-500 mt-1">{day.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`/trips/${tripId}/calendar?editing=${day.id}`}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      Edit
                    </a>
                    <form action={deleteDay}>
                      <input type="hidden" name="day_id" value={day.id} />
                      <input type="hidden" name="trip_id" value={tripId} />
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {isEditing && (
                  <form
                    action={updateDay}
                    className="border-t border-gray-100 bg-gray-50 p-4 space-y-3"
                  >
                    <input type="hidden" name="day_id" value={day.id} />
                    <input type="hidden" name="trip_id" value={tripId} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Where you are
                        </label>
                        <input
                          name="location"
                          defaultValue={day.location ?? ""}
                          placeholder="Edinburgh"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Where you sleep
                        </label>
                        <select
                          name="accommodation_id"
                          defaultValue={day.accommodation_id ?? ""}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                          <option value="">— none —</option>
                          {accommodations?.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={day.notes ?? ""}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <a
                        href={`/trips/${tripId}/calendar`}
                        className="border border-gray-300 text-gray-600 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </a>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No days added yet.</p>
      )}

      {/* Add day */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add a day</h3>
        <form action={addDay} className="space-y-4">
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="day-date" className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="day-date"
                name="date"
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="day-location" className="block text-sm font-medium text-gray-700 mb-1">
                Where you are
              </label>
              <input
                id="day-location"
                name="location"
                placeholder="Edinburgh"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="day-accommodation" className="block text-sm font-medium text-gray-700 mb-1">
                Where you sleep
              </label>
              <select
                id="day-accommodation"
                name="accommodation_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">— none —</option>
                {accommodations?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="day-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                id="day-notes"
                name="notes"
                placeholder="Drive to Skye in the morning..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add day
          </button>
        </form>
      </div>
    </div>
  );
}
