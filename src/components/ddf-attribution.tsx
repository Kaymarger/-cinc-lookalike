export const DDF_DISCLAIMER =
  "The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by CREA and identify the quality of services provided by real estate professionals who are members of CREA. Used under license.";

export function RealtorBadge({ href }: { href: string }) {
  const url = href.startsWith("http") ? href : "https://www.realtor.ca/";
  return (
    <a href={url} target="_blank" rel="noreferrer" aria-label="Powered by REALTOR.ca">
      <img
        width={125}
        height={28}
        alt="Powered by REALTOR.ca"
        src="https://www.realtor.ca/images/en-ca/powered_by_realtor.svg"
      />
    </a>
  );
}

export function DdfDisclaimer() {
  return <p className="text-[12px] leading-relaxed text-[#666]">{DDF_DISCLAIMER}</p>;
}
