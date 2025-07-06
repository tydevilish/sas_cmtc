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

// GET /api/events - ดึงข้อมูลกิจกรรมทั้งหมด
export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search")
        const id = searchParams.get("id")

        if (id) {
            const event = await prisma.event.findUnique({
                where: { id }
            })
            return NextResponse.json({ event })
        }

        const where = {}
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ]
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json({ events })
    } catch (err) {
        console.error("Error fetching events:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/events - สร้างกิจกรรมใหม่
export async function POST(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { title, description, date, startTime, endTime, levels } = body

        if (!title || !description || !date || !startTime || !endTime || !levels) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // สร้างกิจกรรม
        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                levels: levels.includes("all") ? ["all"] : levels,
                status: "upcoming"
            }
        })

        // ค้นหานักเรียนตามระดับชั้นที่เลือก
        let whereCondition = {}
        
        if (!levels.includes("all")) {
            whereCondition = {
                level: {
                    in: levels
                }
            }
        }

        const students = await prisma.student.findMany({ where: whereCondition })

        // สร้าง attendance records สำหรับนักเรียนที่พบ
        if (students.length > 0) {
            await prisma.attendance.createMany({
                data: students.map(student => ({
                    eventId: event.id,
                    studentId: student.id,
                    status: "absent"
                }))
            })
        }

        return NextResponse.json({ event })
    } catch (err) {
        console.error("Error creating event:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างกิจกรรม" },
            { status: 500 }
        )
    }
}

// PUT /api/events - อัพเดทข้อมูลกิจกรรม
export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, title, description, date, startTime, endTime, levels } = body

        if (!id || !title || !description || !date || !startTime || !endTime || !levels) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // อัพเดทข้อมูลกิจกรรม
        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                levels: levels.includes("all") ? ["all"] : levels
            }
        })

        // ลบ attendance records เก่า
        await prisma.attendance.deleteMany({
            where: { eventId: id }
        })

        // ค้นหานักเรียนตามระดับชั้นที่เลือก
        let whereCondition = {}
        
        if (!levels.includes("all")) {
            whereCondition = {
                level: {
                    in: levels
                }
            }
        }

        const students = await prisma.student.findMany({ where: whereCondition })

        // สร้าง attendance records ใหม่สำหรับนักเรียนที่พบ
        if (students.length > 0) {
            await prisma.attendance.createMany({
                data: students.map(student => ({
                    eventId: event.id,
                    studentId: student.id,
                    status: "absent"
                }))
            })
        }

        return NextResponse.json({ event })
    } catch (err) {
        console.error("Error updating event:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" },
            { status: 500 }
        )
    }
}

// DELETE /api/events - ลบกิจกรรม
export async function DELETE(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { message: "กรุณาระบุกิจกรรมที่ต้องการลบ" },
                { status: 400 }
            )
        }

        await prisma.event.delete({
            where: { id }
        })

        return NextResponse.json({ message: "ลบกิจกรรมเรียบร้อยแล้ว" })
    } catch (err) {
        console.error("Error deleting event:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
            { status: 500 }
        )
    }
}
