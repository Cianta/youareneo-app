import { infomaniakToken } from "./infomaniak-config";
export function transcriptionConfig() {
  const provider = process.env.TRANSCRIBE_PROVIDER?.trim() || "infomaniak";
  const ready = provider === "infomaniak"
    ? /^[1-9]\d*$/.test(process.env.INFOMANIAK_AI_PRODUCT_ID?.trim() || "") &&
      !!infomaniakToken()
    : provider === "openai" && !!process.env.OPENAI_API_KEY?.trim();
  return { provider, ready };
}
