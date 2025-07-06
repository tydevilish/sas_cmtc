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

// GET /api/clubs/weeks - ดึงข้อมูลสัปดาห์และการเช็คชื่อ
export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const clubId = searchParams.get("clubId")
        const weekId = searchParams.get("weekId")
        const level = searchParams.get("level")
        const search = searchParams.get("search")

        if (!clubId) {
            return NextResponse.json(
                { message: "กรุณาระบุชมรม" },
                { status: 400 }
            )
        }

        // ถ้ามี weekId ให้ดึงข้อมูลการเช็คชื่อของสัปดาห์นั้น
        if (weekId) {
            const week = await prisma.week.findUnique({
                where: { id: weekId },
                include: {
                    attendance: {
                        include: {
                            member: {
                                include: {
                                    student: true
                                }
                            }
                        }
                    }
                }
            })

            if (!week) {
                return NextResponse.json(
                    { message: "ไม่พบข้อมูลสัปดาห์" },
                    { status: 404 }
                )
            }

            // กรองตามระดับชั้นและค้นหา
            let attendance = week.attendance
            if (level) {
                attendance = attendance.filter(a => a.member.student.level === level)
            }
            if (search) {
                attendance = attendance.filter(a => {
                    const student = a.member.student
                    return student.studentId.includes(search) ||
                        student.firstName.includes(search) ||
                        student.lastName.includes(search)
                })
            }

            return NextResponse.json({ 
                week: {
                    ...week,
                    attendance
                }
            })
        }

        // ถ้าไม่มี weekId ให้ดึงข้อมูลสัปดาห์ทั้งหมดของชมรม
        const weeks = await prisma.week.findMany({
            where: { clubId },
            orderBy: {
                weekNumber: 'asc'
            }
        })

        return NextResponse.json({ weeks })
    } catch (err) {
        console.error("Error fetching weeks:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/clubs/weeks - สร้างสัปดาห์ใหม่
export async function POST(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { clubId } = body

        if (!clubId) {
            return NextResponse.json(
                { message: "กรุณาระบุชมรม" },
                { status: 400 }
            )
        }

        // หาสัปดาห์ล่าสุด
        const latestWeek = await prisma.week.findFirst({
            where: { clubId },
            orderBy: {
                weekNumber: 'desc'
            }
        })

        const nextWeekNumber = latestWeek ? latestWeek.weekNumber + 1 : 1

        // สร้างสัปดาห์ใหม่
        const week = await prisma.week.create({
            data: {
                clubId,
                weekNumber: nextWeekNumber
            }
        })

        // ดึงรายชื่อสมาชิกทั้งหมด
        const members = await prisma.clubMember.findMany({
            where: { clubId }
        })

        // สร้างการเช็คชื่อสำหรับทุกคน
        if (members.length > 0) {
            await prisma.clubAttendance.createMany({
                data: members.map(member => ({
                    weekId: week.id,
                    memberId: member.id,
                    status: "absent"
                }))
            })
        }

        return NextResponse.json({ week })
    } catch (err) {
        console.error("Error creating week:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างสัปดาห์" },
            { status: 500 }
        )
    }
}

// PUT /api/clubs/weeks - อัพเดทการเช็คชื่อ
export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { weekId, memberId, status } = body

        if (!weekId || !memberId || !status) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        const attendance = await prisma.clubAttendance.update({
            where: {
                weekId_memberId: {
                    weekId,
                    memberId
                }
            },
            data: { status }
        })

        return NextResponse.json({ attendance })
    } catch (err) {
        console.error("Error updating attendance:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการอัพเดทการเช็คชื่อ" },
            { status: 500 }
        )
    }
} 