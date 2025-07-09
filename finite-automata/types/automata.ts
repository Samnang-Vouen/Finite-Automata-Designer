export interface State {
  id: string
}

export interface Transition {
  from: string
  to: string
  symbol: string
}

export interface Automaton {
  states: State[]
  transitions: Transition[]
  startState: string | null
  finalStates: string[]
  type: "DFA" | "NFA"
}

export interface SavedAutomaton {
  id: string
  name: string
  automaton: Automaton
  createdAt: string
}
