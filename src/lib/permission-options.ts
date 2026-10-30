import type { OfficeRole } from "./office-access";

export const PERMISSION_COLUMNS: {
  name: "Editing" | "Features" | "Permissions" | "User";
  items: [key: string, label: string, tip: string][];
}[] = [
  {
    name: "Editing",
    items: [
      ["editLabels", "Edit Labels", "Allows a user to edit labels (remove and change name)."],
      ["editNotes", "Edit Notes", "Allows a user to edit notes on a lead."],
      ["editSource", "Edit Source", "Allows a user to change a lead's source."],
      ["editSellerSuite", "Edit Seller Suite", "Allows access to the seller suite."],
      ["editTasks", "Edit Tasks", "Check this to allow this agent to complete or delete tasks/reminders that are not assigned to them."],
    ],
  },
  {
    name: "Features",
    items: [
      ["advancedImport", "Advanced Import", "Allows access to the import option within the leads page."],
      ["autoTracks", "AutoTracks", "Allows this user to use AutoTracks."],
      ["behavioralMessaging", "Behavioral Messaging", "Allows this user to use behavioral messaging."],
      ["blogging", "Blogging", "Allows this user to blog on the website."],
      ["plans", "Plans", "Allows this user to use plans including templates, live plans and to be assigned within a plan."],
      ["prolinc", "PROLINC", "Allows this user to send referral leads to PROLINC."],
      ["remarketing", "Remarketing", "Allows this user to use remarketing."],
      ["videoMessaging", "Video Messaging", "Allows this user to record and send video text and email messages."],
    ],
  },
  {
    name: "Permissions",
    items: [
      ["assignFromPond", "Assign From Pond", "Allows a user to assign leads out of a pond to themself."],
      ["autoAssignEligible", "Auto-Assign Eligible", "Allows this user to receive auto-assigned leads."],
      ["canAssign", "Can Assign", "Allows a user to assign leads to another agent."],
      ["exportLeads", "Export Leads", "Allows a user to export leads."],
      ["featureProperties", "Feature Properties", "Allows a user to feature or not feature a listing for the website."],
      ["reminderNotify", "Reminder Notify", "Allows this user to be notified about reminders."],
      ["seeAgentNotes", "See Agent Notes", "Will load all notes for a lead, including those not made by the logged in user."],
    ],
  },
  {
    name: "User",
    items: [
      ["featuredAgent", "Featured Agent", "Designate this agent as a dedicated Fish Pond account."],
      ["listingAgent", "Listing Agent", "Gives this user listing agent capabilities including assignment."],
      ["teamLeader", "Team Leader", "Elevated agent privileges, allows the user to see all leads and access telecom registration."],
    ],
  },
];

export const PERMISSION_OPTIONS = PERMISSION_COLUMNS.flatMap((column) => column.items.map(([key, label]) => [key, label] as const));

export type PermissionKey = (typeof PERMISSION_OPTIONS)[number][0];
export type OfficePermissions = Record<PermissionKey, boolean>;

export function defaultPermissions(role: OfficeRole): OfficePermissions {
  const office = role === "admin" || role === "broker";
  return {
    editLabels: true,
    editNotes: true,
    editSource: true,
    editSellerSuite: office,
    editTasks: office,
    advancedImport: office,
    autoTracks: role !== "lender",
    behavioralMessaging: role !== "lender",
    blogging: office,
    plans: role !== "lender",
    prolinc: office,
    remarketing: office,
    videoMessaging: office,
    assignFromPond: role !== "lender",
    autoAssignEligible: role !== "lender",
    canAssign: office || role === "isa",
    exportLeads: office,
    featureProperties: office,
    reminderNotify: true,
    seeAgentNotes: true,
    featuredAgent: false,
    listingAgent: role === "agent" ? false : office,
    teamLeader: office,
  };
}
