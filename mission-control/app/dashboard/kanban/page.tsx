"use client";
import Link from "next/link";
import TasksPage from "../vision/tasks/page";
export default function KanbanPage(){return <section className="w-page guiding-kanban"><header className="w-page-heading"><div><span className="w-eyebrow">MEIN RAUM · KARTEN IN BEWEGUNG</span><h1>Dein Kanban.</h1><p>Ideen sammeln, Schritte planen, gemeinsam weiterkommen.</p></div><Link className="w-btn" href="/dashboard/journal-legacy">Bisherige Ziele & Journale</Link></header><TasksPage/></section>;}
