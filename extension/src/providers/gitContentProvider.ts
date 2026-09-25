import * as vscode from 'vscode';
import { GitService } from '../git/gitService';

/**
 * Provides file contents at a specific git commit for diff viewing.
 * URI format: intellij-git:/<hash>/<filePath>
 */
export class GitContentProvider implements vscode.TextDocumentContentProvider {
  static readonly scheme = 'intellij-git';

  constructor(private gitService: GitService) {}

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    if (uri.path === '/empty') return '';

    const match = uri.path.match(/^\/([^/]+)\/(.+)$/);
    if (!match) return '';

    const [, hash, filePath] = match;
    try {
      return await this.gitService.showFileAtCommit(hash, filePath);
    } catch {
      return '';
    }
  }

  static makeUri(hash: string, filePath: string): vscode.Uri {
    return vscode.Uri.from({
      scheme: GitContentProvider.scheme,
      path: `/${hash}/${filePath}`,
    });
  }

  static emptyUri(): vscode.Uri {
    return vscode.Uri.from({
      scheme: GitContentProvider.scheme,
      path: '/empty',
    });
  }
}
