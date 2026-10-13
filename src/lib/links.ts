import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ServiceError } from "./errors";
import { generateShortCode } from "./short-code";
import { getSupabase } from "./supabase";

export type CreatedLink = {
  code: string;
  targetUrl: string;
  createdAt: string;
};

export async function createLink(targetUrl: string): Promise<CreatedLink> {
  return insertLink(getSupabase(), targetUrl, null);
}

export async function insertLink(supabase: SupabaseClient, targetUrl: string, ownerId: string | null): Promise<CreatedLink> {

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("links")
      .insert({ code: generateShortCode(), target_url: targetUrl, owner_id: ownerId })
      .select("code, target_url, created_at")
      .abortSignal(AbortSignal.timeout(10_000))
      .single();

    if (!error && data) {
      return { code: data.code, targetUrl: data.target_url, createdAt: data.created_at };
    }

    // The primary key protects against collisions, including concurrent inserts.
    if (error?.code === "23505") continue;

    console.error("Link insert failed", { code: error?.code });
    throw new ServiceError("Could not store link.");
  }

  throw new ServiceError("Could not allocate a unique code.");
}

export async function findLink(code: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("links")
    .select("target_url")
    .eq("code", code)
    .abortSignal(AbortSignal.timeout(10_000))
    .maybeSingle();

  if (error) {
    console.error("Link lookup failed", { code: error.code });
    throw new ServiceError("Could not look up link.");
  }

  return data?.target_url ?? null;
}
