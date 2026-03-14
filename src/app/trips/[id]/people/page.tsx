import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function PeoplePage({
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

  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profiles(id, full_name, avatar_url, email)")
    .eq("trip_id", tripId)
    .order("created_at");

  const isOwner = members?.some(
    (m) => m.user_id === user.id && m.role === "owner"
  );

  async function addMember(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tripId = formData.get("trip_id") as string;
    const email = (formData.get("email") as string).trim().toLowerCase();

    // Look up the profile by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      // User hasn't signed in yet — can't add them
      redirect(`/trips/${tripId}/people?error=notfound`);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", tripId)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      redirect(`/trips/${tripId}/people?error=exists`);
    }

    await supabase.from("trip_members").insert({
      trip_id: tripId,
      user_id: profile.id,
      role: "viewer",
    });
    revalidatePath(`/trips/${tripId}/people`);
  }

  async function removeMember(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const userId = formData.get("user_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    revalidatePath(`/trips/${tripId}/people`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">People</h2>

      {/* Member list */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {members?.map((m) => {
          const profile = m.profiles as unknown as {
            id: string;
            full_name: string | null;
            avatar_url: string | null;
            email: string | null;
          } | null;
          const name = profile?.full_name ?? profile?.email ?? "Unknown";
          const isYou = m.user_id === user.id;

          return (
            <div key={m.user_id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {profile?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={name}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{name}</span>
                    {isYou && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                        you
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 capitalize">
                      {m.role}
                    </span>
                  </div>
                  {profile?.email && (
                    <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                  )}
                </div>
              </div>

              {isOwner && !isYou && (
                <form action={removeMember}>
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button
                    type="submit"
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Add member — owners only */}
      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Add someone
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            They need to have signed in at least once before you can add them.
          </p>
          <form action={addMember} className="flex gap-2">
            <input type="hidden" name="trip_id" value={tripId} />
            <input
              name="email"
              type="email"
              required
              placeholder="person@example.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {!isOwner && (
        <p className="text-sm text-gray-500">Only the trip owner can add or remove members.</p>
      )}
    </div>
  );
}
