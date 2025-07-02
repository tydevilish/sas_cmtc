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
        async function fetchData() {
            try {
                const [resUser, resStats] = await Promise.all([
                    fetch("/api/auth/me", {
                        method: "GET",
                        credentials: "include",
                    }),
                    fetch("/api/dashboard", {
                        method: "GET",
                        credentials: "include",
                    })
                ])

                if (!resUser.ok) {
                    return router.push("/login")
                }

                const [userData, statsData] = await Promise.all([
                    resUser.json(),
                    resStats.json()
                ])

                setUser(userData.user)
                setStats(statsData.stats)
            } catch (err) {
                router.push("/login")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const menuItems = [
        {
            id: 'events',
            title: 'จัดการกิจกรรม',
            icon: '/event.svg',
            href: '/events',
            description: 'จัดการข้อมูลกิจกรรมต่างๆ',
            stats: stats ? [
                { label: 'กิจกรรมทั้งหมด', value: stats.activities.total },
                { label: 'กำลังดำเนินการ', value: stats.activities.active },
                { label: 'กำลังจะมาถึง', value: stats.activities.upcoming }
            ] : []
        },
        {
            id: 'students',
            title: 'จัดการนักศึกษา',
            icon: '/student.svg',
            href: '/students',
            description: 'จัดการข้อมูลนักเรียนนักศึกษา',
            stats: stats ? [
                { label: 'นักศึกษาทั้งหมด', value: stats.students.total },
                { label: 'เข้าร่วมกิจกรรม', value: stats.students.attending },
                { label: 'ขาดกิจกรรม', value: stats.students.absent }
            ] : []
        },
        {
            id: 'users',
            title: 'จัดการผู้ใช้ระบบ',
            icon: '/user.svg',
            href: '/users',
            description: 'จัดการผู้ใช้งานระบบ',
            stats: stats ? [
                { label: 'ผู้ใช้ทั้งหมด', value: stats.users.total },
                { label: 'ผู้ดูแลระบบ', value: stats.users.admin },
                { label: 'อาจารย์', value: stats.users.teacher }
            ] : []
        }
    ]

    if (!user || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        )
    }

    return (
        <main className="flex-grow pt-16">
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    ยินดีต้อนรับ, {user.name || user.username}
                                </h1>
                                <p className="mt-1 text-gray-500">
                                    ระบบจัดการการเข้าร่วมกิจกรรมนักศึกษา
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <Image
                                    src="/images/logo.png"
                                    alt="Logo"
                                    width={120}
                                    height={46}
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100">กิจกรรมทั้งหมด</p>
                                    <h3 className="text-3xl font-bold mt-1">{stats.activities.total}</h3>
                                </div>
                                <div className="bg-white/20 rounded-lg p-3">
                                    <Image
                                        src="/event.svg"
                                        alt="Activities"
                                        width={24}
                                        height={24}
                                        className="opacity-90"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-red-100">กำลังดำเนินการ</p>
                                    <p className="text-xl font-semibold">{stats.activities.active}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-red-100">กำลังจะมาถึง</p>
                                    <p className="text-xl font-semibold">{stats.activities.upcoming}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-red-100">เสร็จสิ้น</p>
                                    <p className="text-xl font-semibold">{stats.activities.completed}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100">นักศึกษาทั้งหมด</p>
                                    <h3 className="text-3xl font-bold mt-1">{stats.students.total}</h3>
                                </div>
                                <div className="bg-white/20 rounded-lg p-3">
                                    <Image
                                        src="/student.svg"
                                        alt="Students"
                                        width={24}
                                        height={24}
                                        className="opacity-90"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-blue-100">มาเรียน</p>
                                    <p className="text-xl font-semibold">{stats.students.attending}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-blue-100">มาสาย</p>
                                    <p className="text-xl font-semibold">{stats.students.late}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-2 text-center">
                                    <p className="text-blue-100">ขาด</p>
                                    <p className="text-xl font-semibold">{stats.students.absent}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-green-100">สถิติการเข้าร่วมกิจกรรม</p>
                                    <h3 className="text-3xl font-bold mt-1">
                                        {((stats.students.attending / (stats.students.attending + stats.students.late + stats.students.absent)) * 100).toFixed(1)}%
                                    </h3>
                                </div>
                                <div className="bg-white/20 rounded-lg p-3">
                                    <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2.5">
                                <div 
                                    className="bg-white h-2.5 rounded-full" 
                                    style={{ 
                                        width: `${(stats.students.attending / (stats.students.attending + stats.students.late + stats.students.absent)) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            <div className="mt-4 flex justify-between text-sm">
                                <span className="text-green-100">มาเรียน: {stats.students.attending} คน</span>
                                <span className="text-green-100">มาสาย: {stats.students.late} คน</span>
                                <span className="text-green-100">ขาด: {stats.students.absent} คน</span>
                            </div>
                        </div>
                    </div>

                    {/* Student Level Stats */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">สถิตินักศึกษาแผนกเทคโนโลยีสารสนเทศ</h2>
                        <div className="space-y-6">
                            {/* ปวช. */}
                            <div>
                                <h3 className="text-base font-medium text-gray-900 mb-4">ระดับประกาศนียบัตรวิชาชีพ (ปวช.)</h3>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                    {stats.students.levels.slice(0, 3).map((level, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl p-4 relative overflow-hidden group hover:bg-gray-100 transition-colors duration-200">
                                            <div className="relative z-10">
                                                <h4 className="font-medium text-gray-900">{level.name}</h4>
                                                <p className="text-2xl font-bold text-red-600 mt-2">{level.count}</p>
                                                <p className="text-sm text-gray-500 mt-1">นักศึกษา</p>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-100 rounded-tl-full transform translate-x-8 translate-y-8 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-200"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* ปวส. */}
                            <div>
                                <h3 className="text-base font-medium text-gray-900 mb-4">ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</h3>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    {/* ปวส.1 */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-3">ชั้นปีที่ 1</h4>
                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {stats.students.levels.slice(3, 5).map((level, index) => (
                                                <div key={index} className="bg-gray-50 rounded-xl p-4 relative overflow-hidden group hover:bg-gray-100 transition-colors duration-200">
                                                    <div className="relative z-10">
                                                        <h4 className="font-medium text-gray-900">
                                                            {level.name.includes("ตรง") ? "สายตรง" : "สาย ม.6"}
                                                        </h4>
                                                        <p className="text-2xl font-bold text-red-600 mt-2">{level.count}</p>
                                                        <p className="text-sm text-gray-500 mt-1">นักศึกษา</p>
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-red-100 rounded-tl-full transform translate-x-6 translate-y-6 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-200"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* ปวส.2 */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-3">ชั้นปีที่ 2</h4>
                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {stats.students.levels.slice(5, 7).map((level, index) => (
                                                <div key={index} className="bg-gray-50 rounded-xl p-4 relative overflow-hidden group hover:bg-gray-100 transition-colors duration-200">
                                                    <div className="relative z-10">
                                                        <h4 className="font-medium text-gray-900">
                                                            {level.name.includes("ตรง") ? "สายตรง" : "สาย ม.6"}
                                                        </h4>
                                                        <p className="text-2xl font-bold text-red-600 mt-2">{level.count}</p>
                                                        <p className="text-sm text-gray-500 mt-1">นักศึกษา</p>
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-red-100 rounded-tl-full transform translate-x-6 translate-y-6 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-200"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Menu Cards */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {menuItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="bg-red-50 rounded-xl p-3 group-hover:bg-red-100 transition-colors duration-200">
                                            <Image
                                                src={item.icon}
                                                alt={item.title}
                                                width={24}
                                                height={24}
                                                className="opacity-70 group-hover:opacity-100"
                                            />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-red-600">
                                            {item.title}
                                        </h2>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {item.description}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        {item.stats.map((stat, index) => (
                                            <div key={index} className="text-center bg-gray-50 rounded-lg p-2 group-hover:bg-gray-100 transition-colors duration-200">
                                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <span className="text-red-600 text-sm group-hover:translate-x-1 transition-transform duration-200">
                                            เข้าสู่หน้า →
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-50 rounded-tl-full transform translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform duration-200"></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}