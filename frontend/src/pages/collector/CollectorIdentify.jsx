import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera, Upload, Sparkles, RefreshCw, AlertCircle, ArrowRight,
  Check, Volume2, ShieldAlert, WifiOff, Scale
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import aiService from '../../services/aiService';
import offlineSyncManager, { useNetworkStatus } from '../../services/offlineSync';
import voiceService from '../../services/voiceService';

// Pictorial visual materials with vernacular naming
const PICTORIAL_MATERIALS = [
  {
    key: 'pcb',
    name: 'PCB',
    fullName: 'Printed Circuit Board (PCB)',
    nameHi: 'सर्किट बोर्ड (PCB)',
    nameMr: 'सर्किट बोर्ड (PCB)',
    sub: 'Server / Motherboard',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
    hazard: 'MEDIUM',
    pricePerKg: 455
  },
  {
    key: 'battery',
    name: 'Battery',
    fullName: 'Li-Ion Battery',
    nameHi: 'लिथियम बैटरी',
    nameMr: 'लिथियम बॅटरी',
    sub: 'Laptop / Mobile Cells',
    img: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&q=80',
    hazard: 'HIGH',
    pricePerKg: 380
  },
  {
    key: 'cable',
    name: 'Cable',
    fullName: 'Insulated Cable',
    nameHi: 'कॉपर केबल / तार',
    nameMr: 'तांब्याची केबल / वायर',
    sub: 'Copper telecom wire',
    img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
    hazard: 'LOW',
    pricePerKg: 420
  },
  {
    key: 'lcd',
    name: 'LCD',
    fullName: 'LCD Display Screen',
    nameHi: 'एलसीडी स्क्रीन',
    nameMr: 'एलसीडी स्क्रीन',
    sub: 'Flat panel monitor',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
    hazard: 'MEDIUM',
    pricePerKg: 190
  },
  {
    key: 'crt',
    name: 'CRT',
    fullName: 'CRT Monitor / TV Tube',
    nameHi: 'सीआरटी टीवी ट्यूब',
    nameMr: 'सीआरटी टीव्ही ट्यूब',
    sub: 'Vacuum glass envelope',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80',
    hazard: 'HIGH',
    pricePerKg: 85
  },
  {
    key: 'motor',
    name: 'Motor',
    fullName: 'Electric Motor',
    nameHi: 'इलेक्ट्रिक मोटर',
    nameMr: 'इलेक्ट्रिक मोटर',
    sub: 'Copper wound stator',
    img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80',
    hazard: 'LOW',
    pricePerKg: 310
  },
  {
    key: 'component',
    name: 'Components',
    fullName: 'Electronic Components',
    nameHi: 'इलेक्ट्रॉनिक पुर्जे',
    nameMr: 'इलेक्ट्रॉनिक सुटे भाग',
    sub: 'ICs & Microchips',
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80',
    hazard: 'MEDIUM',
    pricePerKg: 520
  },
  {
    key: 'plastic',
    name: 'Plastic',
    fullName: 'E-Waste Plastic',
    nameHi: 'ई-कचरा प्लास्टिक',
    nameMr: 'ई-कचरा प्लास्टिक',
    sub: 'ABS / PC casings',
    img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80',
    hazard: 'LOW',
    pricePerKg: 45
  },
  {
    key: 'mixed',
    name: 'Mixed E-Waste',
    fullName: 'Mixed E-Waste',
    nameHi: 'मिश्रित ई-कचरा',
    nameMr: 'मिश्र ई-कचरा',
    sub: 'Unsorted appliances',
    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80',
    hazard: 'MEDIUM',
    pricePerKg: 220
  }
];

const WEIGHT_CHIPS = [0.5, 1.0, 2.0, 5.0, 10.0];

export default function CollectorIdentify() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline } = useNetworkStatus();

  // Preset material passed from voice or navigation
  const initialPreset = location.state?.presetMaterial
    ? PICTORIAL_MATERIALS.find(m => m.name.toLowerCase() === location.state.presetMaterial.toLowerCase())
    : null;

  const [selectedImage, setSelectedImage] = useState(initialPreset ? initialPreset.img : null);
  const [selectedMaterial, setSelectedMaterial] = useState(initialPreset || PICTORIAL_MATERIALS[0]);
  const [weightKg, setWeightKg] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineSavedNotice, setOfflineSavedNotice] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Compress & set photo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectMaterial = (mat) => {
    setSelectedMaterial(mat);
    if (!selectedImage || selectedImage.startsWith('http')) {
      setSelectedImage(mat.img);
    }
  };

  const handleSpeakMaterial = (e, mat) => {
    e.stopPropagation();
    const text = locale === 'hi' ? mat.nameHi : locale === 'mr' ? mat.nameMr : mat.fullName;
    voiceService.speak(text, locale);
  };

  const handleIdentifyOrSaveOffline = async () => {
    if (!selectedImage && !selectedMaterial) {
      setError('Please take a photo or select an e-waste material.');
      return;
    }

    setLoading(true);
    setError(null);

    // If OFFLINE: Save offline draft lot in IndexedDB and queue sync action
    if (!isOnline) {
      try {
        const estPrice = (selectedMaterial.pricePerKg || 400) * weightKg;
        const draft = await offlineSyncManager.createOfflineLotDraft({
          material_name: selectedMaterial.fullName,
          subcategory: selectedMaterial.sub,
          estimated_weight: weightKg,
          photo_url: selectedImage || selectedMaterial.img,
          hazard_level: selectedMaterial.hazard,
          estimated_price_min: estPrice * 0.88,
          estimated_price_max: estPrice * 1.12,
          recommended_price: estPrice,
          location_address: 'Field Collection (Offline)'
        });

        setOfflineSavedNotice({
          localId: draft.local_id,
          material: selectedMaterial.fullName
        });
        setLoading(false);
      } catch (err) {
        setError(`Failed to save offline: ${err.message}`);
        setLoading(false);
      }
      return;
    }

    // If ONLINE: Run AI Classification
    try {
      const result = await aiService.classifyMaterial({
        sample_key: selectedMaterial.key,
        image_base64: selectedImage?.startsWith('data:') ? selectedImage : null,
      });

      setLoading(false);
      navigate('/collector/material-result', {
        state: {
          result,
          photo_url: selectedImage || selectedMaterial.img,
          weight_kg: weightKg
        }
      });
    } catch (err) {
      console.warn('AI classification failed, falling back to offline draft creation:', err);
      // Create local draft fallback
      const draft = await offlineSyncManager.createOfflineLotDraft({
        material_name: selectedMaterial.fullName,
        subcategory: selectedMaterial.sub,
        estimated_weight: weightKg,
        photo_url: selectedImage || selectedMaterial.img,
        hazard_level: selectedMaterial.hazard
      });

      setOfflineSavedNotice({
        localId: draft.local_id,
        material: selectedMaterial.fullName
      });
      setLoading(false);
    }
  };

  // Render Offline Lot Creation Confirmation Modal/Card
  if (offlineSavedNotice) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              {t('offline.saved_offline')}
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              {t('offline.temporary_lot')}
            </h2>
            <p className="font-mono text-emerald-400 font-bold text-sm mt-1">
              {offlineSavedNotice.localId}
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {t('offline.official_id_notice')}
          </p>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => navigate('/collector/lots')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition active:scale-95"
            >
              {t('dashboard.my_lots')}
            </button>
            <button
              onClick={() => {
                setOfflineSavedNotice(null);
                setSelectedImage(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition"
            >
              + {t('dashboard.identify')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 max-w-lg mx-auto">
      {/* Step Indicator Header (Low-Literacy 6-Step Progress) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Step 1 of 6
          </span>
          <h1 className="text-sm font-bold text-white">
            {t('dashboard.identify')}
          </h1>
        </div>
        <div className="flex gap-1">
          <span className="w-5 h-2 rounded-full bg-emerald-500"></span>
          <span className="w-5 h-2 rounded-full bg-slate-700"></span>
          <span className="w-5 h-2 rounded-full bg-slate-700"></span>
          <span className="w-5 h-2 rounded-full bg-slate-700"></span>
        </div>
      </div>

      {/* Offline Alert Strip if currently offline */}
      {!isOnline && (
        <div className="bg-amber-950/70 border border-amber-600/40 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-200">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{t('offline.ai_pending')}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Preview / Capture Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black flex items-center justify-center border border-slate-800 group">
          {selectedImage ? (
            <img src={selectedImage} alt="E-Waste Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 space-y-2">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                {t('take_photo') || 'Take a clear photo of the e-waste'}
              </p>
            </div>
          )}

          {/* Quick Camera Action Overlay */}
          <div className="absolute bottom-3 inset-x-3 flex gap-2">
            {/* Native Device Camera */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur-md text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>{t('take_photo')}</span>
            </button>

            {/* Gallery Upload Fallback */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 bg-slate-950/80 hover:bg-slate-800 backdrop-blur-md text-slate-300 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Upload className="w-4 h-4" />
              <span>{t('upload_photo')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pictorial Material Selection Cards (Large Visual Grid) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            {t('what_recycling')}
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Tap material card</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {PICTORIAL_MATERIALS.map((mat) => {
            const isSelected = selectedMaterial.key === mat.key;
            const displayName = locale === 'hi' ? mat.nameHi : locale === 'mr' ? mat.nameMr : mat.name;

            return (
              <div
                key={mat.key}
                onClick={() => handleSelectMaterial(mat)}
                className={`p-2.5 rounded-2xl border text-center cursor-pointer transition relative flex flex-col items-center justify-between min-h-[110px] ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Voice Pronounce Button */}
                <button
                  onClick={(e) => handleSpeakMaterial(e, mat)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/60 text-slate-400 hover:text-emerald-400 flex items-center justify-center"
                  title="Listen"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                {/* Picture Icon */}
                <div className="w-12 h-12 rounded-xl overflow-hidden mt-1 mb-1 border border-slate-800 shadow-sm flex-shrink-0">
                  <img src={mat.img} alt={mat.name} className="w-full h-full object-cover" />
                </div>

                {/* Label */}
                <div>
                  <span className={`text-xs font-bold block leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {displayName}
                  </span>
                  {mat.hazard === 'HIGH' && (
                    <span className="text-[9px] text-rose-400 font-bold block">
                      ⚠ HIGH RISK
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight Selector (Quick Low-Literacy Chips) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              {t('est_weight_label')}
            </span>
          </div>
          <span className="text-sm font-black text-emerald-400">
            {weightKg} kg
          </span>
        </div>

        {/* Quick Chips (0.5, 1, 2, 5, 10 kg) */}
        <div className="flex gap-2">
          {WEIGHT_CHIPS.map((w) => (
            <button
              key={w}
              onClick={() => setWeightKg(w)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                weightKg === w
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {w} kg
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Button (Touch Target 64px+) */}
      <div className="pt-2">
        <button
          onClick={handleIdentifyOrSaveOffline}
          disabled={loading}
          className="w-full min-h-[64px] py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isOnline ? 'Analyzing Material...' : 'Saving Lot Offline...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span>{isOnline ? t('identify_btn') : t('offline.saved_offline')}</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
