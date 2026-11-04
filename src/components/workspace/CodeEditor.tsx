import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { keymap, EditorView, WidgetType, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
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

// Check if a string is a valid CSS color
export function isValidCssColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim().toLowerCase();
  if (/^#(?:[0-9a-fA-F]{3,4}){1,2}$/.test(trimmed)) return true;
  if (/^rgba?\([^)]+\)$/i.test(trimmed) || /^hsla?\([^)]+\)$/i.test(trimmed)) return true;
  const commonNamedColors = new Set([
    'transparent', 'crimson', 'red', 'green', 'blue', 'black', 'white',
    'yellow', 'cyan', 'magenta', 'gray', 'grey', 'orange', 'purple',
    'pink', 'brown', 'gold', 'silver', 'navy', 'teal', 'lime', 'olive'
  ]);
  if (commonNamedColors.has(trimmed)) return true;
  if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', trimmed)) {
    return true;
  }
  if (typeof Option !== 'undefined') {
    try {
      const s = new Option().style;
      s.color = trimmed;
      return s.color !== '';
    } catch {
      return false;
    }
  }
  return false;
}

// Convert CSS color to #rrggbb hex for input[type="color"]
export function parseColorToHex(color: string): string {
  if (!color) return '#000000';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed.substring(0, 7);
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = trimmed;
      const computed = ctx.fillStyle;
      if (computed.startsWith('#')) return computed;
    }
  } catch {
    // fallback
  }
  return '#e5484d';
}

export function hexToRgbString(hex: string): string {
  const clean = parseColorToHex(hex).replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToHslString(hex: string): string {
  const clean = parseColorToHex(hex).replace('#', '');
  let r = (parseInt(clean.substring(0, 2), 16) || 0) / 255;
  let g = (parseInt(clean.substring(2, 4), 16) || 0) / 255;
  let b = (parseInt(clean.substring(4, 6), 16) || 0) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// CodeMirror Widget for Inline Color Swatches
class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly color: string,
    readonly from: number,
    readonly to: number,
    readonly onOpenPicker: (color: string, from: number, to: number, rect: DOMRect) => void
  ) {
    super();
  }

  eq(other: ColorSwatchWidget) {
    return this.color === other.color && this.from === other.from && this.to === other.to;
  }

  toDOM() {
    const swatch = document.createElement('span');
    swatch.className =
      'cm-color-swatch inline-block w-3.5 h-3.5 rounded-sm border border-[#505050] align-middle cursor-pointer transition-transform hover:scale-110 mr-1 shadow-sm shrink-0';
    swatch.style.backgroundColor = this.color;
    swatch.title = `Click to open color picker for ${this.color}`;

    swatch.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = swatch.getBoundingClientRect();
      this.onOpenPicker(this.color, this.from, this.to, rect);
    });

    return swatch;
  }
}

// CodeMirror ViewPlugin that decorates valid CSS color matches with swatches
export function createColorSwatchExtension(
  onOpenPicker: (color: string, from: number, to: number, rect: DOMRect) => void
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const colorRegex =
          /(#(?:[0-9a-fA-F]{3,4}){1,2}\b)|(rgba?\([^)]+\))|(hsla?\([^)]+\))|\b(red|green|blue|black|white|yellow|cyan|magenta|gray|grey|purple|pink|orange|brown|crimson|coral|navy|teal|lime|indigo|gold|silver|transparent)\b/gi;

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          let match: RegExpExecArray | null;

          while ((match = colorRegex.exec(text)) !== null) {
            const start = from + match.index;
            const end = start + match[0].length;
            const colorStr = match[0];

            if (isValidCssColor(colorStr)) {
              const widget = Decoration.widget({
                widget: new ColorSwatchWidget(colorStr, start, end, onOpenPicker),
                side: -1,
              });
              builder.add(start, start, widget);
            }
          }
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
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
  if (lang === 'css' || ext === 'css') return { name: 'CSS3 Stylesheet', isPreviewable: true };
  if (lang === 'javascript' || ext === 'js' || ext === 'jsx')
    return { name: 'JavaScript (ES6+)', isPreviewable: true };
  if (lang === 'typescript' || ext === 'ts' || ext === 'tsx')
    return { name: 'TypeScript / React', isPreviewable: true };
  if (lang === 'json' || ext === 'json') return { name: 'JSON Config', isPreviewable: true };
  if (lang === 'python' || ext === 'py') return { name: 'Python 3', isPreviewable: false };
  if (lang === 'java' || ext === 'java') return { name: 'Java', isPreviewable: false };
  if (lang === 'cpp' || lang === 'c' || ext === 'cpp' || ext === 'c' || ext === 'h')
    return { name: 'C / C++', isPreviewable: false };
  if (lang === 'php' || ext === 'php') return { name: 'PHP Script', isPreviewable: false };
  if (lang === 'sql' || ext === 'sql') return { name: 'SQL Query', isPreviewable: false };

  return { name: 'Plain Text', isPreviewable: true };
}

interface ColorPickerState {
  open: boolean;
  color: string;
  from: number;
  to: number;
  format: 'hex' | 'rgb' | 'hsl';
  pos: { top: number; left: number };
}

const PRESET_COLORS = [
  '#0B0B0B',
  '#141414',
  '#1B1B1B',
  '#303030',
  '#E5484D',
  '#D43D42',
  '#34D399',
  '#60A5FA',
  '#FBBF24',
  '#F87171',
  '#A855F7',
  '#EC4899',
  '#FFFFFF',
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  isDirty = false,
  saving = false,
  onChangeContent,
  onSave,
  onToggleAssistant,
  assistantOpen = false,
}) => {
  const [colorPicker, setColorPicker] = useState<ColorPickerState>({
    open: false,
    color: '#E5484D',
    from: 0,
    to: 0,
    format: 'hex',
    pos: { top: 0, left: 0 },
  });

  const [manualInput, setManualInput] = useState<string>('');

  const handleOpenColorPicker = useCallback(
    (colorStr: string, from: number, to: number, rect: DOMRect) => {
      let initialFormat: 'hex' | 'rgb' | 'hsl' = 'hex';
      if (colorStr.toLowerCase().startsWith('rgb')) initialFormat = 'rgb';
      else if (colorStr.toLowerCase().startsWith('hsl')) initialFormat = 'hsl';

      const top = Math.min(rect.bottom + 8, window.innerHeight - 280);
      const left = Math.min(Math.max(rect.left, 10), window.innerWidth - 280);

      setColorPicker({
        open: true,
        color: colorStr,
        from,
        to,
        format: initialFormat,
        pos: { top, left },
      });
      setManualInput(colorStr);
    },
    []
  );

  const handleApplyNewColor = useCallback(
    (newColorVal: string) => {
      if (!file || !colorPicker.open) return;

      const oldContent = file.content;
      const start = colorPicker.from;
      const end = colorPicker.to;

      const updated = oldContent.substring(0, start) + newColorVal + oldContent.substring(end);
      const newEnd = start + newColorVal.length;

      onChangeContent(file.id, updated);

      setColorPicker((prev) => ({
        ...prev,
        color: newColorVal,
        to: newEnd,
      }));
      setManualInput(newColorVal);
    },
    [file, colorPicker, onChangeContent]
  );

  // Close color picker on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setColorPicker((prev) => ({ ...prev, open: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    const swatchPlugin = createColorSwatchExtension(handleOpenColorPicker);

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

    return [langExt, swatchPlugin, customKeymaps, search(), autocompletion()];
  }, [file, onSave, handleOpenColorPicker]);

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
    <main className="w-full h-full bg-[#0B0B0B] border-r border-[#303030] flex flex-col overflow-hidden relative">
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

      {/* Interactive Obsidian Crimson Color Picker Popover */}
      {colorPicker.open && (
        <>
          {/* Backdrop Click Shield */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setColorPicker((prev) => ({ ...prev, open: false }))}
          ></div>

          {/* Floating Color Picker Card */}
          <div
            style={{ top: `${colorPicker.pos.top}px`, left: `${colorPicker.pos.left}px` }}
            className="fixed z-50 w-64 bg-[#141414] border border-[#303030] rounded-xl shadow-2xl p-3 text-white space-y-3 font-mono animate-in fade-in duration-150 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#303030] pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded border border-[#505050] shrink-0"
                  style={{ backgroundColor: colorPicker.color }}
                ></span>
                <span className="text-xs font-bold font-display uppercase tracking-wider">
                  Color Picker
                </span>
              </div>
              <button
                onClick={() => setColorPicker((prev) => ({ ...prev, open: false }))}
                className="text-[#8E8E8E] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Visual Color Input Tile & Format Switcher */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#303030] shrink-0 cursor-pointer shadow-inner">
                <input
                  type="color"
                  value={parseColorToHex(colorPicker.color)}
                  onChange={(e) => {
                    const hexVal = e.target.value;
                    let formatted = hexVal;
                    if (colorPicker.format === 'rgb') formatted = hexToRgbString(hexVal);
                    else if (colorPicker.format === 'hsl') formatted = hexToHslString(hexVal);
                    handleApplyNewColor(formatted);
                  }}
                  className="absolute inset-[-8px] w-16 h-16 cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>

              {/* Representation Mode Tabs */}
              <div className="flex-1 flex items-center bg-[#0B0B0B] border border-[#303030] p-1 rounded-lg text-[10px]">
                {(['hex', 'rgb', 'hsl'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      let converted = colorPicker.color;
                      const hex = parseColorToHex(colorPicker.color);
                      if (fmt === 'hex') converted = hex;
                      else if (fmt === 'rgb') converted = hexToRgbString(hex);
                      else if (fmt === 'hsl') converted = hexToHslString(hex);

                      setColorPicker((prev) => ({ ...prev, format: fmt }));
                      handleApplyNewColor(converted);
                    }}
                    className={`flex-1 py-1 rounded transition-colors uppercase font-bold text-center cursor-pointer ${
                      colorPicker.format === fmt
                        ? 'bg-[#E5484D] text-white'
                        : 'text-[#B0B0B0] hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Color Value Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8E8E8E] block">Color Value</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualInput(val);
                    if (isValidCssColor(val)) {
                      handleApplyNewColor(val);
                    }
                  }}
                  className="flex-1 bg-[#0B0B0B] border border-[#303030] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#E5484D]"
                  placeholder="#e5484d or rgb(...)"
                />
              </div>
            </div>

            {/* Obsidian Crimson Preset Swatches */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8E8E8E] block">Palette Presets</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {PRESET_COLORS.map((presetHex) => (
                  <button
                    key={presetHex}
                    onClick={() => {
                      let formatted = presetHex;
                      if (colorPicker.format === 'rgb') formatted = hexToRgbString(presetHex);
                      else if (colorPicker.format === 'hsl') formatted = hexToHslString(presetHex);
                      handleApplyNewColor(formatted);
                    }}
                    className="w-5 h-5 rounded border border-[#505050] hover:scale-125 transition-transform cursor-pointer shadow-sm"
                    style={{ backgroundColor: presetHex }}
                    title={presetHex}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
