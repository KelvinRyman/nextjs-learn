import { auth } from '@/auth';
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user) {
    throw new Error('未认证');
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email
  };
});

export const getCurrentUserId = cache(async () => {
  const user = await getCurrentUser();
  return user.id;
});
