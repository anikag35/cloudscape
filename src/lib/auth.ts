import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Validates the Supabase session from the request.
 * Returns the authenticated user or null.
 *
 * Uses the anon key + the user's access token to verify with Supabase
 * (the service role key bypasses RLS and should not be used for auth checks).
 */
export async function getAuthUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // Extract the access token from the Authorization header or cookie
  let token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    token = req.cookies.get("sb-access-token")?.value;
  }
  if (!token) return null;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Middleware-style helper for API routes that require authentication.
 * Returns a 401 response if the user is not authenticated.
 * In development mode, auth is skipped for easier testing.
 */
export async function requireAuth(req: NextRequest) {
  // Skip auth in development for easier testing
  if (process.env.NODE_ENV === "development") return null;

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized — sign in required" },
      { status: 401 }
    );
  }
  return null;
}
