"use client"

import { useState } from "react"

type Mode = "donation" | "withdrawal"

interface Props {
  initialDonationRate: number
  initialWithdrawalCreatorRate: number
  initialWithdrawalProcessorRate: number
}

export function FeeCalculator({
  initialDonationRate,
  initialWithdrawalCreatorRate,
  initialWithdrawalProcessorRate,
}: Props) {
  const [mode, setMode] = useState<Mode>("donation")
  const [amount, setAmount] = useState("100000")
  const [donationPct, setDonationPct] = useState(String(initialDonationRate * 100))
  const [creatorPct, setCreatorPct] = useState(String(initialWithdrawalCreatorRate * 100))
  const [processorPct, setProcessorPct] = useState(String(initialWithdrawalProcessorRate * 100))

  const amountNum = Number(amount) || 0

  const donationRate = (Number(donationPct) || 0) / 100
  const donationFee = Math.round(amountNum * donationRate)
  const creatorGets = amountNum - donationFee

  const creatorRate = (Number(creatorPct) || 0) / 100
  const processorRate = (Number(processorPct) || 0) / 100
  const withdrawalPlatformFee = Math.round(amountNum * creatorRate)
  const withdrawalProcessorFee = Math.round(amountNum * processorRate)
  const withdrawalNet = amountNum - withdrawalPlatformFee - withdrawalProcessorFee

  return (
    <div className="rounded-md border p-5 space-y-5 max-w-lg">
      <div>
        <h2 className="font-semibold text-lg">Fee calculator</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Try a percentage before saving it as a real setting — this doesn&apos;t change anything live.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setMode("donation")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            mode === "donation" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Donation fee
        </button>
        <button
          onClick={() => setMode("withdrawal")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            mode === "withdrawal" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Withdrawal fee
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Amount (UGX)</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
      </div>

      {mode === "donation" ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Donation fee (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={donationPct}
              onChange={(e) => setDonationPct(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="rounded-md bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You take</span>
              <span className="font-mono font-medium">UGX {donationFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creator receives</span>
              <span className="font-mono font-medium">UGX {creatorGets.toLocaleString()}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sub-tree fee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={creatorPct}
                onChange={(e) => setCreatorPct(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Transfer cost (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={processorPct}
                onChange={(e) => setProcessorPct(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div className="rounded-md bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You take (platform revenue)</span>
              <span className="font-mono font-medium">UGX {withdrawalPlatformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer cost (not revenue)</span>
              <span className="font-mono font-medium">UGX {withdrawalProcessorFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Creator receives</span>
              <span className="font-mono font-medium">UGX {withdrawalNet.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
