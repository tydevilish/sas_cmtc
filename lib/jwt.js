import jwt from "jsonwebtoken"

const secret = process.env.JWT_SECRET || "my-secret"

export function signJwt(payload) {
    return jwt.sign(payload, secret, { expiresIn: "7d" })
}

export function verifyJwt(token) {
    try {
        return jwt.verify(token, secret)
    } catch {
        return null
    }
}