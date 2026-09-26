import { localDate } from "./time";
export type PlannerDay = {
  top: string[];
  opportunity: string;
  gratitude: string;
  learned: string;
  goal: string;
  completed?: boolean[];
  energy?: number;
};
export type PlannerWeek = { intention: string; win: string; release: string };
export type PlannerMonth = {
  wins: string;
  lesson: string;
  release: string;
  next: string;
  balance: Record<string, number>;
};
export const emptyDay = (): PlannerDay => ({
  top: ["", "", ""],
  opportunity: "",
  gratitude: "",
  learned: "",
  goal: "",
});
export const emptyMonth = (): PlannerMonth => ({
  wins: "",
  lesson: "",
  release: "",
  next: "",
  balance: {},
});
export function addDays(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return localDate(d);
}
export function weekDates(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const start = addDays(date, -((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
export function shiftMonth(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  return localDate(d);
}
export function monthStats(
  days: Record<string, PlannerDay>,
  workspace: string,
  month: string,
) {
  const entries = Object.entries(days)
    .filter(([key]) => key.startsWith(`${workspace}:${month}-`))
    .map(([, day]) => day);
  const active = entries.filter(
    (d) =>
      d.top.some((x) => x.trim()) ||
      d.opportunity ||
      d.gratitude ||
      d.learned ||
      d.energy,
  );
  const planned = active.reduce(
    (n, d) => n + d.top.filter((x) => x.trim()).length,
    0,
  );
  const completed = active.reduce(
    (n, d) => n + d.top.filter((x, i) => x.trim() && d.completed?.[i]).length,
    0,
  );
  const energy = active.filter((d) => d.energy);
  return {
    active: active.length,
    planned,
    completed,
    energy: energy.length
      ? Math.round(
          (energy.reduce((n, d) => n + (d.energy || 0), 0) / energy.length) *
            10,
        ) / 10
      : null,
    gratitude: active.filter((d) => d.gratitude.trim()).length,
  };
}
