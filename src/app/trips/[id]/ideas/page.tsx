import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const CATEGORIES = ["Restaurant", "Activity", "Sight", "Hike", "Bar", "Shop", "Other"];

export default async function IdeasPage({
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

  const [{ data: locations }, { data: unassignedIdeas }] = await Promise.all([
    supabase
      .from("locations")
      .select("*, ideas(*, profiles(full_name))")
      .eq("trip_id", tripId)
      .order("created_at"),
    supabase
      .from("ideas")
      .select("*, profiles(full_name)")
      .eq("trip_id", tripId)
      .is("location_id", null)
      .order("created_at"),
  ]);

  async function addLocation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const tripId = formData.get("trip_id") as string;
    const name = formData.get("name") as string;
    await supabase.from("locations").insert({ trip_id: tripId, name });
    revalidatePath(`/trips/${tripId}/ideas`);
  }

  async function addIdea(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const tripId = formData.get("trip_id") as string;
    await supabase.from("ideas").insert({
      trip_id: tripId,
      location_id: (formData.get("location_id") as string) || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      url: (formData.get("url") as string) || null,
      category: (formData.get("category") as string) || null,
      submitted_by: user.id,
    });
    revalidatePath(`/trips/${tripId}/ideas`);
  }

  async function deleteIdea(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const ideaId = formData.get("idea_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase.from("ideas").delete().eq("id", ideaId);
    revalidatePath(`/trips/${tripId}/ideas`);
  }

  async function deleteLocation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const locationId = formData.get("location_id") as string;
    const tripId = formData.get("trip_id") as string;
    await supabase.from("locations").delete().eq("id", locationId);
    revalidatePath(`/trips/${tripId}/ideas`);
  }

  // Flatten all locations for the "add idea" dropdown
  const allLocations = locations ?? [];

  type Idea = {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    category: string | null;
    submitted_by: string;
    profiles: { full_name: string | null } | null;
  };

  function IdeaCard({ idea }: { idea: Idea }) {
    return (
      <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {idea.url ? (
              <a
                href={idea.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:underline"
              >
                {idea.title}
              </a>
            ) : (
              <span className="font-medium text-gray-900">{idea.title}</span>
            )}
            {idea.category && (
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {idea.category}
              </span>
            )}
          </div>
          {idea.description && (
            <p className="text-sm text-gray-500 mt-0.5">{idea.description}</p>
          )}
          {idea.profiles?.full_name && (
            <p className="text-xs text-gray-400 mt-1">
              added by {idea.profiles.full_name}
            </p>
          )}
        </div>
        <form action={deleteIdea}>
          <input type="hidden" name="idea_id" value={idea.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <button
            type="submit"
            className="text-xs text-gray-400 hover:text-red-600 shrink-0"
          >
            ✕
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Ideas</h2>

      {/* Locations */}
      {allLocations.length > 0 ? (
        <div className="space-y-5">
          {allLocations.map((loc) => {
            const ideas = (loc.ideas ?? []) as unknown as Idea[];
            return (
              <div key={loc.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{loc.name}</h3>
                  <form action={deleteLocation}>
                    <input type="hidden" name="location_id" value={loc.id} />
                    <input type="hidden" name="trip_id" value={tripId} />
                    <button
                      type="submit"
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Delete location
                    </button>
                  </form>
                </div>

                {ideas.length === 0 ? (
                  <p className="text-sm text-gray-400">No ideas yet for {loc.name}.</p>
                ) : (
                  <div>
                    {ideas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">
          Add a location below to start brainstorming.
        </p>
      )}

      {/* Unassigned ideas */}
      {unassignedIdeas && unassignedIdeas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Other ideas</h3>
          {(unassignedIdeas as unknown as Idea[]).map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {/* Add location */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add a location</h3>
        <form action={addLocation} className="flex gap-2">
          <input type="hidden" name="trip_id" value={tripId} />
          <input
            name="name"
            required
            placeholder="Edinburgh"
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

      {/* Add idea */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add an idea</h3>
        <form action={addIdea} className="space-y-4">
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="idea-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="idea-title"
                name="title"
                required
                placeholder="Scotch Whisky Experience"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">— none —</option>
                {allLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">— none —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link
              </label>
              <input
                name="url"
                type="url"
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="A bit more detail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add idea
          </button>
        </form>
      </div>
    </div>
  );
}
