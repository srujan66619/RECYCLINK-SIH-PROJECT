import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Sparkles, RefreshCw, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import aiService from '../../services/aiService';

const DEMO_PRESETS = [
  { key: 'pcb', name: 'PCB (Circuit Board)', sub: 'Server / Motherboard', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', hazard: 'MEDIUM' },
  { key: 'cable', name: 'Insulated Cable', sub: 'Copper telecom wire', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80', hazard: 'LOW' },
  { key: 'battery', name: 'Li-Ion Battery', sub: 'Laptop 18650 cells', img: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&q=80', hazard: 'HIGH' },
  { key: 'lcd', name: 'LCD / Monitor', sub: 'Flat panel display', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80', hazard: 'MEDIUM' },
  { key: 'crt', name: 'CRT Glass Tube', sub: 'Old TV tube', img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80', hazard: 'CRITICAL' },
  { key: 'motor', name: 'Electric Motor', sub: 'Copper wound stator', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', hazard: 'LOW' },
  { key: 'magnet', name: 'Rare Earth Magnet', sub: 'Hard drive NdFeB', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80', hazard: 'LOW' },
  { key: 'plastic', name: 'E-Waste Plastic', sub: 'ABS casings', img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&q=80', hazard: 'LOW' },
  { key: 'component', name: 'Electronic Components', sub: 'ICs & Microchips', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80', hazard: 'MEDIUM' },
  { key: 'mixed', name: 'Mixed E-Waste', sub: 'Unsorted appliances', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80', hazard: 'MEDIUM' },
];

export default function CollectorIdentify() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setSelectedPreset(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setSelectedImage(preset.img);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedPreset(null);
    setError(null);
  };

  const handleIdentify = async () => {
    if (!selectedImage && !selectedPreset) {
      setError('Please take a photo, upload an image, or select a demo sample.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sampleKey = selectedPreset ? selectedPreset.key : 'pcb';
      const result = await aiService.classifyMaterial({
        sample_key: sampleKey,
        image_base64: selectedImage?.startsWith('data:') ? selectedImage : null,
      });

      setLoading(false);
      navigate('/collector/material-result', {
        state: {
          result,
          photo_url: selectedImage || selectedPreset?.img,
        },
      });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error?.message || 'AI Classification failed. Please try again.');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {t('what_recycling') || 'What are you recycling?'}
        </h2>
        <p className="text-xs text-slate-400">
          Capture or select an item to get instant fair pricing and authorized recycler matching.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Preview or Capture Buttons */}
      {selectedImage ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-800">
            <img
              src={selectedImage}
              alt="Selected e-waste preview"
              className="w-full h-full object-cover"
            />
            {selectedPreset && (
              <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 backdrop-blur-sm text-emerald-300 border border-emerald-500/40">
                Preset: {selectedPreset.name}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('retake_photo') || 'Change / Retake'}
            </button>
            <button
              onClick={handleIdentify}
              disabled={loading}
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
            >
              {loading ? (
                <span>AI Analyzing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('identify_btn') || 'IDENTIFY MATERIAL'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Capture via Camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-950/60 to-slate-900 border-2 border-dashed border-emerald-600/60 hover:border-emerald-500 rounded-2xl min-h-[140px] text-center transition active:scale-[0.98] group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-white block">
              {t('take_photo') || 'Take Photo'}
            </span>
            <span className="text-[11px] text-slate-400">Mobile Camera</span>
          </button>

          {/* Upload File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl min-h-[140px] text-center transition active:scale-[0.98] group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-white block">
              {t('upload_photo') || 'Upload Photo'}
            </span>
            <span className="text-[11px] text-slate-400">From Device</span>
          </button>
        </div>
      )}

      {/* Demo Image Presets Selection */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            {t('select_demo') || 'Or Select Demo E-Waste Category'}
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">10 Presets</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.key}
              onClick={() => handleSelectPreset(preset)}
              className={`
                p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center gap-2.5
                ${selectedPreset?.key === preset.key
                  ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }
              `}
            >
              <img
                src={preset.img}
                alt={preset.name}
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-white block truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {preset.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button (if preset picked without preview action) */}
      {selectedPreset && !loading && (
        <button
          onClick={handleIdentify}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Identify {selectedPreset.name}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
