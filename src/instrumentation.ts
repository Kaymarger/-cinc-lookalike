export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureAuditAdmin } = await import("./lib/audit-user");
    const result = await ensureAuditAdmin();
    if (result === "ready") console.log("[audit] QA admin is ready");
  } catch (error) {
    console.error("[audit] seed failed", error instanceof Error ? error.name : "error");
  }
}
