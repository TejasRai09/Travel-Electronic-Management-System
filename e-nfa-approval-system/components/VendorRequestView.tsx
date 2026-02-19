import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plane,
  Train,
  Car,
  Hotel,
  User,
  Phone,
  Utensils,
  Paperclip,
  Send,
  Loader2,
  FileText,
  Image as ImageIcon,
  X,
  MessageSquare,
  Download
} from 'lucide-react';
import { TravelRequest, TravelMode, TripNature, DietaryPreference, VendorMessage } from '../types';

interface VendorRequestViewProps {
  request: TravelRequest;
  onBack: () => void;
}

const VendorRequestView: React.FC<VendorRequestViewProps> = ({ request: initialRequest, onBack }) => {
  const [request, setRequest] = useState<TravelRequest>(initialRequest);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
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

  const getModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case TravelMode.FLIGHT: return <Plane size={20} />;
      case TravelMode.TRAIN: return <Train size={20} />;
      case TravelMode.CAR: return <Car size={20} />;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) return;

      // Upload files first
      const uploadedAttachments = [];
      for (const file of selectedFiles) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        uploadedAttachments.push({
          fileName: file.name,
          fileUrl: fileData,
          uploadedBy: localStorage.getItem('userEmail') || '',
          uploadedByName: localStorage.getItem('userName') || 'Vendor',
          uploadedAt: new Date().toISOString()
        });
      }

      // Send vendor message
      const res = await fetch(`/api/vendor/requests/${request.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message.trim(),
          attachments: uploadedAttachments
        })
      });

      const data = await res.json();
      if (data.ok) {
        setRequest(prev => ({
          ...prev,
          vendorMessages: data.vendorMessages || []
        }));
        setMessage('');
        setSelectedFiles([]);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending vendor message:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderFilePreview = (file: File, index: number) => {
    const isImage = file.type.startsWith('image/');
    return (
      <div key={index} className="relative group">
        <div className="w-20 h-20 rounded-lg border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <FileText size={32} className="text-slate-400" />
          )}
        </div>
        <button
          onClick={() => removeFile(index)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
        <p className="text-xs text-slate-600 mt-1 truncate w-20">{file.name}</p>
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
                <ImageIcon size={24} className="text-purple-500" />
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

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 px-4 pt-6">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 mb-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white mb-1">{request.uniqueId}</h1>
            <p className="text-sm text-blue-100">{request.purpose}</p>
          </div>
          <div className="text-right">
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white">
              <p className="text-xs">Status</p>
              <p className="text-sm font-bold">{request.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form (Read-Only) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Travel Request Details</h2>
        
        {/* Travel Information */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Trip Nature</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800">
              {request.tripNature}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Travel Mode</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              {getModeIcon(request.mode)}
              {request.mode}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <MapPin size={16} />
              {request.origin}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <MapPin size={16} />
              {request.destination}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Departure Date</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <Calendar size={16} />
              {formatDate(request.travelDate)}
            </div>
          </div>
          {request.returnDate && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Return Date</label>
              <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(request.returnDate)}
              </div>
            </div>
          )}
          {request.departureTimeSlot && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Preferred Time Slot</label>
              <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800">
                {request.departureTimeSlot}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Travel Class</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800">
              {request.travelClass}
            </div>
          </div>
        </div>

        {/* Passenger Information */}
        <h3 className="text-sm font-bold text-slate-800 mb-4 mt-8">Passenger Information</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Passenger Name</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <User size={16} />
              {request.passengerName}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone Number</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <Phone size={16} />
              {request.passengerPhone}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Dietary Preference</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
              <Utensils size={16} />
              {request.dietaryPreference}
            </div>
          </div>
        </div>

        {/* Accommodation */}
        {request.accommodationRequired && (
          <>
            <h3 className="text-sm font-bold text-slate-800 mb-4 mt-8">Accommodation Details</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Hotel Preference</label>
                <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
                  <Hotel size={16} />
                  {request.hotelPreference || 'No preference'}
                </div>
              </div>
              {request.checkInDate && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check-in Date</label>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(request.checkInDate)}
                  </div>
                </div>
              )}
              {request.checkOutDate && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check-out Date</label>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(request.checkOutDate)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Special Instructions */}
        {request.specialInstructions && (
          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Special Instructions</label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800">
              {request.specialInstructions}
            </div>
          </div>
        )}
      </div>

      {/* Unified Chat Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50/30 rounded-xl border border-blue-200 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-blue-600" />
          <h2 className="text-base font-bold text-slate-800">Conversation with Customer</h2>
        </div>
        
        {/* Chat Messages - Combined vendorMessages and vendorChatMessages */}
        <div className="max-h-[500px] overflow-y-auto mb-4 space-y-3 bg-white rounded-lg p-4 border border-blue-100">
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
              return <p className="text-sm text-slate-400 text-center py-12">No messages yet. Start the conversation!</p>;
            }
            
            const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
            
            return allMessages.map((msg, idx) => {
              const isCurrentUser = msg.sender.toLowerCase() === currentUserEmail;
              const initials = getInitials(msg.senderName);
              
              return (
                <div key={`msg-${idx}`} className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrentUser ? 'bg-blue-600 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {initials}
                  </div>
                  <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-xl text-sm ${
                      isCurrentUser 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
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
                                      <ImageIcon size={24} className="text-white" />
                                    </div>
                                  </div>
                                ) : isPdf ? (
                                  <div className="w-full h-32 bg-red-50 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setPreviewFile({ url: file.fileUrl, name: file.fileName, type: 'pdf' })}>
                                    <FileText size={32} className="text-red-500 mb-1" />
                                    <p className="text-xs text-red-600 font-semibold">PDF</p>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => window.open(file.fileUrl, '_blank')}>
                                    <FileText size={32} className="text-slate-400 mb-1" />
                                    <p className="text-xs text-slate-600">File</p>
                                  </div>
                                )}
                                <div className="p-1.5 bg-slate-50">
                                  <p className="text-xs text-slate-600 truncate" title={file.fileName}>{file.fileName}</p>
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
        
        {/* File Attachments Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <label className="text-sm font-semibold text-slate-600 mb-2 block">Attached Files</label>
            <div className="flex gap-3 flex-wrap">
              {selectedFiles.map((file, index) => renderFilePreview(file, index))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <div className="flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            rows={2}
            className="w-full px-4 py-3 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Paperclip size={18} />
              Attach
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || (!message.trim() && selectedFiles.length === 0)}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal />
    </div>
  );
};

export default VendorRequestView;
