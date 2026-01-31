// Lightweight helper for loading Google Identity Services and getting an ID token

declare global {
  interface Window {
    google?: any
  }
}

let googleScriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Identity Services can only be used in the browser."))
      return
    }

    // If the script is already present, resolve immediately
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script."))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

export async function getGoogleIdToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error("Google sign-in is not configured. Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.")
  }

  await loadGoogleScript()

  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services is not available on this page.")
  }

  return new Promise<string>((resolve, reject) => {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          if (response?.credential) {
            resolve(response.credential)
          } else {
            reject(new Error("Did not receive a valid Google ID token."))
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Trigger the Google One Tap / popup flow
      window.google.accounts.id.prompt((notification: any) => {
        const reason =
          notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || "User closed the sign-in."

        if (reason && reason !== "displayed") {
          reject(new Error("Google sign-in was cancelled or could not be displayed."))
        }
      })
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to start Google sign-in."))
    }
  })
}

