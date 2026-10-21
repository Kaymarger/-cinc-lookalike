import { PageAssist } from "@/components/page-assist";
import { cn } from "@/lib/utils";

/** Shared CINC content-page chrome: assist line + optional title underline */
export function CamelotPageHeader({
  title,
  subtitle,
  underline = "left",
  className,
}: {
  title?: string;
  subtitle?: string;
  underline?: "left" | "center" | "none";
  className?: string;
}) {
  return (
    <>
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      {(title || subtitle) && (
        <div className={cn("mx-auto max-w-[1000px] px-4 pt-10 sm:px-6", className)}>
          {title && (
            <h1
              className={cn(
                "relative w-fit pb-3 font-[family-name:var(--font-display)] text-3xl font-normal text-[#222] sm:text-4xl",
                underline === "center" && "mx-auto text-center",
                underline === "none" && "pb-0"
              )}
            >
              {title}
              {underline !== "none" && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 h-[3px] w-14 bg-[var(--cedar)]",
                    underline === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
                  )}
                />
              )}
            </h1>
          )}
          {subtitle && (
            <p
              className={cn(
                "mt-4 max-w-2xl text-[15px] leading-relaxed text-[#666]",
                underline === "center" && "mx-auto text-center"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </>
  );
}
