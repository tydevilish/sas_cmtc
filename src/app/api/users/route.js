import { NextResponse } from "next/server"
import prisma from "../../../../lib/prisma"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import bcrypt from "bcryptjs"

// ตรวจสอบสิทธิ์และบทบาทของผู้ใช้
async function checkAuth(requiredRole = null) {
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

        if (!user) {
            return null
        }

        // ตรวจสอบบทบาท
        if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
            return null
        }

        return user
    } catch (err) {
        console.error("Auth error:", err)
        return null
    }
}

// ตรวจสอบความถูกต้องของข้อมูลผู้ใช้
function validateUserData(data, isUpdate = false) {
    const errors = []
    const { username, password, role, name } = data

    if (!username?.trim()) {
        errors.push("กรุณากรอกชื่อผู้ใช้")
    } else if (username.length < 4) {
        errors.push("ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 4 ตัวอักษร")
    }

    if (!isUpdate && !password?.trim()) {
        errors.push("กรุณากรอกรหัสผ่าน")
    } else if (!isUpdate && password.length < 6) {
        errors.push("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
    }

    if (role && !["admin", "teacher"].includes(role)) {
        errors.push("บทบาทไม่ถูกต้อง")
    }

    return errors
}

// GET /api/users - ดึงรายการผู้ใช้
export async function GET(request) {
    const authUser = await checkAuth()
    if (!authUser) {
        return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูล" }, { status: 401 })
    }

    try {
        // รับพารามิเตอร์การค้นหา
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search")
        const role = searchParams.get("role")
        const sort = searchParams.get("sort") || "createdAt"
        const order = searchParams.get("order") || "desc"

        // สร้างเงื่อนไขการค้นหา
        const where = {}
        if (search) {
            where.OR = [
                { username: { contains: search } },
                { name: { contains: search } }
            ]
        }
        if (role) {
            where.role = role
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                [sort]: order
            }
        })

        return NextResponse.json({ users })
    } catch (err) {
        console.error("Error fetching users:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        )
    }
}

// POST /api/users - เพิ่มผู้ใช้ใหม่
export async function POST(request) {
    const authUser = await checkAuth("admin")
    if (!authUser) {
        return NextResponse.json({ message: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 401 })
    }

    try {
        const data = await request.json()

        // ตรวจสอบความถูกต้องของข้อมูล
        const errors = validateUserData(data)
        if (errors.length > 0) {
            return NextResponse.json({ message: errors[0], errors }, { status: 400 })
        }

        const { username, password, role, name } = data

        // ตรวจสอบชื่อผู้ใช้ซ้ำ
        const existingUser = await prisma.user.findUnique({
            where: { username }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 12)

        // สร้างผู้ใช้ใหม่
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role || "teacher",
                name: name?.trim() || null
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({
            message: "สร้างผู้ใช้เรียบร้อยแล้ว",
            user
        })
    } catch (err) {
        console.error("Error creating user:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" },
            { status: 500 }
        )
    }
}

// PUT /api/users - แก้ไขข้อมูลผู้ใช้
export async function PUT(request) {
    const authUser = await checkAuth("admin")
    if (!authUser) {
        return NextResponse.json({ message: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 401 })
    }

    try {
        const data = await request.json()
        const { id } = data

        if (!id) {
            return NextResponse.json(
                { message: "กรุณาระบุผู้ใช้ที่ต้องการแก้ไข" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const targetUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!targetUser) {
            return NextResponse.json(
                { message: "ไม่พบผู้ใช้ในระบบ" },
                { status: 404 }
            )
        }

        // ตรวจสอบความถูกต้องของข้อมูล
        const errors = validateUserData(data, true)
        if (errors.length > 0) {
            return NextResponse.json({ message: errors[0], errors }, { status: 400 })
        }

        const { username, password, role, name } = data

        // ตรวจสอบชื่อผู้ใช้ซ้ำ
        const existingUser = await prisma.user.findFirst({
            where: {
                username,
                NOT: { id }
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" },
                { status: 400 }
            )
        }

        // สร้างข้อมูลสำหรับการอัพเดท
        const updateData = {
            username,
            role: role || targetUser.role,
            name: name?.trim() || null
        }

        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (password?.trim()) {
            updateData.password = await bcrypt.hash(password, 12)
        }

        // อัพเดทข้อมูล
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return NextResponse.json({
            message: "แก้ไขข้อมูลเรียบร้อยแล้ว",
            user
        })
    } catch (err) {
        console.error("Error updating user:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
            { status: 500 }
        )
    }
}

// DELETE /api/users - ลบผู้ใช้
export async function DELETE(request) {
    const authUser = await checkAuth("admin")
    if (!authUser) {
        return NextResponse.json({ message: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { message: "กรุณาระบุผู้ใช้ที่ต้องการลบ" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่าไม่ใช่การลบตัวเอง
        if (id === authUser.id) {
            return NextResponse.json(
                { message: "ไม่สามารถลบบัญชีของตัวเองได้" },
                { status: 400 }
            )
        }

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const targetUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!targetUser) {
            return NextResponse.json(
                { message: "ไม่พบผู้ใช้ในระบบ" },
                { status: 404 }
            )
        }

        // ลบผู้ใช้
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ message: "ลบผู้ใช้เรียบร้อยแล้ว" })
    } catch (err) {
        console.error("Error deleting user:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการลบผู้ใช้" },
            { status: 500 }
        )
    }
}