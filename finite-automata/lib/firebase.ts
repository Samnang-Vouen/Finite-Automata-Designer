"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAk5QMYIsUBpDXYeG368Tes7URCPVgySpI",
  authDomain: "automata-project-21892.firebaseapp.com",
  projectId: "automata-project-21892",
  storageBucket: "automata-project-21892.firebasestorage.app",
  messagingSenderId: "363460958354",
  appId: "1:363460958354:web:24df70a5188bd7d2972e4b",
  measurementId: "G-L5YHT3B1BF",
}

// Initialize Firebase only if it hasn't been initialized
let app
let db

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = getFirestore(app)
} catch (error) {
  console.error("Firebase initialization error:", error)
  // Create a mock db object for development
  db = null
}

export { db }
