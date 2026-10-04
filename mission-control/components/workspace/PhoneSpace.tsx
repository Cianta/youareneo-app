"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ContactRound, Phone, Search } from "lucide-react";
import { inWorkspace, usePersonal } from "@/lib/workspace/personal";
import { useContactDirectory } from "./ContactDirectory";
import { LoadingState } from "./States";
import "./phone.css";

export function PhoneSpace() {
  const directory = useContactDirectory();
  const workspace = usePersonal(s => s.workspace);
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const owner = useRef("");
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (owner.current && owner.current !== directory.userId) { setPhone(""); setQuery(""); }
    owner.current = directory.userId;
  }, [directory.userId]);
  useEffect(() => { setPhone(""); setQuery(""); }, [workspace]);
  const number = phone.replace(/[\s().-]/g, "");
  const valid = /^\+?\d{3,20}$/.test(number);
  const contacts = ready ? directory.contacts.filter(c => inWorkspace(c, workspace) && c.phone) : [];
  const matches = contacts.filter(c => `${c.name} ${c.company} ${c.phone}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-page phone-space">
      <header className="w-page-heading">
        <div><span className="w-eyebrow">KOMMUNIKATION · TELEFON</span><h1>Ein guter Draht.</h1><p>Eine Nummer wählen oder einen Menschen aus deinen Kontakten finden.</p></div>
        <Link className="w-btn" href="/dashboard/contacts"><ContactRound size={16} /> Kontakte öffnen</Link>
      </header>
      <div className="phone-layout">
        <section className="studio-widget phone-dialer" data-color="gold" aria-label="Telefonnummer wählen">
          <Phone size={25} /><h2>Zeit für ein Gespräch.</h2>
          <label>Telefonnummer<input className="w-input" type="tel" autoComplete="tel" inputMode="tel" maxLength={40}
            value={phone} onChange={e => setPhone(e.target.value)} placeholder="+43 …" /></label>
          {valid ? <a className="w-btn phone-call" href={`tel:${number}`}><Phone size={17} /> Anrufen</a> : <button className="w-btn phone-call" disabled><Phone size={17} /> Anrufen</button>}
          <p>„Anrufen“ öffnet die Telefon-App deines Geräts. Auf dem Computer brauchst du ein Programm, das Telefonlinks unterstützt.</p>
        </section>
        <section className="studio-widget phone-directory" data-color="rose" aria-label="Telefonkontakte">
          <ContactRound size={23} /><h2>Deine Menschen.</h2>
          <label className="studio-search"><Search size={16} /><input type="search" aria-label="Telefonkontakte suchen" value={query}
            onChange={e => setQuery(e.target.value)} placeholder="Name, Firma oder Nummer" /></label>
          {directory.error && <div role="status" className="phone-directory-status"><p>{directory.error} Lokal gespeicherte Kontakte bleiben verfügbar.</p><button className="w-btn" onClick={directory.refresh}>Erneut laden</button></div>}
          {!ready || (!directory.userId && !directory.error && !contacts.length) ? <LoadingState label="Telefonkontakte werden geladen …" /> : matches.length ? (
            <div className="phone-contacts">{matches.map(c => <button key={c.id} className="phone-contact" onClick={() => setPhone(c.phone!)}
              aria-label={`Nummer von ${c.name} übernehmen`} aria-pressed={phone === c.phone}>
              <span className="phone-contact-mark" aria-hidden="true">{c.name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{c.name}</strong>{c.company && <small>{c.company}</small>}<small>{c.phone}</small></span><Phone size={15} aria-hidden="true" />
            </button>)}</div>
          ) : <p>{query ? "Kein passender Telefonkontakt. Versuche einen anderen Namen oder eine Nummer." : "Hier erscheinen Kontakte mit Telefonnummer aus deinem aktuellen Bereich. Du kannst auch oben eine Nummer eingeben."}</p>}
        </section>
      </div>
    </div>
  );
}
