import React, { useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { sql } from '@codemirror/lang-sql';
import { keymap, EditorView } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
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

// Custom Obsidian Crimson Native CodeMirror 6 Theme
export const obsidianCrimsonEditorTheme = EditorView.theme(
  {
    '&': {
      color: '#E0E0E0',
      backgroundColor: '#0B0B0B',
      height: '100%',
      fontSize: '12px',
    },
    '.cm-content': {
      caretColor: '#E5484D',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#E5484D',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#E5484D35',
    },
    '.cm-gutters': {
      backgroundColor: '#0E0E10',
      color: '#505050',
      borderRight: '1px solid #222222',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161618',
      color: '#E5484D',
    },
    '.cm-activeLine': {
      backgroundColor: '#161618',
    },
  },
  { dark: true }
);

export const obsidianCrimsonHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: '#6E7681', fontStyle: 'italic' },
  { tag: t.variableName, color: '#E0E0E0' },
  { tag: [t.string, t.special(t.brace)], color: '#34D399' },
  { tag: t.number, color: '#FBBF24' },
  { tag: t.bool, color: '#F87171' },
  { tag: t.null, color: '#F87171' },
  { tag: t.keyword, color: '#E5484D', fontWeight: 'bold' },
  { tag: t.operator, color: '#F87171' },
  { tag: t.className, color: '#60A5FA' },
  { tag: t.definition(t.typeName), color: '#60A5FA' },
  { tag: t.typeName, color: '#60A5FA' },
  { tag: t.angleBracket, color: '#9CA3AF' },
  { tag: t.tagName, color: '#E5484D' },
  { tag: t.attributeName, color: '#FBBF24' },
]);

export const obsidianCrimsonTheme = [
  obsidianCrimsonEditorTheme,
  syntaxHighlighting(obsidianCrimsonHighlightStyle),
];

export function getLanguageExtension(language: WorkspaceFile['language'], fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (language === 'html' || ext === 'html' || ext === 'htm') return html();
  if (language === 'css' || ext === 'css') return css();
  if (language === 'javascript' || ext === 'js' || ext === 'jsx')
    return javascript({ jsx: true, typescript: false });
  if (language === 'typescript' || ext === 'ts' || ext === 'tsx')
    return javascript({ jsx: true, typescript: true });
  if (language === 'json' || ext === 'json') return json();
  if (language === 'python' || ext === 'py') return python();
  if (language === 'java' || ext === 'java') return java();
  if (language === 'cpp' || language === 'c' || ext === 'cpp' || ext === 'c' || ext === 'h')
    return cpp();
  if (language === 'php' || ext === 'php') return php();
  if (language === 'sql' || ext === 'sql') return sql();
  return html();
}

export function getLanguageMeta(lang: WorkspaceFile['language'], fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (lang === 'html' || ext === 'html' || ext === 'htm')
    return { name: 'HTML5 Document', isPreviewable: true };
  if (lang === 'css' || ext === 'css')
    return { name: 'CSS3 Stylesheet', isPreviewable: true };
  if (lang === 'javascript' || ext === 'js' || ext === 'jsx')
    return { name: 'JavaScript (ES6+)', isPreviewable: true };
  if (lang === 'typescript' || ext === 'ts' || ext === 'tsx')
    return { name: 'TypeScript / React', isPreviewable: true };
  if (lang === 'json' || ext === 'json')
    return { name: 'JSON Config', isPreviewable: true };
  if (lang === 'python' || ext === 'py')
    return { name: 'Python 3', isPreviewable: false };
  if (lang === 'java' || ext === 'java')
    return { name: 'Java', isPreviewable: false };
  if (lang === 'cpp' || lang === 'c' || ext === 'cpp' || ext === 'c' || ext === 'h')
    return { name: 'C / C++', isPreviewable: false };
  if (lang === 'php' || ext === 'php')
    return { name: 'PHP Script', isPreviewable: false };
  if (lang === 'sql' || ext === 'sql')
    return { name: 'SQL Query', isPreviewable: false };

  return { name: 'Plain Text', isPreviewable: true };
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
  const handleCodeChange = useCallback(
    (value: string) => {
      if (file) {
        onChangeContent(file.id, value);
      }
    },
    [file, onChangeContent]
  );

  // Format JSON code if file language is json
  const handleFormatCode = useCallback(() => {
    if (!file) return;
    try {
      if (file.language === 'json') {
        const parsed = JSON.parse(file.content);
        onChangeContent(file.id, JSON.stringify(parsed, null, 2));
      } else {
        const formatted = file.content
          .split('\n')
          .map((line) => line.trimEnd())
          .join('\n');
        onChangeContent(file.id, formatted);
      }
    } catch {
      // Ignore parse errors if syntax invalid
    }
  }, [file, onChangeContent]);

  // Build CodeMirror extensions list
  const extensions = useMemo(() => {
    if (!file) return [];

    const langExt = getLanguageExtension(file.language, file.name);

    const customKeymaps = keymap.of([
      indentWithTab,
      ...searchKeymap,
      {
        key: 'Mod-s',
        run: () => {
          onSave();
          return true;
        },
      },
    ]);

    return [langExt, customKeymaps, search(), autocompletion()];
  }, [file, onSave]);

  if (!file) {
    return (
      <div className="w-full h-full bg-[#0B0B0B] border-r border-[#303030] flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
        <span className="material-symbols-outlined text-4xl text-[#303030]">data_object</span>
        <h3 className="text-sm font-bold text-white font-display">No File Selected</h3>
        <p className="text-xs text-[#8E8E8E] max-w-xs font-body">
          Select a file from the Project Files tree to view or edit content.
        </p>
      </div>
    );
  }

  const meta = getLanguageMeta(file.language, file.name);
  const lines = file.content.split('\n');

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
            {meta.name}
          </span>
          <span
            className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
              meta.isPreviewable
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950/50 text-amber-300 border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                meta.isPreviewable ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span>{meta.isPreviewable ? 'Live Preview' : 'Reference Only'}</span>
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
              title="Toggle Beginner Assistant & Learning Drawer"
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

      {/* CodeMirror Editor Area */}
      <div className="flex-1 overflow-hidden bg-[#0B0B0B] relative flex flex-col">
        <CodeMirror
          value={file.content}
          height="100%"
          className="h-full w-full flex-1 text-xs font-mono overflow-auto"
          theme={obsidianCrimsonTheme}
          extensions={extensions}
          onChange={handleCodeChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
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
