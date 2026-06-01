"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TierItem {
  id: number
  name: string
  description: string | null
  price_ugx: number
  perks: string[] | null
  is_active: boolean
  position: number
}

interface TierDraft extends TierItem {
  perksText: string
  isSaving?: boolean
  isDeleting?: boolean
}

interface MembershipTierManagerProps {
  initialTiers: TierItem[]
}

export function MembershipTierManager({ initialTiers }: MembershipTierManagerProps) {
  const [tiers, setTiers] = useState<TierDraft[]>(
    initialTiers.map((tier) => ({
      ...tier,
      perksText: tier.perks?.join(", ") ?? "",
    })),
  )
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [perks, setPerks] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const hasTiers = tiers.length > 0

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.position - b.position),
    [tiers],
  )

  const resetForm = () => {
    setName("")
    setPrice("")
    setDescription("")
    setPerks("")
  }

  const parsePerks = (value: string) =>
    value
      .split(",")
      .map((perk) => perk.trim())
      .filter(Boolean)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const priceValue = Number(price)
    if (!name.trim()) return setError("Tier name is required")
    if (Number.isNaN(priceValue) || priceValue <= 0) return setError("Price must be a positive number")

    setSaving(true)
    try {
      const res = await fetch("/api/creator/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          price_ugx: priceValue,
          perks: parsePerks(perks),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Unable to create tier")
        return
      }

      setTiers((current) => [
        {
          ...(json.data as TierItem),
          perksText: parsePerks(perks).join(", "),
        },
        ...current,
      ])
      resetForm()
      setSuccess("Tier created")
    } catch {
      setError("Unable to create tier")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (tier: TierDraft) => {
    setError(null)
    setSuccess(null)
    const priceValue = Number(tier.price_ugx)
    if (!tier.name.trim()) return setError("Tier name is required")
    if (Number.isNaN(priceValue) || priceValue <= 0) return setError("Price must be a positive number")

    const updatedTier = { ...tier, price_ugx: priceValue, perks: parsePerks(tier.perksText) }
    setTiers((current) =>
      current.map((item) => (item.id === tier.id ? { ...item, isSaving: true } : item)),
    )

    try {
      const res = await fetch(`/api/creator/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedTier.name.trim(),
          description: updatedTier.description?.trim() || null,
          price_ugx: updatedTier.price_ugx,
          perks: updatedTier.perks.length > 0 ? updatedTier.perks : null,
          is_active: updatedTier.is_active,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Unable to save changes")
        return
      }

      setTiers((current) =>
        current.map((item) =>
          item.id === tier.id
            ? { ...updatedTier, isSaving: false, isDeleting: false, perksText: updatedTier.perks.join(", ") }
            : item,
        ),
      )
      setSuccess("Tier saved")
    } catch {
      setError("Unable to save changes")
    } finally {
      setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, isSaving: false } : item)))
    }
  }

  const handleDelete = async (tierId: number) => {
    setError(null)
    setSuccess(null)
    setTiers((current) => current.map((item) => (item.id === tierId ? { ...item, isDeleting: true } : item)))

    try {
      const res = await fetch(`/api/creator/tiers/${tierId}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Unable to delete tier")
        setTiers((current) => current.map((item) => (item.id === tierId ? { ...item, isDeleting: false } : item)))
        return
      }

      setTiers((current) => current.filter((item) => item.id !== tierId))
      setSuccess("Tier deleted")
    } catch {
      setError("Unable to delete tier")
      setTiers((current) => current.map((item) => (item.id === tierId ? { ...item, isDeleting: false } : item)))
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-surface border border-border rounded-3xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membership tiers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage the subscription tiers fans can join on your public page.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleAdd}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tier-name">Tier name</Label>
              <Input
                id="tier-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Bronze"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier-price">Monthly price (UGX)</Label>
              <Input
                id="tier-price"
                type="number"
                min="1"
                step="1000"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="15000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tier-description">Description</Label>
            <Input
              id="tier-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Access to exclusive posts and priority replies"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tier-perks">Perks</Label>
            <Input
              id="tier-perks"
              value={perks}
              onChange={(event) => setPerks(event.target.value)}
              placeholder="Early access, behind-the-scenes, monthly Q&A"
            />
            <p className="text-xs text-muted-foreground">Separate perks with commas.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
            ) : (
              <><Plus className="h-4 w-4" /> Create tier</>
            )}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Existing tiers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update prices, perks, or deactivate tiers as your offering changes.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{tiers.length} tier{tiers.length === 1 ? "" : "s"}</span>
        </div>

        {hasTiers ? (
          <div className="space-y-4">
            {sortedTiers.map((tier) => (
              <div key={tier.id} className="bg-surface border border-border rounded-3xl p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">Tier #{tier.position + 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={tier.is_active ? "default" : "secondary"}
                      size="sm"
                      onClick={() =>
                        setTiers((current) =>
                          current.map((item) =>
                            item.id === tier.id ? { ...item, is_active: !item.is_active } : item,
                          ),
                        )
                      }
                    >
                      {tier.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tier.id)}
                      disabled={tier.isDeleting}
                    >
                      {tier.isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${tier.id}`}>Name</Label>
                    <Input
                      id={`name-${tier.id}`}
                      value={tier.name}
                      onChange={(event) =>
                        setTiers((current) =>
                          current.map((item) =>
                            item.id === tier.id ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`price-${tier.id}`}>Monthly price</Label>
                    <Input
                      id={`price-${tier.id}`}
                      type="number"
                      min="1"
                      step="1000"
                      value={tier.price_ugx}
                      onChange={(event) =>
                        setTiers((current) =>
                          current.map((item) =>
                            item.id === tier.id
                              ? { ...item, price_ugx: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`description-${tier.id}`}>Description</Label>
                  <Input
                    id={`description-${tier.id}`}
                    value={tier.description ?? ""}
                    onChange={(event) =>
                      setTiers((current) =>
                        current.map((item) =>
                          item.id === tier.id
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`perks-${tier.id}`}>Perks</Label>
                  <Input
                    id={`perks-${tier.id}`}
                    value={tier.perksText}
                    onChange={(event) =>
                      setTiers((current) =>
                        current.map((item) =>
                          item.id === tier.id ? { ...item, perksText: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">Separate perks with commas.</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleUpdate(tier)}
                    disabled={tier.isSaving}
                  >
                    {tier.isSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                    ) : (
                      <><Save className="h-4 w-4" /> Save changes</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No membership tiers created yet. Create one above to let fans see your pricing.
          </div>
        )}
      </section>
    </div>
  )
}
