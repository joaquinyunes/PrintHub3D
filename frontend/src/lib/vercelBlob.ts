export const VERCEL_BLOB_API_URL = '/api/upload';

export async function uploadToVercelBlob(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(VERCEL_BLOB_API_URL, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error('Error uploading file');
  }
  
  const data = await res.json();
  return data.url || data.path || '';
}

export async function uploadImageToVercelBlob(imageUrl: string): Promise<string> {
  if (!imageUrl || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    return await uploadToVercelBlob(file);
  } catch {
    return imageUrl;
  }
}