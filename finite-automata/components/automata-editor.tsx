"use client"

import { useEffect, useRef } from "react"
import cytoscape from "cytoscape"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import type { Automaton, State, Transition } from "@/types/automata"
import { useState } from "react"

interface AutomataEditorProps {
  automaton: Automaton | null
  onAddState: (state: State) => void
  onRemoveState: (stateId: string) => void
  onAddTransition: (transition: Transition) => void
  onRemoveTransition: (from: string, to: string, symbol: string) => void
  onSetStartState: (stateId: string) => void
  onSetFinalStates: (stateIds: string[]) => void
}

export function AutomataEditor({
  automaton,
  onAddState,
  onRemoveState,
  onAddTransition,
  onRemoveTransition,
  onSetStartState,
  onSetFinalStates,
}: AutomataEditorProps) {
  const cyRef = useRef<HTMLDivElement>(null)
  const cyInstance = useRef<cytoscape.Core | null>(null)
  const [newStateName, setNewStateName] = useState("")
  const [transitionFrom, setTransitionFrom] = useState("")
  const [transitionTo, setTransitionTo] = useState("")
  const [transitionSymbol, setTransitionSymbol] = useState("")

  // Helper function to normalize epsilon input
  const normalizeEpsilon = (symbol: string): string => {
    if (symbol.toLowerCase() === "e" || symbol === "ε" || symbol === "") {
      return "ε"
    }
    return symbol
  }

  useEffect(() => {
    if (!cyRef.current) return

    // Initialize Cytoscape
    cyInstance.current = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#3b82f6",
            label: "data(id)",
            "text-valign": "center",
            "text-halign": "center",
            color: "white",
            "font-size": "14px",
            width: "40px",
            height: "40px",
          },
        },
        {
          selector: "node.start",
          style: {
            "background-color": "#10b981",
            "border-width": "3px",
            "border-color": "#059669",
          },
        },
        {
          selector: "node.final",
          style: {
            "background-color": "#f59e0b",
            "border-width": "3px",
            "border-color": "#d97706",
          },
        },
        {
          selector: "node.start.final",
          style: {
            "background-color": "#8b5cf6",
            "border-width": "3px",
            "border-color": "#7c3aed",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#6b7280",
            "target-arrow-color": "#6b7280",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(symbol)",
            "font-size": "12px",
            "text-background-color": "white",
            "text-background-opacity": 0.8,
            "text-background-padding": "2px",
          },
        },
      ],
      layout: {
        name: "circle",
        radius: 100,
      },
    })

    // Store the Cytoscape instance globally for export functionality
    ;(window as any).cytoscapeInstance = cyInstance.current

    // Add click handlers for left click (set start state)
    cyInstance.current.on("tap", "node", (evt) => {
      const node = evt.target
      const nodeId = node.id()
      onSetStartState(nodeId)
    })

    // Prevent context menu and add separate right-click handler
    if (cyRef.current) {
      cyRef.current.addEventListener("contextmenu", (e) => {
        e.preventDefault()
      })

      // Add explicit right-click handler
      cyRef.current.addEventListener("mousedown", (e) => {
        if (e.button === 2) {
          // Right click
          const position = { x: e.offsetX, y: e.offsetY }
          const nodeUnderCursor =
            cyInstance.current?.nodes(":selected") ||
            cyInstance.current?.nodes().filter((node) => {
              const renderedPosition = node.renderedPosition()
              const renderedWidth = node.renderedWidth()
              const renderedHeight = node.renderedHeight()

              return (
                Math.abs(renderedPosition.x - position.x) < renderedWidth / 2 &&
                Math.abs(renderedPosition.y - position.y) < renderedHeight / 2
              )
            })

          if (nodeUnderCursor && nodeUnderCursor.length > 0) {
            const nodeId = nodeUnderCursor[0].id()
            const currentFinalStates = automaton?.finalStates || []
            const newFinalStates = currentFinalStates.includes(nodeId)
              ? currentFinalStates.filter((id) => id !== nodeId)
              : [...currentFinalStates, nodeId]
            onSetFinalStates(newFinalStates)
          }
        }
      })
    }

    return () => {
      cyInstance.current?.destroy()
      // Clean up global reference
      ;(window as any).cytoscapeInstance = null
    }
  }, [automaton, onSetFinalStates, onSetStartState])

  const toggleFinalState = (stateId: string) => {
    if (!automaton) return

    const currentFinalStates = automaton.finalStates || []
    const newFinalStates = currentFinalStates.includes(stateId)
      ? currentFinalStates.filter((id) => id !== stateId)
      : [...currentFinalStates, stateId]

    onSetFinalStates(newFinalStates)
  }

  useEffect(() => {
    if (!cyInstance.current || !automaton) return

    // Clear existing elements
    cyInstance.current.elements().remove()

    // Add states
    const nodes = automaton.states.map((state) => ({
      data: { id: state.id },
      classes: [
        state.id === automaton.startState ? "start" : "",
        automaton.finalStates.includes(state.id) ? "final" : "",
      ]
        .filter(Boolean)
        .join(" "),
    }))

    // Add transitions
    const edges = automaton.transitions.map((transition) => ({
      data: {
        id: `${transition.from}-${transition.to}-${transition.symbol}`,
        source: transition.from,
        target: transition.to,
        symbol: transition.symbol,
      },
    }))

    cyInstance.current.add([...nodes, ...edges])
    cyInstance.current.layout({ name: "circle", radius: 100 }).run()
  }, [automaton])

  const handleAddState = () => {
    if (newStateName.trim()) {
      onAddState({ id: newStateName.trim() })
      setNewStateName("")
    }
  }

  const handleAddTransition = () => {
    if (transitionFrom && transitionTo && transitionSymbol) {
      const normalizedSymbol = normalizeEpsilon(transitionSymbol.trim())
      onAddTransition({
        from: transitionFrom,
        to: transitionTo,
        symbol: normalizedSymbol,
      })
      setTransitionFrom("")
      setTransitionTo("")
      setTransitionSymbol("")
    }
  }

  return (
    <div className="space-y-4">
      {/* Graph Visualization */}
      <div
        ref={cyRef}
        data-cy-container
        className="w-full h-96 border rounded-lg bg-gray-50"
        style={{ minHeight: "400px" }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
          <span>Start State</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-600"></div>
          <span>Final State</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-600"></div>
          <span>Start & Final</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Add State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="state-name">State Name</Label>
              <Input
                id="state-name"
                placeholder="q0"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddState()}
              />
            </div>
            <Button onClick={handleAddState} disabled={!newStateName.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add State
            </Button>
            <p className="text-xs text-muted-foreground">
              Click state to set as start • Right-click to toggle final state • Or use the buttons in the States list
              below
            </p>
          </CardContent>
        </Card>

        {/* Add Transition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Transition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  placeholder="q0"
                  value={transitionFrom}
                  onChange={(e) => setTransitionFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="a"
                  value={transitionSymbol}
                  onChange={(e) => setTransitionSymbol(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  placeholder="q1"
                  value={transitionTo}
                  onChange={(e) => setTransitionTo(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddTransition}
              disabled={!transitionFrom || !transitionTo || !transitionSymbol}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transition
            </Button>
            <p className="text-xs text-muted-foreground">Input one transition at a time • For epsilon transitions, use "e", "E", or "ε"</p>
          </CardContent>
        </Card>
      </div>

      {/* Current States and Transitions */}
      {automaton && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {automaton.states.map((state) => {
                  const isStartState = state.id === automaton.startState
                  const isFinalState = automaton.finalStates.includes(state.id)

                  return (
                    <div key={state.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span>{state.id}</span>
                        {isStartState && <Badge variant="secondary">Start</Badge>}
                        {isFinalState && <Badge variant="outline">Final</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFinalState(state.id)}
                          title={isFinalState ? "Remove final state" : "Set as final state"}
                        >
                          {isFinalState ? "Remove Final" : "Set Final"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveState(state.id)}
                          disabled={isStartState}
                          title={isStartState ? "Cannot remove start state" : "Remove state"}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {automaton.startState && (
                <div className="mt-3 text-xs text-muted-foreground bg-blue-50 p-2 rounded border">
                  💡 The start state ({automaton.startState}) cannot be removed. To change the start state, click on a
                  different state.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {automaton.transitions.map((transition, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">
                      {transition.from} → {transition.to} ({transition.symbol})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveTransition(transition.from, transition.to, transition.symbol)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
