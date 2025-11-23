import React, { useState, useEffect } from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface GeneratorProps {
  initialUrl: string | null;
  onUrlConfirm: (url: string) => void;
  onReset?: () => void;
  onForceOpen?: () => void;
}

export const Generator: React.FC<GeneratorProps> = ({ initialUrl, onUrlConfirm, onReset, onForceOpen }) => {
  const [inputUrl, setInputUrl] = useState(initialUrl || '');
  const [isConfirmed, setIsConfirmed] = useState(!!initialUrl);
  
  const activeUrl = isConfirmed ? (inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`) : null;
  const { iconUrl } = usePwaSetup(activeUrl);

  useEffect(() => {
    if (initialUrl) {
      setInputUrl(initialUrl);
      setIsConfirmed(true);
    }
  }, [initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    
    let formattedUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
    }
    
    setInputUrl(formattedUrl);
    setIsConfirmed(true);
    onUrlConfirm(formattedUrl);
  };

  const handleResetInternal = () => {
    setIsConfirmed(false);
    setInputUrl('');
    if (onReset) onReset();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        
        {!isConfirmed && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-3 text-white">
              PWA <span className="text-blue-500">Maker</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Crie um aplicativo nativo a partir de qualquer link.
            </p>
          </div>
        )}

        {!isConfirmed ? (
          <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
            <label htmlFor="url-input" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">
              Cole o link aqui
            </label>
            <div className="relative">
              <input
                type="text"
                id="url-input"
                className="block w-full px-4 py-4 bg-slate-900 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-white placeholder-slate-600 outline-none transition-all"
                placeholder="ex: instagram.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/50 text-lg"
            >
              Gerar Aplicativo
            </button>
          </form>
        ) : (
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center">
             
             {/* Logo Section */}
             <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 bg-slate-900 rounded-[28px] mb-4 flex items-center justify-center shadow-2xl ring-1 ring-white/10 overflow-hidden">
                   {iconUrl ? (
                       <img 
                        src={iconUrl} 
                        alt="App Icon" 
                        className="w-full h-full object-cover" 
                        loading="eager"
                       />
                   ) : (
                       <span className="text-5xl">📱</span>
                   )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {usePwaSetup(activeUrl) && document.title}
                </h2>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Configurado
                </div>
             </div>

             {/* Manual Open Button */}
             <button
               onClick={onForceOpen}
               className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-6 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
             >
               <span>ABRIR APP AGORA</span>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </button>

             <div className="space-y-4 text-left">
                <div className="bg-slate-900/50 border border-slate-700 p-5 rounded-2xl">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.8-1.31.02-2.3-1.23-3.14-2.47-1.71-2.5-3.02-7.07-1.26-10.12 0.87-1.51 2.43-2.47 4.13-2.5 1.29-.02 2.51.87 3.3.87.78 0 2.25-1.07 3.8-0.91 0.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.39 2.8zM13 3.5c.73-.83 1.21-1.96 1.08-3.11-1.04.04-2.3.69-3.05 1.55-.67.76-1.26 1.99-1.1 3.08 1.16.09 2.34-.69 3.07-1.52z"/></svg>
                        Para Instalar no iOS
                    </h3>
                    <ol className="list-none space-y-3 text-sm text-slate-400">
                        <li className="flex items-start gap-3">
                           <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-white">1</span>
                           <span>Toque em <strong>Compartilhar</strong> <svg className="w-4 h-4 inline text-blue-400 mx-1 align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg></span>
                        </li>
                        <li className="flex items-start gap-3">
                           <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-white">2</span>
                           <span>Escolha <strong>Adicionar à Tela de Início</strong>.</span>
                        </li>
                    </ol>
                </div>
             </div>

             <button 
                onClick={handleResetInternal}
                className="mt-8 text-sm text-slate-500 hover:text-white underline underline-offset-4 transition-colors"
             >
                Criar um novo app
             </button>
          </div>
        )}
      </div>
    </div>
  );
};