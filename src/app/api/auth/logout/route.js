import { NextResponse } from "next/server"
import * as cookie from "cookie"

export async function POST() {
    const res = NextResponse.json({ message: "ออกจากระบบเรียบร้อย" })

    res.headers.set(
        "Set-Cookie",
        cookie.serialize("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        })
    )

    return res
}
