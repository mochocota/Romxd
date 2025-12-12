import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

// --- Types ---

type ToastType = 'success' | 'error' | 'info' | 'warning';
type DialogType = 'alert' | 'confirm' | 'prompt';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface DialogConfig {
  type: DialogType;
  title: string;
  message?: string;
  placeholder?: string; // For prompt
  confirmText?: string;
  cancelText?: string;
  resolve: (value: any) => void;
}

interface UIContextType {
  toast: {
    success: (msg: string, title?: string) => void;
    error: (msg: string, title?: string) => void;
    info: (msg: string, title?: string) => void;
    warning: (msg: string, title?: string) => void;
  };
  dialog: {
    alert: (title: string, message?: string) => Promise<void>;
    confirm: (title: string, message?: string) => Promise<boolean>;
    prompt: (title: string, message?: string, placeholder?: string) => Promise<string | null>;
  };
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const promptInputRef = useRef<HTMLInputElement>(null);

  // --- Toast Logic ---

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);
    
    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, title?: string) => addToast('success', msg, title),
    error: (msg: string, title?: string) => addToast('error', msg, title),
    info: (msg: string, title?: string) => addToast('info', msg, title),
    warning: (msg: string, title?: string) => addToast('warning', msg, title),
  };

  // --- Dialog Logic ---

  const showDialog = useCallback((config: Omit<DialogConfig, 'resolve'>): Promise<any> => {
    return new Promise((resolve) => {
      setDialogConfig({ ...config, resolve });
      if (config.type === 'prompt') {
        setPromptInput('');
        setTimeout(() => promptInputRef.current?.focus(), 100);
      }
    });
  }, []);

  const closeDialog = () => {
    if (dialogConfig) {
      // If closing without action (e.g. clicking backdrop), treat as cancel
      if (dialogConfig.type === 'confirm') dialogConfig.resolve(false);
      if (dialogConfig.type === 'prompt') dialogConfig.resolve(null);
      if (dialogConfig.type === 'alert') dialogConfig.resolve(undefined);
    }
    setDialogConfig(null);
  };

  const handleConfirm = () => {
    if (!dialogConfig) return;
    
    if (dialogConfig.type === 'prompt') {
      dialogConfig.resolve(promptInput);
    } else if (dialogConfig.type === 'confirm') {
      dialogConfig.resolve(true);
    } else {
      dialogConfig.resolve(undefined);
    }
    setDialogConfig(null);
  };

  const handleCancel = () => {
    if (!dialogConfig) return;
    
    if (dialogConfig.type === 'confirm') dialogConfig.resolve(false);
    if (dialogConfig.type === 'prompt') dialogConfig.resolve(null);
    if (dialogConfig.type === 'alert') dialogConfig.resolve(undefined);
    
    setDialogConfig(null);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogConfig) handleCancel();
      if (e.key === 'Enter' && dialogConfig && dialogConfig.type !== 'alert') {
          // Prevent enter from triggering if it's a textarea/input unless focused? 
          // For simple prompt/confirm, Enter usually means confirm
          handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogConfig, promptInput]);

  const dialog = {
    alert: (title: string, message?: string) => 
      showDialog({ type: 'alert', title, message, confirmText: 'Entendido' }),
    confirm: (title: string, message?: string) => 
      showDialog({ type: 'confirm', title, message, confirmText: 'Confirmar', cancelText: 'Cancelar' }),
    prompt: (title: string, message?: string, placeholder?: string) => 
      showDialog({ type: 'prompt', title, message, placeholder, confirmText: 'Aceptar', cancelText: 'Cancelar' }),
  };

  return (
    <UIContext.Provider value={{ toast, dialog }}>
      {children}
      
      {/* --- TOASTS RENDER --- */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`pointer-events-auto bg-white dark:bg-[#222] border-l-4 shadow-lg rounded-r p-4 flex gap-3 items-start animate-slideInRight transform transition-all duration-300
              ${t.type === 'success' ? 'border-green-500' : ''}
              ${t.type === 'error' ? 'border-red-500' : ''}
              ${t.type === 'info' ? 'border-blue-500' : ''}
              ${t.type === 'warning' ? 'border-yellow-500' : ''}
            `}
          >
            <div className="shrink-0 pt-0.5">
               {t.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
               {t.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
               {t.type === 'info' && <Info className="text-blue-500" size={20} />}
               {t.type === 'warning' && <AlertTriangle className="text-yellow-500" size={20} />}
            </div>
            <div className="flex-1">
                {t.title && <h4 className="font-bold text-sm text-zinc-800 dark:text-white">{t.title}</h4>}
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* --- DIALOG RENDER --- */}
      {dialogConfig && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-md rounded-xl shadow-2xl border border-gray-100 dark:border-[#333] overflow-hidden animate-scaleIn">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">{dialogConfig.title}</h3>
                    {dialogConfig.message && (
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            {dialogConfig.message}
                        </p>
                    )}

                    {dialogConfig.type === 'prompt' && (
                        <input
                            ref={promptInputRef}
                            type="text"
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            placeholder={dialogConfig.placeholder}
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#444] rounded p-3 text-zinc-800 dark:text-white mb-6 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                        />
                    )}

                    <div className="flex justify-end gap-3">
                        {dialogConfig.type !== 'alert' && (
                             <button 
                                onClick={handleCancel}
                                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-[#333] rounded font-medium transition-colors"
                             >
                                 {dialogConfig.cancelText || 'Cancelar'}
                             </button>
                        )}
                        <button 
                            onClick={handleConfirm}
                            className={`px-6 py-2 rounded font-bold text-white shadow-lg transition-transform active:scale-95
                                ${dialogConfig.type === 'confirm' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}
                            `}
                        >
                            {dialogConfig.confirmText || 'Aceptar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};