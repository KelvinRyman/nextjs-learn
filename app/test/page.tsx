'use client';
import { useState, ChangeEvent } from 'react';

interface OCRResult {
  text: string;
  confidence: number;
  position: number[][];
}

export default function OCRTest() {
  const [result, setResult] = useState<OCRResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.result);
      } else {
        setError(data.message || '识别失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别过程出错');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndexes(prev => {
      if (prev.includes(index)) {
        // 如果已选中，则移除
        return prev.filter(i => i !== index);
      } else {
        // 如果未选中，则添加
        return [...prev, index];
      }
    });
  };

  return (
    <div className="p-4">
      <input
        type="file"
        onChange={handleUpload}
        accept="image/*"
        className="mb-4"
      />

      {loading && <div className="text-blue-500">处理中...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {result.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-4">识别结果:</h2>
          <div className="flex flex-wrap gap-2">
            {result.map((item, index) => (
              <div
                key={index}
                onClick={() => toggleSelection(index)}
                className={`
                                px-4 py-2 
                                rounded-full 
                                border border-gray-300 
                                cursor-pointer 
                                transition-colors 
                                duration-200
                                ${selectedIndexes.includes(index)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100'}
                            `}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
