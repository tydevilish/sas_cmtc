"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function Students() {
    const [user, setUser] = useState(null)
    const [students, setStudents] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)
    const [message, setMessage] = useState({ type: "", text: "" })
    const [selectedLevel, setSelectedLevel] = useState("")
    const [selectedTrack, setSelectedTrack] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [formData, setFormData] = useState({
        studentId: "",
        prefix: "",
        firstName: "",
        lastName: "",
        level: "",
        track: ""
    })

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

    const prefixes = [
        { value: "นาย", label: "นาย" },
        { value: "นางสาว", label: "นางสาว" }
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
        async function fetchStudents() {
            if (!selectedLevel) return
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                params.append("level", selectedLevel)
                if (selectedTrack) params.append("track", selectedTrack)
                if (searchTerm) params.append("search", searchTerm)

                const res = await fetch("/api/students?" + params.toString(), {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setStudents(data.students)
                }
            } catch (err) {
                setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
            } finally {
                setIsLoading(false)
            }
        }

        if (user) {
            fetchStudents()
        }
    }, [user, selectedLevel, selectedTrack, searchTerm])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage({ type: "", text: "" })

        try {
            const res = await fetch("/api/students", {
                method: editingStudent ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editingStudent ? { ...formData, id: editingStudent.id } : formData),
            })

            const data = await res.json()

            if (res.ok) {
                if (editingStudent) {
                    setStudents(students.map(s => s.id === editingStudent.id ? data.student : s))
                    setMessage({ type: "success", text: "แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว" })
                } else {
                    setStudents([data.student, ...students])
                    setMessage({ type: "success", text: "เพิ่มนักศึกษาเรียบร้อยแล้ว" })
                }
                setShowModal(false)
                setEditingStudent(null)
                setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "", track: "" })
            } else {
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
        }
    }

    const handleEdit = (student) => {
        setEditingStudent(student)
        setFormData({
            studentId: student.studentId,
            prefix: student.prefix,
            firstName: student.firstName,
            lastName: student.lastName,
            level: student.level,
            track: student.track || ""
        })
        setShowModal(true)
        setMessage({ type: "", text: "" })
    }

    const handleDelete = async (studentId) => {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบนักศึกษาคนนี้?")) return

        try {
            const res = await fetch(`/api/students?id=${studentId}`, {
                method: "DELETE",
                credentials: "include",
            })

            const data = await res.json()

            if (res.ok) {
                setStudents(students.filter(s => s.id !== studentId))
                setMessage({ type: "success", text: "ลบนักศึกษาเรียบร้อยแล้ว" })
            } else {
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการลบนักศึกษา" })
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
        <main className="flex-grow pt-16 bg-gradient-to-b from-gray-50 to-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <Image
                                    src="/user.svg"
                                    alt="Users"
                                    width={32}
                                    height={32}
                                    className="opacity-75"
                                />
                            </div>
                            เพิ่มรายชื่อนักเรียน
                        </h1>
                        <p className="mt-2 text-gray-500">จัดการข้อมูลนักเรียน นักศึกษา</p>
                    </div>
                    <button
                        onClick={() => {
                            if (!selectedLevel) {
                                setMessage({ type: "error", text: "กรุณาเลือกระดับชั้นก่อนเพิ่มนักศึกษา" })
                                return
                            }
                            setEditingStudent(null)
                            setFormData({
                                studentId: "",
                                prefix: "",
                                firstName: "",
                                lastName: "",
                                level: selectedLevel,
                                track: selectedTrack
                            })
                            setShowModal(true)
                            setMessage({ type: "", text: "" })
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow group"
                    >
                        <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>เพิ่มนักศึกษา</span>
                    </button>
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

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ระดับชั้น
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => {
                                        setSelectedLevel(e.target.value)
                                        setSelectedTrack("")
                                    }}
                                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600 appearance-none bg-white"
                                >
                                    <option value="">เลือกระดับชั้น</option>
                                    {levels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {selectedLevel?.startsWith("ปวส") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ประเภท
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedTrack}
                                        onChange={(e) => setSelectedTrack(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600 appearance-none bg-white"
                                    >
                                        <option value="">ทั้งหมด</option>
                                        {tracks.map(track => (
                                            <option key={track.value} value={track.value}>
                                                {track.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ค้นหา
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ค้นหาด้วยรหัส หรือชื่อ"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                {!selectedLevel ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-red-50 rounded-full p-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">กรุณาเลือกระดับชั้น</h3>
                            <p className="text-gray-500">เลือกระดับชั้นเพื่อดูรายชื่อนักศึกษา</p>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-red-50 rounded-full p-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">ไม่พบข้อมูลนักศึกษา</h3>
                            <p className="text-gray-500">ลองค้นหาด้วยคำค้นอื่น หรือเพิ่มนักศึกษาใหม่</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            รหัสนักศึกษา
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ชื่อ-นามสกุล
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ระดับชั้น
                                        </th>
                                        {selectedLevel?.startsWith("ปวส") && (
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ประเภท
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            จัดการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.studentId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.prefix} {student.firstName} {student.lastName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                                    {student.level}
                                                </span>
                                            </td>
                                            {selectedLevel?.startsWith("ปวส") && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800">
                                                        {student.track || "-"}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(student)}
                                                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative">
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    setEditingStudent(null)
                                    setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "", track: "" })
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
                                        {editingStudent ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        )}
                                    </svg>
                                </div>
                                {editingStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษา'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัสนักศึกษา
                                </label>
                                <input
                                    type="text"
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    คำนำหน้า
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.prefix}
                                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600 appearance-none bg-white"
                                        required
                                    >
                                        <option value="">เลือกคำนำหน้า</option>
                                        {prefixes.map(prefix => (
                                            <option key={prefix.value} value={prefix.value}>
                                                {prefix.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อ
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    นามสกุล
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ระดับชั้น
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.level}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                level: e.target.value,
                                                track: e.target.value.startsWith("ปวส") ? formData.track : ""
                                            })
                                        }}
                                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600 appearance-none bg-white"
                                        required
                                    >
                                        <option value="">เลือกระดับชั้น</option>
                                        {levels.map(level => (
                                            <option key={level.value} value={level.value}>
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {formData.level?.startsWith("ปวส") && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ประเภท
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.track}
                                            onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-600 appearance-none bg-white"
                                            required
                                        >
                                            <option value="">เลือกประเภท</option>
                                            {tracks.map(track => (
                                                <option key={track.value} value={track.value}>
                                                    {track.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingStudent(null)
                                        setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "", track: "" })
                                        setMessage({ type: "", text: "" })
                                    }}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {editingStudent ? 'บันทึกการแก้ไข' : 'เพิ่มนักศึกษา'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
