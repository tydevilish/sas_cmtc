"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function WeekAttendance({ params }) {
    const [user, setUser] = useState(null)
    const [week, setWeek] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [message, setMessage] = useState({ type: "", text: "" })
    const [selectedLevel, setSelectedLevel] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const router = useRouter()

    const levels = [
        { value: "ปวช.1", label: "ปวช.1" },
        { value: "ปวช.2", label: "ปวช.2" },
        { value: "ปวช.3", label: "ปวช.3" },
        { value: "ปวส.1 สายตรง", label: "ปวส.1 สายตรง" },
        { value: "ปวส.1 สาย ม.6", label: "ปวส.1 สาย ม.6" },
        { value: "ปวส.2 สายตรง", label: "ปวส.2 สายตรง" },
        { value: "ปวส.2 สาย ม.6", label: "ปวส.2 สาย ม.6" }
    ]

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "include",
                })

                if (!res.ok) {
                    return router.push("/login")
                }

                const data = await res.json()
                setUser(data.user)
            } catch (err) {
                router.push("/login")
            }
        }
        checkAuth()
    }, [])

    useEffect(() => {
        async function fetchWeek() {
            if (!user) return
            setIsLoading(true)
            try {
                const queryParams = new URLSearchParams()
                queryParams.append("clubId", params.id)
                queryParams.append("weekId", params.weekId)
                if (selectedLevel) queryParams.append("level", selectedLevel)
                if (searchTerm) queryParams.append("search", searchTerm)

                const res = await fetch("/api/clubs/weeks?" + queryParams.toString(), {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data.week) {
                        setWeek(data.week)
                    } else {
                        router.push(`/clubs/${params.id}`)
                    }
                } else {
                    router.push(`/clubs/${params.id}`)
                }
            } catch (err) {
                router.push(`/clubs/${params.id}`)
            } finally {
                setIsLoading(false)
            }
        }

        fetchWeek()
    }, [user, selectedLevel, searchTerm])

    const handleUpdateAttendance = async (memberId, status) => {
        try {
            const res = await fetch("/api/clubs/weeks", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    weekId: params.weekId,
                    memberId,
                    status
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setWeek({
                    ...week,
                    attendance: week.attendance.map(a =>
                        a.memberId === memberId ? { ...a, status: data.attendance.status } : a
                    )
                })
                setMessage({ type: "success", text: "อัพเดทสถานะเรียบร้อยแล้ว" })
            } else {
                const data = await res.json()
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการอัพเดทสถานะ" })
        }
    }

    if (!user || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    if (!week) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">ไม่พบข้อมูลสัปดาห์</div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.push(`/clubs/${params.id}`)}
                        className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>กลับ</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">สัปดาห์ที่ {week.weekNumber}</h1>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ระดับชั้น
                            </label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            >
                                <option value="">ทั้งหมด</option>
                                {levels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ค้นหา
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาด้วยรหัส หรือชื่อ"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        รหัสนักศึกษา
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อ-นามสกุล
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ระดับชั้น
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        สถานะ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {week.attendance.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.member.student.studentId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.member.student.prefix}{record.member.student.firstName} {record.member.student.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.member.student.level}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <select
                                                value={record.status}
                                                onChange={(e) => handleUpdateAttendance(record.memberId, e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 ${record.status === "present"
                                                        ? "text-green-800 bg-green-50 border-green-200 focus:ring-green-500/20"
                                                        : record.status === "late"
                                                            ? "text-yellow-800 bg-yellow-50 border-yellow-200 focus:ring-yellow-500/20"
                                                            : "text-red-800 bg-red-50 border-red-200 focus:ring-red-500/20"
                                                    }`}
                                            >
                                                <option value="present">มา</option>
                                                <option value="late">สาย</option>
                                                <option value="absent">ขาด</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    )
} 