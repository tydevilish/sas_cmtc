import "./globals.css"
import { Mitr } from "next/font/google"
import RootLayoutClient from "./RootLayoutClient"

const mitr = Mitr({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-mitr",
})

export const metadata = {
  title: "SAS | ระบบเช็คชื่อกิจกรรม",
  description: "ระบบเช็คชื่อกิจกรรมด้วย Next.js + MongoDB",
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${mitr.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>

  )
}
