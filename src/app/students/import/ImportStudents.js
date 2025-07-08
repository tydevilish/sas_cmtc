'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportStudents() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile?.type !== 'text/csv') {
            setError('กรุณาเลือกไฟล์ CSV เท่านั้น');
            return;
        }
        setFile(selectedFile);
        setError(null);
    };

    const downloadTemplate = () => {
        const headers = ['studentId', 'prefix', 'firstName', 'lastName', 'level'];
        const csvContent = headers.join(',') + '\n';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('กรุณาเลือกไฟล์');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/students/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
            }

            alert(data.message);
            if (data.errorCount > 0) {
                setError(`มีข้อผิดพลาด ${data.errorCount} รายการ:\n` + 
                    data.errors.map(err => `- รหัส ${err.studentId}: ${err.error}`).join('\n'));
            }
            router.refresh();
            if (data.successCount > 0) {
                router.push('/students');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2 text-black">คำแนะนำ</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>ไฟล์ต้องเป็นรูปแบบ CSV เท่านั้น</li>
                            <li>ต้องมีคอลัมน์ครบตามที่กำหนด: รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล, ระดับชั้น</li>
                            <li>ระดับชั้นต้องเป็นค่าใดค่าหนึ่งต่อไปนี้: ปวช.1, ปวช.2, ปวช.3, ปวส.1 สายตรง, ปวส.1 สาย ม.6, ปวส.2 สายตรง, ปวส.2 สาย ม.6</li>
                        </ul>
                    </div>

                    <div className="mb-6">
                        <button
                            onClick={downloadTemplate}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ดาวน์โหลดไฟล์ตัวอย่าง CSV
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                เลือกไฟล์ CSV
                            </label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !file}
                                className={`
                px-4 py-2 rounded-md text-white font-medium
                ${loading || !file
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'}
              `}
                            >
                                {loading ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

    );
} 