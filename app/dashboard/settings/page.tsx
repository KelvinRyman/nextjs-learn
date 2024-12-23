// import { fetchUserSettings, updateUserSettings } from '@/app/lib/data';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import SettingForm from '@/app/ui/settings/setting-form';
// import DeviceManagement from '@/app/ui/settings/device-management';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function Page() {
  // const userSettings = await fetchUserSettings();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
        设置
      </h1>
      <div className="mt-4 flex flex-col gap-8 md:mt-8">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">用户</h2>
          <SettingForm 
            label="设置用户名" 
            type="username" 
            placeholder="输入新的用户名"
          />
          <SettingForm 
            label="设置新邮箱" 
            type="email" 
            placeholder="输入新的邮箱地址"
          />
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">安全</h2>
          <SettingForm 
            label="修改密码" 
            type="password" 
            placeholder="输入新密码"
          />
        </div>
      </div>
    </main>
  );
}
