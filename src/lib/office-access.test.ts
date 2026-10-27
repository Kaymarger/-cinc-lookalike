import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageUsers,
  canReassignLeads,
  leadVisibleTo,
  sanitizeSavedSearch,
  seesAllLeads,
} from "./office-access.ts";

const admin = { id: "a", name: "Casey Archibald", role: "admin" as const };
const broker = { id: "b", name: "Kevin Barrett", role: "broker" as const };
const agent = { id: "g", name: "Kayla Gerak", role: "agent" as const };
const other = { id: "c", name: "Alex Chen", role: "agent" as const };
const isa = { id: "i", name: "Jordan Lee", role: "isa" as const };
const lender = { id: "l", name: "Pat Singh", role: "lender" as const };

test("admins and brokers see every lead", () => {
  assert.equal(seesAllLeads("admin"), true);
  assert.equal(seesAllLeads("broker"), true);
  assert.equal(leadVisibleTo(admin, { assignedTo: "Kayla Gerak" }), true);
  assert.equal(leadVisibleTo(broker, { assignedTo: "Unassigned" }), true);
  assert.equal(canManageUsers("broker"), true);
  assert.equal(canManageUsers("agent"), false);
  assert.equal(canReassignLeads("isa"), true);
  assert.equal(canReassignLeads("agent"), false);
  assert.equal(canReassignLeads("lender"), false);
});

test("agents only see leads assigned to them", () => {
  assert.equal(leadVisibleTo(agent, { assignedTo: "Kayla Gerak" }), true);
  assert.equal(leadVisibleTo(agent, { assignedTo: "kayla   gerak" }), true);
  assert.equal(leadVisibleTo(agent, { assignedUserId: "g", assignedTo: "Someone" }), true);
  assert.equal(leadVisibleTo(other, { assignedTo: "Kayla Gerak" }), false);
  assert.equal(leadVisibleTo(agent, { assignedTo: "Unassigned" }), false);
});

test("ISAs see their leads and the pond", () => {
  assert.equal(leadVisibleTo(isa, { assignedTo: "Jordan Lee" }), true);
  assert.equal(leadVisibleTo(isa, { assignedTo: "Unassigned" }), true);
  assert.equal(leadVisibleTo(isa, { assignedTo: "" }), true);
  assert.equal(leadVisibleTo(isa, { assignedTo: "Kayla Gerak" }), false);
});

test("lenders only see leads where they are the partner", () => {
  assert.equal(leadVisibleTo(lender, { partnerName: "Pat Singh", assignedTo: "Kayla Gerak" }), true);
  assert.equal(leadVisibleTo(lender, { partnerUserId: "l", assignedTo: "Kayla Gerak" }), true);
  assert.equal(leadVisibleTo(lender, { partnerName: "Unassigned", assignedTo: "Kayla Gerak" }), false);
  assert.equal(leadVisibleTo(lender, { assignedTo: "Pat Singh" }), false);
});

test("saved search criteria", () => {
  const ok = sanitizeSavedSearch({
    name: "Westside condos",
    city: "Vancouver",
    minPrice: "500000",
    maxPrice: "900,000",
    beds: "2",
    baths: "2",
    propertyType: "Condo",
    frequency: "Daily",
    leadEmail: "Jordan.Lee@Email.com",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.leadEmail, "jordan.lee@email.com");
    assert.equal(ok.value.maxPrice, 900000);
    assert.equal(ok.value.frequency, "Daily");
  }
  assert.equal(sanitizeSavedSearch({ name: "  ", frequency: "Daily" }).ok, false);
  assert.equal(sanitizeSavedSearch({ name: "X", frequency: "Hourly" }).ok, false);
  assert.equal(sanitizeSavedSearch({ name: "X", minPrice: "9", maxPrice: "1", frequency: "Weekly" }).ok, false);
});
