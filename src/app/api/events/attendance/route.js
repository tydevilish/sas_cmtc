import { NextResponse } from "next/server"
import prisma from "../../../../../lib/prisma"
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


export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { eventId, studentId, status } = body

        if (!eventId || !studentId || !status) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่าสถานะถูกต้อง
        if (!["present", "absent", "late"].includes(status)) {
            return NextResponse.json(
                { message: "สถานะไม่ถูกต้อง" },
                { status: 400 }
            )
        }

        // หา attendance record ด้วย eventId และ studentId
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                AND: [
                    { eventId: eventId },
                    { studentId: studentId }
                ]
            }
        })

        if (!existingAttendance) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลการเข้าร่วมกิจกรรม" },
                { status: 404 }
            )
        }

        // อัพเดทด้วย id
        const attendance = await prisma.attendance.update({
            where: {
                id: existingAttendance.id
            },
            data: { 
                status: status 
            },
            include: {
                student: true
            }
        })

        return NextResponse.json({ attendance })
    } catch (err) {
        console.error("Error updating attendance:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการอัพเดทสถานะ" },
            { status: 500 }
        )
    }
}

// GET /api/events/attendance - ดึงข้อมูลการเข้าร่วมกิจกรรมตามเงื่อนไข
export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("eventId")
        const level = searchParams.get("level")
        const search = searchParams.get("search")

        if (!eventId) {
            return NextResponse.json(
                { message: "กรุณาระบุกิจกรรม" },
                { status: 400 }
            )
        }

        // ดึงข้อมูลกิจกรรมเพื่อตรวจสอบระดับชั้นที่เลือก
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        })

        if (!event) {
            return NextResponse.json(
                { message: "ไม่พบกิจกรรมที่ต้องการ" },
                { status: 404 }
            )
        }

        const where = {
            eventId
        }

        // ถ้าไม่ได้เลือก "all" ให้กรองตามระดับชั้นที่เลือกในกิจกรรม
        if (!event.levels.includes("all")) {
            where.student = {
                level: { in: event.levels }
            }
        }

        // เพิ่มเงื่อนไขการค้นหาเพิ่มเติม
        if (level || search) {
            where.student = {
                ...where.student,
                ...(level && { level }),
                ...(search && {
                    OR: [
                        { studentId: { contains: search } },
                        { firstName: { contains: search } },
                        { lastName: { contains: search } }
                    ]
                })
            }
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                student: true
            },
            orderBy: {
                student: {
                    studentId: 'asc'
                }
            }
        })

        return NextResponse.json({ attendance })
    } catch (err) {
        console.error("Error fetching attendance:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
} 