"use client"

import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function RootLayoutClient({ children }) {
    const [user, setUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (err) {
                console.error("Error fetching user:", err)
            }
        }

        fetchUser()
    }, [])

    const handleLogout = async () => {
        const res = await fetch("/api/auth/logout", {
            method: "POST",
        })
        if (res.ok) {
            setUser(null)
            router.push("/login")
        }
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            {children}
            <Footer />
        </>
    )
}
