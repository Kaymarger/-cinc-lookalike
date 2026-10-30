import { readFileSync } from "node:fs";
import { EMAIL_FOOTER, type AutoTrackDocument, type AutoTrackStep } from "./autotrack";

const LEAD_TYPES: Record<string, string> = {
  everyone: "Everyone",
  buyers: "Buyer",
  sellers: "Seller",
  "buyer/seller": "Buyer & Seller",
};

export function parseCincAutoTracks(markdown: string): AutoTrackDocument[] {
  const chunks = markdown.split(/\n(?=## \d+\. )/).filter((chunk) => /^## \d+\. /.test(chunk));
  const tracks = chunks.map(parseTrack);
  expandRepeated(tracks);
  return tracks.map((track) => ({
    ...track,
    steps: track.steps.map((step) => step.action === "email" ? { ...step, body: appendFooter(step.body) } : step),
  }));
}

export function loadCincAutoTracks(): AutoTrackDocument[] {
  const markdown = readFileSync(new URL("./cinc-autotracks.md", import.meta.url), "utf8");
  return parseCincAutoTracks(markdown);
}

function parseTrack(chunk: string): AutoTrackDocument {
  const title = chunk.match(/^## (\d+)\. (.+)$/m);
  if (!title) throw new Error("AutoTrack section is missing a title.");
  const number = title[1].padStart(2, "0");
  const name = title[2].trim();
  const meta = chunk.slice(0, chunk.search(/\n### Steps/));
  const ownerLine = meta.match(/Owner\/shared:\s*(Public|Private) \(([^)]+)\)/i);
  const statusWord = meta.match(/Status:\s*(Active|Paused|Disabled)/i)?.[1] ?? "Active";
  const leadLine = meta.match(/Lead types:\s*([^|]+)\|\s*Send hours:\s*([^\n]+)/i);
  const hours = parseHours(leadLine?.[2] ?? "");
  const startText = grab(meta, "START");
  const stopText = grab(meta, "STOP");
  const completeText = grab(meta, "Completion");
  const start = parseStart(startText);
  const stop = parseStop(stopText);
  const complete = parseComplete(completeText, name);
  const editable = Number(meta.match(/editable by (\d+)/i)?.[1] ?? "0");
  const steps = parseSteps(chunk.slice(chunk.search(/\n### Steps/)), `cinc-${number}`);
  return {
    id: `cinc-${number}`,
    name,
    category: "General",
    status: statusWord.toLowerCase() as AutoTrackDocument["status"],
    trigger: "",
    stopTrigger: "",
    leadTypes: parseLeadTypes(leadLine?.[1] ?? "everyone"),
    hours: hours.hours,
    includeWeekend: hours.includeWeekend,
    skipHolidays: false,
    startNewLead: start.newLead,
    startLabel: start.labels[0] ?? "",
    startStage: "",
    landing: "",
    customField: "",
    source: start.sources.join("; "),
    sources: start.sources,
    stopLabel: stop.label,
    stopStage: stop.stage,
    stopReply: stop.reply,
    complete: complete.complete,
    completeTrack: complete.completeTrack,
    completeLabel: complete.completeLabel,
    share: editable > 0,
    owner: ownerLine?.[2]?.trim() || "Casey Archibald",
    visibility: ownerLine?.[1]?.toLowerCase() === "private" ? "private" : "public",
    captured: true,
    seedRevision: 1,
    userEdited: false,
    steps,
  };
}

function grab(meta: string, label: string): string {
  const match = meta.match(new RegExp(`${label}(?: triggers)?:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.replace(/\s+\|\s+(STOP|Completion|START):[\s\S]*$/i, "").trim() ?? "";
}

function parseLeadTypes(text: string): string[] {
  const found = text.split(",").map((item) => LEAD_TYPES[item.trim().toLowerCase()]).filter(Boolean);
  return found.length ? found : ["Everyone"];
}

function parseHours(text: string): { hours: AutoTrackDocument["hours"]; includeWeekend: boolean } {
  const sunday = /sunday/i.test(text);
  const evening = /9\s*pm/i.test(text);
  if (evening) return { hours: sunday ? "9 AM - 9 PM, Monday - Sunday" : "9 AM - 9 PM, Monday - Friday", includeWeekend: sunday };
  return { hours: sunday ? "9 AM - 5 PM, Monday - Sunday" : "9 AM - 5 PM, Monday - Friday", includeWeekend: sunday };
}

function parseStart(text: string): { newLead: boolean; labels: string[]; sources: string[] } {
  const labels = [...text.matchAll(/label "([^"]+)"/gi)].map((match) => match[1]);
  const sources: string[] = [];
  for (const part of text.split(";")) {
    const clause = part.trim().replace(/^(or\s+)?when\s+/i, "");
    if (!clause || /label "|new lead|pipeline/i.test(clause)) {
      const from = clause.match(/comes from\s+(.+)/i);
      if (from) sources.push(from[1].trim());
      continue;
    }
    const from = clause.match(/comes from\s+(.+)/i);
    sources.push((from?.[1] ?? clause).trim());
  }
  return { newLead: /new lead/i.test(text), labels, sources: sources.filter(Boolean) };
}

function parseStop(text: string): { reply: boolean; stage: string; label: string } {
  if (!text || /none shown/i.test(text)) return { reply: false, stage: "", label: "" };
  const stage = text.match(/pipeline(?: is)? set to ([^;,]+)/i)?.[1]?.trim() ?? "";
  const label = text.match(/label "([^"]+)"/i)?.[1] ?? "";
  return { reply: /repl/i.test(text), stage: stage ? `Lead: ${stage}` : "", label };
}

function parseComplete(text: string, name: string): { complete: AutoTrackDocument["complete"]; completeTrack: string; completeLabel: string } {
  if (!text || /none shown/i.test(text)) return { complete: "Take No Further Action", completeTrack: "", completeLabel: "" };
  const label = text.match(/label "([^"]+)"/i)?.[1];
  if (label && /applied/i.test(text) && !/AutoTrack/i.test(text)) {
    return { complete: "Apply a Label", completeTrack: "", completeLabel: label };
  }
  const track = text.match(/AutoTrack "([^"]+)"/i)?.[1] ?? "";
  if (track) {
    const same = track.toLowerCase() === name.toLowerCase() || /loops/i.test(text);
    return {
      complete: same ? "Automatically Restart This AutoTrack" : "Automatically Start Another AutoTrack",
      completeTrack: track,
      completeLabel: "",
    };
  }
  return { complete: "Take No Further Action", completeTrack: "", completeLabel: "" };
}

function parseSteps(section: string, idPrefix: string): AutoTrackStep[] {
  const steps: AutoTrackStep[] = [];
  const lines = section.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const email = line.match(/^\*\*Day (\d+) – (EMAIL|TEXT)\*\* – (.+)$/);
    if (email) {
      const day = Number(email[1]);
      const action = email[2] === "TEXT" ? "text" : "email";
      const timing = parseTiming(email[3]);
      let subject = "";
      let body = "";
      const next = lines[index + 1] ?? "";
      if (action === "email" && next.startsWith("Subject:")) {
        subject = next.slice("Subject:".length).trim();
        index += 1;
        const fenced = readFence(lines, index + 1);
        body = fenced.body;
        index = fenced.end;
      } else if (action === "text" && next.startsWith("Text:")) {
        body = next.slice("Text:".length).trim();
        subject = body.slice(0, 80);
        index += 1;
      }
      steps.push(step(idPrefix, steps.length, day, action, subject, body, "Lead", timing));
      continue;
    }
    const dated = line.match(/^\d+\. On (.+?), send at (\d{1,2}:\d{2} [AP]M) \(EMAIL\) — Subject: (.+)$/);
    const named = line.match(/^\d+\. (.+?) — Subject: (.+)$/);
    if (dated || named) {
      const calendarOn = (dated?.[1] ?? named?.[1] ?? "").trim();
      const subject = (dated?.[3] ?? named?.[2] ?? "").trim();
      const clock = dated?.[2] ?? "6:00 AM";
      const fenced = readFence(lines, index + 1);
      index = fenced.end;
      const timing = parseTiming(`Send at ${clock}`);
      steps.push({ ...step(idPrefix, steps.length, steps.length + 1, "email", subject, fenced.body, "Lead", timing), calendarOn });
      continue;
    }
    const row3 = line.match(/^\| (\d+) \| ([^|]+) \| ([^|]+) \|$/);
    const row2 = line.match(/^\| (\d+) \| ([^|]+) \|$/);
    const row = row3 ?? row2;
    if (row) {
      const day = Number(row[1]);
      const reminder = (row3 ? row[3] : row[2]).trim();
      const timingText = row3 ? row[2] : "9:00 AM";
      steps.push(step(idPrefix, steps.length, day, "task", reminder, reminder, "Buyer's Agent", parseTiming(timingText)));
    }
  }
  return steps;
}

function readFence(lines: string[], start: number): { body: string; end: number } {
  let open = start;
  while (open < lines.length && lines[open].trim() !== "```") open += 1;
  const close = lines.findIndex((line, index) => index > open && line.trim() === "```");
  if (open >= lines.length || close < 0) return { body: "", end: start };
  return { body: lines.slice(open + 1, close).join("\n").trim(), end: close };
}

function parseTiming(text: string): Pick<AutoTrackStep, "schedule" | "scheduleTime" | "meridiem" | "delayMinutes" | "afterPrevious"> {
  const clock = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (clock) {
    return {
      schedule: "specific",
      scheduleTime: `${Number(clock[1])}:${clock[2]}`,
      meridiem: clock[3].toUpperCase() === "PM" ? "PM" : "AM",
      delayMinutes: 0,
      afterPrevious: false,
    };
  }
  const hours = text.match(/(\d+)\s*hour/i);
  const minutes = text.match(/(\d+)\s*minute/i);
  const delayMinutes = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return {
    schedule: "immediate",
    scheduleTime: "09:00",
    meridiem: "AM",
    delayMinutes,
    afterPrevious: /previous step/i.test(text),
  };
}

function step(
  idPrefix: string,
  index: number,
  day: number,
  action: AutoTrackStep["action"],
  subject: string,
  body: string,
  to: string,
  timing: Pick<AutoTrackStep, "schedule" | "scheduleTime" | "meridiem" | "delayMinutes" | "afterPrevious">,
): AutoTrackStep {
  return {
    id: `${idPrefix}-s${String(index + 1).padStart(2, "0")}`,
    day,
    action,
    subject,
    body,
    format: "plain",
    to,
    from: "Buyer's Agent",
    template: "",
    ...timing,
    attachments: [],
    videoUrl: "",
    videoTitle: "",
    reminderType: "Call",
    blocking: false,
    calendarOn: "",
  };
}

function appendFooter(body: string): string {
  if (body.includes("If you do not wish to receive these messages")) return body;
  return `${body.trim()}\n\n${EMAIL_FOOTER}`;
}

function expandRepeated(tracks: AutoTrackDocument[]) {
  const byNumber = new Map(tracks.map((track) => [Number(track.id.slice(5)), track]));
  const seller = byNumber.get(19);
  const buyer = byNumber.get(9);
  if (!seller || !buyer) return;
  const extras = buyer.steps.filter((item) => item.day !== 1).map((item, index) => ({
    ...item,
    id: `cinc-19-s${String(index + 2).padStart(2, "0")}`,
  }));
  seller.steps = [...seller.steps.filter((item) => item.day === 1), ...extras];
}
