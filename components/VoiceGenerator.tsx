import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { generateVoiceOver } from '../services/geminiService';
import Button from './Button';
import SelectInput from './SelectInput';
import TextAreaInput from './TextAreaInput';
import SliderInput from './SliderInput';
import { Spinner } from './Spinner';

const MAX_CHAR_LIMIT = 5000;

type Gender = 'Wanita' | 'Pria';
type VoiceCharacter = { name: string; id: string; };
type HistoryItem = { id: string; url: string; script: string; };

const voiceOptions: Record<Gender, VoiceCharacter[]> = {
    Wanita: [
        { name: "Sari - Energik", id: "Kore" },
        { name: "Wulan - Lembut", id: "Zephyr" },
        { name: "Rina - Profesional", id: "Kore" },
        { name: "Dewi - Ceria", id: "Kore" },
        { name: "Maya - Dongeng", id: "Charon" },
    ],
    Pria: [
        { name: "Budi - Profesional", id: "Puck" },
        { name: "Joko - Tegas", id: "Fenrir" },
        { name: "Adi - Ramah", id: "Puck" },
        { name: "Eko - Dalam", id: "Fenrir" },
        { name: "Gus - Berwibawa", id: "Fenrir" },
    ]
};

const moodPrompts: Record<string, string> = {
    'Normal': "Ucapkan dengan nada normal",
    'Promosi': "Ucapkan dengan nada promosi dan energik",
    'Lucu': "Ucapkan dengan nada lucu dan menyenangkan",
    'Ceria': "Ucapkan dengan ceria",
    'Tegas': "Ucapkan dengan nada tegas dan berwibawa",
    'Profesional': "Ucapkan dengan nada yang jernih dan profesional",
    'Berbisik': "Ucapkan dengan nada berbisik",
    'Dongeng': "Ucapkan seolah-olah sedang bercerita dongeng",
    'Cepat': "Ucapkan dengan cepat namun tetap jelas",
};


const VoiceGenerator = () => {
    const { apiKey, isApiKeySet } = useApiKey();

    const [script, setScript] = useState('');
    const [gender, setGender] = useState<Gender>('Wanita');
    const [voiceId, setVoiceId] = useState<string>(voiceOptions.Wanita[0].id);
    const [mood, setMood] = useState<string>('Normal');
    const [pitch, setPitch] = useState(1.0);
    const [speed, setSpeed] = useState(1.0);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [isPreviewing, setIsPreviewing] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
    
    useEffect(() => {
        // Reset voice selection when gender changes
        setVoiceId(voiceOptions[gender][0].id);
    }, [gender]);

    const handleGenerate = async (autoPlay = false) => {
        if (!isApiKeySet) {
            setError('Kunci API belum diatur.');
            return;
        }
        if (!script.trim()) {
            setError('Script tidak boleh kosong.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setGeneratedAudioUrl(null);
        
        const moodPrefix = moodPrompts[mood] || '';
        const finalScript = `${moodPrefix}: ${script}`;

        try {
            const blob = await generateVoiceOver(apiKey, finalScript, voiceId);
            const url = URL.createObjectURL(blob);
            setGeneratedAudioUrl(url);
            
            const newHistoryItem = { id: Date.now().toString(), url, script: script.slice(0, 50) + '...' };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));

            if (autoPlay) {
                // Use a short delay to ensure state is updated before playing
                setTimeout(() => handlePreview(url), 100);
            }

        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat membuat suara.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = async (urlToPlay?: string) => {
        const targetUrl = urlToPlay || generatedAudioUrl;
        if (!targetUrl) {
            await handleGenerate(true);
            return;
        }

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            return;
        }

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioContext = audioContextRef.current;
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            const response = await fetch(targetUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed;

            if (!biquadFilterRef.current || biquadFilterRef.current.context !== audioContext) {
                biquadFilterRef.current = audioContext.createBiquadFilter();
            }
            const filter = biquadFilterRef.current;
            filter.type = 'peaking';
            filter.frequency.setValueAtTime(1000, audioContext.currentTime);
            const gainValue = (pitch - 1.0) * 15;
            filter.gain.setValueAtTime(gainValue, audioContext.currentTime);

            source.connect(filter).connect(audioContext.destination);
            source.onended = () => {
                setIsPreviewing(false);
                audioSourceRef.current = null;
            };
            source.start(0);
            audioSourceRef.current = source;
            setIsPreviewing(true);

        } catch (err) {
            setError('Gagal memutar pratinjau audio.');
            console.error(err);
        }
    };
    
    const stopPreview = useCallback(() => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Ignore errors if stop is called on an already stopped source
            }
            audioSourceRef.current = null;
            setIsPreviewing(false);
        }
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => stopPreview();
    }, [stopPreview]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800/50 rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Script Voice-Over</h2>
                    <TextAreaInput 
                        label=""
                        id="script-input"
                        value={script}
                        onChange={(val) => setScript(val.slice(0, MAX_CHAR_LIMIT))}
                        placeholder="Masukkan teks untuk diubah menjadi suara..."
                        rows={10}
                    />
                    <p className={`text-xs mt-2 text-right ${script.length >= MAX_CHAR_LIMIT ? 'text-red-400' : 'text-gray-400'}`}>
                        {script.length} / {MAX_CHAR_LIMIT}
                    </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Hasil & Riwayat</h2>
                    {isLoading ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                            <Spinner className="h-8 w-8"/>
                            <p className="mt-2 text-sm">Membuat suara...</p>
                        </div>
                    ) : generatedAudioUrl ? (
                         <div className="space-y-4">
                            <audio src={generatedAudioUrl} controls className="w-full" />
                            <div className="grid grid-cols-2 gap-4">
                               <Button onClick={() => handlePreview()} variant="secondary">
                                    <i className={`fa-solid ${isPreviewing ? 'fa-stop' : 'fa-play'} mr-2`}></i>
                                    {isPreviewing ? 'Stop Preview' : 'Preview Suara'}
                                </Button>
                                <a href={generatedAudioUrl} download={`voice-over-${Date.now()}.wav`} className="w-full">
                                    <Button variant="secondary" className="w-full">
                                        <i className="fa-solid fa-download mr-2"></i>
                                        Unduh WAV
                                    </Button>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-center text-gray-500">
                           <p>Hasil audio Anda akan muncul di sini.</p>
                        </div>
                    )}
                </div>
                
                 <div className="bg-slate-800/50 rounded-xl shadow-lg p-6">
                    <h3 className="text-md font-semibold text-white mb-3">Riwayat Terakhir</h3>
                    <div className="space-y-3">
                        {history.length > 0 ? history.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-md">
                                <button onClick={() => { setGeneratedAudioUrl(item.url); handlePreview(item.url); }} className="p-2 text-green-400 hover:text-green-300">
                                    <i className="fa-solid fa-play"></i>
                                </button>
                                <p className="flex-grow text-sm text-gray-400 truncate">{item.script}</p>
                                <a href={item.url} download={`voice-over-${item.id}.wav`} className="p-2 text-gray-400 hover:text-white">
                                    <i className="fa-solid fa-download"></i>
                                </a>
                            </div>
                        )) : <p className="text-sm text-gray-500 text-center">Belum ada riwayat.</p>}
                    </div>
                 </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 space-y-5 sticky top-6">
                     <h2 className="text-lg font-semibold text-white">Pengaturan Suara</h2>
                     {error && <p className="text-xs text-center text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}
                     <SelectInput 
                        label="Gender"
                        value={gender}
                        onChange={(val) => setGender(val as Gender)}
                        options={[
                            { value: 'Wanita', label: 'Wanita' },
                            { value: 'Pria', label: 'Pria' },
                        ]}
                     />
                     <SelectInput 
                        label="Karakter Suara"
                        value={voiceId}
                        onChange={setVoiceId}
                        options={voiceOptions[gender].map(v => ({ value: v.id, label: v.name }))}
                     />
                     <SelectInput 
                        label="Mood / Emosi"
                        value={mood}
                        onChange={setMood}
                        options={Object.keys(moodPrompts).map(m => ({ value: m, label: m }))}
                     />
                     <SliderInput 
                        label="Kecepatan"
                        id="speed-slider"
                        min={0.5} max={2.0} step={0.05}
                        value={speed}
                        onChange={setSpeed}
                        unit="x"
                     />
                    <SliderInput 
                        label="Pitch"
                        id="pitch-slider"
                        min={0.5} max={2.0} step={0.05}
                        value={pitch}
                        onChange={setPitch}
                        unit="x"
                     />
                     <Button onClick={() => handleGenerate()} disabled={isLoading} className="w-full !text-base !py-3">
                        {isLoading ? <Spinner /> : <i className="fa-solid fa-microphone-lines mr-2"></i>}
                        Generate Voice-Over
                     </Button>
                </div>
            </div>
        </div>
    );
};

export default VoiceGenerator;
