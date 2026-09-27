export default function AccessDenied() {
  return <main className="min-h-screen flex items-center justify-center bg-bg p-6 text-forest-100"><div className="max-w-md space-y-4">
    <h1 className="text-xl">Dein Trinity-Zugang ist nicht aktiv</h1>
    <p>Du bist angemeldet, aber für dieses Konto ist derzeit kein Förderzugang freigeschaltet. Wende dich bitte an community@youareneo.com.</p>
    <a href="/login" className="underline">Mit einem anderen Konto anmelden</a>
  </div></main>;
}
