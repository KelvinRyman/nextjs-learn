'use client';

import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  PhotoIcon,
  MicrophoneIcon,
  CalendarIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createInvoice, InvoiceState } from '@/app/lib/actions';
import { useActionState } from 'react';
import { useState } from 'react';
import OCRForm from './ocr-form';

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState: InvoiceState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createInvoice, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    // 检查是否为图片
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件!');
      return;
    }

    // 创建预览URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 保存当前文件
    setCurrentFile(file);
    // 重置OCR显示状态
    setShowOCR(false);

    // 更新文件输入
    const fileInput = document.getElementById('invoice-upload') as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
  };

  // 处理OCR识别结果
  const handleOCRSelect = (type: string, text: string, index: number | null) => {
    if (type === 'date') {
      setSelectedDate(index); // 保存选中的日期索引
      
      if (index === null) {
        // 如果取消选择，清空时间输入框
        const dateInput = document.getElementById('reminder-time') as HTMLInputElement;
        if (dateInput) {
          dateInput.value = '';
        }
        return;
      }

      // 将中文日期格式转换为datetime-local格式
      const dateStr = text.replace(/[年月]/g, '-').replace(/[日号]/g, '');
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toISOString().slice(0, 16);
        const dateInput = document.getElementById('reminder-time') as HTMLInputElement;
        if (dateInput) {
          dateInput.value = formattedDate;
        }
      }
    } else if (type === 'amount') {
      setSelectedAmount(index);

      if (index === null) {
        // 如果取消选择，清空金额输入框
        const amountInput = document.getElementById('amount') as HTMLInputElement;
        if (amountInput) {
          amountInput.value = '';
        }
        return;
      }

      // 提取数字金额，检查是否包含+号
      const isIncome = text.includes('+');
      // 移除所有非数字字符（保留小数点），包括+号和-号
      const amountStr = text.replace(/[^0-9.]/g, '');
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount)) {
        const amountInput = document.getElementById('amount') as HTMLInputElement;
        if (amountInput) {
          amountInput.value = amount.toString();
        }

        // 如果是收入（包含+号），自动选择"收入"状态
        if (isIncome) {
          const incomeRadio = document.getElementById('income') as HTMLInputElement;
          if (incomeRadio) {
            incomeRadio.checked = true;
          }
        }
      }
    } else if (type === 'payee') {
      setSelectedPayee(index);
      
      if (index === null) {
        // 如果取消选择，清空客户选择
        const customerSelect = document.getElementById('customer') as HTMLSelectElement;
        if (customerSelect) {
          customerSelect.value = '';
        }
        return;
      }

      // 在现有客户中查找匹配的收款方
      const payeeText = text.trim();
      const matchedCustomer = customers.find(customer => 
        customer.name.includes(payeeText) || payeeText.includes(customer.name)
      );

      if (matchedCustomer) {
        const customerSelect = document.getElementById('customer') as HTMLSelectElement;
        if (customerSelect) {
          customerSelect.value = matchedCustomer.id;
        }
      }
    }
  };

  // 处理时间输入框变化
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(null); // 清除日期选中状态
  };

  // 处理金额输入框变化
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(null);
  };

  // 处理客户选择变化
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPayee(null);
  };

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* 对象名称 */}
        <div className="mb-4">
          <label htmlFor="customer" className="mb-2 block text-sm font-medium">
            选择对象
          </label>
          <div className="relative">
            <select
              id="customer"
              name="customerId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="customer-error"
              onChange={handleCustomerChange}
            >
              <option value="" disabled>
                选择一个对象
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div id="customer-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerId &&
              state.errors.customerId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* 开支金额 */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            输入金额
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="输入金额"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="amount-error"
                onChange={handleAmountInputChange}
              />
              <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>

          <div id="amount-error" aria-live="polite" aria-atomic="true">
            {state.errors?.amount &&
              state.errors.amount.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* 开支状态 */}
        <fieldset className="mb-4">
          <legend className="mb-2 block text-sm font-medium">
            设置开支状态
          </legend>
          <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="pending"
                  name="status"
                  type="radio"
                  value="pending"
                  className="text-white-600 h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 focus:ring-2"
                />
                <label
                  htmlFor="pending"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  待处理 <ClockIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="paid"
                  name="status"
                  type="radio"
                  value="paid"
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                <label
                  htmlFor="paid"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  已支付 <CheckIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="income"
                  name="status"
                  type="radio"
                  value="income"
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="income"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  收入 <ArrowDownIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
          <div id="status-error" aria-live="polite" aria-atomic="true">
            {state.errors?.status &&
              state.errors.status.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </fieldset>

        {/* 选择提醒时间 */}
        <div className="mb-4">
          <label htmlFor="reminder-time" className="mb-2 block text-sm font-medium">
            选择时间
          </label>
          <div className="relative mt-2 rounded-md">
            <input
              id="reminder-time"
              name="reminderTime"
              type="datetime-local"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="reminder-time-error"
              onChange={handleDateInputChange}
            />
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="reminder-time-error" aria-live="polite" aria-atomic="true">
            {/*state.errors?.reminderTime &&
              state.errors.reminderTime.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))*/}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            备注
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <textarea
                id="notes"
                name="notes"
                placeholder="添加备注信息"
                className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 resize-none"
                rows={3}
                aria-describedby="notes-error"
              />
            </div>
          </div>
        </div>

        {/* OCR */}
        <div>
          <legend className="mb-2 block text-sm font-medium">
            上传发票
          </legend>
          <div className="flex gap-4">
            <div
              className={`border rounded-lg flex flex-col items-center justify-center transition-all
                ${showOCR ? 'w-1/2 p-2' : 'w-full p-4'}
              `}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {preview ? (
                <>
                  <div className="relative w-full h-48 mb-2">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                      onClick={() => {
                        setPreview(null);
                        setCurrentFile(null);
                        setShowOCR(false);
                        const fileInput = document.getElementById('invoice-upload') as HTMLInputElement;
                        fileInput.value = '';
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 flex items-center gap-2"
                      onClick={() => {
                        if (currentFile) {
                          setShowOCR(true);
                          // 触发 OCRForm 组件中的识别方法
                          const ocrForm = document.getElementById('ocr-form') as any;
                          if (ocrForm?.performOCR) {
                            ocrForm.performOCR(currentFile);
                          }
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      识别发票
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-2">拖拽文件到此处或点击上传</p>
                </>
              )}
              <input
                type="file"
                name="invoice"
                className="hidden"
                id="invoice-upload"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              {!preview && (
                <label
                  htmlFor="invoice-upload"
                  className="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  选择文件
                </label>
              )}
            </div>

            {/* OCR结果显示区域 */}
            {showOCR && currentFile && (
              <div className="w-1/2">
                <OCRForm 
                  file={currentFile} 
                  onSelect={handleOCRSelect}
                  selectedDate={selectedDate}
                  selectedAmount={selectedAmount}
                  selectedPayee={selectedPayee}
                />
              </div>
            )}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true"></div>
        {state.message ? (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link href="#" className="flex h-10 items-center rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200">
          <MicrophoneIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          取消
        </Link>
        <Button type="submit">创建开支记录</Button>
      </div>
    </form>
  );
}
