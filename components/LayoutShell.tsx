'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const DRAWER_WIDTH = 224; // w-56 = 14rem = 224px

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOffset, setDrawerOffset] = useState(0); // 0 = closed, DRAWER_WIDTH = open
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // keeps overlay mounted during snap-back animation

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const dirRef = useRef<'horiz' | 'vert' | null>(null);
  const drawerOpenRef = useRef(false);
  const drawerOffsetRef = useRef(0);

  // Keep refs in sync synchronously for touch handlers
  const updateOffset = useCallback((v: number) => {
    drawerOffsetRef.current = v;
    setDrawerOffset(v);
  }, []);

  useEffect(() => { drawerOpenRef.current = drawerOpen; }, [drawerOpen]);

  // Disable browser back-swipe interpretation
  useEffect(() => {
    document.body.style.overscrollBehaviorX = 'none';
    return () => { document.body.style.overscrollBehaviorX = ''; };
  }, []);

  // Real-time drawer drag gesture on document level
  useEffect(() => {
    const EDGE_ZONE = 30; // px from left edge to trigger drawer open

    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      startXRef.current = x;
      startYRef.current = e.touches[0].clientY;
      startTimeRef.current = Date.now();
      dirRef.current = null;

      // FIX 1: skip if touch originates inside a content swipe zone (kanban, calendar)
      const target = e.target as HTMLElement;
      if (target.closest('[data-swipe-zone="content"]')) {
        startXRef.current = -1; // mark as ignored
        return;
      }

      // When drawer is closed, only respond to edge swipes
      if (!drawerOpenRef.current && x > EDGE_ZONE) {
        dirRef.current = 'vert'; // not our gesture, bail
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // Fast path: ignored touch or non-drawer direction
      if (startXRef.current === -1) return;
      if (dirRef.current === 'vert') return;

      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      // Determine direction on first significant movement
      if (dirRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        dirRef.current = Math.abs(dx) > Math.abs(dy) ? 'horiz' : 'vert';
      }

      // FIX Problem 2: Track finger position in real-time
      if (dirRef.current === 'horiz') {
        e.preventDefault();
        setIsDragging(true);

        let newOffset: number;
        if (drawerOpenRef.current) {
          // Closing gesture: offset from DRAWER_WIDTH toward 0
          newOffset = Math.max(0, Math.min(DRAWER_WIDTH, DRAWER_WIDTH + dx));
        } else {
          // Opening gesture: offset from 0 toward DRAWER_WIDTH
          newOffset = Math.max(0, Math.min(DRAWER_WIDTH, dx));
        }
        updateOffset(newOffset);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startXRef.current === -1) return;
      if (dirRef.current !== 'horiz') {
        dirRef.current = null;
        return;
      }

      const dx = e.changedTouches[0].clientX - startXRef.current;
      const duration = Date.now() - startTimeRef.current;
      const velocity = duration > 0 ? dx / duration : 0; // px/ms

      const currentOffset = drawerOffsetRef.current;
      dirRef.current = null;
      setIsDragging(false);

      if (drawerOpenRef.current) {
        // Was open — decide close or snap back open
        if (currentOffset < DRAWER_WIDTH * 0.5 || velocity < -0.3) {
          // Close
          updateOffset(0);
          setTimeout(() => setDrawerOpen(false), 220);
        } else {
          // Keep open
          updateOffset(DRAWER_WIDTH);
        }
      } else {
        // Was closed — decide open or snap back closed
        if (currentOffset > DRAWER_WIDTH * 0.3 || velocity > 0.3) {
          // Open
          setDrawerOpen(true);
          updateOffset(DRAWER_WIDTH);
        } else {
          // Snap back closed (keep overlay mounted for animation)
          updateOffset(0);
          setIsClosing(true);
          setTimeout(() => setIsClosing(false), 250);
        }
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [updateOffset]);

  const handleOpen = useCallback(() => {
    setDrawerOpen(true);
    // Wait for mount, then animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateOffset(DRAWER_WIDTH);
      });
    });
  }, [updateOffset]);

  const handleClose = useCallback(() => {
    setIsDragging(false);
    updateOffset(0);
    setTimeout(() => setDrawerOpen(false), 220);
  }, [updateOffset]);

  // Progress 0..1 for backdrop opacity
  const progress = Math.max(0, Math.min(1, drawerOffset / DRAWER_WIDTH));
  const showDrawer = drawerOpen || isDragging || isClosing || drawerOffset > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar onMenuClick={handleOpen} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile drawer overlay */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop — follows drag progress */}
            <div
              className="absolute inset-0 bg-black/60"
              style={{
                opacity: progress,
                transition: isDragging ? 'none' : 'opacity 200ms ease-out',
              }}
              onClick={handleClose}
            />
            {/* Drawer panel — follows finger in real-time */}
            {/* FIX Problem 3: removed paddingLeft/Right that caused the strip artifact */}
            <div
              className="absolute top-0 left-0 bottom-0 w-56 flex flex-col border-r border-white/10"
              style={{
                backgroundColor: 'rgb(26, 26, 46)',
                transform: `translateX(${drawerOffset - DRAWER_WIDTH}px)`,
                transition: isDragging ? 'none' : 'transform 200ms ease-out',
                willChange: 'transform',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <div className="flex justify-end px-2 pb-1" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
                <button
                  onClick={handleClose}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Закрыть меню"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <Sidebar onNavigate={handleClose} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 md:p-6 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
