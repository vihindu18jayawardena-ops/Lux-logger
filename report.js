/* LuxLog report engine: rating against JIS Z9110 ranges, findings text, Excel and Word builders.
   Works in the browser (window.LuxReport) and in Node (module.exports). */
(function (root) {
  "use strict";

  const COLORS = { low: "C0392B", good: "2E8B57", high: "D98E04" };
  const FILLS = { low: "F9E0DC", good: "DDF1E4", high: "FBEBCB" };
  const LABEL = { low: "Low", good: "Good", high: "High" };
  const SOURCE = "JIS Z9110-2010";

  function classify(lux, min, max) {
    if (min != null && lux < min) return "low";
    if (max != null && lux > max) return "high";
    return "good";
  }
  // Older saved readings had a single target; treat it as a range.
  function rangeOf(e) {
    if (e.min != null) return [e.min, e.max != null ? e.max : null];
    if (e.target != null) return [e.target, Math.round(e.target * 1.5)];
    return [null, null];
  }
  const r0 = (v) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const rng = (min, max) => (max == null ? `min. ${min}` : `${min}–${max}`);
  const rangeText = (r) => `${rng(r.min, r.max)} lx`;
  const stdOf = (e) => e.std || (e.max == null && e.min != null && /OSHA/.test(e.category || "") ? "OSHA" : "JIS");
  const OSHA_SRC = "OSHA 29 CFR 1926.56";

  function summarize(survey) {
    const rows = survey.entries.map((e, i) => {
      const [min, max] = rangeOf(e);
      const status = classify(e.lux, min, max);
      const gap = status === "low" ? e.lux - min : status === "high" ? e.lux - max : 0;
      return { no: i + 1, ...e, min, max, status, gap, area: e.area || e.type || "", category: e.category || "", std: stdOf(e) };
    });
    const count = { low: 0, good: 0, high: 0 };
    rows.forEach((r) => count[r.status]++);
    const n = rows.length;
    const locations = new Set(rows.map((r) => r.location.trim().toLowerCase())).size;
    const lows = rows.filter((r) => r.status === "low").sort((a, b) => a.lux / a.min - b.lux / b.min);
    const highs = rows.filter((r) => r.status === "high").sort((a, b) => b.lux / b.max - a.lux / a.max);
    const oshaRows = rows.filter((r) => r.std === "OSHA");
    return { rows, count, n, locations, lows, highs, oshaRows };
  }

  function longDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function findings(survey, s) {
    if (!s) s = summarize(survey);
    if (!s.n) return ["No readings have been entered."];
    const out = [];
    const site = survey.site ? ` at ${survey.site}` : "";
    const date = survey.date ? ` on ${longDate(survey.date)}` : "";
    const w = (k) => (s.count[k] === 1 ? "was" : "were");
    out.push(`A total of ${s.n} illuminance reading${s.n === 1 ? " was" : "s were"} taken at ${s.locations} location${s.locations === 1 ? "" : "s"}${site}${date}.`);
    out.push(`Compared with the recommended levels, ${s.count.low} reading${s.count.low === 1 ? "" : "s"} (${pct(s.count.low, s.n)}%) ${w("low")} below the range, ` +
      `${s.count.good} (${pct(s.count.good, s.n)}%) ${w("good")} within the range and ${s.count.high} (${pct(s.count.high, s.n)}%) ${w("high")} above the range.`);
    const list = (arr) => arr.slice(0, 5).map((r) => `${r.location} (${r0(r.lux)} lx; recommended ${rangeText(r)})`).join("; ");
    if (s.lows.length) out.push(`The readings furthest below the recommended range were recorded at ${list(s.lows)}.`);
    if (s.highs.length) out.push(`The readings furthest above the recommended range were recorded at ${list(s.highs)}.`);
    if (!s.lows.length && !s.highs.length) out.push("All readings were within the recommended ranges.");
    if (s.oshaRows.length) out.push(`${s.oshaRows.length} location${s.oshaRows.length === 1 ? " has" : "s have"} no matching area type in ${SOURCE} and ${s.oshaRows.length === 1 ? "was" : "were"} assessed against the minimum illumination in ${OSHA_SRC}; these locations have no upper limit.`);
    return out;
  }

  const basisText = () =>
    `Rating basis: Low = below the recommended illuminance range; Good = within the range; High = above the range. ` +
    `Recommended ranges are taken from ${SOURCE} (adequate light levels for work areas) for the area type matched to each location. ` +
    `Where ${SOURCE} lists no matching area, the minimum illumination in ${OSHA_SRC} Table D-3 is used (converted from foot-candles, 1 fc = 10.764 lx); ` +
    `these locations are rated Low below the minimum and Good at or above it.`;

  function fileBase(survey) {
    const name = (survey.site || "Survey").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "Survey";
    return `LuxLog_${name}_${(survey.date || "").replace(/-/g, "")}`;
  }
  function timeOf(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // ---------------- Excel ----------------
  async function buildXlsx(ExcelJS, survey, charts) {
    const s = summarize(survey);
    const wb = new ExcelJS.Workbook();
    wb.creator = "LuxLog"; wb.created = new Date();
    const thin = { style: "thin", color: { argb: "FFBFC8CF" } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };
    const headFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F5FA8" } };
    const headFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const fill = (k) => ({ type: "pattern", pattern: "solid", fgColor: { argb: "FF" + FILLS[k] } });

    // Summary sheet
    const ws = wb.addWorksheet("Summary", { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];
    ws.getCell("A1").value = "Illuminance Survey Report";
    ws.getCell("A1").font = { size: 16, bold: true, color: { argb: "FF15212A" } };
    [["Site", survey.site || ""], ["Date", longDate(survey.date)], ["Surveyed by", survey.auditor || ""], ["Number of readings", s.n], ["Number of locations", s.locations], ["Reference", SOURCE + (s.oshaRows.length ? "; " + OSHA_SRC + " (where JIS has no area)" : "")]]
      .forEach(([k, v], i) => { const row = ws.getRow(3 + i); row.getCell(1).value = k; row.getCell(1).font = { color: { argb: "FF5A6974" } }; row.getCell(2).value = v; });
    let r = 10;
    ws.getRow(r).values = ["Rating", "Readings", "Share"];
    ws.getRow(r).eachCell((c) => { c.fill = headFill; c.font = headFont; c.border = border; });
    ["low", "good", "high"].forEach((k, i) => {
      const row = ws.getRow(r + 1 + i);
      row.values = [LABEL[k] + (k === "low" ? " (below range)" : k === "good" ? " (within range)" : " (above range)"), s.count[k], s.n ? s.count[k] / s.n : 0];
      row.getCell(3).numFmt = "0%";
      row.getCell(1).fill = fill(k); row.getCell(1).font = { bold: true, color: { argb: "FF" + COLORS[k] } };
      [1, 2, 3].forEach((c) => (row.getCell(c).border = border));
    });
    const tot = ws.getRow(r + 4); tot.values = ["Total", s.n, s.n ? 1 : 0]; tot.getCell(3).numFmt = "0%"; tot.font = { bold: true };
    [1, 2, 3].forEach((c) => (tot.getCell(c).border = border));

    r = 16;
    ws.getCell(`A${r}`).value = "Findings"; ws.getCell(`A${r}`).font = { size: 13, bold: true };
    const fl = findings(survey, s);
    fl.forEach((t, i) => {
      ws.mergeCells(`A${r + 1 + i}:H${r + 1 + i}`);
      const c = ws.getCell(`A${r + 1 + i}`); c.value = t; c.alignment = { wrapText: true, vertical: "top" };
      ws.getRow(r + 1 + i).height = Math.max(18, Math.ceil(t.length / 85) * 16);
    });
    r = r + 2 + fl.length;
    if (survey.remarks) {
      ws.getCell(`A${r}`).value = "Remarks"; ws.getCell(`A${r}`).font = { size: 13, bold: true };
      ws.mergeCells(`A${r + 1}:H${r + 1}`);
      const c = ws.getCell(`A${r + 1}`); c.value = survey.remarks; c.alignment = { wrapText: true, vertical: "top" };
      ws.getRow(r + 1).height = Math.max(18, Math.ceil(survey.remarks.length / 85) * 16);
      r += 3;
    }
    ws.mergeCells(`A${r}:H${r}`);
    ws.getCell(`A${r}`).value = basisText();
    ws.getCell(`A${r}`).font = { italic: true, size: 9, color: { argb: "FF5A6974" } };
    ws.getCell(`A${r}`).alignment = { wrapText: true }; ws.getRow(r).height = 30;
    r += 2;
    const addImg = (sheet, img, row, widthPx) => {
      const id = wb.addImage({ base64: toBase64(img.data), extension: "png" });
      const h = Math.round((img.height / img.width) * widthPx);
      sheet.addImage(id, { tl: { col: 0, row: row - 1 }, ext: { width: widthPx, height: h } });
      return Math.ceil(h / 20) + 2;
    };
    if (charts && charts.status) { ws.getCell(`A${r}`).value = "Readings by rating"; ws.getCell(`A${r}`).font = { bold: true }; r += 2; r += addImg(ws, charts.status, r, 440); }
    if (charts && charts.lux) charts.lux.forEach((img, i) => {
      ws.getCell(`A${r}`).value = "Measured illuminance compared with the recommended range" + (charts.lux.length > 1 ? ` (part ${i + 1} of ${charts.lux.length})` : "");
      ws.getCell(`A${r}`).font = { bold: true }; r += 2; r += addImg(ws, img, r, 720);
    });

    // Readings sheet: rating table with live formulas
    const rd = wb.addWorksheet("Readings", { views: [{ state: "frozen", ySplit: 1 }], pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    rd.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Location", key: "location", width: 30 },
      { header: "Building type", key: "category", width: 20 },
      { header: "Area type", key: "area", width: 34 },
      { header: "Standard", key: "std", width: 11 },
      { header: "Measured (lx)", key: "lux", width: 13 },
      { header: "Recommended min (lx)", key: "min", width: 14 },
      { header: "Recommended max (lx)", key: "max", width: 14 },
      { header: "Rating", key: "status", width: 10 },
      { header: "Difference from range (lx)", key: "gap", width: 15 },
      { header: "Time", key: "time", width: 8 },
    ];
    rd.getRow(1).eachCell((c) => { c.fill = headFill; c.font = headFont; c.border = border; c.alignment = { vertical: "middle", wrapText: true }; });
    rd.getRow(1).height = 42;
    s.rows.forEach((x, i) => {
      const n = i + 2;
      const row = rd.addRow({
        no: x.no, location: x.location, category: x.category, area: x.area, std: x.std === "OSHA" ? "OSHA" : "JIS", lux: x.lux, min: x.min, max: x.max == null ? "" : x.max,
        status: { formula: `IF(F${n}<G${n},"Low",IF(AND(H${n}<>"",F${n}>H${n}),"High","Good"))`, result: LABEL[x.status] },
        gap: { formula: `IF(F${n}<G${n},F${n}-G${n},IF(AND(H${n}<>"",F${n}>H${n}),F${n}-H${n},0))`, result: x.gap },
        time: timeOf(x.time),
      });
      row.getCell("lux").numFmt = "0"; row.getCell("gap").numFmt = "+0;-0;0";
      const st = row.getCell("status"); st.fill = fill(x.status); st.font = { bold: true, color: { argb: "FF" + COLORS[x.status] } };
      row.eachCell({ includeEmpty: true }, (c) => (c.border = border));
    });
    rd.autoFilter = { from: "A1", to: `K${Math.max(1, s.n + 1)}` };
    // Live colours if values are edited in Excel
    if (s.n) rd.addConditionalFormatting({ ref: `I2:I${s.n + 1}`, rules: ["low", "good", "high"].map((k, i) => ({
      type: "containsText", operator: "containsText", text: LABEL[k], priority: i + 1,
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FF" + FILLS[k] } }, font: { bold: true, color: { argb: "FF" + COLORS[k] } } } })) });

    // Reference sheet
    if (root.JIS || (typeof require !== "undefined")) {
      const J = root.JIS || require("./jis.js");
      const ref = wb.addWorksheet("Reference ranges");
      ref.columns = [{ header: "Building type", key: "c", width: 26 }, { header: "Area", key: "a", width: 40 }, { header: "Min (lx)", key: "mn", width: 10 }, { header: "Max (lx)", key: "mx", width: 10 }];
      ref.getRow(1).eachCell((c) => { c.fill = headFill; c.font = headFont; });
      J.AREAS.forEach((a) => ref.addRow({ c: a.category, a: a.name, mn: a.min, mx: a.max }));
      ref.addRow({});
      const h = ref.addRow({ c: OSHA_SRC + " – minimum only (used where JIS has no area)" }); h.font = { bold: true };
      J.OSHA.forEach((a) => ref.addRow({ c: "OSHA", a: `${a.name} (${a.fc} fc)`, mn: a.min, mx: "" }));
    }
    return wb.xlsx.writeBuffer();
  }

  // ---------------- Word ----------------
  async function buildDocx(D, survey, charts) {
    const s = summarize(survey);
    const FONT = "Arial";
    const P = (text, opts = {}) => new D.Paragraph({ spacing: { after: 120, line: 288 }, ...opts, children: [new D.TextRun({ text, font: FONT, size: 22, ...(opts.run || {}) })] });
    const H = (text) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, keepNext: true, keepLines: true, spacing: { before: 280, after: 120 }, children: [new D.TextRun({ text, font: FONT })] });
    const cb = { style: D.BorderStyle.SINGLE, size: 4, color: "BFC8CF" };
    const borders = { top: cb, bottom: cb, left: cb, right: cb };
    const cell = (text, o = {}) => new D.TableCell({
      borders, width: o.w ? { size: o.w, type: D.WidthType.DXA } : undefined,
      shading: o.fill ? { type: D.ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new D.Paragraph({ alignment: o.align, children: [new D.TextRun({ text: String(text), font: FONT, size: 19, bold: !!o.bold, color: o.color })] })],
    });
    const table = (widths, head, rows) => new D.Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: D.WidthType.DXA }, columnWidths: widths,
      rows: [
        new D.TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { w: widths[i], fill: "1F5FA8", color: "FFFFFF", bold: true })) }),
        ...rows.map((r) => new D.TableRow({ cantSplit: true, children: r.map((c, i) => (c !== null && typeof c === "object" ? cell(c.text, { w: widths[i], ...c }) : cell(c, { w: widths[i] }))) })),
      ],
    });
    const R = D.AlignmentType.RIGHT;
    const statusCell = (st) => ({ text: LABEL[st], fill: FILLS[st], color: COLORS[st], bold: true });
    let fig = 0;
    const figure = (img, caption, widthPx) => {
      fig++;
      const h = Math.round((img.height / img.width) * widthPx);
      return [
        new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { before: 120 }, children: [new D.ImageRun({ type: "png", data: toBytes(img.data), transformation: { width: widthPx, height: h } })] }),
        new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 200 }, children: [new D.TextRun({ text: `Figure ${fig}: ${caption}`, font: FONT, size: 18, italics: true, color: "5A6974" })] }),
      ];
    };
    const W = 9026;
    const body = [];
    body.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, spacing: { after: 200 }, children: [new D.TextRun({ text: "Illuminance Survey Report", font: FONT })] }));
    body.push(table([2600, W - 2600], ["Item", "Details"], [
      ["Site", survey.site || "–"], ["Date of survey", longDate(survey.date) || "–"], ["Surveyed by", survey.auditor || "–"],
      ["Number of readings", s.n], ["Number of locations", s.locations], ["Reference", SOURCE + (s.oshaRows.length ? "; " + OSHA_SRC + " where JIS lists no matching area" : "")],
    ]));

    body.push(H("1. Summary of findings"));
    findings(survey, s).forEach((t) => body.push(P(t)));
    body.push(table([3600, 2700, W - 6300], ["Rating", "Readings", "Share"], [
      ...["low", "good", "high"].map((k) => [{ ...statusCell(k), text: LABEL[k] + (k === "low" ? " (below range)" : k === "good" ? " (within range)" : " (above range)") }, { text: s.count[k], align: R }, { text: pct(s.count[k], s.n) + "%", align: R }]),
      [{ text: "Total", bold: true }, { text: s.n, bold: true, align: R }, { text: s.n ? "100%" : "0%", bold: true, align: R }],
    ]));
    if (charts && charts.status) body.push(...figure(charts.status, "Number of readings by rating", 400));

    body.push(H("2. Rating of each location"));
    body.push(table([550, 2350, 2300, 1100, 1600, W - 7900], ["No.", "Location", "Area type", "Measured (lx)", "Range (lx)", "Rating"],
      s.rows.map((r) => [r.no, r.location, r.area + (r.std === "OSHA" ? " (OSHA)" : ""), { text: r0(r.lux), align: R }, { text: rng(r.min, r.max), align: R }, statusCell(r.status)])));

    body.push(H("3. Measured illuminance compared with the recommended range"));
    if (charts && charts.lux) charts.lux.forEach((img, i) =>
      body.push(...figure(img, "Measured illuminance by location; shaded band shows the recommended range (a single line marks an OSHA minimum)" + (charts.lux.length > 1 ? ` (part ${i + 1} of ${charts.lux.length})` : ""), 600)));

    const gapTable = (arr) => table([550, 2900, 2600, 1100, W - 7150], ["No.", "Location", "Recommended (lx)", "Measured (lx)", "Difference (lx)"],
      arr.map((r) => [r.no, r.location, rng(r.min, r.max) + (r.std === "OSHA" ? " (OSHA)" : ""), { text: r0(r.lux), align: R }, { text: (r.gap > 0 ? "+" : "") + r0(r.gap), align: R }]));
    body.push(H("4. Locations below the recommended range"));
    body.push(s.lows.length ? gapTable(s.lows) : P("No readings were below the recommended range."));
    body.push(H("5. Locations above the recommended range"));
    body.push(s.highs.length ? gapTable(s.highs) : P("No readings were above the recommended range."));
    let sec = 6;
    if (survey.remarks) { body.push(H(`${sec++}. Remarks`)); survey.remarks.split(/\n+/).filter(Boolean).forEach((t) => body.push(P(t))); }
    body.push(P(basisText(), { spacing: { before: 240 }, run: { size: 18, italics: true, color: "5A6974" } }));

    return new D.Document({
      creator: "LuxLog", title: "Illuminance Survey Report",
      styles: {
        default: { document: { run: { font: FONT, size: 22 } } },
        paragraphStyles: [
          { id: "Title", name: "Title", basedOn: "Normal", run: { size: 40, bold: true, color: "15212A", font: FONT } },
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: "1F5FA8", font: FONT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
        ],
      },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [
          new D.TextRun({ text: "Illuminance survey – page ", font: FONT, size: 16, color: "5A6974" }),
          new D.TextRun({ children: [D.PageNumber.CURRENT], font: FONT, size: 16, color: "5A6974" })] })] }) },
        children: body,
      }],
    });
  }

  function toBase64(data) {
    if (typeof data === "string") return data.replace(/^data:image\/png;base64,/, "");
    if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64");
    let bin = ""; const b = new Uint8Array(data); for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin);
  }
  function toBytes(data) {
    if (typeof data !== "string") return data;
    const b64 = data.replace(/^data:image\/png;base64,/, "");
    if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64");
    const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
  }

  const api = { rng, classify, rangeOf, summarize, findings, basisText, longDate, fileBase, buildXlsx, buildDocx, LABEL, COLORS, SOURCE };
  root.LuxReport = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
