/** Device identifiers stay on this browser; never include them in cloud snapshots. */
export function microphoneConstraints(deviceId = ""): MediaStreamConstraints {
  return {audio: {echoCancellation:true, noiseSuppression:true, autoGainControl:true,
    ...(deviceId ? {deviceId:{exact:deviceId}} : {})}, video:false};
}
export function microphoneError(error: unknown): string {
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  switch (name) {
    case "NotAllowedError": case "SecurityError": return "Mikrofonzugriff blockiert. Erlaube das Mikrofon für diese Website und für deinen Browser in den Systemeinstellungen. In einem eingebetteten Browser öffne guiding.space direkt in Safari, Chrome oder Brave.";
    case "NotFoundError": return "Kein Mikrofon gefunden. Verbinde ein Mikrofon oder wähle in den Mikrofoneinstellungen einen anderen Eingang.";
    case "NotReadableError": case "AbortError": return "Das Mikrofon ist gerade nicht verfügbar. Prüfe, ob eine andere App es belegt, und starte den Pegeltest erneut.";
    case "OverconstrainedError": return "Das gewählte Mikrofon ist nicht mehr verbunden. Wähle den Systemstandard oder einen anderen Eingang.";
    default: return error instanceof Error ? error.message : "Das Mikrofon konnte nicht gestartet werden. Öffne die Mikrofoneinstellungen für einen Pegeltest.";
  }
}
export async function openMicrophone(deviceId = "") {
  if (!window.isSecureContext) throw Error("Mikrofonaufnahme benötigt HTTPS. Öffne die App über ihre sichere Webadresse.");
  if (!navigator.mediaDevices?.getUserMedia) throw Error("Dieser Browser stellt kein Mikrofon bereit. Öffne die App direkt in Safari, Chrome oder Brave; die Texteingabe bleibt verfügbar.");
  const policy = (document as Document & {permissionsPolicy?:{allowsFeature:(name:string)=>boolean};featurePolicy?:{allowsFeature:(name:string)=>boolean}});
  if ((policy.permissionsPolicy || policy.featurePolicy)?.allowsFeature("microphone") === false)
    throw Error("Die Einbettung blockiert das Mikrofon. Öffne guiding.space direkt im Browser und erlaube dort den Zugriff.");
  return navigator.mediaDevices.getUserMedia(microphoneConstraints(deviceId));
}
export function openMicrophoneSettings() {
  window.dispatchEvent(new CustomEvent("neo-assistant-settings", {detail:"microphone"}));
}
