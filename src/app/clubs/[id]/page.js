"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function ClubDetail({ params }) {
    const [user, setUser] = useState(null)
    const [club, setClub] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [message, setMessage] = useState({ type: "", text: "" })
    const [isAddingMembers, setIsAddingMembers] = useState(false)
    const [availableStudents, setAvailableStudents] = useState([])
    const [selectedLevel, setSelectedLevel] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [weeks, setWeeks] = useState([])

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
        async function fetchClub() {
            if (!user) return
            setIsLoading(true)
            try {
                const res = await fetch(`/api/clubs?id=${params.id}`, {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data.club) {
                        setClub({
                            ...data.club,
                            members: data.club.members || []
                        })
                        setWeeks(data.club.weeks || [])
                    } else {
                        router.push("/clubs")
                    }
                } else {
                    router.push("/clubs")
                }
            } catch (err) {
                router.push("/clubs")
            } finally {
                setIsLoading(false)
            }
        }

        fetchClub()
    }, [user])

    useEffect(() => {
        async function fetchAvailableStudents() {
            if (!user || !isAddingMembers || !club) return
            try {
                const params = new URLSearchParams()
                params.append("clubId", club.id)
                if (selectedLevel) params.append("level", selectedLevel)
                if (searchTerm) params.append("search", searchTerm)

                const res = await fetch("/api/clubs/members?" + params.toString(), {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setAvailableStudents(data.students || [])
                }
            } catch (err) {
                setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
            }
        }

        fetchAvailableStudents()
    }, [user, isAddingMembers, selectedLevel, searchTerm])

    const handleAddWeek = async () => {
        try {
            const res = await fetch("/api/clubs/weeks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clubId: club.id
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setWeeks([...weeks, data.week])
                setMessage({ type: "success", text: "เพิ่มสัปดาห์เรียบร้อยแล้ว" })
            } else {
                const data = await res.json()
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเพิ่มสัปดาห์" })
        }
    }

    const handleAddMember = async (studentId) => {
        if (!club) return
        try {
            const res = await fetch("/api/clubs/members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clubId: club.id,
                    studentId
                }),
            })

            const data = await res.json()

            if (res.ok) {
                setClub({
                    ...club,
                    members: [...(club.members || []), data.member]
                })
                setAvailableStudents(availableStudents.filter(s => s.id !== studentId))
                setMessage({ type: "success", text: "เพิ่มสมาชิกเรียบร้อยแล้ว" })
            } else {
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเพิ่มสมาชิก" })
        }
    }

    const handleRemoveMember = async (studentId) => {
        if (!club) return
        try {
            const res = await fetch(`/api/clubs/members?clubId=${club.id}&studentId=${studentId}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (res.ok) {
                setClub({
                    ...club,
                    members: (club.members || []).filter(m => m.student.id !== studentId)
                })
                setMessage({ type: "success", text: "ลบสมาชิกเรียบร้อยแล้ว" })
            } else {
                const data = await res.json()
                setMessage({ type: "error", text: data.message })
            }
        } catch (err) {
            setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการลบสมาชิก" })
        }
    }

    if (!user || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    if (!club) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">ไม่พบข้อมูลชมรม</div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <Image
                                    src="/clubs.svg"
                                    alt="Club"
                                    width={32}
                                    height={32}
                                    className="opacity-75"
                                />
                            </div>
                            {club.name}
                        </h1>
                        <p className="mt-1 text-gray-500">{club.description}</p>
                    </div>
                    <button
                        onClick={() => router.push("/clubs")}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        กลับไปหน้าชมรม
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

                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0">
                                <Image
                                    src={club.icon || "/clubs.svg"}
                                    alt={club.name}
                                    width={120}
                                    height={120}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>{club.members?.length || 0} สมาชิก</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{weeks?.length || 0} สัปดาห์</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddingMembers(!isAddingMembers)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    {isAddingMembers ? "ปิดการเพิ่มสมาชิก" : "เพิ่มสมาชิก"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isAddingMembers ? (
                    <div className="space-y-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="grid gap-4 md:grid-cols-2">
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
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="ค้นหาด้วยรหัส หรือชื่อ"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
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
                                                การจัดการ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {availableStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="flex flex-col items-center text-center py-6">
                                                        <div className="bg-red-50 rounded-full p-3 mb-4">
                                                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="text-sm font-medium text-gray-900">ไม่พบข้อมูลนักศึกษา</h3>
                                                        <p className="mt-1 text-sm text-gray-500">ลองค้นหาด้วยคำค้นอื่น หรือลองเลือกระดับชั้นอื่น</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            availableStudents.map(student => (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {student.studentId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {student.prefix} {student.firstName} {student.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {student.level}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => handleAddMember(student.id)}
                                                            className="text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                                                        >
                                                            เพิ่มเป็นสมาชิก
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
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">สมาชิกชมรม</h2>
                                    <p className="text-sm text-gray-500">รายชื่อสมาชิกทั้งหมดในชมรม</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="ค้นหาสมาชิก..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
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
                                            การจัดการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {club.members.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4">
                                                <div className="flex flex-col items-center text-center py-6">
                                                    <div className="bg-red-50 rounded-full p-3 mb-4">
                                                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-sm font-medium text-gray-900">ยังไม่มีสมาชิก</h3>
                                                    <p className="mt-1 text-sm text-gray-500">เพิ่มสมาชิกใหม่เพื่อเริ่มต้นใช้งาน</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        club.members.map(member => (
                                            <tr key={member.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {member.student.studentId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {member.student.prefix} {member.student.firstName} {member.student.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {member.student.level}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleRemoveMember(member.student.id)}
                                                        className="text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                                                    >
                                                        ลบออก
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">รายการสัปดาห์</h2>
                        <button
                            onClick={handleAddWeek}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            เพิ่มสัปดาห์
                        </button>
                    </div>

                    {weeks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-red-50 rounded-full p-3 mb-4">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-gray-900">ยังไม่มีสัปดาห์</h3>
                                <p className="mt-1 text-sm text-gray-500">เพิ่มสัปดาห์แรกเพื่อเริ่มต้นใช้งาน</p>
                            </div>
                        </div>
                    ) : (
                        weeks.map((week) => (
                            <Link
                                key={week.id}
                                href={`/clubs/${params.id}/weeks/${week.id}`}
                                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-red-50 p-3 rounded-xl">
                                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">สัปดาห์ที่ {week.weekNumber}</h3>
                                                <p className="text-sm text-gray-500">สร้างเมื่อ {new Date(week.createdAt).toLocaleDateString('th-TH')}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
} 