import { NextResponse } from "next/server"
import prisma from "../../../../lib/prisma"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

async function checkAuth() {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")

    if (!token) {
        return null
    }

    try {
        const decoded = verify(token.value, process.env.JWT_SECRET)
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        })

        return user
    } catch (err) {
        return null
    }
}

export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        // นับจำนวนผู้ใช้งานระบบ
        const usersCount = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        })

        // นับจำนวนนักศึกษาแต่ละระดับ
        const studentsCount = await prisma.student.groupBy({
            by: ['level', 'track'],
            _count: {
                id: true
            }
        })

        // ดึงข้อมูลกิจกรรม
        const events = await prisma.event.findMany({
            include: {
                _count: {
                    select: {
                        attendance: true
                    }
                }
            }
        })

        // นับจำนวนการเข้าร่วมกิจกรรม
        const attendance = await prisma.attendance.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        })

        // จัดรูปแบบข้อมูลสำหรับส่งกลับ
        const stats = {
            activities: {
                total: events.length,
                active: events.filter(e => e.status === "ongoing").length,
                upcoming: events.filter(e => e.status === "upcoming").length,
                completed: events.filter(e => e.status === "completed").length
            },
            students: {
                total: studentsCount.reduce((acc, curr) => acc + curr._count.id, 0),
                attending: attendance.find(a => a.status === "present")?._count.id || 0,
                absent: attendance.find(a => a.status === "absent")?._count.id || 0,
                late: attendance.find(a => a.status === "late")?._count.id || 0,
                levels: [
                    {
                        name: "ปวช.1",
                        count: studentsCount.find(s => s.level === "ปวช.1")?._count.id || 0
                    },
                    {
                        name: "ปวช.2",
                        count: studentsCount.find(s => s.level === "ปวช.2")?._count.id || 0
                    },
                    {
                        name: "ปวช.3",
                        count: studentsCount.find(s => s.level === "ปวช.3")?._count.id || 0
                    },
                    {
                        name: "ปวส.1 (ตรง)",
                        count: studentsCount.find(s => s.level === "ปวส.1" && s.track === "สายตรง")?._count.id || 0
                    },
                    {
                        name: "ปวส.1 (ม.6)",
                        count: studentsCount.find(s => s.level === "ปวส.1" && s.track === "ม.6")?._count.id || 0
                    },
                    {
                        name: "ปวส.2 (ตรง)",
                        count: studentsCount.find(s => s.level === "ปวส.2" && s.track === "สายตรง")?._count.id || 0
                    },
                    {
                        name: "ปวส.2 (ม.6)",
                        count: studentsCount.find(s => s.level === "ปวส.2" && s.track === "ม.6")?._count.id || 0
                    }
                ]
            },
            users: {
                total: usersCount.reduce((acc, curr) => acc + curr._count.id, 0),
                admin: usersCount.find(u => u.role === "admin")?._count.id || 0,
                teacher: usersCount.find(u => u.role === "teacher")?._count.id || 0
            }
        }

        return NextResponse.json({ stats })
    } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
} 