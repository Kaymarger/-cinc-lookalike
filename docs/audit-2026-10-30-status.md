# Audit 2026-10-30 status

Each line from the October 30 CINC vs replica audit. Checked means the replica now matches the described CINC behavior, or the seeded/demo copy that caused the difference is gone.

## Global / top bar / sidebar

- [x] Top bar shows Get Leads, Help, and a consistent CA region control. End Become User appears only while actually viewing as another user.
- [x] The database status line is not shown above the lead list.
- [x] Website in the sidebar opens the Page Editor at `/dashboard/pages/home`.
- [x] Contacts uses `#contacts/vendor` and `#contacts/contact`. Automations uses `#automations`.
- [x] The activity rail is hidden on Website and Settings. Other pages say "No new activities" instead of a seeded feed.

## Launchpad

- [x] The header title is the Agent Launchpad menu (Agent, Broker, Call Summary).
- [x] Broker Launchpad shows office totals, not a placeholder.
- [x] Clicking sidebar Agent returns the launchpad to Contact Requested.
- [x] Call Summary keeps Agent, Last Login, Call Logs, Calls, and Voicemails. The original audit did not open CINC's dialer summary.
- [x] Today's appointment count is a calendar link, with singular or plural wording.
- [x] Lead Reminders uses a Due select, not a flat list of every range.
- [x] Deal Reminders empty state says "You're all caught up on your Reminders! Keep up the good work."

## Deals

- [x] Assigned Agent filter sits with Status, Created, and Sort By.
- [x] The button reads Add Deal. An empty Under Contract column is the board when no deal is in that stage.

## Contacts

- [x] The title field placeholder is "Replace with title". The add tile reads "• N ADD VENDOR". Cards show a phone when one is saved.

## Communications

- [x] Seeded "Lead sample N" inbox, sent, draft, and trash rows are gone. The count is this office's stored mail.
- [ ] The count is not CINC's production mailbox of 4,489 conversations. Those messages are not in this office.
- [x] The inbox toolbar is Filters, New Email, and New Text. A reply box is on an open message. New Text asks for a recipient when none is known.

## Calendar

- [x] Month view has weekday headers, month title, previous and next, agenda/week/month/day, a mini calendar, CINC Calendars, and Event Calendars.
- [x] Today is highlighted in America/Vancouver. October 30, 2026 is the highlighted day for that date.
- [x] A day opens an appointment dialog. Week and day views are separate from the month grid.

## Automations

- [x] Cards show name, duration, privacy, owner, status, and email stats. Opening the builder shows the detail fields.
- [x] Tracks are grouped into General, Buyer, Listing, Nurture, Past Client, and My AutoTracks.
- [x] Step 1 filters Blank, My Templates, CINC Templates, and Type, and the keyword search changes the list. Browse more Templates is present.
- [x] Communication time offers the two weekday ranges. Email steps list the captured template names and have the gear, merge, and emoji controls.
- [x] "There must be at least 1 step..." is an alert on the step, not only a toast.
- [x] With a New Lead is checked and disabled. Source is a type-ahead of the lead-source list. Apply a Label and Can Copy / Can Edit / Is Owner are on the settings step.
- [x] Review still ends with Activate. Save as Draft remains so a draft can be stored.
- [x] Behavioral Messaging and CINC AI pages remain.

## Properties

- [x] Listings Dashboard is the first Properties sub-item.
- [x] The listing filter includes All MLS Listings, My Office/Agents Listings, Listed in the past 24 hours, Featured Listings, and agent names, plus Mass Actions.
- [x] Feature and Actions stay on one line. Send Message carries the listing address.
- [x] Text Responder is not covered by the expired-password banner.

## Website

- [x] Page Editor, Seller Suite, Landing Pages, and Theme Options are in the Website menu. `/dashboard/pages/home` opens the editor.
- [x] Landing pages keep Title, Leads, Unique Views, Conversion, Edit, and Remove.

## Lead profile

- [x] A lead name opens Activity.
- [x] The rail is Call, Dialer, Text, Email, and More. Etta is not on the rail.
- [x] Activity has Filters and Subscriptions. Filters open as a popover.
- [x] The phone menu is Call Lead and Text Lead.
- [x] Email, text, and call say they are not connected, without provider key names. A failed email stays open and does not increase the email count.
- [x] Attachments show the chosen file. Preview shows the typed message. Bullet and number lists have menus and render as lists.
- [x] The emoji menu is a full grid. Video uses a dialog, not a browser prompt.
- [x] Refer Lead to PROLINC opens a referral dialog.
- [x] A reminder uses the Name field, the chosen Notify person, and the chosen time.
- [x] An appointment requires a title and a date, and the saved time is a readable date.
- [x] Add AutoTrack lists the 21 captured tracks. A new enrollment is not labeled with a stale October 18 start from another track.
- [x] Pause switches the menu to Resume. Delete asks before it removes a vendor; AutoTrack delete removes the card and the total.
- [x] Location chips are not duplicated. Enter on typed text adds a chip. Generate Link shows the URL. The saved line uses city, beds, baths, and price. A blank "New Search" row is not listed, and + Saved Search hides once a real search exists.
- [x] A map button sits beside Location + Keyword Search.
- [ ] The saved-search editor is still a wide dialog. CINC uses a full page with the same fields.
- [x] Changing pipeline shows today's date on the pipeline control.
- [x] A saved deal shows price as well as the address.

## Leads list

- [x] Toolbar includes select-all, Mass Actions, Clear All, refresh, both filters, save-filter, columns, a trash icon, a print icon, view, page size, and pager arrows. Add New Lead stays blue with a person icon. There is no database status line.
- [x] Pipeline is an outlined uppercase badge. Assigned names are uppercase on their own lines. Activity reads N Views, N Saved, N Fav, and N Inq.
- [x] Headers are light, centered, and do not wrap Registered or Last Touch.
- [x] CINC Filter and Custom Filter keep the captured lists.
- [x] Mass Actions keeps the captured actions. Trash asks before it trashes.
- [x] Name/Info and Registered sort the rows.
- [x] Add New Lead rejects an empty form, a bad email, and a short phone.

## Agents / settings / marketing / help

- [x] The extra Add User button is gone. Become User is solid blue. Disable is red. Roles read Broker, Agent, or (Pond Account) Agent.
- [ ] The agent list is the people stored for this office. CINC's other accounts are not in this database, so the card count is not nine.
- [x] Edit Permissions still persists. Hover titles were not part of the captured permission copy.
- [x] Lead routing copy describes who receives new site leads.
- [x] General settings title is General Settings. The page is served at `/dashboard/settings`.
- [x] Search and Dialer are forms with Update, not placeholder paragraphs.
- [x] Notifications starts with Master Settings > Subscription (CINCAgent, Email, Text) and an Update button. The pond heading is not the first block.
- [x] Marketing has a target-areas pie, will not move into a future month, collapses the disclaimer, and Export All is a menu.
- [x] Help opens Help Center, Contact Support, and What's New. The demo help paragraph is gone.
- [x] The CA control does not flip between QA and KG. Plans is not in that menu.
- [x] The header search opens a search field.
- [x] Public footer copy no longer calls the site a demo.

## Cleanup

- [x] Zztest Auditlead was deleted from the office database.
- [x] QA Vendor was not present.
- [x] Blank Template Copy remains only as captured track `cinc-13`.

## Still open

2 items: the production conversation count of 4,489, and CINC's extra agent accounts that are not in this office.
