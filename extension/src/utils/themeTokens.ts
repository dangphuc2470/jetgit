import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ThemeTokens {
  kwd: string;
  type: string;
  fn: string;
  str: string;
  num: string;
  constVal: string;
  varVal: string;
  comment: string;
  anno: string;
  punct: string;
}

export const defaultThemeTokens: ThemeTokens = {
  kwd: '#fd6883',
  type: '#85dacc',
  fn: '#adda78',
  str: '#f9cc6c',
  num: '#a8a9eb',
  constVal: '#a8a9eb',
  varVal: '#fff1f3',
  comment: '#72696a',
  anno: '#85dacc',
  punct: '#948a8b',
};

export function getThemeTokens(): ThemeTokens {
  try {
    const activeThemeName = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
    if (!activeThemeName) return defaultThemeTokens;

    for (const ext of vscode.extensions.all) {
      const themes = ext.packageJSON?.contributes?.themes;
      if (!Array.isArray(themes)) continue;
      const matched = themes.find((t: any) => t.label === activeThemeName || t.id === activeThemeName);
      if (!matched || !matched.path) continue;

      const themePath = path.join(ext.extensionPath, matched.path);
      if (!fs.existsSync(themePath)) continue;

      let content = fs.readFileSync(themePath, 'utf8');
      content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      const themeJson = JSON.parse(content);
      const tc = themeJson.tokenColors || [];

      const findColor = (targetScopes: string[]): string | null => {
        for (const target of targetScopes) {
          for (const rule of tc) {
            if (!rule.settings || !rule.settings.foreground) continue;
            const scopes = Array.isArray(rule.scope) ? rule.scope : (typeof rule.scope === 'string' ? rule.scope.split(',').map((s: string) => s.trim()) : []);
            if (scopes.includes(target)) return rule.settings.foreground;
          }
        }
        for (const target of targetScopes) {
          for (const rule of tc) {
            if (!rule.settings || !rule.settings.foreground) continue;
            const scopes = Array.isArray(rule.scope) ? rule.scope : (typeof rule.scope === 'string' ? rule.scope.split(',').map((s: string) => s.trim()) : []);
            for (const s of scopes) {
              if (!s.includes(' ') && s.startsWith(target + '.')) return rule.settings.foreground;
            }
          }
        }
        return null;
      };

      const kwd = findColor(['keyword']) || defaultThemeTokens.kwd;
      const type = findColor(['entity.name.type', 'support.type', 'storage.type']) || defaultThemeTokens.type;
      const fn = findColor(['entity.name.function', 'support.function']) || defaultThemeTokens.fn;
      const str = findColor(['string']) || defaultThemeTokens.str;
      const num = findColor(['constant.numeric']) || defaultThemeTokens.num;
      const constVal = findColor(['constant.language']) || defaultThemeTokens.constVal;
      const comment = findColor(['comment']) || defaultThemeTokens.comment;
      const varVal = findColor(['variable']) || defaultThemeTokens.varVal;
      const anno = findColor(['punctuation.definition.annotation', 'meta.annotation']) || type;
      const punct = findColor(['punctuation']) || defaultThemeTokens.punct;

      return { kwd, type, fn, str, num, constVal, varVal, comment, anno, punct };
    }
  } catch {}
  return defaultThemeTokens;
}

export function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
