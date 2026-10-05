import { useEffect } from "react"
import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui"

// Sidebar item "Go to Sub-tree": takes the business back to their Sub-tree
// dashboard (link page, wallet, settings). Sub-shop and Sub-tree share one
// account, so they stay signed in there.
const SUB_TREE_URL =
  (import.meta.env.VITE_SUB_TREE_URL as string | undefined) ?? "https://sub-tree.com/dashboard"

export const config = {
  label: "Go to Sub-tree",
  icon: ArrowUpRightOnBox,
  rank: 1000, // bottom of the sidebar
}

const GoToSubTreePage = () => {
  useEffect(() => {
    window.location.assign(SUB_TREE_URL)
  }, [])

  return (
    <div className="flex flex-col gap-y-2 p-6">
      <Heading>Opening Sub-tree…</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        Taking you to your Sub-tree dashboard.{" "}
        <a href={SUB_TREE_URL} className="text-ui-fg-interactive underline">
          Open it now
        </a>
      </Text>
    </div>
  )
}

export default GoToSubTreePage
