import prisma from "../../../../../lib/prisma"
import bcrypt from "bcryptjs"
import { signJwt } from "../../../../../lib/jwt"
import { NextResponse } from "next/server"
import * as cookie from "cookie"

export async function POST(req) {
  const { username, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return NextResponse.json({ message: "ไม่พบผู้ใช้งาน" }, { status: 401 })
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 })
  }

  const token = signJwt({
    id: user.id,
    role: user.role,
    username: user.username,
  })

  const res = NextResponse.json({ message: "เข้าสู่ระบบสำเร็จ" })

  res.headers.set(
    "Set-Cookie",
    cookie.serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    })
  )

  return res
}
