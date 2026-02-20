import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Plane,
  Train,
  Bus,
  MapPin
} from 'lucide-react';

interface TravelModeEntitlement {
  airTravel: {
    allowed: boolean;
    classes: string[];
  };
  trainTravel: {
    allowed: boolean;
    classes: string[];
  };
  publicTransport: {
    allowed: boolean;
    types: string[];
  };
}

interface LocalConveyance {
  options: string[];
}

interface ImpactLevelPolicy {
  level: string;
  travelMode: TravelModeEntitlement;
  localConveyance: LocalConveyance;
  description?: string;
}

interface CityGroup {
  name: string;
  cities: string[];
  roomRentLimit: number;
  foodExpenseLimit: number;
}

interface PolicyRules {
  incidentalExpenses: number;
  advanceBookingDays: number;
  expenseSubmissionDays: number;
  expenseSettlementDays: number;
  outstandingAdvanceWeeks: number;
  roomRentDeviationPercent: number;
  requireOriginalBills: boolean;
  guestHouseMandatory: boolean;
  alcoholReimbursement: boolean;
 cigaretteReimbursement: boolean;
}

interface TravelPolicy {
  _id?: string;
  policyName: string;
  policyVersion: string;
  impactLevels: ImpactLevelPolicy[];
  cityGroups: CityGroup[];
  policyRules: PolicyRules;
  isActive: boolean;
  effectiveFrom: Date;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PolicyManagement: React.FC = () => {
  const [activePolicy, setActivePolicy] = useState<TravelPolicy | null>(null);
  const [allPolicies, setAllPolicies] = useState<TravelPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCityGroup, setSelectedCityGroup] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchActivePolicy();
    fetchAllPolicies();
  }, []);

  const fetchActivePolicy = async () => {
    try {
      const res = await fetch('/api/policy/active');
      const data = await res.json();
      
      if (data.ok) {
        setActivePolicy(data.policy);
        if (data.policy.impactLevels && data.policy.impactLevels.length > 0) {
          setSelectedLevel(data.policy.impactLevels[0].level);
        }
        if (data.policy.cityGroups && data.policy.cityGroups.length > 0) {
          setSelectedCityGroup(data.policy.cityGroups[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching active policy:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPolicies = async () => {
    try {
      const token = localStorage.getItem('travelDeskToken');
      const res = await fetch('/api/policy/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.ok) {
        setAllPolicies(data.policies);
      }
    } catch (err) {
      console.error('Error fetching all policies:', err);
    }
  };

  const handleSavePolicy = async () => {
    if (!activePolicy) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('travelDeskToken');
      const res = await fetch(`/api/policy/${activePolicy._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(activePolicy)
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setActivePolicy(data.policy);
        setEditMode(false);
        setMessage({ type: 'success', text: 'Policy updated successfully!' });
        await fetchAllPolicies();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update policy' });
      }
    } catch (err) {
      console.error('Error saving policy:', err);
      setMessage({ type: 'error', text: 'Failed to update policy' });
    } finally {
      setSaving(false);
    }
  };

  const updateImpactLevel = (level: string, field: string, value: any) => {
    if (!activePolicy) return;
    
    setActivePolicy({
      ...activePolicy,
      impactLevels: activePolicy.impactLevels.map(il => 
        il.level === level ? { ...il, [field]: value } : il
      )
    });
  };

  const updateCityGroup = (groupName: string, field: string, value: any) => {
    if (!activePolicy) return;
    
    setActivePolicy({
      ...activePolicy,
      cityGroups: activePolicy.cityGroups.map(cg => 
        cg.name === groupName ? { ...cg, [field]: value } : cg
      )
    });
  };

  const updatePolicyRules = (field: string, value: any) => {
    if (!activePolicy) return;
    
    setActivePolicy({
      ...activePolicy,
      policyRules: { ...activePolicy.policyRules, [field]: value }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!activePolicy) {
    return (
      <div className="p-12 text-center">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Active Policy Found</h2>
        <p className="text-slate-500">Please contact system administrator to seed initial policy.</p>
      </div>
    );
  }

  const selectedLevelData = activePolicy.impactLevels.find(il => il.level === selectedLevel);
  const selectedCityGroupData = activePolicy.cityGroups.find(cg => cg.name === selectedCityGroup);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FileText className="text-blue-600" />
              Travel Policy Management
            </h1>
            <p className="text-slate-500 mt-1">
              {activePolicy.policyName} (v{activePolicy.policyVersion})
            </p>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={18} />
                Edit Policy
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    fetchActivePolicy();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Box - Grade Mapping Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            Impact Level Assignment Guide
          </h3>
          <p className="text-xs text-blue-800 mb-2">
            Admin must assign Impact Levels (organizational grades) to employees in the <strong>Admin Dashboard → Employees</strong> section. 
            Each grade has specific travel entitlements as defined in the company travel policy:
          </p>
          <div className="grid grid-cols-6 gap-3 text-xs mb-2">
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-blue-200">
              <div className="font-bold text-blue-900">UC, 1</div>
              <div className="text-blue-700 text-[10px]">Senior Leadership</div>
            </div>
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-blue-200">
              <div className="font-bold text-blue-900">2A-2C</div>
              <div className="text-blue-700 text-[10px]">GM, DGM Level</div>
            </div>
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-blue-200">
              <div className="font-bold text-blue-900">3A-3C</div>
              <div className="text-blue-700 text-[10px]">Manager Level</div>
            </div>
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-blue-200">
              <div className="font-bold text-blue-900">4A-4C</div>
              <div className="text-blue-700 text-[10px]">Asst Manager</div>
            </div>
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-red-200 bg-red-50/60">
              <div className="font-bold text-red-900">5A-5C</div>
              <div className="text-red-700 text-[10px]">Officer ❌ No Air</div>
            </div>
            <div className="bg-white/60 rounded-lg px-2 py-1.5 border border-red-200 bg-red-50/60">
              <div className="font-bold text-red-900">6A-6C</div>
              <div className="text-red-700 text-[10px]">Jr Staff ❌ No Air</div>
            </div>
          </div>
          <p className="text-[10px] text-red-700 font-semibold bg-red-50 px-2 py-1 rounded">
            ⚠️ <strong>Air Travel Restriction:</strong> Employees with grades 5A-5C and 6A-6C cannot book air tickets. The flight option will be locked in their booking form.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              className="px-6 py-4 font-semibold border-b-2 border-blue-600 text-blue-600"
            >
              Impact Levels
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Impact Level Selector */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Impact Level (17 Grades)</label>
            <div className="grid grid-cols-6 gap-2">
              {activePolicy.impactLevels.map((il) => (
                <button
                  key={il.level}
                  onClick={() => setSelectedLevel(il.level)}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    selectedLevel === il.level
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {il.level}
                </button>
              ))}
            </div>
          </div>

          {/* Impact Level Details */}
          {selectedLevelData && (
            <div className="space-y-6">
              {/* Air Travel */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Plane size={20} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Air Travel</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLevelData.travelMode.airTravel.allowed}
                      onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                        ...selectedLevelData.travelMode,
                        airTravel: { ...selectedLevelData.travelMode.airTravel, allowed: e.target.checked }
                      })}
                      disabled={!editMode}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold text-slate-700">Allow Air Travel</label>
                  </div>
                  {selectedLevelData.travelMode.airTravel.allowed && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Classes</label>
                      <input
                        type="text"
                        value={selectedLevelData.travelMode.airTravel.classes.join(', ')}
                        onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                          ...selectedLevelData.travelMode,
                          airTravel: { ...selectedLevelData.travelMode.airTravel, classes: e.target.value.split(',').map(s => s.trim()) }
                        })}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                        placeholder="Business, Premium Economy, Economy"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Train Travel */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Train size={20} className="text-green-600" />
                  <h3 className="text-lg font-bold text-slate-800">Train Travel</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLevelData.travelMode.trainTravel.allowed}
                      onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                        ...selectedLevelData.travelMode,
                        trainTravel: { ...selectedLevelData.travelMode.trainTravel, allowed: e.target.checked }
                      })}
                      disabled={!editMode}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold text-slate-700">Allow Train Travel</label>
                  </div>
                  {selectedLevelData.travelMode.trainTravel.allowed && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Classes</label>
                      <input
                        type="text"
                        value={selectedLevelData.travelMode.trainTravel.classes.join(', ')}
                        onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                          ...selectedLevelData.travelMode,
                          trainTravel: { ...selectedLevelData.travelMode.trainTravel, classes: e.target.value.split(',').map(s => s.trim()) }
                        })}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                        placeholder="1AC, 2AC, 3AC"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Public Transport */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Bus size={20} className="text-orange-600" />
                  <h3 className="text-lg font-bold text-slate-800">Public Transport</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLevelData.travelMode.publicTransport.allowed}
                      onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                        ...selectedLevelData.travelMode,
                        publicTransport: { ...selectedLevelData.travelMode.publicTransport, allowed: e.target.checked }
                      })}
                      disabled={!editMode}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold text-slate-700">Allow Public Transport</label>
                  </div>
                  {selectedLevelData.travelMode.publicTransport.allowed && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Types</label>
                      <input
                        type="text"
                        value={selectedLevelData.travelMode.publicTransport.types.join(', ')}
                        onChange={(e) => updateImpactLevel(selectedLevel, 'travelMode', {
                          ...selectedLevelData.travelMode,
                          publicTransport: { ...selectedLevelData.travelMode.publicTransport, types: e.target.value.split(',').map(s => s.trim()) }
                        })}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                        placeholder="AC Bus, Non-AC Bus"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Local Conveyance */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={20} className="text-purple-600" />
                  <h3 className="text-lg font-bold text-slate-800">Local Conveyance</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Options</label>
                  <input
                    type="text"
                    value={selectedLevelData.localConveyance.options.join(', ')}
                    onChange={(e) => updateImpactLevel(selectedLevel, 'localConveyance', {
                      options: e.target.value.split(',').map(s => s.trim())
                    })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    placeholder="Uber Go, Uber Auto, Public Transport"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* City Groups */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">City Groups & Accommodation Limits</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {activePolicy.cityGroups.map((cg) => (
              <div key={cg.name} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-lg text-slate-800">{cg.name}</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Rent Limit (₹)</label>
                  <input
                    type="number"
                    value={cg.roomRentLimit}
                    onChange={(e) => updateCityGroup(cg.name, 'roomRentLimit', Number(e.target.value))}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    placeholder="0 for actual"
                  />
                  <p className="text-xs text-slate-500 mt-1">{cg.roomRentLimit === 0 ? 'Actual expenses' : '₹' + cg.roomRentLimit}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Food Expense Limit (₹)</label>
                  <input
                    type="number"
                    value={cg.foodExpenseLimit}
                    onChange={(e) => updateCityGroup(cg.name, 'foodExpenseLimit', Number(e.target.value))}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    placeholder="0 for actual"
                  />
                  <p className="text-xs text-slate-500 mt-1">{cg.foodExpenseLimit === 0 ? 'Actual expenses' : '₹' + cg.foodExpenseLimit}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cities ({cg.cities.length})</label>
                  <textarea
                    value={cg.cities.join(', ')}
                    onChange={(e) => updateCityGroup(cg.name, 'cities', e.target.value.split(',').map(s => s.trim()))}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 text-xs"
                    rows={3}
                    placeholder="City names separated by comma"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Policy Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Policy Rules</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Incidental Expenses (₹)</label>
            <input
              type="number"
              value={activePolicy.policyRules.incidentalExpenses}
              onChange={(e) => updatePolicyRules('incidentalExpenses', Number(e.target.value))}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Advance Booking Days</label>
            <input
              type="number"
              value={activePolicy.policyRules.advanceBookingDays}
              onChange={(e) => updatePolicyRules('advanceBookingDays', Number(e.target.value))}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expense Submission Days</label>
            <input
              type="number"
              value={activePolicy.policyRules.expenseSubmissionDays}
              onChange={(e) => updatePolicyRules('expenseSubmissionDays', Number(e.target.value))}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Room Rent Deviation %</label>
            <input
              type="number"
              value={activePolicy.policyRules.roomRentDeviationPercent}
              onChange={(e) => updatePolicyRules('roomRentDeviationPercent', Number(e.target.value))}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activePolicy.policyRules.guestHouseMandatory}
                onChange={(e) => updatePolicyRules('guestHouseMandatory', e.target.checked)}
                disabled={!editMode}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-slate-700">Guest House Mandatory (when available)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activePolicy.policyRules.requireOriginalBills}
                onChange={(e) => updatePolicyRules('requireOriginalBills', e.target.checked)}
                disabled={!editMode}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-slate-700">Require Original Bills</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyManagement;
