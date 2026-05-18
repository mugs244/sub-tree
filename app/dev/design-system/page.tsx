"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { AuthLayout } from "@/components/layouts/AuthLayout";

/* ── Helpers ─────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight border-b border-border-default pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  label,
  cssVar,
  hex,
  dark = false,
}: {
  label: string;
  cssVar: string;
  hex: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 rounded-lg border border-border-default"
        style={{ backgroundColor: hex }}
      />
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-xs text-[color:var(--text-muted)] font-mono">{cssVar}</p>
      <p className="text-xs text-[color:var(--text-muted)] font-mono">{hex}</p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────── */

export default function DesignSystemPage() {
  const [checked, setChecked] = useState(false);

  return (
    <>
      <Toaster />
      <div className="max-w-4xl mx-auto py-16 px-6 space-y-16">
        <div>
          <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-2">
            Sub-tree Design System
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Tokens &amp; Primitives
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            Every token, type scale, and component in one place. This page is
            the smoke-test — if it renders correctly, the design system is
            wired up.
          </p>
        </div>

        {/* ── Brand ──────────────────────────────────────── */}
        <Section title="Brand">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">Lockup</p>
              <Logo variant="lockup" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">Icon</p>
              <Logo variant="icon" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">Wordmark</p>
              <Logo variant="wordmark" />
            </div>
          </div>
        </Section>

        {/* ── Color Tokens ───────────────────────────────── */}
        <Section title="Color Tokens">
          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-3">
              Backgrounds
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Swatch label="Base" cssVar="--bg-base" hex="#ffffff" />
              <Swatch label="Surface" cssVar="--bg-surface" hex="#f9fafb" />
              <Swatch label="Raised" cssVar="--bg-raised" hex="#ffffff" />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-3">
              Text
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Swatch label="Primary" cssVar="--text-primary" hex="#111827" dark />
              <Swatch label="Secondary" cssVar="--text-secondary" hex="#4b5563" dark />
              <Swatch label="Muted" cssVar="--text-muted" hex="#6b7280" dark />
              <Swatch label="Placeholder" cssVar="--text-placeholder" hex="#9ca3af" dark />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-3">
              Accent
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Swatch label="Primary" cssVar="--accent-primary" hex="#111827" dark />
              <Swatch label="Hover" cssVar="--accent-hover" hex="#1f2937" dark />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-3">
              Borders
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Swatch label="Default" cssVar="--border-default" hex="#e5e7eb" />
              <Swatch label="Subtle" cssVar="--border-subtle" hex="#f3f4f6" />
              <Swatch label="Focus" cssVar="--border-focus" hex="#111827" dark />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-3">
              States
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Swatch label="Error" cssVar="--state-error" hex="#dc2626" dark />
              <Swatch label="Error BG" cssVar="--state-error-bg" hex="#fee2e2" />
              <Swatch label="Success" cssVar="--state-success" hex="#16a34a" dark />
              <Swatch label="Success BG" cssVar="--state-success-bg" hex="#dcfce7" />
              <Swatch label="Warning" cssVar="--state-warning" hex="#d97706" dark />
              <Swatch label="Warning BG" cssVar="--state-warning-bg" hex="#fef3c7" />
              <Swatch label="Info" cssVar="--state-info" hex="#2563eb" dark />
            </div>
          </div>
        </Section>

        {/* ── Typography ─────────────────────────────────── */}
        <Section title="Typography">
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                H1 · text-3xl md:text-4xl font-semibold tracking-tight
              </p>
              <p className="text-3xl md:text-4xl font-semibold tracking-tight">
                Page Heading — Sub-tree
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                H2 · text-2xl font-semibold tracking-tight
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                Section Heading
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                H3 · text-lg font-semibold
              </p>
              <p className="text-lg font-semibold">Subsection Heading</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                Label · text-sm font-medium
              </p>
              <p className="text-sm font-medium">Form Label</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                Body · text-[15px] leading-relaxed
              </p>
              <p className="text-[15px] leading-relaxed">
                This is body text. Sub-tree is a link-in-bio platform built for
                East African creators. Accept donations via MTN MoMo and Airtel
                Money directly to your registered number.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                Small · text-xs text-muted-foreground
              </p>
              <p className="text-xs text-muted-foreground">
                Helper text or secondary information.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                Eyebrow · text-xs uppercase tracking-wider text-muted-foreground
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Section Label / Eyebrow
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[color:var(--text-muted)]">
                Mono · font-mono
              </p>
              <p className="font-mono text-sm">
                +256 700 000 000 · txn_01HXYZ123
              </p>
            </div>
          </div>
        </Section>

        {/* ── Border Radius ──────────────────────────────── */}
        <Section title="Border Radius">
          <div className="flex flex-wrap gap-6 items-end">
            {[
              { label: "rounded-full", cls: "rounded-full" },
              { label: "rounded-2xl", cls: "rounded-2xl" },
              { label: "rounded-xl", cls: "rounded-xl" },
              { label: "rounded-lg", cls: "rounded-lg" },
              { label: "rounded-none", cls: "rounded-none" },
            ].map(({ label, cls }) => (
              <div key={label} className="space-y-2 text-center">
                <div
                  className={`h-16 w-16 bg-primary ${cls}`}
                  aria-hidden="true"
                />
                <p className="text-xs text-[color:var(--text-muted)] font-mono">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ────────────────────────────────────── */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        {/* ── Form Inputs ────────────────────────────────── */}
        <Section title="Form Inputs">
          <div className="max-w-sm space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="ds-name">Display name</Label>
              <Input id="ds-name" placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-phone">Phone number</Label>
              <Input id="ds-phone" type="tel" placeholder="+256 700 000 000" />
              <p className="text-xs text-muted-foreground">
                Used for phone OTP verification.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-error">
                Username{" "}
                <span className="text-xs text-error font-normal">taken</span>
              </Label>
              <Input
                id="ds-error"
                defaultValue="muhamad"
                className="border-error focus-visible:ring-error"
              />
              <p className="text-xs text-error">
                This username is already taken.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ds-check"
                checked={checked}
                onCheckedChange={(v) => setChecked(!!v)}
              />
              <Label htmlFor="ds-check">I agree to the Terms of Service</Label>
            </div>
          </div>
        </Section>

        {/* ── Select ─────────────────────────────────────── */}
        <Section title="Select">
          <div className="max-w-xs">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* ── Dialog ─────────────────────────────────────── */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm donation</DialogTitle>
                <DialogDescription>
                  You are about to donate UGX 10,000 to this creator. Approve
                  the STK push on your phone to complete.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </div>
            </DialogContent>
          </Dialog>
        </Section>

        {/* ── Drawer ─────────────────────────────────────── */}
        <Section title="Drawer (mobile sheet)">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Donate to this creator</DrawerTitle>
                <DrawerDescription>
                  Enter your MTN MoMo or Airtel number and choose an amount.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="drawer-phone">Your phone number</Label>
                  <Input id="drawer-phone" placeholder="+256 700 000 000" />
                </div>
              </div>
              <DrawerFooter>
                <Button>Send donation</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        {/* ── Toast ──────────────────────────────────────── */}
        <Section title="Toast (Sonner)">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => toast("Donation received — UGX 10,000")}
            >
              Default toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Payment confirmed", {
                  description: "UGX 10,000 sent to your MoMo account.",
                })
              }
            >
              Success toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Payment failed", {
                  description: "Check your MoMo PIN and try again.",
                })
              }
            >
              Error toast
            </Button>
          </div>
        </Section>

        {/* ── Auth Layout preview ────────────────────────── */}
        <Section title="Auth Layout">
          <div className="border border-border-default rounded-xl overflow-hidden h-96">
            <div className="scale-75 origin-top-left w-[133%] h-[133%]">
              <AuthLayout>
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Create your account
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start sharing your links in minutes.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="preview-email">Email</Label>
                    <Input id="preview-email" placeholder="you@example.com" />
                  </div>
                  <Button className="w-full">Continue</Button>
                </div>
              </AuthLayout>
            </div>
          </div>
        </Section>

        <div className="border-t border-border-default pt-8 pb-4 text-xs text-[color:var(--text-muted)]">
          Sub-tree design system · Phase 0 · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}
