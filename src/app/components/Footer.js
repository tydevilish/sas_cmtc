import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
    const currentYear = new Date().getFullYear()
    const pathname = usePathname()

    if (pathname === '/login') {
        return null
    }

    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center space-y-6">
                    {/* Logo */}
                    <Link href="/dashboard">
                        <Image
                            src="/images/logo.png"
                            alt="Logo"
                            width={120}
                            height={40}
                            className="opacity-75 hover:opacity-100 transition-opacity duration-200"
                        />
                    </Link>

                    {/* Links */}
                    <nav className="flex flex-wrap justify-center gap-6 text-sm">
                        <Link href="/dashboard" className="text-gray-500 hover:text-red-600 transition-colors duration-200">
                            หน้าแรก
                        </Link>
                        <Link href="/activities" className="text-gray-500 hover:text-red-600 transition-colors duration-200">
                            กิจกรรม
                        </Link>
                        <Link href="/students" className="text-gray-500 hover:text-red-600 transition-colors duration-200">
                            นักเรียน
                        </Link>
                        <Link href="/users" className="text-gray-500 hover:text-red-600 transition-colors duration-200">
                            ผู้ใช้งาน
                        </Link>
                    </nav>

                    {/* Copyright */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            &copy; {currentYear} Student Attendance System. All rights reserved.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            พัฒนาด้วย Next.js , TailwindCSS , Prisma และ MongoDB
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
