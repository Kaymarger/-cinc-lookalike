const BENEFITS = [
  {
    title: "Search For Your Dream Home.",
    body: "Save searches and receive notifications on homes that fall within your wants.",
  },
  {
    title: "Connect with your agent instantly.",
    body: "Message anytime with your agent and request tours right from the property page.",
  },
  {
    title: "Get instant alerts on your phone.",
    body: "Receive property alerts from your saved searches on this device (demo).",
  },
  {
    title: "Claim a HomePulse Report.",
    body: "Keep in the know with market updates from Archibald Real Estate Group.",
  },
];

export function AccountBenefits() {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[#222]">
        What can you do next?
      </h2>
      <ul className="mt-5 space-y-5">
        {BENEFITS.map((b) => (
          <li key={b.title}>
            <p className="font-semibold text-[var(--cedar)]">{b.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#666]">{b.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
