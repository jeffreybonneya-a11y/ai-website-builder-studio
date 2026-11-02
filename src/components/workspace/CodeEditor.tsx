import React, { useRef, useEffect } from 'react';
import { WorkspaceFile } from './FileExplorer';

interface CodeEditorProps {
  file: WorkspaceFile | null;
  isDirty?: boolean;
  saving?: boolean;
  onChangeContent: (fileId: string, newContent: string) => void;
  onSave: () => void;
  onToggleAssistant?: () => void;
  assistantOpen?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  isDirty = false,
  saving = false,
  onChangeContent,
  onSave,
  onToggleAssistant,
  assistantOpen = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync line numbers scroll position with main editor textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Intercept Tab and Enter keys for smooth indentation experience
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!file) return;

    // Ctrl+S / Cmd+S Hotkey
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onSave();
      return;
    }

    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = file.content;

      const newContent = val.substring(0, start) + '  ' + val.substring(end);
      onChangeContent(file.id, newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Enter key auto-indents matching previous line indentation
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const val = file.content;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';

      if (indent.length > 0) {
        e.preventDefault();
        const newContent = val.substring(0, start) + '\n' + indent + val.substring(start);
        onChangeContent(file.id, newContent);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Simple Code Formatter for JSON, HTML, CSS, JS
  const handleFormatCode = () => {
    if (!file) return;
    try {
      if (file.language === 'json') {
        const parsed = JSON.parse(file.content);
        onChangeContent(file.id, JSON.stringify(parsed, null, 2));
      } else {
        // Basic line-based trimming & bracket indentation formatting for CSS/HTML/JS
        const formatted = file.content
          .split('\n')
          .map((line) => line.trimEnd())
          .join('\n');
        onChangeContent(file.id, formatted);
      }
    } catch {
      // Ignore format errors if invalid syntax
    }
  };

  if (!file) {
    return (
      <div className="w-full h-full bg-[#0B0B0B] border-r border-[#303030] flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
        <span className="material-symbols-outlined text-4xl text-[#303030]">data_object</span>
        <h3 className="text-sm font-bold text-white font-display">No File Selected</h3>
        <p className="text-xs text-[#8E8E8E] max-w-xs font-body">
          Select a file from the Project Files tree to edit content.
        </p>
      </div>
    );
  }

  const lines = file.content.split('\n');

  const getLanguageLabel = (lang: WorkspaceFile['language']) => {
    switch (lang) {
      case 'html':
        return 'HTML5 Document';
      case 'css':
        return 'CSS3 Stylesheet';
      case 'javascript':
        return 'JavaScript (ES6+)';
      case 'json':
        return 'JSON Config';
      default:
        return 'Plain Text';
    }
  };

  return (
    <main className="w-full h-full bg-[#0B0B0B] border-r border-[#303030] flex flex-col overflow-hidden">
      {/* Editor Header Bar */}
      <div className="px-4 py-2 bg-[#141414] border-b border-[#303030] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#1B1B1B] border border-[#303030]">
            <span className="material-symbols-outlined text-sm text-[#E5484D]">description</span>
            <span className="text-xs font-mono font-bold text-white truncate max-w-[150px]">
              {file.name}
            </span>
            {isDirty && (
              <span
                className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                title="Unsaved Local Edits"
              ></span>
            )}
          </div>
          <span className="hidden sm:inline text-[11px] font-mono text-[#8E8E8E]">
            {getLanguageLabel(file.language)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Format Code Button */}
          <button
            onClick={handleFormatCode}
            className="px-2.5 py-1 rounded bg-[#1B1B1B] hover:bg-[#222222] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            title="Format Code Indentation"
          >
            <span className="material-symbols-outlined text-xs">auto_fix</span>
            <span className="hidden md:inline">Format</span>
          </button>

          {/* Toggle Assistant Drawer Button */}
          {onToggleAssistant && (
            <button
              onClick={onToggleAssistant}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                assistantOpen
                  ? 'bg-[#E5484D] text-white border-[#E5484D]'
                  : 'bg-[#1B1B1B] hover:bg-[#222222] text-[#B0B0B0] hover:text-white border-[#303030]'
              }`}
              title="Toggle Beginner Assistant & Snippets"
            >
              <span className="material-symbols-outlined text-xs">school</span>
              <span className="hidden md:inline">Helper</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isDirty
                ? 'bg-[#E5484D] hover:bg-[#d43d42] text-white shadow-[#E5484D]/20 animate-pulse'
                : 'bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border border-[#303030]'
            }`}
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xs">save</span>
                <span>Save</span>
                <span className="hidden lg:inline text-[9px] opacity-70 bg-black/30 px-1 rounded">
                  Ctrl+S
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 overflow-hidden bg-[#0B0B0B] flex relative">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="select-none bg-[#0E0E10] text-[#505050] py-3 pl-3 pr-2 text-right border-r border-[#222222] shrink-0 font-mono text-xs leading-6 overflow-hidden space-y-0 text-[11px]"
        >
          {lines.map((_, idx) => (
            <div key={idx} className="h-6">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Textarea Editor Input Area */}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChangeContent(file.id, e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 h-full w-full bg-transparent text-[#E0E0E0] p-3 font-mono text-xs leading-6 resize-none focus:outline-none whitespace-pre overflow-auto scrollbar-thin scrollbar-thumb-[#303030]"
        />
      </div>

      {/* Editor Status Bar */}
      <div className="px-4 py-1.5 bg-[#0E0E10] border-t border-[#303030] flex items-center justify-between text-[11px] font-mono text-[#8E8E8E] shrink-0">
        <div className="flex items-center gap-3">
          <span>Lines: {lines.length}</span>
          <span>Chars: {file.content.length}</span>
          <span className="hidden sm:inline">Spaces: 2</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Unsaved Edits</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Cloud Synced</span>
            </span>
          )}
          <span className="hidden md:inline bg-[#1B1B1B] text-[#B0B0B0] px-1.5 py-0.5 rounded border border-[#303030]">
            UTF-8
          </span>
        </div>
      </div>
    </main>
  );
};
