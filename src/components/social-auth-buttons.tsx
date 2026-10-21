"use client";

/**
 * CINC registration modals show Google / Facebook sign-in affordances.
 * Demo only — buttons explain they are not wired to OAuth.
 */
export function SocialAuthButtons({
  onDemoHint,
}: {
  onDemoHint?: (message: string) => void;
}) {
  function demo(provider: string) {
    onDemoHint?.(
      `${provider} sign-in is shown for layout parity with CINC — use email below for this demo.`
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => demo("Google")}
        className="flex h-11 w-full items-center justify-center gap-3 border border-[#ddd] bg-white text-sm font-medium text-[#444] hover:bg-[#f7f7f7]"
      >
        <span
          aria-hidden
          className="inline-flex size-5 items-center justify-center rounded-full bg-[#ea4335] text-[11px] font-bold text-white"
        >
          G
        </span>
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => demo("Facebook")}
        className="flex h-11 w-full items-center justify-center gap-3 border border-[#ddd] bg-white text-sm font-medium text-[#444] hover:bg-[#f7f7f7]"
      >
        <span
          aria-hidden
          className="inline-flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-[11px] font-bold text-white"
        >
          f
        </span>
        Continue with Facebook
      </button>
      <div className="relative py-2 text-center text-xs uppercase tracking-[0.12em] text-[#999]">
        <span className="relative z-[1] bg-white px-3">or</span>
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e5e5e5]"
        />
      </div>
    </div>
  );
}
