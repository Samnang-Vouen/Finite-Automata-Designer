"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface FirebaseStatusProps {
  firebaseAvailable: boolean
}

export function FirebaseStatus({ firebaseAvailable }: FirebaseStatusProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Alert className={`mb-4 ${firebaseAvailable ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex items-center gap-2">
        {firebaseAvailable ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        <AlertDescription className={firebaseAvailable ? "text-green-800" : "text-amber-800"}>
          {firebaseAvailable
            ? "Connected to Firebase - your automata will be saved to the cloud"
            : "Firebase unavailable - automata will be saved locally in your browser"}
        </AlertDescription>
      </div>
    </Alert>
  )
}
