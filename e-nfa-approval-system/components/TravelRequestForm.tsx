
import React, { useEffect, useState } from 'react';
import { 
  Plane, 
  Train, 
  MapPin, 
  Calendar, 
  Send, 
  Save, 
  Info, 
  Building2, 
  FileText,
  Briefcase,
  Hotel,
  Clock,
  User,
  Phone,
  Utensils,
  MessageCircle,
  ChevronDown,
  AlertTriangle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { TravelMode, TripNature, DietaryPreference } from '../types';

interface TravelRequestFormProps {
  onSubmit: (data: any) => void;
}

const MAJOR_CITIES = [
  "Goa (GOI)",
  "Mumbai (BOM)",
  "Delhi (DEL)",
  "Bangalore (BLR)",
  "Pune (PNQ)",
  "Hyderabad (HYD)",
  "Chennai (MAA)",
  "Kolkata (CCU)",
  "Ahmedabad (AMD)",
  "Jaipur (JAI)",
  "Kochi (COK)",
  "Lucknow (LKO)",
  "Chandigarh (IXC)",
  "Indore (IDR)",
  "Nagpur (NAG)"
].sort();

const TIME_SLOTS = [
  'Before 6 AM',
  '6 AM to 12 PM',
  '12 PM to 6 PM',
  'After 6 PM',
];

const PURPOSE_OPTIONS = [
  'Client Meeting',
  'Project Site Visit',
  'Training / Workshop',
  'Internal Audit',
  'Conference',
  'Others',
];

type ItineraryLeg = {
  origin: string;
  destination: string;
  travelDate: string;
  timeSlot?: string;
};

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type TripDraft = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  passengerPhone?: string | null;
  tripNature?: string | null;
  mode?: string | null;
  origin?: string | null;
  destination?: string | null;
  travelDate?: string | null;
  returnDate?: string | null;
  departureTimeSlot?: string | null;
  travelClass?: string | null;
  purpose?: string | null;
  accommodationRequired?: boolean | null;
  hotelPreference?: string | null;
  dietaryPreference?: string | null;
  specialInstructions?: string | null;
  missingQuestions?: string[];
};

function splitName(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

function normalizeCityChoice(value: string | null | undefined): string {
  const input = String(value || '').trim();
  if (!input) return '';

  const exact = MAJOR_CITIES.find((city) => city.toLowerCase() === input.toLowerCase());
  if (exact) return exact;

  const compactInput = input.toLowerCase().replace(/\s+/g, '');
  const partial = MAJOR_CITIES.find((city) => {
    const cityName = city.split('(')[0].trim().toLowerCase().replace(/\s+/g, '');
    const codeMatch = city.match(/\(([^)]+)\)/);
    const code = codeMatch ? codeMatch[1].trim().toLowerCase() : '';
    return cityName.includes(compactInput) || compactInput.includes(cityName) || code === compactInput;
  });

  return partial || input;
}

function normalizeTimeSlotChoice(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const exact = TIME_SLOTS.find((slot) => slot.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  const normalized = raw.toLowerCase();
  if (normalized.includes('before 6')) return 'Before 6 AM';
  if (normalized.includes('6 am') && normalized.includes('12')) return '6 AM to 12 PM';
  if (normalized.includes('12') && normalized.includes('6 pm')) return '12 PM to 6 PM';
  if (normalized.includes('after 6')) return 'After 6 PM';

  const hourMatch = normalized.match(/\b(\d{1,2})(?::\d{2})?\s*(am|pm)?\b/);
  if (hourMatch) {
    let hour = Number(hourMatch[1]);
    const meridiem = hourMatch[2];

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    if (hour < 6) return 'Before 6 AM';
    if (hour < 12) return '6 AM to 12 PM';
    if (hour < 18) return '12 PM to 6 PM';
    return 'After 6 PM';
  }

  return '';
}

// --- UI Components ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, loading }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; loading: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-white/40 ring-1 ring-white/50">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto animate-bounce duration-1000">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Submit Request?</h3>
        <p className="text-center text-slate-500 mb-8">
          Are you sure you want to submit this travel requisition? This will be sent to your reporting manager for approval.
        </p>
        <div className="flex gap-3">
          <button 
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <span className="animate-spin text-xl">⏳</span> : <CheckCircle2 size={20} />}
            {loading ? 'Submitting...' : 'Yes, Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Notification = ({ type, message, onClose }: { type: 'success' | 'error', message: string, onClose: () => void }) => {
    return (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 backdrop-blur-md border border-white/20 ${type === 'success' ? 'bg-green-600/90 text-white shadow-green-900/10' : 'bg-red-500/90 text-white shadow-red-900/10'}`}>
             <div className="p-1 bg-white/20 rounded-full">
                {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
             </div>
             <p className="font-bold pr-4">{message}</p>
             <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16} /></button>
        </div>
    )
};

const TravelRequestForm: React.FC<TravelRequestFormProps> = ({ onSubmit }) => {
  // Logic State
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string} | null>(null);

  // Form State
  const [mode, setMode] = useState<TravelMode>(TravelMode.FLIGHT);
  const [nature, setNature] = useState<TripNature>(TripNature.ONE_WAY);
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [diet, setDiet] = useState<DietaryPreference>(DietaryPreference.NO_PREFERENCE);
  
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelClass, setTravelClass] = useState('Economy');
  const [departureTimeSlot, setDepartureTimeSlot] = useState<string[]>([]);
  const [itineraryLegs, setItineraryLegs] = useState<ItineraryLeg[]>([
    { origin: '', destination: '', travelDate: '' },
  ]);
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);
  const [activeLegIndex, setActiveLegIndex] = useState<number | null>(null);
  
  const [purpose, setPurpose] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');
  
  const [hotelPreference, setHotelPreference] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // AI assistant state
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content: 'I can help fill this form. Tell me your trip in one sentence (for example: "I need a round trip from Goa to Mumbai on 2026-03-10 for client meeting, hotel needed").',
    },
  ]);

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
    </div>
  );

  useEffect(() => {
    const token = localStorage.getItem('travelDeskToken');
    if (!token) return;

    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;
        const data = await response.json();
        const profile = data?.profile;
        if (!profile) return;

        const parsed = splitName(String(profile.employeeName || ''));
        setFirstName((prev) => prev || parsed.firstName);
        setMiddleName((prev) => prev || parsed.middleName);
        setLastName((prev) => prev || parsed.lastName);
        setPassengerPhone((prev) => prev || String(profile.phone || ''));
      } catch (error) {
        console.error('Failed to prefill employee profile', error);
      }
    })();
  }, []);

  const getCurrentDraft = () => ({
    firstName,
    middleName,
    lastName,
    passengerPhone,
    tripNature: nature,
    mode,
    origin,
    destination,
    travelDate,
    returnDate,
    departureTimeSlot: departureTimeSlot.join(', '),
    travelClass,
    purpose: purpose === 'Others' ? otherPurpose : purpose,
    accommodationRequired,
    hotelPreference,
    dietaryPreference: diet,
    specialInstructions,
  });

  const applyDraft = (draft: TripDraft) => {
    if (draft.firstName) setFirstName(String(draft.firstName));
    if (draft.middleName) setMiddleName(String(draft.middleName));
    if (draft.lastName) setLastName(String(draft.lastName));
    if (draft.passengerPhone) setPassengerPhone(String(draft.passengerPhone));

    if (draft.tripNature && Object.values(TripNature).includes(draft.tripNature as TripNature)) {
      handleTripTypeChange(draft.tripNature as TripNature);
    }
    if (draft.mode && Object.values(TravelMode).includes(draft.mode as TravelMode)) {
      setMode(draft.mode as TravelMode);
    }

    if (draft.origin) setOrigin(normalizeCityChoice(String(draft.origin)));
    if (draft.destination) setDestination(normalizeCityChoice(String(draft.destination)));
    if (draft.travelDate) setTravelDate(String(draft.travelDate));
    if (draft.returnDate) setReturnDate(String(draft.returnDate));
    if (draft.departureTimeSlot) {
      const normalizedSlot = normalizeTimeSlotChoice(String(draft.departureTimeSlot));
      if (normalizedSlot) setDepartureTimeSlot([normalizedSlot]);
    }
    if (draft.travelClass) setTravelClass(String(draft.travelClass));
    if (draft.purpose) {
      const purposeValue = String(draft.purpose);
      if (PURPOSE_OPTIONS.includes(purposeValue)) {
        setPurpose(purposeValue);
      } else {
        setPurpose('Others');
        setOtherPurpose(purposeValue);
      }
    }
    if (typeof draft.accommodationRequired === 'boolean') setAccommodationRequired(draft.accommodationRequired);
    if (draft.hotelPreference) setHotelPreference(String(draft.hotelPreference));

    if (draft.dietaryPreference && Object.values(DietaryPreference).includes(draft.dietaryPreference as DietaryPreference)) {
      setDiet(draft.dietaryPreference as DietaryPreference);
    }

    if (draft.specialInstructions) setSpecialInstructions(String(draft.specialInstructions));
  };

  const handleAssistantSend = async () => {
    if (!assistantInput.trim() || assistantLoading) return;

    const token = localStorage.getItem('travelDeskToken');
    if (!token) {
      setNotification({ type: 'error', message: 'User not authenticated' });
      return;
    }

    const userMessage: AssistantMessage = { role: 'user', content: assistantInput.trim() };
    const nextMessages = [...assistantMessages, userMessage];
    setAssistantMessages(nextMessages);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const response = await fetch('/api/expert/trip-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages,
          currentDraft: getCurrentDraft(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to process assistant request.');
      }

      const draft = (data?.draft || {}) as TripDraft;
      applyDraft(draft);

      const missing = Array.isArray(draft.missingQuestions) ? draft.missingQuestions : [];
      const reply = missing.length > 0
        ? `Great, I updated the form.\n\nPlease confirm:\n• ${missing.join('\n• ')}`
        : 'Great, I updated the form with your details. You can review and submit.';

      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Assistant failed. Please try again.';
      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleTripTypeChange = (value: TripNature) => {
    setNature(value);

    if (value === TripNature.MULTI_CITY) {
      const seededLegs = itineraryLegs.length > 0 ? itineraryLegs : [{ origin: '', destination: '', travelDate: '' }];
      if (seededLegs.length === 1 && (origin || destination || travelDate)) {
        seededLegs[0] = { origin, destination, travelDate, timeSlot: departureTimeSlot.length > 0 ? departureTimeSlot[0] : undefined };
      }
      setItineraryLegs(seededLegs);
      return;
    }

    if (itineraryLegs.length > 0) {
      const [firstLeg] = itineraryLegs;
      if (firstLeg) {
        setOrigin(firstLeg.origin);
        setDestination(firstLeg.destination);
        setTravelDate(firstLeg.travelDate);
        setDepartureTimeSlot(firstLeg.timeSlot ? [firstLeg.timeSlot] : []);
      }
    }
  };

  const updateLeg = (index: number, field: keyof ItineraryLeg, value: string) => {
    setItineraryLegs((prev) =>
      prev.map((leg, idx) => (idx === index ? { ...leg, [field]: value } : leg))
    );
  };

  const addLeg = () => {
    setItineraryLegs((prev) => [...prev, { origin: '', destination: '', travelDate: '' }]);
  };

  const removeLeg = (index: number) => {
    setItineraryLegs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const openTimeSlotPicker = (index: number | null) => {
    setActiveLegIndex(index);
    setIsTimeSlotOpen(true);
  };

  const toggleTimeSlot = (slot: string) => {
    if (nature === TripNature.MULTI_CITY && activeLegIndex !== null) {
      // For multi-city, keep single selection per leg
      setItineraryLegs((prev) =>
        prev.map((leg, idx) => (idx === activeLegIndex ? { ...leg, timeSlot: slot } : leg))
      );
      setIsTimeSlotOpen(false);
      setActiveLegIndex(null);
    } else {
      // For other trip types, allow multiple selection
      setDepartureTimeSlot((prev) => {
        if (prev.includes(slot)) {
          return prev.filter(s => s !== slot);
        } else {
          return [...prev, slot];
        }
      });
    }
  };

  const executeSubmission = async () => {
    setLoading(true);
    const token = localStorage.getItem('travelDeskToken');
    if (!token) {
        setNotification({ type: 'error', message: 'User not authenticated' });
        setLoading(false);
        return;
    }

    if (nature === TripNature.MULTI_CITY) {
      const validLegs = itineraryLegs.filter(
        (leg) => leg.origin && leg.destination && leg.travelDate
      );

      if (validLegs.length < 2) {
        setNotification({ type: 'error', message: 'Please add at least two complete trip legs.' });
        setLoading(false);
        return;
      }
    }

    const passengerName = [firstName, middleName, lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');

    const payload = {
        tripNature: nature,
        mode,
        passengerName,
        passengerPhone,
        dietaryPreference: diet,
        origin: nature === TripNature.MULTI_CITY ? itineraryLegs[0]?.origin || '' : origin,
        destination: nature === TripNature.MULTI_CITY ? itineraryLegs[0]?.destination || '' : destination,
        travelDate: nature === TripNature.MULTI_CITY ? itineraryLegs[0]?.travelDate || '' : travelDate,
        returnDate: nature === TripNature.ROUND_TRIP ? returnDate : undefined,
        departureTimeSlot: nature === TripNature.MULTI_CITY ? undefined : departureTimeSlot.join(', '),
        itineraryLegs: nature === TripNature.MULTI_CITY ? itineraryLegs : undefined,
        travelClass,
        purpose: purpose === 'Others' ? otherPurpose : purpose,
        accommodationRequired,
        hotelPreference: accommodationRequired ? hotelPreference : undefined,
        
        // Note: Check-in/Check-out dates were not in original UI distinct fields, 
        // usually implied by travel dates or in instructions. 
        // We will default to travel dates if needed or leave undefined for travel desk to decide.
        checkInDate: accommodationRequired ? travelDate : undefined,
        checkOutDate: accommodationRequired ? (returnDate || travelDate) : undefined,
        
        specialInstructions
    };

    try {
        const res = await fetch('/api/travel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.ok) {
            setShowConfirm(false);
            setNotification({ type: 'success', message: 'Travel Request Submitted Successfully!' });
            setLoading(false);
            setTimeout(() => {
                onSubmit(data.request);
            }, 1000);
        } else {
            setNotification({ type: 'error', message: data.error || 'Failed to submit' });
            setLoading(false);
            setShowConfirm(false);
        }
    } catch (err) {
        console.error(err);
        setNotification({ type: 'error', message: 'Network error occurred' });
        setLoading(false);
        setShowConfirm(false);
    }
  };

  return (
    <>
      {notification && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
      
      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={executeSubmission}
        loading={loading}
      />

    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-12">
      <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] border border-white/40 shadow-2xl shadow-blue-900/10 overflow-hidden ring-1 ring-white/60 transition-all hover:shadow-blue-900/20 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-indigo-800/90 backdrop-blur-md p-10 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-1000 ease-out origin-center">
            <Plane size={150} strokeWidth={1} />
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-colors duration-1000 animate-pulse"></div>
          <div className="absolute top-[-50%] right-[20%] w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 transform transition-all duration-500 group-hover:translate-x-2">
            <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">Domestic Travel Requisition</h2>
            <p className="text-blue-100/90 mt-2 font-medium text-lg flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-white/20">CONFIDENTIAL</span>
              Internal Corporate Booking Portal • Zuari Industries Ltd.
            </p>
          </div>
        </div>

        <form className="p-10 space-y-12" onSubmit={handleInitialSubmit}>
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-6">
            <SectionTitle icon={MessageCircle} title="AI Trip Assistant" />
            <p className="text-sm text-slate-600 mb-4">
              Share your trip plan in plain language. I will fill fields automatically from your response and profile.
            </p>

            <div className="max-h-56 overflow-y-auto space-y-3 pr-1 mb-4">
              {assistantMessages.map((message, idx) => (
                <div
                  key={`assistant-msg-${idx}`}
                  className={`text-sm p-3 rounded-xl ${message.role === 'user' ? 'bg-blue-50 text-blue-700 ml-10' : 'bg-white text-slate-700 mr-10 border border-slate-200'}`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAssistantSend();
                  }
                }}
                placeholder="Example: Round trip Goa to Mumbai on 2026-03-10, return 2026-03-12, client meeting, hotel needed"
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAssistantSend}
                disabled={assistantLoading || !assistantInput.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {assistantLoading ? 'Filling...' : 'Fill'}
              </button>
            </div>
          </div>
          
          {/* Section 1: Trip configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Trip Type <span className="text-rose-500">*</span></label>
              <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-md border border-white/20 rounded-2xl">
                {Object.values(TripNature).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleTripTypeChange(val)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${nature === val ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Travel Mode <span className="text-rose-500">*</span></label>
              <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-md border border-white/20 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode(TravelMode.FLIGHT)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${mode === TravelMode.FLIGHT ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                >
                  <Plane size={14} /> Flight
                </button>
                <button
                  type="button"
                  onClick={() => setMode(TravelMode.TRAIN)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${mode === TravelMode.TRAIN ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}`}
                >
                  <Train size={14} /> Train
                </button>
              </div>
            </div>
          </div>

          {/* Passenger Information */}
          <div>
            <SectionTitle icon={User} title="Passenger Information (As per Gov ID)" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">First Name <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder="First name" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white placeholder:text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Middle Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <input value={middleName} onChange={e => setMiddleName(e.target.value)} type="text" placeholder="Middle name" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white placeholder:text-slate-400" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Name <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} type="text" placeholder="Last name" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white placeholder:text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name (Preview)</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <input
                    value={[firstName, middleName, lastName].filter(Boolean).join(' ')}
                    readOnly
                    type="text"
                    placeholder="Full name preview"
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-xl outline-none font-medium text-slate-700 shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mobile Number <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <input required value={passengerPhone} onChange={e => setPassengerPhone(e.target.value)} type="tel" placeholder="+91 9876543210" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white placeholder:text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dietary Preference <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                  <select 
                    value={diet} 
                    onChange={(e) => setDiet(e.target.value as DietaryPreference)}
                    className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white"
                  >
                    {Object.values(DietaryPreference).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary Details with Dropdowns */}
          <div>
            <SectionTitle icon={MapPin} title="Itinerary Details" />
            {nature === TripNature.MULTI_CITY ? (
              <div className="space-y-4">
                {itineraryLegs.map((leg, index) => (
                  <div key={`leg-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white/40 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Origin City <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                        <select required value={leg.origin} onChange={e => updateLeg(index, 'origin', e.target.value)} className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white">
                          <option value="">Select Origin</option>
                          {MAJOR_CITIES.map(city => <option key={`multi-origin-${index}-${city}`} value={city}>{city}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination City <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                        <select required value={leg.destination} onChange={e => updateLeg(index, 'destination', e.target.value)} className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white">
                          <option value="">Select Destination</option>
                          {MAJOR_CITIES.map(city => <option key={`multi-dest-${index}-${city}`} value={city}>{city}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Departure Date <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                        <input required value={leg.travelDate} onChange={e => updateLeg(index, 'travelDate', e.target.value)} type="date" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button type="button" onClick={() => openTimeSlotPicker(index)} className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                        {leg.timeSlot || 'Select Time Slot'}
                      </button>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Leg {index + 1}</span>
                        {itineraryLegs.length > 1 && (
                          <button type="button" onClick={() => removeLeg(index)} className="text-xs font-bold text-rose-500 hover:text-rose-600">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLeg} className="px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors">
                  Add Another Leg
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Origin City <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <select required value={origin} onChange={e => setOrigin(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white">
                      <option value="">Select Origin</option>
                      {MAJOR_CITIES.map(city => <option key={`origin-${city}`} value={city}>{city}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination City <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <select required value={destination} onChange={e => setDestination(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white">
                      <option value="">Select Destination</option>
                      {MAJOR_CITIES.map(city => <option key={`dest-${city}`} value={city}>{city}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Departure Date <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <input required value={travelDate} onChange={e => setTravelDate(e.target.value)} type="date" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time Slot</label>
                  <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <button type="button" onClick={() => openTimeSlotPicker(null)} className="w-full pl-10 pr-10 py-3 text-left bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl text-sm font-medium text-slate-800 hover:border-blue-400 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                      {departureTimeSlot.length > 0 ? departureTimeSlot.join(', ') : 'Select Time Slots'}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                  </div>
                </div>
                <div className={`space-y-2 transition-all duration-300 ${nature === TripNature.ROUND_TRIP ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Return Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <input required={nature === TripNature.ROUND_TRIP} value={returnDate} onChange={e => setReturnDate(e.target.value)} type="date" className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business */}
          <div>
            <SectionTitle icon={Briefcase} title="Business & Billing" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Purpose <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <select required value={purpose} onChange={e => { setPurpose(e.target.value); if (e.target.value !== 'Others') setOtherPurpose(''); }} className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 appearance-none shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white">
                    <option value="">Select Purpose</option>
                    {PURPOSE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    {purpose && !PURPOSE_OPTIONS.includes(purpose) && (
                      <option value={purpose}>{purpose}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
                </div>
              </div>
              {purpose === 'Others' && (
                <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Please specify <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={16} />
                    <textarea
                      required
                      value={otherPurpose}
                      onChange={e => setOtherPurpose(e.target.value)}
                      placeholder="Please describe your purpose of travel..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 font-medium text-slate-800 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferences & Accommodation */}
          <div className="bg-slate-50/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 shadow-inner hover:shadow-lg transition-all duration-500">
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 space-y-6">
                <SectionTitle icon={Hotel} title="Accommodation" />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-14 h-7 rounded-full transition-all duration-300 relative ${accommodationRequired ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-200 shadow-inner'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${accommodationRequired ? 'left-8 scale-110' : 'left-1'}`}></div>
                    <input type="checkbox" className="hidden" checked={accommodationRequired} onChange={() => setAccommodationRequired(!accommodationRequired)} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 select-none">Need Hotel Accommodation?</span>
                </label>
                
                {accommodationRequired && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hotel Preference / Area</label>
                      <input value={hotelPreference} onChange={e => setHotelPreference(e.target.value)} type="text" placeholder="Near Airport / City Center" className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px bg-slate-200 hidden lg:block"></div>

              <div className="flex-1 space-y-6">
                <SectionTitle icon={FileText} title="Additional Notes" />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Special Instructions</label>
                  <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={3} placeholder="Preferred flight timing, dietary requirements, cab pickup needs..." className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl outline-none resize-none font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/80 focus:bg-white"></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
              <Info size={16} className="text-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Ticketing details are verified by Travel Desk.</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button type="button" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all active:scale-95">
                <Save size={18} /> Draft
              </button>
              <button disabled={loading} type="submit" className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-12 py-4 bg-blue-600 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95">
                 {loading ? 'Submitting...' : <><Send size={18} /> Submit Ticket</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <Building2 size={12} /> Domestic Operations
        </div>
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <Clock size={12} /> Standard 24h Approval
        </div>
      </div>
    </div>
    {isTimeSlotOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTimeSlotOpen(false)} />
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 border border-white/40 animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Select Departure Time</h3>
          <p className="text-xs text-slate-500 mb-4">You can select multiple time slots</p>
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = nature === TripNature.MULTI_CITY && activeLegIndex !== null 
                ? itineraryLegs[activeLegIndex]?.timeSlot === slot
                : departureTimeSlot.includes(slot);
              
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleTimeSlot(slot)}
                  className={`w-full px-4 py-3 rounded-xl border text-left font-semibold transition-all duration-200 flex items-center gap-3 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                      : 'border-slate-200/60 bg-white/50 backdrop-blur-sm text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {slot}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { setIsTimeSlotOpen(false); setActiveLegIndex(null); }} className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default TravelRequestForm;
