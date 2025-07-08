import ImportStudents from './ImportStudents';

export default function ImportStudentsPage() {
  return (
    <main className="flex-grow pt-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black">นำเข้าข้อมูลนักเรียน</h1>
        <ImportStudents />
      </div>
    </main>
  );
} 