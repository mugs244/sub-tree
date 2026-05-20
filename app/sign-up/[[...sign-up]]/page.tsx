"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create your Sub-tree account</h1>
        </div>
        <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/onboarding/username" />
      </div>
    </div>
  )
}
