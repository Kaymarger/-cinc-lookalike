"use client";

import { useEffect, useState } from "react";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls, ModalFrame } from "./ui";

const OUTCOMES = ["Connected", "No Answer", "Busy", "Voicemail", "Wrong Number", "Left Message"] as const;

export function DialerPanel({
  title,
  name,
  phone,
  onClose,
  onLog,
}: {
  title: string;
  name: string;
  phone: string;
  onClose: () => void;
  onLog: (outcome: string, notes: string) => void;
}) {
  const chrome = useChrome();
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("Connected");
  const [notes, setNotes] = useState("");
  const [voice, setVoice] = useState<boolean | null>(null);
  const dial = phone.replace(/[^\d+]/g, "");
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { channels?: { voice?: boolean } } | null;
      setVoice(Boolean(data?.channels?.voice));
    });
  }, []);
  async function place() {
    const response = await fetch("/api/office/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "voice", to: phone, body: `${outcome}. ${notes}`.trim() }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      chrome.toast(data?.message || "That call was not placed.");
      return;
    }
    onLog(outcome, notes.trim());
  }
  return (
    <ModalFrame title={title} onClose={onClose}>
      <p className="text-[18px] font-semibold">{name}</p>
      <p className="text-[#1c93b5]">{phone || "No phone on file"}</p>
      {voice === false ? <p className="mt-3 bg-[#fff6e5] px-3 py-2 text-[13px] text-[#8a5a00]">Calling is not connected.</p> : null}
      {dial ? (
        <a className="mt-3 inline-flex h-9 items-center border border-[#2e9e5b] px-3 text-[13px] font-semibold text-[#2e9e5b]" href={`tel:${dial}`}>
          Call from this phone
        </a>
      ) : null}
      <div className="mt-3">
        <Field label="Outcome">
          <select className={inputCls} value={outcome} onChange={(event) => setOutcome(event.target.value as (typeof OUTCOMES)[number])}>
            {OUTCOMES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" disabled={voice === false || !phone} onClick={() => void place()}>Call with Twilio</Btn>
      </div>
    </ModalFrame>
  );
}
