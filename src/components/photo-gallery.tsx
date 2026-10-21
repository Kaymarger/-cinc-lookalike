"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";
import { LeadDialog } from "@/components/lead-dialog";
import { cn } from "@/lib/utils";

const DetailMap = dynamic(
  () => import("@/components/detail-map").then((m) => m.DetailMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-[var(--mist)] text-sm text-[#666]">
        Loading map…
      </div>
    ),
  }
);

export function PhotoGallery({
  images,
  alt,
  virtualTour,
  propertyAddress,
  propertyId,
  lat,
  lng,
}: {
  images: string[];
  alt: string;
  virtualTour?: boolean;
  propertyAddress?: string;
  propertyId?: string;
  lat?: number;
  lng?: number;
}) {
  const [tab, setTab] = useState<"photos" | "map">("photos");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const [gate, setGate] = useState(false);
  const unlockedRef = useRef(false);

  const unlockGallery = useCallback(() => {
    unlockedRef.current = true;
    setGate(false);
  }, []);

  const openAt = (i: number) => {
    setIndex(i);
    setSeen(new Set([i]));
    setGate(false);
    setOpen(true);
  };

  const markSeen = useCallback((i: number) => {
    setSeen((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      // Softer gate: only after browsing more of the gallery
      if (!unlockedRef.current && next.size >= 6) setGate(true);
      return next;
    });
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => {
      const n = (i - 1 + images.length) % images.length;
      markSeen(n);
      return n;
    });
  }, [images.length, markSeen]);

  const next = useCallback(() => {
    setIndex((i) => {
      const n = (i + 1) % images.length;
      markSeen(n);
      return n;
    });
  }, [images.length, markSeen]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (gate) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, prev, next, gate]);

  const thumbs = images.slice(0, 3);
  const hasMap = lat != null && lng != null;

  return (
    <>
      {hasMap && (
        <div
          id="gallerypreview_tabbuttonswrapper"
          className="mb-3 inline-flex border border-[#ddd]"
        >
          <button
            type="button"
            id="gallerypreview_imgsbtn"
            onClick={() => setTab("photos")}
            className={cn(
              "h-9 px-4 text-sm font-medium",
              tab === "photos"
                ? "bg-[var(--cedar)] text-white"
                : "bg-white text-[#333] hover:bg-[#f5f5f5]"
            )}
          >
            Photos
          </button>
          <button
            type="button"
            id="gallerypreview_mapbtn"
            onClick={() => setTab("map")}
            className={cn(
              "h-9 px-4 text-sm font-medium",
              tab === "map"
                ? "bg-[var(--cedar)] text-white"
                : "bg-white text-[#333] hover:bg-[#f5f5f5]"
            )}
          >
            Map
          </button>
        </div>
      )}

      {tab === "map" && hasMap ? (
        <div
          id="gallerypreview_main"
          className="h-[min(420px,55vh)] overflow-hidden border border-[#e5e5e5] bg-[var(--mist)]"
        >
          <DetailMap lat={lat} lng={lng} label={alt} />
        </div>
      ) : (
      <>
      {/* Mobile swipe strip */}
      <div className="md:hidden">
        <div
          id="gallerypreview_imgspreviewmobile"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.slice(0, Math.min(images.length, 8)).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-[4/3] w-[86%] shrink-0 snap-center overflow-hidden rounded-2xl bg-[var(--mist)] first:ml-0"
            >
              <Image
                src={src}
                alt={`${alt} photo ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="86vw"
              />
              {i === 0 && virtualTour && (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                  <PlayCircle className="size-3.5" />
                  Virtual tour
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAt(0)}
          className="mt-3 inline-flex h-10 items-center rounded-full border border-[#d7e0e8] px-4 text-sm font-semibold text-[var(--cedar-deep)]"
        >
          View all {images.length} photos
        </button>
      </div>

      <div
        id="gallerypreview_imgspreviewdesktop"
        className="hidden gap-3 md:grid md:grid-cols-3 md:grid-rows-2"
      >
        <button
          type="button"
          id="gallerypreview_img1"
          onClick={() => openAt(0)}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--mist)] text-left md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[420px]"
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            priority
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          {virtualTour && (
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-sm text-white">
              <PlayCircle className="size-4" />
              Virtual tour available
            </span>
          )}
          <span className="absolute right-4 bottom-4 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
            View {images.length} photos
          </span>
        </button>
        {thumbs.slice(1).map((src, i) => (
          <button
            key={src}
            type="button"
            id={i === 0 ? "gallerypreview_img2" : "gallerypreview_img3"}
            onClick={() => openAt(i + 1)}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--mist)]"
          >
            <Image
              src={src}
              alt={`${alt} photo ${i + 2}`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              sizes="33vw"
            />
          </button>
        ))}
      </div>
      </>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          className="fixed inset-0 z-[100] flex flex-col bg-black/92"
          onClick={(e) => {
            if (gate) return;
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm">
              {index + 1} / {images.length}
            </p>
            <button
              type="button"
              aria-label="Close gallery"
              className="inline-flex size-10 items-center justify-center rounded-sm hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-2 pb-6 sm:px-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Previous photo"
              onClick={prev}
              disabled={gate}
              className="absolute left-1 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 sm:left-3"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative h-full w-full max-w-5xl">
              <Image
                src={images[index]}
                alt={`${alt} photo ${index + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <button
              type="button"
              aria-label="Next photo"
              onClick={next}
              disabled={gate}
              className="absolute right-1 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 sm:right-3"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          <div
            className="flex gap-2 overflow-x-auto px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                disabled={gate}
                onClick={() => {
                  setIndex(i);
                  markSeen(i);
                }}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border-2 disabled:opacity-40",
                  i === index
                    ? "border-[var(--cedar)]"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>

          {gate && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className="w-full max-w-md border border-white/20 bg-white p-6 text-center shadow-xl"
                role="alertdialog"
                aria-labelledby="photo-gate-title"
                aria-describedby="photo-gate-desc"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
                  Still browsing?
                </p>
                <h3
                  id="photo-gate-title"
                  className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--cedar-deep)]"
                >
                  Want help with this home?
                </h3>
                <p
                  id="photo-gate-desc"
                  className="mt-2 text-sm text-[var(--ink-muted)]"
                >
                  Optionally leave your email, or skip and keep viewing every
                  photo.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <LeadDialog
                    triggerLabel="Register & continue"
                    propertyAddress={propertyAddress ?? alt}
                    propertyId={propertyId}
                    source="photo_gate"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      unlockGallery();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="relative z-10 h-10 text-sm font-medium text-[var(--ink-muted)] underline-offset-2 hover:text-[var(--cedar)] hover:underline"
                  >
                    Skip for this demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
