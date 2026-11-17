import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ForgeFlowSidebar } from './ForgeFlowSidebar';
import { ForgeFlowNavbar } from './ForgeFlowNavbar';
import { ForgeFlowCommandPalette } from './ForgeFlowCommandPalette';
import { ForgeAiCopilotDrawer } from '../ai/ForgeAiCopilotDrawer';
import { useForgeflowStore } from '../../store/useForgeflowStore';

export const ForgeFlowLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('forgeflow_sidebar_collapsed') === 'true';
  });

  const { checkEngineHealth, fetchTelemetry } = useForgeflowStore();

  useEffect(() => {
    checkEngineHealth();
    fetchTelemetry();
    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      checkEngineHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('forgeflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans">
      {/* Sidebar: Desktop Sticky flex child + Mobile Overlay drawer */}
      <ForgeFlowSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Column (zero overlap, flex-1 in flow) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <ForgeFlowNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto w-full max-w-[1700px] mx-auto">
          <Outlet />
        </main>
      </div>

      <ForgeFlowCommandPalette />
      <ForgeAiCopilotDrawer />
    </div>
  );
};
