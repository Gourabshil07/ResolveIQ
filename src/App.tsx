import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateIncidentPage } from './pages/CreateIncidentPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { AllIncidentsPage } from './pages/AllIncidentsPage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { EngineerWorkspacePage } from './pages/EngineerWorkspacePage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { EngineerFeedbackPage } from './pages/EngineerFeedbackPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { MyAssignedIncidentsPage } from './pages/MyAssignedIncidentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminResetPasswordPage } from './pages/AdminResetPasswordPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const tokenParam = urlParams.get('token');
    const codeParam = urlParams.get('code');
    const isRecoveryHash = window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=');
    const pathName = window.location.pathname.replace(/^\//, '');

    if (pageParam === 'about' || pathName === 'about') {
      return 'about';
    }
    if (pageParam === 'contact' || pathName === 'contact') {
      return 'contact';
    }
    if (pageParam === 'admin-reset-password' || pathName === 'admin-reset-password') {
      return 'admin-reset-password';
    }
    if (pageParam === 'admin-login' || pathName === 'admin-login') {
      return 'admin-login';
    }
    if (pageParam === 'reset-password' || tokenParam || codeParam || isRecoveryHash) {
      return 'reset-password';
    }
    if (pageParam === 'forgot-password' || pathName === 'forgot-password') {
      return 'forgot-password';
    }
    if (pageParam === 'login' || pathName === 'login') {
      return 'login';
    }
    if (pageParam === 'register' || pathName === 'register') {
      return 'register';
    }
    if (pageParam === 'dashboard' || pathName === 'dashboard') {
      return 'dashboard';
    }

    const token = localStorage.getItem('token');
    return token ? 'dashboard' : 'landing';
  });

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');

  // Synchronize browser history and back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      const tokenParam = urlParams.get('token');
      const codeParam = urlParams.get('code');
      const isRecoveryHash = window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=');
      const pathName = window.location.pathname.replace(/^\//, '');

      if (pageParam === 'about' || pathName === 'about') {
        setCurrentPage('about');
      } else if (pageParam === 'contact' || pathName === 'contact') {
        setCurrentPage('contact');
      } else if (pageParam === 'admin-reset-password' || pathName === 'admin-reset-password') {
        setCurrentPage('admin-reset-password');
      } else if (pageParam === 'admin-login' || pathName === 'admin-login') {
        setCurrentPage('admin-login');
      } else if (pageParam === 'reset-password' || tokenParam || codeParam || isRecoveryHash) {
        setCurrentPage('reset-password');
      } else if (pageParam === 'forgot-password' || pathName === 'forgot-password') {
        setCurrentPage('forgot-password');
      } else if (pageParam === 'login' || pathName === 'login') {
        setCurrentPage('login');
      } else if (pageParam === 'register' || pathName === 'register') {
        setCurrentPage('register');
      } else if (pageParam === 'dashboard' || pathName === 'dashboard') {
        setCurrentPage('dashboard');
      } else {
        const token = localStorage.getItem('token');
        setCurrentPage(token ? 'dashboard' : 'landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path.startsWith('incident-details')) {
      const match = path.match(/id=([^&]+)/);
      if (match) {
        setSelectedIncidentId(match[1]);
      }
      setCurrentPage('incident-details');
      window.scrollTo(0, 0);
      return;
    }

    if (path.startsWith('all-incidents?q=')) {
      const q = decodeURIComponent(path.replace('all-incidents?q=', ''));
      setInitialSearchQuery(q);
      setCurrentPage('all-incidents');
      window.scrollTo(0, 0);
      return;
    }

    if (path === 'about') {
      try {
        window.history.pushState({ page: 'about' }, '', '/about');
      } catch {
        // Fallback for sandboxed iframe
      }
      setCurrentPage('about');
      window.scrollTo(0, 0);
      return;
    }

    if (path === 'contact') {
      try {
        window.history.pushState({ page: 'contact' }, '', '/contact');
      } catch {
        // Fallback for sandboxed iframe
      }
      setCurrentPage('contact');
      window.scrollTo(0, 0);
      return;
    }

    if (path === 'landing') {
      try {
        window.history.pushState({ page: 'landing' }, '', '/');
      } catch {
        // Fallback for sandboxed iframe
      }
      setCurrentPage('landing');
      window.scrollTo(0, 0);
      return;
    }

    if (path === 'login' || path === 'register' || path === 'forgot-password') {
      try {
        window.history.pushState({ page: path }, '', `/${path}`);
      } catch {
        // Fallback for sandboxed iframe
      }
      setCurrentPage(path);
      window.scrollTo(0, 0);
      return;
    }

    setCurrentPage(path);
    window.scrollTo(0, 0);
  };

  const navigateToFeatures = () => {
    if (currentPage === 'landing') {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('landing');
      setTimeout(() => {
        const element = document.getElementById('features');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Full-screen unauthenticated / standalone views
  if (currentPage === 'about') {
    return (
      <AboutPage
        onBackToHome={() => navigate('landing')}
        onNavigateFeatures={navigateToFeatures}
        onNavigateContact={() => navigate('contact')}
        onLogin={() => navigate('login')}
        onRegister={() => navigate('register')}
      />
    );
  }

  if (currentPage === 'contact') {
    return (
      <ContactPage
        onBackToHome={() => navigate('landing')}
        onNavigateFeatures={navigateToFeatures}
        onNavigateAbout={() => navigate('about')}
        onLogin={() => navigate('login')}
        onRegister={() => navigate('register')}
      />
    );
  }

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => navigate(isAuthenticated ? 'dashboard' : 'login')}
        onLogin={() => navigate('login')}
        onRegister={() => navigate('register')}
        onGoToAbout={() => navigate('about')}
        onGoToContact={() => navigate('contact')}
      />
    );
  }

  if (currentPage === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => navigate('login')}
        onGoToLanding={() => navigate('landing')}
      />
    );
  }

  if (currentPage === 'reset-password') {
    return (
      <ResetPasswordPage
        onSuccessGoToLogin={() => navigate('login')}
        onGoToForgotPassword={() => navigate('forgot-password')}
        onGoToLanding={() => navigate('landing')}
      />
    );
  }

  if (currentPage === 'admin-login') {
    return (
      <AdminLoginPage
        onSuccess={() => navigate('dashboard')}
        onGoToUserLogin={() => navigate('login')}
        onGoToLanding={() => navigate('landing')}
      />
    );
  }

  if (currentPage === 'admin-reset-password') {
    return (
      <AdminResetPasswordPage
        onSuccessGoToLogin={() => navigate('admin-login')}
        onGoToAdminLogin={() => navigate('admin-login')}
        onGoToLanding={() => navigate('landing')}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onSuccess={() => navigate('dashboard')}
        onGoToRegister={() => navigate('register')}
        onGoToLanding={() => navigate('landing')}
        onGoToForgotPassword={() => navigate('forgot-password')}
        onGoToAdminLogin={() => navigate('admin-login')}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onSuccess={() => navigate('dashboard')}
        onGoToLogin={() => navigate('login')}
        onGoToLanding={() => navigate('landing')}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LandingPage
        onLaunchApp={() => navigate('login')}
        onLogin={() => navigate('login')}
        onRegister={() => navigate('register')}
        onGoToAbout={() => navigate('about')}
        onGoToContact={() => navigate('contact')}
      />
    );
  }

  // Workspace layout for all platform pages
  const renderWorkspacePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'create-incident':
        return (
          <CreateIncidentPage
            onIncidentCreated={(newId) => navigate(`incident-details?id=${newId}`)}
            onCancel={() => navigate('dashboard')}
          />
        );
      case 'my-tickets':
        return <MyTicketsPage onNavigate={navigate} />;
      case 'all-incidents':
        return <AllIncidentsPage onNavigate={navigate} initialSearchQuery={initialSearchQuery} />;
      case 'incident-details':
        return (
          <IncidentDetailsPage
            incidentId={selectedIncidentId}
            onBack={() => navigate('dashboard')}
            onNavigate={navigate}
          />
        );
      case 'engineer-workspace':
        return <EngineerWorkspacePage onNavigate={navigate} />;
      case 'knowledge-base':
        return <KnowledgeBasePage />;
      case 'notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case 'reports':
        return <ReportsPage />;
      case 'admin-users':
        return <AdminUsersPage />;
      case 'admin-feedback':
        return <EngineerFeedbackPage onNavigate={navigate} />;
      case 'admin-activity':
        return <ActivityLogPage onNavigate={navigate} />;
      case 'my-assigned-incidents':
      case 'assigned-incidents':
        return <MyAssignedIncidentsPage onNavigate={navigate} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={navigate}>
      {renderWorkspacePage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
