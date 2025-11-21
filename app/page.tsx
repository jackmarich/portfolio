'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

export default function Home() {
  return (
    <main className="h-screen w-full bg-[#f5f5f5] relative">
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center">Loading...</div>}>
        <Scene />
      </Suspense>
    </main>
  );
}
