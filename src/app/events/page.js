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
        endTime: ""
    })

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
                setFormData({ title: "", description: "", date: "", startTime: "", endTime: "" })
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
            endTime: event.endTime
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
                                <Image
                                    src="/event.svg"
                                    alt="Events"
                                    width={32}
                                    height={32}
                                    className="opacity-75"
                                />
                                จัดการกิจกรรม
                            </h1>
                            <p className="mt-1 text-gray-500">จัดการข้อมูลกิจกรรมและการเข้าร่วมของนักศึกษา</p>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingEvent(null)
                                setFormData({ title: "", description: "", date: "", startTime: "", endTime: "" })
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
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-red-50 rounded-full p-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">ไม่พบข้อมูลกิจกรรม</h3>
                            <p className="text-gray-500">ยังไม่มีกิจกรรมในระบบ คลิกปุ่ม "เพิ่มกิจกรรม" เพื่อเริ่มต้นเพิ่มกิจกรรม</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors duration-200 line-clamp-2">
                                            {event.title}
                                        </h2>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
                                            event.status === "upcoming" ? "bg-blue-50 text-blue-700" :
                                            event.status === "ongoing" ? "bg-green-50 text-green-700" :
                                            "bg-gray-50 text-gray-700"
                                        }`}>
                                            {event.status === "upcoming" ? (
                                                <>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                    กำลังจะมาถึง
                                                </>
                                            ) : event.status === "ongoing" ? (
                                                <>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    กำลังดำเนินการ
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    เสร็จสิ้น
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {event.description}
                                    </p>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(event.date).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {event.startTime} - {event.endTime} น.
                                        </p>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1 group/link"
                                    >
                                        จัดการการเข้าร่วม
                                        <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    setEditingEvent(null)
                                    setFormData({ title: "", description: "", date: "", startTime: "", endTime: "" })
                                    setMessage({ type: "", text: "" })
                                }}
                                className="text-gray-400 hover:text-gray-500 p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                                <div className="bg-red-50 rounded-lg p-2">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {editingEvent ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        )}
                                    </svg>
                                </div>
                                {editingEvent ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรม'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อกิจกรรม
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รายละเอียด
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    วันที่
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เวลาเริ่ม
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เวลาสิ้นสุด
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingEvent(null)
                                        setFormData({ title: "", description: "", date: "", startTime: "", endTime: "" })
                                        setMessage({ type: "", text: "" })
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {editingEvent ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
