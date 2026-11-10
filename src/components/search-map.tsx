"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/lib/types";
import { propertyHref } from "@/lib/listing-url";
import { formatPrice } from "@/lib/search";
import "leaflet/dist/leaflet.css";

function priceIcon(price: number, selected: boolean) {
  const label =
    price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`
      : `$${Math.round(price / 1000)}K`;

  return L.divIcon({
    className: "",
    iconSize: [64, 28],
    iconAnchor: [32, 28],
    popupAnchor: [0, -24],
    html: `<div style="
      background:${selected ? "#04427d" : "#3498d8"};
      color:#fff;
      font:600 11px Lato,system-ui,sans-serif;
      padding:4px 8px;
      border-radius:4px;
      box-shadow:0 2px 8px rgba(4,66,125,.35);
      white-space:nowrap;
      border:2px solid #fff;
      text-align:center;
    ">${label}</div>`,
  });
}

function FitBounds({
  properties,
  selectedId,
  circle,
}: {
  properties: Property[];
  selectedId: string | null;
  circle?: { lat: number; lng: number; km: number } | null;
}) {
  const map = useMap();
  const fitted = useRef("");

  useEffect(() => {
    if (circle && !selectedId) {
      const key = `${circle.lat.toFixed(4)}:${circle.lng.toFixed(4)}:${circle.km}`;
      if (fitted.current === key) return;
      fitted.current = key;
      const bounds = L.latLng(circle.lat, circle.lng).toBounds(Math.max(circle.km, 0.4) * 2200);
      if (bounds.isValid()) map.fitBounds(bounds, { animate: true, padding: [28, 28] });
      return;
    }
    fitted.current = "";
    const withCoords = properties.filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lng) <= 180
    );
    if (withCoords.length === 0) return;
    if (selectedId) {
      const selected = withCoords.find((p) => p.id === selectedId);
      if (selected) {
        const currentZoom = map.getZoom();
        const nextZoom = Number.isFinite(currentZoom)
          ? Math.max(currentZoom, 13)
          : 13;
        map.flyTo([selected.lat, selected.lng], nextZoom, {
          duration: 0.6,
        });
        return;
      }
    }
    const bounds = L.latLngBounds(
      withCoords.map((p) => [p.lat, p.lng] as [number, number])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.18), { animate: true, maxZoom: 13 });
    }
  }, [map, properties, selectedId, circle]);

  return null;
}

export function SearchMap({
  properties,
  selectedId,
  onSelect,
  circle,
  onCircle,
}: {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  circle?: { lat: number; lng: number; km: number } | null;
  onCircle?: (circle: { lat: number; lng: number; km: number } | null) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    if (circle) return [circle.lat, circle.lng];
    if (properties.length === 0) return [49.2827, -123.1207];
    const lat =
      properties.reduce((s, p) => s + p.lat, 0) / properties.length;
    const lng =
      properties.reduce((s, p) => s + p.lng, 0) / properties.length;
    return [lat, lng];
  }, [properties, circle]);
  const [drawing, setDrawing] = useState(false);

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={center}
      zoom={11}
      className="h-full w-full rounded-sm [&_.leaflet-control-attribution]:text-[10px]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} selectedId={selectedId} circle={drawing ? null : circle} />
      <CircleDraw drawing={drawing} circle={circle ?? null} onCircle={(next) => { setDrawing(false); onCircle?.(next); }} />
      {properties
        .filter(
          (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
        )
        .map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={priceIcon(property.price, property.id === selectedId)}
          eventHandlers={{
            click: () => onSelect(property.id),
          }}
        >
          <Popup>
            <div className="min-w-[160px] font-[family-name:var(--font-sans)] text-sm">
              <p className="font-semibold text-[var(--cedar-deep)]">
                {formatPrice(property.price)}
              </p>
              <p className="mt-0.5 text-[var(--ink)]">{property.address}</p>
              <p className="text-xs text-[var(--ink-muted)]">
                {property.beds} bd · {property.baths} ba ·{" "}
                {property.sqft.toLocaleString()} sf
              </p>
              <a
                href={propertyHref(property)}
                className="mt-2 inline-block text-[var(--cedar)] hover:underline"
              >
                View details
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
      {onCircle ? (
        <div className="absolute top-3 right-3 z-[500] flex max-w-[240px] flex-col items-end gap-2">
          <button type="button" className="h-9 rounded bg-[#04427d] px-3 text-xs font-semibold text-white shadow" onClick={() => setDrawing((value) => !value)}>
            {drawing ? "Cancel circle" : "Draw circle"}
          </button>
          {circle ? (
            <button type="button" className="h-9 rounded bg-white px-3 text-xs font-semibold text-[#04427d] shadow" onClick={() => onCircle(null)}>
              Clear circle
            </button>
          ) : null}
          {drawing ? <p className="rounded bg-white/95 p-2 text-[11px] leading-snug text-[#243238] shadow">Press on the map and drag outward to draw. Drag the centre or the edge handle to edit.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

type MapCircle = { lat: number; lng: number; km: number };

function edgeOf(circle: MapCircle): [number, number] {
  const meters = Math.max(circle.km, 0.2) * 1000;
  const lat = circle.lat + meters / 111320;
  return [lat, circle.lng];
}

function handleIcon(label: string) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div data-circle-handle role="button" aria-label="${label}" style="width:32px;height:32px;border-radius:999px;border:3px solid #04427d;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  });
}

function CircleDraw({
  drawing,
  circle,
  onCircle,
}: {
  drawing: boolean;
  circle: MapCircle | null;
  onCircle?: (circle: MapCircle | null) => void;
}) {
  const map = useMap();
  const [draft, setDraft] = useState<MapCircle | null>(null);
  const onCircleRef = useRef(onCircle);
  useEffect(() => {
    onCircleRef.current = onCircle;
  }, [onCircle]);

  useEffect(() => {
    if (!drawing) return;
    const container = map.getContainer();
    map.dragging.disable();
    map.doubleClickZoom.disable();
    const previousTouchAction = container.style.touchAction;
    container.style.cursor = "crosshair";
    container.style.touchAction = "none";
    let start: L.LatLng | null = null;

    const pointFromClient = (clientX: number, clientY: number) => {
      const origin = container.getBoundingClientRect();
      return map.containerPointToLatLng(L.point(clientX - origin.left, clientY - origin.top));
    };
    const begin = (latlng: L.LatLng) => {
      start = latlng;
      setDraft({ lat: latlng.lat, lng: latlng.lng, km: 0.2 });
    };
    const moveTo = (latlng: L.LatLng) => {
      if (!start) return;
      setDraft({ lat: start.lat, lng: start.lng, km: Math.max(0.2, start.distanceTo(latlng) / 1000) });
    };
    const finish = (latlng: L.LatLng | null) => {
      if (!start) return;
      const origin = start;
      start = null;
      setDraft(null);
      if (!latlng) return;
      const km = Math.round((origin.distanceTo(latlng) / 1000) * 10) / 10;
      if (km < 0.3) return;
      onCircleRef.current?.({ lat: origin.lat, lng: origin.lng, km: Math.min(40, km) });
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-circle-handle], button, a, input")) return;
      event.preventDefault();
      event.stopPropagation();
      begin(pointFromClient(event.clientX, event.clientY));
      container.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!start) return;
      event.preventDefault();
      moveTo(pointFromClient(event.clientX, event.clientY));
    };
    const up = (event: PointerEvent) => {
      if (!start) return;
      finish(pointFromClient(event.clientX, event.clientY));
    };
    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", up);
    return () => {
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
      container.removeEventListener("pointercancel", up);
      map.dragging.enable();
      map.doubleClickZoom.enable();
      container.style.cursor = "";
      container.style.touchAction = previousTouchAction;
    };
  }, [drawing, map]);

  if (draft) {
    return (
      <Circle
        center={[draft.lat, draft.lng]}
        radius={draft.km * 1000}
        pathOptions={{ color: "#04427d", weight: 2, fillColor: "#04427d", fillOpacity: 0.12 }}
      />
    );
  }
  if (!circle || drawing) return null;
  return <CircleEditor circle={circle} onCircleRef={onCircleRef} />;
}

function CircleEditor({
  circle,
  onCircleRef,
}: {
  circle: MapCircle;
  onCircleRef: MutableRefObject<((circle: MapCircle | null) => void) | undefined>;
}) {
  const map = useMap();
  const { lat, lng, km } = circle;
  useEffect(() => {
    const shape = L.circle([lat, lng], {
      radius: km * 1000,
      color: "#04427d",
      weight: 2,
      fillColor: "#04427d",
      fillOpacity: 0.12,
    }).addTo(map);
    const center = L.marker([lat, lng], {
      draggable: true,
      icon: handleIcon("Move circle"),
      zIndexOffset: 800,
    }).addTo(map);
    const edge = L.marker(edgeOf({ lat, lng, km }), {
      draggable: true,
      icon: handleIcon("Resize circle"),
      zIndexOffset: 800,
    }).addTo(map);
    center.on("drag", () => {
      const next = center.getLatLng();
      shape.setLatLng(next);
      edge.setLatLng(edgeOf({ lat: next.lat, lng: next.lng, km: shape.getRadius() / 1000 }));
    });
    center.on("dragend", () => {
      const next = center.getLatLng();
      const km = Math.round((shape.getRadius() / 1000) * 10) / 10;
      onCircleRef.current?.({ lat: next.lat, lng: next.lng, km });
    });
    edge.on("drag", () => {
      const km = Math.max(0.3, shape.getLatLng().distanceTo(edge.getLatLng()) / 1000);
      shape.setRadius(km * 1000);
    });
    edge.on("dragend", () => {
      const next = shape.getLatLng();
      const km = Math.min(40, Math.max(0.3, Math.round((next.distanceTo(edge.getLatLng()) / 1000) * 10) / 10));
      onCircleRef.current?.({ lat: next.lat, lng: next.lng, km });
    });
    return () => {
      shape.remove();
      center.remove();
      edge.remove();
    };
  }, [lat, lng, km, map, onCircleRef]);
  return null;
}
