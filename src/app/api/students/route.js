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
        const { searchParams } = new URL(request.url)
        const level = searchParams.get("level")
        const search = searchParams.get("search")

        const where = {}
        
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
            orderBy: {
                studentId: 'asc'
            }
        })

        return NextResponse.json({ students })
    } catch (err) {
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/students - เพิ่มนักศึกษาใหม่
export async function POST(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { studentId, prefix, firstName, lastName, level } = body

        if (!studentId || !prefix || !firstName || !lastName || !level) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        const existingStudent = await prisma.student.findUnique({
            where: { studentId }
        })

        if (existingStudent) {
            return NextResponse.json(
                { message: "รหัสนักศึกษานี้มีอยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        // สร้างนักศึกษาใหม่
        const student = await prisma.student.create({
            data: {
                studentId,
                prefix,
                firstName,
                lastName,
                level
            }
        })

        // ค้นหากิจกรรมที่เกี่ยวข้องกับระดับชั้นของนักศึกษา
        const relevantEvents = await prisma.event.findMany({
            where: {
                OR: [
                    { levels: { has: level } },
                    { levels: { has: "all" } }
                ],
                status: {
                    not: "completed" // เฉพาะกิจกรรมที่ยังไม่เสร็จสิ้น
                }
            }
        })

        // สร้าง attendance records สำหรับกิจกรรมที่เกี่ยวข้อง
        if (relevantEvents.length > 0) {
            await prisma.attendance.createMany({
                data: relevantEvents.map(event => ({
                    eventId: event.id,
                    studentId: student.id,
                    status: "absent"
                }))
            })
        }

        return NextResponse.json({ student })
    } catch (err) {
        console.error("Error creating student:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการเพิ่มนักศึกษา" },
            { status: 500 }
        )
    }
}

// PUT /api/students - แก้ไขข้อมูลนักศึกษา
export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, studentId, prefix, firstName, lastName, level } = body

        if (!id || !studentId || !prefix || !firstName || !lastName || !level) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        const existingStudent = await prisma.student.findFirst({
            where: {
                studentId,
                NOT: { id }
            }
        })

        if (existingStudent) {
            return NextResponse.json(
                { message: "รหัสนักศึกษานี้มีอยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        // ดึงข้อมูลนักศึกษาเดิม
        const currentStudent = await prisma.student.findUnique({
            where: { id }
        })

        // อัพเดทข้อมูลนักศึกษา
        const student = await prisma.student.update({
            where: { id },
            data: {
                studentId,
                prefix,
                firstName,
                lastName,
                level
            }
        })

        // ถ้าระดับชั้นมีการเปลี่ยนแปลง
        if (currentStudent.level !== level) {
            // ลบ attendance records ของกิจกรรมที่ไม่เกี่ยวข้องกับระดับชั้นใหม่
            await prisma.attendance.deleteMany({
                where: {
                    studentId: id,
                    event: {
                        AND: [
                            { status: { not: "completed" } },
                            {
                                NOT: {
                                    OR: [
                                        { levels: { has: level } },
                                        { levels: { has: "all" } }
                                    ]
                                }
                            }
                        ]
                    }
                }
            })

            // ค้นหากิจกรรมใหม่ที่เกี่ยวข้องกับระดับชั้นใหม่
            const newEvents = await prisma.event.findMany({
                where: {
                    OR: [
                        { levels: { has: level } },
                        { levels: { has: "all" } }
                    ],
                    status: { not: "completed" },
                    NOT: {
                        attendance: {
                            some: {
                                studentId: id
                            }
                        }
                    }
                }
            })

            // สร้าง attendance records สำหรับกิจกรรมใหม่
            if (newEvents.length > 0) {
                await prisma.attendance.createMany({
                    data: newEvents.map(event => ({
                        eventId: event.id,
                        studentId: id,
                        status: "absent"
                    }))
                })
            }
        }

        return NextResponse.json({ student })
    } catch (err) {
        console.error("Error updating student:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
            { status: 500 }
        )
    }
}

// DELETE /api/students - ลบนักศึกษา
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
                { message: "กรุณาระบุนักศึกษาที่ต้องการลบ" },
                { status: 400 }
            )
        }

        await prisma.student.delete({
            where: { id }
        })

        return NextResponse.json({ message: "ลบนักศึกษาเรียบร้อยแล้ว" })
    } catch (err) {
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบนักศึกษา" },
            { status: 500 }
        )
    }
}
