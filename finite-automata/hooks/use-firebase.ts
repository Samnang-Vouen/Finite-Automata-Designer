"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Automaton, SavedAutomaton } from "@/types/automata"

export function useFirebase() {
  const [savedAutomata, setSavedAutomata] = useState<SavedAutomaton[]>([])
  const [loading, setLoading] = useState(false)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)

  useEffect(() => {
    // Check if Firebase is available
    setFirebaseAvailable(!!db)
    if (db) {
      loadSavedAutomata()
    }
  }, [])

  const loadSavedAutomata = async () => {
    if (!db) {
      console.warn("Firebase not available, using local storage fallback")
      loadFromLocalStorage()
      return
    }

    setLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "automata"))
      const automata: SavedAutomaton[] = []

      querySnapshot.forEach((doc) => {
        automata.push({
          id: doc.id,
          ...doc.data(),
        } as SavedAutomaton)
      })

      // Sort by creation date, newest first
      automata.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setSavedAutomata(automata)
    } catch (error) {
      console.error("Error loading automata from Firebase:", error)
      // Fallback to local storage
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const saveAutomaton = async (name: string, automaton: Automaton) => {
    if (!db) {
      console.warn("Firebase not available, saving to local storage")
      saveToLocalStorage(name, automaton)
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "automata"), {
        name,
        automaton,
        createdAt: new Date().toISOString(),
      })

      // Add to local state
      const newSaved: SavedAutomaton = {
        id: docRef.id,
        name,
        automaton,
        createdAt: new Date().toISOString(),
      }

      setSavedAutomata((prev) => [newSaved, ...prev])
    } catch (error) {
      console.error("Error saving automaton to Firebase:", error)
      // Fallback to local storage
      saveToLocalStorage(name, automaton)
    } finally {
      setLoading(false)
    }
  }

  const loadAutomaton = async (id: string): Promise<Automaton | null> => {
    if (!db) {
      return loadFromLocalStorageById(id)
    }

    setLoading(true)
    try {
      const docRef = doc(db, "automata", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as SavedAutomaton
        return data.automaton
      }

      return null
    } catch (error) {
      console.error("Error loading automaton from Firebase:", error)
      return loadFromLocalStorageById(id)
    } finally {
      setLoading(false)
    }
  }

  const deleteAutomaton = async (id: string) => {
    if (!db) {
      deleteFromLocalStorage(id)
      return
    }

    setLoading(true)
    try {
      await deleteDoc(doc(db, "automata", id))
      setSavedAutomata((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Error deleting automaton from Firebase:", error)
      deleteFromLocalStorage(id)
    } finally {
      setLoading(false)
    }
  }

  // Local storage fallback functions
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("finite-automata-saved")
      if (stored) {
        const automata = JSON.parse(stored) as SavedAutomaton[]
        automata.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setSavedAutomata(automata)
      }
    } catch (error) {
      console.error("Error loading from local storage:", error)
    }
  }

  const saveToLocalStorage = (name: string, automaton: Automaton) => {
    try {
      const newSaved: SavedAutomaton = {
        id: Date.now().toString(),
        name,
        automaton,
        createdAt: new Date().toISOString(),
      }

      const existing = JSON.parse(localStorage.getItem("finite-automata-saved") || "[]") as SavedAutomaton[]
      const updated = [newSaved, ...existing]

      localStorage.setItem("finite-automata-saved", JSON.stringify(updated))
      setSavedAutomata(updated)
    } catch (error) {
      console.error("Error saving to local storage:", error)
    }
  }

  const loadFromLocalStorageById = (id: string): Automaton | null => {
    try {
      const stored = localStorage.getItem("finite-automata-saved")
      if (stored) {
        const automata = JSON.parse(stored) as SavedAutomaton[]
        const found = automata.find((a) => a.id === id)
        return found ? found.automaton : null
      }
    } catch (error) {
      console.error("Error loading from local storage:", error)
    }
    return null
  }

  const deleteFromLocalStorage = (id: string) => {
    try {
      const stored = localStorage.getItem("finite-automata-saved")
      if (stored) {
        const automata = JSON.parse(stored) as SavedAutomaton[]
        const filtered = automata.filter((a) => a.id !== id)
        localStorage.setItem("finite-automata-saved", JSON.stringify(filtered))
        setSavedAutomata(filtered)
      }
    } catch (error) {
      console.error("Error deleting from local storage:", error)
    }
  }

  return {
    savedAutomata,
    saveAutomaton,
    loadAutomaton,
    deleteAutomaton,
    loading,
    firebaseAvailable,
  }
}
