import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { listApplications } from '@/lib/store';
import Directory from './Directory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: 'Directory · Cinematy @ MU', robots: { index: false, follow: false } };

export default async function Admin() {
  if (!(await isAdmin())) redirect('/admin/login');
  let rows = [];
  let error = '';
  try {
    rows = await listApplications();
  } catch (e) {
    console.error(e);
    error = 'Couldn’t load applications. Check that the Blob store is connected.';
  }
  return <Directory initial={rows} error={error} />;
}
