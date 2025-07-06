"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function EventAttendance({ params }) {
    const [user, setUser] = useState(null)
    const [event, setEvent] = useState(null)
    const [attendance, setAttendance] = useState([])
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
    }, [user, event, selectedLevel, searchTerm])

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

    // กรองระดับชั้นตามที่กำหนดในกิจกรรม
    const availableLevels = event.levels.includes("all") 
        ? levels 
        : levels.filter(level => event.levels.includes(level.value))

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <Image
                                    src="/event.svg"
                                    alt="Event"
                                    width={32}
                                    height={32}
                                    className="opacity-75"
                                />
                            </div>
                            เช็คชื่อกิจกรรม
                        </h1>
                        <p className="mt-1 text-gray-500">จัดการการเข้าร่วมกิจกรรมของนักศึกษา</p>
                    </div>
                    <button
                        onClick={() => router.push("/events")}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        กลับไปหน้ากิจกรรม
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h2>
                        <p className="text-gray-500 mb-4">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {new Date(event.date).toLocaleDateString('th-TH')}
                            </div>
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {event.startTime} - {event.endTime}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-gray-100">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ค้นหานักศึกษา
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="ค้นหาด้วยชื่อหรือรหัสนักศึกษา"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    กรองตามระดับชั้น
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
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        รหัสนักศึกษา
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อ-นามสกุล
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ระดับชั้น
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        สถานะ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="flex flex-col items-center text-center py-6">
                                                <div className="bg-red-50 rounded-full p-3 mb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-sm font-medium text-gray-900">ไม่พบข้อมูลการเข้าร่วม</h3>
                                                <p className="mt-1 text-sm text-gray-500">ลองค้นหาด้วยคำค้นอื่น หรือลองเลือกระดับชั้นอื่น</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    attendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {record.student.studentId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {record.student.prefix} {record.student.firstName} {record.student.lastName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {record.student.level}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={record.status}
                                                    onChange={(e) => handleStatusChange(record.id, record.student.id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    )
} 