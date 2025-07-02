"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function EventAttendance({ params }) {
    const [user, setUser] = useState(null)
    const [event, setEvent] = useState(null)
    const [attendance, setAttendance] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [message, setMessage] = useState({ type: "", text: "" })
    const [selectedLevel, setSelectedLevel] = useState("")
    const [selectedTrack, setSelectedTrack] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const router = useRouter()

    const levels = [
        { value: "ปวช.1", label: "ปวช.1" },
        { value: "ปวช.2", label: "ปวช.2" },
        { value: "ปวช.3", label: "ปวช.3" },
        { value: "ปวส.1", label: "ปวส.1" },
        { value: "ปวส.2", label: "ปวส.2" }
    ]

    const tracks = [
        { value: "สายตรง", label: "สายตรง" },
        { value: "ม.6", label: "สาย ม.6" }
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
        async function fetchEvent() {
            if (!user) return
            try {
                const res = await fetch(`/api/events?id=${params.id}`, {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setEvent(data.event)
                } else {
                    router.push("/events")
                }
            } catch (err) {
                router.push("/events")
            }
        }

        fetchEvent()
    }, [user])

    useEffect(() => {
        async function fetchAttendance() {
            if (!user || !event) return
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append("eventId", event.id)
                if (selectedLevel) params.append("level", selectedLevel)
                if (selectedTrack) params.append("track", selectedTrack)
                if (searchTerm) params.append("search", searchTerm)

                const res = await fetch("/api/events/attendance?" + params.toString(), {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setAttendance(data.attendance)
                }
            } catch (err) {
                setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
            } finally {
                setIsLoading(false)
            }
        }

        fetchAttendance()
    }, [user, event, selectedLevel, selectedTrack, searchTerm])

    const handleStatusChange = async (attendanceId, studentId, newStatus) => {
        try {
            const res = await fetch("/api/events/attendance", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventId: event.id,
                    studentId,
                    status: newStatus
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setAttendance(attendance.map(a => a.id === data.attendance.id ? data.attendance : a))
                setMessage({ type: "success", text: "อัพเดทสถานะเรียบร้อยแล้ว" })
            } else {
                const data = await res.json()
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการอัพเดทสถานะ" })
        }
    }

    if (!user || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.push("/events")}
                        className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>กลับ</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>
                    <div className="space-y-2 text-gray-600">
                        <p>{event.description}</p>
                        <p>
                            <span className="font-medium">วันที่:</span>{" "}
                            {new Date(event.date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                        <p>
                            <span className="font-medium">เวลา:</span>{" "}
                            {event.startTime} - {event.endTime} น.
                        </p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ระดับชั้น
                            </label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => {
                                    setSelectedLevel(e.target.value)
                                    setSelectedTrack("")
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                            >
                                <option value="">ทั้งหมด</option>
                                {levels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedLevel?.startsWith("ปวส") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ประเภท
                                </label>
                                <select
                                    value={selectedTrack}
                                    onChange={(e) => setSelectedTrack(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                >
                                    <option value="">ทั้งหมด</option>
                                    {tracks.map(track => (
                                        <option key={track.value} value={track.value}>
                                            {track.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ค้นหา
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาด้วยรหัส หรือชื่อ"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Attendance List */}
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : attendance.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                        ไม่พบข้อมูลนักศึกษา
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        สถานะ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendance.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {record.student.studentId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {record.student.prefix} {record.student.firstName} {record.student.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {record.student.level}
                                            {record.student.track && ` (${record.student.track})`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={record.status}
                                                onChange={(e) => handleStatusChange(record.id, record.student.id, e.target.value)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    record.status === "present" ? "bg-green-100 text-green-800 border-green-200" :
                                                    record.status === "late" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                                    "bg-red-100 text-red-800 border-red-200"
                                                } border focus:outline-none focus:ring-2 focus:ring-red-500/20`}
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
                )}
            </div>
        </main>
    )
} 