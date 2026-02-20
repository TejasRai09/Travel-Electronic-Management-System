import React, { useState, useEffect } from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import NfaList from './components/NfaList';
import ExpertAnalysis from './components/ExpertAnalysis';
import TravelRequestForm from './components/TravelRequestForm';
import Profile from './components/Profile';
import TravelRequestDetailView from './components/TravelRequestDetailView';
import POCDashboard from './components/POCDashboard';
import ApprovalsView from './components/ApprovalsView';
import VendorDashboard from './components/VendorDashboard';
import VendorRequestView from './components/VendorRequestView';
import AdminDashboard from './components/AdminDashboard';
import ActivityLog from './components/ActivityLog';
import NotificationPanel from './components/NotificationPanel';
import { EmployeeProfile, TravelRequest, TravelStatus, TravelMode, UserRole, User, TripNature, DietaryPreference } from './types';

const MOCK_TRAVEL_REQUESTS: TravelRequest[] = [
  { 
    id: '1', 
    uniqueId: 'TR-24-001', 
    purpose: 'Project Kickoff Meeting', 
    origin: 'Goa (GOI)', 
    destination: 'Mumbai (BOM)', 
    travelDate: '2024-04-10', 
    mode: TravelMode.FLIGHT, 
    travelClass: 'Economy', 
    department: 'IT', 
    status: TravelStatus.PENDING, 
    originator: 'Suresh Kumar', 
    createdAt: '2024-03-20',
    tripNature: TripNature.ONE_WAY,
    accommodationRequired: false,
    passengerName: 'Suresh Kumar',
    passengerPhone: '+91 9822113344',
    dietaryPreference: DietaryPreference.VEG
  },
  { 
    id: '2', 
    uniqueId: 'TR-24-002', 
    purpose: 'Annual Strategy Review', 
    origin: 'Mumbai (BOM)', 
    destination: 'Delhi (DEL)', 
    travelDate: '2024-04-15', 
    mode: TravelMode.FLIGHT, 
    travelClass: 'Economy', 
    department: 'IT', 
    status: TravelStatus.APPROVED, 
    originator: 'Suresh Kumar', 
    createdAt: '2024-03-18',
    tripNature: TripNature.ROUND_TRIP,
    accommodationRequired: true,
    passengerName: 'Suresh Kumar',
    passengerPhone: '+91 9822113344',
    dietaryPreference: DietaryPreference.NON_VEG
  },
  { 
    id: '3', 
    uniqueId: 'TR-24-003', 
    purpose: 'Vendor Site Inspection', 
    origin: 'Pune (PNQ)', 
    destination: 'Mumbai (BOM)', 
    travelDate: '2024-04-05', 
    mode: TravelMode.TRAIN, 
    travelClass: '2AC', 
    department: 'IT', 
    status: TravelStatus.APPROVED, 
    originator: 'Suresh Kumar', 
    createdAt: '2024-03-15',
    tripNature: TripNature.ONE_WAY,
    accommodationRequired: false,
    passengerName: 'Suresh Kumar',
    passengerPhone: '+91 9822113344',
    dietaryPreference: DietaryPreference.NO_PREFERENCE
  },
];

const MOCK_USER: User = {
  name: 'Suresh Kumar',
  email: 'suresh.k@zuari.com',
  role: UserRole.EMPLOYEE,
  department: 'IT Infrastructure'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [profileLoading, setProfileLoading] = useState(true);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<TravelRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  
  // User roles
  const [isPOC, setIsPOC] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('travelDeskToken');
    localStorage.removeItem('userEmail');
    window.location.reload();
  };

  const fetchTravelRequests = async () => {
    const token = localStorage.getItem('travelDeskToken');
    if (!token) return;

    try {
      const res = await fetch('/api/travel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchApprovalRequests = async () => {
    const token = localStorage.getItem('travelDeskToken');
    if (!token) {
      return;
    }

    try {
      const res = await fetch('/api/travel/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setApprovalRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch approval requests", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('travelDeskToken');
    if (!token) {
      setProfileLoading(false);
      setEmployeeProfile(null);
      return;
    }

    let cancelled = false;
    
    // Fetch Profile and User Roles
    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (!cancelled) setEmployeeProfile(null);
          return;
        }

        const data = (await response.json()) as { ok: true; profile: EmployeeProfile };
        if (!cancelled) {
          setEmployeeProfile(data.profile);
          
          // Check if user is POC or Manager or Vendor
          try {
            const userRes = await fetch('/api/auth/user-info', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData.ok) {
                setIsPOC(userData.user?.isPOC || false);
                setIsManager(userData.user?.isManager || false);
                setIsVendor(userData.user?.isVendor || false);
                setIsAdmin(userData.user?.isAdmin || false);
                
                // If vendor, set default tab to vendor dashboard
                // If admin, set default tab to admin dashboard
                if (userData.user?.isVendor) {
                  setActiveTab('vendor-dashboard');
                } else if (userData.user?.isAdmin) {
                  setActiveTab('admin-dashboard');
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch user roles:', err);
          }
        }
      } catch {
        if (!cancelled) setEmployeeProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    // Fetch Requests
    fetchTravelRequests();
    fetchApprovalRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  const uiUser: User = employeeProfile
    ? {
        name: employeeProfile.employeeName || 'Employee',
        email: employeeProfile.email,
        role: UserRole.EMPLOYEE,
        department: employeeProfile.designation || 'Employee',
      }
    : MOCK_USER;

  const handleRequestCreated = async () => {
    await fetchTravelRequests();
    await fetchApprovalRequests();
    setActiveTab('my-requests');
  };

  const handleViewRequest = (request: TravelRequest) => {
    setSelectedRequest(request);
    setActiveTab('view-request');
  };

  const handleBackToBookings = () => {
    setSelectedRequest(null);
    setActiveTab('my-requests');
  };

  const handleBackToVendorDashboard = () => {
    setSelectedRequest(null);
    setActiveTab('vendor-dashboard');
  };

  const handleVendorViewRequest = (request: TravelRequest) => {
    setSelectedRequest(request);
    setActiveTab('vendor-view-request');
  };

  const handleOpenRequestFromNotification = async (requestId: string) => {
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) return;

      const res = await fetch(`/api/travel/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.ok && data.request) {
        setSelectedRequest(data.request);
        if (isVendor) {
          setActiveTab('vendor-view-request');
        } else {
          setActiveTab('view-request');
        }
      }
    } catch (error) {
      console.error('Error fetching request from notification:', error);
    }
  };

  const renderContent = () => {
    // If vendor, only allow vendor-specific tabs
    if (isVendor && activeTab !== 'vendor-dashboard' && activeTab !== 'vendor-view-request') {
      setActiveTab('vendor-dashboard');
      return <VendorDashboard onViewRequest={handleVendorViewRequest} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview requests={requests} onNewTrip={() => setActiveTab('create')} />;
      case 'create':
        return <TravelRequestForm onSubmit={handleRequestCreated} />;
      case 'my-requests':
        return <NfaList requests={requests} title="My Travel History" onViewDetails={handleViewRequest} showOriginator={false} />;
      case 'approver':
        return <ApprovalsView onViewDetails={handleViewRequest} />;
      case 'poc-dashboard':
        return <POCDashboard onViewRequest={handleViewRequest} />;
      case 'vendor-dashboard':
        return <VendorDashboard onViewRequest={handleVendorViewRequest} />;
      case 'vendor-view-request':
        return selectedRequest ? <VendorRequestView request={selectedRequest} onBack={handleBackToVendorDashboard} /> : null;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'activity-log':
        return <ActivityLog />;
      case 'view-request':
        return selectedRequest ? <TravelRequestDetailView request={selectedRequest} onBack={handleBackToBookings} isPOC={isPOC} isManager={isManager} /> : null;
      case 'expert':
        return <ExpertAnalysis requests={requests} />;
      case 'profile':
        return <Profile profile={employeeProfile} loading={profileLoading} />;
      default:
        return <div className="p-12 text-center text-slate-400">Under Construction</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Zuari Travel Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isPOC={isPOC}
        isManager={isManager}
        isVendor={isVendor}
        isAdmin={isAdmin}
      />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {activeTab !== 'view-request' && activeTab !== 'vendor-view-request' && (
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
                  <p className="text-xs text-slate-500 font-medium">Hello {uiUser.name.split(' ')[0]} 👋</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <NotificationPanel onOpenRequest={handleOpenRequestFromNotification} />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{uiUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{uiUser.department}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100 overflow-hidden">
                     <img src={`https://ui-avatars.com/api/?name=${uiUser.name}&background=0284c7&color=fff`} alt="User" />
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {activeTab === 'view-request' ? (
          <main className="flex-1 overflow-hidden">
            {renderContent()}
          </main>
        ) : (
          <>
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
              {renderContent()}
            </main>

            <footer className="p-6 text-center text-slate-400 text-xs border-t border-slate-100 bg-white/50">
              <p>© 2024 Zuari Industries Limited. Enterprise Travel Management v3.1</p>
            </footer>
          </>
        )}
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default App;
