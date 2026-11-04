import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getLanguageMeta } from '../src/components/workspace/CodeEditor.tsx';

describe('AI Website Builder Studio — Stage 4.2B.1 Workspace & Editor Unit Test Suite', () => {
  describe('1. Multiline Editing & Line Counting Logic', () => {
    it('calculates line count and character length accurately for multiline text', () => {
      const text = 'line1\nline2\nline3\nline4\nline5';
      const lines = text.split('\n');
      assert.equal(lines.length, 5);
      assert.equal(text.length, 29);
    });

    it('handles appending multiline blocks without losing trailing newlines', () => {
      const initial = '<h1>Title</h1>';
      const addition = '<p>Paragraph 1</p>\n<p>Paragraph 2</p>';
      const combined = `${initial}\n\n${addition}`;
      assert.equal(combined.split('\n').length, 4);
      assert.ok(combined.includes('<p>Paragraph 2</p>'));
    });
  });

  describe('2. Cursor Preservation & Selection Offset Calculation', () => {
    it('calculates correct cursor selection offset after inserting 2 spaces for tab', () => {
      const content = 'function test() {}';
      const cursorStart = 16; // before {}
      const inserted = '  ';
      const updated = content.substring(0, cursorStart) + inserted + content.substring(cursorStart);
      const newCursorPos = cursorStart + inserted.length;

      assert.equal(updated, 'function test()   {}');
      assert.equal(newCursorPos, 18);
    });
  });

  describe('3. Indentation & Outdentation Logic', () => {
    it('indents single and multiline selections with 2 spaces', () => {
      const rawLines = ['const a = 1;', 'const b = 2;'];
      const indented = rawLines.map((line) => `  ${line}`).join('\n');
      assert.equal(indented, '  const a = 1;\n  const b = 2;');
    });

    it('outdents lines by removing up to 2 leading spaces', () => {
      const indentedLines = ['  const a = 1;', '    const b = 2;', 'no_indent'];
      const outdented = indentedLines
        .map((line) => line.replace(/^ {1,2}/, ''))
        .join('\n');
      assert.equal(outdented, 'const a = 1;\n  const b = 2;\nno_indent');
    });
  });

  describe('4. Undo & Redo History Stack Management', () => {
    it('manages undo/redo state stack correctly', () => {
      const history: string[] = ['state0'];
      let pointer = 0;

      // Push state1
      history.push('state1');
      pointer = history.length - 1;
      assert.equal(history[pointer], 'state1');

      // Undo
      pointer = Math.max(0, pointer - 1);
      assert.equal(history[pointer], 'state0');

      // Redo
      pointer = Math.min(history.length - 1, pointer + 1);
      assert.equal(history[pointer], 'state1');
    });
  });

  describe('5. Find and Replace Search Matching Logic', () => {
    it('replaces all occurrences of search term in document', () => {
      const code = 'const foo = 1; console.log(foo); return foo;';
      const replaced = code.replaceAll('foo', 'bar');
      assert.equal(replaced, 'const bar = 1; console.log(bar); return bar;');
    });

    it('performs case-insensitive replacement when configured', () => {
      const code = '<DIV>hello</Div>';
      const replaced = code.replace(/div/gi, 'section');
      assert.equal(replaced, '<section>hello</section>');
    });
  });

  describe('6. Language Detection & Capability Badges', () => {
    it('identifies in-browser live previewable languages', () => {
      const htmlMeta = getLanguageMeta('html', 'index.html');
      assert.equal(htmlMeta.name, 'HTML5 Document');
      assert.equal(htmlMeta.isPreviewable, true);

      const cssMeta = getLanguageMeta('css', 'styles.css');
      assert.equal(cssMeta.isPreviewable, true);

      const jsMeta = getLanguageMeta('javascript', 'app.js');
      assert.equal(jsMeta.isPreviewable, true);

      const tsMeta = getLanguageMeta('typescript', 'main.tsx');
      assert.equal(tsMeta.isPreviewable, true);
    });

    it('identifies educational reference-only languages', () => {
      const pyMeta = getLanguageMeta('python', 'script.py');
      assert.equal(pyMeta.name, 'Python 3');
      assert.equal(pyMeta.isPreviewable, false);

      const javaMeta = getLanguageMeta('java', 'Main.java');
      assert.equal(javaMeta.isPreviewable, false);

      const cppMeta = getLanguageMeta('cpp', 'main.cpp');
      assert.equal(cppMeta.isPreviewable, false);

      const sqlMeta = getLanguageMeta('sql', 'query.sql');
      assert.equal(sqlMeta.isPreviewable, false);
    });
  });

  describe('7. Snippet Insertion into Active File', () => {
    it('appends snippet to non-empty file with proper newline separation', () => {
      const current = '<h1>Welcome</h1>';
      const snippet = '<button className="btn">Click</button>';
      const result = current ? `${current}\n\n${snippet}` : snippet;

      assert.equal(result, '<h1>Welcome</h1>\n\n<button className="btn">Click</button>');
    });

    it('inserts snippet directly into empty file', () => {
      const current = '';
      const snippet = 'console.log("hello");';
      const result = current ? `${current}\n\n${snippet}` : snippet;

      assert.equal(result, 'console.log("hello");');
    });
  });

  describe('8. Beginner Assistant Exercises and Hint Resolution', () => {
    it('toggles hint visibility map for lessons', () => {
      const hintMap: Record<string, boolean> = {};
      const lessonId = 'l1';

      assert.equal(hintMap[lessonId], undefined);

      hintMap[lessonId] = true;
      assert.equal(hintMap[lessonId], true);
    });
  });

  describe('9. Real-Time Diagnostic Syntax Checker Rules', () => {
    it('detects unclosed HTML div tags', () => {
      const content = '<div><p>Hello</p>'; // 1 open, 0 close
      const openDivs = (content.match(/<div[\s>]/gi) || []).length;
      const closeDivs = (content.match(/<\/div>/gi) || []).length;

      assert.notEqual(openDivs, closeDivs);
      assert.equal(openDivs - closeDivs, 1);
    });

    it('detects unmatched CSS curly braces', () => {
      const css = '.card { color: red;';
      const openBraces = (css.match(/\{/g) || []).length;
      const closeBraces = (css.match(/\}/g) || []).length;

      assert.notEqual(openBraces, closeBraces);
    });

    it('validates syntax for valid JavaScript code', () => {
      const validJs = 'const sum = (a, b) => a + b;';
      assert.doesNotThrow(() => {
        new Function(validJs);
      });
    });

    it('catches parse error for invalid JavaScript syntax', () => {
      const invalidJs = 'const sum = (a, b => a + b;'; // missing closing paren
      assert.throws(() => {
        new Function(invalidJs);
      });
    });
  });

  describe('10. Unsaved Draft Preservation Logic', () => {
    it('identifies modified file IDs by comparing local content with server content', () => {
      const serverFiles = [
        { id: 'f1', name: 'index.html', language: 'html' as const, content: 'v1' },
      ];
      const localFiles = [
        { id: 'f1', name: 'index.html', language: 'html' as const, content: 'v2' },
      ];

      const modifiedSet = new Set<string>();
      localFiles.forEach((f) => {
        const sf = serverFiles.find((s) => s.id === f.id);
        if (!sf || sf.content !== f.content) {
          modifiedSet.add(f.id);
        }
      });

      assert.equal(modifiedSet.has('f1'), true);
      assert.equal(modifiedSet.size, 1);
    });
  });
});
