import * as vscode from 'vscode';
import { GitService, Commit } from '../../git/gitService';

export interface GraphActionHost {
  gitService: GitService;
  extensionUri: vscode.Uri;
  loadInitialData(): Promise<void>;
  openPushDialog(branch?: string): Promise<void>;
  view?: vscode.WebviewView;
  updateGraph(commits: Commit[]): void;
}
