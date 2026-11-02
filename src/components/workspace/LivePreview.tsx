import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from './FileExplorer';

interface LivePreviewProps {
  files: WorkspaceFile[];
  projectTitle: string;
}

type PreviewViewport = '100%' | '768px' | '375px';

interface ConsoleLogMessage {
  type: 'log' | 'error' | 'warn';
  text: string;
  timestamp: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ files, projectTitle }) => {
  const [viewportWidth, setViewportWidth] = useState<PreviewViewport>('100%');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleLogMessage[]>([]);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto refresh trigger when files change if autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      const timer = setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
      }, 400); // 400ms debounce
      return () => clearTimeout(timer);
    }
  }, [files, autoRefresh]);

  // Listen for console logs and runtime error messages posted from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.source === 'live-preview-runner') {
        const { type, message } = event.data;
        const now = new Date().toLocaleTimeString();
        setConsoleMessages((prev) => [
          ...prev.slice(-49), // Keep last 50 log messages
          { type: type || 'log', text: String(message), timestamp: now },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Assemble HTML, CSS, and JS into isolated preview srcDoc
  const assembleSrcDoc = () => {
    const htmlFile = files.find((f) => f.language === 'html')?.content || '<h1>No HTML content</h1>';
    const cssContent = files
      .filter((f) => f.language === 'css')
      .map((f) => f.content)
      .join('\n\n');
    const jsContent = files
      .filter((f) => f.language === 'javascript')
      .map((f) => f.content)
      .join('\n\n');

    // Clean body inner HTML
    const cleanedBody = htmlFile.replace(
      /<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<body[^>]*>|<\/body>/gi,
      ''
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* Injected Project CSS */
    ${cssContent}
  </style>
  <script>
    // Injected Runtime Console Interceptor & Error Handler
    (function() {
      function sendToParent(type, message) {
        try {
          window.parent.postMessage({ source: 'live-preview-runner', type: type, message: message }, '*');
        } catch(e) {}
      }

      window.onerror = function(msg, url, lineNo, columnNo, error) {
        sendToParent('error', 'Runtime Error (Line ' + lineNo + '): ' + msg);
        return false;
      };

      const origLog = console.log;
      console.log = function() {
        origLog.apply(console, arguments);
        var args = Array.prototype.slice.call(arguments).map(String).join(' ');
        sendToParent('log', args);
      };

      const origError = console.error;
      console.error = function() {
        origError.apply(console, arguments);
        var args = Array.prototype.slice.call(arguments).map(String).join(' ');
        sendToParent('error', args);
      };
    })();
  </script>
</head>
<body>
  ${cleanedBody}
  <script>
    // Injected Project JS
    try {
      ${jsContent}
    } catch(err) {
      console.error('Script Parse/Execution Error: ' + err.message);
    }
  </script>
</body>
</html>`;
  };

  const srcDoc = assembleSrcDoc();

  return (
    <section className="w-full h-full bg-[#0E0E10] flex flex-col overflow-hidden relative select-none">
      {/* Preview Header Toolbar */}
      <div className="px-4 py-2 bg-[#141414] border-b border-[#303030] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E5484D] text-lg">preview</span>
          <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
            Live Preview
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-[#8E8E8E] bg-[#1B1B1B] px-2 py-0.5 rounded border border-[#303030]">
            Isolated Frame
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Viewport Modes */}
          <div className="flex items-center gap-1 bg-[#0B0B0B] p-1 rounded-lg border border-[#303030]">
            <button
              onClick={() => setViewportWidth('100%')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                viewportWidth === '100%'
                  ? 'bg-[#E5484D] text-white font-bold'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              Desktop
            </button>
            <button
              onClick={() => setViewportWidth('768px')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                viewportWidth === '768px'
                  ? 'bg-[#E5484D] text-white font-bold'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              Tablet
            </button>
            <button
              onClick={() => setViewportWidth('375px')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                viewportWidth === '375px'
                  ? 'bg-[#E5484D] text-white font-bold'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              Mobile
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer border ${
              autoRefresh
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                : 'bg-[#1B1B1B] text-[#8E8E8E] border-[#303030]'
            }`}
            title="Auto-refresh on code edits"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="hidden md:inline">Auto</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="p-1 rounded bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors cursor-pointer"
            title="Refresh Preview"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>

          {/* Fullscreen / Popout */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors cursor-pointer"
            title="Toggle Fullscreen Preview Modal"
          >
            <span className="material-symbols-outlined text-sm">open_in_full</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto bg-[#050505] p-3 flex flex-col items-center justify-center relative">
        <div
          style={{ width: viewportWidth }}
          className="h-full max-h-full bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 border border-[#303030] flex flex-col"
        >
          {/* Address Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0 select-none">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-600 truncate">
              https://preview.studio.local/{projectTitle.toLowerCase().replace(/\s+/g, '-')}
            </div>
          </div>

          {/* Sandboxed Iframe */}
          <iframe
            key={refreshKey}
            title="Live Website Preview"
            sandbox="allow-scripts allow-modals"
            srcDoc={srcDoc}
            className="w-full flex-1 border-0 bg-white"
          />
        </div>
      </div>

      {/* Console Messages Bar at Bottom */}
      <div className="border-t border-[#303030] bg-[#141414] shrink-0">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="w-full px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#B0B0B0] hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-[#E5484D]">terminal</span>
            <span>Console Log ({consoleMessages.length})</span>
            {consoleMessages.some((m) => m.type === 'error') && (
              <span className="px-1.5 py-0.5 text-[9px] bg-rose-950 text-rose-400 rounded border border-rose-500/40 font-bold">
                Errors Detected
              </span>
            )}
          </div>
          <span className="material-symbols-outlined text-xs">
            {showConsole ? 'expand_more' : 'expand_less'}
          </span>
        </button>

        {showConsole && (
          <div className="h-32 bg-[#0B0B0B] p-2 overflow-y-auto font-mono text-[10px] space-y-1 border-t border-[#222]">
            {consoleMessages.length === 0 ? (
              <p className="text-[#505050] italic p-1">No console messages logged yet.</p>
            ) : (
              consoleMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-1 rounded ${
                    msg.type === 'error'
                      ? 'bg-rose-950/30 text-rose-300'
                      : msg.type === 'warn'
                      ? 'bg-amber-950/30 text-amber-300'
                      : 'text-[#D4D4D4]'
                  }`}
                >
                  <span className="text-[#505050] shrink-0">{msg.timestamp}</span>
                  <span className="break-all">{msg.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 p-4 flex flex-col backdrop-blur-md">
          <div className="flex items-center justify-between py-2 px-4 bg-[#141414] rounded-t-xl border border-[#303030] text-white">
            <span className="font-bold font-display text-sm">Fullscreen Live Preview</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1 text-[#8E8E8E] hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex-1 bg-white rounded-b-xl overflow-hidden border-x border-b border-[#303030]">
            <iframe
              title="Fullscreen Live Preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </section>
  );
};
