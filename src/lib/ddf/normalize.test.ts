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

test("neighbourhood, video, floor plan, and open house stay with the listing", () => {
  const listing = listingFromOData({
    ListingKey: "77",
    ListingId: "R77",
    ListPrice: 1200000,
    UnparsedAddress: "2200 York Avenue",
    City: "Vancouver",
    StateOrProvince: "BC",
    CityRegion: "Kitsilano",
    PublicRemarks: "Near the beach.",
    Media: [
      { MediaURL: "https://ddfcdn.realtor.ca/kit.jpg", MediaCategory: "Photo", Order: 1 },
      { MediaURL: "https://www.youtube.com/watch?v=abc", MediaCategory: "Video", Order: 2 },
      { MediaURL: "https://ddfcdn.realtor.ca/kit-plan.pdf", MediaCategory: "Floor Plan", Order: 3 },
      { MediaURL: "https://my.matterport.com/show/?m=abc", MediaCategory: "Unbranded Virtual Tour", Order: 4 },
    ],
    OpenHouse: [
      {
        OpenHouseDate: "2099-06-01",
        OpenHouseStartTime: "13:00",
        OpenHouseEndTime: "15:00",
        OpenHouseRemarks: "Please remove shoes.",
      },
    ],
  });
  assert.equal(listing?.neighbourhood, "Kitsilano");
  assert.equal(listing?.photos.length, 1);
  assert.equal(listing?.videoUrl, "https://www.youtube.com/watch?v=abc");
  assert.equal(listing?.floorPlans[0]?.url, "https://ddfcdn.realtor.ca/kit-plan.pdf");
  assert.match(listing?.virtualTourUrl || "", /matterport/);
  assert.equal(listing?.openHouses[0]?.date, "2099-06-01");
  assert.equal(listing?.openHouses[0]?.start, "13:00");
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
