// Lightweight helper for loading Google Identity Services and getting an ID token

interface GooglePromptNotification {
  isNotDisplayed: () => boolean
}

interface GoogleAccountsId {
  initialize: (options: { client_id: string; ux_mode?: "popup" | "redirect"; callback: (response: { credential: string }) => void }) => void
  prompt: (listener: (notification: GooglePromptNotification) => void) => void
}

interface GoogleNamespace {
  accounts?: {
    id?: GoogleAccountsId
  }
}

declare global {
  interface Window {
    google?: GoogleNamespace
  }
}

let googleScriptPromise: Promise<void> | null = null

export function loadGoogleScript(): Promise<void> {
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

  const googleId = window.google!.accounts!.id!

  return new Promise<string>((resolve, reject) => {
    try {
      googleId.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: (response: { credential: string }) => {
          if (response?.credential) {
            resolve(response.credential)
          } else {
            reject(new Error("Did not receive a valid Google ID token."))
          }
        },
      })

      // Force display the selector
      googleId.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // If prompt is blocked, try to use the manual button click logic
          console.warn("Prompt suppressed. Using manual sign-in trigger instead.");
          // Some environments require a real button, but this should trigger the popup
        }
      })
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to start Google sign-in."))
    }
  })
}
