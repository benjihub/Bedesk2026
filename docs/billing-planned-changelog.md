# Billing Planned Changelog

This document captures the planned billing additions for the Livechat platform. It is written as a planning changelog so the implementation team can see what will be added, what behavior has already been agreed, and what details still need final confirmation.

## Planned Release: Billing V1

### Summary

Billing V1 will introduce account/company-level subscriptions, customer-facing billing visibility, crypto payments for upgrades/top-ups, admin payment confirmation, AI reply usage limits, billing notifications, and fixed AI pricing plans.

The first version is focused on AI Agent reply usage. Broader limits such as agents, groups, campaigns, storage, and social accounts can be added later, but the agreed V1 priority is AI reply quota tracking and enforcement.

### Core Billing Model

- Each account/company will have exactly one active billing plan.
- Top-ups are separate credit purchases attached to the same account/company.
- Top-ups do not replace the active plan.
- Billing is account/company scoped, not per individual agent.
- Customers/account admins will be able to view billing status and usage.
- Global admins will manage plans, account subscriptions, crypto payment confirmations, and billing corrections.

### Pricing Plans

The following AI plans are planned for V1:

| Plan         |        Monthly Price | Included AI Reply Credits |
| ------------ | -------------------: | ------------------------: |
| Economy      |   Rp 750,000 / month |                     7,500 |
| Basic        | Rp 2,500,000 / month |                    30,000 |
| Premium      | Rp 4,000,000 / month |                    90,000 |
| Professional | Rp 8,000,000 / month |                   300,000 |

Notes:

- The UI should call these "AI Reply Credits" or "AI Replies" rather than technical LLM tokens.
- One successful AI Agent response/chat bubble consumes one AI Reply Credit.
- Failed, empty, cancelled, or errored AI attempts do not consume credits.

### Top-Up Additions

Billing V1 will support top-up credit purchases.

Top-up package:

| Top-Up                 |        Price | Credits |
| ---------------------- | -----------: | ------: |
| AI Reply Credit Top-Up | Rp 2,000,000 |  60,000 |

Agreed behavior:

- Monthly plan quota is consumed first.
- Top-up credits are consumed only after monthly plan quota is fully used.
- Top-up credits expire 24 hours after activation.
- Unused monthly plan credits do not roll over to the next month.
- Customers may use top-up credits only while they are valid.
- AI stops replying when both the monthly quota and valid top-up credits are exhausted.

Still to confirm:

- Whether multiple active top-ups should be consumed oldest-first. Recommended: oldest expiring top-up first.

### Usage Display

The customer billing page should clearly show plan usage and top-up usage.

Required display examples:

```text
AI Reply Usage: 2,340 / 7,500
```

When top-up exists:

```text
Monthly AI Replies: 7,500 / 7,500 used
Top-Up Credits: 12,000 / 60,000 used
Total Remaining: 48,000
```

The billing page should include:

- Current plan name.
- Monthly price.
- Billing cycle dates.
- Renewal date.
- Current AI reply usage.
- Usage progress bar.
- Remaining included monthly credits.
- Top-up credit balance.
- Top-up expiry date.
- Current account status.
- Pending invoices or payment requests.
- Payment history.
- Notifications related to quota and billing.

### Usage Counting Rules

Only successful AI Agent responses count as usage.

A response counts when:

- The AI Agent successfully generates a reply.
- The reply is sent into the conversation as a visible AI message/chat bubble.

A response does not count when:

- The AI request fails.
- The response is empty.
- The response is cancelled before sending.
- The AI Agent is blocked before generating due to quota.
- The human agent replies manually.

### Quota Enforcement

The quota consumption order is:

1. Monthly plan AI reply credits.
2. Valid top-up AI reply credits.
3. Stop AI Agent replies when both are exhausted.

Agreed behavior:

- AI should stop immediately after monthly quota and valid top-up credits are exhausted.
- Existing chats remain open.
- Human agents can continue replying.
- Visitors should not lose access to the conversation because AI quota is exhausted.
- The system should block only AI Agent automatic replies, not the entire chat system.

Recommended messages:

- Account admin: "AI reply quota reached. Upgrade your plan or buy a top-up to continue AI replies."
- Normal agent: "AI reply quota reached. Contact your account admin."
- Visitor/customer: no billing-specific message unless the product owner wants one; the chat can continue with human support.

### Crypto Payment Flow

V1 will use a self-custody USDT TRC20 payment watcher for plan upgrades, monthly plan payments, and top-up purchases.

The implementation creates an internal payment request, shows the configured USDT TRC20 wallet address and QR code, accepts a customer-submitted TRON transaction hash, and verifies the transaction against the TRON API. Plans and top-ups activate only after the backend verifies the transaction.

Agreed behavior:

- Customers do not upload payment proof inside the app.
- The customer can request a plan or top-up.
- The system creates an internal pending crypto payment request.
- All crypto payments must use the TRC/TRC20 network.
- IDR plan/top-up prices are converted to crypto at request time using a configurable exchange-rate API.
- Payment requests stay valid for 24 hours.
- After submitting the request, customers see the wallet address, amount, TRC20 label, and QR code.
- Customer pays USDT TRC20 from their wallet/exchange.
- Customer submits the TRON transaction hash in the billing page.
- Backend verifies the transaction on TRON.
- Once the transaction is confirmed as a valid USDT TRC20 transfer to our wallet for enough amount, the system activates the plan or adds top-up credits automatically.

Planned flow:

1. Customer/account admin selects or requests a plan/top-up.
2. System creates a pending billing request or invoice.
3. Backend converts IDR price to expected USDT amount using the configured exchange-rate API.
4. Backend stores wallet address, expected amount, TRC20 network, expiry, and verification status.
5. Customer sees the wallet address and QR code.
6. Customer sends USDT on TRC20.
7. Customer submits the TRON transaction hash.
8. Backend checks the transaction on TRON.
9. Backend marks the payment as paid.
10. Plan subscription or top-up credits become active.
11. Customer receives a billing notification.

Recommended crypto payment details to show:

- Amount due.
- USDT TRC20 wallet address.
- Wallet QR code.
- TRC/TRC20 network label.
- Tronscan transaction link when a transaction hash is available.
- Submitted transaction hash.
- Payment reference or invoice code.
- Payment expiry time.
- Pending confirmation status.

Still to confirm:

- Production TRON API provider and rate limits.

### Customer Billing Page Additions

Add a customer/account billing page where account admins can view billing information.

Planned sections:

- Current Plan
- AI Reply Usage
- Top-Up Credits
- Billing Cycle
- Payment Status
- Pending Billing Requests
- Payment History
- Notifications

Customer actions:

- View current usage.
- Request plan upgrade.
- Request top-up purchase.
- View pending payment status.
- View billing cycle and renewal date.

Customer actions not included in V1:

- Upload payment proof.
- Pay by Stripe, PayPal, QRIS, card, or bank transfer.
- Self-activate plans without admin approval.

### Admin Billing Additions

Add admin billing management for global admins.

Admin capabilities:

- Create and edit AI billing plans.
- Assign one active plan to an account/company.
- View account usage.
- View top-up balances.
- Create or approve top-ups.
- Mark crypto payments as paid after verification.
- Refresh/check pending TRC20 payment status after a transaction hash is submitted.
- Mark payment requests as rejected/cancelled.
- Adjust billing status if needed.
- Expire stale top-ups.
- See accounts that are near quota or over quota.

Recommended admin pages:

- Billing Overview
- Plans
- Accounts
- Account Billing Detail
- Payment Requests/Invoices
- Usage Logs
- Top-Ups

### Billing Notifications

Add billing notifications for quota and payment lifecycle events.

Implemented V1 notification events:

- Payment request created.
- Payment confirmed.
- Top-up activated.
- 80%, 90%, and 100% of monthly AI reply quota used.
- AI Agent stopped due to exhausted monthly and valid top-up credits.

Implemented V1 notification delivery:

- Billing notifications are stored in `ai_billing_notifications`.
- Latest billing notifications are returned in the customer billing summary API.
- Billing page shows recent notifications in the Billing Activity card.
- Admin/browser database notifications are sent to the account owner when available, otherwise admin users.
- Quota threshold notifications are deduplicated per subscription cycle.
- AI stopped notifications are deduplicated once per account per day.

Quota notifications:

- 80% of monthly AI reply quota used.
- 90% of monthly AI reply quota used.
- 100% of monthly AI reply quota used.
- AI Agent stopped due to exhausted credits.

Future quota notifications:

- Top-up credits started being consumed.
- Top-up credits are low.
- Top-up credits expired.

Payment notifications:

- Payment request created.
- Payment confirmed.
- Top-up activated.

Future payment notifications:

- Payment pending.
- Crypto payment instructions generated.
- TRC20 transaction detected and verified.
- Payment rejected.
- Plan activated.
- Plan changed.

Subscription notifications:

- Subscription cycle started.
- Subscription renewal date approaching.
- Subscription expired.
- Account downgraded or suspended, if that behavior is later enabled.

### Data Model Additions

Recommended new or extended backend concepts:

- Billing Account
  - Represents the company/account being billed.
  - Has users/admins/agents attached.
  - Has one active billing plan.

- Billing Plan
  - Can reuse existing product/price models where practical.
  - Stores plan name, price, currency, billing interval, and included AI reply quota.

- Billing Subscription
  - Links billing account to plan.
  - Tracks status, cycle start, cycle end, renewal date, and active/inactive state.

- AI Usage Ledger
  - Tracks successful AI reply credit consumption.
  - Should support subscription-cycle reporting.
  - Recommended to keep history rather than only overwritten counters.

- Top-Up Credit Package
  - Stores purchased credits, used credits, expiry date, and status.

- Payment Request/Crypto Invoice
  - Stores plan/top-up request, amount, crypto payment details, status, admin approval, and payment notes.

- Crypto Payment Record
  - Stores payment request ID, accepted asset, network, wallet address, expected amount, received amount, transaction hash, confirmation status, and confirmed timestamp.

### Usage Ledger Requirements

Recommended ledger fields:

- Billing account ID.
- Subscription ID or cycle ID.
- Conversation ID.
- AI agent ID, if available.
- Message ID, if available.
- Usage type, for example `ai_reply`.
- Credits consumed, normally `1`.
- Created timestamp.

Recommended top-up transaction fields:

- Billing account ID.
- Top-up package ID.
- Credits purchased.
- Credits used.
- Expires at.
- Status.
- Payment request ID.

Recommended crypto payment fields:

- Payment request ID.
- Fiat amount, for example IDR amount due.
- Crypto asset, for example USDT, BTC, ETH, or another supported asset.
- Crypto network. V1 uses TRC/TRC20 only.
- Expected crypto amount.
- Received crypto amount.
- Wallet address.
- Transaction hash.
- Tronscan transaction URL.
- Confirmation count/status, if available.
- Payment expires at.
- Confirmed by admin user ID.
- Confirmed at.
- Provider, for example `tron_self_custody`.
- Provider payment ID, if added later.
- Provider checkout URL, only for future gateway providers.
- Provider status.
- Provider verification payload.
- Paid at.
- Expired at.

### Billing Cycle Rules

Agreed behavior:

- Monthly plan credits reset each subscription cycle.
- Unused monthly credits do not roll over.
- Top-up credits expire 24 hours after activation.
- Top-up credits are separate from included monthly credits.

Still to confirm:

- Whether the subscription cycle is calendar month based or starts from activation date.

Recommended default:

- Subscription cycle starts on the plan activation date.
- Cycle renews monthly on the same day where possible.
- Top-ups expire 24 hours after activation.
- Pending payment requests expire automatically after 24 hours and are removed from the pending list.
- Expired top-ups are marked expired automatically by the billing maintenance job.

### Enforcement Points

The implementation should check quota before sending AI Agent replies.

Primary enforcement point:

- AI Agent reply generation/send pipeline.

The quota check should happen before sending a final AI response, but usage should only be consumed after a successful response is sent.

Recommended service responsibilities:

- `BillingAccountResolver`: finds the billing account for the current conversation/user/group.
- `AiReplyQuotaService`: determines available monthly and top-up credits.
- `AiUsageRecorder`: records successful AI reply usage.
- `AiBillingNotificationService`: stores billing events, sends browser/database notifications, and deduplicates quota/exhausted-credit alerts.

### API Additions

Customer/account admin APIs:

- Get current billing summary.
- Request plan upgrade/change.
- Request top-up.
- Submit TRON transaction hash for a pending payment request.
- View payment requests.
- View usage history.

Admin APIs:

- List billing accounts.
- Show account billing detail.
- Assign/change account plan.
- Review TRC20 payment status.
- Reconcile submitted TRON transaction hashes if needed.
- Activate top-up.
- Expire top-up.
- View usage logs.
- Adjust top-up expiry or credits if allowed.

### Frontend Additions

Customer billing page:

- Plan card.
- Usage meter.
- Top-up balance card.
- Billing cycle information.
- Request upgrade action.
- Request top-up action.
- USDT TRC20 wallet, QR code, amount, expiry, and transaction hash field for pending upgrade/top-up payments.
- Payment status table.

Admin billing UI:

- Plans table.
- Account billing table.
- Account detail drawer/page.
- TRC20 payment status controls.
- TRC20 payment refresh/reconciliation action.
- Wallet, expected amount, transaction hash, and Tronscan fields.
- Wallet QR code.
- Top-up management controls.
- Top-up expiry action.
- Usage logs and quota status.

### Permission Additions

Recommended permissions:

- `billing.view`
- `billing.manage`
- `billing.plans.manage`
- `billing.payments.manage`
- `billing.usage.view`

Recommended access:

- Global admins can manage all billing.
- Account admins can view their own account billing and request plan/top-up changes.
- Normal agents can see limited quota warnings only when AI is blocked.

### Payment Provider Compatibility

V1 will use self-custody USDT TRC20 first, while keeping the data model compatible with payment providers later.

Keep compatibility for:

- Self-custody TRC20 verification.
- Crypto payment providers/APIs.
- Stripe.
- PayPal.
- QRIS or other local payment gateways.

Design recommendation:

- Keep subscription, invoice/payment request, crypto payment record, and product/plan concepts separate from admin approval.
- Store provider/gateway fields as nullable so self-custody verification can work now and other payment providers can be added later.

### Out Of Scope For V1

The following are not planned for the first billing implementation unless priorities change:

- Automatic card payments.
- Stripe checkout.
- PayPal checkout.
- Customer-uploaded payment proof.
- Bank transfer payment flow.
- QRIS payment flow.
- Full revenue reporting.
- Per-agent billing.
- Multiple plans per account.
- Rolling over unused monthly credits.
- Charging for failed AI responses.
- Blocking human support when AI quota is exhausted.

## Open Decisions

The following decisions still need final answers:

1. Whether account admins can cancel pending requests.
2. Whether admins can manually adjust usage counts.
3. Whether expired top-up credits should remain visible in billing history.
4. Production TRON API provider and rate limits.

## Agreed Decisions Log

- One account/company has one active billing plan.
- Top-ups are separate from the plan.
- Top-up credits expire.
- Monthly credits do not roll over.
- Monthly plan credits are consumed before top-up credits.
- AI stops only after monthly credits and valid top-up credits are exhausted.
- Human agents can continue replying after AI quota is exhausted.
- Payment method for upgrades, renewals, and top-ups will be self-custody USDT TRC20.
- All payments use TRC/TRC20 network.
- IDR prices convert to crypto at request time using a configurable exchange-rate API.
- V1 verifies submitted TRON transaction hashes through the TRON API.
- Admins can refresh/check pending TRC20 payment status after a transaction hash is submitted.
- Payment requests expire after 24 hours.
- Customers should see the wallet address, QR code, expected USDT amount, and transaction hash field after submitting the payment request.
- Customers do not upload proof of payment inside the app.
- Email billing notifications are not needed for V1.
- Usage counts only successful AI replies.
- One successful AI Agent message/chat bubble consumes one AI Reply Credit.
- Top-up credits expire 24 hours after activation.
- Subscription cycles start from the activation date.
