import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/Shell';

export const dynamic = 'force-dynamic';

export default async function OSLayout({ children }) {
  const u = await currentUser();
  if (!u) redirect('/login');
  return <Shell>{children}</Shell>;
}
