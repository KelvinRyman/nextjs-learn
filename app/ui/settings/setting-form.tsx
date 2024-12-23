'use client';

import { useActionState } from 'react';
import { updateUsername, updateEmail, updatePassword, SettingState } from '@/app/lib/actions';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline'; // 添加这行导入

export default function SettingForm({
  label,
  type,
  placeholder
}: {
  label: string;
  type: 'username' | 'email' | 'password';
  placeholder?: string;
}) {
  const initialState: SettingState = { message: '' }; // 初始化为空字符串而不是null
  
  // 使用类型断言确保action类型正确
  const action = type === 'username' ? updateUsername :
                type === 'email' ? updateEmail :
                updatePassword;

  const [state, formAction] = useActionState(
    action,
    initialState
  );
  const [oldPassword, setOldPassword] = useState('');

  return (
    <form action={formAction} className="mb-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 mb-4 flex flex-col gap-2">
        {type === 'password' && (
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            name="oldPassword"
            placeholder="输入旧密码"
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
          />
        )}
        <div className="flex gap-2">
          <input
            type={type === 'password' ? 'password' : 'text'}
            name="value"
            placeholder={placeholder}
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {state.message && (
        <p className={`mt-2 text-sm ${state.message.includes('成功') ? 'text-green-500' : 'text-red-500'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
