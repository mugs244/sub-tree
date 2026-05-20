"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign in to Sub-tree</h1>
        </div>
        <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}
