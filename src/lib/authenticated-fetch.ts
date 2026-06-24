import { supabase } from "@/hooks/use-supabase";

export async function postAuthenticatedJson(url: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
}
