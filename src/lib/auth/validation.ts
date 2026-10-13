import { InputError } from "@/lib/errors";

export function validateCredentials(body: unknown, mode: "login" | "register") {
  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)) throw new InputError("authFields");
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("authEmail");
  if (!password || password.length > 128 || (mode === "register" && password.length < 8)) throw new InputError("authPassword");
  return { email, password };
}
