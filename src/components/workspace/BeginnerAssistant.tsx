import React, { useState } from 'react';
import { WorkspaceFile } from './FileExplorer';

interface BeginnerAssistantProps {
  activeFile: WorkspaceFile | null;
  files: WorkspaceFile[];
  onInsertSnippet: (snippet: string) => void;
  onClose?: () => void;
}

interface Snippet {
  id: string;
  title: string;
  description: string;
  language: 'html' | 'css' | 'javascript' | 'json';
  code: string;
}

const SNIPPETS: Snippet[] = [
  // HTML Snippets
  {
    id: 'html-hero',
    title: 'Hero Header Section',
    description: 'A responsive header with title, subtitle, badge, and CTA button.',
    language: 'html',
    code: `<header className="hero">
  <div className="badge">NEW RELEASE</div>
  <h1>Build Modern Web Experiences</h1>
  <p>Create stunning, high-performance websites with intelligent design components.</p>
  <button id="ctaBtn" className="btn-primary">Get Started</button>
</header>`,
  },
  {
    id: 'html-cards',
    title: 'Feature Cards Grid',
    description: 'A 3-column responsive card container.',
    language: 'html',
    code: `<div className="card-grid">
  <div className="card">
    <h3>Fast Performance</h3>
    <p>Optimized for ultra-fast load times and smooth rendering.</p>
  </div>
  <div className="card">
    <h3>Responsive Design</h3>
    <p>Looks pixel-perfect on desktop, tablet, and mobile displays.</p>
  </div>
  <div className="card">
    <h3>Custom Styling</h3>
    <p>Tailored CSS variables and dark-mode color palettes.</p>
  </div>
</div>`,
  },
  {
    id: 'html-form',
    title: 'Contact Form',
    description: 'Clean form with inputs, textarea, and submit button.',
    language: 'html',
    code: `<form id="contactForm" className="form">
  <label for="nameInput">Your Name</label>
  <input type="text" id="nameInput" placeholder="Jane Doe" required />
  
  <label for="emailInput">Email Address</label>
  <input type="email" id="emailInput" placeholder="jane@example.com" required />
  
  <button type="submit" className="btn-primary">Send Message</button>
</form>`,
  },

  // CSS Snippets
  {
    id: 'css-center',
    title: 'Flexbox Centering',
    description: 'Center content vertically and horizontally.',
    language: 'css',
    code: `.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}`,
  },
  {
    id: 'css-variables',
    title: 'Obsidian Dark Palette Variables',
    description: 'Custom CSS variables for background, text, and accent colors.',
    language: 'css',
    code: `:root {
  --bg-primary: #0b0b0b;
  --bg-surface: #141414;
  --border-color: #303030;
  --text-primary: #ffffff;
  --text-muted: #b0b0b0;
  --accent-red: #e5484d;
  --accent-hover: #d43d42;
}`,
  },
  {
    id: 'css-grid',
    title: 'Responsive Grid Layout',
    description: 'Grid layout that adapts columns automatically based on available width.',
    language: 'css',
    code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}`,
  },

  // JS Snippets
  {
    id: 'js-event',
    title: 'Button Click Listener',
    description: 'Attach an event listener to a button by ID.',
    language: 'javascript',
    code: `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ctaBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('Button clicked successfully!');
      alert('Action triggered!');
    });
  }
});`,
  },
  {
    id: 'js-form-val',
    title: 'Form Submission Handler',
    description: 'Intercept form submit and validate input.',
    language: 'javascript',
    code: `const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('nameInput').value;
    alert(\`Thank you, \${name}! Form submitted.\`);
  });
}`,
  },

  // JSON Snippets
  {
    id: 'json-config',
    title: 'Site Configuration Object',
    description: 'Standard JSON metadata structure for site settings.',
    language: 'json',
    code: `{
  "siteName": "My AI Website",
  "version": "1.0.0",
  "theme": "dark",
  "features": {
    "analytics": true,
    "darkMode": true,
    "livePreview": true
  }
}`,
  },
];

export const BeginnerAssistant: React.FC<BeginnerAssistantProps> = ({
  activeFile,
  files,
  onInsertSnippet,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'snippets' | 'checker' | 'explain' | 'faq'>('snippets');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter snippets matching current file's language or all
  const filteredSnippets = SNIPPETS.filter(
    (s) => !activeFile || s.language === activeFile.language
  );

  // Analyze active file for common beginner syntax issues
  const analyzeActiveFile = () => {
    if (!activeFile) return [];
    const issues: { level: 'error' | 'warning' | 'info'; title: string; detail: string; fixHint: string }[] = [];
    const content = activeFile.content;

    if (activeFile.language === 'html') {
      if (!content.toLowerCase().includes('<!doctype html>')) {
        issues.push({
          level: 'warning',
          title: 'Missing <!DOCTYPE html> Declaration',
          detail: 'Web browsers require a DOCTYPE declaration to render in standards mode.',
          fixHint: 'Add <!DOCTYPE html> as the very first line of your HTML document.',
        });
      }
      if (!content.toLowerCase().includes('name="viewport"')) {
        issues.push({
          level: 'warning',
          title: 'Missing Viewport Meta Tag',
          detail: 'Without a viewport tag, mobile devices will render the desktop version zoomed out.',
          fixHint: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>.',
        });
      }

      // Check if CSS file is linked in HTML
      const cssFileExists = files.some((f) => f.language === 'css');
      if (cssFileExists && !content.includes('rel="stylesheet"') && !content.includes('<style>')) {
        issues.push({
          level: 'info',
          title: 'Stylesheet Not Linked',
          detail: 'You have a CSS file in your project, but it may not be linked in index.html.',
          fixHint: 'Add <link rel="stylesheet" href="styles.css" /> inside the <head> tag.',
        });
      }

      // Check if JS file is linked in HTML
      const jsFileExists = files.some((f) => f.language === 'javascript');
      if (jsFileExists && !content.includes('<script')) {
        issues.push({
          level: 'info',
          title: 'JavaScript File Not Linked',
          detail: 'You have a JS file in your project, but no <script> tag was found in HTML.',
          fixHint: 'Add <script src="app.js"></script> before the closing </body> tag.',
        });
      }

      // Check unclosed tags basic count
      const openDivs = (content.match(/<div[\s>]/gi) || []).length;
      const closeDivs = (content.match(/<\/div>/gi) || []).length;
      if (openDivs !== closeDivs) {
        issues.push({
          level: 'error',
          title: 'Unmatched <div> Tags',
          detail: `Found ${openDivs} opening <div> tags but ${closeDivs} closing </div> tags.`,
          fixHint: 'Ensure every <div> has a corresponding closing </div> tag.',
        });
      }
    } else if (activeFile.language === 'css') {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push({
          level: 'error',
          title: 'Unmatched Curly Braces { }',
          detail: `Found ${openBraces} opening '{' braces and ${closeBraces} closing '}' braces.`,
          fixHint: 'Check your CSS rules to ensure all rule blocks are properly closed with }.',
        });
      }
    } else if (activeFile.language === 'javascript') {
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        issues.push({
          level: 'error',
          title: 'Unmatched Parentheses ( )',
          detail: `Found ${openParens} opening '(' and ${closeParens} closing ')'.`,
          fixHint: 'Check your function calls and conditionals to ensure all parentheses match.',
        });
      }

      // Try parsing JS code
      try {
        new Function(content);
      } catch (e: any) {
        issues.push({
          level: 'error',
          title: 'JavaScript Syntax Error',
          detail: e.message || 'Syntax parse error detected in script.',
          fixHint: 'Review recent edits in your JavaScript file for missing quotes, commas, or semicolons.',
        });
      }
    } else if (activeFile.language === 'json') {
      try {
        JSON.parse(content);
      } catch (e: any) {
        issues.push({
          level: 'error',
          title: 'Invalid JSON Syntax',
          detail: e.message || 'JSON formatting error.',
          fixHint: 'Ensure all property keys are double-quoted and remove any trailing commas.',
        });
      }
    }

    return issues;
  };

  const diagnostics = analyzeActiveFile();

  const handleCopySnippet = (snippet: Snippet) => {
    onInsertSnippet(snippet.code);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="w-full h-full bg-[#141414] border-l border-[#303030] flex flex-col overflow-hidden select-none">
      {/* Assistant Header */}
      <div className="px-4 py-3 bg-[#0E0E10] border-b border-[#303030] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E5484D] text-lg">school</span>
          <div>
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
              Studio Code Helper
            </h3>
            <span className="text-[10px] text-[#8E8E8E] font-mono">
              Deterministic Guidance
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[#8E8E8E] hover:text-white transition-colors cursor-pointer"
            title="Close Helper"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#0B0B0B] border-b border-[#303030] p-1 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('snippets')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded text-[11px] font-mono transition-colors cursor-pointer ${
            activeTab === 'snippets'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Snippets
        </button>
        <button
          onClick={() => setActiveTab('checker')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded text-[11px] font-mono transition-colors cursor-pointer relative ${
            activeTab === 'checker'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Check ({diagnostics.length})
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded text-[11px] font-mono transition-colors cursor-pointer ${
            activeTab === 'explain'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Explainer
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded text-[11px] font-mono transition-colors cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Guide
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: SNIPPETS */}
        {activeTab === 'snippets' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Starter Snippets ({activeFile?.language || 'all'})</span>
              <span className="text-[10px] text-[#E5484D]">Click to Insert</span>
            </div>

            {filteredSnippets.length === 0 ? (
              <p className="text-xs text-[#8E8E8E] italic">No snippets available for this file type.</p>
            ) : (
              filteredSnippets.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 hover:border-[#E5484D]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white font-display">{s.title}</span>
                    <span className="text-[9px] font-mono uppercase bg-[#0B0B0B] text-[#B0B0B0] px-1.5 py-0.5 rounded border border-[#303030]">
                      {s.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#B0B0B0] mb-2 leading-tight font-body">
                    {s.description}
                  </p>
                  <div className="bg-[#0B0B0B] rounded p-2 text-[10px] font-mono text-[#E0E0E0] overflow-x-auto max-h-24 mb-2 border border-[#222]">
                    <pre>{s.code}</pre>
                  </div>
                  <button
                    onClick={() => handleCopySnippet(s)}
                    className="w-full py-1 rounded bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white border border-[#E5484D]/40 transition-colors text-xs font-mono font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedId === s.id ? 'check' : 'add_code'}
                    </span>
                    <span>{copiedId === s.id ? 'Inserted into Editor!' : 'Insert Snippet'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: SYNTAX & PITFALLS CHECKER */}
        {activeTab === 'checker' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Real-Time Code Health</span>
              <span>{activeFile ? activeFile.name : 'No file'}</span>
            </div>

            {diagnostics.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-center space-y-2">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check_circle</span>
                <h4 className="text-xs font-bold text-emerald-300 font-display">No Common Errors Detected</h4>
                <p className="text-[11px] text-[#B0B0B0] font-body leading-relaxed">
                  Your syntax structure looks solid for beginner guidelines!
                </p>
              </div>
            ) : (
              diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border space-y-1.5 ${
                    diag.level === 'error'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : diag.level === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold font-display">
                    <span className="material-symbols-outlined text-sm shrink-0">
                      {diag.level === 'error' ? 'error' : diag.level === 'warning' ? 'warning' : 'info'}
                    </span>
                    <span>{diag.title}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight font-body">{diag.detail}</p>
                  <div className="pt-1.5 border-t border-white/10 text-[10px] font-mono text-white/80">
                    <strong className="text-white">Fix Tip:</strong> {diag.fixHint}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CODE EXPLAINER */}
        {activeTab === 'explain' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E]">
              Simple Code Explainer ({activeFile?.name || 'File'})
            </div>

            {activeFile?.language === 'html' && (
              <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-2 text-xs font-body text-[#B0B0B0]">
                <h4 className="font-bold text-white font-display">HTML Structure Breakdown</h4>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside text-[#D4D4D4]">
                  <li>
                    <strong className="text-amber-400">&lt;!DOCTYPE html&gt;</strong>: Tells browsers this document is HTML5.
                  </li>
                  <li>
                    <strong className="text-amber-400">&lt;head&gt;</strong>: Contains metadata, stylesheets, and titles not visible on the page.
                  </li>
                  <li>
                    <strong className="text-amber-400">&lt;body&gt;</strong>: Contains all visible website elements like headers, text, images, and buttons.
                  </li>
                  <li>
                    <strong className="text-amber-400">Class vs ID</strong>: Use <code className="text-white bg-[#0B0B0B] px-1 rounded">class="btn"</code> for styling multiple elements and <code className="text-white bg-[#0B0B0B] px-1 rounded">id="ctaBtn"</code> for targeting unique elements in JS.
                  </li>
                </ul>
              </div>
            )}

            {activeFile?.language === 'css' && (
              <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-2 text-xs font-body text-[#B0B0B0]">
                <h4 className="font-bold text-white font-display">CSS Styling Breakdown</h4>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside text-[#D4D4D4]">
                  <li>
                    <strong className="text-cyan-400">Selectors</strong>: <code className="text-white bg-[#0B0B0B] px-1 rounded">.container</code> targets classes, <code className="text-white bg-[#0B0B0B] px-1 rounded">#ctaBtn</code> targets IDs, and <code className="text-white bg-[#0B0B0B] px-1 rounded">h1</code> targets elements.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Box Model</strong>: <code className="text-white bg-[#0B0B0B] px-1 rounded">padding</code> adds space inside borders; <code className="text-white bg-[#0B0B0B] px-1 rounded">margin</code> adds space outside.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Flexbox</strong>: <code className="text-white bg-[#0B0B0B] px-1 rounded">display: flex</code> arranges items in rows or columns seamlessly.
                  </li>
                </ul>
              </div>
            )}

            {activeFile?.language === 'javascript' && (
              <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-2 text-xs font-body text-[#B0B0B0]">
                <h4 className="font-bold text-white font-display">JavaScript Interactivity Breakdown</h4>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside text-[#D4D4D4]">
                  <li>
                    <strong className="text-yellow-400">DOMContentLoaded</strong>: Ensures HTML finishes loading before JS tries to select elements.
                  </li>
                  <li>
                    <strong className="text-yellow-400">document.getElementById()</strong>: Finds an HTML element by its unique ID.
                  </li>
                  <li>
                    <strong className="text-yellow-400">addEventListener()</strong>: Listens for user actions like clicks or form submits.
                  </li>
                </ul>
              </div>
            )}

            {(!activeFile || activeFile.language === 'json') && (
              <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-2 text-xs font-body text-[#B0B0B0]">
                <h4 className="font-bold text-white font-display">JSON Data Format</h4>
                <p className="text-[11px]">
                  JSON (JavaScript Object Notation) stores key-value pairs formatted strictly with double quotes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TROUBLESHOOTING GUIDE */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E]">Beginner Troubleshooting FAQ</div>

            <div className="space-y-2">
              <details className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 cursor-pointer text-xs">
                <summary className="font-bold text-white font-display">
                  Why are my CSS changes not showing in Preview?
                </summary>
                <p className="text-[11px] text-[#B0B0B0] mt-2 leading-relaxed">
                  Make sure your HTML includes <code className="text-amber-400">&lt;link rel="stylesheet" href="styles.css"&gt;</code> inside the <code className="text-amber-400">&lt;head&gt;</code> section. Also check for missing closing braces <code className="text-amber-400">{'}'}</code> in CSS.
                </p>
              </details>

              <details className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 cursor-pointer text-xs">
                <summary className="font-bold text-white font-display">
                  Why isn't my button click working?
                </summary>
                <p className="text-[11px] text-[#B0B0B0] mt-2 leading-relaxed">
                  Verify that the button's ID in HTML (<code className="text-amber-400">id="ctaBtn"</code>) matches the ID passed to JavaScript (<code className="text-yellow-400">document.getElementById('ctaBtn')</code>).
                </p>
              </details>

              <details className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 cursor-pointer text-xs">
                <summary className="font-bold text-white font-display">
                  How do I save my project changes?
                </summary>
                <p className="text-[11px] text-[#B0B0B0] mt-2 leading-relaxed">
                  Press <kbd className="bg-[#0B0B0B] text-white px-1 py-0.5 rounded border border-[#303030]">Ctrl + S</kbd> (or <kbd className="bg-[#0B0B0B] text-white px-1 py-0.5 rounded border border-[#303030]">Cmd + S</kbd> on Mac), or click the top-right <strong>Save Changes</strong> button.
                </p>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-3 border-t border-[#303030] bg-[#0E0E10] text-[10px] font-mono text-[#8E8E8E] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
        <span className="truncate">Deterministic Code Assistant (No AI key needed)</span>
      </div>
    </aside>
  );
};
