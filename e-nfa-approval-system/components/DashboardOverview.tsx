
import React from 'react';
import { 
  Plane, 
  Train, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Plus, 
  CalendarDays
} from 'lucide-react';
import { TravelRequest, TravelStatus, TravelMode } from '../types';

interface DashboardOverviewProps {
  requests: TravelRequest[];
  onNewTrip: () => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ requests, onNewTrip }) => {
  const pendingCount = requests.filter(r => r.status === TravelStatus.PENDING).length;
  const approvedCount = requests.filter(r => r.status === TravelStatus.APPROVED).length;
  const latestRequest = requests[0]; // Assuming first is most recent

  const stats = [
    { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Confirmed Trips', value: approvedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Request Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Latest Request Progress</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>

          {latestRequest ? (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                  latestRequest.status === TravelStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {latestRequest.status}
                </div>
              </div>

              <div className="flex items-start gap-6 mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  {latestRequest.mode === TravelMode.FLIGHT ? <Plane size={32} /> : <Train size={32} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-1">
                    <span>{latestRequest.origin}</span>
                    <ArrowRight className="text-slate-300" />
                    <span>{latestRequest.destination}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><CalendarDays size={16} /> {new Date(latestRequest.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{latestRequest.travelClass}</span>
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-slate-100"></div>
                <div className={`absolute top-5 left-0 h-1 bg-blue-600 transition-all duration-1000 ${latestRequest.status === TravelStatus.APPROVED ? 'w-full' : 'w-1/2'}`}></div>
                
                <div className="relative flex justify-between">
                  {[
                    { label: 'Submitted', done: true },
                    { label: 'Manager Review', done: true },
                    { label: 'Travel Desk', done: latestRequest.status === TravelStatus.APPROVED }
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className={`w-11 h-11 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-colors duration-500 ${
                        step.done ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {step.done ? <CheckCircle2 size={18} /> : (i + 1)}
                      </div>
                      <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
              <p className="text-slate-500">No active travel requests found.</p>
            </div>
          )}
        </div>

        {/* Quick Actions & Policy Card */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={onNewTrip}
              className="group bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus size={24} />
              </div>
              <div>
                <span className="block font-bold text-slate-800">Request New Trip</span>
                <span className="text-xs text-slate-500">Flight, Train or Road travel</span>
              </div>
            </button>

            <button className="group bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <MapPin size={24} />
              </div>
              <div>
                <span className="block font-bold text-slate-800">Policy Reminder</span>
                <span className="text-xs text-slate-500">Check guidelines before booking</span>
              </div>
            </button>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] text-white shadow-xl shadow-slate-200">
            <h4 className="font-bold text-lg mb-2">Travel Policy Tip</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Booking flights at least 14 days in advance helps Zuari save up to 25% on average fares.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold border border-white/20 transition-all">
              Read Policy Manual
            </button>
          </div>
        </div>
      </div>

      {/* Recent History Table - Compact */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {requests.slice(0, 3).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        {req.mode === TravelMode.FLIGHT ? <Plane size={18} /> : <Train size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{req.origin} to {req.destination}</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">{req.mode} • {req.travelClass}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-slate-600">{new Date(req.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      req.status === TravelStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
