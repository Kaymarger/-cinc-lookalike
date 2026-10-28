import type { Metadata } from "next";
import { agentPassword } from "@/lib/agent-auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const dbError = params.error === "db";
  const locked = !agentPassword();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f8] px-4 py-10">
      <div className="w-full max-w-md border border-[#dbe3e8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#1976d2] uppercase">{SITE.company}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">Forgot password</h1>
        {locked ? (
          <p className="mt-4 text-sm leading-relaxed text-[#333]">
            The agent office is locked. Set <strong>AGENT_PASSWORD</strong> in Vercel, then redeploy.
          </p>
        ) : sent ? (
          <p className="mt-4 text-sm leading-relaxed text-[#333]">
            If that email belongs to an office user, a reset link is ready. When Resend is configured it is emailed.
            If nothing arrives, an admin can copy a reset link from Users.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[#555]">
              Enter the email on your office account. The reset link works for one hour.
            </p>
            <form method="post" action="/api/agent/forgot" className="mt-6 space-y-3">
              <label className="block text-sm font-medium text-[#1f2930]">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  className="mt-1 h-12 w-full border border-[#ccc] px-3 text-base outline-none focus:border-[#1976d2]"
                />
              </label>
              {dbError ? (
                <p className="text-sm text-[#c62828]" role="alert">
                  Password reset needs the office database. Leave email blank on the sign-in page and use the office password, or connect Neon.
                </p>
              ) : params.error === "1" ? (
                <p className="text-sm text-[#c62828]" role="alert">Too many requests. Wait a minute and try again.</p>
              ) : null}
              <button
                type="submit"
                className="h-12 w-full bg-[#1976d2] text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
              >
                Send reset link
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
