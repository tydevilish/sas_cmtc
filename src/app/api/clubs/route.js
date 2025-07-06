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

// GET /api/clubs - ดึงข้อมูลชมรมทั้งหมด
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
            const club = await prisma.club.findUnique({
                where: { id },
                include: {
                    members: {
                        include: {
                            student: true
                        }
                    },
                    weeks: {
                        orderBy: {
                            weekNumber: 'asc'
                        }
                    }
                }
            })
            return NextResponse.json({ club })
        }

        const where = {}
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ]
        }

        const clubs = await prisma.club.findMany({
            where,
            orderBy: {
                name: 'asc'
            },
            include: {
                _count: {
                    select: { 
                        members: true,
                        weeks: true
                    }
                }
            }
        })

        return NextResponse.json({ clubs })
    } catch (err) {
        console.error("Error fetching clubs:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/clubs - สร้างชมรมใหม่
export async function POST(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, description, icon } = body

        if (!name || !description) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่ามีชื่อชมรมนี้อยู่แล้วหรือไม่
        const existingClub = await prisma.club.findUnique({
            where: { name }
        })

        if (existingClub) {
            return NextResponse.json(
                { message: "มีชมรมนี้อยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        const club = await prisma.club.create({
            data: {
                name,
                description,
                icon
            }
        })

        return NextResponse.json({ club })
    } catch (err) {
        console.error("Error creating club:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างชมรม" },
            { status: 500 }
        )
    }
}

// PUT /api/clubs - แก้ไขข้อมูลชมรม
export async function PUT(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, name, description, icon } = body

        if (!id || !name || !description) {
            return NextResponse.json(
                { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่ามีชื่อชมรมนี้อยู่แล้วหรือไม่ (ยกเว้นชมรมที่กำลังแก้ไข)
        const existingClub = await prisma.club.findFirst({
            where: {
                name,
                NOT: { id }
            }
        })

        if (existingClub) {
            return NextResponse.json(
                { message: "มีชมรมนี้อยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        const club = await prisma.club.update({
            where: { id },
            data: {
                name,
                description,
                icon
            }
        })

        return NextResponse.json({ club })
    } catch (err) {
        console.error("Error updating club:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
            { status: 500 }
        )
    }
}

// DELETE /api/clubs - ลบชมรม
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
                { message: "กรุณาระบุชมรมที่ต้องการลบ" },
                { status: 400 }
            )
        }

        await prisma.club.delete({
            where: { id }
        })

        return NextResponse.json({ message: "ลบชมรมเรียบร้อยแล้ว" })
    } catch (err) {
        console.error("Error deleting club:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบชมรม" },
            { status: 500 }
        )
    }
} 