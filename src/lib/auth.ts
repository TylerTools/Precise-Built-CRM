import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it in your .env or Vercel project settings."
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { email: "tyler@precisebuilt.net" },
  });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Tyler",
        email: "tyler@precisebuilt.net",
        passwordHash: "$2b$12$Ni7JgdlXcHyb3Rn7TlmOq.8Q3tTfBMr0sFI2BPe16Iic4/Pr3amKC",
        role: "admin",
      },
    });
  }
}
