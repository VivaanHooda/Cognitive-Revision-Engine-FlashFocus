import crypto from "node:crypto";
import { NextRequest } from "next/server";

// Simple JWT implementation (HS256) for demo/dev use.
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const base64url = (str: string | Buffer) =>
  Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const hmacSha256 = (data: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(data).digest();

function signToken(
  payload: Record<string, any>,
  expiresInSec = 60 * 60 * 24 * 7
) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    })
  );
  const sig = base64url(hmacSha256(`${header}.${body}`, JWT_SECRET));
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string) {
  try {
    const [headerB64, bodyB64, sig] = token.split(".");
    if (!headerB64 || !bodyB64 || !sig) return null;
    const expected = base64url(
      hmacSha256(`${headerB64}.${bodyB64}`, JWT_SECRET)
    );
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)))
      return null;
    const bodyJson = JSON.parse(
      Buffer.from(bodyB64, "base64").toString("utf8")
    );
    if (bodyJson.exp && bodyJson.exp < Math.floor(Date.now() / 1000))
      return null;
    return bodyJson;
  } catch (e) {
    return null;
  }
}

// Password hashing using scrypt
function hashPassword(password: string, salt?: string) {
  const _salt = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, _salt, 64);
  return { salt: _salt, hash: derived.toString("hex") };
}

type User = {
  id: string;
  username: string; // internal username/email
  name?: string; // display name
  passwordHash: string;
  salt: string;
  createdAt: number;
};

const users = new Map<string, User>();

// Public-facing user shape used by the API (matches frontend expectations)
export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: number;
};

export async function createUser(
  username: string,
  password: string,
  name?: string
) {
  if ([...users.values()].find((u) => u.username === username)) {
    throw new Error("Username already exists");
  }
  const id = crypto.randomUUID();
  const { salt, hash } = hashPassword(password);
  const user: User = {
    id,
    username,
    name,
    passwordHash: hash,
    salt,
    createdAt: Date.now(),
  };
  users.set(id, user);
  // Return a public-friendly user object
  return {
    id: user.id,
    email: user.username,
    name: user.name || user.username,
    createdAt: user.createdAt,
  };
}

export async function verifyCredentials(username: string, password: string) {
  const user = [...users.values()].find((u) => u.username === username);
  if (!user) return null;
  const { hash } = hashPassword(password, user.salt);
  if (hash === user.passwordHash)
    return {
      id: user.id,
      email: user.username,
      name: user.name || user.username,
    };
  return null;
}

export function createSessionToken(userId: string) {
  return signToken({ uid: userId });
}

export function getUserFromToken(token: string | null) {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const uid = payload.uid as string | undefined;
  if (!uid) return null;
  const user = users.get(uid);
  if (!user) return null;
  // Map internal user to PublicUser shape
  return { id: user.id, email: user.username, name: user.username };
}

function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [k, ...vals] = part.split("=");
    if (!k) return;
    out[k.trim()] = decodeURIComponent((vals || []).join("=") || "");
  });
  return out;
}

import { supabaseAdmin } from "./supabase.server";

export async function getUserFromRequest(req: Request | NextRequest) {
  // First, check for an Authorization: Bearer <token> header (Supabase access token)
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.split(" ")[1];
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (!error && data?.user) {
        const u = data.user;
        return {
          id: u.id,
          email: u.email || "",
          name: (u.user_metadata as any)?.name || u.email || "",
        };
      }
    } catch (e) {
      // ignore and fall through to cookie-based auth
    }
  }

  // Fallback to legacy cookie JWT token
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["token"] || null;
  return getUserFromToken(token);
}

// Create a default user for local dev convenience if none exist
if (users.size === 0) {
  const pw = "password123";
  const id = crypto.randomUUID();
  const { salt, hash } = hashPassword(pw);
  users.set(id, {
    id,
    username: "demo@local",
    name: "Demo User",
    passwordHash: hash,
    salt,
    createdAt: Date.now(),
  });
}
