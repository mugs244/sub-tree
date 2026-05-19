"use client"

import React from "react"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create your Sub-tree account</h1>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <SignUp routing="path" path="/sign-up" />
        </div>
      </div>
    </div>
  )
}
