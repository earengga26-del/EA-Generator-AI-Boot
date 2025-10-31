import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Spinner } from './Spinner';
import { AuthInput } from './AuthInput';
import Button from './Button';

const SuccessPopup = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm m-4 p-6 border border-slate-700 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center items-center mx-auto h-12 w-12 rounded-full bg-green-500/20">
          <i className="fa-solid fa-check text-2xl text-green-400"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium text-white">Pendaftaran Berhasil</h3>
        <p className="mt-2 text-sm text-gray-400">
          Silakan hubungi admin ct. terimakasih.
        </p>
        <div className="mt-6">
          <Button onClick={onClose} className="w-full justify-center">
            Mengerti
          </Button>
        </div>
      </div>
    </div>
);

const ActivationPopup = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm m-4 p-6 border border-slate-700 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center items-center mx-auto h-12 w-12 rounded-full bg-yellow-500/20">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-yellow-400"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium text-white">Aktivasi Diperlukan</h3>
        <p className="mt-2 text-sm text-gray-400">
          Akun Anda belum diaktifkan Admin, silahkan hubungi admin.
        </p>
        <div className="mt-6">
          <Button onClick={onClose} className="w-full justify-center">
            Mengerti
          </Button>
        </div>
      </div>
    </div>
);

const AuthPage: React.FC = () => {
    const { login, register } = useAuth();
    const { t } = useLanguage();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('admin@gmail.com');
    const [password, setPassword] = useState('123456');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showActivationPopup, setShowActivationPopup] = useState(false);
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            errors.email = t('emailRequired');
        } else if (!emailRegex.test(email)) {
            errors.email = t('emailInvalid');
        }

        if (!password) {
            errors.password = t('passwordRequired');
        } else if (password.length < 6) {
            errors.password = t('passwordMinLength');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password);
                setShowSuccessPopup(true);
            }
        } catch (err: any) {
             const defaultError = 'Terjadi kesalahan yang tidak diketahui.';
             let errorMessage = err.message || defaultError;

             if (errorMessage.includes("Akun Anda belum diaktifkan oleh administrator")) {
                setShowActivationPopup(true);
             } else {
                 if (errorMessage.includes("Invalid login credentials")) {
                    errorMessage = "Email atau password salah. Silakan coba lagi.";
                 } else if (errorMessage.includes("User not found")) {
                     errorMessage = "Pengguna tidak ditemukan.";
                 } else if (errorMessage.includes("rate limit")) {
                     errorMessage = "Terlalu banyak percobaan. Silakan coba lagi nanti.";
                 }
                setError(errorMessage);
             }
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setError(null);
        setFormErrors({});
        setEmail('');
        setPassword('');
    }

    const handleClosePopup = () => {
        setShowSuccessPopup(false);
        switchMode('login');
    };

    return (
        <>
            <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4">
                <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                    {/* Left Panel */}
                    <div className="relative hidden md:flex flex-col items-center justify-center p-12 bg-slate-900 text-white text-center">
                        <div className="absolute inset-0 bg-grid-slate-800 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                        <div className="absolute inset-0 mix-blend-lighten opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]">
                            <div className="absolute inset-[-200%] bg-[conic-gradient(from_90deg_at_50%_50%,#21283a_0%,#3b82f6_50%,#21283a_100%)] animate-[spin_10s_linear_infinite]"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                             <div className="flex items-center gap-3">
                                <svg className="w-9 h-9 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 15.4734 3.91291 18.4418 6.86312 20.108" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M15 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="text-2xl font-bold tracking-wider"><span className="text-blue-400">EA-AI</span> Studio</span>
                            </div>
                            <h1 className="text-3xl font-bold mt-8">Selamat Datang Kembali</h1>
                            <p className="mt-2 text-slate-400">Masuk untuk mengakses semua alat AI kreatif dan lanjutkan proyek Anda.</p>
                        </div>
                    </div>
                    {/* Right Panel */}
                    <div className="p-8 sm:p-12 bg-slate-800">
                        <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Login ke Akun Anda' : 'Buat Akun Baru'}</h2>
                        <p className="mt-2 text-sm text-slate-400">{mode === 'login' ? 'Akses Member Area EA-AI.' : 'Mulai perjalanan kreatif Anda hari ini.'}</p>
                        
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                             <div>
                                <AuthInput
                                    id="email"
                                    label="Email"
                                    type="email"
                                    placeholder="anda@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {formErrors.email && <p className="text-xs text-red-400 mt-1 pl-1">{formErrors.email}</p>}
                            </div>
                             <div>
                                <AuthInput
                                    id="password"
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                {formErrors.password && <p className="text-xs text-red-400 mt-1 pl-1">{formErrors.password}</p>}
                            </div>
                            
                            {mode === 'login' && (
                                <div className="text-right">
                                    <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300">Lupa Password?</a>
                                </div>
                            )}

                            {error && <p className="text-xs text-center text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    {loading ? <Spinner /> : (mode === 'login' ? 'Login' : 'Daftar')}
                                </button>
                            </div>

                            <div className="text-center text-sm">
                                {mode === 'login' ? (
                                    <p className="text-slate-400">Belum punya akun? <button type="button" onClick={() => switchMode('register')} className="font-medium text-blue-400 hover:text-blue-300">Daftar di sini</button></p>
                                ) : (
                                    <p className="text-slate-400">Sudah punya akun? <button type="button" onClick={() => switchMode('login')} className="font-medium text-blue-400 hover:text-blue-300">Login di sini</button></p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showSuccessPopup && <SuccessPopup onClose={handleClosePopup} />}
            {showActivationPopup && <ActivationPopup onClose={() => setShowActivationPopup(false)} />}
            <style>{`
                .bg-grid-slate-800 {
                    background-image: linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px);
                    background-size: 40px 40px;
                    background-color: transparent;
                    opacity: 0.1;
                }
                @keyframes fadeIn {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast {
                  animation: fadeIn 0.2s ease-in-out;
                }
            `}</style>
        </>
    );
};

export default AuthPage;