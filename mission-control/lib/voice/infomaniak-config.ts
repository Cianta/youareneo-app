// Server-side only. Read lazily so readiness and requests use the same value.
export function infomaniakToken() {
  return process.env.INFOMANIAK_API_TOKEN?.trim()
    || process.env.INFOMANIAK_AI_TOKEN?.trim()
    || "";
}
