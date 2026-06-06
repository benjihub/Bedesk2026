# UI Changes Guide

This guide explains how the milestone-related UI works and how to work with it without needing to think about the backend first.

## What Changed

- A milestone panel was added to the conversation sidebar.
- A milestone report page was added in the dashboard reports area.
- A shared query was added so the UI can load milestone data consistently.
- A new report filter and export flow were added.

## Sidebar Flow

The conversation sidebar now includes a milestone section for ticket conversations.

That section is only shown when the user has reporting access and the conversation is a ticket.

Inside the panel, the UI shows:

- time to first reply
- total resolution time
- agents involved
- handling duration per agent
- a timeline of milestone events

The panel first shows a loading spinner, then either an empty state or the actual milestone data.

## Report Page Flow

The milestone report page lives inside the reports area of the dashboard.

It lets the user:

- filter by event type
- filter by agent ID
- filter by group ID
- choose a date range
- export the results as CSV or JSONL

The page is built with the same report shell used by the other dashboard reports, so it should feel consistent with the rest of the app.

## Shared Data Flow

The UI reads milestone data through a shared query helper.

That matters because it keeps the sidebar and the report page aligned on the same data shape and request style.

If the backend response changes, the shared type definitions should be updated first so both UI surfaces stay in sync.

## How To Change The UI

### Change The Sidebar Copy

Update the milestone panel when you want to change:

- labels
- empty-state text
- metric names
- timeline text

### Change The Timeline Appearance

Update the milestone panel when you want to change:

- spacing
- typography
- ordering
- visual emphasis for the newest item

### Add A New Filter

Update the report page when you want to add more filters.

Then make sure the backend understands the same filter name and value.

### Change The Export Behavior

Update the report page when you want to change:

- export format
- default export scope
- which filters are included in the download

### Add A New Query

Use the shared query layer when you need another milestone-related UI request.

That keeps request behavior consistent and makes future maintenance easier.

## Permission Rule

The milestone sidebar is treated as reporting UI and should stay behind reporting access.

If you ever want to show it to more or fewer users, adjust the permission check in the sidebar logic.

