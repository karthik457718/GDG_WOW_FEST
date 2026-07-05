import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Image, Mic, AlertCircle, Loader, Trash2, Play, Pause, Check, UploadCloud, ChevronDown } from 'lucide-react';
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

// Government Certificate Hub Details — 16 Real-World Govt Services
const CERTIFICATE_DATA = {
  birth: {
    title: "Birth Certificate",
    dept: "Civil Registration Department",
    fee: "₹50 (Standard) / ₹100 (Urgent)",
    sla: "7-10 Days",
    online: "https://crsorgi.gov.in",
    office: "Municipal Ward Office / MeeSeva / Common Service Centre",
    description: "Official certificate verifying birth of a child. Required for school admissions, passport applications, Aadhaar enrollment, and as primary identity proof.",
    steps: [
      "Visit the Ward Registrar or download Application Form-1 from the portal.",
      "Get the form attested by a Gazetted Officer or local Ward Councilor.",
      "Attach the Hospital Discharge Slip / Birth Report issued by the clinic.",
      "Submit the package at the Ward Registrar counter in person.",
      "Pay the ₹50 registration fee and collect the acknowledgement receipt.",
      "Wait for SMS/email confirmation (usually 7 days), then collect printed certificate."
    ],
    documents: [
      "Hospital Birth Discharge Slip / Birth Record",
      "Attested Aadhaar Card copies of both Parents",
      "Marriage Certificate of Parents (if available)",
      "Affidavit from Notary (required if registration delayed >1 year)",
      "Current Address Proof (Utility Bill / Rent Agreement)"
    ]
  },
  death: {
    title: "Death Certificate",
    dept: "Civil Registration Department",
    fee: "Free (within 21 days) / ₹50 (delayed)",
    sla: "5-7 Days",
    online: "https://crsorgi.gov.in",
    office: "Local Municipal Corporation Ward Office / Citizen Service Center",
    description: "Official document stating the cause, date, and place of death. Required for insurance claims, family pensions, property mutations, and asset transfers.",
    steps: [
      "Obtain Application Form-2 (Death Registration Form) from the ward office.",
      "Attach the Medical Certificate of Cause of Death from the hospital.",
      "Attach the deceased's original Aadhaar or Voter ID Card.",
      "Submit at the Ward Registrar counter within 21 days for free registration.",
      "Verify all spelling entries before final submission — corrections require affidavit.",
      "Collect the printed certificate from the municipal center."
    ],
    documents: [
      "Medical Certificate of Cause of Death (from Hospital)",
      "Crematorium / Burial Ground Receipt",
      "Identity Proof of Deceased (Aadhaar / Voter ID)",
      "Identity Proof of Applicant (Relative's Aadhaar)",
      "Affidavit (For registrations delayed by more than 30 days)"
    ]
  },
  marriage: {
    title: "Marriage Certificate",
    dept: "Sub-Registrar Office",
    fee: "₹100 (Hindu Marriage Act) / ₹150 (Special Marriage Act)",
    sla: "15 Days",
    online: "https://igrs.ap.gov.in",
    office: "Sub-Registrar Office under whose jurisdiction either bride or groom resides",
    description: "Official legal proof of marriage. Crucial for joint bank accounts, family visas, passport name change, and legal protection for both spouses.",
    steps: [
      "Obtain Joint Marriage Registration Application Form from Sub-Registrar office.",
      "Both parties sign — Groom (Age 21+) and Bride (Age 18+).",
      "Attach age proof, address proof, and 3 joint wedding photographs.",
      "Affix the wedding invitation card or temple/church ceremony receipt.",
      "Appear before Sub-Registrar on scheduled date with three witnesses.",
      "Witnesses carry original ID proofs and sign the marriage register."
    ],
    documents: [
      "Joint Application Form (Signed by both bride and groom)",
      "Age Proof of Groom (21+) & Bride (18+): Birth Certificate or 10th Class Certificate",
      "Address Proof (Passport / Aadhaar / Voter ID)",
      "Joint Wedding Photograph (3 copies, passport size)",
      "Wedding Card / Temple Receipt / Priest Declaration",
      "ID Proof of 3 Witnesses (Aadhaar/Voter ID)"
    ]
  },
  income: {
    title: "Income Certificate",
    dept: "Revenue / Tahsildar Office",
    fee: "₹30–₹60",
    sla: "3-7 Days",
    online: "https://edistrict.ap.gov.in",
    office: "Tahsildar Office / Meeseva / eSeva Center / Gram Panchayat",
    description: "Certificate verifying annual income of a family. Required for scholarships, fee concessions, government housing schemes, ration card applications, and EWS reservations.",
    steps: [
      "Apply online via e-District portal or visit Meeseva/Gram Panchayat office.",
      "Fill Form-B with head of family details and all earning members' income.",
      "Provide salary slips or income proof and supporting documents.",
      "Tahsildar officer may conduct a field enquiry for rural applicants.",
      "Certificate issued digitally — download from e-District portal with digital signature."
    ],
    documents: [
      "Application Form (From Meeseva / e-District portal)",
      "Aadhaar Card of Applicant",
      "Latest Salary Slip (salaried) / Land Revenue Receipt (farmers)",
      "Ration Card / Family Card Copy",
      "Self-Declaration Affidavit of Annual Income",
      "Passport-size photograph (2 copies)"
    ]
  },
  caste: {
    title: "Caste / Community Certificate",
    dept: "Revenue / Tahsildar Office",
    fee: "₹30–₹50",
    sla: "7-15 Days",
    online: "https://edistrict.ap.gov.in",
    office: "Tahsildar / Revenue Divisional Officer (for OBC/SC/ST)",
    description: "Certificate verifying an applicant's SC, ST, OBC, or BC community. Required for reservation benefits in education, government jobs, and government welfare schemes.",
    steps: [
      "Apply via e-District portal or visit Meeseva/Tahsildar office.",
      "Submit caste proof documents and parents' caste certificates if available.",
      "Revenue Inspector (RI) conducts field enquiry to verify the claim.",
      "Mandal Revenue Officer (MRO) verifies and recommends to Tahsildar.",
      "Tahsildar digitally signs and issues the certificate.",
      "Download digitally signed certificate from e-District portal."
    ],
    documents: [
      "Application Form (e-District / Meeseva)",
      "Aadhaar Card",
      "Ration Card / Family Card",
      "Parent's Caste Certificate (if available)",
      "School Certificate mentioning community column",
      "Self-Declaration Affidavit",
      "Passport-size photograph (2 copies)"
    ]
  },
  domicile: {
    title: "Residence / Domicile Certificate",
    dept: "Revenue / Tahsildar Office",
    fee: "₹30",
    sla: "5-7 Days",
    online: "https://edistrict.ap.gov.in",
    office: "Tahsildar Office / Meeseva / Municipal Office",
    description: "Certificate verifying that an applicant is a resident of a specific state/district. Required for state-quota admissions, local government jobs, and welfare scheme eligibility.",
    steps: [
      "Apply via e-District portal or Meeseva center.",
      "Provide proof of residence for a minimum of 3–5 years.",
      "Revenue official may call for a field enquiry.",
      "Tahsildar issues the digitally signed certificate after verification.",
      "Download from e-District portal."
    ],
    documents: [
      "Application Form",
      "Aadhaar Card with local address",
      "Ration Card / Voter ID with local address",
      "Proof of continuous residence (electricity/water bill for 3+ years)",
      "Affidavit on stamp paper",
      "School Certificate (if applicable)"
    ]
  },
  property: {
    title: "Property Mutation",
    dept: "Revenue & Tax Assessment Dept",
    fee: "₹200 + 0.1%–0.5% of property value",
    sla: "30-45 Days",
    online: "https://meeseva.telangana.gov.in",
    office: "Revenue Office / Municipal Corporation Tax Assessment Dept",
    description: "Transfer of property title in municipal records from seller to buyer. Critical for property tax billing, utility connections in your name, and legal ownership establishment.",
    steps: [
      "Prepare Mutation Application Form (Form A) from Revenue department.",
      "Attach certified copy of the registered Sale Deed in your name.",
      "Attach the latest Property Tax Receipt (zero outstanding dues).",
      "Obtain a Non-Encumbrance Certificate (EC) for the last 13 years.",
      "Submit documents at Revenue Counter or Revenue Inspector's office.",
      "Await physical inspection of property boundaries by Revenue officer.",
      "Mutation Certificate issued once no objections arise during notice period."
    ],
    documents: [
      "Certified copy of Registered Sale Deed / Gift Deed / Will",
      "Latest Property Tax Receipt (No Dues Certificate)",
      "Non-Encumbrance Certificate (EC) for 13 years",
      "Affidavit of Consent / Indemnity Bond on Stamp Paper",
      "Aadhaar Card of the Applicant",
      "Patta / Khata copy of previous owner"
    ]
  },
  driving: {
    title: "Driving Licence (New / Renewal)",
    dept: "Transport Department (RTO)",
    fee: "₹200 (Learner) / ₹500 (Permanent) / ₹300 (Renewal)",
    sla: "Learner: Same Day | Permanent: 30 Days",
    online: "https://parivahan.gov.in",
    office: "Regional Transport Office (RTO) of your district",
    description: "Licence authorizing an individual to drive motor vehicles on public roads. Required for identity verification, vehicle insurance claims, and operating any motor vehicle legally.",
    steps: [
      "Apply for Learner's Licence (LL) online at parivahan.gov.in or sarathi.parivahan.gov.in.",
      "Book and appear for computer-based learner licence test at RTO.",
      "After 30 days with Learner Licence, apply for Permanent Driving Licence.",
      "Appear for practical driving test at RTO with your vehicle.",
      "Biometric (photo + fingerprint) taken at RTO on the day of the driving test.",
      "Smart Card DL delivered by post within 30 days, or collect from RTO."
    ],
    documents: [
      "Proof of Age: Birth Certificate / 10th Class Certificate",
      "Proof of Address: Aadhaar / Voter ID / Passport",
      "Passport-size photographs (6 copies)",
      "Medical Certificate (Form-1A) from a registered doctor",
      "Learner's Licence copy (for permanent DL application)",
      "Existing DL copy (for renewal applications)"
    ]
  },
  ration: {
    title: "Ration Card (New / Modification)",
    dept: "Food, Civil Supplies & Consumer Affairs Dept",
    fee: "Free",
    sla: "15-30 Days",
    online: "https://epds.ap.gov.in",
    office: "Mandal / Tahsildar Office or District Supply Office",
    description: "Government card entitling a family to subsidized food grains through the Public Distribution System (PDS). Also widely accepted as address proof for government services.",
    steps: [
      "Download application from epds.ap.gov.in or collect from Mandal office.",
      "Fill Form-1 (New Connection) or Form-5 (Modifications for address/member).",
      "Submit with all documents at the Mandal / Tahsildar office.",
      "Civil Supply Inspector conducts field enquiry at your address.",
      "Verification data sent to District Supply Officer (DSO) for approval.",
      "Ration Card issued and linked to biometrics. Collect or download from portal."
    ],
    documents: [
      "Application Form-1 / Form-5",
      "Aadhaar Card of all family members",
      "Proof of existing address (Electricity bill / Rent agreement)",
      "Deletion Certificate (if transferring from another district/state)",
      "Self-declaration that no existing ration card exists",
      "Passport-size photographs (head of family)"
    ]
  },
  trade: {
    title: "Trade Licence (Business / Shop)",
    dept: "Municipal Corporation / Gram Panchayat",
    fee: "₹500–₹5,000 (based on trade type & area)",
    sla: "15-30 Days",
    online: "https://www.mchyderabad.gov.in (varies by city)",
    office: "Ward Office / Health Inspector / Municipal Corporation HQ",
    description: "Mandatory licence from local municipal authority to run any commercial establishment or shop. Required for GST registration, bank account opening, and regulatory compliance.",
    steps: [
      "Apply at the Ward Office or via municipality's online portal.",
      "Submit application with proof of business premises.",
      "Health Inspector visits premises for physical inspection and sanitation check.",
      "Fire NOC and Pollution NOC obtained (for applicable trade categories).",
      "Licence issued after approval — must be renewed every year in April.",
      "Display the licence prominently at the business premises."
    ],
    documents: [
      "Application Form (from Ward Office)",
      "Proof of ownership / Rental Agreement for premises",
      "Aadhaar Card and PAN Card of Proprietor",
      "Passport-size photographs (2 copies)",
      "GST Registration Certificate (if applicable)",
      "NOC from Fire Department (for hazardous trades)",
      "Property Tax Receipt (No Dues)"
    ]
  },
  building: {
    title: "Building Plan Approval",
    dept: "Town Planning / Municipal Corporation",
    fee: "₹10–₹50 per sq.ft of built-up area",
    sla: "30-60 Days",
    online: "https://obps.ap.gov.in",
    office: "DTCP Office / Municipal Corporation Town Planning Section",
    description: "Mandatory approval for any new construction, extension, or renovation. Required before foundation laying. Ensures compliance with building bylaws, fire safety, and setback norms.",
    steps: [
      "Hire a licensed architect/engineer to prepare building plans.",
      "Apply online via OBPS (Online Building Permission System) portal.",
      "Pay the scrutiny fee based on built-up area.",
      "Town Planning Section reviews plans against zoning and setback norms.",
      "Site inspection by Town Planning Inspector.",
      "Building Permit issued after all clearances — valid for 3-5 years."
    ],
    documents: [
      "Site Plan (drawn to scale by licensed architect/engineer)",
      "Structural Safety Certificate from licensed structural engineer",
      "Ownership Proof (Patta / Sale Deed / Mutation Certificate)",
      "NOC from neighbors (for abutting constructions)",
      "Aadhaar and PAN of applicant",
      "Latest Property Tax Receipt",
      "Soil Test Report (for G+2 and above)"
    ]
  },
  pension: {
    title: "Old Age / Widow / Disability Pension",
    dept: "Department of Social Welfare",
    fee: "Free",
    sla: "30-45 Days",
    online: "https://dbt.ap.gov.in",
    office: "Ward Secretariat / Village Secretariat / MPDO Office / Tahsildar",
    description: "Monthly financial assistance for elderly citizens (60+), widows, and persons with disabilities. Amount: ₹2,250–₹3,500/month depending on category and state, paid directly to bank account.",
    steps: [
      "Apply at the nearest Ward/Village Secretariat or Meeseva center.",
      "Fill the Pension Application Form with relevant beneficiary category.",
      "District Social Welfare Officer verifies eligibility criteria.",
      "For disability pension: obtain Disability Certificate from Medical Board.",
      "Bank account (DBT-enabled, preferably Jan Dhan) is mandatory for disbursal.",
      "Pension disbursed directly to bank account monthly after approval."
    ],
    documents: [
      "Application Form",
      "Aadhaar Card",
      "Age Proof (Birth Certificate / Voter ID for elderly)",
      "Death Certificate of husband (for widow pension)",
      "Disability Certificate from Government Medical Board (disability pension)",
      "Bank Passbook (DBT-enabled account)",
      "Ration Card / Family Card",
      "Income Certificate (below ₹1.5 lakh per annum)"
    ]
  },
  health: {
    title: "Ayushman Bharat / PM-JAY Health Card",
    dept: "National Health Authority / State Health Agency",
    fee: "Free",
    sla: "Instant to 3 Days",
    online: "https://healthid.ndhm.gov.in | https://pmjay.gov.in",
    office: "Ayushman Bharat Arogya Kendras / Common Service Centre / District Hospital",
    description: "Ayushman Bharat Health Account (ABHA) — unique 14-digit health ID linking all medical records. PM-JAY covers ₹5 lakh per family per year cashless at 25,000+ empanelled hospitals.",
    steps: [
      "Create ABHA ID online at healthid.ndhm.gov.in using Aadhaar or mobile number.",
      "Check PM-JAY eligibility at pmjay.gov.in using Aadhaar number.",
      "If eligible, visit nearest Ayushman Mitra at any empanelled hospital.",
      "Biometric verification using Aadhaar done at the hospital helpdesk.",
      "Ayushman Gold Card issued — valid for cashless treatment.",
      "Download ABHA card from NDHM portal any time."
    ],
    documents: [
      "Aadhaar Card (mandatory for ABHA creation)",
      "Ration Card (for PM-JAY eligibility verification)",
      "Mobile number (linked to Aadhaar preferred)",
      "Passport-size photograph (for Gold Card printing)"
    ]
  },
  scholarship: {
    title: "Government Scholarship",
    dept: "Education / Welfare Dept / NIC",
    fee: "Free",
    sla: "30-90 Days (Academic Year cycle)",
    online: "https://scholarships.gov.in | https://nsp.gov.in",
    office: "District Education Office / College / School / Welfare Office",
    description: "Government scholarships for SC/ST/OBC/EBC/Minority students and merit-based scholarships. Covers tuition fees, maintenance allowance, and book grants via direct bank transfer.",
    steps: [
      "Register on National Scholarship Portal (NSP) at scholarships.gov.in.",
      "Select the appropriate scholarship scheme based on category and course level.",
      "Fill the application form and upload all required documents.",
      "Application verified and approved by your institution (school/college).",
      "District Education Officer / Welfare Officer approves at second level.",
      "Amount directly credited to student's bank account. Track status on NSP portal."
    ],
    documents: [
      "Aadhaar Card",
      "Caste Certificate (SC/ST/OBC as applicable)",
      "Income Certificate (family income below threshold)",
      "Previous Academic Mark Sheets (last qualifying exam)",
      "Admission / Bonafide Certificate from current institution",
      "Bank Account Passbook (student's name, Aadhaar-linked)",
      "Passport-size photograph"
    ]
  },
  landrecord: {
    title: "Land Record / Pahani / Patta",
    dept: "Revenue Department / CCLA",
    fee: "₹20–₹50",
    sla: "Same Day to 3 Days",
    online: "https://meebhoomi.ap.gov.in | https://dharani.telangana.gov.in",
    office: "Revenue Divisional Office / Tahsildar / Meebhoomi Kiosk",
    description: "Official record showing ownership, extent, type and cultivation status of agricultural land (RoR / Pahani / Patta). Required for agricultural loans, crop insurance, and land-based government subsidies.",
    steps: [
      "Access Meebhoomi (AP) or Dharani (Telangana) portal for online digital copy.",
      "Search using Aadhaar number, survey number, or owner name.",
      "Download digitally signed Pahani/Patta — accepted as official legal record.",
      "For mutations or corrections: visit Tahsildar office with original documents.",
      "For certified hard copy: apply at Revenue Divisional Office paying ₹20.",
      "Verify all entries (owner name, survey no., extent) before signing any deed."
    ],
    documents: [
      "Aadhaar Card of Land Owner",
      "Previous Patta Passbook / Sale Deed",
      "Survey Number details (from village map / previous records)",
      "NOC from co-owners (for partial share records)",
      "Court Order (if land ownership is under litigation)"
    ]
  },
  police: {
    title: "Police Verification / Character Certificate",
    dept: "District Police / SP Office",
    fee: "₹50–₹200",
    sla: "7-15 Days",
    online: "https://citizenportal.ap.gov.in (varies by state)",
    office: "Local Police Station / District Superintendent of Police Office",
    description: "Certificate issued by local police verifying no criminal record in the jurisdiction. Required for government job applications, passport processing, visa applications, and security clearances.",
    steps: [
      "Apply at local police station or online via state citizen portal.",
      "Fill Character/Police Verification Certificate application form.",
      "Police constable may visit residence for address verification.",
      "Station House Officer (SHO) verifies criminal records and endorses application.",
      "SP/Dy-SP signs the final certificate for official use.",
      "Collect sealed certificate from the station — carry original ID during pickup."
    ],
    documents: [
      "Application Form (from Police Station)",
      "Aadhaar Card",
      "Address Proof (utility bill / Voter ID)",
      "Passport-size photographs (4 copies)",
      "Affidavit of good character on stamp paper",
      "Covering letter from employer (for employment-related police verification)"
    ]
  }
};

export default function CitizenPortal({ onReportSubmitted }) {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const contentRef = useRef(null);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Advanced Audio Recording States & Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const recordingIntervalRef = useRef(null);
  const playbackIntervalRef = useRef(null);

  // Government Certificate Hub States
  const [portalMode, setPortalMode] = useState('grievance'); // 'grievance' or 'certificates'
  const [selectedCert, setSelectedCert] = useState('birth');
  const [checkedDocs, setCheckedDocs] = useState({});
  const [downloadingCert, setDownloadingCert] = useState(null);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
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

  // REAL Audio Recording Functions using MediaRecorder API
  const startRecording = () => {
    setError(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          setRecordedAudio({
            name: `Voice_Note_${new Date().toLocaleTimeString().replace(/ /g, '_')}.wav`,
            duration: recordingSeconds,
            url: audioUrl,
            blob: audioBlob
          });
          setVoice(true);
          
          // Stop all audio tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        setRecordedAudio(null);
        setVoice(false);

        recordingIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      })
      .catch((err) => {
        console.error("Microphone access denied:", err);
        setError("Microphone access denied. Please allow microphone permissions in your browser.");
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const deleteVoiceNote = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
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
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlayingAudio(false);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    } else {
      setIsPlayingAudio(true);
      setAudioPlaybackProgress(0);
      
      const audio = new Audio(recordedAudio.url);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioPlaybackProgress(100);
        if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      };

      audio.play();

      playbackIntervalRef.current = setInterval(() => {
        if (audio.duration) {
          setAudioPlaybackProgress((audio.currentTime / audio.duration) * 100);
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

  const handleToggleDoc = (certKey, docIndex) => {
    setCheckedDocs(prev => {
      const current = prev[certKey] || [];
      const updated = current.includes(docIndex)
        ? current.filter(i => i !== docIndex)
        : [...current, docIndex];
      return { ...prev, [certKey]: updated };
    });
  };

  const handleDownload = (docName) => {
    setDownloadingCert(docName);
    setTimeout(() => {
      setDownloadingCert(null);
      alert(`Success: Downloaded standard municipal ${docName}.pdf application form!`);
    }, 1200);
  };

  const activeCertData = CERTIFICATE_DATA[selectedCert];

  return (
    <div className="portal-page-container animate-fade-in">
      {/* ── PORTAL HEADER BANNER (NIO STYLE) ───────────────────────────────── */}
      <div className="portal-header-banner">
        <div className="portal-banner-content">
          <span className="portal-banner-tag">Intelligent Routing Engine</span>
          <h1 className="portal-banner-title">RESOLVE THE FUTURE TODAY</h1>
          <p className="portal-banner-desc">
            Automatic ML Dispatch • Real-time Geo-Clustering • Instant Routing
          </p>
        </div>
        <button type="button" className="portal-banner-chevron" onClick={scrollToContent}>
          <ChevronDown size={20} />
        </button>
      </div>

      {/* ── MAIN BODY CONTENT ──────────────────────────────────────────────── */}
      <div ref={contentRef} className="portal-body-wrapper">
        <div className="portal-body-inner">
          
          {/* Header Row */}
          <div className="portal-body-header">
            <div className="portal-header-left">
              <h2>
                The Future of
                <br />
                Civic Care is Digital.
              </h2>
            </div>
            <div className="portal-header-right">
              <p>
                Pinpoint your concern on the map, choose your department category filter queue, and describe the issue. Alternatively, browse the Government Certificates Hub to view document checklists, locations, and procedures.
              </p>
            </div>
          </div>

          {/* Top Pill Tab Selector for Portal Mode */}
          <div className="portal-mode-toggle">
            <button 
              type="button" 
              className={`portal-mode-btn ${portalMode === 'grievance' ? 'active' : ''}`}
              onClick={() => setPortalMode('grievance')}
            >
              Lodge Civic Grievance
            </button>
            <button 
              type="button" 
              className={`portal-mode-btn ${portalMode === 'certificates' ? 'active' : ''}`}
              onClick={() => setPortalMode('certificates')}
            >
              Govt Certificate Hub
            </button>
          </div>

          {portalMode === 'grievance' ? (
            <>
              {/* Department Filter Tabs (NIO style) */}
              <div className="portal-tabs">
                {['ALL', 'WATER', 'ROADS', 'ELECTRICITY', 'SANITATION'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`portal-tab-item ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab);
                      // Suggest text or guide depending on selected tab
                      if (tab === 'WATER' && !text) {
                        setText('e.g. Water leakage from a broken pipe... ');
                      } else if (tab === 'ROADS' && !text) {
                        setText('e.g. Deep pothole causing issues... ');
                      } else if (tab === 'ELECTRICITY' && !text) {
                        setText('e.g. Streetlight not working on... ');
                      } else if (tab === 'SANITATION' && !text) {
                        setText('e.g. Clogged drainage overflowing with garbage... ');
                      } else if (tab === 'ALL' && text.startsWith('e.g. ')) {
                        setText('');
                      }
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Grid Layout Container */}
              <div className="portal-grid-container">
                {/* Left Column: Form Card */}
                <div className="portal-form-card">
                  <h3>Lodge Grievance</h3>
                  
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Description Textarea */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="portal-label">Describe the Incident</label>
                        <span style={{ fontSize: '11px', color: text.length > 300 ? '#ef4444' : '#9ca3af' }}>
                          {text.length} chars
                        </span>
                      </div>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Describe the issue in detail here..."
                        className="portal-textarea"
                      />
                    </div>

                    {/* Grievance Attachments */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="portal-label">Grievance Attachments</label>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Photo Upload Zone */}
                        <div className="portal-attachment-box">
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
                              className="portal-attachment-trigger"
                            >
                              <UploadCloud size={20} />
                              <span>Attach Photo (JPEG/PNG)</span>
                            </div>
                          )}

                          {uploadingPhoto && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                  Uploading photo...
                                </span>
                                <span>{photoProgress}%</span>
                              </div>
                              <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${photoProgress}%`, background: '#111827', transition: 'width 0.1s ease' }}></div>
                              </div>
                            </div>
                          )}

                          {photoFile && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                                  src={photoPreviewUrl} 
                                  alt="Preview" 
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {photoFile.name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                    {(photoFile.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removePhoto}
                                className="portal-delete-btn"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Voice Note Module */}
                        <div className="portal-attachment-box">
                          {!isRecording && !recordedAudio && (
                            <div 
                              onClick={startRecording}
                              className="portal-attachment-trigger"
                            >
                              <Mic size={20} />
                              <span>Record Audio Statement</span>
                            </div>
                          )}

                      {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="portal-record-dot"></span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                              Recording: {formatTime(recordingSeconds)}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="portal-stop-record-btn"
                          >
                            Stop
                          </button>
                        </div>
                      )}

                      {recordedAudio && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                            <button
                              type="button"
                              onClick={toggleAudioPlayback}
                              className="portal-audio-play-btn"
                            >
                              {isPlayingAudio ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '1px' }} />}
                            </button>
                            
                            <div style={{ flexGrow: 1, textAlign: 'left' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>
                                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recordedAudio.name}</span>
                                <span>{formatTime(recordedAudio.duration)}</span>
                              </div>
                              <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${audioPlaybackProgress}%`, background: '#111827', transition: isPlayingAudio ? 'width 0.1s linear' : 'none' }}></div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={deleteVoiceNote}
                            className="portal-delete-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Location Coordinate Panel */}
                <div className="portal-coordinates-panel">
                  <div className="portal-coord-icon-box">
                    <MapPin size={16} />
                  </div>
                  <div style={{ flexGrow: 1, textAlign: 'left' }}>
                    <div style={{ color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Coordinates selected</div>
                    <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111827' }}>
                      Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
                    </strong>
                  </div>
                </div>

                {/* Error Alerts */}
                {error && (
                  <div className="portal-error-banner">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="portal-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="auth-spinner" />
                      AI Diagnostics Running...
                    </>
                  ) : (
                    'Submit Grievance'
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Google Maps Selection */}
            <div className="portal-map-card">
              <div className="portal-map-header">
                <h3>Pinpoint Location on Map</h3>
                <p>Click anywhere on the map to set concern location coordinate pin</p>
              </div>
              
              <div className="portal-map-container-box">
                <MapContainer 
                  center={position} 
                  zoom={13} 
                  style={{ height: '495px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  />
                  <MapEventsHandler setPosition={setPosition} />
                  <Marker position={position} />
                </MapContainer>
              </div>
            </div>

          </div>
            </>
          ) : (
            /* ── GOVERNMENT CERTIFICATE HUB INTERACTIVE GUIDE ────────────────── */
            <div className="cert-hub-container animate-fade-in">
              {/* Left Sidebar List */}
              <div className="cert-sidebar">
                <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    {Object.keys(CERTIFICATE_DATA).length} Services Available
                  </p>
                </div>
                {Object.keys(CERTIFICATE_DATA).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`cert-sidebar-item ${selectedCert === key ? 'active' : ''}`}
                    onClick={() => { setSelectedCert(key); setCheckedDocs(prev => ({ ...prev })); }}
                  >
                    {CERTIFICATE_DATA[key].title}
                  </button>
                ))}
              </div>

              {/* Right Panel Content */}
              <div className="cert-content-card">
                <div className="cert-content-header">
                  <div className="cert-title-row">
                    <h3>{activeCertData.title}</h3>
                    <span className="cert-badge">{activeCertData.dept}</span>
                  </div>
                  <p className="cert-desc">{activeCertData.description}</p>
                </div>

                {/* 4-stat grid: SLA, Fee, Office, Online */}
                <div className="cert-stats-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="cert-stat-box">
                    <span>⏱ Expected SLA</span>
                    <strong>{activeCertData.sla}</strong>
                  </div>
                  <div className="cert-stat-box">
                    <span>💰 Official Fees</span>
                    <strong>{activeCertData.fee}</strong>
                  </div>
                  <div className="cert-stat-box" style={{ gridColumn: 'span 2' }}>
                    <span>🏛 Processing Authority</span>
                    <strong style={{ fontSize: '12px' }}>{activeCertData.office}</strong>
                  </div>
                  {activeCertData.online && (
                    <div className="cert-stat-box" style={{ gridColumn: 'span 2', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <span style={{ color: '#2563eb' }}>🌐 Official Online Portal</span>
                      <a
                        href={activeCertData.online.split(' | ')[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', fontWeight: 700, fontSize: '12px', wordBreak: 'break-all', textDecoration: 'none' }}
                      >
                        {activeCertData.online} ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Step-by-Step Procedure */}
                <div className="cert-section">
                  <h4>📋 Application Process (Step by Step)</h4>
                  <ol className="cert-steps-list">
                    {activeCertData.steps.map((step, idx) => (
                      <li key={idx}>
                        <div className="step-num">{idx + 1}</div>
                        <div className="step-text">{step}</div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Documents Checklist Card */}
                <div className="cert-section">
                  <div className="cert-docs-header">
                    <h4>📁 Required Documents Checklist</h4>
                    <span className="cert-docs-progress">
                      {(checkedDocs[selectedCert] || []).length} / {activeCertData.documents.length} prepared
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{
                      height: '100%',
                      width: `${activeCertData.documents.length > 0 ? ((checkedDocs[selectedCert] || []).length / activeCertData.documents.length) * 100 : 0}%`,
                      background: (checkedDocs[selectedCert] || []).length === activeCertData.documents.length ? '#10b981' : '#111827',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  
                  <div className="cert-docs-checklist">
                    {activeCertData.documents.map((doc, idx) => {
                      const isChecked = (checkedDocs[selectedCert] || []).includes(idx);
                      return (
                        <div 
                          key={idx} 
                          className={`cert-checklist-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleDoc(selectedCert, idx)}
                        >
                          <div className="cert-checkbox">
                            {isChecked && <Check size={12} />}
                          </div>
                          <span>{doc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {(checkedDocs[selectedCert] || []).length === activeCertData.documents.length && activeCertData.documents.length > 0 && (
                    <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
                        All documents ready! You can now proceed to apply.
                      </span>
                    </div>
                  )}
                </div>

                {/* Apply Online + Download Forms */}
                <div className="cert-section" style={{ border: 'none', paddingBottom: 0 }}>
                  <h4>🔗 Quick Actions</h4>
                  <div className="cert-downloads-row">
                    {activeCertData.online && (
                      <a
                        href={activeCertData.online.split(' | ')[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-download-btn"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        🌐 Apply Online at Official Portal
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={downloadingCert !== null}
                      onClick={() => handleDownload("Form-1_Application")}
                      className="cert-download-btn"
                      style={{ background: 'transparent', color: '#111827', border: '1.5px solid #e5e7eb' }}
                    >
                      {downloadingCert === "Form-1_Application" ? (
                        <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Downloading...</>
                      ) : (
                        "⬇ Download Application Form (PDF)"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={downloadingCert !== null}
                      onClick={() => handleDownload("Documents_Checklist")}
                      className="cert-download-btn secondary"
                    >
                      {downloadingCert === "Documents_Checklist" ? (
                        <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Downloading...</>
                      ) : (
                        "⬇ Download Requirements Checklist"
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}