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
        <div className="w-24 h-24 rounded-2xl border-2 border-sky-200 bg-white shadow-sm hover:shadow-xl hover:border-sky-400 transition-all duration-300 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <FileText size={36} className="text-slate-400" />
          )}
        </div>
        <button
          onClick={() => removeFile(index)}
          className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
        >
          <X size={16} />
        </button>
        <p className="text-xs text-slate-700 font-semibold mt-2 truncate w-24">{file.name}</p>
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPreviewFile(null)}>
        <div className="relative glass-card bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border-2 border-slate-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-t-3xl">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl shadow-lg ${
                previewFile.type === 'pdf' 
                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
              }`}>
                {previewFile.type === 'pdf' ? (
                  <FileText size={28} className="text-white" />
                ) : (
                  <ImageIcon size={28} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">{previewFile.name}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">{previewFile.type === 'pdf' ? 'PDF Document' : 'Image'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="btn-premium px-5 py-3 bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-2xl hover:from-sky-700 hover:to-teal-700 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-xl font-bold"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100/50">
            {previewFile.type === 'image' ? (
              <div className="flex items-center justify-center">
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name} 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-2 border-slate-200"
                />
              </div>
            ) : (
              <iframe
                src={previewFile.url}
                className="w-full h-full min-h-[600px] rounded-2xl border-2 border-slate-200 bg-white shadow-xl"
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
        className="flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-2xl mb-6 group font-bold shadow-sm hover:shadow-lg transition-all duration-300"
      >
        <ArrowLeft size={22} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="glass-card bg-gradient-to-br from-sky-500 via-sky-600 to-teal-600 rounded-3xl p-8 mb-6 shadow-2xl shadow-sky-500/30 border-2 border-sky-400/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{request.uniqueId}</h1>
            <p className="text-base text-sky-50 font-semibold">{request.purpose}</p>
          </div>
          <div className="text-right">
            <div className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/30 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Status</p>
              <p className="text-base font-black mt-1">{request.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form (Read-Only) */}
      <div className="glass-card bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200/60 shadow-xl p-8 mb-6">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-sky-600 to-teal-600 rounded-full"></div>
          Travel Request Details
        </h2>
        
        {/* Travel Information */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Trip Nature</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-sky-50 to-teal-50 rounded-2xl text-sm text-slate-800 font-semibold border-2 border-sky-100">
              {request.tripNature}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Travel Mode</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-purple-100">
              {getModeIcon(request.mode)}
              {request.mode}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">From</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-emerald-100">
              <MapPin size={18} className="text-emerald-600" />
              {request.origin}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">To</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-rose-100">
              <MapPin size={18} className="text-rose-600" />
              {request.destination}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Departure Date</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-indigo-100">
              <Calendar size={18} className="text-indigo-600" />
              {formatDate(request.travelDate)}
            </div>
          </div>
          {request.returnDate && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Return Date</label>
              <div className="px-4 py-3.5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-amber-100">
                <Calendar size={18} className="text-amber-600" />
                {formatDate(request.returnDate)}
              </div>
            </div>
          )}
          {request.departureTimeSlot && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Preferred Time Slot</label>
              <div className="px-4 py-3.5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl text-sm text-slate-800 font-semibold border-2 border-violet-100">
                {request.departureTimeSlot}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Travel Class</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl text-sm text-slate-800 font-semibold border-2 border-cyan-100">
              {request.travelClass}
            </div>
          </div>
        </div>

        {/* Passenger Information */}
        <h3 className="text-lg font-black text-slate-800 mb-5 mt-10 flex items-center gap-3">
          <div className="w-1.5 h-7 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
          Passenger Information
        </h3>
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Passenger Name</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-blue-100">
              <User size={18} className="text-blue-600" />
              {request.passengerName}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Phone Number</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-green-100">
              <Phone size={18} className="text-green-600" />
              {request.passengerPhone}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Dietary Preference</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-orange-100">
              <Utensils size={18} className="text-orange-600" />
              {request.dietaryPreference}
            </div>
          </div>
        </div>

        {/* Accommodation */}
        {request.accommodationRequired && (
          <>
            <h3 className="text-lg font-black text-slate-800 mb-5 mt-10 flex items-center gap-3">
              <div className="w-1.5 h-7 bg-gradient-to-b from-pink-600 to-rose-600 rounded-full"></div>
              Accommodation Details
            </h3>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Hotel Preference</label>
                <div className="px-4 py-3.5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-pink-100">
                  <Hotel size={18} className="text-pink-600" />
                  {request.hotelPreference || 'No preference'}
                </div>
              </div>
              {request.checkInDate && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Check-in Date</label>
                  <div className="px-4 py-3.5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-teal-100">
                    <Calendar size={18} className="text-teal-600" />
                    {formatDate(request.checkInDate)}
                  </div>
                </div>
              )}
              {request.checkOutDate && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Check-out Date</label>
                  <div className="px-4 py-3.5 bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl text-sm text-slate-800 font-semibold flex items-center gap-3 border-2 border-lime-100">
                    <Calendar size={18} className="text-lime-600" />
                    {formatDate(request.checkOutDate)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Special Instructions */}
        {request.specialInstructions && (
          <div className="mt-8">
            <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">Special Instructions</label>
            <div className="px-4 py-3.5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl text-sm text-slate-800 font-medium border-2 border-slate-200 leading-relaxed">
              {request.specialInstructions}
            </div>
          </div>
        )}
      </div>

      {/* Unified Chat Section */}
      <div className="glass-card bg-gradient-to-br from-sky-50 via-white to-purple-50/40 rounded-3xl border-2 border-sky-200/60 shadow-xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-sky-500 to-purple-600 text-white rounded-2xl shadow-lg">
            <MessageSquare size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Conversation with Customer</h2>
        </div>
        
        {/* Chat Messages - Combined vendorMessages and vendorChatMessages */}
        <div className="max-h-[500px] overflow-y-auto mb-6 space-y-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-sky-100 shadow-inner">
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
              return <p className="text-sm text-slate-400 text-center py-16 font-semibold">No messages yet. Start the conversation!</p>;
            }
            
            const currentUserEmail = localStorage.getItem('userEmail')?.toLowerCase() || '';
            
            return allMessages.map((msg, idx) => {
              const isCurrentUser = msg.sender.toLowerCase() === currentUserEmail;
              const initials = getInitials(msg.senderName);
              
              return (
                <div key={`msg-${idx}`} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg ${
                    isCurrentUser ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                  }`}>
                    {initials}
                  </div>
                  <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium shadow-md ${
                      isCurrentUser 
                        ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.message && <p className="mb-0 last:mb-0 leading-relaxed">{msg.message}</p>}
                      
                      {/* Display attachments if present */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {msg.attachments.map((file, fileIdx) => {
                            const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                            const isPdf = file.fileName.match(/\.pdf$/i);
                            
                            return (
                              <div key={fileIdx} className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-sky-300 transition-all duration-300 bg-white">
                                {isImage ? (
                                  <div className="relative group cursor-pointer" onClick={() => setPreviewFile({ url: file.fileUrl, name: file.fileName, type: 'image' })}>
                                    <img src={file.fileUrl} alt={file.fileName} className="w-full h-36 object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon size={28} className="text-white" />
                                    </div>
                                  </div>
                                ) : isPdf ? (
                                  <div className="w-full h-36 bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center cursor-pointer hover:from-red-100 hover:to-red-200 transition-colors" onClick={() => setPreviewFile({ url: file.fileUrl, name: file.fileName, type: 'pdf' })}>
                                    <FileText size={36} className="text-red-500 mb-2" />
                                    <p className="text-xs text-red-600 font-bold">PDF Document</p>
                                  </div>
                                ) : (
                                  <div className="w-full h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-colors" onClick={() => window.open(file.fileUrl, '_blank')}>
                                    <FileText size={36} className="text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-600 font-bold">Document</p>
                                  </div>
                                )}
                                <div className="p-2 bg-slate-50 border-t-2 border-slate-200">
                                  <p className="text-xs text-slate-700 truncate font-semibold" title={file.fileName}>{file.fileName}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
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
          <div className="mb-5">
            <label className="text-sm font-bold text-slate-700 mb-3 block">Attached Files</label>
            <div className="flex gap-4 flex-wrap">
              {selectedFiles.map((file, index) => renderFilePreview(file, index))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <div className="flex flex-col gap-4">
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
            rows={3}
            className="w-full px-5 py-4 text-sm font-medium border-2 border-sky-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 resize-none bg-white/90 backdrop-blur-sm placeholder:text-slate-400 transition-all"
          />
          
          <div className="flex gap-3">
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
              className="btn-premium px-6 py-3.5 border-2 border-sky-300 text-sky-700 bg-white rounded-2xl hover:bg-sky-50 hover:border-sky-400 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 font-bold shadow-sm hover:shadow-lg"
            >
              <Paperclip size={20} />
              Attach Files
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || (!message.trim() && selectedFiles.length === 0)}
              className="btn-premium flex-1 px-8 py-3.5 bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 text-white rounded-2xl hover:from-sky-700 hover:via-sky-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40"
            >
              {sending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
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
