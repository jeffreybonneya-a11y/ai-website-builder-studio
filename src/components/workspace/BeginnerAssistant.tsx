import React, { useState } from 'react';
import { WorkspaceFile } from './FileExplorer';

interface BeginnerAssistantProps {
  activeFile: WorkspaceFile | null;
  files: WorkspaceFile[];
  onInsertSnippet: (snippet: string) => void;
  onApplyFix?: (fixedContent: string) => void;
  onClose?: () => void;
}

export type AssistantTab = 'learn' | 'explain' | 'snippets' | 'debug' | 'guides' | 'matrix';

interface Lesson {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  vocabulary: { word: string; definition: string }[];
  exampleCode: string;
  expectedResult: string;
  exercise: string;
  hint: string;
  solutionSnippet: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: '1. What Programming Is',
    level: 'Beginner',
    summary: 'Programming is writing step-by-step instructions (code) for a computer to execute.',
    vocabulary: [
      { word: 'Code', definition: 'Text written in a programming language that computers follow.' },
      { word: 'Syntax', definition: 'The grammar rules of a programming language.' },
    ],
    exampleCode: `<!-- HTML specifies elements on the page -->\n<h1>Hello World</h1>\n<p>Welcome to web development!</p>`,
    expectedResult: 'Displays a prominent heading "Hello World" with a paragraph underneath.',
    exercise: 'Change "Hello World" to "My First Website" in your index.html file.',
    hint: 'Look for the <h1> tag in index.html and replace the text between <h1> and </h1>.',
    solutionSnippet: `<h1>My First Website</h1>`,
  },
  {
    id: 'l2',
    title: '2. Variables & Data Types',
    level: 'Beginner',
    summary: 'Variables are named containers that store information in computer memory.',
    vocabulary: [
      { word: 'Variable', definition: 'A container storing a data value (e.g., const name = "Alice").' },
      { word: 'String', definition: 'Text enclosed in quotes like "Hello".' },
      { word: 'Number', definition: 'Numeric values without quotes like 42 or 3.14.' },
    ],
    exampleCode: `const siteTitle = 'Obsidian Studio';\nlet viewCount = 100;\nconst isPublished = true;\nconsole.log(siteTitle, viewCount, isPublished);`,
    expectedResult: 'Logs "Obsidian Studio 100 true" to the developer console.',
    exercise: 'Declare a variable called userScore set to 50.',
    hint: 'Use `let userScore = 50;` or `const userScore = 50;`.',
    solutionSnippet: `const userScore = 50;\nconsole.log('Score:', userScore);`,
  },
  {
    id: 'l3',
    title: '3. Conditions (if / else)',
    level: 'Beginner',
    summary: 'Conditions let your program make decisions based on whether something is true or false.',
    vocabulary: [
      { word: 'Condition', definition: 'A boolean expression evaluated as true or false.' },
      { word: 'Branching', definition: 'Executing different code depending on conditions.' },
    ],
    exampleCode: `const userAge = 20;\nif (userAge >= 18) {\n  console.log('Access Granted');\n} else {\n  console.log('Access Denied');\n}`,
    expectedResult: 'Prints "Access Granted" because 20 is greater than or equal to 18.',
    exercise: 'Write an if condition that checks if score > 80 and logs "Great Job!".',
    hint: 'Use `if (score > 80) { console.log("Great Job!"); }`.',
    solutionSnippet: `const score = 85;\nif (score > 80) {\n  console.log('Great Job!');\n}`,
  },
  {
    id: 'l4',
    title: '4. Loops (for & while)',
    level: 'Intermediate',
    summary: 'Loops repeat a block of code multiple times automatically.',
    vocabulary: [
      { word: 'Loop', definition: 'A block of code that runs repeatedly until a condition ends.' },
      { word: 'Iteration', definition: 'Single execution pass through a loop.' },
    ],
    exampleCode: `for (let i = 1; i <= 5; i++) {\n  console.log('Item count:', i);\n}`,
    expectedResult: 'Prints "Item count: 1" through "Item count: 5".',
    exercise: 'Create a loop that prints numbers from 1 to 3.',
    hint: 'Set loop condition `i <= 3`.',
    solutionSnippet: `for (let i = 1; i <= 3; i++) {\n  console.log('Step:', i);\n}`,
  },
  {
    id: 'l5',
    title: '5. Functions',
    level: 'Intermediate',
    summary: 'Functions are reusable blocks of code that take input parameters and return output.',
    vocabulary: [
      { word: 'Function', definition: 'A named sequence of statements performing a task.' },
      { word: 'Parameter', definition: 'An input value passed into a function.' },
    ],
    exampleCode: `function greetUser(name) {\n  return 'Welcome back, ' + name + '!';\n}\nconsole.log(greetUser('Jane'));`,
    expectedResult: 'Logs "Welcome back, Jane!".',
    exercise: 'Write a function addNumbers(a, b) that returns a + b.',
    hint: 'Use `function addNumbers(a, b) { return a + b; }`.',
    solutionSnippet: `function addNumbers(a, b) {\n  return a + b;\n}\nconsole.log(addNumbers(10, 20));`,
  },
  {
    id: 'l6',
    title: '6. Arrays & Objects',
    level: 'Intermediate',
    summary: 'Arrays store ordered lists of data. Objects store key-value properties.',
    vocabulary: [
      { word: 'Array', definition: 'A list of items enclosed in square brackets [].' },
      { word: 'Object', definition: 'A collection of named properties enclosed in curly braces {}.' },
    ],
    exampleCode: `const colors = ['red', 'green', 'blue'];\nconst project = {\n  title: 'My Website',\n  version: '1.0',\n};\nconsole.log(colors[0], project.title);`,
    expectedResult: 'Logs "red My Website".',
    exercise: 'Access the second item from `const items = ["A", "B", "C"];`.',
    hint: 'Arrays use 0-based indexing, so the second item is `items[1]`.',
    solutionSnippet: `const items = ['A', 'B', 'C'];\nconsole.log(items[1]); // Output: B`,
  },
  {
    id: 'l7',
    title: '7. Events & Interactivity',
    level: 'Intermediate',
    summary: 'Events allow your code to run when users click, type, scroll, or submit forms.',
    vocabulary: [
      { word: 'EventListener', definition: 'A function that waits for user actions.' },
      { word: 'DOM', definition: 'Document Object Model - the HTML element tree.' },
    ],
    exampleCode: `const btn = document.getElementById('myBtn');\nif (btn) {\n  btn.addEventListener('click', () => {\n    alert('Button clicked!');\n  });\n}`,
    expectedResult: 'Shows an alert box when the button with ID "myBtn" is clicked.',
    exercise: 'Attach a click event listener to a button with id "ctaBtn".',
    hint: 'Use `document.getElementById("ctaBtn").addEventListener("click", ...)`.',
    solutionSnippet: `document.getElementById('ctaBtn')?.addEventListener('click', () => {\n  console.log('CTA clicked');\n});`,
  },
  {
    id: 'l8',
    title: '8. UI Components',
    level: 'Intermediate',
    summary: 'Components combine HTML structure, CSS styling, and JS interactivity into modular UI blocks.',
    vocabulary: [
      { word: 'Component', definition: 'A self-contained, reusable user interface element.' },
    ],
    exampleCode: `<div class="card">\n  <h3>Feature Title</h3>\n  <p>Component description goes here.</p>\n</div>`,
    expectedResult: 'Renders a structured card component box.',
    exercise: 'Create a button component with class "btn-primary".',
    hint: 'Use `<button className="btn-primary">Click Me</button>`.',
    solutionSnippet: `<button className="btn-primary">Get Started</button>`,
  },
  {
    id: 'l9',
    title: '9. APIs & Data Fetching',
    level: 'Advanced',
    summary: 'APIs allow web applications to fetch remote data over HTTP.',
    vocabulary: [
      { word: 'API', definition: 'Application Programming Interface.' },
      { word: 'Fetch', definition: 'JavaScript method to send network requests.' },
    ],
    exampleCode: `async function loadData() {\n  const res = await fetch('https://api.example.com/data');\n  const json = await res.json();\n  console.log(json);\n}`,
    expectedResult: 'Fetches data asynchronously and logs the resulting JSON object.',
    exercise: 'Call `fetch("/api/projects")` and convert the response to JSON.',
    hint: 'Use `const res = await fetch("/api/projects"); const data = await res.json();`.',
    solutionSnippet: `async function getProjects() {\n  const res = await fetch('/api/projects');\n  return await res.json();\n}`,
  },
  {
    id: 'l10',
    title: '10. Databases & Persistence',
    level: 'Advanced',
    summary: 'Databases store application data permanently across user visits.',
    vocabulary: [
      { word: 'Persistence', definition: 'Saving data so it remains after refresh or logout.' },
      { word: 'Firestore', definition: 'Cloud document database for storing collections.' },
    ],
    exampleCode: `// Firestore document store pattern\nconst projectDoc = {\n  id: 'proj_123',\n  title: 'Studio Site',\n  updatedAt: new Date().toISOString(),\n};`,
    expectedResult: 'Creates a structured database document representation.',
    exercise: 'Add a `revision` field set to 1 in a project object.',
    hint: 'Set `revision: 1` inside the object.',
    solutionSnippet: `const newProject = {\n  title: 'My Web App',\n  revision: 1,\n};`,
  },
  {
    id: 'l11',
    title: '11. Debugging Skills',
    level: 'Advanced',
    summary: 'Debugging is systematically finding, understanding, and removing errors in code.',
    vocabulary: [
      { word: 'Console', definition: 'Tool showing system messages and runtime errors.' },
      { word: 'SyntaxError', definition: 'Grammar mistake preventing code parsing.' },
    ],
    exampleCode: `try {\n  JSON.parse('{ invalid json }');\n} catch (error) {\n  console.error('Caught error:', error.message);\n}`,
    expectedResult: 'Catches invalid JSON parsing error without crashing the application.',
    exercise: 'Wrap JSON.parse inside a try/catch block.',
    hint: 'Use `try { ... } catch (err) { ... }`.',
    solutionSnippet: `try {\n  const data = JSON.parse(input);\n} catch (e) {\n  console.log('Invalid format:', e.message);\n}`,
  },
  {
    id: 'l12',
    title: '12. Practical Full Projects',
    level: 'Advanced',
    summary: 'Combine HTML, CSS, JavaScript, and backend APIs into a complete website.',
    vocabulary: [
      { word: 'Full-Stack', definition: 'Building both user interface and backend storage.' },
    ],
    exampleCode: `<!-- Complete HTML + CSS + JS Structure -->\n<div id="app">\n  <h1>Studio Web App</h1>\n  <button id="loadBtn">Refresh Data</button>\n</div>`,
    expectedResult: 'A complete interactive web app layout ready for live preview.',
    exercise: 'Add a footer to your HTML project layout.',
    hint: 'Add `<footer><p>&copy; 2026 My Website</p></footer>` before `</body>`.',
    solutionSnippet: `<footer>\n  <p>&copy; 2026 AI Website Builder Studio. All rights reserved.</p>\n</footer>`,
  },
];

interface Snippet {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: WorkspaceFile['language'];
  code: string;
}

const ALL_SNIPPETS: Snippet[] = [
  // HTML
  {
    id: 'html-hero',
    title: 'Responsive Hero Banner',
    description: 'Header with badge, title, subtitle, and primary call-to-action button.',
    difficulty: 'Beginner',
    language: 'html',
    code: `<header className="hero">
  <span className="badge">NEW RELEASE</span>
  <h1>Build Modern Web Experiences</h1>
  <p>Create stunning, high-performance websites with intelligent components.</p>
  <button id="ctaBtn" className="btn-primary">Get Started</button>
</header>`,
  },
  {
    id: 'html-form',
    title: 'Contact Form Container',
    description: 'Accessible contact form with input fields, labels, and submit button.',
    difficulty: 'Beginner',
    language: 'html',
    code: `<form id="contactForm" className="form-card">
  <label for="userName">Name</label>
  <input type="text" id="userName" placeholder="Jane Doe" required />
  
  <label for="userEmail">Email</label>
  <input type="email" id="userEmail" placeholder="jane@example.com" required />
  
  <button type="submit" className="btn-submit">Submit Message</button>
</form>`,
  },

  // CSS
  {
    id: 'css-center',
    title: 'Flexbox Centering',
    description: 'Centers child elements vertically and horizontally.',
    difficulty: 'Beginner',
    language: 'css',
    code: `.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}`,
  },
  {
    id: 'css-grid',
    title: 'Auto-Fit Responsive Grid',
    description: 'Grid container that adjusts column count automatically based on screen width.',
    difficulty: 'Intermediate',
    language: 'css',
    code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}`,
  },

  // JavaScript
  {
    id: 'js-event',
    title: 'Button Event Listener',
    description: 'Listens for click events and triggers an action.',
    difficulty: 'Beginner',
    language: 'javascript',
    code: `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ctaBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('Action triggered successfully!');
    });
  }
});`,
  },

  // TypeScript
  {
    id: 'ts-interface',
    title: 'TypeScript Interface',
    description: 'Defines strong typing contract for user objects.',
    difficulty: 'Intermediate',
    language: 'typescript',
    code: `export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}`,
  },

  // JSON
  {
    id: 'json-site',
    title: 'App Configuration JSON',
    description: 'Standard JSON settings object.',
    difficulty: 'Beginner',
    language: 'json',
    code: `{
  "siteName": "AI Website Builder Studio",
  "version": "1.0.0",
  "theme": "obsidian-crimson",
  "features": {
    "livePreview": true,
    "cloudSync": true
  }
}`,
  },

  // Python
  {
    id: 'py-script',
    title: 'Python Script Template',
    description: 'Educational reference for Python functions.',
    difficulty: 'Beginner',
    language: 'python',
    code: `def calculate_total(items, tax_rate=0.08):
    subtotal = sum(items)
    return subtotal * (1 + tax_rate)

print("Total cost:", calculate_total([10.5, 20.0, 5.25]))`,
  },

  // Java
  {
    id: 'java-class',
    title: 'Java Class Starter',
    description: 'Educational reference for Java object-oriented class structure.',
    difficulty: 'Intermediate',
    language: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Java application initialized.");
    }
}`,
  },

  // C / C++
  {
    id: 'cpp-main',
    title: 'C++ Main Entry',
    description: 'Educational reference for C++ standard output.',
    difficulty: 'Intermediate',
    language: 'cpp',
    code: `#include <iostream>

int main() {
    std::cout << "C++ compiled module ready." << std::endl;
    return 0;
}`,
  },

  // PHP
  {
    id: 'php-script',
    title: 'PHP Script Starter',
    description: 'Educational reference for PHP server-side script.',
    difficulty: 'Beginner',
    language: 'php',
    code: `<?php
$siteName = "Studio Web App";
echo "<h1>Welcome to " . htmlspecialchars($siteName) . "</h1>";
?>`,
  },

  // SQL
  {
    id: 'sql-query',
    title: 'SQL Select & Filter Query',
    description: 'Educational reference for database relational querying.',
    difficulty: 'Beginner',
    language: 'sql',
    code: `SELECT id, title, owner_id, created_at
FROM projects
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 10;`,
  },
];

interface Guide {
  id: string;
  title: string;
  category: string;
  steps: string[];
  code: string;
}

const CODING_GUIDES: Guide[] = [
  {
    id: 'g1',
    title: '1. Navigation Bar',
    category: 'UI Layout',
    steps: [
      'Create a <nav> container with dark background styling.',
      'Add a logo title on the left side.',
      'Add links for Navigation in an unordered list <ul>.',
    ],
    code: `<nav className="nav-bar">\n  <div className="logo">StudioApp</div>\n  <ul className="nav-links">\n    <li><a href="#home">Home</a></li>\n    <li><a href="#features">Features</a></li>\n  </ul>\n</nav>`,
  },
  {
    id: 'g2',
    title: '2. Form Container',
    category: 'Interactivity',
    steps: [
      'Wrap input controls in a <form> tag.',
      'Use matching <label for="..."> and <input id="..."> pairs.',
      'Add type="submit" on your primary action button.',
    ],
    code: `<form className="form-card">\n  <label for="email">Email</label>\n  <input type="email" id="email" required />\n  <button type="submit">Submit</button>\n</form>`,
  },
  {
    id: 'g3',
    title: '3. Login Interface',
    category: 'Auth UI',
    steps: [
      'Include email and password inputs.',
      'Add error message container for invalid login attempts.',
      'Add submit button with loading state indicator.',
    ],
    code: `<div className="auth-box">\n  <h2>Sign In</h2>\n  <input type="email" placeholder="Email" />\n  <input type="password" placeholder="Password" />\n  <button className="btn-primary">Sign In</button>\n</div>`,
  },
  {
    id: 'g4',
    title: '4. Responsive Grid',
    category: 'CSS Layout',
    steps: [
      'Set `display: grid;` on parent container.',
      'Use `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));`.',
      'Add `gap: 1.5rem;` for automatic spacing between cards.',
    ],
    code: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 1.5rem;\n}`,
  },
  {
    id: 'g5',
    title: '5. Feature Cards',
    category: 'UI Components',
    steps: [
      'Create card container with subtle border and dark background.',
      'Add icon, title, and description text.',
      'Apply hover transition effect on mouseover.',
    ],
    code: `<div className="card">\n  <span className="icon">🚀</span>\n  <h3>Fast Performance</h3>\n  <p>Ultra-fast load times with optimized rendering.</p>\n</div>`,
  },
  {
    id: 'g6',
    title: '6. Custom Buttons',
    category: 'UI Styling',
    steps: [
      'Define padding, border radius, and font weights.',
      'Set primary color background (`#E5484D`).',
      'Add `:hover` state with smooth transitions.',
    ],
    code: `.btn-primary {\n  background: #E5484D;\n  color: #fff;\n  padding: 0.5rem 1rem;\n  border-radius: 0.5rem;\n  border: none;\n  cursor: pointer;\n}`,
  },
  {
    id: 'g7',
    title: '7. Admin Dashboard',
    category: 'Dashboard UI',
    steps: [
      'Create sidebar navigation layout on desktop.',
      'Add metric cards for totals.',
      'Incorporate structured table view for project records.',
    ],
    code: `<div className="dashboard-layout">\n  <aside className="sidebar">Nav</aside>\n  <main className="content">Metrics & Tables</main>\n</div>`,
  },
  {
    id: 'g8',
    title: '8. Hero Landing Section',
    category: 'Marketing UI',
    steps: [
      'Center content with eye-catching typography.',
      'Add badge pill above main title.',
      'Incorporate primary and secondary CTA buttons.',
    ],
    code: `<div className="hero-section">\n  <span className="badge font-mono">STUDIO BUILDER</span>\n  <h1>Create Stunning Web Applications</h1>\n</div>`,
  },
  {
    id: 'g9',
    title: '9. API Integration',
    category: 'Data Fetching',
    steps: [
      'Call `fetch()` inside async function.',
      'Parse response using `.json()`.',
      'Render data items into DOM elements.',
    ],
    code: `async function fetchData() {\n  const res = await fetch('/api/projects');\n  const data = await res.json();\n  console.log('Loaded:', data);\n}`,
  },
  {
    id: 'g10',
    title: '10. DB-Connected Application',
    category: 'Full-Stack',
    steps: [
      'Pass CSRF headers on mutation requests.',
      'Handle atomic revisions to prevent overwrites.',
      'Show instant user feedback and handle errors gracefully.',
    ],
    code: `await fetch('/api/projects/id/files', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },\n  body: JSON.stringify({ files, expectedRevision: rev }),\n});`,
  },
];

export const BeginnerAssistant: React.FC<BeginnerAssistantProps> = ({
  activeFile,
  files,
  onInsertSnippet,
  onApplyFix,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('learn');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('l1');
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fixConfirmModal, setFixConfirmModal] = useState<{
    open: boolean;
    fixHint: string;
    suggestedContent: string;
  }>({ open: false, fixHint: '', suggestedContent: '' });

  // Filter snippets matching active file or all
  const filteredSnippets = ALL_SNIPPETS.filter(
    (s) => !activeFile || s.language === activeFile.language
  );

  // Analyze active file content for real-time syntax and logical diagnostics
  const analyzeDiagnostics = () => {
    if (!activeFile) return [];
    const issues: {
      level: 'error' | 'warning' | 'info';
      title: string;
      detail: string;
      fixHint: string;
      proposedFix?: string;
    }[] = [];
    const content = activeFile.content;

    if (activeFile.language === 'html') {
      if (!content.toLowerCase().includes('<!doctype html>')) {
        issues.push({
          level: 'warning',
          title: 'Missing <!DOCTYPE html> Declaration',
          detail: 'Web browsers require a DOCTYPE declaration to render in standards mode.',
          fixHint: 'Add <!DOCTYPE html> as the very first line of your HTML document.',
          proposedFix: `<!DOCTYPE html>\n${content}`,
        });
      }
      if (!content.toLowerCase().includes('name="viewport"')) {
        issues.push({
          level: 'warning',
          title: 'Missing Viewport Meta Tag',
          detail: 'Without a viewport tag, mobile devices render desktop zoomed out.',
          fixHint: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>.',
        });
      }

      // Check if CSS file exists in project but unlinked
      const cssExists = files.some((f) => f.language === 'css');
      if (cssExists && !content.includes('rel="stylesheet"') && !content.includes('<style>')) {
        issues.push({
          level: 'info',
          title: 'Stylesheet File Not Linked',
          detail: 'You have a CSS file in your workspace, but it is not linked in HTML.',
          fixHint: 'Add <link rel="stylesheet" href="styles.css"> inside <head>.',
        });
      }

      // Tag balance check
      const openDivs = (content.match(/<div[\s>]/gi) || []).length;
      const closeDivs = (content.match(/<\/div>/gi) || []).length;
      if (openDivs !== closeDivs) {
        issues.push({
          level: 'error',
          title: 'Unmatched <div> Tags',
          detail: `Found ${openDivs} opening <div> tags but ${closeDivs} closing </div> tags.`,
          fixHint: 'Ensure every opening <div> tag has a corresponding </div> tag.',
        });
      }
    } else if (activeFile.language === 'css') {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push({
          level: 'error',
          title: 'Unmatched CSS Curly Braces { }',
          detail: `Found ${openBraces} opening '{' braces and ${closeBraces} closing '}' braces.`,
          fixHint: 'Ensure all CSS rules have closing "}" braces.',
        });
      }
    } else if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        issues.push({
          level: 'error',
          title: 'Unmatched Parentheses ( )',
          detail: `Found ${openParens} opening '(' and ${closeParens} closing ')'.`,
          fixHint: 'Check function calls and conditionals for matching parentheses.',
        });
      }

      try {
        new Function(content);
      } catch (e: any) {
        issues.push({
          level: 'error',
          title: 'JavaScript Syntax Parse Error',
          detail: e.message || 'Syntax parse error detected.',
          fixHint: 'Check recent edits for missing quotes, commas, or semicolons.',
        });
      }
    } else if (activeFile.language === 'json') {
      try {
        JSON.parse(content);
      } catch (e: any) {
        issues.push({
          level: 'error',
          title: 'Invalid JSON Formatting',
          detail: e.message || 'JSON formatting error.',
          fixHint: 'Ensure keys are double-quoted and remove trailing commas.',
        });
      }
    }

    return issues;
  };

  const diagnostics = analyzeDiagnostics();
  const currentLesson = LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];

  const handleCopySnippet = (snippet: Snippet) => {
    onInsertSnippet(snippet.code);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyFixClick = (fixHint: string, proposedFix: string) => {
    setFixConfirmModal({
      open: true,
      fixHint,
      suggestedContent: proposedFix,
    });
  };

  const confirmApplyFix = () => {
    if (onApplyFix && fixConfirmModal.suggestedContent) {
      onApplyFix(fixConfirmModal.suggestedContent);
    }
    setFixConfirmModal({ open: false, fixHint: '', suggestedContent: '' });
  };

  return (
    <aside className="w-full h-full bg-[#141414] border-l border-[#303030] flex flex-col overflow-hidden select-none relative">
      {/* Assistant Header */}
      <div className="px-4 py-2.5 bg-[#0E0E10] border-b border-[#303030] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E5484D] text-lg">school</span>
          <div>
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
              Studio Code Helper
            </h3>
            <span className="text-[9px] text-[#8E8E8E] font-mono block">
              Deterministic Guidance (Offline Mode)
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[#8E8E8E] hover:text-white transition-colors cursor-pointer"
            title="Close Assistant Panel"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-[#0B0B0B] border-b border-[#303030] p-1 shrink-0 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center ${
            activeTab === 'learn'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Learn
        </button>
        <button
          onClick={() => setActiveTab('explain')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center ${
            activeTab === 'explain'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Explain
        </button>
        <button
          onClick={() => setActiveTab('snippets')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center ${
            activeTab === 'snippets'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Snippets
        </button>
        <button
          onClick={() => setActiveTab('debug')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center relative ${
            activeTab === 'debug'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Debug ({diagnostics.length})
        </button>
        <button
          onClick={() => setActiveTab('guides')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center ${
            activeTab === 'guides'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Guides
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer text-center ${
            activeTab === 'matrix'
              ? 'bg-[#E5484D] text-white font-bold'
              : 'text-[#B0B0B0] hover:text-white'
          }`}
        >
          Languages
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-body">
        {/* SECTION 1: LEARN */}
        {activeTab === 'learn' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E8E]">
              <span>Structured Beginner Curriculum</span>
              <span className="text-[10px] text-[#E5484D]">{LESSONS.length} Lessons</span>
            </div>

            {/* Lesson Selector */}
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#303030] rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-[#E5484D]"
            >
              {LESSONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.level})
                </option>
              ))}
            </select>

            {/* Lesson Details Card */}
            <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-[#303030] pb-2">
                <h4 className="text-xs font-bold text-white font-display">
                  {currentLesson.title}
                </h4>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    currentLesson.level === 'Beginner'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : currentLesson.level === 'Intermediate'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {currentLesson.level}
                </span>
              </div>

              <p className="text-xs text-[#CCCCCC] leading-relaxed">{currentLesson.summary}</p>

              {/* Vocabulary Glossary */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#8E8E8E] uppercase">
                  Vocabulary Definitions
                </span>
                <div className="space-y-1 bg-[#0B0B0B] p-2 rounded border border-[#222]">
                  {currentLesson.vocabulary.map((v, idx) => (
                    <div key={idx} className="text-[11px]">
                      <strong className="text-[#E5484D] font-mono">{v.word}:</strong>{' '}
                      <span className="text-[#B0B0B0]">{v.definition}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Example */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#8E8E8E] uppercase">
                  Code Example
                </span>
                <pre className="bg-[#0B0B0B] p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto border border-[#222]">
                  {currentLesson.exampleCode}
                </pre>
              </div>

              {/* Expected Result */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#8E8E8E] uppercase">
                  Expected Result
                </span>
                <p className="text-[11px] text-[#B0B0B0] bg-[#0B0B0B] p-2 rounded border border-[#222]">
                  {currentLesson.expectedResult}
                </p>
              </div>

              {/* Exercise & Hint */}
              <div className="pt-2 border-t border-[#303030] space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 font-display">
                  <span className="material-symbols-outlined text-sm">fitness_center</span>
                  <span>Practical Exercise</span>
                </span>
                <p className="text-xs text-white">{currentLesson.exercise}</p>

                {showHintMap[currentLesson.id] ? (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200">
                    <strong>Hint:</strong> {currentLesson.hint}
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setShowHintMap((prev) => ({ ...prev, [currentLesson.id]: true }))
                    }
                    className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">lightbulb</span>
                    <span>Show Hint</span>
                  </button>
                )}

                <button
                  onClick={() => onInsertSnippet(currentLesson.solutionSnippet)}
                  className="w-full py-1.5 rounded bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white border border-[#E5484D]/40 transition-colors text-xs font-mono font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">add_code</span>
                  <span>Insert Solution Code into Editor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: EXPLAIN MY CODE */}
        {activeTab === 'explain' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Active File Code Explainer</span>
              <span className="text-[10px] text-white font-bold">{activeFile?.name || 'File'}</span>
            </div>

            {activeFile ? (
              <div className="space-y-3">
                {/* Simple Overview */}
                <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#E5484D]">info</span>
                    <span>1. Simple Overview</span>
                  </h4>
                  <p className="text-xs text-[#B0B0B0] leading-relaxed">
                    This file (<code className="text-white font-mono">{activeFile.name}</code>) is a{' '}
                    <strong className="text-white">{activeFile.language.toUpperCase()}</strong>{' '}
                    source document with {activeFile.content.split('\n').length} lines of code. It
                    defines structure, styling, or functionality for your project.
                  </p>
                </div>

                {/* Line-by-Line Breakdown */}
                <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#E5484D]">list</span>
                    <span>2. Structure Breakdown</span>
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeFile.content
                      .split('\n')
                      .slice(0, 8)
                      .map((line, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 bg-[#0B0B0B] rounded border border-[#222] text-[10px] font-mono flex items-start gap-2"
                        >
                          <span className="text-[#505050] select-none shrink-0">{idx + 1}</span>
                          <span className="text-[#E0E0E0] truncate">{line || '// empty line'}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Keyword Glossary */}
                <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#E5484D]">menu_book</span>
                    <span>3. Keywords & Symbols</span>
                  </h4>
                  <div className="text-[11px] text-[#B0B0B0] space-y-1">
                    <div>
                      <strong className="text-amber-400 font-mono">&lt;tag&gt; / {}</strong>: HTML
                      elements or JS code blocks.
                    </div>
                    <div>
                      <strong className="text-amber-400 font-mono">const / let</strong>: Variable
                      declarations.
                    </div>
                    <div>
                      <strong className="text-amber-400 font-mono">function / ()</strong>: Reusable
                      executable procedures.
                    </div>
                  </div>
                </div>

                {/* Consequences */}
                <div className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-[#E5484D]">warning</span>
                    <span>4. Purpose & Safe Editing</span>
                  </h4>
                  <p className="text-[11px] text-[#B0B0B0] leading-relaxed">
                    Removing required HTML tags or unclosed CSS braces breaks page rendering. Modify
                    values inside quotes safely without deleting closing tags or brackets.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8E8E8E]">Select a file to inspect code explanation.</p>
            )}
          </div>
        )}

        {/* SECTION 3: CODE SNIPPETS */}
        {activeTab === 'snippets' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Categorized Snippets ({activeFile?.language || 'All'})</span>
              <span className="text-[10px] text-[#E5484D]">Click to Insert</span>
            </div>

            {filteredSnippets.map((s) => (
              <div
                key={s.id}
                className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 hover:border-[#E5484D]/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-display">{s.title}</span>
                  <span className="text-[9px] font-mono uppercase bg-[#0B0B0B] text-[#B0B0B0] px-1.5 py-0.5 rounded border border-[#303030]">
                    {s.language}
                  </span>
                </div>
                <p className="text-[11px] text-[#B0B0B0] leading-tight">{s.description}</p>
                <pre className="bg-[#0B0B0B] rounded p-2 text-[10px] font-mono text-[#E0E0E0] overflow-x-auto max-h-24 border border-[#222]">
                  {s.code}
                </pre>
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
            ))}
          </div>
        )}

        {/* SECTION 4: DEBUG MY CODE */}
        {activeTab === 'debug' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Real-Time Syntax & Logic Analyzer</span>
              <span className="text-[10px] text-white font-bold">{activeFile?.name}</span>
            </div>

            {diagnostics.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-center space-y-2">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check_circle</span>
                <h4 className="text-xs font-bold text-emerald-300 font-display">No Common Errors Detected</h4>
                <p className="text-[11px] text-[#B0B0B0]">
                  Your active file syntax structure passes all beginner guidelines!
                </p>
              </div>
            ) : (
              diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border space-y-2 ${
                    diag.level === 'error'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : diag.level === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold font-display">
                    <span className="material-symbols-outlined text-sm shrink-0">
                      {diag.level === 'error'
                        ? 'error'
                        : diag.level === 'warning'
                        ? 'warning'
                        : 'info'}
                    </span>
                    <span>{diag.title}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight font-body">{diag.detail}</p>
                  <div className="pt-1 border-t border-white/10 text-[10px] font-mono">
                    <strong>Fix Suggestion:</strong> {diag.fixHint}
                  </div>

                  {diag.proposedFix && onApplyFix && (
                    <button
                      onClick={() => handleApplyFixClick(diag.fixHint, diag.proposedFix!)}
                      className="mt-2 w-full py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black border border-amber-500/40 transition-colors text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">auto_fix</span>
                      <span>Review & Apply Suggested Fix</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* SECTION 5: CODING GUIDES */}
        {activeTab === 'guides' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Step-by-Step UI & Logic Guides</span>
              <span className="text-[10px] text-[#E5484D]">10 Tutorials</span>
            </div>

            {CODING_GUIDES.map((g) => (
              <details
                key={g.id}
                className="bg-[#1B1B1B] border border-[#303030] rounded-lg p-3 cursor-pointer text-xs space-y-2 group"
              >
                <summary className="font-bold text-white font-display flex items-center justify-between">
                  <span>{g.title}</span>
                  <span className="text-[9px] font-mono uppercase bg-[#0B0B0B] text-[#8E8E8E] px-1.5 py-0.5 rounded border border-[#303030]">
                    {g.category}
                  </span>
                </summary>

                <div className="pt-2 space-y-2 text-[11px] text-[#CCCCCC] border-t border-[#303030] mt-2">
                  <ol className="list-decimal list-inside space-y-1">
                    {g.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>

                  <pre className="bg-[#0B0B0B] p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto border border-[#222]">
                    {g.code}
                  </pre>

                  <button
                    onClick={() => onInsertSnippet(g.code)}
                    className="w-full py-1 rounded bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white border border-[#E5484D]/40 transition-colors text-xs font-mono font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">add_code</span>
                    <span>Insert Tutorial Code into Active File</span>
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* SECTION 6: LANGUAGE MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-[#8E8E8E] flex items-center justify-between">
              <span>Language Support Matrix</span>
              <span className="text-[10px] text-[#E5484D]">12 Languages</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Web Live Preview Supported Languages */}
              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 space-y-1">
                <div className="font-bold font-display flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>LIVE PREVIEW SUPPORTED</span>
                </div>
                <p className="text-[11px] opacity-90">
                  HTML5, CSS3, JavaScript (ES6+), TypeScript, React/JSX, JSON execute directly in
                  the browser preview.
                </p>
              </div>

              {/* Educational Reference Only Languages */}
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/40 text-amber-200 space-y-1">
                <div className="font-bold font-display flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>EDUCATIONAL REFERENCE ONLY</span>
                </div>
                <p className="text-[11px] opacity-90">
                  Python, Java, C, C++, PHP, SQL provide syntax highlighting, formatting, and
                  learning guides. In-browser live execution requires a dedicated backend sandbox.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Explicit User Confirmation Modal before applying any suggested fix */}
      {fixConfirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141414] border border-[#303030] rounded-xl p-4 space-y-3 text-white">
            <div className="flex items-center gap-2 border-b border-[#303030] pb-2 text-amber-400">
              <span className="material-symbols-outlined text-lg">auto_fix</span>
              <h4 className="text-xs font-bold font-display uppercase tracking-wider">
                Confirm Code Modification
              </h4>
            </div>

            <p className="text-xs text-[#CCCCCC] leading-relaxed">
              Applying fix for: <strong className="text-white">{fixConfirmModal.fixHint}</strong>
            </p>

            <p className="text-[11px] text-[#8E8E8E]">
              This will update the active file content. Your unsaved draft changes will be preserved in memory until saved.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() =>
                  setFixConfirmModal({ open: false, fixHint: '', suggestedContent: '' })
                }
                className="flex-1 py-1.5 rounded bg-[#1B1B1B] text-[#B0B0B0] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplyFix}
                className="flex-1 py-1.5 rounded bg-[#E5484D] text-white text-xs font-mono font-bold"
              >
                Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="p-2.5 border-t border-[#303030] bg-[#0E0E10] text-[10px] font-mono text-[#8E8E8E] flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">Deterministic Guidance Engine</span>
        </div>
        <span className="text-[9px] text-[#E5484D]">v4.2B.1</span>
      </div>
    </aside>
  );
};
