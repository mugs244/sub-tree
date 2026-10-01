import { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import { signIn, ApiError } from "../api"
import { saveToken } from "../auth-storage"
import { shared } from "../styles"

export function SignInScreen({
  onSignedIn,
  onGoToSignUp,
}: {
  onSignedIn: () => void
  onGoToSignUp: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const { token } = await signIn(email.trim(), password)
      await saveToken(token)
      onSignedIn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={shared.screen}>
      <Text style={shared.title}>Sign in</Text>
      <Text style={shared.subtitle}>Welcome back.</Text>

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
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={shared.error}>{error}</Text>}

      <Pressable
        style={[shared.button, !canSubmit && shared.buttonDisabled]}
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
      >
        <Text style={shared.buttonText}>{loading ? "Signing in…" : "Sign in"}</Text>
      </Pressable>

      <Text style={shared.linkText}>
        Don&apos;t have an account?{" "}
        <Text style={shared.linkTextBold} onPress={onGoToSignUp}>
          Create one
        </Text>
      </Text>
    </View>
  )
}
