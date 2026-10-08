import * as vscode from 'vscode';
import { getBlame, invalidateBlameCache, type BlameLine } from '../git/blameParser';

const blameEnabled = new Map<string, boolean>();
let decorationType: vscode.TextEditorDecorationType | undefined;

function getOrCreateDecorationType(): vscode.TextEditorDecorationType {
  if (!decorationType) {
    decorationType = vscode.window.createTextEditorDecorationType({
      before: {
        width: '22ch',
        fontStyle: 'normal',
      },
      isWholeLine: false,
    });
  }
  return decorationType;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(2);
  return `${day}.${month}.${year}`;
}

/**
 * Age-based background color. Recent = warm, old = cool.
 */
function ageBackground(authorDate: string): string {
  const ageDays = (Date.now() - new Date(authorDate).getTime()) / (1000 * 60 * 60 * 24);
  const t = Math.min(1, ageDays / 365);

  // Recent: blue highlight, Old: subtle gray
  const r = Math.round(40 + t * 20);
  const g = Math.round(60 + t * 10);
  const b = Math.round(140 - t * 70);
  const a = 0.25 - t * 0.1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export class BlameDecorationProvider implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private blameData = new Map<string, BlameLine[]>();

  constructor(private workspaceRoot: string) {
    this.disposables.push(
      vscode.window.onDidChangeTextEditorVisibleRanges(e => {
        if (this.isEnabled(e.textEditor)) {
          this.updateDecorations(e.textEditor);
        }
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(doc => {
        const relativePath = vscode.workspace.asRelativePath(doc.uri);
        invalidateBlameCache(relativePath);
        this.blameData.delete(doc.uri.toString());
        const editor = vscode.window.visibleTextEditors.find(
          e => e.document.uri.toString() === doc.uri.toString(),
        );
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      }),
    );

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      }),
    );

    // Click on blame annotation → navigate to commit in git log
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(e => {
        if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) return;
        if (!this.isEnabled(e.textEditor)) return;
        const sel = e.selections[0];
        if (!sel || !sel.isEmpty) return;
        // Only trigger when clicking in the blame gutter area (column 0)
        if (sel.active.character > 0) return;

        const uri = e.textEditor.document.uri.toString();
        const lines = this.blameData.get(uri);
        if (!lines) return;

        const blameLine = lines.find(l => l.lineNumber === sel.active.line + 1);
        if (!blameLine || blameLine.hash.startsWith('0000000')) return;

        vscode.commands.executeCommand('intellij-git.showCommitInLog', blameLine.hash);
      }),
    );

    this.disposables.push(
      vscode.languages.registerHoverProvider('*', {
        provideHover: (doc, pos) => this.provideHover(doc, pos),
      }),
    );
  }

  isEnabled(editor: vscode.TextEditor): boolean {
    return blameEnabled.get(editor.document.uri.toString()) === true;
  }

  async toggle(editor: vscode.TextEditor): Promise<void> {
    const uri = editor.document.uri.toString();
    const current = blameEnabled.get(uri) ?? false;

    if (current) {
      blameEnabled.set(uri, false);
      editor.setDecorations(getOrCreateDecorationType(), []);
    } else {
      blameEnabled.set(uri, true);
      await this.updateDecorations(editor);
    }
  }

  private async updateDecorations(editor: vscode.TextEditor): Promise<void> {
    const uri = editor.document.uri.toString();
    if (!blameEnabled.get(uri)) return;

    const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
    let lines = this.blameData.get(uri);

    if (!lines) {
      try {
        const result = await getBlame(this.workspaceRoot, relativePath);
        lines = result.lines;
        this.blameData.set(uri, lines);
      } catch {
        blameEnabled.set(uri, false);
        return;
      }
    }

    const visibleRanges = editor.visibleRanges;
    const decorations: vscode.DecorationOptions[] = [];

    for (const range of visibleRanges) {
      for (let lineNum = range.start.line; lineNum <= range.end.line; lineNum++) {
        const blameLine = lines.find(l => l.lineNumber === lineNum + 1);
        if (!blameLine) continue;
        if (blameLine.hash.startsWith('0000000')) continue;

        const date = formatShortDate(blameLine.authorDate);
        // Truncate author to 10 chars for compact display
        const author = blameLine.author.length > 10
          ? blameLine.author.slice(0, 10)
          : blameLine.author.padEnd(10);
        const text = `${date}  ${author}`;

        decorations.push({
          range: new vscode.Range(lineNum, 0, lineNum, 0),
          renderOptions: {
            before: {
              contentText: text,
              backgroundColor: ageBackground(blameLine.authorDate),
              color: 'var(--vscode-editorLineNumber-foreground)',
              margin: '0 1.5em 0 0',
            },
          },
        });
      }
    }

    editor.setDecorations(getOrCreateDecorationType(), decorations);
  }

  private provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const uri = document.uri.toString();
    if (!blameEnabled.get(uri)) return undefined;

    const lines = this.blameData.get(uri);
    if (!lines) return undefined;

    const blameLine = lines.find(l => l.lineNumber === position.line + 1);
    if (!blameLine || blameLine.hash.startsWith('0000000')) return undefined;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${blameLine.summary}**\n\n`);
    md.appendMarkdown(`- **Author:** ${blameLine.author} (${blameLine.authorEmail})\n`);
    md.appendMarkdown(`- **Date:** ${new Date(blameLine.authorDate).toLocaleString()}\n`);
    md.appendMarkdown(`- **Commit:** \`${blameLine.hash.slice(0, 10)}\`\n`);

    return new vscode.Hover(md);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    if (decorationType) {
      decorationType.dispose();
      decorationType = undefined;
    }
    blameEnabled.clear();
    this.blameData.clear();
  }
}
