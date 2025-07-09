"use client"

//import type { React } from "react"

import { useState } from "react"
import { AutomataEditor } from "@/components/automata-editor"
import { AutomataControls } from "@/components/automata-controls"
import { SavedAutomata } from "@/components/saved-automata"
import { TeamDialog } from "@/components/team-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Save,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  FileImage,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useAutomata } from "@/hooks/use-automata"
import { useFirebase } from "@/hooks/use-firebase"
import { FirebaseStatus } from "@/components/firebase-status"

export default function HomePage() {
  const {
    automaton,
    setAutomaton,
    addState,
    removeState,
    addTransition,
    removeTransition,
    setStartState,
    setFinalStates,
    testString,
    convertNFAToDFA,
    minimizeDFA,
    clearAutomaton,
    forceTypeReevaluation,
  } = useAutomata()

  const { saveAutomaton, loadAutomaton, deleteAutomaton, savedAutomata, loading, firebaseAvailable } = useFirebase()

  const [automatonName, setAutomatonName] = useState("")
  const [testInput, setTestInput] = useState("")
  const [testResult, setTestResult] = useState<{ accepted: boolean; path?: string[] } | null>(null)
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const handleTestString = () => {
    if (testInput.trim()) {
      const result = testString(testInput.trim())
      setTestResult(result)
    }
  }

  const handleSave = async () => {
    if (automatonName.trim() && automaton) {
      await saveAutomaton(automatonName.trim(), automaton)
      setAutomatonName("")
    }
  }

  const handleLoad = async (id: string) => {
    const loadedAutomaton = await loadAutomaton(id)
    if (loadedAutomaton) {
      setAutomaton(loadedAutomaton)
      // Clear test results when loading a new automaton
      setTestResult(null)
      setTestInput("")
    }
  }

  const handleExportJSON = () => {
    if (automaton) {
      const dataStr = JSON.stringify(automaton, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${automatonName || "automaton"}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportImage = () => {
    // Get the Cytoscape canvas element
    const cyContainer = document.querySelector("[data-cy-container]") as HTMLElement
    if (!cyContainer) {
      console.error("Cytoscape container not found")
      return
    }

    // Try to get the Cytoscape instance from the global window object
    const cyInstance = (window as any).cytoscapeInstance
    if (cyInstance) {
      try {
        // Export as PNG
        const png64 = cyInstance.png({
          output: "base64uri",
          bg: "white",
          full: true,
          scale: 2,
        })

        const link = document.createElement("a")
        link.href = png64
        link.download = `${automatonName || "automaton"}.png`
        link.click()
      } catch (error) {
        console.error("Error exporting image:", error)
        // Fallback: use html2canvas if available
        handleExportImageFallback()
      }
    } else {
      handleExportImageFallback()
    }
  }

  const handleExportImageFallback = () => {
    // Fallback method using canvas screenshot
    const cyContainer = document.querySelector("[data-cy-container]") as HTMLElement
    if (!cyContainer) return

    // Create a canvas to capture the graph
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = cyContainer.getBoundingClientRect()
    canvas.width = rect.width * 2 // Higher resolution
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    // Fill white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${automatonName || "automaton"}.png`
        link.click()
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }

  const handleExportBoth = () => {
    handleExportJSON()
    setTimeout(() => {
      handleExportImage()
    }, 100) // Small delay to avoid browser blocking multiple downloads
  }

  const validateAutomatonStructure = (data: any): boolean => {
    // Check if the imported data has the required structure
    if (!data || typeof data !== "object") {
      return false
    }

    // Check required properties
    const requiredProps = ["states", "transitions", "startState", "finalStates", "type"]
    for (const prop of requiredProps) {
      if (!(prop in data)) {
        console.error(`Missing required property: ${prop}`)
        return false
      }
    }

    // Validate states array
    if (!Array.isArray(data.states)) {
      console.error("States must be an array")
      return false
    }

    // Validate transitions array
    if (!Array.isArray(data.transitions)) {
      console.error("Transitions must be an array")
      return false
    }

    // Validate finalStates array
    if (!Array.isArray(data.finalStates)) {
      console.error("Final states must be an array")
      return false
    }

    // Validate type
    if (!["DFA", "NFA"].includes(data.type)) {
      console.error("Type must be either 'DFA' or 'NFA'")
      return false
    }

    // Validate state structure
    for (const state of data.states) {
      if (!state || typeof state !== "object" || !state.id) {
        console.error("Invalid state structure:", state)
        return false
      }
    }

    // Validate transition structure
    for (const transition of data.transitions) {
      if (
        !transition ||
        typeof transition !== "object" ||
        !transition.from ||
        !transition.to ||
        transition.symbol === undefined
      ) {
        console.error("Invalid transition structure:", transition)
        return false
      }
    }

    return true
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    // Clear previous status
    setImportStatus({ type: null, message: "" })

    if (!file) {
      setImportStatus({
        type: "error",
        message: "No file selected",
      })
      return
    }

    console.log("File selected:", file.name, "Type:", file.type, "Size:", file.size)

    // Check file type
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setImportStatus({
        type: "error",
        message: "Please select a valid JSON file",
      })
      return
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({
        type: "error",
        message: "File is too large. Please select a file smaller than 10MB",
      })
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string
        console.log("File content loaded, length:", fileContent?.length)

        if (!fileContent) {
          throw new Error("File content is empty")
        }

        console.log("First 200 characters:", fileContent.substring(0, 200))

        const imported = JSON.parse(fileContent)
        console.log("JSON parsed successfully:", imported)

        // Validate the structure
        if (!validateAutomatonStructure(imported)) {
          throw new Error("Invalid automaton structure. Please check that the file contains a valid automaton export.")
        }

        console.log("Validation passed, setting automaton...")
        setAutomaton(imported)

        // Clear test results when importing a new automaton
        setTestResult(null)
        setTestInput("")

        setImportStatus({
          type: "success",
          message: `Successfully imported automaton with ${imported.states.length} states and ${imported.transitions.length} transitions`,
        })

        console.log("Import completed successfully")
      } catch (error) {
        console.error("Error importing automaton:", error)
        setImportStatus({
          type: "error",
          message: `Import failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        })
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      setImportStatus({
        type: "error",
        message: "Failed to read the file. Please try again.",
      })
    }

    reader.readAsText(file)

    // Clear the input so the same file can be selected again
    event.target.value = ""
  }

  const handleClear = () => {
    clearAutomaton()
    // Clear all test-related state when clearing the automaton
    setTestResult(null)
    setTestInput("")
    // Clear import status
    setImportStatus({ type: null, message: "" })
  }

  const handleForceReevaluation = () => {
    if (automaton) {
      console.log("=== FORCE RE-EVALUATION ===")
      console.log("Current automaton:", automaton)
      forceTypeReevaluation()
    }
  }

  // Auto-hide import status after 5 seconds
  // React.useEffect(() => {
  //   if (importStatus.type) {
  //     const timer = setTimeout(() => {
  //       setImportStatus({ type: null, message: "" })
  //     }, 5000)
  //     return () => clearTimeout(timer)
  //   }
  // }, [importStatus])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Finite Automata Designer</h1>
            <p className="text-muted-foreground">
              Create, visualize, and test deterministic and non-deterministic finite automata
            </p>
          </div>
          <TeamDialog />
        </div>

        <FirebaseStatus firebaseAvailable={firebaseAvailable} />

        {/* Import Status Alert */}
        {importStatus.type && (
          <Alert
            className={`mb-4 ${importStatus.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={importStatus.type === "success" ? "text-green-800" : "text-red-800"}>
                {importStatus.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Automaton Editor</CardTitle>
                  <div className="flex items-center gap-2">
                    {automaton && (
                      <Badge variant={automaton.type === "DFA" ? "default" : "secondary"}>{automaton.type}</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleClear} disabled={!automaton}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AutomataEditor
                  automaton={automaton}
                  onAddState={addState}
                  onRemoveState={removeState}
                  onAddTransition={addTransition}
                  onRemoveTransition={removeTransition}
                  onSetStartState={setStartState}
                  onSetFinalStates={setFinalStates}
                />
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <AutomataControls
                  automaton={automaton}
                  onConvertNFAToDFA={convertNFAToDFA}
                  onMinimizeDFA={minimizeDFA}
                />
                {/* <div className="mt-4">
                  <Button onClick={handleForceReevaluation} variant="outline" size="sm" disabled={!automaton}>
                    🔄 Debug: Re-check Type
                  </Button>
                </div> */}
              </CardContent>
            </Card>

            {/* String Tester */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>String Tester</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter string to test..."
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTestString()}
                    />
                    <Button onClick={handleTestString} disabled={!automaton || !testInput.trim()}>
                      <Play className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </div>

                  {testResult && (
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={testResult.accepted ? "default" : "destructive"}>
                          {testResult.accepted ? "Accepted" : "Rejected"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Input: "{testInput}"</span>
                      </div>
                      {testResult.path && (
                        <div className="text-sm text-muted-foreground">Path: {testResult.path.join(" → ")}</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Save/Load */}
            <Card>
              <CardHeader>
                <CardTitle>Save & Load</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Automaton Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter name..."
                    value={automatonName}
                    onChange={(e) => setAutomatonName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!automatonName.trim() || !automaton || loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save {firebaseAvailable ? "to Firebase" : "Locally"}
                </Button>

                {!firebaseAvailable && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                    ⚠️ Firebase unavailable - using local storage
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={!automaton} className="w-full bg-transparent">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={handleExportJSON}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportImage}>
                        <FileImage className="w-4 h-4 mr-2" />
                        Export Image
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportBoth}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Both
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <label>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                      <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground">Only JSON files are supported for import</p>
                </div>
              </CardContent>
            </Card>

            {/* Saved Automata */}
            <SavedAutomata automata={savedAutomata} onLoad={handleLoad} onDelete={deleteAutomaton} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}