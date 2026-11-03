"use client";

export function BuyerQuestions({ questions }: { questions: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {questions.map((question) => (
        <li key={question}>
          <a
            href="#maincontent_propertyinquirysection"
            className="block py-1.5 text-left text-[13px] text-[var(--cedar)] hover:underline"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("gvhs-inquiry", { detail: question }));
            }}
          >
            {question}
          </a>
        </li>
      ))}
    </ul>
  );
}
