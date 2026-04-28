import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      {children}
      <BottomNav />
    </div>
  );
}
