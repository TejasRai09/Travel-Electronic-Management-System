import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Hash, 
  Award, 
  Building2, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import type { EmployeeProfile } from '../types';

type ProfileProps = {
  profile: EmployeeProfile | null;
  loading: boolean;
};

const DetailItem: React.FC<{ 
  icon: React.ElementType; 
  label: string; 
  value: string | undefined;
  accent?: boolean; 
}> = ({ icon: Icon, label, value, accent }) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={`p-2.5 rounded-lg shrink-0 ${accent ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-600'} transition-all`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-900 break-words">{value || 'Not Provided'}</p>
      </div>
    </div>
  );
};

const Profile: React.FC<ProfileProps> = ({ profile, loading }) => {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-64 animate-pulse">
            <div className="h-32 bg-slate-100" />
            <div className="px-8 -mt-12">
                <div className="w-24 h-24 bg-slate-200 rounded-2xl border-4 border-white" />
                <div className="mt-4 space-y-2">
                    <div className="h-6 w-48 bg-slate-100 rounded" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Profile Unavailable</h3>
        <p className="text-slate-500 mt-2">We couldn't load your employee record at this time.</p>
      </div>
    );
  }

  const initials = (profile.employeeName || 'E')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <path d="M0 100 C 20 0 50 0 100 100 Z" opacity="0.1" />
                </svg>
            </div>
            {/* Decoration Circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar - Floating over boundary */}
          <div className="-mt-12 shrink-0 relative">
            <div className="w-28 h-28 rounded-3xl bg-white p-1.5 shadow-xl">
                <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-inner border border-slate-700">
                    {initials}
                </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" title="Active"></div>
          </div>

          <div className="flex-1 pt-4 md:pt-0 md:mt-4 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 truncate">{profile.employeeName}</h1>
                    <div className="flex items-center gap-2 mt-1 text-slate-500">
                        <Briefcase size={16} />
                        <span className="font-medium">{profile.designation}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide border border-blue-100">
                        <Award size={14} />
                        Impact Level {profile.impactLevel}
                    </span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Key Details */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Employee ID & Official Info */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Building2 className="text-blue-600" size={20} />
                    Official Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <DetailItem icon={Hash} label="Employee Code" value={profile.employeeNumber} accent />
                    <DetailItem icon={ShieldCheck} label="Designation" value={profile.designation} />
                    <DetailItem icon={Award} label="Impact Level" value={profile.impactLevel} />
                    <DetailItem icon={Building2} label="Company" value="Adventz Group" />
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <User className="text-blue-600" size={20} />
                    Personal & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <DetailItem icon={Mail} label="Email Address" value={profile.email} />
                    <DetailItem icon={Phone} label="Phone Number" value={profile.phone} />
                </div>
            </div>

        </div>

        {/* Right Column - Reporting */}
        <div className="space-y-8">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 h-full relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <UserCheck className="text-indigo-600" size={20} />
                    Reporting Manager
                </h3>

                <div className="space-y-4 relative z-10">
                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl mb-3 shadow-md">
                            {(profile.managerEmployeeName || 'M').charAt(0)}
                        </div>
                        <h4 className="font-bold text-slate-900">{profile.managerEmployeeName || 'Not Assigned'}</h4>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Direct Supervisor</p>
                    </div>

                    <div className="space-y-1">
                        <DetailItem icon={Mail} label="Manager Email" value={profile.managerEmail} />
                        <DetailItem icon={Hash} label="Manager Code" value={profile.managerEmployeeNo} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
