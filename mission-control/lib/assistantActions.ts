'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Assistenten-Aktionen — das Chat-Widget rechts unten kann die ganze Oberfläche
// steuern. Der Agent gibt am Ende seiner Antwort optional einen Aktionsblock aus:
//
//   <trinity-actions>{"actions":[ {...}, {...} ]}</trinity-actions>
//
// Diese Datei definiert das Protokoll, baut den System-Prompt + Kontext und
// führt die Aktionen auf den jeweiligen Stores aus.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useSelfStore, useCompanyStore, usePinnedItemsStore, useDataHubStore,
  useAiCompanyStore, type SelfProfile, type CompanyProfile,
} from '@/lib/store';
import {
  listKanbanProjects, listEdenBoards,
  assistantAddKanbanCard, assistantAddKanbanColumn, assistantAddEdenCard,
} from '@/lib/crossPublish';

export interface TrinityAction {
  op: string;
  [key: string]: unknown;
}

// Bekannte Feldnamen (Schutz gegen erfundene Felder)
const SELF_FIELDS: (keyof SelfProfile)[] = [
  'name', 'role', 'age', 'gender', 'birthday', 'location', 'education', 'story',
  'strengths', 'values', 'interests', 'vision', 'mission',
];
const COMPANY_FIELDS: (keyof CompanyProfile)[] = [
  'name', 'legalForm', 'founded', 'location', 'industry', 'teamSize', 'website',
  'email', 'mission', 'vision', 'story', 'offering', 'targetAudience', 'usp',
  'values', 'culture', 'structure',
];

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

// ── Kontext für den Agenten ────────────────────────────────────────────────────
export function buildAssistantContext(): string {
  const lines: string[] = [];
  try {
    const projects = listKanbanProjects();
    if (projects.length) {
      lines.push('TASK-BOARDS:');
      projects.forEach(p => lines.push(`  • "${p.name}" (id:${p.id}) — Spalten: ${p.columns.map(c => `${c.label}[id:${c.id}]`).join(', ')}`));
    }
    const boards = listEdenBoards();
    if (boards.length) {
      lines.push('CANVAS-BOARDS:');
      boards.forEach(b => lines.push(`  • "${b.name}" (id:${b.id})`));
    }
    const self = useSelfStore.getState().profile;
    lines.push(`SELF-PROFIL: ${self.name ? `Name „${self.name}"` : 'noch leer'}${self.role ? `, Rolle „${self.role}"` : ''}`);
    const comp = useCompanyStore.getState().profile;
    lines.push(`FIRMENPROFIL: ${comp.name ? `„${comp.name}"` : 'noch leer'}`);
    const roles = useAiCompanyStore.getState().roles;
    if (roles.length) lines.push(`AI-FIRMA ROLLEN: ${roles.map(r => r.name).join(', ')}`);
  } catch { /* Stores evtl. noch nicht bereit */ }
  return lines.join('\n');
}

// ── System-Prompt ──────────────────────────────────────────────────────────────
export function buildAssistantSystemPrompt(roleContext?: string): string {
  return [
    'Du bist der zentrale Assistent von TRINITY OS und kannst die gesamte Oberfläche steuern.',
    roleContext ? `Deine aktuelle Rolle: ${roleContext}` : '',
    'Antworte natürlich auf Deutsch. Wenn der Nutzer etwas anlegen, ausfüllen oder ändern möchte,',
    'führe es aus, indem du AM ENDE deiner Antwort GENAU EINEN Aktionsblock anhängst:',
    '<trinity-actions>{"actions":[ ... ]}</trinity-actions>',
    '',
    'Verfügbare Aktionen (op):',
    '• {"op":"task.add","title":"…","description":"…","priority":"low|medium|high","projectId":"…","columnId":"…"} — projectId/columnId optional',
    '• {"op":"task.column","label":"…","color":"#hex","projectId":"…"} — neue Spalte',
    '• {"op":"canvas.add","type":"note|idea|text|video|website|image","title":"…","content":"…","url":"…","boardId":"…"}',
    '• {"op":"self.set","fields":{"name":"…","role":"…","story":"…", …}} — Self-Seite ausfüllen',
    '• {"op":"company.set","fields":{"name":"…","mission":"…", …}} — Company-Seite ausfüllen',
    '• {"op":"program.add","label":"…","url":"https://…","icon":"🔗"} — Programm/Website verknüpfen',
    '• {"op":"aicompany.setRoles","companyName":"…","roles":[{"name":"…","description":"…","background":"…"}]} — AI-Firma/Team erstellen',
    '',
    'Regeln: Nutze IDs aus dem Kontext, wenn vorhanden. Erfinde keine IDs. Lass ID-Felder weg, wenn unklar —',
    'dann wird das aktive Board / die erste Spalte genutzt. Wenn keine Aktion nötig ist, hänge KEINEN Block an.',
    'Der Aktionsblock wird dem Nutzer nicht angezeigt — schreibe davor eine kurze, freundliche Bestätigung.',
    '',
    'AKTUELLER KONTEXT:',
    buildAssistantContext(),
  ].filter(Boolean).join('\n');
}

// ── Parsen ───────────────────────────────────────────────────────────────────
export function parseAssistantActions(text: string): { actions: TrinityAction[]; clean: string } {
  const match = text.match(/<trinity-actions>([\s\S]*?)<\/trinity-actions>/);
  const clean = text.replace(/<trinity-actions>[\s\S]*?<\/trinity-actions>/g, '').trim();
  if (!match) return { actions: [], clean };
  try {
    const parsed = JSON.parse(match[1]) as { actions?: TrinityAction[] };
    return { actions: Array.isArray(parsed.actions) ? parsed.actions : [], clean };
  } catch {
    return { actions: [], clean };
  }
}

// ── Ausführen ──────────────────────────────────────────────────────────────────
export function executeAssistantActions(actions: TrinityAction[]): string[] {
  const log: string[] = [];
  for (const a of actions) {
    try {
      switch (a.op) {
        case 'task.add': {
          const r = assistantAddKanbanCard({
            title: str(a.title) || 'Neue Aufgabe',
            description: str(a.description),
            priority: (['low', 'medium', 'high'].includes(str(a.priority)) ? str(a.priority) : 'medium') as 'low' | 'medium' | 'high',
            projectId: a.projectId ? str(a.projectId) : undefined,
            columnId: a.columnId ? str(a.columnId) : undefined,
          });
          log.push(r.ok ? `✓ Aufgabe „${str(a.title)}" in ${r.project} → ${r.column}` : `✗ Aufgabe konnte nicht angelegt werden`);
          break;
        }
        case 'task.column': {
          const ok = assistantAddKanbanColumn({ label: str(a.label), color: a.color ? str(a.color) : undefined, projectId: a.projectId ? str(a.projectId) : undefined });
          log.push(ok ? `✓ Spalte „${str(a.label)}" angelegt` : `✗ Spalte konnte nicht angelegt werden`);
          break;
        }
        case 'canvas.add': {
          const ok = assistantAddEdenCard({
            type: (['note', 'idea', 'text', 'video', 'website', 'image'].includes(str(a.type)) ? str(a.type) : 'note') as 'note' | 'idea' | 'text' | 'video' | 'website' | 'image',
            title: str(a.title) || 'Neue Karte',
            content: str(a.content),
            url: a.url ? str(a.url) : undefined,
            boardId: a.boardId ? str(a.boardId) : undefined,
          });
          log.push(ok ? `✓ Canvas-Karte „${str(a.title)}" angelegt` : `✗ Canvas-Karte konnte nicht angelegt werden`);
          break;
        }
        case 'self.set': {
          const fields = (a.fields ?? {}) as Record<string, unknown>;
          const patch: Partial<SelfProfile> = {};
          for (const k of SELF_FIELDS) if (k in fields) (patch as Record<string, string>)[k] = str(fields[k]);
          if (Object.keys(patch).length) { useSelfStore.getState().setProfile(patch); log.push(`✓ Self-Profil aktualisiert (${Object.keys(patch).join(', ')})`); }
          break;
        }
        case 'company.set': {
          const fields = (a.fields ?? {}) as Record<string, unknown>;
          const patch: Partial<CompanyProfile> = {};
          for (const k of COMPANY_FIELDS) if (k in fields) (patch as Record<string, string>)[k] = str(fields[k]);
          if (Object.keys(patch).length) { useCompanyStore.getState().setProfile(patch); log.push(`✓ Firmenprofil aktualisiert (${Object.keys(patch).join(', ')})`); }
          break;
        }
        case 'program.add': {
          const url = str(a.url);
          if (url) {
            usePinnedItemsStore.getState().addItem({ label: str(a.label) || url, url, icon: str(a.icon) || '🔗', categoryId: 'tools' });
            // zusätzlich als Data-Hub-Link (Cloud Drives), damit es überall auftaucht
            useDataHubStore.getState().addEntry('col-drives', str(a.label) || url, url);
            log.push(`✓ Programm „${str(a.label) || url}" verknüpft`);
          }
          break;
        }
        case 'aicompany.setRoles': {
          const roles = Array.isArray(a.roles) ? a.roles as Record<string, unknown>[] : [];
          const store = useAiCompanyStore.getState();
          if (a.companyName) store.setCompanyName(str(a.companyName));
          store.setRoles(roles.map(r => ({
            id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: str(r.name) || 'Rolle',
            description: str(r.description),
            background: str(r.background),
            assignedAgentId: '',
          })));
          log.push(`✓ AI-Firma mit ${roles.length} Rollen erstellt`);
          break;
        }
        default:
          break;
      }
    } catch {
      log.push(`✗ Aktion „${a.op}" fehlgeschlagen`);
    }
  }
  return log;
}
