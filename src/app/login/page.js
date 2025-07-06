"use client"

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"

export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage("")

        try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password
            }),
        })

        const data = await res.json()

        if (res.ok) {
            setMessage("เข้าสู่ระบบสำเร็จ")
            router.push("/dashboard")
        } else {
            setMessage(data.message || "เกิดข้อผิดพลาด")
            }
        } catch (error) {
            setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        async function checkLogin() {
            try {
            const res = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "include",
            });

            if (res.ok) {
                router.push("/dashboard");
                }
            } catch (error) {
                console.error("Error checking login status:", error)
            }
        }
        checkLogin();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 font-sans px-4 py-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative w-48 h-20">
                    <Image
                        src="/images/logo.png"
                        alt="Logo"
                            fill
                            className="object-contain"
                        priority
                    />
                    </div>
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                            Student Attendance System
                        </h2>
                        <p className="text-sm text-gray-500">
                            ยินดีต้อนรับสู่ระบบจัดการการเข้ากิจกรรม
                        </p>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                ชื่อผู้ใช้
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                                    placeholder="กรอกชื่อผู้ใช้"
                            />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                                    placeholder="กรอกรหัสผ่าน"
                            />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังเข้าสู่ระบบ...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                        เข้าสู่ระบบ
                            </>
                        )}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 text-center text-sm p-4 rounded-xl flex items-center justify-center gap-2 ${
                        message === "เข้าสู่ระบบสำเร็จ" 
                            ? "text-green-700 bg-green-50 border border-green-200" 
                            : "text-red-700 bg-red-50 border border-red-200"
                    }`}>
                        {message === "เข้าสู่ระบบสำเร็จ" ? (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
