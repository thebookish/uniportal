import { useState, useEffect } from 'react';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { ProgramsView } from './views/ProgramsView';
import { AIIntelligenceView } from './views/AIIntelligenceView';
import { ReportsView } from './views/ReportsView';
import { CommunicationsView } from './views/CommunicationsView';
import { AutomationView } from './views/AutomationView';
import { CounselorsView } from './views/CounselorsView';
import { AdmissionsView } from './views/AdmissionsView';
import { StudentSuccessView } from './views/StudentSuccessView';
import { OnboardingView } from './views/OnboardingView';
import { LeadInboxView } from './views/LeadInboxView';
import { CourseFitView } from './views/CourseFitView';
import { PlaceholderView } from './views/PlaceholderView';
import { StudentDetailPanel } from './students/StudentDetailPanel';
import { SearchModal } from './modals/SearchModal';
import { NotificationsPanel } from './modals/NotificationsPanel';
import { AddStudentModal } from './modals/AddStudentModal';
import { AIChatbot } from './chat/AIChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';

export function Portal() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAlertClick = (alertId: string, studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
    }
    setNotificationsOpen(false);
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onAlertClick={(alertId) => handleAlertClick(alertId)} onStudentClick={handleStudentClick} />;
      case 'students':
        return <StudentsView onStudentClick={handleStudentClick} />;
      case 'programs':
        return <ProgramsView />;
      case 'communications':
        return <CommunicationsView />;
      case 'ai-intelligence':
        return <AIIntelligenceView />;
      case 'reports':
        return <ReportsView />;
      case 'automation':
        return <AutomationView />;
      case 'counselors':
        return <CounselorsView />;
      case 'admissions':
        return <AdmissionsView onStudentClick={handleStudentClick} />;
      case 'student-success':
        return <StudentSuccessView onStudentClick={handleStudentClick} />;
      case 'onboarding':
        return <OnboardingView />;
      case 'lead-inbox':
        return <LeadInboxView onStudentClick={handleStudentClick} />;
      case 'course-fit':
        return <CourseFitView onStudentClick={handleStudentClick} />;
      case 'settings':
        return (
          <PlaceholderView
            title="Settings"
            description="Configure your portal preferences and integrations"
            icon={Settings}
          />
        );
      default:
        return <DashboardView onAlertClick={(alertId) => handleAlertClick(alertId)} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#111827] overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearchOpen={() => setSearchOpen(true)}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {selectedStudentId && (
        <StudentDetailPanel
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onStudentSelect={handleStudentClick}
      />

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onAlertClick={handleAlertClick}
      />

      <AddStudentModal
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={() => {}}
      />

      <AIChatbot />
    </div>
  );
}
