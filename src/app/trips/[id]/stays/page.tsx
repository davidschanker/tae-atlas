import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function StaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tripId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accommodations } = await supabase
    .from("accommodations")
    .select("*, accommodation_votes(user_id)")
    .eq("trip_id", tripId)
    .order("created_at");

  async function addAccommodation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tripId = formData.get("trip_id") as string;
    const priceRaw = formData.get("price_per_night") as string;
    await supabase.from("accommodations").insert({
      trip_id: tripId,
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      url: (formData.get("url") as string) || null,
      price_per_night: priceRaw ? parseFloat(priceRaw) : null,
      check_in_date: (formData.get("check_in_date") as string) || null,
      check_out_date: (formData.get("check_out_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
      created_by: user.id,
    });
    revalidatePath(`/trips/${tripId}/stays`);
  }

  async function toggleVote(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const accommodationId = formData.get("accommodation_id") as string;
    const tripId = formData.get("trip_id") as string;
    const hasVoted = formData.get("has_voted") === "true";

    if (hasVoted) {
      await supabase
        .from("accommodation_votes")
        .delete()
        .eq("accommodation_id", accommodationId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("accommodation_votes")
        .insert({ accommodation_id: accommodationId, user_id: user.id });
    }
    revalidatePath(`/trips/${tripId}/stays`);
  }

  async function selectAccommodation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const accommodationId = formData.get("accommodation_id") as string;
    const tripId = formData.get("trip_id") as string;

    // Deselect all, then select this one
    await supabase
      .from("accommodations")
      .update({ is_selected: false })
      .eq("trip_id", tripId);
    await supabase
      .from("accommodations")
      .update({ is_selected: true })
      .eq("id", accommodationId);
    revalidatePath(`/trips/${tripId}/stays`);
  }

  async function deleteAccommodation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const accommodationId = formData.get("accommodation_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase.from("accommodations").delete().eq("id", accommodationId);
    revalidatePath(`/trips/${tripId}/stays`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Stays</h2>

      {/* Accommodation options */}
      {accommodations && accommodations.length > 0 ? (
        <div className="space-y-4">
          {accommodations.map((acc) => {
            const votes = acc.accommodation_votes as unknown as { user_id: string }[];
            const voteCount = votes.length;
            const hasVoted = votes.some((v) => v.user_id === user.id);

            return (
              <div
                key={acc.id}
                className={`bg-white border rounded-xl p-5 ${
                  acc.is_selected
                    ? "border-indigo-400 ring-1 ring-indigo-300"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {acc.url ? (
                        <a
                          href={acc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          {acc.name}
                        </a>
                      ) : (
                        <span className="font-semibold text-gray-900">{acc.name}</span>
                      )}
                      {acc.is_selected && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                    {acc.address && (
                      <p className="text-sm text-gray-500 mt-0.5">{acc.address}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                      {acc.price_per_night && (
                        <span>${acc.price_per_night}/night</span>
                      )}
                      {acc.check_in_date && (
                        <span>
                          {acc.check_in_date} → {acc.check_out_date ?? "?"}
                        </span>
                      )}
                    </div>
                    {acc.notes && (
                      <p className="text-sm text-gray-500 mt-1">{acc.notes}</p>
                    )}
                  </div>

                  {/* Vote */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <form action={toggleVote}>
                      <input type="hidden" name="accommodation_id" value={acc.id} />
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input
                        type="hidden"
                        name="has_voted"
                        value={hasVoted.toString()}
                      />
                      <button
                        type="submit"
                        className={`text-xl leading-none transition-transform hover:scale-110 ${
                          hasVoted ? "opacity-100" : "opacity-40"
                        }`}
                        title={hasVoted ? "Remove vote" : "Vote for this"}
                      >
                        👍
                      </button>
                    </form>
                    <span className="text-xs font-medium text-gray-600">
                      {voteCount}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {!acc.is_selected && (
                    <form action={selectAccommodation}>
                      <input type="hidden" name="accommodation_id" value={acc.id} />
                      <input type="hidden" name="trip_id" value={tripId} />
                      <button
                        type="submit"
                        className="text-xs border border-gray-300 text-gray-600 rounded-lg px-3 py-1 hover:bg-gray-50"
                      >
                        Select
                      </button>
                    </form>
                  )}
                  <form action={deleteAccommodation}>
                    <input type="hidden" name="accommodation_id" value={acc.id} />
                    <input type="hidden" name="trip_id" value={tripId} />
                    <button
                      type="submit"
                      className="text-xs text-gray-400 hover:text-red-600 px-1"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No stay options added yet.</p>
      )}

      {/* Add accommodation */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add an option</h3>
        <form action={addAccommodation} className="space-y-4">
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="The Witchery"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link (Airbnb, hotel, etc.)
              </label>
              <input
                name="url"
                type="url"
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price / night ($)
              </label>
              <input
                name="price_per_night"
                type="number"
                min="0"
                step="0.01"
                placeholder="150"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in
              </label>
              <input
                name="check_in_date"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out
              </label>
              <input
                name="check_out_date"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                name="address"
                placeholder="Castlehill, Edinburgh"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                name="notes"
                placeholder="Has a hot tub, sleeps 6..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add option
          </button>
        </form>
      </div>
    </div>
  );
}
