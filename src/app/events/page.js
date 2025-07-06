"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Events() {
    const [user, setUser] = useState(null)
    const [events, setEvents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [message, setMessage] = useState({ type: "", text: "" })
    const [searchTerm, setSearchTerm] = useState("")
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        levels: []
    })

    const EDUCATION_LEVELS = [
        "ปวช.1",
        "ปวช.2",
        "ปวช.3",
        "ปวส.1 สายตรง",
        "ปวส.1 สาย ม.6",
        "ปวส.2 สายตรง",
        "ปวส.2 สาย ม.6",
        "all"
    ]

    const LEVEL_DISPLAY = {
        "all": "ทั้งหมด",
        "ปวช.1": "ปวช.1",
        "ปวช.2": "ปวช.2",
        "ปวช.3": "ปวช.3",
        "ปวส.1 สายตรง": "ปวส.1 สายตรง",
        "ปวส.1 สาย ม.6": "ปวส.1 สาย ม.6",
        "ปวส.2 สายตรง": "ปวส.2 สายตรง",
        "ปวส.2 สาย ม.6": "ปวส.2 สาย ม.6"
    }

    const router = useRouter()

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
        async function fetchEvents() {
            if (!user) return
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                if (searchTerm) params.append("search", searchTerm)

                const res = await fetch("/api/events?" + params.toString(), {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setEvents(data.events)
                }
            } catch (err) {
                setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
            } finally {
                setIsLoading(false)
            }
        }

        fetchEvents()
    }, [user, searchTerm])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage({ type: "", text: "" })

        if (formData.levels.length === 0) {
            setMessage({ type: "error", text: "กรุณาเลือกระดับชั้นอย่างน้อย 1 ระดับ" })
            return
        }

        try {
            const res = await fetch("/api/events", {
                method: editingEvent ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editingEvent ? { ...formData, id: editingEvent.id } : formData),
            })

            const data = await res.json()

            if (res.ok) {
                if (editingEvent) {
                    setEvents(events.map(e => e.id === editingEvent.id ? data.event : e))
                    setMessage({ type: "success", text: "แก้ไขกิจกรรมเรียบร้อยแล้ว" })
                } else {
                    setEvents([data.event, ...events])
                    setMessage({ type: "success", text: "เพิ่มกิจกรรมเรียบร้อยแล้ว" })
                }
                setShowModal(false)
                setEditingEvent(null)
                setFormData({ title: "", description: "", date: "", startTime: "", endTime: "", levels: [] })
            } else {
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
        }
    }

    const handleEdit = (event) => {
        setEditingEvent(event)
        setFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date).toISOString().split('T')[0],
            startTime: event.startTime,
            endTime: event.endTime,
            levels: event.levels || []
        })
        setShowModal(true)
        setMessage({ type: "", text: "" })
    }

    const handleDelete = async (eventId) => {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้?")) return

        try {
            const res = await fetch(`/api/events?id=${eventId}`, {
                method: "DELETE",
                credentials: "include",
            })

            const data = await res.json()

            if (res.ok) {
                setEvents(events.filter(e => e.id !== eventId))
                setMessage({ type: "success", text: "ลบกิจกรรมเรียบร้อยแล้ว" })
            } else {
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการลบกิจกรรม" })
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="bg-red-50 p-2 rounded-xl">
                                    <Image
                                        src="/event.svg"
                                        alt="Events"
                                        width={32}
                                        height={32}
                                        className="opacity-75"
                                    />
                                </div>
                                จัดการกิจกรรม
                            </h1>
                            <p className="mt-1 text-gray-500">จัดการข้อมูลกิจกรรมและการเข้าร่วมของนักศึกษา</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingEvent(null)
                                setFormData({ title: "", description: "", date: "", startTime: "", endTime: "", levels: [] })
                                setShowModal(true)
                                setMessage({ type: "", text: "" })
                            }}
                            className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow group"
                        >
                            <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>เพิ่มกิจกรรม</span>
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl shadow-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"} flex items-center gap-3`}>
                        {message.type === "success" ? (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {message.text}
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="max-w-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ค้นหากิจกรรม
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาด้วยชื่อหรือรายละเอียดกิจกรรม"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                            </div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="bg-red-50 rounded-full p-3">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="text-gray-900 font-medium">ไม่พบข้อมูลกิจกรรม</h3>
                                <p className="text-gray-500">เพิ่มกิจกรรมใหม่เพื่อเริ่มต้นใช้งาน</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => (
                                <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h2 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h2>
                                                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{event.description}</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {event.levels.includes("all") ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                                            ทุกระดับชั้น
                                                        </span>
                                                    ) : (
                                                        event.levels.map((level) => (
                                                            <span
                                                                key={level}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-gray-600"
                                                            >
                                                                <span className="text-gray-600 mr-2">ระดับชั้นที่เข้าร่วม : </span>
                                                                {LEVEL_DISPLAY[level]}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{new Date(event.date).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{event.startTime} - {event.endTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-center justify-between gap-2">
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                เช็คชื่อ
                                            </Link>
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add/Edit Event Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-gray-500/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {editingEvent ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowModal(false)
                                            setEditingEvent(null)
                                            setFormData({ title: "", description: "", date: "", startTime: "", endTime: "", levels: [] })
                                            setMessage({ type: "", text: "" })
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ชื่อกิจกรรม
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            รายละเอียด
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            วันที่
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 ">
                                                เวลาเริ่ม
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                เวลาสิ้นสุด
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ระดับชั้น
                                        </label>
                                        <div className="space-y-2">
                                            {EDUCATION_LEVELS.map((level) => (
                                                <label key={level} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.levels.includes(level)}
                                                        onChange={(e) => {
                                                            if (level === "all") {
                                                                setFormData({
                                                                    ...formData,
                                                                    levels: e.target.checked ? ["all"] : []
                                                                })
                                                            } else {
                                                                const newLevels = e.target.checked
                                                                    ? [...formData.levels.filter(l => l !== "all"), level]
                                                                    : formData.levels.filter(l => l !== level)
                                                                setFormData({ ...formData, levels: newLevels })
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        disabled={level !== "all" && formData.levels.includes("all")}
                                                    />
                                                    <span className="ml-2 text-gray-700">{LEVEL_DISPLAY[level]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false)
                                                setEditingEvent(null)
                                                setFormData({ title: "", description: "", date: "", startTime: "", endTime: "", levels: [] })
                                                setMessage({ type: "", text: "" })
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400/20"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                        >
                                            {editingEvent ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
