# AI Agent User Guide

Date: 2026-06-22

This guide explains how to use the AI Agent module in the dashboard:

- Status: monitor whether AI is connected to an active widget conversation
- Agents: create and manage AI agents
- Settings: configure behavior per group (or Global)
- Chat Test: test behavior safely in preview mode

## 1. Overview

AI Agent helps you automate first responses and common flows in Live Chat. You can:

- configure the AI personality and greeting
- control how AI transfers to a human
- define what AI should do when it cannot assist
- test behavior in preview mode before going live

## 2. Navigation

Open the dashboard and go to: **AI Agent**

Tabs:

- Status
- Agents
- Settings
- Chat Test

## 3. Status (Live Status)

Use **Status** to monitor each AI agent and see whether it is currently connected.

### 3.1 What “Connected” means

An AI agent is **Connected** when it is enabled and there is an **active widget conversation** being served by AI for that agent’s group.

If the agent is enabled but there is no active widget conversation, it will show **Disconnected** with detail like “No active widget conversation”.

### 3.2 Summary cards

- Connected: number of agents currently serving an active widget conversation
- Disconnected: agents paused or not currently serving a widget conversation
- Average response time: average time across recent runs (if available)
- Token usage: token usage across recent runs (if available)

### 3.3 Agent cards

Each agent card shows:

- status badge (Connected / Disconnected / Error)
- status detail
- last activity timestamp
- basic metrics (Requests, Success, Response, Tokens)
- Reconnect button (for disconnected/error agents)

Screenshot: Status page (Figure 1)

## 4. Agents (Create and Manage)

Use **Agents** to manage AI agents in the system.

### 4.1 Create a new AI Agent

1. Go to **AI Agent > Agents**
2. Click **Add AI Agent**
3. Enter the agent name and assign a group if applicable
4. Save

### 4.2 Edit an AI Agent

1. In the agents list, click the edit (pencil) icon
2. Update the fields you need
3. Save

### 4.3 Delete an AI Agent

1. In the agents list, click the delete (trash) icon
2. Confirm

Screenshot: Agents list (Figure 2)

## 5. Settings (Behavior Configuration)

Use **Settings** to configure how the AI behaves. Settings can be **Global** or **Group-specific**.

### 5.1 Group scope selector

At the top of the page, select:

- Global: default settings used when no group override exists
- A specific group: overrides for that group

### 5.2 Identity

Configure:

- Name: what customers see in the widget
- Avatar: the agent image

### 5.3 Personality

Select a personality to control tone of voice (Friendly, Neutral, Professional, Humorous).

### 5.4 Start of the conversation (Greeting)

Choose how conversations start:

- Basic greeting: send a greeting message and show flow buttons
- Flow: start with a specific flow

### 5.5 If AI agent is unable to assist user

Set an optional instruction for what AI should say when it cannot help.

### 5.6 Transfer to human

Control what happens when a user asks for a human:

- Basic transfer: transfer/queue automatically
- Custom instruction: AI responds with a specific message instead

### 5.7 Saving changes

Each panel has **Save** and **Cancel** buttons.

Screenshot: Settings page (Figure 3)

## 6. Chat Test (Preview Mode)

Use **Chat Test** to test behavior without touching the live inbox flow.

### 6.1 Choose an AI Agent

1. Open **AI Agent > Chat Test**
2. In “Choose an AI agent”, click an agent card
3. The group configuration for that agent is loaded into the preview test

### 6.2 Preview sidebar

The preview shows:

- the widget chat UI
- a test message input
- a **Reset test** button to start a clean conversation

### 6.3 Recommended test pass

Run these quick checks per group:

- Greeting and first response
- Basic conversation routing
- Transfer to human behavior
- Fallback behavior when AI cannot assist

Screenshot: Chat Test page (Figure 4)

## 7. Troubleshooting

### 7.1 Agent shows Disconnected but AI is enabled

This is expected if there is no active widget conversation currently being served by AI for that group.

To confirm, open the widget for that group and start a conversation.

### 7.2 Settings changes do not appear

Common causes:

- wrong group selected in the scope selector
- panel not saved (Save button not clicked)

Try:

- re-open the panel
- click Save again
- refresh the page

### 7.3 Chat Test preview not responding

Try:

- click **Reset test**
- close and reopen the preview
- confirm the agent is enabled

## 8. Permissions

To manage AI agents you need the appropriate permissions (for example `ai_agent.update` and `ai_agent.settings.update`).

