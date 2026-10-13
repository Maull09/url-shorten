import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { InputError, ServiceError } from "./errors";
import type { CreatedLink } from "./links";

export const PAGE_SIZE = 20;

export type OwnedLink = CreatedLink & { visitCount: number };

function validateVisitCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new ServiceError("Invalid visit count.");
  }
  return value;
}

export function parsePage(input: string | null | undefined): number {
  if (input == null) return 1;
  if (!/^[1-9]\d{0,3}$/.test(input)) throw new InputError("invalidPage");
  return Number(input);
}

export async function listOwnedLinks(client: SupabaseClient, ownerId: string, page: number) {
  const offset = (page - 1) * PAGE_SIZE;
  const [result, visits] = await Promise.all([
    client.from("links")
      .select("code, target_url, created_at, visit_count", { count: "exact" })
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }).order("code", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(10_000)),
    client.rpc("get_owned_visit_total").abortSignal(AbortSignal.timeout(10_000)),
  ]);
  const { data, count, error } = result;
  if (error || !data || count === null) throw new ServiceError("Could not list owned links.");
  if (visits.error) throw new ServiceError("Could not load visit totals.");
  const links: OwnedLink[] = data.map((row) => ({ code: row.code, targetUrl: row.target_url, createdAt: row.created_at, visitCount: validateVisitCount(row.visit_count) }));
  return { links, total: count, totalVisits: validateVisitCount(visits.data), page };
}

export async function deleteOwnedLink(client: SupabaseClient, ownerId: string, code: string): Promise<boolean> {
  const { data, error } = await client.from("links").delete()
    .eq("code", code).eq("owner_id", ownerId).select("code")
    .abortSignal(AbortSignal.timeout(10_000));
  if (error || !data) throw new ServiceError("Could not delete owned link.");
  return data.length > 0;
}
