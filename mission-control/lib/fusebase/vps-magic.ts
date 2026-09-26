import { createClient, OrgUsersApi, EmailsApi } from '@fusebase/fusebase-gate-sdk';
import { createGateClient, requireGateEnv, FuseBaseConfigError } from './gate';
import { safeAuthRedirect } from './auth';
import { magicStore } from './magic-store';

async function member(email: string, id?: number) {
  const { orgId } = requireGateEnv();
  const result = await new OrgUsersApi(createGateClient()).listOrgUsers({ path: { orgId } });
  return result.users.find(user => user.email?.trim().toLowerCase() === email && (id === undefined || user.id === id));
}

export async function requestVpsMagicLink(email: string, redirectPath: unknown, ip: string) {
  email = email.trim().toLowerCase();
  const store = magicStore();
  // Persist limits across restarts; unknown addresses receive the same response.
  if (!store.allow(`ip:${ip}`, 20) || !store.allow(`email:${email}`, 3)) return;
  const user = await member(email);
  if (!user) return;
  const { baseUrl, orgId } = requireGateEnv();
  const token = process.env.FUSEBASE_AUTH_MAIL_TOKEN?.trim();
  if (!token) throw new FuseBaseConfigError('Der Anmelde-Mailversand ist noch nicht eingerichtet.');
  const origin = new URL(process.env.TRINITY_PUBLIC_URL || `https://${process.env.FUSEBASE_APP_HOST}`);
  if (origin.protocol !== 'https:' || origin.username || origin.password) throw new FuseBaseConfigError('Invalid Trinity public URL');
  const code = store.issue({ email, userId: user.id, redirectPath: safeAuthRedirect(redirectPath) });
  // Fragment keeps the bearer credential out of proxy logs and referrer headers.
  const link = `${origin.origin}/auth/magic#token=${code}`;
  try {
    await new EmailsApi(createClient({ baseUrl, auth: { token } })).sendOrgEmail({
      path: { orgId },
      body: {
        recipient: email,
        subject: 'Dein Anmeldelink für TRINITY OS',
        body: `<p>Hallo,</p><p>mit diesem Link meldest du dich in deinem Trinity-Konto an:</p><p><a href="${link}">Trinity öffnen und anmelden</a></p><p>Der Link ist 20 Minuten gültig und kann einmal verwendet werden. Du brauchst dafür kein Passwort.</p><p>Falls du die Anmeldung nicht angefordert hast, kannst du diese Nachricht ignorieren.</p><p>YOU ARE NEO</p>`,
      },
    });
  } catch (error) { store.revoke(code); throw error; }
}

export async function activateVpsMagicLink(code: string) {
  const identity = magicStore().consume(code);
  if (!identity || !await member(identity.email, identity.userId)) return null;
  return identity;
}
