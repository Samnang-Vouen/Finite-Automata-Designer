"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, Loader2 } from "lucide-react"
import type { SavedAutomaton } from "@/types/automata"

interface SavedAutomataProps {
  automata: SavedAutomaton[]
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  loading: boolean
}

export function SavedAutomata({ automata, onLoad, onDelete, loading }: SavedAutomataProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Automata</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : automata.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No saved automata yet</p>
        ) : (
          <div className="space-y-3">
            {automata.map((saved) => (
              <div key={saved.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{saved.name}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(saved.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {saved.automaton?.type ?? "Unknown"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {(saved.automaton?.states?.length ?? 0)} states • {(saved.automaton?.transitions?.length ?? 0)} transitions
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onLoad(saved.id)} className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Load
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(saved.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
