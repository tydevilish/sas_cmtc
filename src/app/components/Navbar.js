"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function Navbar({ user, onLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const menuItems = [
        {
            id: 'dashboard',
            title: 'แดชบอร์ด',
            icon: '/dashboard.svg',
            href: '/dashboard',
            description: 'จัดการข้อมูลกิจกรรมต่างๆ'
        },
        {
            id: 'clubs',
            title: 'เช็คชื่อชมรมวิชาชีพ',
            icon: '/clubs.svg',
            href: '/clubs',
            description: 'จัดการข้อมูลกิจกรรมต่างๆ'
        },
        {
            id: 'activities',
            title: 'จัดการกิจกรรม',
            icon: '/event.svg',
            href: '/events',
            description: 'จัดการข้อมูลกิจกรรมต่างๆ'
        },
        {
            id: 'students',
            title: 'เพิ่มรายชื่อนักเรียน',
            icon: '/student.svg',
            href: '/students',
            description: 'จัดการข้อมูลนักเรียนนักศึกษา'
        },
        {
            id: 'users',
            title: 'เพิ่มผู้ใช้ระบบ',
            icon: '/user.svg',
            href: '/users',
            description: 'จัดการผู้ใช้งานระบบ'
        }
    ]

    if (pathname === '/login') {
        return null
    }

    return (
        <nav className="bg-white shadow-sm fixed w-full top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and User Info */}
                    <div className="flex items-center">
                        <Link href="/dashboard">
                            <Image
                                src="/images/logo.png"
                                alt="Logo"
                                width={120}
                                height={40}
                                className="cursor-pointer"
                            />
                        </Link>
                        <span className="ml-4 text-gray-700 font-medium hidden sm:block py-1 px-3 bg-gray-200 rounded-lg">
                            {user?.username}
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {menuItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                                    hover:bg-gray-50 text-gray-600 hover:text-red-600 ${pathname === item.href ? 'bg-red-50 text-red-600' : ''
                                    }`}
                            >
                                <Image
                                    src={item.icon}
                                    alt={item.title}
                                    width={20}
                                    height={20}
                                    className="opacity-70"
                                />
                                <span className="text-sm font-medium">{item.title}</span>
                            </Link>
                        ))}

                        {/* Desktop Logout Button */}
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-gray-100 hover:bg-red-600 bg-red-500 rounded-lg transition-all duration-200"
                        >
                            <svg
                                className="w-5 h-5 opacity-70"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}>
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
                    {/* Mobile username */}
                    <div className="px-3 py-2 text-sm font-medium text-gray-600 border-b border-gray-200">
                        {user?.username}
                    </div>

                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors duration-200 ${pathname === item.href ? 'bg-red-50 text-red-600' : ''
                                }`}
                        >
                            <Image
                                src={item.icon}
                                alt={item.title}
                                width={20}
                                height={20}
                                className="opacity-70"
                            />
                            <span>{item.title}</span>
                        </Link>
                    ))}

                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-white hover:text-gray-100 hover:bg-red-600 bg-red-500 w-full transition-colors duration-200 cursor-pointer"
                    >
                        <svg
                            className="w-5 h-5 opacity-70"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </div>
        </nav>
    )
} 