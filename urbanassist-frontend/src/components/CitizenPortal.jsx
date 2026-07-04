import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Image, Mic, AlertCircle, Loader, Trash2, Play, Pause, Check, UploadCloud } from 'lucide-react';
import { submitReport } from '../api';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in Vite using CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler helper
function MapEventsHandler({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function CitizenPortal({ onReportSubmitted }) {
  const [text, setText] = useState('');
  const [position, setPosition] = useState([17.71, 83.30]); // Default Visakhapatnam location
  const [photo, setPhoto] = useState(false);
  const [voice, setVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Advanced Photo Upload States
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Advanced Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);
  
  const recordingIntervalRef = useRef(null);
  const playbackIntervalRef = useRef(null);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Mock Photo Upload Function
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoProgress(0);

    const interval = setInterval(() => {
      setPhotoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadingPhoto(false);
          setPhotoFile(file);
          setPhotoPreviewUrl(URL.createObjectURL(file));
          setPhoto(true);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl('');
    setPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mock Audio Recording Functions
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setRecordedAudio(null);
    setVoice(false);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setRecordedAudio({
      name: `Voice_Note_${new Date().toLocaleTimeString().replace(/ /g, '_')}.mp3`,
      duration: recordingSeconds
    });
    setVoice(true);
  };

  const deleteVoiceNote = () => {
    setRecordedAudio(null);
    setVoice(false);
    setIsPlayingAudio(false);
    setAudioPlaybackProgress(0);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  const toggleAudioPlayback = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    } else {
      setIsPlayingAudio(true);
      setAudioPlaybackProgress(0);
      const totalSteps = recordedAudio.duration * 10; // updates 10 times a sec for smooth motion
      let currentStep = 0;
      
      playbackIntervalRef.current = setInterval(() => {
        currentStep += 1;
        setAudioPlaybackProgress((currentStep / totalSteps) * 100);
        if (currentStep >= totalSteps) {
          clearInterval(playbackIntervalRef.current);
          setIsPlayingAudio(false);
          setAudioPlaybackProgress(100);
        }
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please describe your grievance first.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await submitReport(text, position[0], position[1], photo, voice);
      onReportSubmitted(data);
    } catch (err) {
      setError(err.message || 'Error contacting server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px 40px 20px',
      display: 'grid',
      gridTemplateColumns: 'minmax(350px, 450px) 1fr',
      gap: '30px'
    }}>
      {/* Left Column: Form */}
      <div className="premium-card" style={{ padding: '30px', height: 'fit-content' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Lodge Civic Grievance
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          File a complaint and our AI will automatically classify, cluster, and dispatch it to the correct department.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Description Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Describe the Incident
              </label>
              <span style={{ fontSize: '11px', color: text.length > 300 ? 'var(--color-critical)' : 'var(--text-muted)' }}>
                {text.length} chars
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Severe water leaking from a broken street pipe, causing flooding on the road..."
              className="premium-input"
              style={{
                width: '100%',
                height: '140px',
                padding: '12px',
                fontSize: '14px',
                resize: 'none',
              }}
            />
          </div>

          {/* Form Attachments Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Grievance Attachments
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Photo Upload Zone */}
              <div className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.01)' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                
                {!photoFile && !uploadingPhoto && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '10px 0'
                    }}
                  >
                    <UploadCloud size={24} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Attach Photo (JPEG/PNG)
                    </span>
                  </div>
                )}

                {uploadingPhoto && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '5px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Uploading photo...
                      </span>
                      <span>{photoProgress}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${photoProgress}%`, background: 'var(--accent-gradient)', transition: 'width 0.1s ease' }}></div>
                    </div>
                  </div>
                )}

                {photoFile && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={photoPreviewUrl} 
                        alt="Preview" 
                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-glass)' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {photoFile.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {(photoFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{
                        padding: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-critical)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Voice Note Module */}
              <div className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.01)' }}>
                {!isRecording && !recordedAudio && (
                  <div 
                    onClick={startRecording}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '10px 0'
                    }}
                  >
                    <Mic size={24} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Record Audio Statement
                    </span>
                  </div>
                )}

                {isRecording && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--color-critical)',
                        animation: 'pulseGreen 1.2s infinite ease-in-out'
                      }}></span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-critical)' }}>
                        Recording: {formatTime(recordingSeconds)}
                      </span>
                    </div>
                    
                    {/* Pulsing visualizer waveforms */}
                    <div className="waveform-container">
                      <div className="waveform-bar animated"></div>
                      <div className="waveform-bar animated"></div>
                      <div className="waveform-bar animated"></div>
                      <div className="waveform-bar animated"></div>
                      <div className="waveform-bar animated"></div>
                      <div className="waveform-bar animated"></div>
                    </div>

                    <button
                      type="button"
                      onClick={stopRecording}
                      style={{
                        background: 'var(--color-critical)',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      Stop
                    </button>
                  </div>
                )}

                {recordedAudio && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                      <button
                        type="button"
                        onClick={toggleAudioPlayback}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--accent-gradient)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {isPlayingAudio ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                      </button>
                      
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recordedAudio.name}</span>
                          <span>{formatTime(recordedAudio.duration)}</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${audioPlaybackProgress}%`, background: 'var(--accent-color)', transition: isPlayingAudio ? 'width 0.1s linear' : 'none' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={deleteVoiceNote}
                      style={{
                        padding: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-critical)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginLeft: '5px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Location Coordinate Panel */}
          <div className="glass-panel" style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            <div style={{ padding: '8px', borderRadius: '50%', background: 'var(--accent-glow)' }}>
              <MapPin size={18} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coordinates selected</div>
              <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#fff' }}>
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
              </strong>
            </div>
          </div>

          {/* Error alerts */}
          {error && (
            <div className="glass-panel" style={{
              display: 'flex',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--color-critical)',
              fontSize: '13px',
              alignItems: 'center'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-glow-pulse"
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              width: '100%'
            }}
          >
            {loading ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                AI Diagnostics Running...
              </>
            ) : (
              'Submit Grievance'
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Map Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pinpoint Location on Map
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click anywhere on the map to set coordinate pin
          </span>
        </div>
        
        <div className="glass-panel" style={{ padding: '5px', height: '100%', overflow: 'hidden' }}>
          <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: '495px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-map-tiles"
            />
            <MapEventsHandler setPosition={setPosition} />
            <Marker position={position} />
          </MapContainer>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}