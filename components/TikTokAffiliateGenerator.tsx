import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { generateProductPhoto, mixImages } from '../services/geminiService';
import type { ImageInput, ImageAspectRatio } from '../types';
import { ImageUploader } from './ImageUploader';
import SelectInput from './SelectInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';
import { Spinner } from './Spinner';
import { DownloadIcon, MagnifyingGlassIcon, SparklesIcon } from './icons';
import { ImagePreviewModal } from './ImagePreviewModal';

// --- DATA CONSTANTS ---

const POSES = ['Random', 'Berdiri Santai', 'Duduk Elegan', 'Berjalan Candid', 'Menyandar Dinding', 'Berputar Anggun', 'Tertawa Lepas', 'Tangan di Saku', 'Melihat ke Bahu'];
const STYLES = ['Random', 'Casual', 'Formal', 'Sporty', 'Elegant', 'Streetwear', 'Vintage', 'Minimalist', 'Bohemian'];
const MAKEUP_STYLES = ['Random', 'Natural', 'Glam', 'Bold', 'Soft', 'Korean Style', 'Editorial'];
const HAIR_STYLES = ['Random', 'Tergerai', 'Diikat', 'Berantakan', 'Rapi', 'Ikal', 'Lurus'];
const BACKGROUNDS = {
    'Indoor': ['Studio Putih Bersih', 'Ruang Tamu Modern', 'Kamar Tidur Estetik', 'Kafe Minimalis', 'Dapur Mewah', 'Gym Industrial'],
    'Indoor Indonesia': [
        'Pesta Pernikahan Adat (Jawa/Lampung/Minang)',
        'Cafe Kopi Indonesia (Modern/Tradisional)',
        'Interior Rumah Joglo Tradisional',
        'Interior Rumah Gadang Minangkabau',
        'Warung Makan Lesehan Tradisional',
        'Toko Batik & Kerajinan',
        'Interior Masjid Tradisional Indonesia',
        'Kantor Bergaya Kolonial'
    ],
    'Outdoor': ['Taman Bunga', 'Pantai Tropis', 'Jalanan Kota Malam Hari', 'Rooftop Saat Senja', 'Hutan Pinus', 'Puncak Gunung'],
    'Outdoor Indonesia': [
        'Jalanan Kota Indonesia (Warung/Becak/Motor)',
        'Sawah Terasering (Ubud/Magelang)',
        'Pantai Bali (Pasir Putih/Perahu Jukung)',
        'Pemandangan Danau Toba',
        'Gunung Bromo (Lautan Pasir/Sunrise)',
        'Hutan Tropis Papua',
        'Desa Adat (Wae Rebo/Toraja)',
        'Pasar Tradisional Ramai',
        'Alun-alun Kota di Sore Hari',
        'Jembatan Gantung di Hutan',
        'Kampung Warna-warni (Malang/Semarang)',
        'Latar Belakang Candi (Borobudur/Prambanan)',
        'Taman Kota Indonesia (Monas)'
    ],
    'Abstrak': ['Dinding Tekstur Beton', 'Latar Belakang Bokeh', 'Gradient Warna Pastel', 'Studio Minimalis Abu-abu'],
};
const LIGHTING = ['Random', 'Golden Hour', 'Blue Hour', 'Cahaya Jendela Lembut', 'Softbox Studio', 'Lampu Neon', 'Bayangan Dramatis', 'Rembrandt Lighting', 'Backlight Siluet'];
const CAMERA_LENSES = ['Random', 'Potret 85mm f/1.8 (Bokeh)', 'Wide 35mm f/1.4 (Konteks)', 'Telephoto 70-200mm (Kompresi)', 'Tampilan Film Analog (Grain)'];
const EXPRESSIONS = ['Random', 'Senyum Tulus', 'Senyum Lembut', 'Serius & Percaya Diri', 'Ceria & Aktif', 'Melamun & Tenang', 'Tatap Kamera Tajam'];
const CAMERA_ANGLES = ['Random', 'Eye Level', 'High Angle', 'Low Angle', 'Close-up', 'Medium Shot', 'Full Body Shot', 'Dutch Angle'];
const COLOR_GRADINGS = ['Random', 'Tone Hangat (Warm)', 'Tone Dingin (Cool)', 'Vintage Film', 'Vibrant & Jenuh', 'Muted & Desaturated', 'Cinematic Teal & Orange'];
const COMPOSITIONS = ['Random', 'Rule of Thirds', 'Centered', 'Negative Space', 'Leading Lines'];

// --- HELPER FUNCTIONS & TYPES ---

const fileToImageInput = (file: File): Promise<ImageInput> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, dataPart] = result.split(';base64,');
      resolve({ data: dataPart, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Photo {
    id: number;
    status: 'idle' | 'generating' | 'done' | 'error';
    imageData?: ImageInput;
    error?: string;
}

const SettingsSection: React.FC<{ title: string; number: number; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, number, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 text-left" aria-expanded={isOpen}>
                <h2 className="text-sm font-bold tracking-wider text-green-400 uppercase">{number}. {title}</h2>
                <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="p-3 pt-2"><div className="border-t border-slate-700 pt-4 space-y-4">{children}</div></div>}
        </div>
    );
};

const OptionButton: React.FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
    <button onClick={onClick} className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 border ${isSelected ? 'bg-green-500/20 border-green-500 text-green-300 font-semibold' : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:bg-slate-700/80'}`}>
        {label}
    </button>
);

const ProductPhotoshoot: React.FC = () => {
    const { t } = useLanguage();
    const { apiKey, isApiKeySet } = useApiKey();

    // --- STATE MANAGEMENT ---
    const [productImageFile, setProductImageFile] = useState<File[]>([]);
    const [productImage, setProductImage] = useState<ImageInput | null>(null);
    const [modelImageFile, setModelImageFile] = useState<File[]>([]);
    const [modelImage, setModelImage] = useState<ImageInput | null>(null);
    
    // Settings States
    const [pose, setPose] = useState('Random');
    const [style, setStyle] = useState('Random');
    const [makeup, setMakeup] = useState('Random');
    const [hair, setHair] = useState('Random');
    const [backgroundCategory, setBackgroundCategory] = useState<keyof typeof BACKGROUNDS>('Indoor');
    const [background, setBackground] = useState(BACKGROUNDS['Indoor'][0]);
    const [lighting, setLighting] = useState('Random');
    const [cameraLens, setCameraLens] = useState('Random');
    const [expression, setExpression] = useState('Random');
    const [cameraAngle, setCameraAngle] = useState('Random');
    const [colorGrading, setColorGrading] = useState('Random');
    const [composition, setComposition] = useState('Random');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('9:16');
    
    // Generation States
    const [isGenerating, setIsGenerating] = useState(false);
    const [photos, setPhotos] = useState<Photo[]>(Array.from({ length: 6 }, (_, i) => ({ id: i, status: 'idle' })));
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // --- FILE HANDLERS ---
    const handleProductFileChange = useCallback(async (files: File[]) => {
        setProductImageFile(files);
        if (files.length > 0) {
            setProductImage(await fileToImageInput(files[0]));
            setGlobalError(null);
        } else {
            setProductImage(null);
        }
    }, []);

    const handleModelFileChange = useCallback(async (files: File[]) => {
        setModelImageFile(files);
        if (files.length > 0) setModelImage(await fileToImageInput(files[0]));
        else setModelImage(null);
    }, []);

    // --- PROMPT ENGINEERING ---
    const buildDetailedPrompt = (variationIndex: number): string => {
        const parts: string[] = [];

        // CRITICAL: New instructions for product preservation and naturalness
        parts.push("CRITICAL INSTRUCTION: The uploaded product MUST remain 100% unchanged in color, pattern, logo, and design. Preserve exact product colors and details, no product modification whatsoever. The product must stay identical to the reference image. Only change the model's pose, expression, and the background environment.");

        // Base
        parts.push("ultra-realistic, professional high-resolution product photoshoot, 4K UHD, sharp focus, detailed textures.");
        
        parts.push(modelImage 
            ? "A natural-looking model, who must look IDENTICAL to the provided model image, is showcasing the uploaded product in a genuine and relatable way."
            : "A photorealistic, natural-looking model is showcasing the uploaded product in a genuine and relatable way."
        );

        // Variations for each of the 6 images
        const currentPose = pose === 'Random' ? getRandomItem(POSES.slice(1)) : pose;
        const currentAngle = cameraAngle === 'Random' ? getRandomItem(CAMERA_ANGLES.slice(1)) : cameraAngle;
        const currentExpression = expression === 'Random' ? getRandomItem(EXPRESSIONS.slice(1)) : expression;
        
        const poseVariations = [
            `Pose: ${currentPose}, natural and relaxed.`,
            `Pose: ${currentPose}, looking confidently at the camera.`,
            `Pose: ${currentPose}, candid and looking away.`,
            `Pose: A dynamic variation of ${currentPose}, capturing motion.`,
            `Pose: An elegant and poised version of ${currentPose}.`,
            `Pose: A playful and energetic take on ${currentPose}.`
        ];
        
        parts.push(poseVariations[variationIndex]);
        parts.push(`Camera Angle: ${currentAngle}.`);
        parts.push(`Facial Expression: ${currentExpression}.`);

        // Style
        const currentStyle = style === 'Random' ? getRandomItem(STYLES.slice(1)) : style;
        const currentMakeup = makeup === 'Random' ? getRandomItem(MAKEUP_STYLES.slice(1)) : makeup;
        const currentHair = hair === 'Random' ? getRandomItem(HAIR_STYLES.slice(1)) : hair;
        parts.push(`The fashion style is ${currentStyle}. Makeup is ${currentMakeup}. Hair is styled ${currentHair}.`);

        // Environment
        parts.push(`Background: ${background}.`);
        const currentLighting = lighting === 'Random' ? getRandomItem(LIGHTING.slice(1)) : lighting;
        parts.push(`Lighting: ${currentLighting}, soft and flattering, creating realistic shadows and highlights.`);
        
        // Technicals
        const currentLens = cameraLens === 'Random' ? getRandomItem(CAMERA_LENSES.slice(1)) : cameraLens;
        if(currentLens.includes('85mm')) parts.push('Shot on an 85mm f/1.8 lens, creating beautiful creamy bokeh and subject separation.');
        if(currentLens.includes('35mm')) parts.push('Shot on a wide 35mm f/1.4 lens, capturing the environment.');
        if(currentLens.includes('70-200mm')) parts.push('Shot on a 70-200mm telephoto lens, compressing the background.');
        if(currentLens.includes('Film')) parts.push('The image has an analog film look, with subtle grain and halation.');

        const currentColor = colorGrading === 'Random' ? getRandomItem(COLOR_GRADINGS.slice(1)) : colorGrading;
        const currentComposition = composition === 'Random' ? getRandomItem(COMPOSITIONS.slice(1)) : composition;
        parts.push(`Apply ${currentColor} color grading. Composition follows the ${currentComposition} rule.`);
        
        // Final Polish for Maximum Naturality
        parts.push("Final emphasis on MAXIMUM NATURALITY: ensure visible realistic skin texture (not plastic or over-smoothed), natural hair flow, and realistic clothing drape. The model should interact with the product naturally. Avoid all AI artifacts and uncanny valley effects.");

        return parts.join(' ');
    };

    // --- GENERATION LOGIC ---
    const handleGenerate = async () => {
        if (!isApiKeySet || !productImage) {
            setGlobalError(!isApiKeySet ? 'API Key belum diatur.' : 'Silakan unggah gambar produk.');
            return;
        }

        setIsGenerating(true);
        setGlobalError(null);
        setPhotos(Array.from({ length: 6 }, (_, i) => ({ id: i, status: 'generating' })));

        const generationPromises = Array.from({ length: 6 }).map((_, i) => {
            const prompt = buildDetailedPrompt(i);
            if (modelImage) {
                return mixImages(apiKey, modelImage, productImage, prompt, aspectRatio);
            } else {
                return generateProductPhoto(apiKey, productImage, prompt, aspectRatio);
            }
        });

        const results = await Promise.allSettled(generationPromises);
        
        setPhotos(results.map((result, i) => {
            if (result.status === 'fulfilled') {
                return { id: i, status: 'done', imageData: result.value };
            }
            return { id: i, status: 'error', error: result.reason instanceof Error ? result.reason.message : 'Gagal membuat gambar.' };
        }));

        setIsGenerating(false);
    };
    
    const handleDownload = (imageData: ImageInput) => {
        const link = document.createElement('a');
        link.href = `data:${imageData.mimeType};base64,${imageData.data}`;
        link.download = `product-photo-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-5 xl:col-span-4 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-4">
                <SettingsSection title="Aset Utama" number={1} defaultOpen>
                    <ImageUploader files={productImageFile} onFilesChange={handleProductFileChange} label="Unggah Gambar Produk" />
                    <ImageUploader files={modelImageFile} onFilesChange={handleModelFileChange} label="Unggah Gambar Model (Opsional)" />
                </SettingsSection>

                <SettingsSection title="Pose & Ekspresi" number={2}>
                    <SelectInput label="Pose Model" value={pose} onChange={setPose} options={POSES.map(p => ({value: p, label: p}))} />
                    <SelectInput label="Ekspresi Wajah" value={expression} onChange={setExpression} options={EXPRESSIONS.map(e => ({value: e, label: e}))} />
                </SettingsSection>

                <SettingsSection title="Gaya & Penampilan" number={3}>
                    <SelectInput label="Gaya Fashion" value={style} onChange={setStyle} options={STYLES.map(s => ({value: s, label: s}))} />
                    <SelectInput label="Gaya Riasan" value={makeup} onChange={setMakeup} options={MAKEUP_STYLES.map(m => ({value: m, label: m}))} />
                    <SelectInput label="Gaya Rambut" value={hair} onChange={setHair} options={HAIR_STYLES.map(h => ({value: h, label: h}))} />
                </SettingsSection>

                <SettingsSection title="Latar & Lingkungan" number={4}>
                    <SelectInput label="Kategori Latar" value={backgroundCategory} onChange={(val) => { setBackgroundCategory(val as any); setBackground(BACKGROUNDS[val as keyof typeof BACKGROUNDS][0]); }} options={Object.keys(BACKGROUNDS).map(k => ({value: k, label: k}))} />
                    <SelectInput label="Detail Latar" value={background} onChange={setBackground} options={BACKGROUNDS[backgroundCategory].map(b => ({value: b, label: b}))} />
                </SettingsSection>

                <SettingsSection title="Teknis Fotografi" number={5}>
                    <SelectInput label="Pencahayaan" value={lighting} onChange={setLighting} options={LIGHTING.map(l => ({value: l, label: l}))} />
                    <SelectInput label="Kamera & Lensa" value={cameraLens} onChange={setCameraLens} options={CAMERA_LENSES.map(c => ({value: c, label: c}))} />
                    <SelectInput label="Sudut Kamera" value={cameraAngle} onChange={setCameraAngle} options={CAMERA_ANGLES.map(a => ({value: a, label: a}))} />
                </SettingsSection>

                <SettingsSection title="Penyempurnaan Akhir" number={6}>
                    <SelectInput label="Gradasi Warna" value={colorGrading} onChange={setColorGrading} options={COLOR_GRADINGS.map(c => ({value: c, label: c}))} />
                    <SelectInput label="Komposisi" value={composition} onChange={setComposition} options={COMPOSITIONS.map(c => ({value: c, label: c}))} />
                    <SelectInput label="Rasio Aspek" value={aspectRatio} onChange={(v) => setAspectRatio(v as ImageAspectRatio)} options={[{value: '9:16', label: '9:16 (Story)'}, {value: '1:1', label: '1:1 (Feed)'}, {value: '4:3', label: '4:3 (Klasik)'}]} />
                </SettingsSection>
            </aside>
            <main className="lg:col-span-7 xl:col-span-8 space-y-4">
                 {globalError && <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md border border-red-500/30">{globalError}</div>}
                 <Button onClick={handleGenerate} disabled={isGenerating || !productImage} className="w-full !text-lg !py-3">
                    {isGenerating ? <><Spinner /> Menghasilkan Foto Profesional...</> : 'Generate 6 Foto'}
                 </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {photos.map(photo => (
                        <div key={photo.id} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center relative group overflow-hidden border border-slate-700 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/30">
                             {photo.status === 'generating' && <Spinner className="w-8 h-8" />}
                             {photo.status === 'error' && <p className="text-xs text-red-400 text-center p-2">{photo.error}</p>}
                             {photo.status === 'done' && photo.imageData && (
                                <>
                                    <img src={`data:${photo.imageData.mimeType};base64,${photo.imageData.data}`} alt={`Generated image ${photo.id + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                        <Button onClick={() => setPreviewUrl(`data:${photo.imageData!.mimeType};base64,${photo.imageData!.data}`)} size="sm" className="w-full justify-center"><MagnifyingGlassIcon className="w-4 h-4" /> Pratinjau</Button>
                                        <Button onClick={() => handleDownload(photo.imageData!)} size="sm" variant="secondary" className="w-full justify-center"><DownloadIcon className="w-4 h-4" /> Unduh</Button>
                                    </div>
                                </>
                            )}
                            {photo.status === 'idle' && (
                                <div className="text-center text-slate-700 p-2">
                                    <SparklesIcon className="w-8 h-8 mx-auto" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
        <ImagePreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} imageUrl={previewUrl} />
        </>
    );
};

export default ProductPhotoshoot;
