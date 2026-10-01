import { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import { verifyEmail, ApiError } from "../api"
import { saveToken } from "../auth-storage"
import { shared } from "../styles"

export function VerifyEmailScreen({
  userId,
  email,
  onVerified,
}: {
  userId: number
  email: string
  onVerified: () => void
}) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = code.length === 6 && !loading

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const { token } = await verifyEmail(userId, code)
      await saveToken(token)
      onVerified()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={shared.screen}>
      <Text style={shared.title}>Check your email</Text>
      <Text style={shared.subtitle}>We sent a 6-digit code to {email}.</Text>

      <TextInput
        style={shared.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      {error && <Text style={shared.error}>{error}</Text>}

      <Pressable
        style={[shared.button, !canSubmit && shared.buttonDisabled]}
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
      >
        <Text style={shared.buttonText}>{loading ? "Verifying…" : "Verify"}</Text>
      </Pressable>
    </View>
  )
}
