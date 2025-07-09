"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Minimize2, AlertTriangle } from "lucide-react"
import type { Automaton } from "@/types/automata"
import { AutomataEngine } from "@/lib/automata-engine"

interface AutomataControlsProps {
  automaton: Automaton | null
  onConvertNFAToDFA: () => void
  onMinimizeDFA: () => void
}

export function AutomataControls({ automaton, onConvertNFAToDFA, onMinimizeDFA }: AutomataControlsProps) {
  if (!automaton) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Create an automaton to see available operations
        </CardContent>
      </Card>
    )
  }

  const analysis = AutomataEngine.analyzeAutomaton(automaton)
  const isCompleteDFA = AutomataEngine.isCompleteDFA(automaton)

  // Get alphabet
  const alphabet = Array.from(new Set(automaton.transitions.map((t) => t.symbol).filter((s) => s !== "ε" && s !== "")))

  return (
    <div className="space-y-4">
      {/* Automaton Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Automaton Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Type:</span>
            <Badge variant={automaton.type === "DFA" ? "default" : "secondary"}>{automaton.type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>States:</span>
            <span>{automaton.states.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Transitions:</span>
            <span>{automaton.transitions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Start State:</span>
            <span>{automaton.startState || "None"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Final States:</span>
            <span>{automaton.finalStates.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Alphabet Size:</span>
            <span>{alphabet.length}</span>
          </div>

          {/* NFA Characteristics */}
          {analysis.hasEpsilonTransitions && (
            <div className="flex items-center justify-between">
              <span>Epsilon Transitions:</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {analysis.epsilonTransitions.length}
              </Badge>
            </div>
          )}

          {analysis.hasNondeterministicTransitions && (
            <div className="flex items-center justify-between">
              <span>Nondeterministic:</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Yes
              </Badge>
            </div>
          )}

          {automaton.type === "DFA" && !isCompleteDFA && (
            <div className="flex items-center justify-between">
              <span>Complete DFA:</span>
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                No
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFA Details */}
      {(analysis.hasEpsilonTransitions || analysis.hasNondeterministicTransitions) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              NFA Characteristics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.hasEpsilonTransitions && (
              <div>
                <h4 className="font-medium text-sm mb-2">Epsilon Transitions:</h4>
                <div className="space-y-1">
                  {analysis.epsilonTransitions.map((transition, index) => (
                    <div key={index} className="text-xs bg-orange-50 p-2 rounded border border-orange-200">
                      {transition.from} → {transition.to} (ε)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.hasNondeterministicTransitions && (
              <div>
                <h4 className="font-medium text-sm mb-2">Nondeterministic Transitions:</h4>
                <div className="space-y-1">
                  {analysis.nondeterministicTransitions.map((nd, index) => (
                    <div key={index} className="text-xs bg-orange-50 p-2 rounded border border-orange-200">
                      {nd.from} on '{nd.symbol}' → {nd.destinations.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {automaton.type === "NFA" && (
            <>
              <Button onClick={onConvertNFAToDFA} className="w-full" variant="default">
                <ArrowRight className="w-4 h-4 mr-2" />
                Convert NFA to DFA
              </Button>
              <p className="text-xs text-muted-foreground">
                {analysis.hasEpsilonTransitions
                  ? "Convert this epsilon-NFA to a deterministic finite automaton"
                  : "Convert this non-deterministic finite automaton to a deterministic one"}
              </p>
              <Separator />
            </>
          )}

          {automaton.type === "DFA" && (
            <>
              <Button onClick={onMinimizeDFA} className="w-full bg-transparent" variant="outline">
                <Minimize2 className="w-4 h-4 mr-2" />
                Minimize DFA
              </Button>
              <p className="text-xs text-muted-foreground">
                Remove unreachable and equivalent states to create a minimal DFA
              </p>
            </>
          )}

          {automaton.type === "DFA" && !isCompleteDFA && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
              ⚠️ This DFA is incomplete - some states lack transitions for all alphabet symbols
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alphabet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alphabet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {alphabet.map((symbol) => (
              <Badge key={symbol} variant="outline">
                {symbol}
              </Badge>
            ))}
            {analysis.hasEpsilonTransitions && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                ε
              </Badge>
            )}
          </div>
          {alphabet.length === 0 && !analysis.hasEpsilonTransitions && (
            <p className="text-sm text-muted-foreground">No transitions defined</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
