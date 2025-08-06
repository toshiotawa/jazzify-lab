import React, { useState } from 'react';
import { uploadImageToR2, listFilesFromR2, deleteFromR2 } from '../lib/cloudflare-r2';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function CloudflareR2Example() {
  const [files, setFiles] = useState<Array<{ key: string; size: number; lastModified: Date }>>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // デモ用のユーザーID（実際はSupabaseから取得）
      const userId = 'demo-user';
      const url = await uploadImageToR2(userId, file);
      setImageUrl(url);
      console.log('File uploaded successfully:', url);
      
      // ファイルリストを更新
      await loadFiles();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const fileList = await listFilesFromR2('images/');
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteFromR2(key);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Cloudflare R2 デモ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mb-2"
          />
          {uploading && <p>アップロード中...</p>}
        </div>

        {imageUrl && (
          <div>
            <h3 className="font-semibold mb-2">アップロードされた画像:</h3>
            <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded" />
            <p className="text-sm text-gray-600 mt-2">{imageUrl}</p>
          </div>
        )}

        <div>
          <Button onClick={loadFiles} variant="outline">
            ファイル一覧を取得
          </Button>
        </div>

        {files.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">ファイル一覧:</h3>
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{file.key}</p>
                    <p className="text-xs text-gray-600">
                      {Math.round(file.size / 1024)} KB - {file.lastModified.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(file.key)}
                  >
                    削除
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}