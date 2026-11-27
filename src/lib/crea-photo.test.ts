import assert from "node:assert/strict";
import test from "node:test";
import { creaPhotoUrl } from "./crea-photo.ts";

test("crea photo urls use the CDN size folder and leave other urls alone", () => {
  const high = "https://ddfcdn.realtor.ca/listing/abc/reb6/highres/1/R1_1.jpg";
  assert.equal(creaPhotoUrl(high, "med"), "https://ddfcdn.realtor.ca/listing/abc/reb6/medres/1/R1_1.jpg");
  assert.equal(creaPhotoUrl(high, "high"), high);
  assert.equal(creaPhotoUrl("https://example.com/photo.jpg", "med"), "https://example.com/photo.jpg");
});
