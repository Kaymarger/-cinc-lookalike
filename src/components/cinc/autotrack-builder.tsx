"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUTOTRACK_HOURS,
  COMPLETION_ACTIONS,
  TEMPLATE_BODIES,
  deliveryPayload,
  documentFrom,
  emptyStep,
  insertAtCursor,
  stepSummary,
  videoBlock,
  videoThumbnail,
  type AutoTrackDocument,
  type AutoTrackFile,
  type AutoTrackStep,
  type BodyFormat,
  type StepAction,
  type TrackStatus,
} from "@/lib/autotrack";
import {
  AUTOTRACK_LANDING_PAGES,
  AUTOTRACK_LEAD_TYPES,
  AUTOTRACK_PIPELINES,
  BLANK_TEMPLATES,
  EMAIL_TEMPLATES,
  LABEL_GROUPS,
  MERGE_TAGS,
  OFFICE_ROSTER,
  clockTimes,
} from "@/lib/cinc-options";
import { useChrome } from "./chrome-context";
import { uid, useCinc, type Track } from "./store";
import { Btn, Field, Menu, ModalFrame, inputCls } from "./ui";

const EMOJI = ["😀", "😊", "😉", "👍", "🙏", "👋", "🎉", "⭐", "❤️", "🏠", "🔑", "📞", "✉️", "📅", "✅", "📍"];

const RECIPIENTS = ["Lead", "Buyer's Agent", "Listing Agent", "Partner", ...OFFICE_ROSTER];
const SENDERS = ["Buyer's Agent", "Listing Agent", "Partner", ...OFFICE_ROSTER];

function stepId() {
  return uid("step").replace(/[^A-Za-z0-9_-]/g, "");
}

function trackId() {
  return uid("track").replace(/[^A-Za-z0-9_-]/g, "");
}

async function putTrack(doc: AutoTrackDocument) {
  const response = await fetch(`/api/office/autotracks/${doc.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  const data = (await response.json().catch(() => null)) as { track?: Track; message?: string } | null;
  if (!response.ok || !data?.track) throw new Error(data?.message || "Could not save that AutoTrack.");
  return data.track;
}

function MessageStepEditor({
  trackId,
  step,
  onChange,
}: {
  trackId: string;
  step: AutoTrackStep;
  onChange: (step: AutoTrackStep) => void;
}) {
  const chrome = useChrome();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(step.videoUrl);
  const [videoTitle, setVideoTitle] = useState(step.videoTitle);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const email = step.action === "email";

  function writeBody(snippet: string) {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? step.body.length;
    const end = el?.selectionEnd ?? step.body.length;
    const next = insertAtCursor(step.body, start, end, snippet);
    onChange({ ...step, body: next.value });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  }

  function setFormat(format: BodyFormat) {
    onChange({ ...step, format });
  }

  async function onFile(file: File) {
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    body.set("stepId", step.id);
    const response = await fetch(`/api/office/autotracks/${trackId}/files`, { method: "POST", body });
    const data = (await response.json().catch(() => null)) as { file?: AutoTrackFile; message?: string } | null;
    setUploading(false);
    if (!response.ok || !data?.file) {
      chrome.toast(data?.message || "Could not store that attachment.");
      return;
    }
    onChange({ ...step, attachments: [...step.attachments, data.file] });
  }

  async function removeFile(file: AutoTrackFile) {
    await fetch(`/api/office/autotracks/files/${file.id}`, { method: "DELETE" });
    onChange({ ...step, attachments: step.attachments.filter((item) => item.id !== file.id) });
  }

  function insertVideo() {
    const block = videoBlock(videoUrl, videoTitle, step.format);
    if (!block) {
      chrome.toast("Enter a video link.");
      return;
    }
    const el = bodyRef.current;
    const start = el?.selectionStart ?? step.body.length;
    const end = el?.selectionEnd ?? step.body.length;
    const next = insertAtCursor(step.body, start, end, block);
    onChange({
      ...step,
      videoUrl: videoUrl.trim(),
      videoTitle: videoTitle.trim() || "Video",
      body: next.value,
    });
    setVideoOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  }

  const rendered = deliveryPayload(step);
  const thumb = step.videoUrl ? videoThumbnail(step.videoUrl) : null;

  return (
    <div className="space-y-2 border border-[#1c93b5] p-2">
      <p className="font-semibold">{email ? "ADD EMAIL" : "ADD TEXT"}</p>
      {email ? (
        <Field label="Subject">
          <input className={inputCls} placeholder="Email Subject..." value={step.subject} onChange={(event) => onChange({ ...step, subject: event.target.value })} />
        </Field>
      ) : null}
      <Field label={email ? "Email Template" : "Text Template"}>
        <select
          className={inputCls}
          value={step.template || "Select Email Template..."}
          onChange={(event) => {
            const name = event.target.value;
            const preset = TEMPLATE_BODIES[name];
            onChange({
              ...step,
              template: name === "Select Email Template..." ? "" : name,
              subject: preset && !step.subject ? preset.subject : step.subject,
              body: preset ? preset.body : step.body,
            });
          }}
        >
          {EMAIL_TEMPLATES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="To">
        <select className={inputCls} value={step.to} onChange={(event) => onChange({ ...step, to: event.target.value })}>
          {RECIPIENTS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="From">
        <select className={inputCls} value={step.from} onChange={(event) => onChange({ ...step, from: event.target.value })}>
          {SENDERS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-1">
        <Menu
          label={<span className="border border-[#ccc] bg-white px-2 py-1 text-[12px]">⚙ {step.format === "html" ? "HTML Email" : "Plain Text Email"}</span>}
          items={[
            { label: "HTML Email", onClick: () => setFormat("html") },
            { label: "Plain Text Email", onClick: () => setFormat("plain") },
          ]}
        />
        <button type="button" className="border border-[#ccc] bg-white px-2 py-1 text-[12px]" onClick={() => { setEmojiOpen((value) => !value); setMergeOpen(false); }}>Emoji</button>
        <button type="button" className="border border-[#ccc] bg-white px-2 py-1 text-[12px]" onClick={() => { setMergeOpen((value) => !value); setEmojiOpen(false); }}>Merge tags</button>
        <button type="button" className="border border-[#ccc] bg-white px-2 py-1 text-[12px]" onClick={() => fileRef.current?.click()} disabled={uploading}>Attach...</button>
        <button type="button" className="border border-[#ccc] bg-white px-2 py-1 text-[12px]" onClick={() => setVideoOpen((value) => !value)}>Add Video</button>
        <button type="button" className="border border-[#ccc] bg-white px-2 py-1 text-[12px]" onClick={() => setPreview(true)}>{email ? "Preview Email" : "Preview Text"}</button>
        <input ref={fileRef} type="file" className="hidden" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain" onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void onFile(file);
        }} />
      </div>
      {emojiOpen ? (
        <div className="flex flex-wrap gap-1 border border-[#eee] bg-white p-2">
          {EMOJI.map((item) => (
            <button key={item} type="button" className="px-1 text-[18px]" onClick={() => writeBody(item)}>{item}</button>
          ))}
        </div>
      ) : null}
      {mergeOpen ? (
        <div className="max-h-36 overflow-auto border border-[#eee] bg-white">
          {MERGE_TAGS.map((tag) => (
            <button key={tag} type="button" className="block w-full px-2 py-1 text-left text-[12px] hover:bg-[#f3fafc]" onClick={() => writeBody(tag)}>{tag}</button>
          ))}
        </div>
      ) : null}
      {videoOpen ? (
        <div className="grid gap-2 border border-[#eee] bg-[#f8fbfc] p-2 sm:grid-cols-[1fr_1fr_auto]">
          <input className={inputCls} placeholder="Video URL" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
          <input className={inputCls} placeholder="Title" value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} />
          <Btn kind="teal" onClick={insertVideo}>Insert</Btn>
        </div>
      ) : null}
      <textarea
        ref={bodyRef}
        className={`h-28 w-full border border-[#ccc] p-2 text-[13px] ${step.format === "html" ? "font-mono" : ""}`}
        value={step.body}
        placeholder={step.format === "html" ? "HTML Email" : "Plain Text Email"}
        onChange={(event) => onChange({ ...step, body: event.target.value })}
      />
      <div className="flex flex-wrap gap-1">
        {step.attachments.map((file) => (
          <span key={file.id} className="inline-flex items-center gap-1 border border-[#1c93b5] bg-[#f3fbfd] px-2 py-0.5 text-[12px]">
            <a className="text-[#1c93b5]" href={`/api/office/autotracks/files/${file.id}`}>{file.name}</a>
            <button type="button" aria-label={`Remove ${file.name}`} className="text-[#d9363e]" onClick={() => void removeFile(file)}>×</button>
          </span>
        ))}
      </div>
      <p className="font-bold">Set Schedule</p>
      <label className="mr-3 text-[12px]"><input type="radio" checked={step.schedule === "immediate"} onChange={() => onChange({ ...step, schedule: "immediate" })} /> Send immediately after AutoTrack is applied</label>
      <label className="text-[12px]"><input type="radio" checked={step.schedule === "specific"} onChange={() => onChange({ ...step, schedule: "specific" })} /> Send at Specific Time</label>
      {step.schedule === "specific" ? (
        <div className="flex gap-2">
          <select className={inputCls} value={step.scheduleTime} onChange={(event) => onChange({ ...step, scheduleTime: event.target.value })}>
            {clockTimes().map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={inputCls} value={step.meridiem} onChange={(event) => onChange({ ...step, meridiem: event.target.value === "PM" ? "PM" : "AM" })}>
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>
      ) : null}
      {preview ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/45 px-4 py-12" onMouseDown={() => setPreview(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto bg-white p-4 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">{email ? "Preview Email" : "Preview Text"}</h3>
              <button type="button" aria-label="Close preview" onClick={() => setPreview(false)}>×</button>
            </div>
            <p className="text-[12px] text-[#666]">Sample lead: Jordan Blake · {rendered.to} from {rendered.from}</p>
            {email ? <p className="mt-2 font-semibold">{rendered.subject || "(no subject)"}</p> : null}
            {rendered.format === "html" ? (
              <div className="prose mt-2 text-[13px]" dangerouslySetInnerHTML={{ __html: rendered.body || "<p>(empty)</p>" }} />
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-[13px]">{rendered.body || "(empty)"}</p>
            )}
            {step.videoUrl ? (
              <a className="mt-3 block border border-[#eee] p-2" href={step.videoUrl}>
                {thumb ? <img src={thumb} alt={step.videoTitle || "Video"} className="mb-1 h-28 w-auto" /> : null}
                <span className="text-[13px] text-[#1c93b5]">{step.videoTitle || "Video"}</span>
              </a>
            ) : null}
            {rendered.attachments.length ? (
              <div className="mt-3">
                <p className="text-[12px] font-bold">Attachments sent with this step</p>
                {rendered.attachments.map((file) => (
                  <a key={file.id} className="mt-1 block text-[13px] text-[#1c93b5]" href={`/api/office/autotracks/files/${file.id}`}>{file.name}</a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AutoTrackWizard({
  onClose,
  onSaved,
  initial,
}: {
  onClose: () => void;
  onSaved?: (category: string) => void;
  initial?: Track;
}) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [doc, setDoc] = useState<AutoTrackDocument>(() => documentFrom({
    id: initial?.id || trackId(),
    name: initial?.name || "Blank Template Copy",
    category: initial?.category === "My AutoTracks" ? "My AutoTracks" : initial?.category || "General",
    status: initial?.status || "draft",
    trigger: initial?.trigger || "New Lead",
    stopTrigger: initial?.stopTrigger || "",
    leadTypes: initial?.leadTypes,
    hours: initial?.hours,
    includeWeekend: initial?.includeWeekend,
    skipHolidays: initial?.skipHolidays,
    startLabel: initial?.startLabel,
    startStage: initial?.startStage,
    landing: initial?.landing,
    customField: initial?.customField,
    source: initial?.source,
    stopLabel: initial?.stopLabel,
    stopStage: initial?.stopStage,
    stopReply: initial?.stopReply,
    complete: initial?.complete,
    share: initial?.share,
    steps: initial?.steps,
  }));
  const [wizard, setWizard] = useState(initial ? 2 : 1);
  const [filter, setFilter] = useState("Blank Templates");
  const [keyword, setKeyword] = useState("");
  const [picked, setPicked] = useState("Blank Template");
  const [days, setDays] = useState<number[]>(() => {
    const found = [...new Set((initial?.steps ?? []).map((step) => step.day))].sort((a, b) => a - b);
    return found.length ? found : [1];
  });
  const [currentDay, setCurrentDay] = useState(1);
  const [draft, setDraft] = useState<AutoTrackStep | null>(null);
  const [stepMenu, setStepMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const templates = BLANK_TEMPLATES.filter((item) => item.toLowerCase().includes(keyword.toLowerCase()));
  const labels = LABEL_GROUPS.flatMap((group) => group.labels);

  useEffect(() => {
    if (!initial?.id) return;
    let cancelled = false;
    fetch("/api/office/autotracks", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { tracks?: AutoTrackDocument[] } | null;
        const match = data?.tracks?.find((track) => track.id === initial.id);
        if (!cancelled && match) {
          setDoc(match);
          const found = [...new Set(match.steps.map((step) => step.day))].sort((a, b) => a - b);
          if (found.length) setDays(found);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initial?.id]);

  function remember(track: Track) {
    update((current) => ({
      ...current,
      tracks: current.tracks.some((item) => item.id === track.id)
        ? current.tracks.map((item) => item.id === track.id ? track : item)
        : [track, ...current.tracks],
      hiddenTracks: current.hiddenTracks.filter((id) => id !== track.id),
    }));
  }

  function openDraft(action: StepAction, existing?: AutoTrackStep) {
    setDraft(existing ?? emptyStep(action, currentDay, stepId()));
    setStepMenu(false);
  }

  function commitDraft() {
    if (!draft) return;
    if (draft.action !== "task" && !draft.subject.trim() && !draft.body.trim()) {
      chrome.toast(draft.action === "email" ? "Enter a subject or message." : "Enter a message.");
      return;
    }
    setDoc((current) => ({
      ...current,
      steps: current.steps.some((step) => step.id === draft.id)
        ? current.steps.map((step) => step.id === draft.id ? draft : step)
        : [...current.steps, draft],
    }));
    setDraft(null);
  }

  async function finish(status: TrackStatus) {
    if (!doc.steps.length) {
      chrome.toast("There must be at least 1 step before you can continue to settings.");
      return;
    }
    setSaving(true);
    try {
      const track = await putTrack({ ...doc, status, name: doc.name.trim() || "Blank Template Copy" });
      remember(track);
      onSaved?.(track.category);
      chrome.toast(status === "active" ? `${track.name} activated.` : `${track.name} saved as a draft.`);
      onClose();
    } catch (error) {
      chrome.toast(error instanceof Error ? error.message : "Could not save that AutoTrack.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame title="AutoTracks Template Builder" onClose={onClose} wide>
      <p className="mb-3 text-[12px] text-[#666]">
        <span className={wizard === 1 ? "font-bold text-[#1c93b5]" : ""}>1. Select Template</span>
        {" · "}
        <span className={wizard === 2 ? "font-bold text-[#1c93b5]" : ""}>2. Edit Template</span>
        {" · "}
        <span className={wizard === 3 ? "font-bold text-[#1c93b5]" : ""}>3. Adjust Settings</span>
        {" · "}
        <span className={wizard === 4 ? "font-bold text-[#1c93b5]" : ""}>4. Review & Finalize</span>
      </p>
      {wizard === 1 ? (
        <div>
          <input className={`${inputCls} mb-2`} placeholder="Enter a Keyword to Search for Templates..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <div className="mb-2 flex flex-wrap gap-1">
            {["Type", "My Templates", "Blank Templates", "CINC Templates"].map((item) => (
              <button key={item} type="button" className={`border px-2 py-1 text-[12px] ${filter === item ? "border-[#1c93b5] text-[#1c93b5]" : "border-[#ddd]"}`} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <p className="mb-1 text-[12px] font-bold">Blank (3)</p>
          {templates.map((item) => (
            <button key={item} type="button" className={`mb-1 block w-full border px-2 py-2 text-left ${picked === item ? "border-[#1c93b5]" : "border-[#eee]"}`} onClick={() => setPicked(item)}>{item}</button>
          ))}
          <div className="mt-2 flex justify-end gap-2">
            <Btn onClick={onClose}>Exit Wizard</Btn>
            <Btn kind="teal" onClick={() => { setDoc((current) => ({ ...current, name: `${picked} Copy` })); setWizard(2); }}>Copy this Template</Btn>
          </div>
        </div>
      ) : null}
      {wizard === 2 ? (
        <div className="space-y-2 text-[13px]">
          <Field label="Name"><input className={inputCls} value={doc.name} onChange={(event) => setDoc({ ...doc, name: event.target.value })} /></Field>
          <Field label="Category">
            <select className={inputCls} value={doc.category} onChange={(event) => setDoc({ ...doc, category: event.target.value })}>
              {["Select Type", "General", "Buyer", "Listing", "Nurture", "Past Client"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <p className="font-bold">1. Select Lead Type</p>
          {AUTOTRACK_LEAD_TYPES.map((item) => (
            <label key={item} className="mr-3">
              <input type="checkbox" checked={doc.leadTypes.includes(item)} onChange={() => setDoc({ ...doc, leadTypes: doc.leadTypes.includes(item) ? doc.leadTypes.filter((value) => value !== item) : [...doc.leadTypes, item] })} /> {item}
            </label>
          ))}
          <p className="font-bold">2. Select Communication Time</p>
          {AUTOTRACK_HOURS.map((item) => (
            <label key={item} className="mr-3"><input type="radio" checked={doc.hours === item} onChange={() => setDoc({ ...doc, hours: item })} /> {item}</label>
          ))}
          <label className="block"><input type="checkbox" checked={doc.includeWeekend} onChange={(event) => setDoc({ ...doc, includeWeekend: event.target.checked })} /> Include Saturday and Sunday</label>
          <label className="block"><input type="checkbox" checked={doc.skipHolidays} onChange={(event) => setDoc({ ...doc, skipHolidays: event.target.checked })} /> Skip Holidays</label>
          {days.map((day) => (
            <section key={day}>
              <button type="button" className={`font-bold ${currentDay === day ? "text-[#1c93b5]" : ""}`} onClick={() => setCurrentDay(day)}>Day {day}</button>
              {doc.steps.filter((step) => step.day === day).map((step) => (
                <div key={step.id} className="mt-1 flex items-center justify-between border border-[#eee] px-2 py-1">
                  <button type="button" className="text-left" onClick={() => openDraft(step.action, step)}>{stepSummary(step)}</button>
                  <button type="button" className="text-[#d9363e]" onClick={() => setDoc({ ...doc, steps: doc.steps.filter((item) => item.id !== step.id) })}>Delete</button>
                </div>
              ))}
            </section>
          ))}
          {draft?.action === "task" ? (
            <div className="space-y-2 border border-[#1c93b5] p-2">
              <p className="font-semibold">ADD REMINDER</p>
              <label className="block text-[12px]"><input type="checkbox" checked={draft.blocking} onChange={(event) => setDraft({ ...draft, blocking: event.target.checked })} /> Set as a blocking reminder</label>
              <Field label="Type">
                <select className={inputCls} value={draft.reminderType} onChange={(event) => setDraft({ ...draft, reminderType: event.target.value })}>
                  <option>Call</option><option>Email</option><option>Other</option>
                </select>
              </Field>
              <Field label="Reminder Name"><input className={inputCls} placeholder="Enter Reminder Name" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></Field>
              <Field label="Agent Assigned">
                <select className={inputCls} value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })}>
                  {SENDERS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Note"><input className={inputCls} placeholder="Details" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></Field>
              <div className="flex justify-end gap-2">
                <Btn onClick={() => setDraft(null)}>Cancel</Btn>
                <Btn kind="teal" onClick={commitDraft}>Update</Btn>
              </div>
            </div>
          ) : null}
          {draft && draft.action !== "task" ? (
            <div>
              <MessageStepEditor trackId={doc.id} step={draft} onChange={setDraft} />
              <div className="mt-2 flex justify-end gap-2">
                <Btn onClick={() => setDraft(null)}>Cancel</Btn>
                <Btn kind="teal" onClick={commitDraft}>Update</Btn>
              </div>
            </div>
          ) : null}
          {!draft ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Btn onClick={() => setStepMenu((value) => !value)}>ADD STEP</Btn>
                <Btn onClick={() => {
                  const next = Math.max(...days) + 1;
                  setDays((current) => [...current, next]);
                  setCurrentDay(next);
                  chrome.toast(`Day ${next} added.`);
                }}>ADD NEW DAY</Btn>
              </div>
              {stepMenu ? (
                <div className="flex gap-2">
                  <Btn onClick={() => openDraft("email")}>ADD EMAIL</Btn>
                  <Btn onClick={() => openDraft("text")}>ADD TEXT</Btn>
                  <Btn onClick={() => openDraft("task")}>ADD REMINDER</Btn>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Btn onClick={onClose}>Exit Wizard</Btn>
            <Btn onClick={() => setWizard(1)}>Back</Btn>
            <Btn kind="teal" onClick={() => {
              if (!doc.steps.length) {
                chrome.toast("There must be at least 1 step before you can continue to settings.");
                return;
              }
              setWizard(3);
            }}>Continue</Btn>
          </div>
        </div>
      ) : null}
      {wizard === 3 ? (
        <div className="space-y-2 text-[13px]">
          <p className="font-bold">I want to start my AutoTrack...</p>
          <label className="block"><input type="checkbox" checked disabled /> With a New Lead — New Lead</label>
          <label className="block">Or, with a Label <select className="ml-2 border border-[#ccc]" value={doc.startLabel} onChange={(event) => setDoc({ ...doc, startLabel: event.target.value })}><option value="">Select Label</option>{labels.map((label) => <option key={label}>{label}</option>)}</select></label>
          <label className="block">Or, with a Pipeline Stage <select className="ml-2 border border-[#ccc]" value={doc.startStage} onChange={(event) => setDoc({ ...doc, startStage: event.target.value })}><option value="">Select Lead Pipeline Stage</option>{AUTOTRACK_PIPELINES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block">Or, with a Landing Page <select className="ml-2 border border-[#ccc]" value={doc.landing} onChange={(event) => setDoc({ ...doc, landing: event.target.value })}><option value="">Select Landing Page</option>{AUTOTRACK_LANDING_PAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <p>Or, with a Custom Field <select className="ml-2 border border-[#ccc]" value={doc.customField} onChange={(event) => setDoc({ ...doc, customField: event.target.value })}><option value="">Select Custom Field</option><option>Birthdate</option></select></p>
          <label className="block">And, with a Source <input className="ml-2 h-8 border border-[#ccc] px-2" placeholder="Type a lead source" value={doc.source} onChange={(event) => setDoc({ ...doc, source: event.target.value })} /></label>
          <p className="font-bold">I want to stop my AutoTrack...</p>
          <label className="block">with a Label <select className="ml-2 border border-[#ccc]" value={doc.stopLabel} onChange={(event) => setDoc({ ...doc, stopLabel: event.target.value })}><option value="">Select Label</option>{labels.map((label) => <option key={`stop-${label}`}>{label}</option>)}</select></label>
          <label className="block">Or, with a Pipeline Stage <select className="ml-2 border border-[#ccc]" value={doc.stopStage} onChange={(event) => setDoc({ ...doc, stopStage: event.target.value })}><option value="">Select Lead Pipeline Stage</option>{AUTOTRACK_PIPELINES.map((item) => <option key={`stop-${item}`}>{item}</option>)}</select></label>
          <label className="block"><input type="checkbox" checked={doc.stopReply} onChange={(event) => setDoc({ ...doc, stopReply: event.target.checked })} /> When Lead Replies/Reaches Out</label>
          <p className="font-bold">Select what happens when your AutoTrack COMPLETES</p>
          {COMPLETION_ACTIONS.map((item) => (
            <label key={item} className="mr-3"><input type="radio" checked={doc.complete === item} onChange={() => setDoc({ ...doc, complete: item })} /> {item}</label>
          ))}
          <label className="block"><input type="checkbox" checked={doc.share} onChange={(event) => setDoc({ ...doc, share: event.target.checked })} /> Allow team members to access this template</label>
          {doc.share ? (
            <div className="max-h-40 overflow-auto border border-[#eee] p-2 text-[12px]">
              {OFFICE_ROSTER.map((agent) => (
                <div key={agent} className="flex flex-wrap gap-3 py-0.5">
                  <span className="w-40">{agent}</span>
                  <label><input type="checkbox" /> Can Copy</label>
                  <label><input type="checkbox" /> Can Edit</label>
                  <label><input type="checkbox" /> Is Owner</label>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Btn onClick={onClose}>Exit Wizard</Btn>
            <Btn onClick={() => setWizard(2)}>Back</Btn>
            <Btn kind="teal" onClick={() => setWizard(4)}>Save Settings</Btn>
          </div>
        </div>
      ) : null}
      {wizard === 4 ? (
        <div className="space-y-3 text-[13px]">
          <h3 className="text-[16px] font-semibold">Review & Finalize</h3>
          <dl className="grid grid-cols-[160px_1fr] gap-y-1">
            <dt className="font-bold">Name</dt><dd>{doc.name}</dd>
            <dt className="font-bold">Category</dt><dd>{doc.category === "Select Type" ? "General" : doc.category}</dd>
            <dt className="font-bold">Lead types</dt><dd>{doc.leadTypes.join(", ") || "Everyone"}</dd>
            <dt className="font-bold">Send hours</dt><dd>{doc.hours}{doc.includeWeekend ? ", Include Saturday and Sunday" : ""}{doc.skipHolidays ? ", Skip Holidays" : ""}</dd>
            <dt className="font-bold">Start</dt><dd>New Lead{doc.startLabel ? `; Label ${doc.startLabel}` : ""}{doc.startStage ? `; ${doc.startStage}` : ""}{doc.landing ? `; ${doc.landing}` : ""}{doc.customField ? `; ${doc.customField}` : ""}{doc.source ? `; Source ${doc.source}` : ""}</dd>
            <dt className="font-bold">Stop</dt><dd>{doc.stopReply ? "When Lead Replies/Reaches Out" : "No reply rule"}{doc.stopLabel ? `; Label ${doc.stopLabel}` : ""}{doc.stopStage ? `; ${doc.stopStage}` : ""}</dd>
            <dt className="font-bold">Completion</dt><dd>{doc.complete}</dd>
            <dt className="font-bold">Sharing</dt><dd>{doc.share ? "Allow team members to access this template" : "Private to you"}</dd>
          </dl>
          <div>
            <p className="font-bold">Steps</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {doc.steps.map((step) => (
                <li key={step.id}>
                  {stepSummary(step)}
                  {step.attachments.length ? <span className="text-[#666]"> · {step.attachments.map((file) => file.name).join(", ")}</span> : null}
                  {step.videoUrl ? <span className="text-[#666]"> · Video {step.videoTitle || step.videoUrl}</span> : null}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setWizard(3)}>Back</Btn>
            <Btn disabled={saving} onClick={() => void finish("draft")}>Save as Draft</Btn>
            <Btn kind="teal" disabled={saving} onClick={() => void finish("active")}>Activate</Btn>
          </div>
        </div>
      ) : null}
    </ModalFrame>
  );
}

export async function loadAutoTracks(): Promise<{ tracks: Track[]; hiddenIds: string[] } | null> {
  const response = await fetch("/api/office/autotracks", { cache: "no-store" });
  const data = (await response.json().catch(() => null)) as { tracks?: Track[]; hiddenIds?: string[] } | null;
  if (!response.ok || !data?.tracks) return null;
  return { tracks: data.tracks, hiddenIds: data.hiddenIds ?? [] };
}

export async function persistTrackStatus(track: Track, status: TrackStatus): Promise<Track> {
  const doc = documentFrom({
    id: track.id,
    name: track.name,
    category: track.category,
    status,
    trigger: track.trigger,
    stopTrigger: track.stopTrigger,
    leadTypes: track.leadTypes,
    hours: track.hours,
    includeWeekend: track.includeWeekend,
    skipHolidays: track.skipHolidays,
    startLabel: track.startLabel,
    startStage: track.startStage,
    landing: track.landing,
    customField: track.customField,
    source: track.source,
    stopLabel: track.stopLabel,
    stopStage: track.stopStage,
    stopReply: track.stopReply,
    complete: track.complete,
    share: track.share,
    steps: track.steps ?? [],
  });
  return putTrack({ ...doc, status });
}

export async function duplicateTrack(track: Track): Promise<Track> {
  const existing = await fetch(`/api/office/autotracks/${track.id}/duplicate`, { method: "POST" });
  if (existing.ok) {
    const data = (await existing.json()) as { track: Track };
    return data.track;
  }
  const doc = documentFrom({
    ...track,
    id: trackId(),
    name: `${track.name} copy`,
    status: "draft",
    steps: (track.steps ?? []).map((step) => ({ ...step, id: stepId(), attachments: [] })),
  });
  return putTrack({ ...doc, status: "draft" });
}

export async function removeTrack(id: string) {
  const response = await fetch(`/api/office/autotracks/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "Could not delete that AutoTrack.");
  }
}
