import { Fragment } from "react";
import { parseBody, type Inline } from "@/lib/courses/richtext";

const Text = ({ parts }: { parts: Inline[] }) => <>{parts.map((p, i) => p.kind === "strong" ? <strong key={i}>{p.text}</strong>
  : p.kind === "em" ? <em key={i}>{p.text}</em>
  : p.kind === "link" ? <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.text}</a>
  : <Fragment key={i}>{p.text}</Fragment>)}</>;

export function LessonBody({ body }: { body: string }) {
  return <div className="kurs-body">{parseBody(body).map((b, i) => b.kind === "h" ? (b.level === 2 ? <h3 key={i}><Text parts={b.inline}/></h3> : <h4 key={i}><Text parts={b.inline}/></h4>)
    : b.kind === "ul" ? <ul key={i}>{b.items.map((it, j) => <li key={j}><Text parts={it}/></li>)}</ul>
    : b.kind === "ol" ? <ol key={i}>{b.items.map((it, j) => <li key={j}><Text parts={it}/></li>)}</ol>
    : b.kind === "quote" ? <blockquote key={i}><Text parts={b.inline}/></blockquote>
    : b.kind === "p" ? <p key={i}><Text parts={b.inline}/></p> : null)}</div>;
}
