"use client";

import { useRef, useState, type ReactNode } from "react";
import { MERGE_TAGS } from "@/lib/cinc-options";
import { fillMergeTags, SAMPLE_MERGE } from "@/lib/autotrack";
import { DEMO_LISTINGS } from "@/lib/demo-listings";
import { useChrome } from "./chrome-context";
import { useCinc, uid } from "./store";

export type MailDraft = { to: string; cc: string; bcc: string; subject: string; body: string; attachments: string[] };

const EMOJIS = ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "😳", "🤪", "😵", "😡", "😠", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🤠", "🤡", "🥳", "🥴", "🥺", "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "👿", "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🎉", "🎊", "🎁", "🏠", "🏡", "🔑", "🚪", "📞", "✉️", "✅", "⭐", "🔥", "💬", "📌", "📍", "🗓️", "⏰"];
const MERGE_COLUMNS = [
  ["[FIRSTNAME]", "[LASTNAME]", "[FULLNAME]", "[CELLPHONE]", "[EMAIL]", "[FAVORITE CITY]", "[ADDRESS]", "[SECONDARY CONTACT]", "[WEBSITE]", "[TIMEOFDAY]"],
  ["[AGENT FIRSTNAME]", "[AGENT LASTNAME]", "[AGENT CELLPHONE]", "[AGENT CINC NUMBER]", "[AGENT EMAIL]", "[AGENT LICENSENUMBER]", "[LISTINGAGENT FIRSTNAME]", "[LISTINGAGENT LASTNAME]", "[LISTINGAGENT CELLPHONE]", "[LISTINGAGENT EMAIL]"],
  ["[PARTNER FIRSTNAME]", "[PARTNER LASTNAME]", "[PARTNER CELLPHONE]", "[PARTNER EMAIL]", "[PARTNER COMPANY]", "[PARTNER WEBSITE]", "[PARTNER LICENSE]", "[DAYOFWEEK]", "[MARKETREPORTLINK]", "[CHANGE_SETTINGS_LINK]"],
];

const SIGNATURE = `<p>Kayla Gerak<br>Archibald Real Estate Group<br>Direct: 604.363.7858<br>agent@example.com</p>`;

function Frame({
  title,
  onClose,
  children,
  onCancel,
  onTemplate,
  onPreview,
  onSend,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  onCancel: () => void;
  onTemplate: () => void;
  onPreview: () => void;
  onSend: () => void;
}) {
  const [min, setMin] = useState(false);
  const [wide, setWide] = useState(false);
  return (
    <div className={`fixed right-4 bottom-4 z-[80] flex flex-col border border-[#cfcfcf] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.25)] ${wide ? "h-[86vh] w-[760px]" : "w-[560px]"} max-w-[calc(100vw-2rem)]`}>
      <header className="flex items-center gap-2 bg-[#3a3a3a] px-3 py-2 text-[13px] text-white">
        <span className="flex-1">{title}</span>
        <button type="button" aria-label="Minimize" className="px-1" onClick={() => setMin((value) => !value)}>–</button>
        <button type="button" aria-label="Expand" className="px-1" onClick={() => setWide((value) => !value)}>▢</button>
        <button type="button" aria-label="Close" className="px-1" onClick={onClose}>×</button>
      </header>
      {min ? null : (
        <>
          <div className="max-h-[70vh] overflow-auto p-3 text-[13px]">{children}</div>
          <footer className="flex items-center justify-between border-t border-[#e5e5e5] px-3 py-2">
            <button type="button" className="bg-[#333] px-3 py-1.5 text-[13px] text-white" onClick={onCancel}>Cancel</button>
            <div className="flex gap-2">
              <button type="button" className="border border-[#ccc] bg-white px-3 py-1.5" onClick={onTemplate}>Save as Template</button>
              <button type="button" className="border border-[#ccc] bg-white px-3 py-1.5" onClick={onPreview}>Preview</button>
              <button type="button" className="bg-[#1c93b5] px-4 py-1.5 text-white" onClick={onSend}>Send</button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

function GearMenu({
  mode,
  setMode,
  cc,
  setCc,
  bcc,
  setBcc,
  sec,
  setSec,
  unbranded,
  setUnbranded,
}: {
  mode: string;
  setMode: (value: string) => void;
  cc: boolean;
  setCc: (value: boolean) => void;
  bcc: boolean;
  setBcc: (value: boolean) => void;
  sec: boolean;
  setSec: (value: boolean) => void;
  unbranded: boolean;
  setUnbranded: (value: boolean) => void;
}) {
  return (
    <div className="absolute top-7 left-0 z-10 w-52 border border-[#ddd] bg-white p-2 text-[12px] shadow">
      <label className="block"><input type="checkbox" checked={cc} onChange={(event) => setCc(event.target.checked)} /> Add CC</label>
      <label className="block"><input type="checkbox" checked={bcc} onChange={(event) => setBcc(event.target.checked)} /> Add BCC</label>
      <label className="block"><input type="checkbox" checked={sec} onChange={(event) => setSec(event.target.checked)} /> CC Sec. Contacts</label>
      {["HTML Email", "Plain Text Email", "Text Message", "Gmail"].map((item) => (
        <label key={item} className="block"><input type="radio" checked={mode === item} onChange={() => setMode(item)} /> {item}</label>
      ))}
      <label className="block"><input type="checkbox" checked={unbranded} onChange={(event) => setUnbranded(event.target.checked)} /> Unbranded</label>
    </div>
  );
}

function RichEditor({ initial, editorRef }: { initial: string; editorRef: { current: HTMLDivElement | null } }) {
  const ready = useRef(false);
  return (
    <div
      ref={(node) => {
        editorRef.current = node;
        if (node && !ready.current) {
          node.innerHTML = initial;
          ready.current = true;
        }
      }}
      contentEditable
      suppressContentEditableWarning
      className="min-h-36 border border-[#ddd] p-2 outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
    />
  );
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={title} className="px-1.5 py-0.5 text-[12px] hover:bg-[#e7f4f8]" onClick={onClick}>{children}</button>;
}

export function EmailComposer({
  to = "",
  leadName = "",
  onClose,
  onSend,
  onDraft,
}: {
  to?: string;
  leadName?: string;
  onClose: () => void;
  onSend: (value: MailDraft) => void;
  onDraft: (value: MailDraft) => void;
}) {
  const chrome = useChrome();
  const { state, update } = useCinc();
  const editor = useRef<HTMLDivElement>(null);
  const [dest, setDest] = useState(to);
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [menu, setMenu] = useState<"gear" | "merge" | "emoji" | "property" | null>(null);
  const [mode, setMode] = useState("HTML Email");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sec, setSec] = useState(true);
  const [unbranded, setUnbranded] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [property, setProperty] = useState("");
  const [video, setVideo] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [listMenu, setListMenu] = useState<"none" | "bullet" | "number">("none");
  const [emojiQuery, setEmojiQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const templates = state.templates.filter((item) => item.type === "Email");
  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
  }
  function insert(text: string) {
    editor.current?.focus();
    document.execCommand("insertText", false, text);
  }
  function html() {
    const body = mode === "Plain Text Email" ? (editor.current?.innerText ?? "") : (editor.current?.innerHTML ?? "");
    return body;
  }
  function payload(): MailDraft {
    return {
      to: dest,
      cc,
      bcc,
      subject: subject || "(no subject)",
      body: html(),
      attachments: files,
    };
  }
  function saveTemplate() {
    const name = window.prompt("Template name", subject || "New email");
    if (!name) return;
    update((current) => ({
      ...current,
      templates: [...current.templates, { id: uid("tpl"), group: "Uncategorized", name, type: "Email", createdBy: "Kayla Gerak", edited: "10-30-2026", body: html() }],
    }));
    chrome.toast("Template saved.");
    onDraft(payload());
  }
  return (
    <Frame title="Compose CINC Mail Message" onClose={onClose} onCancel={onClose} onTemplate={saveTemplate} onPreview={() => setPreviewHtml(editor.current?.innerHTML || SIGNATURE)} onSend={() => { if (!dest.trim()) { chrome.toast("Enter a recipient."); return; } onSend(payload()); }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="w-16">To *</span>
        <span className="bg-[#e7f4f8] px-2 py-0.5">{leadName || dest || "Lead"} (lead) ×</span>
        <button type="button" className="text-[#1c93b5]">+ People ▾</button>
      </div>
      {showCc ? <label className="mb-2 block">Cc <input className="ml-2 h-7 w-[70%] border border-[#ccc] px-2" value={cc} onChange={(event) => setCc(event.target.value)} /></label> : null}
      {showBcc ? <label className="mb-2 block">Bcc <input className="ml-2 h-7 w-[70%] border border-[#ccc] px-2" value={bcc} onChange={(event) => setBcc(event.target.value)} /></label> : null}
      <label className="mb-2 flex items-center gap-2">Template
        <select className="h-7 flex-1 border border-[#ccc] px-1" value={templateId} onChange={(event) => {
          const id = event.target.value;
          setTemplateId(id);
          const chosen = templates.find((item) => item.id === id);
          if (!chosen || !editor.current) return;
          setSubject(chosen.name);
          editor.current.innerHTML = chosen.body || SIGNATURE;
        }}>
          <option value="">(None)</option>
          {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="mb-2 flex items-center gap-2">Subject
        <input className="h-7 flex-1 border border-[#ccc] px-2" value={subject} onChange={(event) => setSubject(event.target.value)} />
      </label>
      <div className="mb-1 flex items-center gap-2 text-[#1c93b5]">
        <span>Your message *</span>
        <span className="relative">
          <button type="button" title="Options" onClick={() => setMenu(menu === "gear" ? null : "gear")}>⚙</button>
          {menu === "gear" ? <GearMenu mode={mode} setMode={setMode} cc={showCc} setCc={setShowCc} bcc={showBcc} setBcc={setShowBcc} sec={sec} setSec={setSec} unbranded={unbranded} setUnbranded={setUnbranded} /> : null}
        </span>
        <span className="relative">
          <button type="button" title="Merge tags" onClick={() => setMenu(menu === "merge" ? null : "merge")}>🏷</button>
          {menu === "merge" ? (
            <div className="absolute top-7 left-0 z-10 grid w-[520px] grid-cols-3 gap-2 border border-[#ddd] bg-white p-2 text-[11px] text-[#333] shadow">
              {MERGE_COLUMNS.map((column) => (
                <div key={column[0]}>{column.map((tag) => <button key={tag} type="button" className="block w-full py-0.5 text-left hover:bg-[#f3fafc]" onClick={() => { insert(tag); setMenu(null); }}>{tag}</button>)}</div>
              ))}
            </div>
          ) : null}
        </span>
        <span className="relative">
          <button type="button" title="Emoji" onClick={() => setMenu(menu === "emoji" ? null : "emoji")}>🙂</button>
          {menu === "emoji" ? (
            <div className="absolute top-7 left-0 z-10 w-56 border border-[#ddd] bg-white p-2 shadow">
              <input className="mb-1 h-7 w-full border border-[#ccc] px-1 text-[12px] text-[#333]" placeholder="Search Emoji by Description" value={emojiQuery} onChange={(event) => setEmojiQuery(event.target.value)} />
              <div className="grid grid-cols-8 gap-1">{EMOJIS.filter((item) => !emojiQuery || item.includes(emojiQuery)).map((item) => <button key={item} type="button" onClick={() => { insert(item); setMenu(null); }}>{item}</button>)}</div>
            </div>
          ) : null}
        </span>
        <span className="relative">
          <button type="button" title="Insert listing" onClick={() => setMenu(menu === "property" ? null : "property")}>🏠</button>
          {menu === "property" ? (
            <div className="absolute top-7 left-0 z-10 max-h-40 w-64 overflow-auto border border-[#ddd] bg-white text-[12px] text-[#333] shadow">
              {DEMO_LISTINGS.slice(0, 8).map((listing) => (
                <button key={listing.mls} type="button" className="block w-full px-2 py-1 text-left hover:bg-[#f3fafc]" onClick={() => { setProperty(listing.address); insert(`${listing.address}, ${listing.city} · $${listing.price.toLocaleString("en-CA")}`); setMenu(null); }}>{listing.address}</button>
              ))}
            </div>
          ) : null}
        </span>
        <button type="button" title="Video" onClick={() => setVideoOpen(true)}>🎥</button>
      </div>
      {videoOpen ? (
        <div className="mb-2 flex gap-2 border border-[#ddd] bg-[#f8fbfc] p-2">
          <input className="h-8 flex-1 border border-[#ccc] px-2 text-[13px]" placeholder="Video URL" value={video} onChange={(event) => setVideo(event.target.value)} />
          <button type="button" className="bg-[#1c93b5] px-2 text-[12px] text-white" onClick={() => { if (video.trim()) insert(video.trim()); setVideoOpen(false); }}>Insert</button>
          <button type="button" className="px-2 text-[12px]" onClick={() => setVideoOpen(false)}>Cancel</button>
        </div>
      ) : null}
      {mode !== "Plain Text Email" && mode !== "Text Message" ? (
        <div className="flex flex-wrap items-center border border-[#ddd] bg-[#fafafa] text-[#444]">
          <ToolButton title="Undo" onClick={() => format("undo")}>↺</ToolButton>
          <ToolButton title="Redo" onClick={() => format("redo")}>↻</ToolButton>
          <select title="Block" className="h-6 border-0 bg-transparent text-[12px]" defaultValue="p" onChange={(event) => format("formatBlock", event.target.value)}>
            <option value="p">Paragraph</option>
            <option value="h2">Heading</option>
          </select>
          <ToolButton title="Bold" onClick={() => format("bold")}><b>B</b></ToolButton>
          <ToolButton title="Italic" onClick={() => format("italic")}><i>I</i></ToolButton>
          <select title="Font size" className="h-6 border-0 bg-transparent text-[12px]" defaultValue="3" onChange={(event) => format("fontSize", event.target.value)}>
            <option value="2">10pt</option>
            <option value="3">12pt</option>
            <option value="5">18pt</option>
          </select>
          <label title="Text color" className="px-1">A<input type="color" className="h-4 w-4" defaultValue="#243238" onChange={(event) => format("foreColor", event.target.value)} /></label>
          <label title="Background color" className="px-1">▮<input type="color" className="h-4 w-4" defaultValue="#ffffff" onChange={(event) => format("hiliteColor", event.target.value)} /></label>
          <ToolButton title="Align left" onClick={() => format("justifyLeft")}>⬅</ToolButton>
          <ToolButton title="Align center" onClick={() => format("justifyCenter")}>↔</ToolButton>
          <ToolButton title="Align right" onClick={() => format("justifyRight")}>➡</ToolButton>
          <ToolButton title="Justify" onClick={() => format("justifyFull")}>☰</ToolButton>
          <span className="relative inline-flex">
            <ToolButton title="Bullet list" onClick={() => format("insertHTML", "<ul><li>List item</li></ul>")}>•</ToolButton>
            <button type="button" className="px-0.5 text-[10px]" onClick={() => setListMenu(listMenu === "bullet" ? "none" : "bullet")}>▾</button>
            {listMenu === "bullet" ? <span className="absolute top-6 left-0 z-10 border border-[#ddd] bg-white text-[12px] shadow"><button type="button" className="block px-2 py-1" onClick={() => { format("insertHTML", "<ul><li>List item</li></ul>"); setListMenu("none"); }}>Disc</button><button type="button" className="block px-2 py-1" onClick={() => { format("insertHTML", "<ul style='list-style:circle'><li>List item</li></ul>"); setListMenu("none"); }}>Circle</button></span> : null}
          </span>
          <span className="relative inline-flex">
            <ToolButton title="Numbered list" onClick={() => format("insertHTML", "<ol><li>List item</li></ol>")}>1.</ToolButton>
            <button type="button" className="px-0.5 text-[10px]" onClick={() => setListMenu(listMenu === "number" ? "none" : "number")}>▾</button>
            {listMenu === "number" ? <span className="absolute top-6 left-0 z-10 border border-[#ddd] bg-white text-[12px] shadow"><button type="button" className="block px-2 py-1" onClick={() => { format("insertHTML", "<ol><li>List item</li></ol>"); setListMenu("none"); }}>1. 2. 3.</button><button type="button" className="block px-2 py-1" onClick={() => { format("insertHTML", "<ol type='a'><li>List item</li></ol>"); setListMenu("none"); }}>a. b. c.</button></span> : null}
          </span>
          <ToolButton title="Decrease indent" onClick={() => format("outdent")}>⇤</ToolButton>
          <ToolButton title="Increase indent" onClick={() => format("indent")}>⇥</ToolButton>
          <ToolButton title="Insert/edit link" onClick={() => { const href = window.prompt("Link"); if (href) format("createLink", href); }}>🔗</ToolButton>
          <ToolButton title="Insert/edit image" onClick={() => { const src = window.prompt("Image URL"); if (src) format("insertImage", src); }}>🖼</ToolButton>
          <ToolButton title="Source code" onClick={() => { if (!editor.current) return; const source = window.prompt("HTML", editor.current.innerHTML); if (source != null) editor.current.innerHTML = source; }}>{"</>"}</ToolButton>
        </div>
      ) : null}
      <RichEditor initial={SIGNATURE} editorRef={editor} />
      {previewHtml ? <div className="mt-2 border border-[#ddd] bg-[#fafafa] p-2" dangerouslySetInnerHTML={{ __html: fillMergeTags(previewHtml, SAMPLE_MERGE) }} /> : null}
      <button type="button" className="mt-2 block text-left text-[#1c93b5]" onClick={() => fileRef.current?.click()}>📎 Attachments: ({files.length ? files.join(", ") : "none"})</button>
      <input ref={fileRef} type="file" multiple className="mt-1 block text-[12px]" onChange={(event) => { setFiles([...(event.target.files ?? [])].map((file) => file.name)); }} />
      <p>🏠 Properties: ({property || "none"})</p>
      <p>🎥 Video: ({video || "none"})</p>
      <p className="hidden">{MERGE_TAGS.length}{sec ? "" : ""}{unbranded ? "" : ""}{dest}</p>
    </Frame>
  );
}

export function TextComposer({
  to = "",
  leadName = "",
  onClose,
  onSend,
}: {
  to?: string;
  leadName?: string;
  onClose: () => void;
  onSend: (value: { to: string; body: string }) => void;
}) {
  const chrome = useChrome();
  const { state, update } = useCinc();
  const box = useRef<HTMLTextAreaElement>(null);
  const [dest, setDest] = useState(to);
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [menu, setMenu] = useState<"gear" | "merge" | "emoji" | null>(null);
  const [mode, setMode] = useState("Text Message");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sec, setSec] = useState(true);
  const [unbranded, setUnbranded] = useState(false);
  const [property, setProperty] = useState("");
  const [video, setVideo] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const texts = state.templates.filter((item) => item.type === "Text");
  function insert(value: string) {
    const el = box.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? start;
    setBody(`${body.slice(0, start)}${value}${body.slice(end)}`.slice(0, 320));
  }
  return (
    <Frame
      title="Compose Message"
      onClose={onClose}
      onCancel={onClose}
      onTemplate={() => {
        const name = window.prompt("Template name", "New text");
        if (!name) return;
        update((current) => ({ ...current, templates: [...current.templates, { id: uid("tpl"), group: "Uncategorized", name, type: "Text", createdBy: "Kayla Gerak", edited: "10-30-2026", body }] }));
        chrome.toast("Template saved.");
      }}
      onPreview={() => setPreview((value) => !value)}
      onSend={() => { if (!dest.trim() || !body.trim()) { chrome.toast("Enter a recipient and a message."); return; } onSend({ to: dest, body: fillMergeTags(body, SAMPLE_MERGE) }); }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="w-16">To *</span>
        {to ? <span className="bg-[#e7f4f8] px-2 py-0.5">{leadName || dest} (lead)</span> : <input className="h-7 flex-1 border border-[#ccc] px-2" placeholder="Recipient email or phone" value={dest} onChange={(event) => setDest(event.target.value)} />}
        <button type="button" className="text-[#1c93b5]">+ People ▾</button>
      </div>
      <label className="mb-2 flex items-center gap-2">Template
        <select className="h-7 flex-1 border border-[#ccc] px-1" value={templateId} onChange={(event) => {
          const id = event.target.value;
          setTemplateId(id);
          const chosen = texts.find((item) => item.id === id);
          if (chosen) setBody((chosen.body || chosen.name).slice(0, 320));
        }}>
          <option value="">(None)</option>
          {texts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="mb-1 flex items-center gap-2 text-[#1c93b5]">
        <span>Your message *</span>
        <span className="relative">
          <button type="button" title="Options" onClick={() => setMenu(menu === "gear" ? null : "gear")}>⚙</button>
          {menu === "gear" ? <GearMenu mode={mode} setMode={setMode} cc={showCc} setCc={setShowCc} bcc={showBcc} setBcc={setShowBcc} sec={sec} setSec={setSec} unbranded={unbranded} setUnbranded={setUnbranded} /> : null}
        </span>
        <button type="button" title="Merge tags" onClick={() => insert("[FIRSTNAME]")}>🏷</button>
        <button type="button" title="Emoji" onClick={() => insert("😊")}>🙂</button>
        <button type="button" title="Insert listing" onClick={() => { const listing = DEMO_LISTINGS[0]; setProperty(listing.address); insert(`${listing.address}, ${listing.city}`); }}>🏠</button>
        <button type="button" title="Video" onClick={() => setVideoOpen(true)}>🎥</button>
      </div>
      <textarea ref={box} className="h-28 w-full border border-[#ddd] p-2 outline-none" maxLength={320} value={body} onChange={(event) => setBody(event.target.value)} />
      <p className="text-right text-[11px] text-[#888]">{body.length}/320</p>
      {preview ? <p className="mt-2 border border-[#ddd] bg-[#fafafa] p-2">{fillMergeTags(body, SAMPLE_MERGE)}</p> : null}
      {videoOpen ? (
        <div className="mt-2 flex gap-2 border border-[#ddd] bg-[#f8fbfc] p-2">
          <input className="h-8 flex-1 border border-[#ccc] px-2 text-[13px]" placeholder="Video URL" value={video} onChange={(event) => setVideo(event.target.value)} />
          <button type="button" className="bg-[#1c93b5] px-2 text-[12px] text-white" onClick={() => { if (video.trim()) insert(video.trim()); setVideoOpen(false); }}>Insert</button>
        </div>
      ) : null}
      <p>🏠 Properties: ({property || "none"})</p>
      <p>🎥 Video: ({video || "none"})</p>
    </Frame>
  );
}
