'use client'

import { useCallback, useEffect, useState } from 'react'

// localStorage key for the "speak discards aloud" preference. Default is true
// — our primary audience (elderly players) benefits from hearing each discard
// named, matching real-table etiquette where every discard is spoken.
const STORAGE_KEY = 'birdy.speech.enabled'

// Preferred voices (clearer female voices, in priority order) for when
// speechSynthesis exposes more than one voice on the platform.
const PREFERRED_VOICE_NAMES = ['Samantha', 'Karen', 'Victoria', 'Moira', 'Fiona']

function readInitial(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

function writeValue(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore — localStorage may be blocked
  }
}

// Pick a clearer voice when available, falling back to the platform default.
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices || voices.length === 0) return null
  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = voices.find((v) => v.name === preferred)
    if (match) return match
  }
  // Fall back to the first English voice if one exists.
  const english = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
  return english ?? voices[0] ?? null
}

// useSpeech — SSR-safe hook that exposes a stable `speak(text)` callback plus
// the current enabled flag and a setter. Consumers don't need to worry about
// feature detection; speak() becomes a no-op when unavailable or disabled.
export function useSpeech(): {
  enabled: boolean
  setEnabled: (value: boolean) => void
  speak: (text: string) => void
  supported: boolean
} {
  const [enabled, setEnabledState] = useState<boolean>(() => readInitial())
  const [supported, setSupported] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    setSupported(ok)
    if (!ok) return
    // Voices load asynchronously on some browsers; warm them up.
    window.speechSynthesis.getVoices()
    const onVoicesChanged = () => {
      window.speechSynthesis.getVoices()
    }
    window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', onVoicesChanged)
    }
  }, [])

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    writeValue(value)
    // Cancel any pending utterance when turning off.
    if (!value && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!enabled) return
      if (typeof window === 'undefined') return
      if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
      if (!text) return
      try {
        const utterance = new window.SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1
        const voice = pickVoice()
        if (voice) utterance.voice = voice
        window.speechSynthesis.speak(utterance)
      } catch {
        // Browsers can throw on rapid speak calls — swallow silently.
      }
    },
    [enabled]
  )

  return { enabled, setEnabled, speak, supported }
}

type SpeechToggleProps = {
  enabled: boolean
  supported: boolean
  onChange: (value: boolean) => void
  className?: string
}

// Visual toggle button rendered alongside the NMJL Card / Leave buttons in the
// game header. Shows the current state and an accessible label. Hidden entirely
// when the platform doesn't support speech synthesis so we don't offer dead UI.
export function SpeechToggle({ enabled, supported, onChange, className }: SpeechToggleProps) {
  if (!supported) return null

  const handleClick = () => onChange(!enabled)

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn off spoken discards' : 'Turn on spoken discards'}
      title={enabled ? 'Discards are spoken aloud' : 'Discards are silent'}
      className={
        className ??
        'px-3 sm:px-4 h-8 sm:h-9 inline-flex items-center gap-2 rounded-md text-xs sm:text-sm font-semibold transition-all'
      }
      style={{
        background: enabled ? 'var(--brand)' : 'rgba(255,255,255,0.08)',
        color: enabled ? 'var(--text-inverse)' : '#A09888',
      }}
    >
      <span aria-hidden="true">{enabled ? 'Speak: On' : 'Speak: Off'}</span>
    </button>
  )
}
