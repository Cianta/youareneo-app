import { timingSafeEqual } from 'node:crypto';
import { adminClient } from '@/lib/supabase/admin';
import { appOrigin, AuthConfigError } from '@/lib/supabase/config';
import { provisionMember, revokeMember } from '@/lib/supabase/members';
import { bodyOf, emailOf, failure, HttpError, json } from './http';

export function checkSecret(req: Request) {
  const expected = process.env.PROVISION_WEBHOOK_SECRET?.trim();
  if (!expected) throw new AuthConfigError('Freischaltung ist noch nicht konfiguriert.');
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const provided = [bearer, req.headers.get('x-provision-secret')?.trim(), req.headers.get('x-webhook-secret')?.trim()];
  const matches = provided.some(value => {
    if (!value) return false;
    const a = Buffer.from(value), b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!matches) throw new HttpError(401, 'Unauthorized');
}

export function productsOf(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50 ||
      value.some(item => typeof item !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(item))) {
    throw new HttpError(400, 'products muss eine nicht leere Liste von Produktkennungen sein.');
  }
  return [...new Set(value)] as string[];
}

export async function provision(req: Request, revoke = false, alias = false) {
  try {
    checkSecret(req);
    const body = await bodyOf(req);
    const email = emailOf(body.email);
    const products = productsOf(body.products ?? (alias ? ['foerder'] : undefined));
    if (revoke) {
      const result = await revokeMember(adminClient(), email, products);
      return json({ success: true, ...result, ...(alias ? { removed: result.revoked, email, ...(!result.revoked ? { noopReason: 'not_found' } : {}) } : {}) });
    }
    const source = body.source ?? (alias ? 'memberspot' : undefined);
    if (typeof source !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(source)) throw new HttpError(400, 'source ist erforderlich.');
    if (body.fullName !== undefined && (typeof body.fullName !== 'string' || body.fullName.length > 200)) throw new HttpError(400, 'fullName ist ungültig.');
    const loginLink = `${appOrigin()}/login`;
    const result = await provisionMember(adminClient(), { email, products, source, fullName: (body.fullName as string | undefined)?.trim() });
    return json({ success: true, ...result, loginLink,
      ...(alias ? { email, url: loginLink, magicLink: loginLink, isFullAccess: true } : {}) });
  } catch (error) { return failure(error); }
}
