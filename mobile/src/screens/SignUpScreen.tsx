import { useState } from "react"
import { Linking, Pressable, Text, TextInput, View } from "react-native"
import { signUp, ApiError } from "../api"
import { API_BASE_URL } from "../config"
import { shared } from "../styles"

export function SignUpScreen({
  onSignedUp,
  onGoToSignIn,
}: {
  onSignedUp: (userId: number, email: string) => void
  onGoToSignIn: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length >= 8 && agreedToTerms && !loading

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const { userId } = await signUp(email.trim(), password, agreedToTerms)
      onSignedUp(userId, email.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={shared.screen}>
      <Text style={shared.title}>Create your account</Text>
      <Text style={shared.subtitle}>Free to start — no credit card needed.</Text>

      <TextInput
        style={shared.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={shared.input}
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}
        onPress={() => setAgreedToTerms((v) => !v)}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#111827",
            backgroundColor: agreedToTerms ? "#111827" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {agreedToTerms && <Text style={{ color: "#ffffff", fontSize: 13 }}>✓</Text>}
        </View>
        <Text style={{ flex: 1, fontSize: 14, color: "#4b5563" }}>
          I agree to the{" "}
          <Text style={{ fontWeight: "600" }} onPress={() => Linking.openURL(`${API_BASE_URL}/terms`)}>
            Terms of Service
          </Text>
        </Text>
      </Pressable>

      {error && <Text style={shared.error}>{error}</Text>}

      <Pressable
        style={[shared.button, !canSubmit && shared.buttonDisabled]}
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
      >
        <Text style={shared.buttonText}>{loading ? "Creating account…" : "Create account"}</Text>
      </Pressable>

      <Text style={shared.linkText}>
        Already have an account?{" "}
        <Text style={shared.linkTextBold} onPress={onGoToSignIn}>
          Sign in
        </Text>
      </Text>
    </View>
  )
}
