import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { InputError, ServiceError } from "./errors";
import type { CreatedLink } from "./links";

export const PAGE_SIZE = 20;

export function parsePage(input: string | null | undefined): number {
  if (input == null) return 1;
  if (!/^[1-9]\d{0,3}$/.test(input)) throw new InputError("invalidPage");
  return Number(input);
}

export async function listOwnedLinks(client: SupabaseClient, ownerId: string, page: number) {
  const offset = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await client.from("links")
    .select("code, target_url, created_at", { count: "exact" })
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false }).order("code", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(10_000));
  if (error || !data || count === null) throw new ServiceError("Could not list owned links.");
  const links: CreatedLink[] = data.map((row) => ({ code: row.code, targetUrl: row.target_url, createdAt: row.created_at }));
  return { links, total: count, page };
}

export async function deleteOwnedLink(client: SupabaseClient, ownerId: string, code: string): Promise<boolean> {
  const { data, error } = await client.from("links").delete()
    .eq("code", code).eq("owner_id", ownerId).select("code")
    .abortSignal(AbortSignal.timeout(10_000));
  if (error || !data) throw new ServiceError("Could not delete owned link.");
  return data.length > 0;
}
