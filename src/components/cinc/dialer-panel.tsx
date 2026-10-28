"use client";

import { useState } from "react";
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
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("Connected");
  const [notes, setNotes] = useState("");
  const dial = phone.replace(/[^\d+]/g, "");
  return (
    <ModalFrame title={title} onClose={onClose}>
      <p className="text-[18px] font-semibold">{name}</p>
      <p className="text-[#1c93b5]">{phone || "No phone on file"}</p>
      {dial ? (
        <a className="mt-3 inline-flex h-9 items-center bg-[#2e9e5b] px-3 text-[13px] font-semibold text-white" href={`tel:${dial}`}>
          Call {phone}
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
        <Btn kind="teal" onClick={() => onLog(outcome, notes.trim())}>Log call</Btn>
      </div>
    </ModalFrame>
  );
}
