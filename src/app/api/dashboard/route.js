import { NextResponse } from "next/server"
import prisma from "../../../../lib/prisma"
import { verifyAuth } from "../../../../lib/jwt"

export async function GET(req) {
    try {
        const token = req.cookies.get("token")?.value || ""
        const verifiedToken = await verifyAuth(token)

        if (!verifiedToken) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ" },
                { status: 401 }
            )
        }

        // Get total counts
        const [
            totalStudents,
            totalEvents,
            totalClubs,
            totalWeeks,
            recentEvents,
            recentClubs
        ] = await Promise.all([
            prisma.student.count(),
            prisma.event.count(),
            prisma.club.count(),
            prisma.week.count(),
            // Get 5 most recent events with attendance count
            prisma.event.findMany({
                take: 5,
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    _count: {
                        select: {
                            attendance: true
                        }
                    }
                }
            }),
            // Get 5 most recent clubs with member and week counts
            prisma.club.findMany({
                take: 5,
                orderBy: {
                    createdAt: "desc"
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
        ])

        return NextResponse.json({
            totalStudents,
            totalEvents,
            totalClubs,
            totalWeeks,
            recentEvents,
            recentClubs
        })
    } catch (error) {
        console.error("Dashboard error:", error)
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
            { status: 500 }
        )
    }
} 