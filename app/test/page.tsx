'use client';
import { useState, ChangeEvent } from 'react';

interface OCRItem {
  text: string;
  position: number[][];
}

interface ClassifiedResult {
  date: OCRItem[];
  amount: OCRItem[];
  payee: OCRItem[];
  raw_text: OCRItem[];
}

export default function OCRTest() {
  const [result, setResult] = useState<ClassifiedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 为每种类型创建独立的选中状态
  const [selectedItems, setSelectedItems] = useState<{
    date: number[];
    amount: number[];
    payee: number[];
    raw_text: number[];
  }>({
    date: [],
    amount: [],
    payee: [],
    raw_text: []
  });

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
        setResult(data.classified_result);
      } else {
        setError(data.message || '识别失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别过程出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理选中逻辑的函数
  const toggleSelection = (type: keyof ClassifiedResult, index: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type].includes(index)
        ? prev[type].filter(i => i !== index)
        : [...prev[type], index]
    }));
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

      {result && (
        <div className="mt-4 space-y-4">
          {result.date.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">日期</h3>
              <div className="flex flex-wrap gap-2">
                {result.date.map((item, index) => (
                  <div
                    key={`date-${index}`}
                    onClick={() => toggleSelection('date', index)}
                    className={`px-4 py-2 rounded-full border cursor-pointer transition-colors duration-200 
                      ${selectedItems.date.includes(index)
                        ? 'bg-green-500 text-white border-green-600'
                        : 'bg-green-50 border-green-300 hover:bg-green-100'
                      }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.amount.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">金额</h3>
              <div className="flex flex-wrap gap-2">
                {result.amount.map((item, index) => (
                  <div
                    key={`amount-${index}`}
                    onClick={() => toggleSelection('amount', index)}
                    className={`px-4 py-2 rounded-full border cursor-pointer transition-colors duration-200 
                      ${selectedItems.amount.includes(index)
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                      }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.payee.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">收款方</h3>
              <div className="flex flex-wrap gap-2">
                {result.payee.map((item, index) => (
                  <div
                    key={`payee-${index}`}
                    onClick={() => toggleSelection('payee', index)}
                    className={`px-4 py-2 rounded-full border cursor-pointer transition-colors duration-200 
                      ${selectedItems.payee.includes(index)
                        ? 'bg-purple-500 text-white border-purple-600'
                        : 'bg-purple-50 border-purple-300 hover:bg-purple-100'
                      }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.raw_text.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">其他内容</h3>
              <div className="flex flex-wrap gap-2">
                {result.raw_text.map((item, index) => (
                  <div
                    key={`raw-${index}`}
                    onClick={() => toggleSelection('raw_text', index)}
                    className={`px-4 py-2 rounded-full border cursor-pointer transition-colors duration-200 
                      ${selectedItems.raw_text.includes(index)
                        ? 'bg-gray-500 text-white border-gray-600'
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
