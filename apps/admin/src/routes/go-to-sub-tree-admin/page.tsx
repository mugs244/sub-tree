import { useEffect } from "react"
import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui"

// Sidebar item "Go to Sub-tree admin": the switch back from the Sub-shop
// admin portal. Only admins a Sub-tree super admin has granted Sub-shop access
// (Admin → Team) get a Sub-shop admin login, so everyone here may use it;
// Sub-tree still checks they're an admin when they arrive.
const SUB_TREE_ADMIN_URL =
  (import.meta.env.VITE_SUB_TREE_ADMIN_URL as string | undefined) ?? "https://sub-tree.com/admin"

export const config = {
  label: "Go to Sub-tree admin",
  icon: ArrowUpRightOnBox,
  rank: 1000,
}

const GoToSubTreeAdminPage = () => {
  useEffect(() => {
    window.location.assign(SUB_TREE_ADMIN_URL)
  }, [])

  return (
    <div className="flex flex-col gap-y-2 p-6">
      <Heading>Switching to Sub-tree admin…</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        <a href={SUB_TREE_ADMIN_URL} className="text-ui-fg-interactive underline">
          Open Sub-tree admin
        </a>
      </Text>
    </div>
  )
}

export default GoToSubTreeAdminPage
