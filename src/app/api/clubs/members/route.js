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

// GET /api/clubs/members - ดึงรายชื่อนักศึกษาที่ยังไม่ได้เป็นสมาชิกชมรม
export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const clubId = searchParams.get("clubId")
        const level = searchParams.get("level")
        const search = searchParams.get("search")

        if (!clubId) {
            return NextResponse.json(
                { message: "กรุณาระบุชมรม" },
                { status: 400 }
            )
        }

        // หานักศึกษาที่ยังไม่ได้เป็นสมาชิกชมรมนี้
        const where = {
            NOT: {
                clubs: {
                    some: {
                        clubId
                    }
                }
            }
        }

        if (level) {
            where.level = level
        }

        if (search) {
            where.OR = [
                { studentId: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } }
            ]
        }

        const students = await prisma.student.findMany({
            where,
            orderBy: [
                { level: 'asc' },
                { studentId: 'asc' }
            ]
        })

        return NextResponse.json({ students })
    } catch (err) {
        console.error("Error fetching available students:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/clubs/members - เพิ่มสมาชิกใหม่
export async function POST(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { clubId, studentId } = body

        if (!clubId || !studentId) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่านักศึกษาเป็นสมาชิกชมรมนี้อยู่แล้วหรือไม่
        const existingMember = await prisma.clubMember.findUnique({
            where: {
                clubId_studentId: {
                    clubId,
                    studentId
                }
            }
        })

        if (existingMember) {
            return NextResponse.json(
                { message: "นักศึกษาเป็นสมาชิกชมรมนี้อยู่แล้ว" },
                { status: 400 }
            )
        }

        // เพิ่มสมาชิกใหม่
        const member = await prisma.clubMember.create({
            data: {
                clubId,
                studentId
            },
            include: {
                student: true
            }
        })

        // หาสัปดาห์ทั้งหมดของชมรม
        const weeks = await prisma.week.findMany({
            where: { clubId }
        })

        // สร้างการเช็คชื่อสำหรับทุกสัปดาห์
        if (weeks.length > 0) {
            await prisma.clubAttendance.createMany({
                data: weeks.map(week => ({
                    weekId: week.id,
                    memberId: member.id,
                    status: "absent"
                }))
            })
        }

        return NextResponse.json({ member })
    } catch (err) {
        console.error("Error adding member:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการเพิ่มสมาชิก" },
            { status: 500 }
        )
    }
}

// DELETE /api/clubs/members - ลบสมาชิก
export async function DELETE(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const clubId = searchParams.get("clubId")
        const studentId = searchParams.get("studentId")

        if (!clubId || !studentId) {
            return NextResponse.json(
                { message: "กรุณาระบุข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        await prisma.clubMember.delete({
            where: {
                clubId_studentId: {
                    clubId,
                    studentId
                }
            }
        })

        return NextResponse.json({ message: "ลบสมาชิกเรียบร้อยแล้ว" })
    } catch (err) {
        console.error("Error removing member:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบสมาชิก" },
            { status: 500 }
        )
    }
} 