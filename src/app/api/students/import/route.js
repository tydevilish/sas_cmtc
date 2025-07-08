import { NextResponse } from 'next/server';
import prisma from "../../../../../lib/prisma"
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return null;
  }

  try {
    const decoded = verify(token.value, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id
      }
    });

    return user;
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  const authUser = await checkAuth();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'กรุณาอัพโหลดไฟล์' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const records = [];

    // Parse CSV
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true
    });

    // Process the CSV data
    await new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(parser)
        .on('data', (data) => {
          records.push({
            studentId: data.studentId?.trim(),
            prefix: data.prefix?.trim(),
            firstName: data.firstName?.trim(),
            lastName: data.lastName?.trim(),
            level: data.level?.trim(),
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate records
    const invalidRecords = records.filter(
      record => !record.studentId || !record.prefix || !record.firstName || !record.lastName || !record.level
    );

    if (invalidRecords.length > 0) {
      return NextResponse.json(
        {
          error: 'พบข้อมูลไม่ครบถ้วน',
          invalidRecords
        },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        // ตรวจสอบว่ามีรหัสนักศึกษานี้อยู่แล้วหรือไม่
        const existingStudent = await prisma.student.findUnique({
          where: { studentId: record.studentId }
        });

        if (existingStudent) {
          errors.push({
            studentId: record.studentId,
            error: "รหัสนักศึกษานี้มีอยู่ในระบบแล้ว"
          });
          continue;
        }

        // สร้างนักศึกษาใหม่
        const student = await prisma.student.create({
          data: record
        });

        // ค้นหากิจกรรมที่เกี่ยวข้องกับระดับชั้นของนักศึกษา
        const relevantEvents = await prisma.event.findMany({
          where: {
            OR: [
              { levels: { has: record.level } },
              { levels: { has: "all" } }
            ],
            status: {
              not: "completed"
            }
          }
        });

        // สร้าง attendance records สำหรับกิจกรรมที่เกี่ยวข้อง
        if (relevantEvents.length > 0) {
          await prisma.attendance.createMany({
            data: relevantEvents.map(event => ({
              eventId: event.id,
              studentId: student.id,
              status: "absent"
            }))
          });
        }

        results.push(student);
      } catch (error) {
        console.error('Error processing student:', record, error);
        errors.push({
          studentId: record.studentId,
          error: "เกิดข้อผิดพลาดในการเพิ่มนักศึกษา"
        });
      }
    }

    return NextResponse.json({
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว ${results.length} รายการ${errors.length > 0 ? ` (ผิดพลาด ${errors.length} รายการ)` : ''}`,
      successCount: results.length,
      errorCount: errors.length,
      errors: errors
    });

  } catch (error) {
    console.error('Error importing students:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' },
      { status: 500 }
    );
  }
} 