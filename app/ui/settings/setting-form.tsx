'use client';

import { SettingField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
} from '@heroicons/react/24/outline';
import { SaveUserSetting } from '@/app/ui/settings/buttons';
import { useActionState } from 'react';
import { getSession } from 'next-auth/react';

async function getCurrentUser() {
  const session = await getSession();
  if (session && session.user) {
    return session.user;
  } else {
    return null;
  }
}

export default function SettingForm({
  label, settings, placeholder
}: {
  label: string;
  settings?: SettingField[];
  placeholder?: string;
}) {
  // const initialState: SettingField = { id: '', name: '', email: '', password: '' };
  // const [state, formAction] = useActionState(updateUserSettings, initialState);
  return (
    <div className="setting-form">
      <label className="mb-4 block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 mb-4 flex rounded-md">
        <input
          type="text"
          // value={inputValue}
          // onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2 placeholder:text-gray-500 shadow-sm"
        />
        <SaveUserSetting display="保存" />
      </div>
    </div>
  );
}
