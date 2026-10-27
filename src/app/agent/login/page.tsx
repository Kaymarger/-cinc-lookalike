import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, agentPassword, safeNext, verifySession } from "@/lib/agent-auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agent sign in",
  robots: { index: false, follow: false },
};

export default async function AgentLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : "/agent");
  const error = params.error === "1";
  const locked = !agentPassword();
  const jar = await cookies();
  if (!locked && (await verifySession(jar.get(COOKIE_NAME)?.value))) {
    redirect(next);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f8] px-4 py-10">
      <div className="w-full max-w-md border border-[#dbe3e8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#1976d2] uppercase">
          {SITE.company}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
          Agent office
        </h1>
        {locked ? (
          <p className="mt-4 text-sm leading-relaxed text-[#333]">
            The agent office is locked. Set <strong>AGENT_PASSWORD</strong> in Vercel, then redeploy.
            The public site and <a className="text-[#1976d2] underline" href="/start">/start</a> stay open.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[#555]">
              Sign in to open leads, the dialer, and the rest of the office.
            </p>
            <form method="post" action="/api/agent/login" className="mt-6 space-y-3">
              <input type="hidden" name="next" value={next} />
              <label className="block text-sm font-medium text-[#1f2930]">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-1 h-12 w-full border border-[#ccc] px-3 text-base outline-none focus:border-[#1976d2]"
                />
              </label>
              {error ? (
                <p className="text-sm text-[#c62828]" role="alert">
                  That password is not right.
                </p>
              ) : null}
              <button
                type="submit"
                className="h-12 w-full bg-[#1976d2] text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
              >
                Sign in
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
