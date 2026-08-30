import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 30 * 1024 * 1024); // 30 MB
const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp|svg\+xml|avif)|video\/(mp4|webm|quicktime))$/;

async function requireAdmin(request: Request): Promise<boolean> {
  const cookie = request.headers.get('cookie') || '';
  const auth = request.headers.get('authorization') || '';
  if (!cookie && !auth.startsWith('Bearer ')) return false;
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/auth/me`, {
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(auth.startsWith('Bearer ') ? { Authorization: auth } : {}),
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Archivo demasiado grande' }, { status: 413 });
    }
    if (file.type && !ALLOWED_MIME.test(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 415 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${safeName}`;

    const blob = await put(filename, file, { access: 'public' });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
