import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { SettingsIcon, CheckCircleIcon, ExclamationCircleIcon, EyeIcon, EyeOffIcon } from './icons';
import Button from './Button';
import { validateApiKey } from '../services/geminiService';
import { Spinner } from './Spinner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ValidationStatus = 'idle' | 'testing' | 'valid' | 'invalid';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  // FIX: Removed `setApiKey` as it's no longer provided by the `ApiKeyContext` to prevent direct user modification of the key.
  const { apiKey } = useApiKey();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
    // Reset validation status when modal is opened or key changes
    setValidationStatus('idle');
    setIsKeyVisible(false); // Hide key when modal opens
  }, [apiKey, isOpen]);

  useEffect(() => {
    // Reset validation status if the user modifies the key after testing
    // This input is now read-only, but this logic remains for the test functionality
    setValidationStatus('idle');
  }, [localApiKey]);

  const handleTestKey = async () => {
    if (!localApiKey) {
        setValidationStatus('invalid');
        return;
    }
    setValidationStatus('testing');
    const isValid = await validateApiKey(localApiKey);
    setValidationStatus(isValid ? 'valid' : 'invalid');
  };

  const handleCopyKey = () => {
    if (localApiKey) {
        navigator.clipboard.writeText(localApiKey);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const renderValidationStatus = () => {
      switch (validationStatus) {
        case 'testing':
          return (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Spinner className="w-4 h-4" />
              {t('apiKeyTesting')}
            </div>
          );
        case 'valid':
          return (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              {t('apiKeyValid')}
            </div>
          );
        case 'invalid':
          return (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <ExclamationCircleIcon className="w-5 h-5" />
              {t('apiKeyInvalid')}
            </div>
          );
        default:
          return null;
      }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 p-6 border border-gray-700 text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-6 h-6" />
            {t('settingsTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        
        <div className="space-y-4">
            <div>
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
                {t('apiKeyLabel')}
              </label>
              
              {/* Petunjuk cara mendapatkan API Key */}
              <div className="mb-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm text-gray-300">
                <p className="font-semibold text-blue-300 mb-2">📘 Cara Mendapatkan API Key:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Buka <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a></li>
                  <li>Login dengan akun Google Anda</li>
                  <li>Klik tombol "Create API Key" atau "Get API Key"</li>
                  <li>Pilih project atau buat project baru</li>
                  <li>Salin API Key yang muncul</li>
                  <li>Simpan API Key Anda di tempat yang aman</li>
                </ol>
                <p className="mt-2 text-yellow-300 text-xs">💡 <strong>Catatan:</strong> Jangan bagikan API Key Anda kepada siapa pun!</p>
              </div>

              <div className="relative">
                <input
                  type={isKeyVisible ? 'text' : 'password'}
                  id="api-key-input"
                  value={localApiKey}
                  readOnly // Key is not user-configurable
                  placeholder={t('apiKeyPlaceholder')}
                  className="w-full bg-gray-900/80 border border-gray-700 text-white rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                />
                <button
                    type="button"
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                >
                    {isKeyVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className="h-6 mt-2 flex items-center">
                  {renderValidationStatus()}
              </div>
            </div>
            {/* FIX: Removed the "Save" button and related logic, as the API key is no longer user-configurable. */}
            <div className="pt-4 flex items-center gap-3">
                <Button
                    variant="secondary" 
                    onClick={handleTestKey} 
                    className="w-full" 
                    disabled={validationStatus === 'testing' || !localApiKey}
                >
                    {t('testApiKeyButton')}
                </Button>
                <Button
                    variant="secondary" 
                    onClick={handleCopyKey} 
                    className="w-full" 
                    disabled={!localApiKey}
                >
                    {copySuccess ? t('apiKeyCopied') : t('copyApiKeyButton')}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
   
export default SettingsModal;
