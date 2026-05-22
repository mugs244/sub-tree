# Feature 36 — Payment Aggregators (Pesapal + OpenFloat)

**Status:** Greenlit  
**Phase:** Phase 3  
**Depends on:** 13 (MTN MoMo client), 14 (Airtel client), 16 (webhook handling)

---

## What

Replace the current direct-to-provider MoMo calls (MTN and Airtel) with Pesapal and OpenFloat as the primary payment rails. Both are East African payment aggregators that expose a single API surface over MTN MoMo, Airtel Money, M-Pesa, cards, and bank transfers.

The direct MTN and Airtel clients (`lib/services/momo/`) remain in the codebase as fallback — used automatically if the aggregator call fails, or for future direct-relationship scenarios.

---

## Why aggregators

- **Regulatory clarity.** Pesapal is licensed by the Bank of Uganda as a payment service provider. Routing through them removes the ambiguity around whether Sub-tree itself needs a payment aggregator license under the National Payment Systems Act, 2020.
- **Faster merchant onboarding.** Aggregator merchant application takes ~5-10 days. Direct MTN/Airtel applications each take 2-6 weeks.
- **Pan-EA coverage from day one.** One integration covers MTN, Airtel, M-Pesa (Kenya), and cards — no separate regional integrations at launch.
- **Operational simplicity.** One webhook endpoint per aggregator instead of one per direct provider.

**Trade-off:** Higher per-transaction fee (~3-4% aggregator vs ~1.5% direct). Accepted at MVP volumes; the direct fallback path exists for high-volume migration later.

---

## Scope

### New service files

- `lib/services/payments/pesapal.ts` — Pesapal Collections client implementing `MomoProvider` interface
- `lib/services/payments/openfloat.ts` — OpenFloat client implementing `MomoProvider` interface

Both must implement:
```ts
interface MomoProvider {
  requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult>
  verifyCallback(rawBody: string, signature: string): boolean
}
```

### Route handler updates

- `app/api/payments/initiate/route.ts` — Replace the `TODO` comment with aggregator-first logic:
  1. Try Pesapal (primary)
  2. On Pesapal failure, try OpenFloat
  3. On both failing, fall back to direct MTN/Airtel via `lib/services/momo/`
- `app/api/webhooks/payments/pesapal/route.ts` — New. Verify Pesapal signature, call `handleMomoCallback`.
- `app/api/webhooks/payments/openfloat/route.ts` — New. Verify OpenFloat signature, call `handleMomoCallback`.

### Environment variables to add

```
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_ID=
OPENFLOAT_API_KEY=
OPENFLOAT_WEBHOOK_SECRET=
```

### No npm packages

Both providers are REST APIs. Use `fetch`. No SDK needed.

---

## Webhook handling invariant

The existing `handleMomoCallback` in `lib/services/donation.ts` is idempotent and provider-agnostic — it takes a `provider_tx_id` and status. Both aggregator webhook handlers call the same function. No changes to `handleMomoCallback` itself.

---

## Merchant onboarding (non-code prerequisite)

1. Apply for Pesapal merchant account at [pesapal.com/business](https://www.pesapal.com/business).
2. Apply for OpenFloat merchant account.
3. Configure webhook URLs in each dashboard once code is deployed:
   - `https://sub-tree.vercel.app/api/webhooks/payments/pesapal`
   - `https://sub-tree.vercel.app/api/webhooks/payments/openfloat`
4. Add credentials to Vercel env vars.

---

## Acceptance criteria

- A donor on MTN Uganda can initiate and complete a donation end-to-end via Pesapal.
- A donor on Airtel Uganda can initiate and complete a donation end-to-end via Pesapal.
- If Pesapal returns an error on initiate, the route retries via OpenFloat; if that also fails, falls back to direct MTN/Airtel.
- Idempotency invariant holds: duplicate webhook deliveries from either aggregator do not double-credit the creator.
- Creator receives an in-app notification within 30 seconds of a completed payment.
