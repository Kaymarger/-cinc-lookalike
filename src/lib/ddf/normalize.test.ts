import assert from "node:assert/strict";
import test from "node:test";
import { safeDdfError } from "./credentials.ts";
import { isBritishColumbia, listingFromOData, listingFromRetsXml } from "./normalize.ts";

test("oauth records keep feed text and drop other provinces", () => {
  assert.equal(isBritishColumbia({ StateOrProvince: "ON" }), false);
  const listing = listingFromOData({
    ListingKey: "123",
    ListingId: "R999",
    ListPrice: 850000,
    UnparsedAddress: "10 Main Street",
    City: "Victoria",
    StateOrProvince: "BC",
    PostalCode: "V8W 1A1",
    BedroomsTotal: 3,
    BathroomsTotalInteger: 2,
    LivingArea: 1400,
    PropertySubType: "Single Family",
    PublicRemarks: "Sunny kitchen. Do not rewrite this.",
    ListOfficeName: "Harbour Realty",
    ListingURL: "https://www.realtor.ca/real-estate/123/10-main",
    Media: [{ MediaURL: "https://ddfcdn.realtor.ca/a.jpg", Order: 1 }],
  });
  assert.ok(listing);
  assert.equal(listing?.remarks, "Sunny kitchen. Do not rewrite this.");
  assert.equal(listing?.brokerage, "Harbour Realty");
  assert.equal(listing?.realtorUrl, "https://www.realtor.ca/real-estate/123/10-main");
  assert.equal(listing?.photos[0]?.url, "https://ddfcdn.realtor.ca/a.jpg");
  assert.equal(listingFromOData({ ListingKey: "9", UnparsedAddress: "1 King", StateOrProvince: "AB" }), null);
});

test("rets xml keeps the more information link", () => {
  const xml = `
    <PropertyDetails>
      <ID>55</ID>
      <ListingID>C55</ListingID>
      <Price>640000</Price>
      <Address>4 Oak Ave</Address>
      <City>Kelowna</City>
      <Province>BC</Province>
      <PublicRemarks>Original remarks</PublicRemarks>
      <MoreInformationLink>https://www.realtor.ca/real-estate/55</MoreInformationLink>
      <PhotoURL>https://ddfcdn.realtor.ca/b.jpg</PhotoURL>
    </PropertyDetails>`;
  const listing = listingFromRetsXml(xml);
  assert.equal(listing?.city, "Kelowna");
  assert.equal(listing?.remarks, "Original remarks");
  assert.equal(listing?.realtorUrl, "https://www.realtor.ca/real-estate/55");
});

test("errors never include the feed password", () => {
  const message = safeDdfError(401, "invalid client_secret=super-secret-value");
  assert.equal(message.includes("super-secret-value"), false);
  assert.match(message, /DDF HTTP 401/);
});
