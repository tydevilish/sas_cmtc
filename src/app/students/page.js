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
    const [searchTerm, setSearchTerm] = useState("")
    const [formData, setFormData] = useState({
        studentId: "",
        prefix: "",
        firstName: "",
        lastName: "",
        level: ""
    })

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
    }, [user, selectedLevel, searchTerm])

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
                setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "" })
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
            level: student.level
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
                                level: selectedLevel
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
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ระดับชั้น
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => {
                                        setSelectedLevel(e.target.value)
                                    }}
                                    className="block w-full pl-3 pr-10 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                >
                                    <option value="">เลือกระดับชั้น</option>
                                    {levels.map((level) => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ค้นหา
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ค้นหาด้วยรหัสนักศึกษา ชื่อ หรือนามสกุล"
                                    className="block w-full pl-3 pr-10 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        รหัสนักศึกษา
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ชื่อ-นามสกุล
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ระดับชั้น
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {!selectedLevel ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="bg-gray-50 rounded-full p-3">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                                <div className="text-gray-500 text-center">
                                                    <p className="text-lg font-medium mb-1">กรุณาเลือกระดับชั้น</p>
                                                    <p className="text-sm">เลือกระดับชั้นที่ต้องการเพื่อแสดงและจัดการข้อมูลนักศึกษา</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                                                <span>กำลังโหลดข้อมูล...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            ไม่พบข้อมูลนักศึกษา
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.studentId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {student.prefix}{student.firstName} {student.lastName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {student.level}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Student Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingStudent ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษาใหม่"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingStudent(null)
                                        setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "" })
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
                                        รหัสนักศึกษา
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                        className="block w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        คำนำหน้า
                                    </label>
                                    <select
                                        value={formData.prefix}
                                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                                        className="block w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        required
                                    >
                                        <option value="">เลือกคำนำหน้า</option>
                                        {prefixes.map((prefix) => (
                                            <option key={prefix.value} value={prefix.value}>
                                                {prefix.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อ
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="block w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        นามสกุล
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="block w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ระดับชั้น
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="block w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                        disabled
                                    >
                                        <option value="">เลือกระดับชั้น</option>
                                        {levels.map((level) => (
                                            <option key={level.value} value={level.value}>
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false)
                                            setEditingStudent(null)
                                            setFormData({ studentId: "", prefix: "", firstName: "", lastName: "", level: "" })
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
                                        {editingStudent ? "บันทึกการแก้ไข" : "เพิ่มนักศึกษา"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
