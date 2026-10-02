// All directory/account responses are local fixtures. No live stream or account.
process.env.AUDIT_SUITE = "apps";
await import("./audit-workspace-local.mjs");
