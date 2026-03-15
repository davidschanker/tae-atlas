import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/trips");

  const params = await searchParams;
  const isSignUp = params.mode === "signup";

  async function signIn(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/login?error=invalid");
    redirect("/trips");
  }

  async function signUp(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) redirect("/login?mode=signup&error=signup");
    redirect("/trips");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">tae-atlas</h1>
          <p className="text-gray-500 mt-1">Plan trips with your people.</p>
        </div>

        {params.error === "invalid" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            Invalid email or password.
          </p>
        )}
        {params.error === "signup" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            Could not create account. Try a different email.
          </p>
        )}

        <form action={isSignUp ? signUp : signIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <a href="/login" className="text-indigo-600 hover:underline">
                Sign in
              </a>
            </>
          ) : (
            <>
              No account?{" "}
              <a href="/login?mode=signup" className="text-indigo-600 hover:underline">
                Create one
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
