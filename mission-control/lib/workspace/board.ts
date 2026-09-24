import type {
  TCard,
  TProject,
  CardConnection,
  CardGroup,
} from "@/components/kanban/KanbanBoard";

export const BOARD_KEY = "trinity-kanban-v2";
export interface WorkspaceBoard {
  projects: TProject[];
  activeProjectId: string;
  cards: Record<string, TCard>;
  connections: CardConnection[];
  groups?: CardGroup[];
}
export function emptyBoard(): WorkspaceBoard {
  return {
    projects: [
      {
        id: "proj-default",
        name: "Mein Board",
        columns: [
          {
            id: "col-idee",
            label: "Ideen",
            color: "text-violet-300",
            cardIds: [],
          },
          {
            id: "col-todo",
            label: "Geplant",
            color: "text-anth-300",
            cardIds: [],
          },
          {
            id: "col-inprogress",
            label: "Im Flow",
            color: "text-amber-300",
            cardIds: [],
          },
          {
            id: "col-erledigt",
            label: "Erledigt",
            color: "text-forest-300",
            cardIds: [],
          },
        ],
      },
    ],
    activeProjectId: "proj-default",
    cards: {},
    connections: [],
  };
}
export function parseBoard(raw: string | null): WorkspaceBoard {
  if (!raw) return emptyBoard();
  const value = JSON.parse(raw);
  if (
    !value ||
    !Array.isArray(value.projects) ||
    !value.cards ||
    typeof value.cards !== "object" ||
    Array.isArray(value.cards) ||
    (value.connections != null && !Array.isArray(value.connections)) ||
    !value.projects.every(
      (p: TProject) =>
        p && Array.isArray(p.columns) &&
        p.columns.every((c) => c && Array.isArray(c.cardIds)),
    )
  ) {
    throw new Error(
      "Dein Board konnte nicht gelesen werden. Bestehende Daten wurden nicht verändert.",
    );
  }
  return { ...value, connections: value.connections ?? [] };
}
export function isDone(label: string): boolean {
  return /^(done|erledigt|abgeschlossen|fertig)$/i.test(label.trim());
}
export function visibleTo(
  item: { ownerId?: string; sharedWith?: "all" | string[] | null },
  user: string | null,
): boolean {
  return (
    !item.ownerId ||
    item.ownerId === user ||
    item.sharedWith === "all" ||
    (Array.isArray(item.sharedWith) && item.sharedWith.includes(user ?? ""))
  );
}
export function boardTasks(board: WorkspaceBoard, user: string | null) {
  return board.projects
    .filter((p) => visibleTo(p, user))
    .flatMap((project) =>
      project.columns.flatMap((column) =>
        column.cardIds.flatMap((id) =>
          board.cards[id] && visibleTo(board.cards[id], user)
            ? [
                {
                  ...board.cards[id],
                  projectId: project.id,
                  projectName: project.name,
                  columnId: column.id,
                  columnName: column.label,
                  done: isDone(column.label),
                },
              ]
            : [],
        ),
      ),
    );
}
export function createTask(
  board: WorkspaceBoard,
  title: string,
  user: string | null,
): WorkspaceBoard {
  const project =
    board.projects.find(
      (p) => p.id === board.activeProjectId && visibleTo(p, user),
    ) ?? board.projects.find((p) => visibleTo(p, user));
  if (!project) throw new Error("Bitte zuerst ein eigenes Board anlegen.");
  const column =
    project.columns.find((c) => /todo|geplant|to do/i.test(c.id + c.label)) ??
    project.columns.find((c) => !isDone(c.label));
  if (!column) throw new Error("Bitte zuerst eine offene Spalte anlegen.");
  const text = title.trim();
  if (!text) throw new Error("Bitte einen Aufgabentitel eingeben.");
  const id = `task-${crypto.randomUUID()}`;
  const card: TCard = {
    id,
    title: text,
    description: "",
    priority: "medium",
    type: "task",
    tags: [],
    assignedAgent: "",
    attachments: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    ...(user ? { ownerId: user } : {}),
  };
  return {
    ...board,
    cards: { ...board.cards, [id]: card },
    projects: board.projects.map((p) =>
      p.id !== project.id
        ? p
        : {
            ...p,
            columns: p.columns.map((c) =>
              c.id !== column.id ? c : { ...c, cardIds: [...c.cardIds, id] },
            ),
          },
    ),
  };
}
export function moveTask(
  board: WorkspaceBoard,
  projectId: string,
  cardId: string,
  columnId: string,
): WorkspaceBoard {
  const project = board.projects.find((p) => p.id === projectId);
  if (
    !project?.columns.some((c) => c.id === columnId) ||
    !project.columns.some((c) => c.cardIds.includes(cardId))
  )
    throw new Error("Aufgabe oder Zielspalte nicht gefunden.");
  return {
    ...board,
    projects: board.projects.map((p) =>
      p.id !== projectId
        ? p
        : {
            ...p,
            columns: p.columns.map((c) => ({
              ...c,
              cardIds: [
                ...c.cardIds.filter((id) => id !== cardId),
                ...(c.id === columnId ? [cardId] : []),
              ],
            })),
          },
    ),
  };
}
