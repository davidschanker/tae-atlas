import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AddTravelLegForm from "@/components/AddTravelLegForm";

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function TravelPage({
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

  const [{ data: members }, { data: legs }] = await Promise.all([
    supabase
      .from("trip_members")
      .select("user_id, role, profiles(id, full_name, avatar_url, email)")
      .eq("trip_id", tripId),
    supabase
      .from("travel_legs")
      .select("*")
      .eq("trip_id", tripId)
      .order("departure_date")
      .order("departure_time"),
  ]);

  // Group legs by user
  const legsByUser = new Map<string, typeof legs>();
  legs?.forEach((leg) => {
    if (!legsByUser.has(leg.user_id)) legsByUser.set(leg.user_id, []);
    legsByUser.get(leg.user_id)!.push(leg);
  });

  async function addTravelLeg(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tripId = formData.get("trip_id") as string;
    await supabase.from("travel_legs").insert({
      trip_id: tripId,
      user_id: user.id,
      type: formData.get("type") as "flight" | "drive",
      direction: formData.get("direction") as "arrival" | "departure",
      origin: formData.get("origin") as string,
      destination: formData.get("destination") as string,
      departure_date: formData.get("departure_date") as string,
      departure_time: formData.get("departure_time") as string,
      arrival_date: formData.get("arrival_date") as string,
      arrival_time: formData.get("arrival_time") as string,
      airline: (formData.get("airline") as string) || null,
      flight_number: (formData.get("flight_number") as string) || null,
      confirmation_number: (formData.get("confirmation_number") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    revalidatePath(`/trips/${tripId}/travel`);
  }

  async function deleteLeg(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const legId = formData.get("leg_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase.from("travel_legs").delete().eq("id", legId);
    revalidatePath(`/trips/${tripId}/travel`);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Travel</h2>

      {/* Per-person breakdown */}
      {members && members.length > 0 ? (
        <div className="space-y-6">
          {members.map((m) => {
            const profile = m.profiles as unknown as {
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              email: string | null;
            } | null;
            const name = profile?.full_name ?? profile?.email ?? "Unknown";
            const userLegs = legsByUser.get(m.user_id) ?? [];
            const arrivals = userLegs.filter((l) => l.direction === "arrival");
            const departures = userLegs.filter((l) => l.direction === "departure");

            return (
              <div key={m.user_id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  {profile?.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={name}
                      className="w-7 h-7 rounded-full"
                    />
                  )}
                  <span className="font-semibold text-gray-900">{name}</span>
                  {m.user_id === user.id && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                      you
                    </span>
                  )}
                </div>

                {userLegs.length === 0 ? (
                  <p className="text-sm text-gray-400">No travel logged yet.</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Arriving", items: arrivals },
                      { label: "Departing", items: departures },
                    ].map(({ label, items }) =>
                      items.length > 0 ? (
                        <div key={label}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {label}
                          </p>
                          <div className="space-y-2">
                            {items.map((leg) => (
                              <div
                                key={leg.id}
                                className="flex items-start justify-between gap-4 bg-gray-50 rounded-lg px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {leg.origin} → {leg.destination}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {fmtDate(leg.departure_date)} {fmt12(leg.departure_time)}{" "}
                                    → {fmtDate(leg.arrival_date)} {fmt12(leg.arrival_time)}
                                  </p>
                                  {(leg.airline || leg.flight_number) && (
                                    <p className="text-xs text-indigo-600 mt-0.5">
                                      {[leg.airline, leg.flight_number]
                                        .filter(Boolean)
                                        .join(" ")}
                                      {leg.confirmation_number &&
                                        ` · ${leg.confirmation_number}`}
                                    </p>
                                  )}
                                  {leg.notes && (
                                    <p className="text-xs text-gray-500 mt-0.5">{leg.notes}</p>
                                  )}
                                </div>
                                {m.user_id === user.id && (
                                  <form action={deleteLeg}>
                                    <input type="hidden" name="leg_id" value={leg.id} />
                                    <input type="hidden" name="trip_id" value={tripId} />
                                    <button
                                      type="submit"
                                      className="text-xs text-gray-400 hover:text-red-600 shrink-0"
                                    >
                                      Remove
                                    </button>
                                  </form>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No members yet.</p>
      )}

      {/* Add your travel */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add your travel</h3>
        <div className="mb-4">
          <input type="hidden" name="trip_id" value={tripId} />
        </div>
        <AddTravelLegForm
          addTravelLeg={async (formData: FormData) => {
            "use server";
            formData.set("trip_id", tripId);
            await addTravelLeg(formData);
          }}
        />
      </div>
    </div>
  );
}
