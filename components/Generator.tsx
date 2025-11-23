import React, { useState, useEffect } from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface GeneratorProps {
  initialUrl: string | null;
  onUrlConfirm: (url: string) => void;
}

export const Generator: React.FC<GeneratorProps> = ({ initialUrl, onUrlConfirm }) => {
  const [inputUrl, setInputUrl] = useState(initialUrl || '');
  const [isConfirmed, setIsConfirmed] = useState(!!initialUrl);
  
  // Trigger the hook logic when we have a valid confirmed URL
  const activeUrl = isConfirmed ? (inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`) : null;
  const { iconUrl } = usePwaSetup(activeUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    
    let formattedUrl = inputUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
    }
    
    setInputUrl(formattedUrl);
    setIsConfirmed(true);
    onUrlConfirm(formattedUrl);
  };

  const handleReset = () => {
    setIsConfirmed(false);
    setInputUrl('');
    window.history.replaceState(null, '', '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            PWA Maker
          </h1>
          <p className="text-slate-400">
            Transforme qualquer site em um aplicativo nativo.
          </p>
        </div>

        {!isConfirmed ? (
          <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-xl">
            <label htmlFor="url-input" className="block text-sm font-medium text-slate-300 mb-2">
              URL do Site
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                id="url-input"
                className="block w-full px-4 py-4 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
                placeholder="ex: instagram.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/50"
            >
              Gerar Aplicativo
            </button>
          </form>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-xl animate-fade-in">
             <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-slate-700 rounded-2xl mb-4 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-blue-500/20">
                   {iconUrl ? (
                       <img src={iconUrl} alt="App Icon" className="w-full h-full object-cover" />
                   ) : (
                       <span className="text-4xl">📱</span>
                   )}
                </div>
                <h2 className="text-xl font-semibold">{new URL(activeUrl!).hostname}</h2>
                <p className="text-sm text-slate-400 break-all">{activeUrl}</p>
             </div>

             <div className="space-y-6">
                <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-300 flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 18h.01M12 18h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4"></path></svg>
                        Instruções para iOS
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                        <li>Toque no botão <strong>Compartilhar</strong> <svg className="w-4 h-4 inline text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> na barra do navegador.</li>
                        <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <span className="inline-block border border-slate-500 rounded px-1 text-xs bg-slate-700">+</span>.</li>
                        <li>Confirme o nome e toque em <strong>Adicionar</strong>.</li>
                    </ol>
                </div>

                 <div className="bg-slate-700/30 border border-slate-600 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-300 flex items-center gap-2 mb-2">
                        Instruções para Android
                    </h3>
                    <p className="text-sm text-slate-400">
                        Toque no menu do Chrome (três pontos) e selecione <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.
                    </p>
                </div>
             </div>

             <button 
                onClick={handleReset}
                className="mt-8 w-full bg-transparent hover:bg-slate-700 text-slate-400 font-medium py-3 px-4 rounded-lg border border-slate-600 transition-colors"
             >
                Criar outro app
             </button>
          </div>
        )}

        <div className="text-center text-xs text-slate-600">
          <p>Nota: Alguns sites (ex: Google, Facebook) podem bloquear a exibição dentro de outros apps por segurança.</p>
        </div>

      </div>
    </div>
  );
};
