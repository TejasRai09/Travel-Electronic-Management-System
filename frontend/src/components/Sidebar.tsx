import React from 'react';
import { 
  LayoutDashboard, 
  PlaneTakeoff, 
  History, 
  CheckCircle, 
  ShieldCheck, 
  User,
  X,
  Package,
  Shield,
  Activity,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isPOC?: boolean;
  isManager?: boolean;
  isVendor?: boolean;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, isPOC, isManager, isVendor, isAdmin }) => {
  // If user is a vendor, only show vendor dashboard
  // If user is an admin, show admin dashboard prominently
  const menuItems = isAdmin
    ? [
        { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield },
        { id: 'activity-log', label: 'Activity Log', icon: Activity },
        { id: 'policy-management', label: 'Policy Management', icon: FileText },
      ]
    : isVendor 
    ? [{ id: 'vendor-dashboard', label: 'Vendor Dashboard', icon: Package }]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'create', label: 'New Trip', icon: PlaneTakeoff },
        { id: 'my-requests', label: 'My Bookings', icon: History },
        ...(isManager ? [{ id: 'approver', label: 'Approvals', icon: CheckCircle }] : []),
        ...(isPOC ? [{ id: 'poc-dashboard', label: 'POC Dashboard', icon: ShieldCheck }] : []),
        { id: 'expert', label: 'Travel Expert', icon: ShieldCheck },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <PlaneTakeoff size={18} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 text-xl tracking-tight">Zuari Travel</span>
            </div>
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Support</p>
              <button className="text-sm text-blue-600 font-bold hover:underline">Zuari Helpdesk</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
