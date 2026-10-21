"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useDemoAuth } from "@/lib/demo-auth";

type Mode = "signup" | "login";

type Ctx = {
  openSignup: () => void;
  openLogin: () => void;
};

const AuthModalContext = createContext<Ctx | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <AuthModalContext.Provider
      value={{
        openSignup: () => setMode("signup"),
        openLogin: () => setMode("login"),
      }}
    >
      {children}
      {mode && <AuthDialog mode={mode} onMode={setMode} onClose={() => setMode(null)} />}
    </AuthModalContext.Provider>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      className="mb-3 h-11 w-full border border-[#dbe3e8] px-3 text-sm text-[#1f2930] outline-none focus:border-[#1976d2]"
      {...props}
    />
  );
}

function AuthDialog({
  mode,
  onMode,
  onClose,
}: {
  mode: Mode;
  onMode: (mode: Mode) => void;
  onClose: () => void;
}) {
  const { signUp, signInWithPassword } = useDemoAuth();
  const [error, setError] = useState("");

  function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    if (!name || !email || !phone) {
      setError("Name, email, and phone are required.");
      return;
    }
    signUp(name, email, phone);
    onClose();
  }

  function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "").trim();
    const message = signInWithPassword(email, password);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-10">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-[460px] bg-white px-6 py-7 shadow-xl sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl leading-none text-[#7b97aa]"
          aria-label="Close"
        >
          ×
        </button>
        {mode === "signup" ? (
          <>
            <h2 className="text-center font-[family-name:var(--font-display)] text-[28px] font-normal text-[#1f2930]">
              Free Access
            </h2>
            <p className="mt-2 text-center text-[13px] text-[#354652]">
              Access full property details and exclusive listings.
              <br />
              <i>Sample inventory — not a live MLS feed.</i>
            </p>
            <form onSubmit={onSignup} className="mt-5">
              <Field label="Full Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field
                label="Phone (also used as your password)"
                name="phone"
                type="tel"
                required
              />
              {error && <p className="mb-2 text-center text-sm text-red-600">{error}</p>}
              <p className="text-center">
                <button
                  type="submit"
                  className="text-2xl text-[#09c] hover:underline"
                >
                  Continue to Photos &gt;
                </button>
              </p>
              <p className="mt-3 text-center text-sm italic underline">
                <button type="button" onClick={() => onMode("login")}>
                  Already have an account?
                </button>
              </p>
              <p className="mt-4 text-center text-[10px] leading-snug text-[#354652]">
                By clicking &quot;Continue To Photos&quot;, you agree to the demo{" "}
                <Link href="/terms" className="font-bold underline" onClick={onClose}>
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-bold underline" onClick={onClose}>
                  Privacy Policy
                </Link>
                . This is a local sample sign-in and does not text you.
              </p>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[#1f2930]">
              Log In
            </h2>
            <form onSubmit={onLogin} className="mt-4">
              <label className="mb-1 block text-sm text-[#354652]" htmlFor="signin-email">
                Email
              </label>
              <Field label="Email" id="signin-email" name="email" type="email" required />
              <label className="mb-1 block text-sm text-[#354652]" htmlFor="signin-password">
                Password
              </label>
              <Field
                label="Password (the phone you signed up with)"
                id="signin-password"
                name="password"
                type="password"
                required
              />
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="h-10 w-full bg-[#1976d2] text-sm font-bold tracking-wide text-white uppercase hover:bg-[#145ca4]"
              >
                Log in
              </button>
            </form>
            <p className="mt-4 text-sm text-[#1976d2]">
              <Link href="/account/forgotpassword" onClick={onClose} className="hover:underline">
                Forgot your password?
              </Link>
              <span className="text-[#354652]">
                {" "}
                · No account?{" "}
                <button type="button" className="underline" onClick={() => onMode("signup")}>
                  Sign Up!
                </button>
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
