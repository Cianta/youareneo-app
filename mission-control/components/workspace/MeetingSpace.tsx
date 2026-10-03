"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Video,
  Phone,
  Copy,
  ExternalLink,
  Trash2,
  Send,
  Search,
} from "lucide-react";
import { usePersonal, inWorkspace } from "@/lib/workspace/personal";
import { roomUrl } from "@/lib/meeting/room";
import { useContactDirectory } from "./ContactDirectory";
export function MeetingSpace() {
  const personal = usePersonal(),
    directory = useContactDirectory(),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState(""),
    [phone, setPhone] = useState(""),
    [query, setQuery] = useState(""),
    [recipient, setRecipient] = useState(""),
    [subject, setSubject] = useState("Einladung in meinen Meeting-Raum"),
    [message, setMessage] = useState(
      "Hallo! Ich freue mich auf unser Gespräch. Hier ist der Link zu unserem Raum.",
    ),
    [sending, setSending] = useState(false);
  const inviteId = useRef("");
  const directoryOwner = useRef("");
  useEffect(() => {
    if (directory.userId) {
      if (
        directoryOwner.current &&
        directoryOwner.current !== directory.userId
      ) {
        setRecipient("");
        setPhone("");
        setStatus(
          "Das Konto hat gewechselt. Bitte Empfänger und Einladung neu wählen.",
        );
      }
      directoryOwner.current = directory.userId;
    }
  }, [directory.userId]);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    inviteId.current = "";
  }, [recipient, subject, message, selected]);
  const rooms = ready
    ? personal.customLinks.filter(
        (l) => l.category === "meeting" && roomUrl(l.href),
      )
    : [];
  const room = rooms.find((r) => r.id === selected) ?? rooms[0];
  const contacts = directory.contacts.filter((c) =>
    inWorkspace(c, personal.workspace),
  );
  const choices = contacts.filter((c) =>
    `${c.name} ${c.email} ${c.company}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const number = phone.replace(/[^+0-9]/g, "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  async function send() {
    if (!room || !validEmail || sending) return;
    setSending(true);
    setStatus("");
    inviteId.current ||= crypto.randomUUID();
    try {
      const r = await fetch("/api/meeting/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inviteId.current,
          userId: directory.userId,
          to: recipient,
          subject,
          message,
          room: room.href,
        }),
      });
      const d = await r.json();
      if (!r.ok)
        throw Error(d.error || "Versand konnte nicht bestätigt werden.");
      setStatus(
        d.duplicate
          ? "Diese Einladung wurde bereits versendet."
          : "Deine Einladung wurde versendet.",
      );
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Versand konnte nicht bestätigt werden.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="w-page meeting-space">
      <header>
        <span className="w-eyebrow">KOMMUNIKATION · ZUSAMMENKOMMEN</span>
        <h1>Dein Meeting-Raum.</h1>
        <p>
          Deine Räume, deine Menschen. Ein Gespräch beginnt mit einer Einladung.
        </p>
      </header>
      <section className="studio-widget meeting-phone" data-color="teal">
        <div>
          <Phone size={22} />
          <h2>Ein guter Draht.</h2>
          <small>Telefonprogramm deines Geräts</small>
        </div>
        <label>
          Telefonnummer
          <input
            className="w-input"
            type="tel"
            autoComplete="tel"
            value={phone}
            maxLength={40}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+43 …"
          />
        </label>
        {/^\+?\d{3,20}$/.test(number) ? (
          <a className="w-btn" href={"tel:" + number}>
            <Phone size={15} /> Anrufen
          </a>
        ) : (
          <span className="w-muted">
            Nummer eingeben oder unten einen Kontakt wählen.
          </span>
        )}
        <Link className="w-btn" href="/dashboard/contacts">
          Kontakte öffnen
        </Link>
      </section>
      <div className="meeting-studio-columns">
        <div className="meeting-studio-main">
          <section className="studio-widget meeting-invite" data-color="rose">
            <Send size={22} />
            <h2>Jemanden einladen</h2>
            <p>
              {room
                ? `Gewählter Raum: ${room.label}`
                : "Wähle rechts einen Raum oder speichere zuerst deinen Raumlink."}
            </p>
            <div className="meeting-contact-choice">
              <label>
                Kontakt suchen
                <span className="studio-search">
                  <Search size={15} />
                  <input
                    type="search"
                    aria-label="Einladungskontakt suchen"
                    placeholder="Name, Firma oder E-Mail"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </span>
              </label>
              <label>
                Kontakt auswählen
                <select
                  className="w-input"
                  aria-label="Einladungskontakt auswählen"
                  defaultValue=""
                  onChange={(e) => {
                    const c = choices.find((c) => c.id === e.target.value);
                    if (c) {
                      setRecipient(c.email);
                      if (c.phone) setPhone(c.phone);
                    }
                  }}
                >
                  <option value="">Kontakt wählen …</option>
                  {choices.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                      {c.email ? " · " + c.email : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Empfänger
              <input
                className="w-input"
                type="email"
                aria-label="Einladung an E-Mail"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                maxLength={254}
                placeholder="name@beispiel.ch"
              />
            </label>
            <label>
              Betreff
              <input
                className="w-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={180}
              />
            </label>
            <label>
              Deine Nachricht
              <textarea
                className="w-input"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={3000}
              />
            </label>
            <label>
              Raumlink
              <input
                className="w-input"
                aria-label="Gewählter Einladungslink"
                value={room?.href ?? ""}
                readOnly
                onFocus={(e) => e.target.select()}
              />
            </label>
            <div className="studio-actions">
              <button
                className="w-btn"
                onClick={() => void send()}
                disabled={
                  !directory.mailReady ||
                  !room ||
                  !validEmail ||
                  !subject.trim() ||
                  sending
                }
              >
                {sending ? "Wird versendet …" : "Einladung per E-Mail senden"}
              </button>
              {room && validEmail && (
                <a
                  className="w-btn"
                  href={`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + "\n\n" + room.href)}`}
                >
                  Entwurf im Mailprogramm öffnen
                </a>
              )}
            </div>
            {!directory.mailReady && (
              <small className="w-muted">
                Direkter Versand braucht die SMTP-Anbindung für dein Konto. Bis
                dahin kannst du den fertigen Entwurf im Mailprogramm öffnen.
              </small>
            )}
          </section>
          <form
            className="studio-widget s-form"
            data-color="violet"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                values = new FormData(form),
                href = roomUrl(String(values.get("url") || ""));
              if (!href) {
                setStatus(
                  "Bitte einen vollständigen HTTPS-Raumlink ohne Zugangsdaten eingeben.",
                );
                return;
              }
              const current = usePersonal.getState();
              if (
                current.customLinks.some(
                  (l) => l.category === "meeting" && l.href === href,
                )
              ) {
                setStatus("Dieser Raum ist schon gespeichert.");
                return;
              }
              const id = crypto.randomUUID();
              current.set({
                customLinks: [
                  ...current.customLinks,
                  {
                    id,
                    label:
                      String(values.get("name") || "").trim() ||
                      "Mein Meeting-Raum",
                    href,
                    category: "meeting",
                    icon: "video",
                  },
                ],
              });
              setSelected(id);
              form.reset();
              setStatus("Dein Raumlink ist gespeichert.");
            }}
          >
            <h2>Ein weiterer Raum</h2>
            <label>
              Name
              <input
                className="w-input"
                name="name"
                placeholder="Mein Meeting-Raum"
                maxLength={100}
              />
            </label>
            <label>
              Einladungslink
              <input
                className="w-input"
                name="url"
                type="url"
                placeholder="https://…"
                required
                maxLength={2000}
              />
            </label>
            <button className="w-btn" type="submit">
              Raumlink speichern
            </button>
            <small className="w-muted">
              Raumlinks bleiben auf diesem Gerät. Mikrofon und Kamera öffnest du
              im gewählten Meeting-Anbieter.
            </small>
          </form>
        </div>
        <aside className="meeting-studio-aside" aria-label="Meine Räume">
          <section className="studio-widget" data-color="violet">
            <Video size={23} />
            <h2>Meine Räume</h2>
            <div className="meeting-room-list">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  className="meeting-room-pick"
                  aria-pressed={r.id === room?.id}
                  onClick={() => setSelected(r.id)}
                >
                  <Video size={18} />
                  <span>
                    <strong>{r.label}</strong>
                    <small>{new URL(r.href).hostname}</small>
                  </span>
                </button>
              ))}
            </div>
            {!rooms.length && (
              <>
                <h3>Dein Raum wartet.</h3>
                <p>
                  Speichere links den HTTPS-Link deines ersten Raums. Du kannst
                  beliebig viele Räume verknüpfen.
                </p>
              </>
            )}
            {room && (
              <div className="meeting-rooms">
                <article>
                  <div className="meeting-selected-link">
                    <input
                      className="w-input"
                      readOnly
                      aria-label={room.label + ": Einladungslink"}
                      value={room.href}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      className="w-icon"
                      aria-label="Einladungslink kopieren"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(room.href)
                          .then(() => setStatus("Einladungslink kopiert."))
                          .catch(() =>
                            setStatus(
                              "Bitte den Raumlink im Feld auswählen und kopieren.",
                            ),
                          )
                      }
                    >
                      <Copy size={17} />
                    </button>
                  </div>
                  <div className="meeting-actions">
                    <a
                      className="w-btn"
                      href={room.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={15} /> Raum öffnen
                    </a>
                    <button
                      className="w-icon"
                      aria-label={room.label + " entfernen"}
                      onClick={() => {
                        const current = usePersonal.getState();
                        current.set({
                          customLinks: current.customLinks.filter(
                            (l) => l.id !== room.id,
                          ),
                        });
                        setSelected("");
                        setStatus(
                          "Raumlink entfernt. Der Raum beim Anbieter bleibt bestehen.",
                        );
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              </div>
            )}
          </section>
          <section className="studio-widget" data-color="gold">
            <h2>Gesprächsräume entdecken</h2>
            <p>Deine vorhandenen Anbieter bleiben erreichbar.</p>
            <div className="meeting-actions">
              {[
                ["kMeet", "kmeet"],
                ["GoBrunch", "gobrunch"],
                ["Riverside", "riverside"],
                ["Termin buchen", "lunacal"],
              ].map(([name, route]) => (
                <Link
                  prefetch={false}
                  className="w-btn"
                  key={route}
                  href={"/dashboard/mitglieder/" + route}
                >
                  {name}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
      {status && (
        <p role="status" className="workspace-notice">
          {status}
        </p>
      )}
    </div>
  );
}
