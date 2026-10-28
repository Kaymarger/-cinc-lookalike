import type { Metadata } from "next";
import { agentPassword } from "@/lib/agent-auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Set password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const ERRORS: Record<string, string> = {
  bad: "This link is invalid or expired. Ask an admin for a new one.",
  short: "Password must be at least 8 characters.",
  match: "Those passwords do not match.",
  inactive: "That account is inactive. Ask an admin to turn it back on.",
  db: "Password reset needs the office database.",
  rate: "Too many requests. Wait a minute and try again.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const error = typeof params.error === "string" ? ERRORS[params.error] : "";
  const locked = !agentPassword();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f8] px-4 py-10">
      <div className="w-full max-w-md border border-[#dbe3e8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#1976d2] uppercase">{SITE.company}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">Set your password</h1>
        {locked ? (
          <p className="mt-4 text-sm leading-relaxed text-[#333]">
            The agent office is locked. Set <strong>AGENT_PASSWORD</strong> in Vercel, then redeploy.
          </p>
        ) : !token ? (
          <p className="mt-4 text-sm leading-relaxed text-[#333]">
            This page needs the link from your invite or password reset. Ask an admin to copy a new one from Users.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[#555]">
              Choose a password of at least 8 characters. This link works once.
            </p>
            <form method="post" action="/api/agent/reset" className="mt-6 space-y-3">
              <input type="hidden" name="token" value={token} />
              <label className="block text-sm font-medium text-[#1f2930]">
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 h-12 w-full border border-[#ccc] px-3 text-base outline-none focus:border-[#1976d2]"
                />
              </label>
              <label className="block text-sm font-medium text-[#1f2930]">
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 h-12 w-full border border-[#ccc] px-3 text-base outline-none focus:border-[#1976d2]"
                />
              </label>
              {error ? (
                <p className="text-sm text-[#c62828]" role="alert">{error}</p>
              ) : null}
              <button
                type="submit"
                className="h-12 w-full bg-[#1976d2] text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
              >
                Save password
              </button>
            </form>
          </>
        )}
        <p className="mt-4 text-sm">
          <a href="/agent/login" className="text-[#1976d2] underline">Back to sign in</a>
        </p>
      </div>
    </main>
  );
}
