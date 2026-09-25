"use client";
import {
  calculateFormula,
  tableData,
  wordDocument,
} from "@/lib/workspace/canvas-tools";
import { downloadBlob } from "@/lib/workspace/brain";
export function CanvasRichCard({
  type,
  content,
  onChange,
}: {
  type: string;
  content: string;
  onChange: (s: string) => void;
}) {
  if (type === "table") {
    const rows = tableData(content);
    return (
      <div className="s-canvas-table" onMouseDown={(e) => e.stopPropagation()}>
        <table>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j}>
                    <input
                      aria-label={`Zeile ${i + 1}, Spalte ${j + 1}`}
                      value={v}
                      onChange={(e) =>
                        onChange(
                          JSON.stringify(
                            rows.map((r, ri) =>
                              ri === i
                                ? r.map((c, ci) =>
                                    ci === j ? e.target.value : c,
                                  )
                                : r,
                            ),
                          ),
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() =>
            rows.length < 100 &&
            onChange(JSON.stringify([...rows, rows[0].map(() => "")]))
          }
        >
          + Zeile
        </button>{" "}
        <button
          onClick={() =>
            rows[0].length < 20 &&
            onChange(JSON.stringify(rows.map((r) => [...r, ""])))
          }
        >
          + Spalte
        </button>
      </div>
    );
  }
  if (type === "formula") {
    let result = "";
    try {
      result = String(calculateFormula(content));
    } catch {
      result = "Zum Beispiel (120 + 80) * 1.2";
    }
    return <output className="s-formula">{result}</output>;
  }
  if (type === "chart") {
    const values = content
      .split("\n")
      .map((line) => {
        const [name, value] = line.split(":");
        return { name, value: Number(value) };
      })
      .filter((x) => x.name && Number.isFinite(x.value) && x.value >= 0)
      .slice(0, 20);
    const max = Math.max(1, ...values.map((x) => x.value));
    return (
      <svg
        viewBox={`0 0 260 ${Math.max(70, values.length * 28)}`}
        aria-label="Diagramm aus den eingegebenen Werten"
        role="img"
      >
        {values.map((v, i) => (
          <g key={i}>
            <text x="0" y={i * 28 + 18} fontSize="10" fill="currentColor">
              {v.name.slice(0, 12)}
            </text>
            <rect
              x="85"
              y={i * 28 + 4}
              width={(v.value / max) * 135}
              height="19"
              rx="4"
              fill="#79b9a3"
            />
            <text x="228" y={i * 28 + 18} fontSize="10" fill="currentColor">
              {v.value}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  return null;
}
export async function exportCanvasCard(
  card: { title: string; content: string; type: string; url?: string },
  format: "pdf" | "docx",
) {
  const name =
    card.title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "Trinity";
  const body =
    card.type === "table"
      ? tableData(card.content)
          .map((r) => r.join(" | "))
          .join("\n")
      : card.content + (card.url ? "\n" + card.url : "");
  if (format === "docx") {
    downloadBlob(
      new Uint8Array(wordDocument(card.title, body)).buffer,
      `${name}.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    return;
  }
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  let y = 22;
  for (const line of pdf.splitTextToSize(card.title, 170)) {
    pdf.text(line, 20, y);
    y += 9;
  }
  pdf.setFontSize(11);
  y += 8;
  for (const line of pdf.splitTextToSize(body, 170)) {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 20, y);
    y += 6;
  }
  pdf.save(`${name}.pdf`);
}
