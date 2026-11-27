import assert from "node:assert/strict";
import test from "node:test";
import {
  GOOGLE_ADS_ID_FALLBACK,
  GOOGLE_ADS_LEAD_LABEL_FALLBACK,
  googleAdsSendTo,
  resolveGoogleAdsId,
  resolveGoogleAdsLeadLabel,
} from "./google-ads.ts";

test("google ads uses the site tag when the env value is empty or invalid", () => {
  assert.equal(resolveGoogleAdsId(""), GOOGLE_ADS_ID_FALLBACK);
  assert.equal(resolveGoogleAdsId("645-830-8288"), GOOGLE_ADS_ID_FALLBACK);
  assert.equal(resolveGoogleAdsId("AW-18552742214"), "AW-18552742214");
  assert.equal(resolveGoogleAdsLeadLabel(""), GOOGLE_ADS_LEAD_LABEL_FALLBACK);
  assert.equal(resolveGoogleAdsLeadLabel("7Zc_CNnK48AdEMbC0Y5F"), "7Zc_CNnK48AdEMbC0Y5F");
  assert.equal(googleAdsSendTo(), "AW-18552742214/7Zc_CNnK48AdEMbC0Y5F");
});
