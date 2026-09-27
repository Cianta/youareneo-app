// Run only on the VPS inside mission-control-stg. Never prints member data or secrets.
import { createClient, PortalsApi, OrgUsersApi } from '@fusebase/fusebase-gate-sdk';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const mode = process.argv[2];
const file = process.argv[3];
if (!['export', 'import'].includes(mode) || !file) {
  console.error('Usage: node scripts/migrate-fusebase-users.mjs export|import /app/data/private/fusebase-members.json [--apply]');
  process.exit(1);
}
try {
  if (mode === 'export') {
    const { FUSEBASE_GATE_URL: baseUrl, FUSEBASE_TOKEN: token, FUSEBASE_ORG_ID: orgId, FUSEBASE_PORTAL_ID: portalId } = process.env;
    if (!baseUrl || !token || !orgId || !portalId) throw new Error('Missing FuseBase configuration');
    const client = createClient({ baseUrl, auth: { token } });
    const portal = await new PortalsApi(client).getPortal({ path: { orgId, portalId } });
    const { members } = await new OrgUsersApi(client).listPortalMembers({ path: { orgId, workspaceId: portal.workspaceId } });
    const unique = new Map();
    let skipped = 0;
    for (const member of members) {
      const email = member.email?.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped++; continue; }
      unique.set(email, { email, fullName: [member.firstname, member.lastname].filter(Boolean).join(' ').trim(), products: ['foerder'], source: 'manual' });
    }
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    await writeFile(file, JSON.stringify({ exportedAt: new Date().toISOString(), portalId, skipped, members: [...unique.values()] }, null, 2), { mode: 0o600, flag: 'wx' });
    console.log(JSON.stringify({ exported: unique.size, skipped }));
  } else {
    const snapshot = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(snapshot.members)) throw new Error('Invalid export');
    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify({ dryRun: true, members: snapshot.members.length, skipped: snapshot.skipped }));
      process.exit(0);
    }
    const secret = process.env.PROVISION_WEBHOOK_SECRET;
    if (!secret) throw new Error('Missing provision configuration');
    let imported = 0, created = 0, failed = 0;
    for (const member of snapshot.members) {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/provision/member', {
          method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify(member),
        });
        if (!response.ok) { failed++; continue; }
        const result = await response.json();
        if (!result.success) { failed++; continue; }
        imported++; if (result.created) created++;
      } catch { failed++; }
    }
    console.log(JSON.stringify({ imported, created, failed }));
    if (failed) process.exitCode = 1;
  }
} catch {
  console.error('Migration failed. Check configuration, export path and service availability. No member data was logged.');
  process.exitCode = 1;
}
