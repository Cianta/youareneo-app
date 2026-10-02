import { zipSync, strToU8 } from "fflate";
/** Arithmetic parser: never executes JavaScript or resolves property names. */
export function calculateFormula(raw: string): number {
  const text = raw.replace(/^=/, "").replace(/\s/g, "");
  if (text.length > 500) throw new Error("Formel zu lang");
  let i = 0;
  function atom(): number {
    if (text[i] === "+") {
      i++;
      return atom();
    }
    if (text[i] === "-") {
      i++;
      return -atom();
    }
    if (text[i] === "(") {
      i++;
      const n = sum();
      if (text[i++] !== ")") throw new Error("Klammer fehlt");
      return n;
    }
    const m = text.slice(i).match(/^(?:\d+\.?\d*|\.\d+)/);
    if (!m) throw new Error("Zahl erwartet");
    i += m[0].length;
    return Number(m[0]);
  }
  function power(): number {
    let n = atom();
    if (text[i] === "^") {
      i++;
      n = n ** power();
    }
    return n;
  }
  function product(): number {
    let n = power();
    while (text[i] === "*" || text[i] === "/") {
      const op = text[i++],
        b = power();
      n = op === "*" ? n * b : n / b;
    }
    return n;
  }
  function sum(): number {
    let n = product();
    while (text[i] === "+" || text[i] === "-") {
      const op = text[i++],
        b = product();
      n = op === "+" ? n + b : n - b;
    }
    return n;
  }
  const result = sum();
  if (i !== text.length || !Number.isFinite(result))
    throw new Error("Ungültige Formel");
  return result;
}
export function tableData(raw: string): string[][] {
  try {
    const a = JSON.parse(raw);
    if (
      Array.isArray(a) &&
      a.length <= 100 &&
      a.every(
        (r) =>
          Array.isArray(r) &&
          r.length <= 20 &&
          r.every((c) => typeof c === "string"),
      )
    )
      return a;
  } catch {}
  return [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}
const xml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function wordDocument(title: string, body: string) {
  const p = (s: string, heading = false) =>
    `<w:p>${heading ? '<w:pPr><w:pStyle w:val="Title"/></w:pPr>' : ""}<w:r><w:t xml:space="preserve">${xml(s)}</w:t></w:r></w:p>`;
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/_rels/document.xml.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    ),
    "word/styles.xml": strToU8(
      '<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style></w:styles>',
    ),
    "word/document.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p(title, true)}${body
        .split("\n")
        .map((line) => p(line))
        .join(
          "",
        )}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`,
    ),
  });
}
