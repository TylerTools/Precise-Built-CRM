"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Reset failed");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-4">Invalid reset link. No token provided.</p>
        <Link href="/login" className="text-[#c47a4f] hover:text-[#d89a6f] text-sm font-mono">
          Back to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-emerald-400 text-sm font-mono">Password reset successfully!</p>
        <Link
          href="/login"
          className="inline-block bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      {error && (
        <div className="bg-red-900/30 text-red-400 text-sm p-3 rounded-lg border border-red-800/50">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      <div className="text-center">
        <Link href="/login" className="text-zinc-500 hover:text-zinc-300 text-xs font-mono">
          Back to Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Image
            src="/PRECISE_BUILT logo.png"
            alt="Precise Built"
            width={1120}
            height={320}
            className="h-64 w-auto mx-auto brightness-0 invert mb-4"
            priority
          />
          <p className="text-zinc-500 text-sm font-mono">Reset Password</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8">
          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
