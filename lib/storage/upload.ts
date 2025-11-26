import { createClient as createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  id: string;
  url: string;
  objectKey: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export async function uploadFile(
  file: File | Buffer,
  options: {
    bucket?: string;
    workspaceId: string;
    fileName?: string;
    contentType?: string;
  }
): Promise<UploadResult> {
  const supabase = createServerClient();
  const { bucket = 'files', workspaceId, fileName, contentType } = options;

  const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const name = fileName || (file instanceof File ? file.name : 'file');
  const ext = name.split('.').pop() || 'bin';
  const objectKey = `${workspaceId}/${uuidv4()}.${ext}`;
  const mimeType = contentType || (file instanceof File ? file.type : 'application/octet-stream');

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectKey, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(objectKey);

  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      storage: 'supabase',
      object_key: objectKey,
      url: publicUrl,
      size: fileBuffer.length,
      mime_type: mimeType,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from(bucket).remove([objectKey]);
    throw new Error(`Failed to save file record: ${dbError.message}`);
  }

  return {
    id: fileRecord.id,
    url: publicUrl,
    objectKey,
    size: fileBuffer.length,
    mimeType,
  };
}

export async function deleteFile(
  fileId: string,
  bucket: string = 'files'
): Promise<void> {
  const supabase = createServerClient();

  const { data: file } = await supabase
    .from('files')
    .select('object_key')
    .eq('id', fileId)
    .single();

  if (!file) {
    throw new Error('File not found');
  }

  await supabase.storage.from(bucket).remove([file.object_key]);
  await supabase.from('files').delete().eq('id', fileId);
}

export async function getSignedUrl(
  objectKey: string,
  bucket: string = 'files',
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectKey, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
