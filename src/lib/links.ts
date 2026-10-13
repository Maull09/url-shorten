import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { InputError, ServiceError } from "./errors";
import { generateShortCode } from "./short-code";
import { getSupabase } from "./supabase";

export type CreatedLink = {
  code: string;
  targetUrl: string;
  createdAt: string;
};

export async function createLink(targetUrl: string, alias?: string): Promise<CreatedLink> {
  return insertLink(getSupabase(), targetUrl, null, alias);
}

export async function insertLink(supabase: SupabaseClient, targetUrl: string, ownerId: string | null, alias?: string): Promise<CreatedLink> {

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("links")
      .insert({ code: alias ?? generateShortCode(), target_url: targetUrl, owner_id: ownerId })
      .select("code, target_url, created_at")
      .abortSignal(AbortSignal.timeout(10_000))
      .single();

    if (!error && data) {
      return { code: data.code, targetUrl: data.target_url, createdAt: data.created_at };
    }

    // The primary key protects against collisions, including concurrent inserts.
    if (error?.code === "23505") {
      if (alias !== undefined) throw new InputError("aliasTaken");
      continue;
    }

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

export async function recordLinkVisit(code: string, targetUrl: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .rpc("record_link_visit", { link_code: code, expected_target_url: targetUrl })
    .abortSignal(AbortSignal.timeout(10_000));

  if (error || typeof data !== "boolean") {
    console.error("Link visit recording failed", { code: error?.code });
    throw new ServiceError("Could not record link visit.");
  }
  return data;
}
