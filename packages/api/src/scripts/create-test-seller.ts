import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows"
import {
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// Creates one approved test business with a seller-portal login, a Kampala
// pickup location, and two ways to get orders: free pickup and seller delivery.
// Run: bun x medusa exec ./src/scripts/create-test-seller.ts
const TEST = {
  name: "Sub-shop Test Store",
  email: "teststore@sub-tree.com",
  password: process.env.TEST_SELLER_PASSWORD || "Teststore-2026",
  first_name: "Test",
  last_name: "Business",
}

export default async function createTestSeller({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const auth = container.resolve(Modules.AUTH)

  const { data: existing } = await query.graph({ entity: "seller", fields: ["id"], filters: { email: TEST.email } })
  if (existing[0]) {
    logger.info(`Test store already exists — sign in as ${TEST.email}.`)
    return
  }

  const { data: [region] } = await query.graph({ entity: "region", fields: ["id"], filters: { currency_code: "ugx" } })
  const { data: [channel] } = await query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: "Default Sales Channel" } })
  if (!region || !channel) throw new Error("Run seed-subshop.ts first (no Uganda region or sales channel).")

  // Seller-portal login.
  const registered = await auth.register("emailpass", { body: { email: TEST.email, password: TEST.password } })
  const authIdentityId = registered.authIdentity?.id
  if (!registered.success || !authIdentityId) throw new Error(`Couldn't create the login: ${registered.error ?? "unknown"}`)

  const { result: seller } = await createSellerAccountWorkflow(container).run({
    input: {
      auth_identity_id: authIdentityId,
      member_email: TEST.email,
      first_name: TEST.first_name,
      last_name: TEST.last_name,
      seller: {
        name: TEST.name,
        email: TEST.email,
        currency_code: "ugx",
        description: "A test business for trying out the Sub-shop seller portal.",
      },
    },
  })
  await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })

  // Pickup location in Kampala.
  const { result: [location] } = await createSellerStockLocationsWorkflow(container).run({
    input: {
      seller_id: seller.id,
      locations: [{ name: `${TEST.name} — Kampala`, address: { address_1: "Kampala Road", city: "Kampala", country_code: "UG" } }],
    },
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })

  await createLocationFulfillmentSetWorkflow(container).run({
    input: { location_id: location.id, fulfillment_set_data: { name: `${TEST.name} fulfilment`, type: "shipping" } },
  })
  const { data: [withSet] } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id"], filters: { id: location.id } })
  const fulfillmentSetId = withSet?.fulfillment_sets?.[0]?.id
  if (!fulfillmentSetId) throw new Error("Fulfilment set wasn't created")

  const { result: [zone] } = await createServiceZonesWorkflow(container).run({
    input: { data: [{ fulfillment_set_id: fulfillmentSetId, name: "Uganda", geo_zones: [{ country_code: "ug", type: "country" as const }] }] },
  })

  const { data: [existingProfile] } = await query.graph({ entity: "shipping_profile", fields: ["id"], filters: { name: "Marketplace Shipping" } })
  const profileId =
    (existingProfile?.id as string | undefined) ??
    (await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Marketplace Shipping", type: "default" }] } })).result[0].id

  const option = (name: string, label: string, description: string, code: string, ugx: number) => ({
    name,
    price_type: "flat" as const,
    provider_id: "manual_manual",
    service_zone_id: zone.id,
    shipping_profile_id: profileId,
    type: { label, description, code },
    prices: [{ currency_code: "ugx", amount: ugx }, { region_id: region.id, amount: ugx }],
    rules: [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ],
  })
  await createSellerShippingOptionsWorkflow(container).run({
    input: {
      seller_id: seller.id,
      shipping_options: [
        option("Pick up at store", "Pickup", "Collect from the store with your pickup code.", "pickup", 0),
        option("Seller delivery", "Delivery", "The seller delivers within Kampala.", "seller-delivery", 5000),
      ],
    },
  })

  logger.info(`Test store ready. Seller portal login: ${TEST.email} (password from TEST_SELLER_PASSWORD or the default).`)
}
