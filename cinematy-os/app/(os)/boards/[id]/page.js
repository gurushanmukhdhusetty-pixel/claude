'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { call } from '@/components/store';

const Editor = dynamic(() => import('@/components/board/Editor'), { ssr: false, loading: () => <div className="auth"><span className="mono muted">Opening board…</span></div> });

export default function BoardPage() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    call(`/api/boards/${id}`).then((d) => live && setBoard(d.row)).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [id]);
  if (err) return <div className="auth"><div className="box"><h2>Can’t open this board</h2><p className="err">{err}</p><Link className="btn" href="/boards">Back to boards</Link></div></div>;
  if (!board) return <div className="auth"><span className="mono muted">Opening board…</span></div>;
  return <Editor board={board} />;
}
