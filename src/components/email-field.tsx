"use client";

import { useState, type InputHTMLAttributes } from "react";
import { emailLooksValid, suggestEmail } from "@/lib/email-suggest";

export function EmailField({
  className,
  onBlur,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [note, setNote] = useState("");
  const [invalid, setInvalid] = useState(false);

  return (
    <div className="w-full">
      <input
        {...props}
        type="text"
        inputMode="email"
        autoComplete={props.autoComplete || "email"}
        autoCapitalize="none"
        spellCheck={false}
        className={className}
        onChange={(event) => {
          setNote("");
          setInvalid(false);
          onChange?.(event);
        }}
        onBlur={(event) => {
          const typed = event.currentTarget.value;
          const suggestion = suggestEmail(typed);
          if (suggestion) {
            event.currentTarget.value = suggestion;
            onChange?.(event);
            setNote(`Corrected to ${suggestion}`);
            setInvalid(false);
          } else if (typed.trim() && !emailLooksValid(typed)) {
            setNote("");
            setInvalid(true);
          } else {
            setNote("");
            setInvalid(false);
          }
          onBlur?.(event);
        }}
      />
      {note ? <p className="mt-1 text-sm text-[#04427d]">{note}</p> : null}
      {invalid ? <p className="mt-1 text-sm text-[#c62828]">Enter an email like name@domain.com.</p> : null}
    </div>
  );
}
