"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw } from "lucide-react"
import type { Automaton } from "@/types/automata"

interface StringTesterProps {
  automaton: Automaton | null
  onTest: (input: string) => { accepted: boolean; path?: string[] }
}

export function StringTester({ automaton, onTest }: StringTesterProps) {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<
    Array<{
      input: string
      accepted: boolean
      path?: string[]
    }>
  >([])

  const handleTest = () => {
    if (!input.trim() || !automaton) return

    const result = onTest(input.trim())
    setResults((prev) => [
      {
        input: input.trim(),
        ...result,
      },
      ...prev.slice(0, 9),
    ]) // Keep last 10 results
    setInput("")
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>String Tester</CardTitle>
          {results.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter string to test (e.g., 'aab', '101')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleTest()}
            disabled={!automaton}
          />
          <Button onClick={handleTest} disabled={!automaton || !input.trim()}>
            <Play className="w-4 h-4 mr-2" />
            Test
          </Button>
        </div>

        {!automaton && (
          <p className="text-sm text-muted-foreground text-center py-4">Create an automaton to test strings</p>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">"{result.input}"</span>
                    <Badge variant={result.accepted ? "default" : "destructive"}>
                      {result.accepted ? "Accepted" : "Rejected"}
                    </Badge>
                  </div>
                  {result.path && <div className="text-xs text-muted-foreground">Path: {result.path.join(" → ")}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
