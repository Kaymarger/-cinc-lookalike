export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureAuditAdmin } = await import("./lib/audit-user");
    const result = await ensureAuditAdmin();
    if (result === "ready") console.log("[audit] QA admin is ready");
    const { retireQaOfficeOnce } = await import("./lib/qa-office");
    await retireQaOfficeOnce();
    const { deleteLeadByEmail } = await import("./lib/leads-db");
    const removed = await deleteLeadByEmail("admin+qalead1127@caseyarchibald.com");
    if (removed) console.log("[leads] removed QA test lead", removed);
  } catch (error) {
    console.error("[audit] seed failed", error instanceof Error ? error.name : "error");
  }
}
