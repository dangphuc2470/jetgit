"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode8 = __toESM(require("vscode"));

// src/git/gitService.ts
var import_child_process = require("child_process");
var import_util = require("util");
var import_fs = require("fs");
var import_path = require("path");

// src/cache.ts
var LRUCache = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
  }
  map = /* @__PURE__ */ new Map();
  get(key) {
    const value = this.map.get(key);
    if (value !== void 0) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }
  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
    this.map.set(key, value);
  }
  has(key) {
    return this.map.has(key);
  }
  delete(key) {
    return this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  get size() {
    return this.map.size;
  }
};

// src/git/gitService.ts
var execFileAsync = (0, import_util.promisify)(import_child_process.execFile);
var SEP = "";
var LOG_FORMAT = [
  "%H",
  // hash
  "%h",
  // abbreviated hash
  "%P",
  // parent hashes
  "%an",
  // author name
  "%ae",
  // author email
  "%aI",
  // author date ISO
  "%s",
  // subject
  "%b",
  // body
  "%D"
  // ref names
].join(SEP);
var GitService = class {
  commitCache = new LRUCache(5e3);
  cwd;
  constructor(workspaceRoot) {
    this.cwd = workspaceRoot;
  }
  getCwd() {
    return this.cwd;
  }
  setCwd(newCwd) {
    this.cwd = newCwd;
    this.commitCache.clear();
  }
  async isGitRepo() {
    try {
      await this.exec(["rev-parse", "--is-inside-work-tree"]);
      return true;
    } catch {
      return false;
    }
  }
  async findSubRepos() {
    const results = [];
    try {
      const entries = import_fs.readdirSync(this.cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          const subPath = import_path.join(this.cwd, entry.name);
          const subGit = import_path.join(subPath, ".git");
          if (import_fs.existsSync(subGit)) {
            results.push({ name: entry.name, path: subPath });
          }
        }
      }
    } catch {}
    return results;
  }
  async initRepo() {
    await execFileAsync("git", ["init"], { cwd: this.cwd });
  }
  async exec(args, maxBuffer = 10 * 1024 * 1024) {
    const { stdout } = await execFileAsync("git", args, {
      cwd: this.cwd,
      maxBuffer
    });
    return stdout;
  }
  async getRepoRoot() {
    const out = await this.exec(["rev-parse", "--show-toplevel"]);
    return out.trim();
  }
  async getLog(options = {}) {
    const args = ["log", `--format=${LOG_FORMAT}`];
    if (options.all !== false) {
      args.push("--all");
    }
    args.push("--decorate=full");
    if (options.maxCount)
      args.push(`-n${options.maxCount}`);
    if (options.skip)
      args.push(`--skip=${options.skip}`);
    if (options.author)
      args.push(`--author=${options.author}`);
    if (options.after)
      args.push(`--after=${options.after}`);
    if (options.before)
      args.push(`--before=${options.before}`);
    if (options.branch)
      args.push(options.branch);
    if (options.query)
      args.push(`--grep=${options.query}`, "-i");
    if (options.path) {
      args.push("--");
      args.push(options.path);
    }
    const output = await this.exec(args);
    const commits = [];
    for (const line of output.split("\n")) {
      if (!line.trim())
        continue;
      const parts = line.split(SEP);
      if (parts.length < 9)
        continue;
      const commit = {
        hash: parts[0],
        abbreviatedHash: parts[1],
        parents: parts[2] ? parts[2].split(" ") : [],
        author: parts[3],
        authorEmail: parts[4],
        authorDate: parts[5],
        subject: parts[6],
        body: parts[7],
        refs: parts[8] ? parseRefs(parts[8]) : []
      };
      this.commitCache.set(commit.hash, commit);
      commits.push(commit);
    }
    return commits;
  }
  async getCommitFiles(hash) {
    const output = await this.exec([
      "diff-tree",
      "--no-commit-id",
      "-r",
      "--name-status",
      "-M",
      hash
    ]);
    const changes = [];
    for (const line of output.split("\n")) {
      if (!line.trim())
        continue;
      const parts = line.split("	");
      const status = parts[0][0];
      if (parts.length === 3) {
        changes.push({ status, path: parts[2], oldPath: parts[1] });
      } else {
        changes.push({ status, path: parts[1] });
      }
    }
    return changes;
  }
  async getBranches() {
    const localOutput = await this.exec([
      "branch",
      "--format",
      "%(HEAD)%(refname:short)\t%(objectname:short)\t%(upstream:short)\t%(upstream:track,nobracket)"
    ]);
    const remoteOutput = await this.exec([
      "branch",
      "-r",
      "--format",
      "%(refname:short)\t%(objectname:short)"
    ]);
    const branches = [];
    for (const line of localOutput.split("\n")) {
      if (!line.trim())
        continue;
      const current = line[0] === "*";
      const rest = line.slice(1);
      const [name, hash, upstream, track] = rest.split("	");
      let ahead = 0;
      let behind = 0;
      if (track) {
        const aheadMatch = track.match(/ahead (\d+)/);
        if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
        const behindMatch = track.match(/behind (\d+)/);
        if (behindMatch) behind = parseInt(behindMatch[1], 10);
      }
      branches.push({
        name: name.trim(),
        current,
        remote: void 0,
        upstream: upstream || void 0,
        hash: hash.trim(),
        ahead: ahead || void 0,
        behind: behind || void 0
      });
    }
    for (const line of remoteOutput.split("\n")) {
      if (!line.trim())
        continue;
      if (line.includes(" -> "))
        continue;
      const [name, hash] = line.split("	");
      const trimmedName = name.trim();
      const slashIdx = trimmedName.indexOf("/");
      const remoteName = slashIdx !== -1 ? trimmedName.slice(0, slashIdx) : "origin";
      branches.push({
        name: trimmedName,
        current: false,
        remote: remoteName,
        upstream: void 0,
        hash: hash.trim()
      });
    }
    return branches;
  }
  async fetchAll() {
    return this.exec(["fetch", "--all", "--prune"]);
  }
  async getTags() {
    const output = await this.exec([
      "tag",
      "-l",
      "--format",
      "%(refname:short)	%(objectname:short)"
    ]);
    const tags = [];
    for (const line of output.split("\n")) {
      if (!line.trim())
        continue;
      const [name, hash] = line.split("	");
      tags.push({ name, hash });
    }
    return tags;
  }
  async getCurrentBranch() {
    const output = await this.exec(["rev-parse", "--abbrev-ref", "HEAD"]);
    return output.trim();
  }
  async checkout(ref) {
    await this.exec(["checkout", ref]);
  }
  async createBranch(name, startPoint) {
    const args = ["checkout", "-b", name];
    if (startPoint)
      args.push(startPoint);
    await this.exec(args);
  }
  async deleteBranch(name, force = false) {
    await this.exec(["branch", force ? "-D" : "-d", name]);
  }
  async renameBranch(oldName, newName) {
    await this.exec(["branch", "-m", oldName, newName]);
  }
  async pull(branch) {
    const args = ["pull"];
    if (branch)
      args.push("origin", branch);
    return this.exec(args);
  }
  async push(branch) {
    const args = ["push"];
    if (branch)
      args.push("origin", branch);
    return this.exec(args);
  }
  async checkoutAndRebase(branch, onto) {
    await this.checkout(branch);
    return this.rebase(onto);
  }
  async merge(branch) {
    return this.exec(["merge", branch]);
  }
  async rebase(onto) {
    return this.exec(["rebase", onto]);
  }
  async getDiffFiles(branch) {
    const output = await this.exec(["diff", "--name-status", "-M", branch]);
    const changes = [];
    for (const line of output.split("\n")) {
      if (!line.trim())
        continue;
      const parts = line.split("	");
      const status = parts[0][0];
      if (parts.length === 3) {
        changes.push({ status, path: parts[2], oldPath: parts[1] });
      } else {
        changes.push({ status, path: parts[1] });
      }
    }
    return changes;
  }
  async getStatus() {
    const output = await this.exec(["status", "--porcelain=v1", "-uall"]);
    const entries = [];
    for (const line of output.split("\n")) {
      if (!line)
        continue;
      const x = line[0];
      const y = line[1];
      const rest = line.slice(3);
      const arrowIdx = rest.indexOf(" -> ");
      if (arrowIdx !== -1) {
        entries.push({
          x,
          y,
          origPath: rest.slice(0, arrowIdx),
          path: rest.slice(arrowIdx + 4)
        });
      } else {
        entries.push({ x, y, path: rest });
      }
    }
    return entries;
  }
  async getUnmergedFiles() {
    const output = await this.exec(["diff", "--name-only", "--diff-filter=U"]);
    return output.split("\n").filter((l) => l.trim());
  }
  async stageFile(path3) {
    await this.exec(["add", path3]);
  }
  async stageFiles(paths) {
    await this.exec(["add", "--", ...paths]);
  }
  async commit(message) {
    await this.exec(["commit", "-m", message]);
  }
  async showFileAtCommit(hash, filePath) {
    return this.exec(["show", `${hash}:${filePath}`]);
  }
  async diff(ref1, ref2) {
    return this.exec(["diff", ref1, ref2]);
  }
  async getLogRange(base, head = "HEAD") {
    return this.getLog({ all: false, branch: `${base}..${head}` });
  }
  clearCache() {
    this.commitCache.clear();
  }
};
function parseRefs(raw) {
  if (!raw.trim())
    return [];
  return raw.split(",").map((r) => {
    r = r.trim();
    r = r.replace(/^HEAD -> /, "");
    r = r.replace(/^refs\/heads\//, "");
    r = r.replace(/^refs\/tags\//, "tag: ");
    r = r.replace(/^refs\/remotes\//, "");
    return r;
  });
}

// src/git/rebaseHandler.ts
var import_child_process2 = require("child_process");
var import_util2 = require("util");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var os = __toESM(require("os"));
var execFileAsync2 = (0, import_util2.promisify)(import_child_process2.execFile);
var writeFileAsync = (0, import_util2.promisify)(fs.writeFile);
var mkdtempAsync = (0, import_util2.promisify)(fs.mkdtemp);
var unlinkAsync = (0, import_util2.promisify)(fs.unlink);
var rmdirAsync = (0, import_util2.promisify)(fs.rmdir);
var RebaseHandler = class {
  constructor(cwd) {
    this.cwd = cwd;
  }
  /**
   * Execute an interactive rebase using a custom GIT_SEQUENCE_EDITOR
   * that writes the todo list we provide.
   */
  async executeRebase(base, todoItems) {
    const todoContent = todoItems.map((item) => `${item.action} ${item.hash} ${item.message}`).join("\n") + "\n";
    const tmpDir = await mkdtempAsync(path.join(os.tmpdir(), "ijgit-rebase-"));
    const todoPath = path.join(tmpDir, "todo");
    const scriptPath = path.join(tmpDir, "editor.sh");
    try {
      await writeFileAsync(todoPath, todoContent, "utf-8");
      await writeFileAsync(scriptPath, `#!/bin/sh
cp "${todoPath}" "$1"
`, {
        mode: 493,
        encoding: "utf-8"
      });
      const { stdout, stderr } = await execFileAsync2("git", ["rebase", "-i", base], {
        cwd: this.cwd,
        env: {
          ...process.env,
          GIT_SEQUENCE_EDITOR: scriptPath
        },
        maxBuffer: 5 * 1024 * 1024
      });
      return { success: true };
    } catch (err) {
      const stderr = err.stderr || err.message || String(err);
      if (stderr.includes("CONFLICT") || stderr.includes("could not apply")) {
        return { success: false, error: "conflict" };
      }
      return { success: false, error: stderr };
    } finally {
      try {
        await unlinkAsync(todoPath);
        await unlinkAsync(scriptPath);
        await rmdirAsync(tmpDir);
      } catch {
      }
    }
  }
  async abortRebase() {
    await execFileAsync2("git", ["rebase", "--abort"], { cwd: this.cwd });
  }
  async continueRebase() {
    try {
      await execFileAsync2("git", ["rebase", "--continue"], {
        cwd: this.cwd,
        env: {
          ...process.env,
          GIT_EDITOR: "true"
          // Accept default message
        }
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  }
  async isRebaseInProgress() {
    try {
      const rebaseMergePath = path.join(this.cwd, ".git", "rebase-merge");
      const rebaseApplyPath = path.join(this.cwd, ".git", "rebase-apply");
      return fs.existsSync(rebaseMergePath) || fs.existsSync(rebaseApplyPath);
    } catch {
      return false;
    }
  }
};

// src/views/graphPanel.ts
var vscode2 = __toESM(require("vscode"));

// src/git/graphBuilder.ts
function buildGraph(commits) {
  if (commits.length === 0)
    return [];
  const nodes = [];
  const columns = [];
  const colorMap = /* @__PURE__ */ new Map();
  let nextColor = 0;
  const hashToRow = /* @__PURE__ */ new Map();
  commits.forEach((c, i) => hashToRow.set(c.hash, i));
  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row];
    const lines = [];
    let col = columns.indexOf(commit.hash);
    if (col === -1) {
      col = columns.indexOf(null);
      if (col === -1) {
        col = columns.length;
        columns.push(null);
      }
    }
    if (!colorMap.has(commit.hash)) {
      colorMap.set(commit.hash, nextColor++);
    }
    const color = colorMap.get(commit.hash);
    columns[col] = null;
    const parents = commit.parents.filter((p) => hashToRow.has(p));
    for (let pi = 0; pi < parents.length; pi++) {
      const parentHash = parents[pi];
      const parentRow = hashToRow.get(parentHash);
      let parentCol = columns.indexOf(parentHash);
      if (parentCol !== -1) {
        const lineColor = colorMap.get(parentHash) ?? color;
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: parentCol,
          toRow: parentRow,
          color: lineColor
        });
      } else {
        let targetCol;
        if (pi === 0) {
          targetCol = col;
        } else {
          targetCol = columns.indexOf(null);
          if (targetCol === -1) {
            targetCol = columns.length;
            columns.push(null);
          }
        }
        columns[targetCol] = parentHash;
        if (!colorMap.has(parentHash)) {
          colorMap.set(parentHash, pi === 0 ? color : nextColor++);
        }
        const lineColor = colorMap.get(parentHash);
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: targetCol,
          toRow: parentRow,
          color: lineColor
        });
      }
    }
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] !== null && c !== col) {
        const targetHash = columns[c];
        const targetRow = hashToRow.get(targetHash);
        if (targetRow !== void 0 && targetRow > row) {
          const lineColor = colorMap.get(targetHash) ?? 0;
          lines.push({
            fromColumn: c,
            fromRow: row,
            toColumn: c,
            toRow: row + 1,
            color: lineColor
          });
        }
      }
    }
    nodes.push({ hash: commit.hash, column: col, color, lines });
  }
  const maxCol = Math.max(0, ...nodes.map((n) => n.column));
  return nodes;
}
function graphWidth(nodes) {
  if (nodes.length === 0)
    return 1;
  let max = 0;
  for (const node of nodes) {
    if (node.column > max)
      max = node.column;
    for (const line of node.lines) {
      if (line.fromColumn > max)
        max = line.fromColumn;
      if (line.toColumn > max)
        max = line.toColumn;
    }
  }
  return max + 1;
}

// src/providers/gitContentProvider.ts
var vscode = __toESM(require("vscode"));
var GitContentProvider = class _GitContentProvider {
  constructor(gitService) {
    this.gitService = gitService;
  }
  static scheme = "intellij-git";
  async provideTextDocumentContent(uri) {
    if (uri.path === "/empty")
      return "";
    const match = uri.path.match(/^\/([^/]+)\/(.+)$/);
    if (!match)
      return "";
    const [, hash, filePath] = match;
    try {
      return await this.gitService.showFileAtCommit(hash, filePath);
    } catch {
      return "";
    }
  }
  static makeUri(hash, filePath) {
    return vscode.Uri.from({
      scheme: _GitContentProvider.scheme,
      path: `/${hash}/${filePath}`
    });
  }
  static emptyUri() {
    return vscode.Uri.from({
      scheme: _GitContentProvider.scheme,
      path: "/empty"
    });
  }
};

// src/views/graphPanel.ts
var GraphViewProvider = class {
  constructor(extensionUri, gitService, log2) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.log = log2;
  }
  static viewType = "intellij-git.logView";
  view;
  allCommits = [];
  graphNodes = [];
  resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode2.Uri.joinPath(this.extensionUri, "dist", "webview")
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    this.loadInitialData();
  }
  lastBranches = [];
  lastTags = [];
  async loadInitialData() {
    const isRepo = await this.gitService.isGitRepo();
    if (!isRepo) {
      this.log.appendLine("Current directory is not a git repository. Searching subfolders...");
      const subRepos = await this.gitService.findSubRepos();
      this.log.appendLine(`Found ${subRepos.length} sub-repositories: ${subRepos.map((r) => r.name).join(", ")}`);
      this.view?.webview.postMessage({
        type: "noGitRepo",
        payload: {
          currentPath: this.gitService.getCwd(),
          subRepos
        }
      });
      return;
    }

    try {
      this.log.appendLine("Loading git log...");
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, all: true }),
        this.gitService.getBranches(),
        this.gitService.getTags()
      ]);
      this.allCommits = commits;
      this.lastBranches = branches;
      this.lastTags = tags;
      this.log.appendLine(`Loaded ${commits.length} commits, ${branches.length} branches, ${tags.length} tags`);
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags);
    } catch (err) {
      this.log.appendLine(`Git log failed: ${err.message}`);
      this.view?.webview.postMessage({
        type: "commits",
        payload: {
          commits: [],
          graphWidth: 1
        }
      });
      this.view?.webview.postMessage({
        type: "error",
        payload: err.message
      });
    }
  }
  sendCommits() {
    this.view?.webview.postMessage({
      type: "commits",
      payload: {
        commits: this.allCommits.map((c, i) => ({
          ...c,
          graph: this.graphNodes[i]
        })),
        graphWidth: graphWidth(this.graphNodes)
      }
    });
  }
  async sendBranches(branches, tags) {
    let currentBranch = "";
    try {
      currentBranch = await this.gitService.getCurrentBranch();
    } catch {
    }
    this.view?.webview.postMessage({
      type: "branches",
      payload: { branches, tags, currentBranch }
    });
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "ready": {
        this.log.appendLine("Webview reported ready");
        await this.loadInitialData();
        break;
      }
      case "switchRepo": {
        const repoPath = msg.payload;
        this.log.appendLine(`Switching git repository to: ${repoPath}`);
        this.gitService.setCwd(repoPath);
        await this.loadInitialData();
        break;
      }
      case "initRepo": {
        this.log.appendLine("Initializing new git repository...");
        try {
          await this.gitService.initRepo();
          vscode2.window.showInformationMessage("Initialized Git repository successfully.");
          await this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Failed to init git repository: ${err.message}`);
        }
        break;
      }
      case "selectCommit": {
        const hash = msg.payload;
        try {
          const files = await this.gitService.getCommitFiles(hash);
          this.view?.webview.postMessage({ type: "commitFiles", payload: { hash, files } });
        } catch (err) {
          vscode2.window.showErrorMessage(`Failed to get commit files: ${err.message}`);
        }
        break;
      }
      case "openDiff": {
        try {
          const { hash, file } = msg.payload;
          const commit = this.allCommits.find((c) => c.hash === hash);
          const parentHash = commit?.parents?.[0] || `${hash}~1`;
          const filePath = file.path;
          const oldPath = file.oldPath || filePath;
          const leftUri = file.status === "A" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(parentHash, oldPath);
          const rightUri = file.status === "D" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(hash, filePath);
          const fileName = filePath.split("/").pop() || filePath;
          const title = `${fileName} (${hash.slice(0, 7)})`;
          await vscode2.commands.executeCommand("vscode.diff", leftUri, rightUri, title);
        } catch (err) {
          this.log.appendLine(`openDiff ERROR: ${err.message}`);
          vscode2.window.showErrorMessage(`Diff failed: ${err.message}`);
        }
        break;
      }
      case "loadMore": {
        const skip = this.allCommits.length;
        try {
          const more = await this.gitService.getLog({ maxCount: 100, skip, all: true });
          if (more.length > 0) {
            this.allCommits.push(...more);
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          }
        } catch {
        }
        break;
      }
      case "filter": {
        const { branch, author, after, before, path: filePath, query } = msg.payload;
        try {
          this.allCommits = await this.gitService.getLog({
            maxCount: 300,
            all: !branch,
            branch: branch || void 0,
            author: author || void 0,
            after: after || void 0,
            before: before || void 0,
            path: filePath || void 0,
            query: query || void 0
          });
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
        } catch (err) {
          vscode2.window.showErrorMessage(`Filter failed: ${err.message}`);
        }
        break;
      }
      case "checkout": {
        const ref = msg.payload;
        try {
          await this.gitService.checkout(ref);
          vscode2.window.showInformationMessage(`Checked out ${ref}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Checkout failed: ${err.message}`);
        }
        break;
      }
      case "createBranch": {
        const { name, startPoint } = msg.payload;
        try {
          await this.gitService.createBranch(name, startPoint);
          vscode2.window.showInformationMessage(`Created branch ${name}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Create branch failed: ${err.message}`);
        }
        break;
      }
      case "deleteBranch": {
        const ref = msg.payload;
        try {
          await this.gitService.deleteBranch(ref);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
        break;
      }
      case "checkoutAndRebase": {
        const { branch, onto } = msg.payload;
        try {
          await this.gitService.checkoutAndRebase(branch, onto);
          vscode2.window.showInformationMessage(`Rebased ${branch} onto ${onto}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Checkout and rebase failed: ${err.message}`);
        }
        break;
      }
      case "rebase": {
        const branch = msg.payload;
        try {
          await this.gitService.rebase(branch);
          vscode2.window.showInformationMessage(`Rebased onto ${branch}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Rebase failed: ${err.message}`);
        }
        break;
      }
      case "compareBranch": {
        const { branch, withBranch } = msg.payload;
        try {
          this.allCommits = await this.gitService.getLog({
            branch: `${withBranch}..${branch}`,
            all: false
          });
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
          vscode2.window.showInformationMessage(`Comparing commits between ${branch} and ${withBranch}`);
        } catch (err) {
          vscode2.window.showErrorMessage(`Compare failed: ${err.message}`);
        }
        break;
      }
      case "showDiff": {
        const { branch } = msg.payload;
        try {
          const files = await this.gitService.getDiffFiles(branch);
          if (files.length === 0) {
            vscode2.window.showInformationMessage(`No differences between ${branch} and working tree.`);
            break;
          }
          const items = files.map((f) => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : "",
            file: f
          }));
          const picked = await vscode2.window.showQuickPick(items, {
            placeHolder: `Select a file changed against ${branch} to view diff`
          });
          if (picked) {
            const filePath = picked.file.path;
            const leftUri = GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
            const path2 = require("path");
            const rightUri = vscode2.Uri.file(path2.join(this.gitService.getCwd(), filePath));
            const fileName = filePath.split("/").pop() || filePath;
            await vscode2.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (${branch} \u2194 Working Tree)`);
          }
        } catch (err) {
          vscode2.window.showErrorMessage(`Show diff failed: ${err.message}`);
        }
        break;
      }
      case "pull": {
        const branch = msg.payload;
        try {
          const out = await this.gitService.pull(branch);
          vscode2.window.showInformationMessage(`Pulled ${branch}: ${out || "Already up to date."}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Pull failed: ${err.message}`);
        }
        break;
      }
      case "fetchAll": {
        try {
          vscode2.window.showInformationMessage("Fetching all remotes...");
          await this.gitService.fetchAll();
          vscode2.window.showInformationMessage("Fetched all remotes successfully.");
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Fetch all failed: ${err.message}`);
        }
        break;
      }
      case "push": {
        const branch = msg.payload;
        try {
          await this.gitService.push(branch);
          vscode2.window.showInformationMessage(`Pushed ${branch} successfully.`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Push failed: ${err.message}`);
        }
        break;
      }
      case "renameBranch": {
        const { oldName, newName } = msg.payload;
        try {
          await this.gitService.renameBranch(oldName, newName);
          vscode2.window.showInformationMessage(`Renamed branch '${oldName}' to '${newName}'`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Rename failed: ${err.message}`);
        }
        break;
      }
      case "mergeBranch": {
        const ref = msg.payload;
        try {
          await this.gitService.merge(ref);
          vscode2.window.showInformationMessage(`Merged ${ref}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Merge failed: ${err.message}`);
        }
        break;
      }
      case "rebaseFromHere": {
        const hash = msg.payload;
        await vscode2.commands.executeCommand("intellij-git.interactiveRebase", hash);
        break;
      }
    }
  }
  selectCommit(hash) {
    this.view?.webview.postMessage({
      type: "scrollToCommit",
      payload: hash
    });
  }
  refresh() {
    this.loadInitialData();
  }
  show() {
    if (this.view) {
      this.view.show(true);
    }
  }
  getHtml(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode2.Uri.joinPath(this.extensionUri, "dist", "webview", "graph", "graph.js")
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Log</title>
</head>
<body>
  <div id="app" style="height:100%;overflow:hidden;"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
};
function getNonce() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// src/views/rebasePanel.ts
var vscode3 = __toESM(require("vscode"));
var RebasePanel = class _RebasePanel {
  constructor(panel, extensionUri, gitService, rebaseHandler, baseHash) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.rebaseHandler = rebaseHandler;
    this.baseHash = baseHash;
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
    this.loadCommits();
  }
  static currentPanel;
  static viewType = "intellij-git.rebasePanel";
  panel;
  disposables = [];
  static createOrShow(extensionUri, gitService, rebaseHandler, baseHash) {
    if (_RebasePanel.currentPanel) {
      _RebasePanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode3.window.createWebviewPanel(
      _RebasePanel.viewType,
      "Interactive Rebase",
      vscode3.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode3.Uri.joinPath(extensionUri, "dist", "webview")
        ]
      }
    );
    _RebasePanel.currentPanel = new _RebasePanel(
      panel,
      extensionUri,
      gitService,
      rebaseHandler,
      baseHash
    );
  }
  async loadCommits() {
    try {
      const commits = await this.gitService.getLogRange(this.baseHash);
      commits.reverse();
      this.panel.webview.postMessage({
        type: "commits",
        payload: commits.map((c) => ({
          hash: c.hash,
          abbreviatedHash: c.abbreviatedHash,
          subject: c.subject,
          author: c.author,
          authorDate: c.authorDate
        }))
      });
    } catch (err) {
      vscode3.window.showErrorMessage(`Failed to load commits for rebase: ${err.message}`);
    }
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "startRebase": {
        const todoItems = msg.payload;
        this.panel.webview.postMessage({ type: "rebaseStarted" });
        const result = await this.rebaseHandler.executeRebase(this.baseHash, todoItems);
        if (result.success) {
          vscode3.window.showInformationMessage("Rebase completed successfully.");
          this.panel.dispose();
        } else if (result.error === "conflict") {
          vscode3.window.showWarningMessage(
            "Rebase paused due to conflicts. Resolve them and continue.",
            "Open Merge Editor"
          ).then((choice) => {
            if (choice === "Open Merge Editor") {
              vscode3.commands.executeCommand("intellij-git.resolveConflicts");
            }
          });
          this.panel.dispose();
        } else {
          vscode3.window.showErrorMessage(`Rebase failed: ${result.error}`);
          this.panel.webview.postMessage({
            type: "rebaseError",
            payload: result.error
          });
        }
        break;
      }
      case "abort": {
        try {
          await this.rebaseHandler.abortRebase();
          vscode3.window.showInformationMessage("Rebase aborted.");
        } catch {
        }
        this.panel.dispose();
        break;
      }
    }
  }
  getHtml() {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode3.Uri.joinPath(this.extensionUri, "dist", "webview", "rebase", "rebase.js")
    );
    const nonce = getNonce2();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Rebase</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  dispose() {
    _RebasePanel.currentPanel = void 0;
    this.panel.dispose();
    for (const d of this.disposables)
      d.dispose();
  }
};
function getNonce2() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// src/views/branchTree.ts
var vscode4 = __toESM(require("vscode"));
var BranchTreeProvider = class {
  constructor(gitService) {
    this.gitService = gitService;
  }
  _onDidChangeTreeData = new vscode4.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire(void 0);
  }
  getTreeItem(element) {
    const collapsible = element.children ? vscode4.TreeItemCollapsibleState.Expanded : vscode4.TreeItemCollapsibleState.None;
    const item = new vscode4.TreeItem(element.label, collapsible);
    switch (element.type) {
      case "category":
        item.iconPath = new vscode4.ThemeIcon(
          element.label === "Tags" ? "tag" : "git-branch"
        );
        break;
      case "remote-group":
        item.iconPath = new vscode4.ThemeIcon("cloud");
        break;
      case "branch-current":
        item.iconPath = new vscode4.ThemeIcon("star-full");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-current";
        break;
      case "branch-local":
        item.iconPath = new vscode4.ThemeIcon("git-branch");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-local";
        break;
      case "branch-remote":
        item.iconPath = new vscode4.ThemeIcon("git-branch");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-remote";
        break;
      case "tag":
        item.iconPath = new vscode4.ThemeIcon("tag");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "tag";
        break;
    }
    if (element.ref) {
      item.tooltip = element.ref;
    }
    return item;
  }
  async getChildren(element) {
    if (!element) {
      return this.getRootNodes();
    }
    return element.children || [];
  }
  async getRootNodes() {
    try {
      const [branches, tags, currentBranch] = await Promise.all([
        this.gitService.getBranches(),
        this.gitService.getTags(),
        this.gitService.getCurrentBranch()
      ]);
      const locals = branches.filter((b) => !b.remote);
      const remotes = branches.filter((b) => b.remote);
      const headNode = {
        label: `HEAD (${currentBranch})`,
        type: "branch-current",
        ref: currentBranch,
        hash: locals.find((b) => b.current)?.hash
      };
      const localChildren = locals.map((b) => ({
        label: b.name,
        type: b.current ? "branch-current" : "branch-local",
        ref: b.name,
        hash: b.hash
      }));
      const localNode = {
        label: "Local",
        type: "category",
        children: localChildren
      };
      const remoteGroups = /* @__PURE__ */ new Map();
      for (const b of remotes) {
        const remote = b.remote || "origin";
        if (!remoteGroups.has(remote)) {
          remoteGroups.set(remote, []);
        }
        const displayName = b.name.slice(remote.length + 1);
        remoteGroups.get(remote).push({
          label: displayName,
          type: "branch-remote",
          ref: b.name,
          hash: b.hash
        });
      }
      const remoteChildren = [];
      for (const [remote, bNodes] of remoteGroups) {
        remoteChildren.push({
          label: remote,
          type: "remote-group",
          children: bNodes
        });
      }
      const remoteNode = {
        label: "Remote",
        type: "category",
        children: remoteChildren
      };
      const tagChildren = tags.map((t) => ({
        label: t.name,
        type: "tag",
        ref: t.name,
        hash: t.hash
      }));
      const tagNode = {
        label: "Tags",
        type: "category",
        children: tagChildren
      };
      return [headNode, localNode, remoteNode, tagNode];
    } catch {
      return [];
    }
  }
};

// src/views/changelistTree.ts
var vscode5 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));
var DEFAULT_DATA = {
  changelists: [{ name: "Default", files: [] }],
  active: "Default"
};
var ChangelistTreeProvider = class {
  constructor(gitService, workspaceRoot) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    const vscodePath = path2.join(workspaceRoot, ".vscode");
    this.dataPath = path2.join(vscodePath, "changelists.json");
    this.load();
    vscode5.workspace.onDidCreateFiles(() => this.syncWithGitStatus());
    vscode5.workspace.onDidSaveTextDocument(() => this.syncWithGitStatus());
  }
  _onDidChangeTreeData = new vscode5.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  data = DEFAULT_DATA;
  dataPath;
  refresh() {
    this.load();
    this._onDidChangeTreeData.fire(void 0);
  }
  getTreeItem(element) {
    if (element.type === "changelist") {
      const item = new vscode5.TreeItem(
        element.name,
        vscode5.TreeItemCollapsibleState.Expanded
      );
      item.contextValue = element.active ? "changelist-active" : "changelist";
      item.iconPath = new vscode5.ThemeIcon(
        element.active ? "folder-active" : "folder"
      );
      if (element.active) {
        item.description = "(active)";
      }
      return item;
    } else {
      const item = new vscode5.TreeItem(
        path2.basename(element.path),
        vscode5.TreeItemCollapsibleState.None
      );
      item.description = path2.dirname(element.path);
      item.contextValue = "changelist-file";
      item.resourceUri = vscode5.Uri.joinPath(
        vscode5.Uri.file(this.workspaceRoot),
        element.path
      );
      item.command = {
        command: "vscode.open",
        title: "Open File",
        arguments: [item.resourceUri]
      };
      return item;
    }
  }
  getChildren(element) {
    if (!element) {
      return this.data.changelists.map((cl) => ({
        type: "changelist",
        name: cl.name,
        active: cl.name === this.data.active
      }));
    }
    if (element.type === "changelist") {
      const cl = this.data.changelists.find((c) => c.name === element.name);
      return (cl?.files || []).map((f) => ({
        type: "file",
        path: f,
        changelist: element.name
      }));
    }
    return [];
  }
  async createChangelist(name) {
    if (!name) {
      name = await vscode5.window.showInputBox({
        prompt: "Changelist name",
        placeHolder: "Feature: ..."
      });
    }
    if (!name)
      return;
    if (this.data.changelists.some((c) => c.name === name)) {
      vscode5.window.showWarningMessage(`Changelist "${name}" already exists.`);
      return;
    }
    this.data.changelists.push({ name, files: [] });
    this.save();
    this._onDidChangeTreeData.fire(void 0);
  }
  async deleteChangelist(name) {
    if (name === "Default") {
      vscode5.window.showWarningMessage("Cannot delete the Default changelist.");
      return;
    }
    const cl = this.data.changelists.find((c) => c.name === name);
    if (!cl)
      return;
    const defaultCl = this.data.changelists.find((c) => c.name === "Default");
    if (defaultCl && cl.files.length > 0) {
      defaultCl.files.push(...cl.files);
    }
    this.data.changelists = this.data.changelists.filter((c) => c.name !== name);
    if (this.data.active === name) {
      this.data.active = "Default";
    }
    this.save();
    this._onDidChangeTreeData.fire(void 0);
  }
  setActive(name) {
    this.data.active = name;
    this.save();
    this._onDidChangeTreeData.fire(void 0);
  }
  async commitChangelist(name) {
    const clName = name || this.data.active;
    const cl = this.data.changelists.find((c) => c.name === clName);
    if (!cl || cl.files.length === 0) {
      vscode5.window.showWarningMessage(`Changelist "${clName}" has no files.`);
      return;
    }
    const message = await vscode5.window.showInputBox({
      prompt: "Commit message",
      placeHolder: clName === "Default" ? "Commit message..." : clName,
      value: clName === "Default" ? "" : clName
    });
    if (!message)
      return;
    try {
      await this.gitService.stageFiles(cl.files);
      await this.gitService.commit(message);
      cl.files = [];
      this.save();
      this._onDidChangeTreeData.fire(void 0);
      vscode5.window.showInformationMessage(`Committed changelist "${clName}".`);
    } catch (err) {
      vscode5.window.showErrorMessage(`Commit failed: ${err.message}`);
    }
  }
  /**
   * Sync changelists with current git status — add new modified/untracked files
   * to the active changelist if they aren't in any changelist yet.
   */
  async syncWithGitStatus() {
    try {
      const status = await this.gitService.getStatus();
      const allFiles = /* @__PURE__ */ new Set();
      for (const cl of this.data.changelists) {
        for (const f of cl.files)
          allFiles.add(f);
      }
      const activeCl = this.data.changelists.find((c) => c.name === this.data.active);
      if (!activeCl)
        return;
      let changed = false;
      for (const entry of status) {
        if (!allFiles.has(entry.path)) {
          activeCl.files.push(entry.path);
          changed = true;
        }
      }
      const statusPaths = new Set(status.map((s) => s.path));
      for (const cl of this.data.changelists) {
        const before = cl.files.length;
        cl.files = cl.files.filter((f) => statusPaths.has(f));
        if (cl.files.length !== before)
          changed = true;
      }
      if (changed) {
        this.save();
        this._onDidChangeTreeData.fire(void 0);
      }
    } catch {
    }
  }
  load() {
    try {
      if (fs2.existsSync(this.dataPath)) {
        const raw = fs2.readFileSync(this.dataPath, "utf-8");
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = { ...DEFAULT_DATA };
    }
    if (!this.data.changelists.some((c) => c.name === "Default")) {
      this.data.changelists.unshift({ name: "Default", files: [] });
    }
  }
  save() {
    try {
      const dir = path2.dirname(this.dataPath);
      if (!fs2.existsSync(dir)) {
        fs2.mkdirSync(dir, { recursive: true });
      }
      fs2.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch {
    }
  }
};

// src/providers/blameDecorations.ts
var vscode6 = __toESM(require("vscode"));

// src/git/blameParser.ts
var import_child_process3 = require("child_process");
var import_util3 = require("util");
var execFileAsync3 = (0, import_util3.promisify)(import_child_process3.execFile);
var blameCache = new LRUCache(200);
function invalidateBlameCache(file) {
  blameCache.delete(file);
}
async function getBlame(cwd, file) {
  const cacheKey = `${cwd}:${file}`;
  const cached = blameCache.get(cacheKey);
  if (cached)
    return cached;
  const { stdout } = await execFileAsync3("git", [
    "blame",
    "--line-porcelain",
    file
  ], {
    cwd,
    maxBuffer: 10 * 1024 * 1024
  });
  const lines = parseLinePorcelain(stdout);
  const result = { lines, file };
  blameCache.set(cacheKey, result);
  return result;
}
function parseLinePorcelain(output) {
  const results = [];
  const rawLines = output.split("\n");
  let i = 0;
  while (i < rawLines.length) {
    const headerLine = rawLines[i];
    if (!headerLine || !headerLine.match(/^[0-9a-f]{40}\s/)) {
      i++;
      continue;
    }
    const headerParts = headerLine.split(" ");
    const hash = headerParts[0];
    const lineNumber = parseInt(headerParts[2], 10);
    let author = "";
    let authorEmail = "";
    let authorDate = "";
    let summary = "";
    let content = "";
    i++;
    while (i < rawLines.length) {
      const line = rawLines[i];
      if (line.startsWith("	")) {
        content = line.slice(1);
        i++;
        break;
      }
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx !== -1) {
        const key = line.slice(0, spaceIdx);
        const value = line.slice(spaceIdx + 1);
        switch (key) {
          case "author":
            author = value;
            break;
          case "author-mail":
            authorEmail = value.replace(/[<>]/g, "");
            break;
          case "author-time": {
            const ts = parseInt(value, 10);
            authorDate = new Date(ts * 1e3).toISOString();
            break;
          }
          case "summary":
            summary = value;
            break;
        }
      }
      i++;
    }
    results.push({ hash, author, authorEmail, authorDate, summary, lineNumber, content });
  }
  return results;
}

// src/providers/blameDecorations.ts
var blameEnabled = /* @__PURE__ */ new Map();
var decorationType;
function getOrCreateDecorationType() {
  if (!decorationType) {
    decorationType = vscode6.window.createTextEditorDecorationType({
      before: {
        width: "22ch",
        fontStyle: "normal"
      },
      isWholeLine: false
    });
  }
  return decorationType;
}
function formatShortDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(2);
  return `${day}.${month}.${year}`;
}
function ageBackground(authorDate) {
  const ageDays = (Date.now() - new Date(authorDate).getTime()) / (1e3 * 60 * 60 * 24);
  const t = Math.min(1, ageDays / 365);
  const r = Math.round(40 + t * 20);
  const g = Math.round(60 + t * 10);
  const b = Math.round(140 - t * 70);
  const a = 0.25 - t * 0.1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
var BlameDecorationProvider = class {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.disposables.push(
      vscode6.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (this.isEnabled(e.textEditor)) {
          this.updateDecorations(e.textEditor);
        }
      })
    );
    this.disposables.push(
      vscode6.workspace.onDidSaveTextDocument((doc) => {
        const relativePath = vscode6.workspace.asRelativePath(doc.uri);
        invalidateBlameCache(relativePath);
        this.blameData.delete(doc.uri.toString());
        const editor = vscode6.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === doc.uri.toString()
        );
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode6.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode6.window.onDidChangeTextEditorSelection((e) => {
        if (e.kind !== vscode6.TextEditorSelectionChangeKind.Mouse)
          return;
        if (!this.isEnabled(e.textEditor))
          return;
        const sel = e.selections[0];
        if (!sel || !sel.isEmpty)
          return;
        if (sel.active.character > 0)
          return;
        const uri = e.textEditor.document.uri.toString();
        const lines = this.blameData.get(uri);
        if (!lines)
          return;
        const blameLine = lines.find((l) => l.lineNumber === sel.active.line + 1);
        if (!blameLine || blameLine.hash.startsWith("0000000"))
          return;
        vscode6.commands.executeCommand("intellij-git.showCommitInLog", blameLine.hash);
      })
    );
    this.disposables.push(
      vscode6.languages.registerHoverProvider("*", {
        provideHover: (doc, pos) => this.provideHover(doc, pos)
      })
    );
  }
  disposables = [];
  blameData = /* @__PURE__ */ new Map();
  isEnabled(editor) {
    return blameEnabled.get(editor.document.uri.toString()) === true;
  }
  async toggle(editor) {
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
  async updateDecorations(editor) {
    const uri = editor.document.uri.toString();
    if (!blameEnabled.get(uri))
      return;
    const relativePath = vscode6.workspace.asRelativePath(editor.document.uri);
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
    const decorations = [];
    for (const range of visibleRanges) {
      for (let lineNum = range.start.line; lineNum <= range.end.line; lineNum++) {
        const blameLine = lines.find((l) => l.lineNumber === lineNum + 1);
        if (!blameLine)
          continue;
        if (blameLine.hash.startsWith("0000000"))
          continue;
        const date = formatShortDate(blameLine.authorDate);
        const author = blameLine.author.length > 10 ? blameLine.author.slice(0, 10) : blameLine.author.padEnd(10);
        const text = `${date}  ${author}`;
        decorations.push({
          range: new vscode6.Range(lineNum, 0, lineNum, 0),
          renderOptions: {
            before: {
              contentText: text,
              backgroundColor: ageBackground(blameLine.authorDate),
              color: "var(--vscode-editorLineNumber-foreground)",
              margin: "0 1.5em 0 0",
              fontFamily: "var(--vscode-editor-font-family)",
              fontSize: "var(--vscode-editor-font-size)"
            }
          }
        });
      }
    }
    editor.setDecorations(getOrCreateDecorationType(), decorations);
  }
  provideHover(document, position) {
    const uri = document.uri.toString();
    if (!blameEnabled.get(uri))
      return void 0;
    const lines = this.blameData.get(uri);
    if (!lines)
      return void 0;
    const blameLine = lines.find((l) => l.lineNumber === position.line + 1);
    if (!blameLine || blameLine.hash.startsWith("0000000"))
      return void 0;
    const md = new vscode6.MarkdownString();
    md.appendMarkdown(`**${blameLine.summary}**

`);
    md.appendMarkdown(`- **Author:** ${blameLine.author} (${blameLine.authorEmail})
`);
    md.appendMarkdown(`- **Date:** ${new Date(blameLine.authorDate).toLocaleString()}
`);
    md.appendMarkdown(`- **Commit:** \`${blameLine.hash.slice(0, 10)}\`
`);
    return new vscode6.Hover(md);
  }
  dispose() {
    for (const d of this.disposables)
      d.dispose();
    if (decorationType) {
      decorationType.dispose();
      decorationType = void 0;
    }
    blameEnabled.clear();
    this.blameData.clear();
  }
};

// src/providers/mergeProvider.ts
var vscode7 = __toESM(require("vscode"));
var MergeProvider = class {
  constructor(gitService, workspaceRoot) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    this.statusBarItem = vscode7.window.createStatusBarItem(
      vscode7.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "intellij-git.resolveConflicts";
    const interval = setInterval(() => this.checkForConflicts(), 3e3);
    this.disposables.push({ dispose: () => clearInterval(interval) });
    this.disposables.push(this.statusBarItem);
    this.checkForConflicts();
  }
  disposables = [];
  statusBarItem;
  async checkForConflicts() {
    try {
      const unmerged = await this.gitService.getUnmergedFiles();
      if (unmerged.length > 0) {
        this.statusBarItem.text = `$(git-merge) ${unmerged.length} conflict${unmerged.length > 1 ? "s" : ""}`;
        this.statusBarItem.tooltip = `${unmerged.length} unresolved merge conflict(s). Click to resolve.`;
        this.statusBarItem.backgroundColor = new vscode7.ThemeColor(
          "statusBarItem.warningBackground"
        );
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    } catch {
      this.statusBarItem.hide();
    }
  }
  async resolveConflicts() {
    const unmerged = await this.gitService.getUnmergedFiles();
    if (unmerged.length === 0) {
      vscode7.window.showInformationMessage("No merge conflicts to resolve.");
      return;
    }
    const items = unmerged.map((f) => ({
      label: f,
      description: "Unresolved conflict"
    }));
    const selected = await vscode7.window.showQuickPick(items, {
      placeHolder: `${unmerged.length} file(s) with conflicts \u2014 select to resolve`,
      canPickMany: false
    });
    if (selected) {
      const fileUri = vscode7.Uri.joinPath(
        vscode7.Uri.file(this.workspaceRoot),
        selected.label
      );
      await vscode7.commands.executeCommand("vscode.open", fileUri);
    }
  }
  async acceptAllNonConflicting() {
    try {
      const status = await this.gitService.getStatus();
      let staged = 0;
      for (const entry of status) {
        if (entry.x === "M" && entry.y === " ") {
          await this.gitService.stageFile(entry.path);
          staged++;
        }
      }
      if (staged > 0) {
        vscode7.window.showInformationMessage(`Auto-staged ${staged} resolved file(s).`);
      }
    } catch (err) {
      vscode7.window.showErrorMessage(`Failed: ${err.message}`);
    }
  }
  dispose() {
    for (const d of this.disposables)
      d.dispose();
  }
};

// src/extension.ts
var log;
function activate(context) {
  log = vscode8.window.createOutputChannel("IntelliJ Git");
  context.subscriptions.push(log);
  log.appendLine("IntelliJ Git extension activating...");
  const workspaceFolder = vscode8.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    log.appendLine("No workspace folder found \u2014 aborting activation.");
    return;
  }
  const workspaceRoot = workspaceFolder.uri.fsPath;
  log.appendLine(`Workspace root: ${workspaceRoot}`);
  const gitService = new GitService(workspaceRoot);
  const rebaseHandler = new RebaseHandler(workspaceRoot);
  const gitContentProvider = new GitContentProvider(gitService);
  context.subscriptions.push(
    vscode8.workspace.registerTextDocumentContentProvider(
      GitContentProvider.scheme,
      gitContentProvider
    )
  );
  gitService.getRepoRoot().then(
    (root) => log.appendLine(`Git repo root: ${root}`),
    (err) => log.appendLine(`Git repo not found: ${err.message}`)
  );
  const graphViewProvider = new GraphViewProvider(context.extensionUri, gitService, log);
  context.subscriptions.push(
    vscode8.window.registerWebviewViewProvider(
      GraphViewProvider.viewType,
      graphViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  const branchTree = new BranchTreeProvider(gitService);
  const branchTreeView = vscode8.window.createTreeView("intellij-git.branches", {
    treeDataProvider: branchTree,
    showCollapseAll: true
  });
  context.subscriptions.push(branchTreeView);
  const changelistTree = new ChangelistTreeProvider(gitService, workspaceRoot);
  const changelistTreeView = vscode8.window.createTreeView("intellij-git.changelists", {
    treeDataProvider: changelistTree,
    showCollapseAll: true
  });
  context.subscriptions.push(changelistTreeView);
  const blameProvider = new BlameDecorationProvider(workspaceRoot);
  context.subscriptions.push(blameProvider);
  const mergeProvider = new MergeProvider(gitService, workspaceRoot);
  context.subscriptions.push(mergeProvider);
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.openLog", () => {
      vscode8.commands.executeCommand("intellij-git.logView.focus");
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.showCommitInLog", (hash) => {
      vscode8.commands.executeCommand("intellij-git.logView.focus");
      graphViewProvider.selectCommit(hash);
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.toggleBlame", () => {
      const editor = vscode8.window.activeTextEditor;
      if (editor) {
        log.appendLine(`Toggling blame on ${editor.document.uri.fsPath}`);
        blameProvider.toggle(editor);
      } else {
        vscode8.window.showWarningMessage("No active text editor for blame.");
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.interactiveRebase", async (baseHash) => {
      if (!baseHash) {
        baseHash = await vscode8.window.showInputBox({
          prompt: "Base commit hash (rebase from this point)",
          placeHolder: "e.g. HEAD~5 or a commit hash"
        });
      }
      if (!baseHash)
        return;
      RebasePanel.createOrShow(context.extensionUri, gitService, rebaseHandler, baseHash);
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.refreshBranches", () => {
      branchTree.refresh();
      graphViewProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.checkoutBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      try {
        await gitService.checkout(ref);
        graphViewProvider.refresh();
        vscode8.window.showInformationMessage(`Checked out ${ref}`);
      } catch (err) {
        vscode8.window.showErrorMessage(`Checkout failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.createBranch", async (node) => {
      const name = await vscode8.window.showInputBox({
        prompt: "New branch name",
        placeHolder: "feature/..."
      });
      if (!name)
        return;
      try {
        await gitService.createBranch(name, node?.ref);
        graphViewProvider.refresh();
        vscode8.window.showInformationMessage(`Created and checked out ${name}`);
      } catch (err) {
        vscode8.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.deleteBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      const confirm = await vscode8.window.showWarningMessage(
        `Delete branch "${ref}"?`,
        { modal: true },
        "Delete"
      );
      if (confirm !== "Delete")
        return;
      try {
        await gitService.deleteBranch(ref);
        graphViewProvider.refresh();
      } catch (err) {
        vscode8.window.showErrorMessage(`Delete failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.mergeBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      try {
        await gitService.merge(ref);
        graphViewProvider.refresh();
        vscode8.window.showInformationMessage(`Merged ${ref} into current branch.`);
      } catch (err) {
        if (err.message?.includes("CONFLICT")) {
          vscode8.window.showWarningMessage(
            `Merge conflicts detected. Resolve them to complete the merge.`,
            "Resolve"
          ).then((choice) => {
            if (choice === "Resolve") {
              vscode8.commands.executeCommand("intellij-git.resolveConflicts");
            }
          });
        } else {
          vscode8.window.showErrorMessage(`Merge failed: ${err.message}`);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.rebaseBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      try {
        await gitService.rebase(ref);
        graphViewProvider.refresh();
        vscode8.window.showInformationMessage(`Rebased current branch onto ${ref}.`);
      } catch (err) {
        vscode8.window.showErrorMessage(`Rebase failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.compareBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      try {
        const current = await gitService.getCurrentBranch();
        await vscode8.commands.executeCommand("git.branchCompare", ref, current);
      } catch (err) {
        vscode8.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.resolveConflicts", () => {
      mergeProvider.resolveConflicts();
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.acceptAllNonConflicting", () => {
      mergeProvider.acceptAllNonConflicting();
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.newChangelist", () => {
      changelistTree.createChangelist();
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.deleteChangelist", (node) => {
      if (node?.name) {
        changelistTree.deleteChangelist(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.setActiveChangelist", (node) => {
      if (node?.name) {
        changelistTree.setActive(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.commitChangelist", (node) => {
      changelistTree.commitChangelist(node?.name);
    })
  );
  context.subscriptions.push(
    vscode8.commands.registerCommand("intellij-git.refreshChangelists", () => {
      changelistTree.refresh();
    })
  );
  const gitWatcher = vscode8.workspace.createFileSystemWatcher(
    new vscode8.RelativePattern(workspaceRoot, ".git/{HEAD,refs/**,index}")
  );
  gitWatcher.onDidChange(() => {
    branchTree.refresh();
    graphViewProvider.refresh();
  });
  context.subscriptions.push(gitWatcher);
  log.appendLine("IntelliJ Git extension activated.");
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
