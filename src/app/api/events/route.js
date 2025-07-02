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
        const id = searchParams.get("id")
        const search = searchParams.get("search")

        // ถ้ามี id ให้ดึงข้อมูลกิจกรรมเดียวพร้อมข้อมูลการเข้าร่วม
        if (id) {
            const event = await prisma.event.findUnique({
                where: { id },
                include: {
                    attendance: {
                        include: {
                            student: true
                        }
                    }
                }
            })

            if (!event) {
                return NextResponse.json(
                    { message: "ไม่พบกิจกรรมที่ต้องการ" },
                    { status: 404 }
                )
            }

            return NextResponse.json({ event })
        }

        // ถ้าไม่มี id ให้ดึงรายการกิจกรรมทั้งหมด
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
        const { title, description, date, startTime, endTime } = body

        if (!title || !description || !date || !startTime || !endTime) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                status: "upcoming"
            }
        })

        // สร้าง attendance records สำหรับนักศึกษาทุกคน
        const students = await prisma.student.findMany()
        await prisma.attendance.createMany({
            data: students.map(student => ({
                eventId: event.id,
                studentId: student.id,
                status: "absent"
            }))
        })

        return NextResponse.json({ event })
    } catch (err) {
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างกิจกรรม" },
            { status: 500 }
        )
    }
}

// PUT /api/events - แก้ไขข้อมูลกิจกรรม
export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, title, description, date, startTime, endTime, status } = body

        if (!id || !title || !description || !date || !startTime || !endTime) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                status: status || "upcoming"
            }
        })

        return NextResponse.json({ event })
    } catch (err) {
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
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
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
            { status: 500 }
        )
    }
}
