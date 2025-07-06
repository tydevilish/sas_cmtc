"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function Dashboard() {
    const [user, setUser] = useState(null)
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
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
        async function fetchStats() {
            if (!user) return
            try {
                const res = await fetch("/api/dashboard", {
                    method: "GET",
                    credentials: "include",
                })

                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (err) {
                console.error("Error fetching stats:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [user])

    if (!user || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <Image
                                    src="/dashboard.svg"
                                    alt="Dashboard"
                                    width={32}
                                    height={32}
                                    className="opacity-75"
                                />
                            </div>
                            แผงควบคุม
                        </h1>
                        <p className="mt-1 text-gray-500">ภาพรวมของระบบเช็คชื่อกิจกรรมและชมรม</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/events"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            จัดการกิจกรรม
                        </Link>
                        <Link
                            href="/clubs"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            จัดการชมรม
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Students */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">นักศึกษาทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Events */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">กิจกรรมทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Clubs */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">ชมรมทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalClubs || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Club Weeks */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">สัปดาห์ชมรมทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalWeeks || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Events and Clubs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Events */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
                                    <p className="text-sm text-gray-500">กิจกรรมที่เพิ่มล่าสุด 5 รายการ</p>
                                </div>
                                <Link
                                    href="/events"
                                    className="text-sm font-medium text-red-600 hover:text-red-800"
                                >
                                    ดูทั้งหมด
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats?.recentEvents?.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">ยังไม่มีกิจกรรม</div>
                            ) : (
                                stats?.recentEvents?.map(event => (
                                    <Link key={event.id} href={`/events/${event.id}`} className="block hover:bg-gray-50">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">{event.description}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    event.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                                                    event.status === 'ongoing' ? 'bg-green-50 text-green-700' :
                                                    'bg-gray-50 text-gray-700'
                                                }`}>
                                                    {event.status === 'upcoming' ? 'กำลังจะมาถึง' :
                                                    event.status === 'ongoing' ? 'กำลังดำเนินการ' :
                                                    'เสร็จสิ้น'}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(event.date).toLocaleDateString('th-TH')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {event.startTime} - {event.endTime}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Clubs */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">ชมรมล่าสุด</h2>
                                    <p className="text-sm text-gray-500">ชมรมที่เพิ่มล่าสุด 5 รายการ</p>
                                </div>
                                <Link
                                    href="/clubs"
                                    className="text-sm font-medium text-red-600 hover:text-red-800"
                                >
                                    ดูทั้งหมด
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats?.recentClubs?.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">ยังไม่มีชมรม</div>
                            ) : (
                                stats?.recentClubs?.map(club => (
                                    <Link key={club.id} href={`/clubs/${club.id}`} className="block hover:bg-gray-50">
                                        <div className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-red-50 p-2 rounded-lg">
                                                    <Image
                                                        src={club.icon || "/clubs.svg"}
                                                        alt={club.name}
                                                        width={32}
                                                        height={32}
                                                        className="opacity-75"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">{club.name}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">{club.description}</p>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            {club._count?.members || 0} สมาชิก
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {club._count?.weeks || 0} สัปดาห์
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}