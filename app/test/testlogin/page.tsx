// 服务端组件中使用
import { getCurrentUser } from '@/app/lib/auth';

async function ServerComponent() {
  const user = await getCurrentUser();
  
  return (
    <div>
      <h2>Hello {user.name}</h2>
      <p>Your id is {user.id}</p>
      <p>Your email is {user.email}</p>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <h1>Test Login</h1>
      <ServerComponent />
    </div>
  );
}