'use client';

import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import AnalysisPanel from '@/components/AnalysisPanel';

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent />
      <AnalysisPanel />
    </div>
  );
}
