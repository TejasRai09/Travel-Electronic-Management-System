import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, 
  Train, 
  MapPin, 
  Calendar, 
  ArrowLeft,
  FileText,
  Briefcase,
  Hotel,
  User,
  Users,
  Phone,
  Utensils,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Send,
  Download,
  Upload,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Package,
  PackageCheck
} from 'lucide-react';
import { TravelRequest, TravelMode, TripNature, DietaryPreference, TravelStatus, ChatMessage, FileAttachment } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TravelRequestDetailViewProps {
  request: TravelRequest;
  onBack: () => void;
  isPOC?: boolean;
  isManager?: boolean;
}

const TravelRequestDetailView: React.FC<TravelRequestDetailViewProps> = ({ request: initialRequest, onBack, isPOC = false, isManager = false }) => {
  const [chatMessage, setChatMessage] = useState('');
  const [request, setRequest] = useState<TravelRequest>(initialRequest);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'Approved' | 'Rejected' | null>(null);
  const [confirmComment, setConfirmComment] = useState('');
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    // Only scroll if the message count has increased or it's the initial load
    // This prevents annoying scrolling when polling updates the request but no new messages arrived
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [request.chatMessages?.length]);

  // Fetch latest request data
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('travelDeskToken');
        if (!token) {
          return;
        }
        const res = await fetch(`/api/travel/${request.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) {
          setRequest(data.request);
        }
      } catch (err) {
        console.error('Error fetching request:', err);
      }
    };

    fetchRequest();
    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchRequest, 5000);
    return () => clearInterval(interval);
  }, [request.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
    </div>
  );

  const InfoField = ({ label, value, icon: Icon }: { label: string, value: string | number | undefined, icon?: any }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" />}
        <p className="text-sm font-medium text-slate-800">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const getStatusStyle = (status: TravelStatus) => {
    switch (status) {
      case TravelStatus.APPROVED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case TravelStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case TravelStatus.REJECTED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: TravelStatus) => {
    switch (status) {
      case TravelStatus.APPROVED: return <CheckCircle2 size={20} />;
      case TravelStatus.PENDING: return <Clock size={20} />;
      case TravelStatus.REJECTED: return <AlertTriangle size={20} />;
      default: return <FileText size={20} />;
    }
  };

  // Status Tracker Component
  // Approval Chain Component
  const ApprovalChainTracker = () => {
    const approvalChain = request.approvalChain || [];
    const currentIndex = request.currentApprovalIndex || 0;
    const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
    
    // Check if current user is in the approval chain and has already approved
    const currentUserInChain = approvalChain.find(a => a.email.toLowerCase() === currentUserEmail);
    const hasCurrentUserApproved = currentUserInChain?.approved || false;
    const isCurrentUserPendingApprover = currentIndex < approvalChain.length && 
                                          approvalChain[currentIndex]?.email.toLowerCase() === currentUserEmail &&
                                          !approvalChain[currentIndex]?.approved;
    
    if (approvalChain.length === 0) return null;
    
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50/30 rounded-xl p-5 border border-indigo-200/60 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users size={16} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Manager Approval Chain</h3>
        </div>
        
        <div className="space-y-3">
          {approvalChain.map((approver, index) => (
            <div 
              key={index}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                approver.approved 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : index === currentIndex
                  ? 'bg-blue-50 border border-blue-200 ring-2 ring-blue-100'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              {/* Step Number/Status */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                approver.approved
                  ? 'bg-emerald-500 text-white'
                  : index === currentIndex
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-slate-300 text-slate-600'
              }`}>
                {approver.approved ? <Check size={18} /> : index + 1}
              </div>
              
              {/* Approver Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{approver.name}</p>
                  {approver.email.toLowerCase() === currentUserEmail && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Impact Level: {approver.impactLevel}</p>
                {approver.approved && approver.approvedAt && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    ✓ Approved {formatDateTime(approver.approvedAt)}
                  </p>
                )}
                {!approver.approved && index === currentIndex && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    ⏳ Pending approval
                  </p>
                )}
                {!approver.approved && index > currentIndex && (
                  <p className="text-xs text-slate-400 mt-1">
                    Waiting for previous approvals
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Current User Status Message */}
        {hasCurrentUserApproved && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">
              You have approved this request. It is now with {currentIndex < approvalChain.length ? approvalChain[currentIndex]?.name : 'POC'} for review.
            </p>
          </div>
        )}
        
        {isCurrentUserPendingApprover && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">
              This request is awaiting your approval.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  const StatusTracker = () => {
    const hasVendorResponses = request.vendorMessages && request.vendorMessages.length > 0;
    const hasVendorAttachments = hasVendorResponses && request.vendorMessages.some(msg => msg.attachments && msg.attachments.length > 0);
    const attachmentCount = hasVendorResponses ? request.vendorMessages.reduce((acc, msg) => acc + (msg.attachments?.length || 0), 0) : 0;
    
    const steps = [
      {
        id: 1,
        title: 'Submitted',
        description: 'Request created',
        completed: true,
        active: false,
        icon: FileText,
        date: request.createdAt ? formatDateTime(request.createdAt) : null
      },
      {
        id: 2,
        title: 'Manager Review',
        description: request.status === TravelStatus.REJECTED 
          ? 'Rejected by manager' 
          : request.managerApprovedBy 
          ? 'Approved by manager' 
          : 'Awaiting manager approval',
        completed: !!request.managerApprovedAt || request.status === TravelStatus.REJECTED,
        active: request.status === TravelStatus.PENDING,
        rejected: request.status === TravelStatus.REJECTED,
        icon: User,
        date: request.managerApprovedAt ? formatDateTime(request.managerApprovedAt) : null
      },
      {
        id: 3,
        title: 'POC Review',
        description: request.status === TravelStatus.POC_REJECTED 
          ? 'Rejected by POC' 
          : request.pocApprovedAt
          ? 'Approved & sent to vendor' 
          : 'Awaiting POC review',
        completed: request.status === TravelStatus.APPROVED || request.status === TravelStatus.POC_REJECTED,
        active: request.status === TravelStatus.MANAGER_APPROVED,
        rejected: request.status === TravelStatus.POC_REJECTED,
        icon: Briefcase,
        date: request.pocApprovedAt ? formatDateTime(request.pocApprovedAt) : null
      },
      {
        id: 4,
        title: hasVendorAttachments ? 'Vendor Response' : 'Vendor Processing',
        description: hasVendorAttachments
          ? `${attachmentCount} ticket option${attachmentCount > 1 ? 's' : ''} received`
          : hasVendorResponses
          ? 'Vendor contacted & reviewing' 
          : request.status === TravelStatus.APPROVED
          ? 'Forwarded to travel vendor'
          : 'Pending vendor assignment',
        completed: hasVendorAttachments,
        active: request.status === TravelStatus.APPROVED && !hasVendorAttachments,
        rejected: false,
        icon: hasVendorAttachments ? PackageCheck : Package,
        isVendorStep: true,
        date: hasVendorAttachments 
          ? formatDateTime(request.vendorMessages.filter(msg => msg.attachments && msg.attachments.length > 0)[0]?.sentAt) 
          : hasVendorResponses 
          ? formatDateTime(request.vendorMessages[0].sentAt) 
          : null
      }
    ];

    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-5 border border-slate-200/60 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Clock size={16} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Request Progress</h3>
        </div>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200" />
          <div 
            className="absolute left-6 top-8 w-0.5 bg-blue-500 transition-all duration-1000 ease-out"
            style={{ 
              height: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` 
            }}
          />
          
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex items-start gap-4 group">
                {/* Step Indicator */}
                <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step.rejected 
                    ? 'bg-rose-500 text-white ring-4 ring-rose-100 shadow-lg shadow-rose-200' 
                    : step.completed 
                    ? (step.isVendorStep ? 'bg-purple-500 text-white ring-4 ring-purple-100 shadow-lg shadow-purple-200' : 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-lg shadow-emerald-200')
                    : step.active 
                    ? (step.isVendorStep ? 'bg-purple-500 text-white ring-4 ring-purple-100 shadow-lg shadow-purple-200 animate-pulse' : 'bg-blue-500 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-200 animate-pulse')
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {step.rejected ? (
                    <X size={18} />
                  ) : step.completed ? (
                    <Check size={18} />
                  ) : step.active ? (
                    <Clock size={18} />
                  ) : step.icon ? (
                    <step.icon size={16} className="opacity-50" />
                  ) : (
                    <span className="text-xs">{step.id}</span>
                  )}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pb-6">
                  <div className={`p-3 rounded-xl border transition-all duration-300 ${
                    step.rejected 
                      ? 'bg-rose-50 border-rose-200' 
                      : step.completed 
                      ? (step.isVendorStep ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200')
                      : step.active 
                      ? (step.isVendorStep ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-blue-50 border-blue-200 shadow-sm')
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-bold text-base mb-1 flex items-center gap-2 ${
                          step.rejected ? 'text-rose-700' : 
                          step.completed ? (step.isVendorStep ? 'text-purple-700' : 'text-emerald-700') : 
                          step.active ? (step.isVendorStep ? 'text-purple-700' : 'text-blue-700') : 
                          'text-slate-500'
                        }`}>
                          {step.icon && <step.icon size={18} />}
                          {step.title}
                        </h4>
                        <p className={`text-sm ${
                          step.rejected ? 'text-rose-600' : 
                          step.completed ? (step.isVendorStep ? 'text-purple-600' : 'text-emerald-600') : 
                          step.active ? (step.isVendorStep ? 'text-purple-600' : 'text-blue-600') : 
                          'text-slate-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      {step.date && (
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded-lg border border-slate-200">
                            {step.date}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons for Manager Review */}
                    {(() => {
                      const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
                      const approvalChain = request.approvalChain || [];
                      const currentIndex = request.currentApprovalIndex || 0;
                      const currentUserInChain = approvalChain.find(a => a.email.toLowerCase() === currentUserEmail);
                      const hasCurrentUserApproved = currentUserInChain?.approved || false;
                      const isCurrentUserPendingApprover = currentIndex < approvalChain.length && 
                                                            approvalChain[currentIndex]?.email.toLowerCase() === currentUserEmail &&
                                                            !approvalChain[currentIndex]?.approved;
                      
                      if (step.id === 2 && isManager && request.status === TravelStatus.PENDING && !isOriginator) {
                        if (hasCurrentUserApproved) {
                          return (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                                <p className="text-sm text-emerald-700 font-medium">
                                  You have already approved this request.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        
                        if (!isCurrentUserPendingApprover && approvalChain.length > 0) {
                          const currentApprover = approvalChain[currentIndex];
                          return (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                <Clock size={18} className="text-amber-600" />
                                <p className="text-sm text-amber-700 font-medium">
                                  Waiting for {currentApprover?.name || 'another manager'} to approve.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        
                        // User is the current pending approver - show buttons
                        return (
                          <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                            <button
                              onClick={() => {
                                setConfirmAction('Rejected');
                                setShowConfirmModal(true);
                              }}
                              className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <X size={18} />
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setConfirmAction('Approved');
                                setShowConfirmModal(true);
                              }}
                              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Check size={18} />
                              Approve
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Action Buttons for POC Review */}
                    {step.id === 3 && isPOC && request.status === TravelStatus.MANAGER_APPROVED && !isOriginator && (
                      <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmAction('Rejected');
                            setShowConfirmModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={18} />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction('Approved');
                            setShowConfirmModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmModal || !confirmAction) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            {confirmAction === 'Approved' ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Confirm {confirmAction === 'Approved' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to {confirmAction === 'Approved' ? 'approve' : 'reject'} this request?
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={confirmComment}
              onChange={(e) => setConfirmComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
                setConfirmComment('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleUpdateStatus(confirmAction, confirmComment);
                setShowConfirmModal(false);
                setConfirmAction(null);
                setConfirmComment('');
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                confirmAction === 'Approved' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirm {confirmAction === 'Approved' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FilePreviewModal = () => {
    if (!previewFile) return null;

    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = previewFile.url;
      link.download = previewFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {previewFile.type === 'pdf' ? (
                <FileText size={24} className="text-red-500" />
              ) : (
                <Paperclip size={24} className="text-purple-500" />
              )}
              <div>
                <h3 className="font-bold text-slate-800">{previewFile.name}</h3>
                <p className="text-xs text-slate-500">{previewFile.type === 'pdf' ? 'PDF Document' : 'Image'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50">
            {previewFile.type === 'image' ? (
              <div className="flex items-center justify-center">
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <iframe
                src={previewFile.url}
                className="w-full h-full min-h-[600px] rounded-lg border border-slate-200 bg-white"
                title={previewFile.name}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) {
        alert('Please log in again. Your session has expired.');
        setSending(false);
        return;
      }
      
      const res = await fetch(`/api/travel/${request.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: chatMessage.trim() })
      });
      
      const data = await res.json();
      
      if (data.ok && data.message) {
        // Update request with new message
        setRequest(prev => ({
          ...prev,
          chatMessages: [...(prev.chatMessages || []), data.message]
        }));
        setChatMessage('');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please check your connection and make sure the backend is running.');
    } finally {
      setSending(false);
    }
  };

  const handleSendVendorChat = async () => {
    if (!chatMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) {
        alert('Please log in again. Your session has expired.');
        setSending(false);
        return;
      }
      
      const res = await fetch(`/api/vendor/requests/${request.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: chatMessage.trim() })
      });
      
      const data = await res.json();
      
      if (data.ok && data.vendorChatMessages) {
        // Update request with new vendor chat messages
        setRequest(prev => ({
          ...prev,
          vendorChatMessages: data.vendorChatMessages
        }));
        setChatMessage('');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending vendor chat message:', err);
      alert('Failed to send message. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('travelDeskToken');
    if (!token) {
      alert('Please log in again. Your session has expired.');
      return;
    }
    
    // In production, you'd upload to a cloud service like S3
    // For now, we'll simulate with a data URL (not recommended for production)
    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch(`/api/travel/${request.id}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: reader.result as string // In prod, this would be S3 URL
          })
        });
        
        const data = await res.json();
        
        if (data.ok && data.file) {
          setRequest(prev => ({
            ...prev,
            fileAttachments: [...(prev.fileAttachments || []), data.file]
          }));
        } else {
          alert(data.error || 'Failed to upload file');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file. Please check your connection.');
      setUploading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleUpdateStatus = async (status: 'Approved' | 'Rejected', comment: string = '') => {
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) return;

      const res = await fetch(`/api/travel/${request.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, comment })
      });
      
      const data = await res.json();
      if (data.ok) {
        setRequest(prev => ({ ...prev, status: data.status || status }));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPos = 15;

    // Helper function for section headers
    const addSectionHeader = (title: string, icon: string, y: number) => {
      // Decorative line before section
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      
      // Section title with icon background
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.roundedRect(margin, y + 1, pageWidth - 2 * margin, 7, 1.5, 1.5, 'F');
      
      // Draw icon box
      doc.setFillColor(59, 130, 246);
      doc.circle(margin + 3.5, y + 4.5, 1.8, 'F');
      
      doc.setTextColor(30, 64, 175); // Dark blue
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 8, y + 5.5);
      
      doc.setTextColor(0, 0, 0); // Reset to black
      return y + 10;
    };

    // ===== COMPACT HEADER =====
    // Gradient-like header - reduced height
    for (let i = 0; i < 32; i++) {
      doc.setFillColor(37 + i, 99 - i, 235 - (i * 2));
      doc.rect(0, i, pageWidth, 1, 'F');
    }
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAVEL REQUEST', pageWidth / 2, 14, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Travel Authorization Document', pageWidth / 2, 21, { align: 'center' });
    
    // Request ID badge
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(pageWidth / 2 - 20, 24, 40, 6, 1.5, 1.5, 'FD');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(request.uniqueId, pageWidth / 2, 28, { align: 'center' });
    
    yPos = 38;

    // ===== COMPACT STATUS & INFO =====
    doc.setTextColor(0, 0, 0);
    
    // Status card
    const statusColor = request.status === TravelStatus.APPROVED ? [16, 185, 129] :
                        request.status === TravelStatus.REJECTED ? [239, 68, 68] : [251, 191, 36];
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin, yPos, 45, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const statusText = request.status === TravelStatus.APPROVED ? 'APPROVED' :
                       request.status === TravelStatus.REJECTED ? 'REJECTED' : 'PENDING';
    doc.text(statusText, margin + 22.5, yPos + 6, { align: 'center' });
    
    // Date card
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin + 48, yPos, pageWidth - 2 * margin - 48, 9, 2, 2, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Created:', margin + 50, yPos + 3.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDateTime(request.createdAt), margin + 50, yPos + 7);
    
    yPos += 13;
    doc.setTextColor(0, 0, 0);

    // ===== REQUESTER INFORMATION =====
    yPos = addSectionHeader('Requester Information', '', yPos);
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Name', request.originator],
        ['Email', request.originatorEmail || 'N/A'],
        ['Department', request.department || 'N/A']
      ],
      theme: 'plain',
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          fillColor: [248, 250, 252],
          cellWidth: 40,
          textColor: [71, 85, 105]
        },
        1: { 
          cellWidth: pageWidth - 2 * margin - 40,
          textColor: [15, 23, 42]
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // ===== TRIP OVERVIEW CARD ===
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 16, 2, 2, 'FD');
    
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TRIP OVERVIEW', margin + 2.5, yPos + 4.5);
    
    // Route display with arrow
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const arrow = request.tripNature === TripNature.ROUND_TRIP ? '<->' : 
                  request.tripNature === TripNature.MULTI_CITY ? '>>>' : '->';
    doc.text(`${request.origin} ${arrow} ${request.destination}`, margin + 2.5, yPos + 10);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${request.mode} | ${request.tripNature} | ${request.travelClass}`, margin + 2.5, yPos + 14);
    
    yPos += 20;

    // ===== PASSENGER INFORMATION =====
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 15;
    }

    yPos = addSectionHeader('Passenger Details', '', yPos);

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Full Name', request.passengerName],
        ['Contact Number', request.passengerPhone],
        ['Meal Preference', request.dietaryPreference]
      ],
      theme: 'plain',
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          fillColor: [254, 249, 195],
          cellWidth: 40,
          textColor: [120, 53, 15]
        },
        1: { 
          cellWidth: pageWidth - 2 * margin - 40,
          textColor: [15, 23, 42]
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // ===== ITINERARY DETAILS ===
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 15;
    }

    yPos = addSectionHeader('Travel Itinerary', '', yPos);

    if (request.tripNature === TripNature.MULTI_CITY && request.itineraryLegs) {
      const legsData = request.itineraryLegs.map((leg, index) => [
        `${index + 1}`,
        `${leg.origin}`,
        '→',
        `${leg.destination}`,
        new Date(leg.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        leg.timeSlot || 'Flexible'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Leg', 'From', '', 'To', 'Date', 'Time Slot']],
        body: legsData,
        theme: 'striped',
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', fillColor: [238, 242, 255] },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 10, halign: 'center', textColor: [79, 70, 229] },
          3: { cellWidth: 35, fontStyle: 'bold' },
          4: { cellWidth: 40 },
          5: { cellWidth: 50 }
        }
      });
    } else {
      const itineraryInfo = [
        ['From', request.origin],
        ['To', request.destination],
        ['Departure Date', new Date(request.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
      ];

      if (request.departureTimeSlot) {
        itineraryInfo.push(['Preferred Time', request.departureTimeSlot]);
      }

      if (request.tripNature === TripNature.ROUND_TRIP && request.returnDate) {
        itineraryInfo.push(['Return Date', new Date(request.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })]);
      }

      itineraryInfo.push(['Travel Class', request.travelClass]);

      autoTable(doc, {
        startY: yPos,
        body: itineraryInfo,
        theme: 'plain',
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [243, 244, 246],
            cellWidth: 40,
            textColor: [75, 85, 99]
          },
          1: { 
            cellWidth: pageWidth - 2 * margin - 40,
            textColor: [15, 23, 42],
            fontStyle: 'bold'
          }
        }
      });
    }

    yPos = (doc as any).lastAutoTable.finalY + 8;

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // ===== BUSINESS PURPOSE =====
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 15;
    }

    yPos = addSectionHeader('Business Justification', '', yPos);

    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 0, 2, 2, 'S');
    
    autoTable(doc, {
      startY: yPos,
      body: [[request.purpose]],
      theme: 'plain',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        lineColor: [254, 243, 199],
        lineWidth: 1,
        textColor: [113, 63, 18]
      },
      columnStyles: {
        0: { 
          fillColor: [254, 252, 232],
          cellWidth: pageWidth - 2 * margin
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // ===== ACCOMMODATION DETAILS =====
    if (request.accommodationRequired) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      yPos = addSectionHeader('Accommodation Required', '', yPos);

      const accommodationInfo = [
        ['Hotel Preference', request.hotelPreference || 'Any suitable hotel']
      ];

      if (request.checkInDate) {
        accommodationInfo.push(['Check-In', new Date(request.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })]);
      }
      if (request.checkOutDate) {
        accommodationInfo.push(['Check-Out', new Date(request.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })]);
      }

      // Calculate duration if both dates present
      if (request.checkInDate && request.checkOutDate) {
        const nights = Math.round((new Date(request.checkOutDate).getTime() - new Date(request.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
        accommodationInfo.push(['Duration', `${nights} night${nights !== 1 ? 's' : ''}`]);
      }

      autoTable(doc, {
        startY: yPos,
        body: accommodationInfo,
        theme: 'plain',
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [254, 243, 199],
            cellWidth: 40,
            textColor: [120, 53, 15]
          },
          1: { 
            cellWidth: pageWidth - 2 * margin - 40,
            textColor: [15, 23, 42]
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ===== SPECIAL INSTRUCTIONS =====
    if (request.specialInstructions) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 15;
      }

      yPos = addSectionHeader('Special Instructions', '', yPos);

      doc.setFillColor(254, 242, 242);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 0, 2, 2, 'S');
      
      autoTable(doc, {
        startY: yPos,
        body: [[request.specialInstructions]],
        theme: 'plain',
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          fontStyle: 'italic',
          lineColor: [254, 226, 226],
          lineWidth: 1,
          textColor: [127, 29, 29]
        },
        columnStyles: {
          0: { 
            fillColor: [254, 242, 242],
            cellWidth: pageWidth - 2 * margin
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ===== CONVERSATION HISTORY =====
    if (request.chatMessages && request.chatMessages.length > 0) {
      doc.addPage();
      yPos = 15;

      // Conversation header with message count
      yPos = addSectionHeader(`Messages & Discussion (${request.chatMessages.length})`, '', yPos);

      const chatData = request.chatMessages.map((msg, idx) => {
        const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
        const isCurrentUser = msg.sender.toLowerCase() === currentUserEmail;
        const messageNumber = idx + 1;
        
        return [
          `#${messageNumber}`,
          msg.senderName,
          formatDateTime(msg.timestamp),
          msg.message
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['', 'Sender', 'Time', 'Message']],
        body: chatData,
        theme: 'plain',
        styles: { 
          fontSize: 7, 
          cellPadding: 2.5,
          overflow: 'linebreak',
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { 
            cellWidth: 12, 
            halign: 'center',
            fillColor: [238, 242, 255],
            textColor: [67, 56, 202],
            fontStyle: 'bold'
          },
          1: { 
            cellWidth: 38, 
            fontStyle: 'bold',
            textColor: [30, 64, 175]
          },
          2: { 
            cellWidth: 35,
            textColor: [100, 116, 139],
            fontSize: 6.5
          },
          3: { 
            cellWidth: 95,
            textColor: [15, 23, 42]
          }
        },
        didDrawCell: (data: any) => {
          // Add a subtle border to each message row
          if (data.section === 'body' && data.column.index === 0) {
            doc.setDrawColor(191, 219, 254);
            doc.setLineWidth(0.3);
            doc.line(
              data.cell.x,
              data.cell.y + data.cell.height,
              data.cell.x + pageWidth - 2 * margin,
              data.cell.y + data.cell.height
            );
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ===== FILE ATTACHMENTS =====
    if (request.fileAttachments && request.fileAttachments.length > 0) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      yPos = addSectionHeader(`Attached Documents (${request.fileAttachments.length})`, '', yPos);

      const fileData = request.fileAttachments.map((file, idx) => [
        idx + 1,
        file.fileName,
        file.uploadedByName,
        formatDateTime(file.uploadedAt)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'File Name', 'Uploaded By', 'Date & Time']],
        body: fileData,
        theme: 'striped',
        styles: { 
          fontSize: 7, 
          cellPadding: 2.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [234, 179, 8],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [254, 252, 232]
        },
        columnStyles: {
          0: { 
            cellWidth: 10, 
            halign: 'center',
            fontStyle: 'bold',
            fillColor: [254, 249, 195]
          },
          1: { 
            cellWidth: 70,
            fontStyle: 'bold',
            textColor: [15, 23, 42]
          },
          2: { 
            cellWidth: 45,
            textColor: [100, 116, 139]
          },
          3: { 
            cellWidth: 55,
            textColor: [100, 116, 139],
            fontSize: 6.5
          }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ===== FOOTER WITH SIGNATURE SECTION =====
    const totalPages = doc.getNumberOfPages();
    
    // Add signature section on last page
    doc.setPage(totalPages);
    const lastPageEndY = (doc as any).lastAutoTable?.finalY || yPos;
    
    if (lastPageEndY < pageHeight - 50) {
      let signYPos = Math.max(lastPageEndY + 15, pageHeight - 48);
      
      // Signature boxes
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      
      // Approved by box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, signYPos, 80, 20, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Approved by:', margin + 3, signYPos + 4.5);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Signature & Date', margin + 3, signYPos + 17);
      
      // Travel desk stamp box
      doc.roundedRect(pageWidth - margin - 80, signYPos, 80, 20, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Travel Desk:', pageWidth - margin - 77, signYPos + 4.5);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Official Stamp', pageWidth - margin - 77, signYPos + 17);
    }

    // Page numbers and metadata footer on all pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      
      // Page number
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6.5,
        { align: 'center' }
      );
      
      // Generation info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        pageWidth - margin,
        pageHeight - 6.5,
        { align: 'right' }
      );
      
      // Document ID
      doc.text(
        `Doc: ${request.uniqueId}`,
        margin,
        pageHeight - 6.5
      );
    }

    // ===== SAVE PDF =====
    const fileName = `TravelRequest_${request.uniqueId}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
  const isOriginator = request.originatorEmail?.toLowerCase() === currentUserEmail;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 px-4 pt-6">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors group font-medium"
      >
        <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] border border-white/40 shadow-2xl shadow-blue-900/10 overflow-hidden ring-1 ring-white/60">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-indigo-800/90 backdrop-blur-md p-10 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-1000 ease-out origin-center">
             <Plane size={150} strokeWidth={1} />
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-colors duration-1000 animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-lg backdrop-blur-md ${
                  request.status === TravelStatus.APPROVED ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100' :
                  request.status === TravelStatus.REJECTED ? 'bg-rose-500/20 border-rose-400/30 text-rose-100' :
                  'bg-amber-500/20 border-amber-400/30 text-amber-100'
                }`}>
                  {getStatusIcon(request.status)}
                  {request.status.toUpperCase()}
                </span>
                <span className="text-blue-200/60 text-xs font-mono uppercase tracking-widest bg-black/10 px-2 py-1 rounded">#{request.uniqueId}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight drop-shadow-sm mb-2">Travel Request Details</h2>
              <div className="flex items-center gap-2 text-blue-100/90 text-sm md:text-base font-medium">
                <div className="bg-white/10 rounded-full p-1"><User size={14} /></div>
                Requested by {request.originator} 
                <span className="opacity-60 text-xs">({request.originatorEmail || 'N/A'})</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col gap-3">
              <div className="hidden md:block">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">Created On</p>
                <p className="text-base font-semibold">{formatDateTime(request.createdAt)}</p>
              </div>
              <button
                onClick={downloadAsPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border border-white/30 text-sm font-semibold"
                title="Download as PDF"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[800px]">
          {/* Left Column - Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-6 space-y-5">
              
              {/* Collapsible Form Details */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setIsFormExpanded(!isFormExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                      <FileText size={16} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 text-base">Request Details</h3>
                      <p className="text-xs text-slate-500">
                        {isFormExpanded ? 'Click to collapse' : 'Click to expand and view full details'}
                      </p>
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-200 ${isFormExpanded ? 'rotate-180' : ''}`}>
                    <ChevronRight size={20} className="text-slate-400 rotate-90" />
                  </div>
                </button>

                {/* Expandable Content */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isFormExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-4 pt-0 space-y-6 border-t border-slate-100">
              
              {/* Trip Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 backdrop-blur-sm p-3 rounded-xl border border-blue-100/50">
                  <InfoField label="Trip Nature" value={request.tripNature} icon={MapPin} />
                </div>
                <div className="bg-indigo-50/50 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/50">
                  <InfoField 
                    label="Travel Mode" 
                    value={request.mode}
                    icon={request.mode === TravelMode.FLIGHT ? Plane : Train}
                  />
                </div>
              </div>

              {/* Passenger Information */}
              <div>
                <SectionTitle icon={User} title="Passenger Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                   <div className="p-3 bg-white/60 rounded-xl border border-slate-100 shadow-sm">
                      <InfoField label="Full Name" value={request.passengerName} icon={User} />
                   </div>
                   <div className="p-3 bg-white/60 rounded-xl border border-slate-100 shadow-sm">
                      <InfoField label="Mobile Number" value={request.passengerPhone} icon={Phone} />
                   </div>
                   <div className="p-3 bg-white/60 rounded-xl border border-slate-100 shadow-sm md:col-span-2">
                      <InfoField label="Dietary Preference" value={request.dietaryPreference} icon={Utensils} />
                   </div>
                </div>
              </div>

              {/* Itinerary */}
              <div>
                <SectionTitle icon={MapPin} title="Itinerary Details" />
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                {request.tripNature === TripNature.MULTI_CITY ? (
                  <div className="space-y-4">
                    {request.itineraryLegs?.map((leg, index) => (
                      <div key={`leg-${index}`} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100 group-hover:scale-110 transition-transform">
                             {index + 1}
                           </div>
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-base font-bold text-slate-800">
                               {leg.origin} 
                               <span className="text-slate-300"><ChevronRight size={16} /></span> 
                               {leg.destination}
                             </div>
                             <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                                 <Calendar size={12} className="text-blue-500" />
                                 {new Date(leg.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </div>
                               {leg.timeSlot && (
                                 <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg text-amber-700">
                                     <Clock size={12} />
                                     {leg.timeSlot}
                                 </div>
                               )}
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <InfoField label="Origin" value={request.origin} icon={MapPin} />
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <InfoField label="Destination" value={request.destination} icon={MapPin} />
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <InfoField label="Departure Date" value={new Date(request.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} icon={Calendar} />
                    </div>
                    {request.departureTimeSlot && (
                      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <InfoField label="Departure Time Slot" value={request.departureTimeSlot} icon={Clock} />
                      </div>
                    )}
                    {request.tripNature === TripNature.ROUND_TRIP && request.returnDate && (
                      <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm md:col-span-2">
                         <InfoField label="Return Date" value={new Date(request.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} icon={Calendar} />
                      </div>
                    )}
                    <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner md:col-span-2">
                       <InfoField label="Travel Class" value={request.travelClass} icon={Plane} />
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Business Justification */}
              <div>
                <SectionTitle icon={Briefcase} title="Business & Billing" />
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                   <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <InfoField label="Purpose of Visit" value={request.purpose} icon={FileText} />
                   </div>
                </div>
              </div>

              {/* Accommodation */}
              {request.accommodationRequired && (
                <div>
                  <SectionTitle icon={Hotel} title="Accommodation Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <div className="md:col-span-2 p-3 bg-white/80 rounded-xl border border-amber-100 shadow-sm">
                      <InfoField label="Hotel Preference" value={request.hotelPreference || 'Not specified'} icon={Hotel} />
                    </div>
                    {request.checkInDate && (
                      <div className="p-3 bg-white/80 rounded-xl border border-amber-100 shadow-sm">
                        <InfoField label="Check-In Date" value={new Date(request.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} icon={Calendar} />
                      </div>
                    )}
                    {request.checkOutDate && (
                      <div className="p-3 bg-white/80 rounded-xl border border-amber-100 shadow-sm">
                        <InfoField label="Check-Out Date" value={new Date(request.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} icon={Calendar} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {request.specialInstructions && (
                <div>
                  <SectionTitle icon={FileText} title="Special Instructions" />
                  <div className="p-4 bg-yellow-50/30 rounded-xl border border-yellow-100">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium italic">"{request.specialInstructions}"</p>
                  </div>
                </div>
              )}
                  </div>
                </div>
              </div>

              {/* Status Tracker */}
              <StatusTracker />
              
              {/* Approval Chain Tracker */}
              {(isManager || isPOC) && <ApprovalChainTracker />}

              {/* Vendor Messages Section */}
              {request.vendorMessages && request.vendorMessages.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-2xl p-8 border border-purple-200/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <MessageSquare size={16} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Conversation with Vendor</h3>
                  </div>
                  
                  {/* Unified Chat Messages - Shows both vendorMessages and vendorChatMessages */}
                  <div className="max-h-[500px] overflow-y-auto mb-4 space-y-3 bg-white rounded-lg p-4 border border-purple-100">
                    {(() => {
                      // Combine both message arrays and sort by timestamp
                      const allMessages: Array<{
                        type: 'vendor' | 'chat';
                        sender: string;
                        senderName: string;
                        message?: string;
                        attachments?: any[];
                        timestamp: string;
                      }> = [];
                      
                      // Add vendorMessages
                      if (request.vendorMessages) {
                        request.vendorMessages.forEach(msg => {
                          allMessages.push({
                            type: 'vendor',
                            sender: msg.sentBy || '',
                            senderName: msg.sentByName,
                            message: msg.message,
                            attachments: msg.attachments,
                            timestamp: msg.sentAt
                          });
                        });
                      }
                      
                      // Add vendorChatMessages
                      if (request.vendorChatMessages) {
                        request.vendorChatMessages.forEach(msg => {
                          allMessages.push({
                            type: 'chat',
                            sender: msg.sender,
                            senderName: msg.senderName,
                            message: msg.message,
                            timestamp: msg.timestamp
                          });
                        });
                      }
                      
                      // Sort by timestamp
                      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                      
                      if (allMessages.length === 0) {
                        return <p className="text-sm text-slate-400 text-center py-12">No messages yet.</p>;
                      }
                      
                      const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
                      
                      return allMessages.map((msg, idx) => {
                        const isCurrentUser = msg.sender.toLowerCase() === currentUserEmail;
                        const initials = getInitials(msg.senderName);
                        
                        return (
                          <div key={`msg-${idx}`} className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrentUser ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                            }`}>
                              {initials}
                            </div>
                            <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2 rounded-xl text-sm ${
                                isCurrentUser 
                                  ? 'bg-blue-500 text-white rounded-br-sm' 
                                  : 'bg-purple-100 text-purple-900 rounded-bl-sm'
                              }`}>
                                {msg.message && <p className="mb-2 last:mb-0">{msg.message}</p>}
                                
                                {/* Display attachments if present */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {msg.attachments.map((file, fileIdx) => {
                                      const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                      const isPdf = file.fileName.match(/\.pdf$/i);
                                      
                                      return (
                                        <div key={fileIdx} className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                                          {isImage ? (
                                            <div className="relative group cursor-pointer" onClick={() => setPreviewFile({ url: file.fileUrl, name: file.fileName, type: 'image' })}>
                                              <img src={file.fileUrl} alt={file.fileName} className="w-full h-32 object-cover" />
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Download size={24} className="text-white" />
                                              </div>
                                            </div>
                                          ) : isPdf ? (
                                            <div className="w-full h-32 bg-red-50 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setPreviewFile({ url: file.fileUrl, name: file.fileName, type: 'pdf' })}>
                                              <Paperclip size={32} className="text-red-500 mb-1" />
                                              <p className="text-xs text-red-600 font-semibold">PDF</p>
                                            </div>
                                          ) : (
                                            <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => window.open(file.fileUrl, '_blank')}>
                                              <Paperclip size={32} className="text-slate-400 mb-1" />
                                              <p className="text-xs text-slate-600">File</p>
                                            </div>
                                          )}
                                          <div className="p-1.5 bg-slate-50">
                                            <p className="text-xs text-slate-600 truncate" title={file.fileName}>{file.fileName}</p>
                                            <p className="text-xs text-slate-400">by {file.uploadedByName}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDateTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendVendorChat();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendVendorChat}
                      disabled={!chatMessage.trim() || sending}
                      className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Chat & Files */}
          <div className={`${isChatOpen ? 'w-80 h-[800px]' : 'w-12 h-auto self-start'} border-l border-slate-200 bg-slate-50/50 flex flex-col transition-all duration-300 relative flex-shrink-0`}>
            
            {/* Toggle Button */}
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="absolute -left-3 top-6 bg-white border border-slate-200 shadow-sm rounded-full p-1 text-slate-500 hover:text-blue-600 z-50 hover:shadow-md transition-all"
              title={isChatOpen ? "Minimize Chat" : "Expand Chat"}
            >
              {isChatOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

             <div className={`flex flex-col h-full ${isChatOpen ? 'opacity-100' : 'opacity-0 invisible w-0'} transition-all duration-200`}>
             <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <MessageSquare size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Discussion</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium ml-10">Talk with Approvers & Travel Desk</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {(request.chatMessages || []).map((msg, idx) => {
                const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
                const isCurrentUser = msg.sender.toLowerCase() === currentUserEmail;
                const initials = getInitials(msg.senderName);
                
                return (
                  <div key={idx} className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${
                      isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {initials}
                    </div>

                    <div className={`flex flex-col max-w-[85%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 shadow-sm relative text-sm ${
                        isCurrentUser 
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none'
                      }`}>
                        {!isCurrentUser && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Attachments */}
            {(request.fileAttachments && request.fileAttachments.length > 0) && (
              <div className="bg-slate-100/50 border-t border-slate-200 p-2">
                <div className="flex overflow-x-auto gap-2 py-1 px-1 custom-scrollbar">
                  {request.fileAttachments.map((file, idx) => (
                    <a 
                        key={idx}
                        href={file.fileUrl} 
                        download={file.fileName}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm w-40 hover:border-blue-300 transition-colors group text-left"
                      >
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                        <FileText size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{file.fileName}</p>
                        <p className="text-[9px] text-slate-400 truncate">Download</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <div className="flex gap-2 items-end">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Paperclip size={18} />}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
                
                <div className="flex-1 relative">
                  <textarea 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending) handleSendMessage();
                      }
                    }}
                    disabled={sending}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full pl-3 pr-10 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none overflow-hidden"
                    style={{ minHeight: '40px', maxHeight: '100px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={sending || !chatMessage.trim()}
                    className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-0 disabled:transform disabled:scale-90 shadow-md shadow-blue-200"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
            {/* Minimized View */}
            {!isChatOpen && (
              <div className="absolute inset-0 flex flex-col items-center py-6 gap-6 cursor-pointer" onClick={() => setIsChatOpen(true)}>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="rotate-90 whitespace-nowrap text-xs font-bold text-slate-400 tracking-widest uppercase">
                    Discussion
                  </div>
                </div>
                {request.chatMessages && request.chatMessages.length > 0 && (
                  <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md animate-pulse">
                    {request.chatMessages.length}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal />

      {/* File Preview Modal */}
      <FilePreviewModal />
    </div>
  );
};

export default TravelRequestDetailView;
