import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { getToken, clearToken } from "./src/auth-storage"
import { listNotifications } from "./src/api"
import { SignUpScreen } from "./src/screens/SignUpScreen"
import { VerifyEmailScreen } from "./src/screens/VerifyEmailScreen"
import { SignInScreen } from "./src/screens/SignInScreen"
import { HomeScreen } from "./src/screens/HomeScreen"

type Screen =
  | { name: "loading" }
  | { name: "signup" }
  | { name: "verify"; userId: number; email: string }
  | { name: "signin" }
  | { name: "home" }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" })

  const checkExistingSession = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setScreen({ name: "signin" })
      return
    }
    // Token could be stale (expired, revoked) — a real authenticated request
    // is the only way to know for sure.
    try {
      await listNotifications()
      setScreen({ name: "home" })
    } catch {
      await clearToken()
      setScreen({ name: "signin" })
    }
  }, [])

  useEffect(() => {
    void checkExistingSession()
  }, [checkExistingSession])

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {screen.name === "loading" && <ActivityIndicator size="large" />}
      {screen.name === "signup" && (
        <SignUpScreen
          onSignedUp={(userId, email) => setScreen({ name: "verify", userId, email })}
          onGoToSignIn={() => setScreen({ name: "signin" })}
        />
      )}
      {screen.name === "verify" && (
        <VerifyEmailScreen
          userId={screen.userId}
          email={screen.email}
          onVerified={() => setScreen({ name: "home" })}
        />
      )}
      {screen.name === "signin" && (
        <SignInScreen
          onSignedIn={() => setScreen({ name: "home" })}
          onGoToSignUp={() => setScreen({ name: "signup" })}
        />
      )}
      {screen.name === "home" && <HomeScreen onSignedOut={() => setScreen({ name: "signin" })} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})
