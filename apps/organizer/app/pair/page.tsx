"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SmartPhone01Icon,
  QrCodeIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  RefreshIcon,
  FlashIcon,
  Camera01Icon,
  Wifi01Icon,
  WifiDisconnected01Icon,
  Logout01Icon,
  AlertCircleIcon,
  Search01Icon,
  Tick02Icon,
  Shield01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Audio Synthesizer (Web Audio API - 0 external asset dependencies)
// ─────────────────────────────────────────────────────────────────────────────
class GateAudioFeedback {
  private ctx: AudioContext | null = null

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  playSuccessChime() {
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = "sine"
      osc1.frequency.setValueAtTime(880, now) // A5
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12) // A6

      osc2.type = "sine"
      osc2.frequency.setValueAtTime(1320, now + 0.08) // E6
      osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.22) // E7

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.15)
      osc2.start(now + 0.08)
      osc2.stop(now + 0.35)
    } catch {
      // AudioContext policy fallback
    }
  }

  playErrorBuzz() {
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(110, now + 0.25)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch {
      // AudioContext policy fallback
    }
  }
}

const audioFeedback = new GateAudioFeedback()

// Trigger haptic vibration
function triggerHaptic(type: "success" | "error") {
  if (typeof window !== "undefined" && navigator.vibrate) {
    if (type === "success") {
      navigator.vibrate(100)
    } else {
      navigator.vibrate([150, 100, 150])
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PairedSession {
  token: string
  event: { id: string; title: string }
  device: { id: string; name: string }
  assignment: { id: string; status: string; starts_at?: string | null; ends_at?: string | null }
  zones: Array<{ id: string; name: string }>
  expires_at?: string | null
}

interface ScanResultView {
  type: "success" | "error"
  headline: string
  detail: string
  attendeeName?: string
  tier?: string
  zone?: string
  timestamp: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export default function ScannerPairPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [installationId, setInstallationId] = useState<string>("")
  const [pairedSession, setPairedSession] = useState<PairedSession | null>(null)
  const [isPairing, setIsPairing] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null)

  // Pairing View State (when not paired)
  const [pairingMethod, setPairingMethod] = useState<"code" | "camera">("code")
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""])
  const [deviceName, setDeviceName] = useState<string>("")
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Camera Scanner View State
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [manualTicketInput, setManualTicketInput] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResultView | null>(null)
  const [completedScanCount, setCompletedScanCount] = useState<number>(0)

  // ── 1. App Startup & Installation Identity ────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Persistent Installation ID
    let storedId = localStorage.getItem("installation_id")
    if (!storedId) {
      storedId = crypto.randomUUID()
      localStorage.setItem("installation_id", storedId)
    }
    setInstallationId(storedId)

    // Device Name default
    const userAgent = navigator.userAgent
    let defaultDevice = "Gate Mobile Scanner"
    if (/iPhone|iPad/i.test(userAgent)) defaultDevice = "iPhone Gate Scanner"
    else if (/Android/i.test(userAgent)) defaultDevice = "Android Gate Scanner"
    setDeviceName(defaultDevice)

    // Online / Offline listener
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check stored session
    const storedToken = localStorage.getItem("scanner_session_token")
    const storedSessionJson = localStorage.getItem("scanner_paired_session")
    if (storedToken && storedSessionJson) {
      try {
        const parsed = JSON.parse(storedSessionJson)
        setPairedSession(parsed)
      } catch {
        localStorage.removeItem("scanner_paired_session")
      }
    }

    // ── 2. Handling the SMS Link / QR URL (URL Hash) ───────────────────────
    // When staff clicks SMS link or scans QR, URL looks like: /pair#invitation_id=...&token=...
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const pairingToken = hashParams.get("token")

      if (pairingToken) {
        // Clean the browser URL bar immediately for clean UI and privacy
        window.history.replaceState(null, "", window.location.pathname)

        // Automatically pair using token
        executePairing({
          pairing_method: "sms_link",
          pairing_token: pairingToken,
          installation_id: storedId,
          device_name: defaultDevice,
        })
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // ── 3. Pairing API Call (POST /scanner/pair) ──────────────────────────────
  const executePairing = async (payload: {
    pairing_method: "short_code" | "sms_link" | "organizer_qr"
    pairing_code?: string
    pairing_token?: string
    installation_id: string
    device_name: string
  }) => {
    setIsPairing(true)
    setRevokedMessage(null)

    try {
      const res = await fetch(`${BASE_URL}/scanner/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.errors?.base?.[0] || "Pairing failed")
      }

      const pairingData = data.data
      const sessionToken = pairingData.scanner_session_token

      if (sessionToken) {
        localStorage.setItem("scanner_session_token", sessionToken)
      }

      const sessionObj: PairedSession = {
        token: sessionToken || (localStorage.getItem("scanner_session_token") ?? ""),
        event: pairingData.event,
        device: pairingData.device,
        assignment: pairingData.assignment,
        zones: pairingData.zones || [],
        expires_at: pairingData.expires_at,
      }

      localStorage.setItem("scanner_paired_session", JSON.stringify(sessionObj))
      setPairedSession(sessionObj)
      toast.success("Scanner paired successfully!", {
        description: `Authorized for ${pairingData.event?.title || "the event"}`,
      })
      audioFeedback.playSuccessChime()
      triggerHaptic("success")
    } catch (err: any) {
      toast.error("Pairing Error", {
        description: err.message || "Invalid or expired pairing code",
      })
      audioFeedback.playErrorBuzz()
      triggerHaptic("error")
    } finally {
      setIsPairing(false)
    }
  }

  // ── PIN Input handlers ────────────────────────────────────────────────────
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...pinDigits]
    newDigits[index] = value.slice(-1)
    setPinDigits(newDigits)

    // Auto advance focus
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus()
    }

    // Auto submit if all 6 digits entered
    const fullCode = newDigits.join("")
    if (fullCode.length === 6 && !newDigits.some((d) => d === "")) {
      executePairing({
        pairing_method: "short_code",
        pairing_code: fullCode,
        installation_id: installationId,
        device_name: deviceName || "Gate Scanner",
      })
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus()
    }
  }

  const handleManualPairSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = pinDigits.join("")
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code")
      return
    }

    executePairing({
      pairing_method: "short_code",
      pairing_code: fullCode,
      installation_id: installationId,
      device_name: deviceName || "Gate Scanner",
    })
  }

  // ── 4. Ticket Verification / Admission Action ─────────────────────────────
  const handleVerifyTicket = async (ticketCode: string) => {
    if (!pairedSession || !ticketCode.trim() || isVerifying) return

    setIsVerifying(true)
    const scannedAt = new Date().toISOString()
    const clientScanId = crypto.randomUUID()

    try {
      // Post to verification or lookup endpoint
      const res = await fetch(`${BASE_URL}/scanner/events/${pairedSession.event.id}/lookups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pairedSession.token}`,
          "Idempotency-Key": clientScanId,
        },
        body: JSON.stringify({
          lookup: {
            method: "code",
            query: ticketCode.trim(),
            client_scan_id: clientScanId,
            scanned_at: scannedAt,
            reason_code: "turnstile_scan",
          },
        }),
      })

      if (res.status === 401) {
        // Organizer revoked device!
        handleLockoutDetected()
        return
      }

      const data = await res.json()

      if (!res.ok || !data.success) {
        // Invalid or error
        const errMsg = data.message || "Invalid ticket credential"
        setLastScanResult({
          type: "error",
          headline: "DENIED / INVALID",
          detail: errMsg,
          timestamp: new Date().toLocaleTimeString(),
        })
        audioFeedback.playErrorBuzz()
        triggerHaptic("error")
        return
      }

      // Successful admission
      const match = data.data?.matches?.[0]
      const attendeeName = match?.attendee_name || "Guest Attendee"
      const tier = match?.ticket_type_name || "General Admission"

      setLastScanResult({
        type: "success",
        headline: "CHECKED IN",
        detail: "Ticket verified & admitted successfully",
        attendeeName,
        tier,
        zone: pairedSession.zones[0]?.name || "Gate Checkpoint",
        timestamp: new Date().toLocaleTimeString(),
      })
      setCompletedScanCount((prev) => prev + 1)
      audioFeedback.playSuccessChime()
      triggerHaptic("success")
      setManualTicketInput("")
    } catch (err: any) {
      setLastScanResult({
        type: "error",
        headline: "SCAN ERROR",
        detail: err.message || "Connection error during validation",
        timestamp: new Date().toLocaleTimeString(),
      })
      audioFeedback.playErrorBuzz()
      triggerHaptic("error")
    } finally {
      setIsVerifying(false)
    }
  }

  // ── 5. Clean Lockout Handling ─────────────────────────────────────────────
  const handleLockoutDetected = () => {
    localStorage.removeItem("scanner_session_token")
    localStorage.removeItem("scanner_paired_session")
    setPairedSession(null)
    setRevokedMessage("Scanner session revoked by organizer. Tap below to pair a new device.")
    audioFeedback.playErrorBuzz()
    triggerHaptic("error")
  }

  const handleUnpair = () => {
    if (confirm("Are you sure you want to disconnect this scanner?")) {
      localStorage.removeItem("scanner_session_token")
      localStorage.removeItem("scanner_paired_session")
      setPairedSession(null)
      toast.info("Scanner unlinked")
    }
  }

  // ── Camera toggle for QR Scanning ─────────────────────────────────────────
  const startCamera = async () => {
    try {
      setCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      toast.error("Camera access denied or unavailable", {
        description: "Please check camera permissions in your mobile browser settings.",
      })
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: 1. PAIRED GATE SCANNING TERMINAL
  // ─────────────────────────────────────────────────────────────────────────
  if (pairedSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-md mx-auto relative select-none">
        {/* Full-screen Sensory Result Flash Overlay */}
        {lastScanResult && (
          <div
            className={cn(
              "fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-white text-center transition-opacity duration-200 animate-in fade-in",
              lastScanResult.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            )}
            onClick={() => setLastScanResult(null)}
          >
            <div className="flex size-24 items-center justify-center rounded-full bg-white/20 mb-4 animate-bounce">
              <HugeiconsIcon
                icon={lastScanResult.type === "success" ? CheckmarkCircle01Icon : Cancel01Icon}
                size={54}
                strokeWidth={2.5}
              />
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase mb-2">
              {lastScanResult.headline}
            </h1>
            <p className="text-lg font-medium opacity-95 max-w-xs mb-4">
              {lastScanResult.detail}
            </p>

            {lastScanResult.attendeeName && (
              <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20 space-y-1 my-2 max-w-xs w-full">
                <p className="text-xs uppercase tracking-widest text-white/70">Attendee</p>
                <p className="text-xl font-bold">{lastScanResult.attendeeName}</p>
                {lastScanResult.tier && (
                  <Badge variant="secondary" className="bg-white text-black font-bold text-xs mt-1">
                    {lastScanResult.tier}
                  </Badge>
                )}
              </div>
            )}

            <p className="text-xs text-white/70 mt-6">
              Tap anywhere to scan next attendee ({lastScanResult.timestamp})
            </p>
          </div>
        )}

        {/* Terminal Header */}
        <header className="p-4 border-b bg-card/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base truncate max-w-[200px]">
                {pairedSession.event.title}
              </span>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{pairedSession.device.name}</span>
              <span>•</span>
              <span className="font-semibold text-primary">{completedScanCount} scans</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={isOnline ? "success" : "warning"}
              className="text-[10px] gap-1 px-2 py-0.5"
            >
              <HugeiconsIcon icon={isOnline ? Wifi01Icon : WifiDisconnected01Icon} size={11} />
              {isOnline ? "Online" : "Offline"}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={handleUnpair}
              title="Disconnect scanner"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
            </Button>
          </div>
        </header>

        {/* Terminal Content: Camera & Inputs */}
        <main className="flex-1 p-4 flex flex-col gap-4">
          {/* Active Gate Zones Card */}
          <div className="p-2.5 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={15} className="text-primary shrink-0" />
              <span className="font-medium text-muted-foreground">Gate Scope:</span>
              <span className="font-bold text-foreground">
                {pairedSession.zones.length === 0
                  ? "All Current Zones"
                  : pairedSession.zones.map((z) => z.name).join(", ")}
              </span>
            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-black flex items-center justify-center border-2 border-border shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6 text-muted-foreground">
                <div className="size-14 rounded-full bg-muted/20 flex items-center justify-center text-primary">
                  <HugeiconsIcon icon={Camera01Icon} size={28} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Camera Viewfinder</p>
                  <p className="text-xs text-muted-foreground">
                    Tap below to start continuous gate QR code scanning.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 shadow-xs"
                  onClick={startCamera}
                >
                  <HugeiconsIcon icon={Camera01Icon} size={15} />
                  Start Camera Scanner
                </Button>
              </div>
            )}

            {cameraActive && (
              <>
                {/* Aiming Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-full">
                    Point at Ticket QR
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 text-xs bg-black/70 text-white hover:bg-black/90 border border-white/20"
                  onClick={stopCamera}
                >
                  Stop Camera
                </Button>
              </>
            )}
          </div>

          {/* Quick Manual Code / Search Input */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Manual Ticket Entry / PNR</span>
              <span className="text-[11px] text-muted-foreground">Scan or type</span>
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 8-digit code or ticket number"
                value={manualTicketInput}
                onChange={(e) => setManualTicketInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyTicket(manualTicketInput)
                  }
                }}
                disabled={isVerifying}
                className="font-mono text-sm tracking-wider uppercase h-11 rounded-xl"
              />
              <Button
                className="h-11 px-4 rounded-xl shadow-xs"
                disabled={!manualTicketInput.trim() || isVerifying}
                onClick={() => handleVerifyTicket(manualTicketInput)}
              >
                {isVerifying ? (
                  <HugeiconsIcon icon={RefreshIcon} size={16} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                )}
              </Button>
            </div>
          </div>
        </main>

        {/* Terminal Footer */}
        <footer className="p-4 border-t bg-muted/10 text-center text-[11px] text-muted-foreground">
          DEGES Instant Gate Pairing • ID: {installationId.slice(0, 8)}...
        </footer>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: 2. WELCOME / PAIRING SCREEN (DISTRACTION-FREE)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-md mx-auto p-6">
      {/* Brand Header */}
      <header className="flex flex-col items-center text-center pt-8 pb-4">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg mb-4">
          <HugeiconsIcon icon={SmartPhone01Icon} size={28} strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">DEGES Gate Scanner</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Instant Device Pairing. No usernames, passwords, or SMS OTPs required.
        </p>
      </header>

      {/* Main Pairing Form */}
      <main className="flex-1 flex flex-col justify-center space-y-6">
        {/* Revoked Notice if present */}
        {revokedMessage && (
          <div className="p-3 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0" />
            <p className="leading-relaxed">{revokedMessage}</p>
          </div>
        )}

        {/* 6-Box PIN Input Card */}
        <div className="p-6 rounded-3xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-5 text-center">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Enter 6-Digit Gate Code
            </h2>
            <p className="text-xs text-muted-foreground">
              Ask your event organizer for the 6-digit code displayed on their screen.
            </p>
          </div>

          <form onSubmit={handleManualPairSubmit} className="space-y-4">
            <div className="flex justify-center gap-2">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    pinInputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  disabled={isPairing}
                  className="size-11 sm:size-12 text-center text-2xl font-mono font-black rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-2xl shadow-xs font-semibold text-xs"
              disabled={isPairing || pinDigits.some((d) => !d)}
            >
              {isPairing ? (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={RefreshIcon} size={16} className="animate-spin" />
                  Pairing Device...
                </div>
              ) : (
                "Authorize & Start Scanning"
              )}
            </Button>
          </form>
        </div>

        {/* Alternative Action: Scan Organizer QR */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">Or pair in 2 seconds with camera</p>
          <Button
            variant="outline"
            className="w-full h-11 rounded-2xl text-xs gap-2"
            onClick={() => {
              toast.info("Point camera at organizer screen", {
                description: "Scan the pairing QR shown on the organizer's dashboard",
              })
              startCamera()
            }}
          >
            <HugeiconsIcon icon={QrCodeIcon} size={16} />
            Scan Organizer QR Code
          </Button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center py-4 text-[11px] text-muted-foreground space-y-1">
        <p>DEGES Instant Gate Pairing Protocol</p>
        <p className="font-mono text-[10px] text-muted-foreground/60">
          Device ID: {installationId || "Initializing..."}
        </p>
      </footer>
    </div>
  )
}
