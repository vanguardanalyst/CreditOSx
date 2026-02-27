import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pdf = form.get('file');

  if (!pdf) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  return NextResponse.json({
    message: 'PDF upload accepted for pipeline preprocessing. Use OCR/text extraction service before /api/analyze.',
    filename: (pdf as File).name
  });
}
