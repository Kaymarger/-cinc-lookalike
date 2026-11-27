export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureAuditAdmin } = await import("./lib/audit-user");
    const result = await ensureAuditAdmin();
    if (result === "ready") console.log("[audit] QA admin is ready");
    const { retireQaOfficeOnce } = await import("./lib/qa-office");
    await retireQaOfficeOnce();
    const { deleteLeadByEmail } = await import("./lib/leads-db");
    for (const email of ["admin+qalead1127@caseyarchibald.com", "admin+qalead1127b@caseyarchibald.com"]) {
      const removed = await deleteLeadByEmail(email);
      if (removed) console.log("[leads] removed QA test lead", removed);
    }
  } catch (error) {
    console.error("[audit] seed failed", error instanceof Error ? error.name : "error");
  }
}
