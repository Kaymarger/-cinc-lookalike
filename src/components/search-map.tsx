"use client";

import { useEffect, useMemo } from "react";
import {
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
}: {
  properties: Property[];
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
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
  }, [map, properties, selectedId]);

  return null;
}

export function SearchMap({
  properties,
  selectedId,
  onSelect,
}: {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    if (properties.length === 0) return [49.2827, -123.1207];
    const lat =
      properties.reduce((s, p) => s + p.lat, 0) / properties.length;
    const lng =
      properties.reduce((s, p) => s + p.lng, 0) / properties.length;
    return [lat, lng];
  }, [properties]);

  return (
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
      <FitBounds properties={properties} selectedId={selectedId} />
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
  );
}
