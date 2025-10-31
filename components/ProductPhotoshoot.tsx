import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { generateProductPhoto } from '../services/geminiService';
import type { ImageInput, ImageAspectRatio } from '../types';
import { ImageUploader } from './ImageUploader';
import SelectInput from './SelectInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';
import { Spinner } from './Spinner';
import { DownloadIcon, MagnifyingGlassIcon, SparklesIcon } from './icons';
import { ImagePreviewModal } from './ImagePreviewModal';

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

type Photo = {
    id: number;
    status: 'idle' | 'generating' | 'done' | 'error';
    imageData?: ImageInput;
    error?: string;
}

const ProductPhotoshoot: React.FC = () => {
    const { t } = useLanguage();
    const { apiKey, isApiKeySet } = useApiKey();

    const [productImageFile, setProductImageFile] = useState<File[]>([]);
    const [productImage, setProductImage] = useState<ImageInput | null>(null);
    const [background, setBackground] = useState('a clean, white marble countertop');
    const [lighting, setLighting] = useState('Studio');
    const [composition, setComposition] = useState('Minimalist');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
    
    const [photos, setPhotos] = useState<Photo[]>(Array.from({ length: 4 }, (_, i) => ({ id: i, status: 'idle' })));
    const [isGenerating, setIsGenerating] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFilesChange = useCallback(async (files: File[]) => {
        setProductImageFile(files);
        if (files.length > 0) {
            const imgInput = await fileToImageInput(files[0]);
            setProductImage(imgInput);
            setGlobalError(null);
        } else {
            setProductImage(null);
        }
    }, []);

    const handleGenerate = async () => {
        if (!isApiKeySet) {
            setGlobalError(t('apiKeyMissingError'));
            return;
        }
        if (!productImage) {
            setGlobalError(t('noProductImageError'));
            return;
        }

        setIsGenerating(true);
        setGlobalError(null);
        setPhotos(Array.from({ length: 4 }, (_, i) => ({ id: i, status: 'generating' })));

        const prompt = `Create a professional, high-resolution ${aspectRatio} product photograph of the subject in the uploaded image. Place it on a background described as: '${background}'. The lighting should be '${lighting}'. The composition should be in a '${composition}' style. The final image should be clean, well-lit, and ready for e-commerce.`;

        // FIX: Added the missing 'aspectRatio' argument to the 'generateProductPhoto' function call to match its definition, which expects four arguments.
        const promises = Array.from({ length: 4 }).map(() => generateProductPhoto(apiKey, productImage, prompt, aspectRatio));

        const results = await Promise.allSettled(promises);

        const newPhotos: Photo[] = results.map((result, i) => {
            if (result.status === 'fulfilled') {
                return { id: i, status: 'done', imageData: result.value };
            } else {
                console.error(`Generation failed for photo ${i + 1}:`, result.reason);
                const errorMessage = result.reason instanceof Error ? result.reason.message : t('generationError');
                return { id: i, status: 'error', error: errorMessage };
            }
        });
        
        setPhotos(newPhotos);
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
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            <aside className="lg:col-span-4 bg-slate-800/50 p-6 border-r border-slate-700 overflow-y-auto">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-xl font-bold text-white">{t('productPhotoTitle')}</h1>
                        <p className="text-sm text-slate-400">{t('productPhotoSubtitle')}</p>
                    </div>
                    <ImageUploader 
                        files={productImageFile}
                        onFilesChange={handleFilesChange}
                        label={t('productImageLabel')}
                    />
                    <TextAreaInput 
                        label={t('backgroundPromptLabel')}
                        value={background}
                        onChange={setBackground}
                        placeholder={t('backgroundPromptPlaceholder')}
                        rows={3}
                    />
                    <SelectInput 
                        label={t('lightingStyleLabel')}
                        value={lighting}
                        onChange={setLighting}
                        options={[
                            { value: 'Studio', label: 'Studio' },
                            { value: 'Natural', label: 'Natural Light' },
                            { value: 'Dramatic', label: 'Dramatic' },
                            { value: 'Soft', label: 'Soft Light' },
                        ]}
                    />
                    <SelectInput 
                        label={t('compositionStyleLabel')}
                        value={composition}
                        onChange={setComposition}
                        options={[
                            { value: 'Minimalist', label: 'Minimalist' },
                            { value: 'Lifestyle', label: 'Lifestyle (in context)' },
                            { value: 'Luxury', label: 'Luxury' },
                            { value: 'Close-up', label: 'Close-up Detail' },
                        ]}
                    />
                    <SelectInput 
                        label={t('aspectRatioLabel')}
                        value={aspectRatio}
                        onChange={(val) => setAspectRatio(val as ImageAspectRatio)}
                        options={[
                            { value: '1:1', label: '1:1 (Square)' },
                            { value: '4:3', label: '4:3 (Landscape)' },
                            { value: '3:4', label: '3:4 (Portrait)' },
                        ]}
                    />
                    {globalError && (
                        <div className="text-center text-red-400 bg-red-900/30 p-2 rounded-lg text-sm">
                            <p>{globalError}</p>
                        </div>
                    )}
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full !text-base">
                        {isGenerating ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                        {isGenerating ? t('generatingPhotos') : t('generatePhotosButton')}
                    </Button>
                </div>
            </aside>
            <main className="lg:col-span-8 bg-slate-900 p-6 md:p-8 overflow-y-auto">
                {photos.every(p => p.status === 'idle') ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-slate-600">
                            <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-300">{t('resultsPlaceholderTitle')}</h2>
                            <p className="mt-2">{t('resultsPlaceholderSubtitle')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {photos.map(photo => (
                            <div key={photo.id} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center relative group overflow-hidden border border-slate-700">
                                {photo.status === 'generating' && <Spinner className="w-10 h-10" />}
                                {photo.status === 'error' && <p className="text-xs text-red-400 p-4 text-center">{photo.error}</p>}
                                {photo.status === 'done' && photo.imageData && (
                                    <>
                                        <img src={`data:${photo.imageData.mimeType};base64,${photo.imageData.data}`} alt={`Generated photo ${photo.id + 1}`} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <Button onClick={() => setPreviewUrl(`data:${photo.imageData!.mimeType};base64,${photo.imageData!.data}`)} size="sm">
                                                <MagnifyingGlassIcon className="w-5 h-5" />
                                                {t('preview')}
                                            </Button>
                                            <Button onClick={() => handleDownload(photo.imageData!)} size="sm" variant="secondary">
                                                <DownloadIcon className="w-5 h-5" />
                                                {t('download')}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
        <ImagePreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} imageUrl={previewUrl} />
        </>
    );
};

export default ProductPhotoshoot;
