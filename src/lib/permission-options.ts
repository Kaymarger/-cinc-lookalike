import type { OfficeRole } from "./office-access";

export const PERMISSION_OPTIONS = [
  ["viewAllLeads", "View all leads"],
  ["reassignLeads", "Reassign leads"],
  ["exportLeads", "Export leads"],
  ["deleteLeads", "Delete leads"],
  ["editOthersLeads", "Edit other agents' leads"],
  ["accessDialer", "Access the dialer"],
  ["sendEmail", "Send email"],
  ["sendText", "Send text"],
  ["manageUsers", "Manage users"],
  ["manageWebsite", "Manage the website"],
] as const;

export type PermissionKey = (typeof PERMISSION_OPTIONS)[number][0];
export type OfficePermissions = Record<PermissionKey, boolean>;

export function defaultPermissions(role: OfficeRole): OfficePermissions {
  const office = role === "admin" || role === "broker";
  return {
    viewAllLeads: office,
    reassignLeads: office || role === "isa",
    exportLeads: office || role === "agent" || role === "isa",
    deleteLeads: office,
    editOthersLeads: office,
    accessDialer: role !== "lender",
    sendEmail: true,
    sendText: true,
    manageUsers: office,
    manageWebsite: office,
  };
}
