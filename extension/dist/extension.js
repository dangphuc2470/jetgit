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
var vscode10 = __toESM(require("vscode"));

// src/git/gitService.ts
var import_child_process = require("child_process");
var import_util = require("util");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));

// src/cache.ts
var LRUCache = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
  }
  maxSize;
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
  "%x00%H",
  // hash with null byte commit delimiter
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
      const entries = fs.readdirSync(this.cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          const subPath = path.join(this.cwd, entry.name);
          const subGit = path.join(subPath, ".git");
          if (fs.existsSync(subGit)) {
            results.push({ name: entry.name, path: subPath });
          }
        }
      }
    } catch {
    }
    return results;
  }
  async initRepo() {
    await execFileAsync("git", ["init"], { cwd: this.cwd });
  }
  async exec(args, maxBuffer = 10 * 1024 * 1024, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { stdout } = await execFileAsync("git", args, {
          cwd: this.cwd,
          maxBuffer
        });
        return stdout;
      } catch (err) {
        const isLockError = err?.message && (
          err.message.includes("index.lock") ||
          (err.message.includes("Unable to create") && err.message.includes(".lock"))
        );
        if (isLockError && attempt < retries - 1) {
          try {
            const dotGit = path.join(this.cwd, ".git");
            let lockPath = path.join(dotGit, "index.lock");
            if (fs.existsSync(dotGit) && fs.statSync(dotGit).isFile()) {
              const content = fs.readFileSync(dotGit, "utf8").trim();
              if (content.startsWith("gitdir:")) {
                const relOrAbs = content.replace(/^gitdir:\s*/, "");
                const actualGitDir = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(this.cwd, relOrAbs);
                lockPath = path.join(actualGitDir, "index.lock");
              }
            }
            if (fs.existsSync(lockPath)) {
              const stat = fs.statSync(lockPath);
              if (Date.now() - stat.mtimeMs > 5000) {
                fs.unlinkSync(lockPath);
                continue;
              }
            }
          } catch {}
          await new Promise((res) => setTimeout(res, 200 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error("Git command failed after retries");
  }
  async getRepoRoot() {
    const out = await this.exec(["rev-parse", "--show-toplevel"]);
    return out.trim();
  }
  async getLog(options = {}) {
    const args = ["log", `--format=${LOG_FORMAT}`, "--topo-order"];
    if (options.all === true || !options.branch && options.all !== false) {
      args.push("--all");
    }
    args.push("--decorate=full");
    if (options.maxCount) args.push(`-n${options.maxCount}`);
    if (options.skip) args.push(`--skip=${options.skip}`);
    if (options.author) args.push(`--author=${options.author}`);
    if (options.after) args.push(`--after=${options.after}`);
    if (options.before) args.push(`--before=${options.before}`);
    if (options.query) {
      args.push(`--grep=${options.query}`);
      args.push("-i");
    }
    if (options.branch) args.push(options.branch);
    if (options.path) {
      args.push("--");
      args.push(options.path);
    }
    const output = await this.exec(args);
    const commits = [];
    for (const chunk of output.split("\0")) {
      if (!chunk.trim()) continue;
      const parts = chunk.split(SEP);
      if (parts.length < 9) continue;
      const commit = {
        hash: parts[0].trim(),
        abbreviatedHash: parts[1],
        parents: parts[2] ? parts[2].split(" ").filter(Boolean) : [],
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
    if (options.query && /^[0-9a-f]{4,40}$/i.test(options.query.trim())) {
      try {
        const hashOut = await this.exec(["log", "-n1", `--format=${LOG_FORMAT}`, "--decorate=full", options.query.trim()]);
        for (const chunk of hashOut.split("\0")) {
          if (!chunk.trim()) continue;
          const parts = chunk.split(SEP);
          if (parts.length >= 9) {
            const hashCommit = {
              hash: parts[0].trim(),
              abbreviatedHash: parts[1],
              parents: parts[2] ? parts[2].split(" ").filter(Boolean) : [],
              author: parts[3],
              authorEmail: parts[4],
              authorDate: parts[5],
              subject: parts[6],
              body: parts[7],
              refs: parts[8] ? parseRefs(parts[8]) : []
            };
            this.commitCache.set(hashCommit.hash, hashCommit);
            if (!commits.some((c) => c.hash === hashCommit.hash)) {
              commits.unshift(hashCommit);
            }
          }
        }
      } catch {
      }
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
      if (!line.trim()) continue;
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
      "%(HEAD)%(refname:short)	%(objectname:short)	%(upstream:short)	%(upstream:track,nobracket)"
    ]);
    const remoteOutput = await this.exec([
      "branch",
      "-r",
      "--format",
      "%(refname:short)	%(objectname:short)"
    ]);
    const branches = [];
    for (const line of localOutput.split("\n")) {
      if (!line.trim()) continue;
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
      const trimmedName = name.trim();
      if (trimmedName.startsWith("(") || trimmedName.startsWith("HEAD detached")) {
        continue;
      }
      branches.push({
        name: trimmedName,
        current,
        remote: void 0,
        upstream: upstream || void 0,
        hash: hash.trim(),
        ahead: ahead || void 0,
        behind: behind || void 0
      });
    }
    for (const line of remoteOutput.split("\n")) {
      if (!line.trim()) continue;
      if (line.includes(" -> ")) continue;
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
      if (!line.trim()) continue;
      const [name, hash] = line.split("	");
      tags.push({ name, hash });
    }
    return tags;
  }
  async getCurrentBranch() {
    const output = await this.exec(["rev-parse", "--abbrev-ref", "HEAD"]);
    const branch = output.trim();
    if (branch === "HEAD") {
      try {
        const desc = await this.exec(["describe", "--tags", "--exact-match", "HEAD"]);
        return `HEAD (detached at ${desc.trim()})`;
      } catch {
        const hash = await this.exec(["rev-parse", "--short", "HEAD"]);
        return `HEAD (detached at ${hash.trim()})`;
      }
    }
    return branch;
  }
  async checkout(ref) {
    try {
      const remotesOutput = await this.exec(["remote"]);
      const remotes = remotesOutput.split("\n").map((s) => s.trim()).filter(Boolean);
      for (const remote of remotes) {
        if (ref.startsWith(remote + "/")) {
          const localBranchName = ref.slice(remote.length + 1);
          const branchCheck = await this.exec(["branch", "--list", localBranchName]);
          if (branchCheck.trim()) {
            await this.exec(["checkout", localBranchName]);
          } else {
            await this.exec(["checkout", "-b", localBranchName, "--track", ref]);
          }
          return;
        }
      }
    } catch {
    }
    await this.exec(["checkout", ref]);
  }
  async createBranch(name, startPoint) {
    const args = ["checkout", "-b", name];
    if (startPoint) args.push(startPoint);
    await this.exec(args);
  }
  async cherryPick(hash) {
    return this.exec(["cherry-pick", hash]);
  }
  async revertCommit(hash) {
    return this.exec(["revert", "--no-edit", hash]);
  }
  async reset(hash, mode = "mixed") {
    return this.exec(["reset", `--${mode}`, hash]);
  }
  async createTag(name, hash) {
    const args = ["tag", name];
    if (hash) args.push(hash);
    await this.exec(args);
  }
  async createPatch(hash) {
    return this.exec(["format-patch", "-1", hash, "--stdout"]);
  }
  async getRemoteUrl() {
    try {
      const out = await this.exec(["remote", "get-url", "origin"]);
      return out.trim();
    } catch {
      return "";
    }
  }
  async deleteBranch(name, force = false) {
    await this.exec(["branch", force ? "-D" : "-d", name]);
  }
  async renameBranch(oldName, newName) {
    await this.exec(["branch", "-m", oldName, newName]);
  }
  async pull(branch) {
    const currentBranch = await this.getCurrentBranch();
    if (!branch || branch === currentBranch) {
      return this.exec(["pull"]);
    }
    try {
      const remotesOutput = await this.exec(["remote"]);
      const remotes = remotesOutput.split("\n").map((s) => s.trim()).filter(Boolean);
      const remote = remotes[0] || "origin";
      let targetBranch = branch;
      if (branch.startsWith(remote + "/")) {
        targetBranch = branch.slice(remote.length + 1);
      }
      const branchCheck = await this.exec(["branch", "--list", targetBranch]);
      if (branchCheck.trim()) {
        const out = await this.exec(["fetch", remote, `${targetBranch}:${targetBranch}`]);
        return out || `Updated branch '${targetBranch}' successfully.`;
      } else {
        const out = await this.exec(["fetch", remote, targetBranch]);
        return out || `Fetched '${targetBranch}' successfully.`;
      }
    } catch (err) {
      if (err.message && (err.message.includes("non-fast-forward") || err.message.includes("rejected"))) {
        throw new Error(`Cannot fast-forward branch '${branch}' because local commits diverged. Please checkout '${branch}' to merge or rebase.`);
      }
      throw err;
    }
  }
  async push(branch) {
    const args = ["push"];
    if (branch) args.push("origin", branch);
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
      if (!line.trim()) continue;
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
      if (!line) continue;
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
  async stageFile(path7) {
    await this.exec(["add", path7]);
  }
  async stageFiles(paths) {
    await this.exec(["add", "--", ...paths]);
  }
  async stageFileContent(filePath, content) {
    return new Promise((resolve, reject) => {
      const proc = (0, import_child_process.execFile)("git", ["hash-object", "-w", "--stdin"], { cwd: this.cwd }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        const sha = stdout.trim();
        this.exec(["update-index", "--cacheinfo", `100644,${sha},${filePath}`]).then(() => resolve()).catch(reject);
      });
      proc.stdin?.write(content);
      proc.stdin?.end();
    });
  }
  async unstageFile(path7) {
    await this.exec(["reset", "HEAD", "--", path7]);
  }
  async unstageFiles(paths) {
    await this.exec(["reset", "HEAD", "--", ...paths]);
  }
  async rollbackFiles(paths) {
    const status = await this.getStatus();
    const untracked = new Set(status.filter((s) => s.x === "?" && s.y === "?").map((s) => s.path));
    const toClean = [];
    const toRestore = [];
    for (const p of paths) {
      if (untracked.has(p)) {
        toClean.push(p);
      } else {
        toRestore.push(p);
      }
    }
    if (toRestore.length > 0) {
      try {
        await this.exec(["checkout", "HEAD", "--", ...toRestore]);
      } catch {
        await this.exec(["restore", "--staged", "--worktree", "--", ...toRestore]);
      }
    }
    for (const p of toClean) {
      try {
        const fullPath = path.join(this.cwd, p);
        if (fs.existsSync(fullPath)) {
          if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
        }
      } catch {
      }
    }
  }
  async getFileDiff(filePath) {
    const status = await this.getStatus();
    const entry = status.find((s) => s.path === filePath);
    if (entry && entry.x === "?" && entry.y === "?") {
      try {
        const fullPath = path.join(this.cwd, filePath);
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n");
        const diffHeader = `--- /dev/null
+++ b/${filePath}
@@ -0,0 +1,${lines.length} @@
`;
        return diffHeader + lines.map((l) => `+${l}`).join("\n");
      } catch {
        return "";
      }
    }
    try {
      const diff = await this.exec(["diff", "HEAD", "--", filePath]);
      if (diff.trim()) return diff;
      return await this.exec(["diff", "--", filePath]);
    } catch {
      return await this.exec(["diff", "--", filePath]);
    }
  }
  async applyHunkPatch(patchContent, reverse = false) {
    return new Promise((resolve, reject) => {
      const args = ["apply", "--cached", "--recount", "--whitespace=nowarn"];
      if (reverse) args.push("--reverse");
      args.push("-");
      const proc = (0, import_child_process.execFile)("git", args, { cwd: this.cwd }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout);
      });
      proc.stdin?.write(patchContent);
      proc.stdin?.end();
    });
  }
  async getRecentCommitMessages(count = 10) {
    try {
      const out = await this.exec(["log", `-n${count}`, "--pretty=%s"]);
      return out.split("\n").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  async getMergeMessage() {
    try {
      const mergeMsgPath = path.join(this.cwd, ".git", "MERGE_MSG");
      if (fs.existsSync(mergeMsgPath)) {
        return fs.readFileSync(mergeMsgPath, "utf8").trim();
      }
    } catch {
    }
    return "";
  }
  async getStashes() {
    try {
      const out = await this.exec(["stash", "list", "--format=%gd%gs%cr"]);
      const list = [];
      for (const line of out.split("\n")) {
        if (!line.trim()) continue;
        const [index, message, date] = line.split("");
        list.push({ index: index?.trim(), message: message?.trim(), date: date?.trim() });
      }
      return list;
    } catch {
      return [];
    }
  }
  async stashSave(message) {
    const args = ["stash", "push"];
    if (message) args.push("-m", message);
    return this.exec(args);
  }
  async stashPop(index = "stash@{0}") {
    return this.exec(["stash", "pop", index]);
  }
  async stashApply(index = "stash@{0}") {
    return this.exec(["stash", "apply", index]);
  }
  async stashDrop(index = "stash@{0}") {
    return this.exec(["stash", "drop", index]);
  }
  async commitFiles(message, filesToStage, amend = false) {
    if (filesToStage && filesToStage.length > 0) {
      await this.stageFiles(filesToStage);
    }
    const args = ["commit"];
    if (amend) args.push("--amend");
    args.push("-m", message);
    await this.exec(args);
  }
  async commitAndPush(message, filesToStage, amend = false) {
    await this.commitFiles(message, filesToStage, amend);
    return await this.push();
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
  if (!raw.trim()) return [];
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
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var os = __toESM(require("os"));
var execFileAsync2 = (0, import_util2.promisify)(import_child_process2.execFile);
var writeFileAsync = (0, import_util2.promisify)(fs2.writeFile);
var mkdtempAsync = (0, import_util2.promisify)(fs2.mkdtemp);
var unlinkAsync = (0, import_util2.promisify)(fs2.unlink);
var rmdirAsync = (0, import_util2.promisify)(fs2.rmdir);
var RebaseHandler = class {
  constructor(cwd) {
    this.cwd = cwd;
  }
  cwd;
  /**
   * Execute an interactive rebase using a custom GIT_SEQUENCE_EDITOR
   * that writes the todo list we provide.
   */
  async executeRebase(base, todoItems) {
    const todoContent = todoItems.map((item) => `${item.action} ${item.hash} ${item.message}`).join("\n") + "\n";
    const tmpDir = await mkdtempAsync(path2.join(os.tmpdir(), "ijgit-rebase-"));
    const todoPath = path2.join(tmpDir, "todo");
    const scriptPath = path2.join(tmpDir, "editor.sh");
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
      const rebaseMergePath = path2.join(this.cwd, ".git", "rebase-merge");
      const rebaseApplyPath = path2.join(this.cwd, ".git", "rebase-apply");
      return fs2.existsSync(rebaseMergePath) || fs2.existsSync(rebaseApplyPath);
    } catch {
      return false;
    }
  }
};

// src/views/graphPanel.ts
var vscode2 = __toESM(require("vscode"));

// src/git/graphBuilder.ts
function buildGraph(commits) {
  if (commits.length === 0) return [];
  const nodes = [];
  let lanes = [];
  const colorMap = /* @__PURE__ */ new Map();
  let nextColor = 0;
  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row];
    const lines = [];
    let col = lanes.indexOf(commit.hash);
    if (col === -1) {
      col = lanes.length;
      lanes.push(commit.hash);
    }
    if (!colorMap.has(commit.hash)) {
      colorMap.set(commit.hash, nextColor++);
    }
    const color = colorMap.get(commit.hash);
    const prevLanes = [...lanes];
    const parents = commit.parents;
    if (parents.length === 0) {
      lanes[col] = null;
    } else {
      const p0 = parents[0];
      const p0Col = lanes.indexOf(p0);
      if (p0Col !== -1 && p0Col !== col) {
        lines.push({
          fromColumn: col,
          fromRow: row,
          toColumn: p0Col,
          toRow: row + 1,
          color
        });
        lanes[col] = null;
      } else {
        lanes[col] = p0;
        if (!colorMap.has(p0)) colorMap.set(p0, color);
      }
      for (let pi = 1; pi < parents.length; pi++) {
        const p = parents[pi];
        const pCol = lanes.indexOf(p);
        if (pCol !== -1) {
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: pCol,
            toRow: row + 1,
            color: colorMap.get(p) ?? color
          });
        } else {
          const newCol = lanes.length;
          lanes.push(p);
          if (!colorMap.has(p)) colorMap.set(p, nextColor++);
          lines.push({
            fromColumn: col,
            fromRow: row,
            toColumn: newCol,
            toRow: row + 1,
            color: colorMap.get(p)
          });
        }
      }
    }
    const nextLanes = [];
    const oldToNew = /* @__PURE__ */ new Map();
    for (let c = 0; c < lanes.length; c++) {
      if (lanes[c] !== null) {
        const newIdx = nextLanes.length;
        nextLanes.push(lanes[c]);
        oldToNew.set(c, newIdx);
      }
    }
    for (const l of lines) {
      if (oldToNew.has(l.toColumn)) {
        l.toColumn = oldToNew.get(l.toColumn);
      }
    }
    for (let c = 0; c < prevLanes.length; c++) {
      const h = prevLanes[c];
      if (h !== null && oldToNew.has(c)) {
        const currentHashAtC = lanes[c];
        const targetCol = oldToNew.get(c);
        const lineColor = (currentHashAtC ? colorMap.get(currentHashAtC) : void 0) ?? colorMap.get(h) ?? color;
        lines.push({
          fromColumn: c,
          fromRow: row,
          toColumn: targetCol,
          toRow: row + 1,
          color: lineColor
        });
      }
    }
    const uniqueLines = [];
    const seen = /* @__PURE__ */ new Set();
    for (const l of lines) {
      const key = `${l.fromColumn}->${l.toColumn}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLines.push(l);
      }
    }
    lanes = nextLanes;
    nodes.push({ hash: commit.hash, column: col, color, lines: uniqueLines });
  }
  return nodes;
}
function graphWidth(nodes) {
  if (nodes.length === 0) return 1;
  let max = 0;
  for (const node of nodes) {
    if (node.column > max) max = node.column;
    for (const line of node.lines) {
      if (line.fromColumn > max) max = line.fromColumn;
      if (line.toColumn > max) max = line.toColumn;
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
  gitService;
  static scheme = "intellij-git";
  async provideTextDocumentContent(uri) {
    if (uri.path === "/empty") return "";
    const match = uri.path.match(/^\/([^/]+)\/(.+)$/);
    if (!match) return "";
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
  extensionUri;
  gitService;
  log;
  static viewType = "intellij-git.logView";
  view;
  allCommits = [];
  graphNodes = [];
  isLoadingMore = false;
  hasReachedEnd = false;
  lastBranches = [];
  lastTags = [];
  hasInitializedFilter = false;
  isRefreshing = false;
  queuedRefresh = false;
  currentFilter = {};
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
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });
    this.loadInitialData();
  }
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
      this.hasReachedEnd = false;
      this.isLoadingMore = false;
      this.log.appendLine("Loading git log...");
      let currentBranch = "";
      try {
        currentBranch = await this.gitService.getCurrentBranch();
      } catch {
      }
      this.hasReachedEnd = false;
      this.isLoadingMore = false;
      if (!this.hasInitializedFilter) {
        this.hasInitializedFilter = true;
        this.currentFilter = currentBranch ? { branch: "HEAD", all: false } : { all: true };
      }
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, ...this.currentFilter }),
        this.gitService.getBranches(),
        this.gitService.getTags()
      ]);
      const seen = /* @__PURE__ */ new Set();
      this.allCommits = commits.filter((c) => {
        if (seen.has(c.hash)) return false;
        seen.add(c.hash);
        return true;
      });
      this.lastBranches = branches;
      this.lastTags = tags;
      this.log.appendLine(`Loaded ${this.allCommits.length} commits, ${branches.length} branches, ${tags.length} tags`);
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags, currentBranch);
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
  async sendBranches(branches, tags, currentBranch) {
    if (currentBranch === void 0) {
      try {
        currentBranch = await this.gitService.getCurrentBranch();
      } catch {
        currentBranch = "";
      }
    }
    this.view?.webview.postMessage({
      type: "branches",
      payload: {
        branches,
        tags,
        currentBranch,
        activeBranch: this.currentFilter.branch || ""
      }
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
        this.hasInitializedFilter = false;
        await this.loadInitialData();
        break;
      }
      case "initRepo": {
        this.log.appendLine("Initializing new git repository...");
        try {
          await this.gitService.initRepo();
          vscode2.window.showInformationMessage("Initialized Git repository successfully.");
          this.hasInitializedFilter = false;
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
        if (this.isLoadingMore || this.hasReachedEnd) break;
        this.isLoadingMore = true;
        const skip = this.allCommits.length;
        try {
          const more = await this.gitService.getLog({
            maxCount: 300,
            skip,
            ...this.currentFilter
          });
          const existingHashes = new Set(this.allCommits.map((c) => c.hash));
          const uniqueMore = more.filter((c) => !existingHashes.has(c.hash));
          if (uniqueMore.length > 0) {
            this.allCommits.push(...uniqueMore);
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          } else {
            this.hasReachedEnd = true;
            this.view?.webview.postMessage({ type: "reachedEnd" });
          }
        } catch {
          this.hasReachedEnd = true;
          this.view?.webview.postMessage({ type: "reachedEnd" });
        } finally {
          this.isLoadingMore = false;
        }
        break;
      }
      case "filter": {
        const { branch, author, after, before, path: filePath, query } = msg.payload || {};
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        this.currentFilter = {
          branch: branch || void 0,
          author: author || void 0,
          after: after || void 0,
          before: before || void 0,
          path: filePath || void 0,
          query: query || void 0,
          all: !branch
        };
        try {
          const commits = await this.gitService.getLog({
            maxCount: 300,
            ...this.currentFilter
          });
          const seen = /* @__PURE__ */ new Set();
          this.allCommits = commits.filter((c) => {
            if (seen.has(c.hash)) return false;
            seen.add(c.hash);
            return true;
          });
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
        } catch (err) {
          vscode2.window.showErrorMessage(`Filter failed: ${err.message}`);
        }
        break;
      }
      case "refresh": {
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        try {
          const [commits, branches, tags] = await Promise.all([
            this.gitService.getLog({
              maxCount: 300,
              ...this.currentFilter
            }),
            this.gitService.getBranches(),
            this.gitService.getTags()
          ]);
          const seen = /* @__PURE__ */ new Set();
          this.allCommits = commits.filter((c) => {
            if (seen.has(c.hash)) return false;
            seen.add(c.hash);
            return true;
          });
          this.lastBranches = branches;
          this.lastTags = tags;
          this.graphNodes = buildGraph(this.allCommits);
          this.sendCommits();
          this.sendBranches(branches, tags);
        } catch (err) {
          vscode2.window.showErrorMessage(`Refresh failed: ${err.message}`);
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
          vscode2.window.showInformationMessage(`Deleted branch '${ref}'`);
          this.loadInitialData();
        } catch (err) {
          if (err.message && (err.message.includes("not fully merged") || err.message.includes("not merged"))) {
            const force = await vscode2.window.showWarningMessage(
              `Branch '${ref}' is not fully merged. Do you want to force delete it?`,
              { modal: true },
              "Force Delete"
            );
            if (force === "Force Delete") {
              try {
                await this.gitService.deleteBranch(ref, true);
                vscode2.window.showInformationMessage(`Force deleted branch '${ref}'`);
                this.loadInitialData();
              } catch (e) {
                vscode2.window.showErrorMessage(`Delete failed: ${e.message}`);
              }
            }
          } else {
            vscode2.window.showErrorMessage(`Delete failed: ${err.message}`);
          }
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
            const leftUri = picked.file.status === "A" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
            const path7 = require("path");
            const rightUri = picked.file.status === "D" ? GitContentProvider.emptyUri() : vscode2.Uri.file(path7.join(this.gitService.getCwd(), filePath));
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
          vscode2.window.showInformationMessage(`Updated ${branch}: ${out || "Already up to date."}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Update failed: ${err.message}`);
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
          vscode2.window.showInformationMessage(`Merged '${ref}' successfully.`);
          this.loadInitialData();
        } catch (err) {
          const errMsg = err.message || "";
          const hasConflicts = errMsg.includes("CONFLICT") || errMsg.includes("conflict") || errMsg.includes("Automatic merge failed") || errMsg.includes("fix conflicts");
          if (hasConflicts) {
            this.loadInitialData();
            try {
              const conflictFiles = await this.gitService.getUnmergedFiles();
              if (conflictFiles.length === 0) {
                vscode2.window.showWarningMessage(`Merge has conflicts. Please resolve them and commit.`);
                return;
              }
              const items = conflictFiles.map((f) => ({
                label: `$(git-merge) ${f}`,
                description: "Conflict \u2014 click to open merge editor",
                detail: f
              }));
              items.push({
                label: "$(check-all) All conflicts resolved \u2014 open Commit panel",
                description: "",
                detail: "__commit__"
              });
              const chosen = await vscode2.window.showQuickPick(items, {
                placeHolder: `${conflictFiles.length} file(s) with conflicts \u2014 select a file to resolve`,
                canPickMany: false,
                title: `Merge conflicts: '${ref}' into current branch`
              });
              if (chosen && chosen.detail && chosen.detail !== "__commit__") {
                const fileUri = vscode2.Uri.joinPath(
                  vscode2.Uri.file(this.workspaceRoot),
                  chosen.detail
                );
                try {
                  await vscode2.commands.executeCommand("merge-conflict.accept.all-both");
                } catch {
                }
                await vscode2.commands.executeCommand("vscode.open", fileUri);
                try {
                  await vscode2.commands.executeCommand("git.openMergeEditor", fileUri);
                } catch {
                }
              } else if (chosen && chosen.detail === "__commit__") {
                await vscode2.commands.executeCommand("intellij-git.openCommit");
              }
            } catch {
              vscode2.window.showWarningMessage(
                `Merge has conflicts. Please resolve them in the editor and commit when done.`
              );
            }
          } else {
            vscode2.window.showErrorMessage(`Merge failed: ${errMsg}`);
          }
        }
        break;
      }
      case "rebaseFromHere": {
        const hash = msg.payload;
        await vscode2.commands.executeCommand("intellij-git.interactiveRebase", hash);
        break;
      }
      case "cherryPick": {
        const { hash } = msg.payload;
        try {
          await this.gitService.cherryPick(hash);
          vscode2.window.showInformationMessage(`Cherry-picked ${hash.slice(0, 8)} successfully`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Cherry-pick failed: ${err.message}`);
        }
        break;
      }
      case "revertCommit": {
        const { hash } = msg.payload;
        try {
          await this.gitService.revertCommit(hash);
          vscode2.window.showInformationMessage(`Reverted commit ${hash.slice(0, 8)}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Revert failed: ${err.message}`);
        }
        break;
      }
      case "resetToCommit": {
        const { hash } = msg.payload;
        const mode = await vscode2.window.showQuickPick([
          { label: "Soft", description: "Keep all local changes in index (staged)", mode: "soft" },
          { label: "Mixed", description: "Keep all local changes in working tree (unstaged)", mode: "mixed" },
          { label: "Hard", description: "Discard all local changes", mode: "hard" }
        ], { placeHolder: `Reset current branch to ${hash.slice(0, 8)}` });
        if (mode) {
          if (mode.mode === "hard") {
            const confirm = await vscode2.window.showWarningMessage(
              `Are you sure you want to perform a HARD reset to ${hash.slice(0, 8)}? All uncommitted local changes will be lost!`,
              { modal: true },
              "Reset"
            );
            if (confirm !== "Reset") break;
          }
          try {
            await this.gitService.reset(hash, mode.mode);
            vscode2.window.showInformationMessage(`Reset branch to ${hash.slice(0, 8)} (${mode.label})`);
            this.loadInitialData();
          } catch (err) {
            vscode2.window.showErrorMessage(`Reset failed: ${err.message}`);
          }
        }
        break;
      }
      case "undoCommit": {
        try {
          await this.gitService.reset("HEAD~1", "soft");
          vscode2.window.showInformationMessage("Undid last commit (changes kept staged)");
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Undo commit failed: ${err.message}`);
        }
        break;
      }
      case "createTag": {
        const { name, hash } = msg.payload;
        try {
          await this.gitService.createTag(name, hash);
          vscode2.window.showInformationMessage(`Created tag ${name} at ${hash.slice(0, 8)}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Create tag failed: ${err.message}`);
        }
        break;
      }
      case "createPatch": {
        const { hash } = msg.payload;
        try {
          const patch = await this.gitService.createPatch(hash);
          const doc = await vscode2.workspace.openTextDocument({
            content: patch,
            language: "diff"
          });
          await vscode2.window.showTextDocument(doc);
          vscode2.window.showInformationMessage(`Created patch for ${hash.slice(0, 8)}`);
        } catch (err) {
          vscode2.window.showErrorMessage(`Create patch failed: ${err.message}`);
        }
        break;
      }
      case "compareWithLocal": {
        const { hash } = msg.payload;
        try {
          const files = await this.gitService.getDiffFiles(hash);
          if (files.length === 0) {
            vscode2.window.showInformationMessage(`No differences between ${hash.slice(0, 8)} and working tree.`);
            break;
          }
          const items = files.map((f) => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : "",
            file: f
          }));
          const picked = await vscode2.window.showQuickPick(items, {
            placeHolder: `Select a file changed against ${hash.slice(0, 8)} to view diff`
          });
          if (picked) {
            const filePath = picked.file.path;
            const leftUri = picked.file.status === "A" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(hash, picked.file.oldPath || filePath);
            const path7 = require("path");
            const rightUri = picked.file.status === "D" ? GitContentProvider.emptyUri() : vscode2.Uri.file(path7.join(this.gitService.getCwd(), filePath));
            const fileName = filePath.split("/").pop() || filePath;
            await vscode2.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (${hash.slice(0, 8)} \u2194 Working Tree)`);
          }
        } catch (err) {
          vscode2.window.showErrorMessage(`Compare with local failed: ${err.message}`);
        }
        break;
      }
      case "editCommitMessage": {
        const { hash, subject, message } = msg.payload || {};
        let newMsg = message;
        if (!newMsg) {
          newMsg = await vscode2.window.showInputBox({
            prompt: "Edit Commit Message",
            value: subject || ""
          });
        }
        if (newMsg && newMsg.trim()) {
          try {
            const headHash = (await this.gitService.getLog({ maxCount: 1 }))[0]?.hash;
            if (headHash === hash) {
              await this.gitService.exec(["commit", "--amend", "-m", newMsg.trim()]);
              vscode2.window.showInformationMessage("Commit message updated");
              this.loadInitialData();
            } else {
              vscode2.window.showWarningMessage("Editing commit message of older commits requires interactive rebase.");
              await vscode2.commands.executeCommand("intellij-git.interactiveRebase", hash);
            }
          } catch (err) {
            vscode2.window.showErrorMessage(`Edit message failed: ${err.message}`);
          }
        }
        break;
      }
      case "dropCommit": {
        const { hash } = msg.payload;
        try {
          const headHash = (await this.gitService.getLog({ maxCount: 1 }))[0]?.hash;
          if (headHash === hash) {
            await this.gitService.reset("HEAD~1", "hard");
            vscode2.window.showInformationMessage(`Dropped commit ${hash.slice(0, 8)}`);
            this.loadInitialData();
          } else {
            vscode2.window.showInformationMessage(`Use Interactive Rebase to drop older commit ${hash.slice(0, 8)}`);
            await vscode2.commands.executeCommand("intellij-git.interactiveRebase", hash);
          }
        } catch (err) {
          vscode2.window.showErrorMessage(`Drop commit failed: ${err.message}`);
        }
        break;
      }
      case "pushUpToHere": {
        const { hash } = msg.payload;
        try {
          const currentBranch = await this.gitService.getCurrentBranch();
          await this.gitService.exec(["push", "origin", `${hash}:refs/heads/${currentBranch}`]);
          vscode2.window.showInformationMessage(`Pushed up to ${hash.slice(0, 8)} on ${currentBranch}`);
          this.loadInitialData();
        } catch (err) {
          vscode2.window.showErrorMessage(`Push failed: ${err.message}`);
        }
        break;
      }
      case "showRepoAtRevision": {
        const { hash } = msg.payload;
        try {
          const files = await this.gitService.getCommitFiles(hash);
          if (files.length === 0) {
            vscode2.window.showInformationMessage(`No files changed in ${hash.slice(0, 8)}.`);
            break;
          }
          const items = files.map((f) => ({
            label: `${f.status} ${f.path}`,
            description: f.oldPath ? `from ${f.oldPath}` : "",
            path: f.path
          }));
          const picked = await vscode2.window.showQuickPick(items, {
            placeHolder: `Files changed in commit ${hash.slice(0, 8)}`
          });
          if (picked) {
            const uri = GitContentProvider.makeUri(hash, picked.path);
            await vscode2.commands.executeCommand("vscode.open", uri);
          }
        } catch (err) {
          vscode2.window.showErrorMessage(`Show revision failed: ${err.message}`);
        }
        break;
      }
      case "openInBrowser": {
        const { hash } = msg.payload;
        try {
          const remoteUrl = await this.gitService.getRemoteUrl();
          if (!remoteUrl) {
            vscode2.window.showWarningMessage("No remote URL found for this repository.");
            break;
          }
          let httpUrl = remoteUrl.replace(/^ssh:\/\/git@([^/:]+)(?::\d+)?\//, "https://$1/").replace(/^git@([^:]+):/, "https://$1/").replace(/^https?:\/\/[^@]+@/, "https://").replace(/\.git$/, "");
          if (httpUrl.includes("gitlab.com") || httpUrl.includes("gitlab")) {
            httpUrl = `${httpUrl}/-/commit/${hash}`;
          } else {
            httpUrl = `${httpUrl}/commit/${hash}`;
          }
          await vscode2.env.openExternal(vscode2.Uri.parse(httpUrl));
        } catch (err) {
          vscode2.window.showErrorMessage(`Open in browser failed: ${err.message}`);
        }
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
  async refresh() {
    if (!this.view || !this.view.visible) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;
    this.hasReachedEnd = false;
    this.isLoadingMore = false;
    try {
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({
          maxCount: 300,
          ...this.currentFilter
        }),
        this.gitService.getBranches(),
        this.gitService.getTags()
      ]);
      const seen = /* @__PURE__ */ new Set();
      this.allCommits = commits.filter((c) => {
        if (seen.has(c.hash)) return false;
        seen.add(c.hash);
        return true;
      });
      this.lastBranches = branches;
      this.lastTags = tags;
      this.graphNodes = buildGraph(this.allCommits);
      this.sendCommits();
      this.sendBranches(branches, tags);
    } catch {
    } finally {
      this.isRefreshing = false;
      if (this.queuedRefresh) {
        this.queuedRefresh = false;
        this.refresh();
      }
    }
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

// src/views/commitPanel.ts
var vscode4 = __toESM(require("vscode"));
var path4 = __toESM(require("path"));

// src/views/commitReviewPanel.ts
var vscode3 = __toESM(require("vscode"));
var path3 = __toESM(require("path"));
var fs3 = __toESM(require("fs"));
var CommitReviewPanel = class _CommitReviewPanel {
  constructor(panel, extensionUri, gitService, onStageChange, readOnly = false) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.onStageChange = onStageChange;
    this.panel = panel;
    this.isReadOnly = readOnly;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    vscode3.window.onDidChangeActiveColorTheme(
      () => this.sendThemeTokens(),
      null,
      this.disposables
    );
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }
  extensionUri;
  gitService;
  onStageChange;
  static currentPanel;
  static viewType = "intellij-git.commitReview";
  static onFileNavigateListener;
  panel;
  disposables = [];
  currentFilePath = "";
  filesList = [];
  isReadOnly = false;
  lastLoadedState;
  static createOrShow(extensionUri, gitService, filePath, filesList = [], onStageChange, readOnly = false) {
    const fileName = path3.basename(filePath);
    if (_CommitReviewPanel.currentPanel) {
      if (onStageChange) {
        _CommitReviewPanel.currentPanel.onStageChange = onStageChange;
      }
      _CommitReviewPanel.currentPanel.isReadOnly = readOnly;
      _CommitReviewPanel.currentPanel.panel.title = `Diff: ${fileName}`;
      _CommitReviewPanel.currentPanel.panel.reveal(vscode3.ViewColumn.Active, true);
      _CommitReviewPanel.currentPanel.loadFile(filePath, filesList, readOnly);
      return _CommitReviewPanel.currentPanel;
    }
    const panel = vscode3.window.createWebviewPanel(
      _CommitReviewPanel.viewType,
      `Diff: ${fileName}`,
      vscode3.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode3.Uri.joinPath(extensionUri, "dist", "webview")
        ]
      }
    );
    _CommitReviewPanel.currentPanel = new _CommitReviewPanel(
      panel,
      extensionUri,
      gitService,
      onStageChange,
      readOnly
    );
    _CommitReviewPanel.currentPanel.loadFile(filePath, filesList, readOnly);
    return _CommitReviewPanel.currentPanel;
  }
  async loadFile(filePath, filesList, readOnly, focusTarget) {
    this.currentFilePath = filePath;
    if (filesList) this.filesList = filesList;
    if (readOnly !== void 0) this.isReadOnly = readOnly;
    const fileName = path3.basename(filePath);
    this.panel.title = `Diff: ${fileName}`;
    if (_CommitReviewPanel.onFileNavigateListener) {
      _CommitReviewPanel.onFileNavigateListener(filePath);
    }
    try {
      const fullPath = path3.join(this.gitService.getCwd(), filePath);
      const [diff, baseContent, currentContent, stagedDiff] = await Promise.all([
        this.gitService.getFileDiff(filePath).catch(() => ""),
        this.gitService.exec(["show", `HEAD:${filePath}`]).catch(() => ""),
        (async () => {
          try {
            if (fs3.existsSync(fullPath)) {
              return fs3.readFileSync(fullPath, "utf8");
            }
          } catch {
          }
          return "";
        })(),
        this.gitService.exec(["diff", "--cached", "--", filePath]).catch(() => "")
      ]);
      const isSameFile = this.lastLoadedState && this.lastLoadedState.filePath === filePath;
      const isUnchanged = isSameFile &&
        this.lastLoadedState.diff === diff &&
        this.lastLoadedState.stagedDiff === stagedDiff &&
        this.lastLoadedState.baseContent === baseContent &&
        this.lastLoadedState.currentContent === currentContent &&
        this.lastLoadedState.readOnly === this.isReadOnly &&
        !focusTarget;
      if (isUnchanged) {
        return;
      }
      this.lastLoadedState = {
        filePath,
        diff,
        stagedDiff,
        baseContent,
        currentContent,
        readOnly: this.isReadOnly
      };
      const currentFileIndex = this.filesList.indexOf(filePath);
      this.panel.webview.postMessage({
        type: "fileDiff",
        payload: {
          path: filePath,
          fileName,
          fileDir: path3.dirname(filePath) === "." ? "" : path3.dirname(filePath),
          diff,
          stagedDiff,
          baseContent,
          currentContent,
          filesList: this.filesList,
          currentFileIndex: currentFileIndex !== -1 ? currentFileIndex : 0,
          readOnly: this.isReadOnly,
          focusTarget
        }
      });
    } catch (err) {
      vscode3.window.showErrorMessage(`Failed to load diff: ${err.message}`);
    }
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "ready": {
        this.sendThemeTokens();
        if (this.currentFilePath) {
          this.loadFile(this.currentFilePath, this.filesList);
        }
        break;
      }
      case "refreshDiff": {
        const filePath = msg.payload || this.currentFilePath;
        this.loadFile(filePath, this.filesList);
        break;
      }
      case "navigateFile": {
        const newIndex = msg.payload;
        if (newIndex >= 0 && newIndex < this.filesList.length) {
          const newPath = this.filesList[newIndex];
          this.loadFile(newPath, this.filesList);
        }
        break;
      }
      case "updateBlockStage": {
        const { filePath, stagedContent, stagedCount, totalCount } = msg.payload;
        try {
          if (stagedCount === 0) {
            await this.gitService.unstageFile(filePath);
          } else if (stagedCount === totalCount) {
            await this.gitService.stageFile(filePath);
          } else {
            await this.gitService.stageFileContent(filePath, stagedContent);
          }
          if (this.onStageChange) this.onStageChange();
          let stagedDiff = "";
          try {
            stagedDiff = await this.gitService.exec(["diff", "--cached", "--", filePath]);
          } catch {
            stagedDiff = "";
          }
          this.panel.webview.postMessage({
            type: "stagedDiffUpdated",
            payload: { stagedDiff }
          });
        } catch (err) {
          vscode3.window.showErrorMessage(`Update stage failed: ${err.message}`);
        }
        break;
      }
      case "revertBlockContent": {
        const { filePath, newContent } = msg.payload;
        try {
          const fullPath = path3.join(this.gitService.getCwd(), filePath);
          fs3.writeFileSync(fullPath, newContent, "utf8");
          if (this.onStageChange) this.onStageChange();
          await this.loadFile(this.currentFilePath, this.filesList, this.isReadOnly);
        } catch (err) {
          vscode3.window.showErrorMessage(`Revert failed: ${err.message}`);
        }
        break;
      }
      case "saveFileContent": {
        const { filePath, content, focusLine, focusOffset } = msg.payload;
        try {
          const fullPath = path3.join(this.gitService.getCwd(), filePath);
          fs3.writeFileSync(fullPath, content, "utf8");
          if (this.onStageChange) this.onStageChange();
          await this.loadFile(this.currentFilePath, this.filesList, this.isReadOnly, { focusLine, focusOffset });
        } catch (err) {
          vscode3.window.showErrorMessage(`Save failed: ${err.message}`);
        }
        break;
      }
      case "applyHunkPatch": {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
        } catch (err) {
          vscode3.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case "openFile": {
        const filePath = msg.payload;
        if (filePath) {
          const fullPath = path3.join(this.gitService.getCwd(), filePath);
          vscode3.commands.executeCommand("vscode.open", vscode3.Uri.file(fullPath));
        }
        break;
      }
      case "rollbackHunk": {
        const { patch } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, true);
          if (this.onStageChange) this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
          vscode3.window.showInformationMessage("Hunk rolled back.");
        } catch (err) {
          vscode3.window.showErrorMessage(`Rollback hunk failed: ${err.message}`);
        }
        break;
      }
    }
  }
  getCurrentFilePath() {
    return this.currentFilePath;
  }
  refresh() {
    if (this.currentFilePath) {
      this.loadFile(this.currentFilePath, this.filesList);
    }
  }
  sendThemeTokens() {
    const tokens = this.getThemeTokens();
    this.panel.webview.postMessage({
      type: "themeTokens",
      payload: tokens
    });
  }
  getThemeTokens() {
    const defaultTokens = {
      kwd: "#fd6883",
      type: "#85dacc",
      fn: "#adda78",
      str: "#f9cc6c",
      num: "#a8a9eb",
      constVal: "#a8a9eb",
      varVal: "#fff1f3",
      comment: "#72696a",
      anno: "#85dacc",
      punct: "#948a8b"
    };
    try {
      const activeThemeName = vscode3.workspace.getConfiguration("workbench").get("colorTheme");
      if (!activeThemeName) return defaultTokens;
      for (const ext of vscode3.extensions.all) {
        const themes = ext.packageJSON?.contributes?.themes;
        if (!Array.isArray(themes)) continue;
        const matched = themes.find((t) => t.label === activeThemeName || t.id === activeThemeName);
        if (!matched || !matched.path) continue;
        const themePath = path3.join(ext.extensionPath, matched.path);
        if (!fs3.existsSync(themePath)) continue;
        let content = fs3.readFileSync(themePath, "utf8");
        content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
        const themeJson = JSON.parse(content);
        const tc = themeJson.tokenColors || [];
        const findColor = (targetScopes) => {
          for (const target of targetScopes) {
            for (const rule of tc) {
              if (!rule.settings || !rule.settings.foreground) continue;
              const scopes = Array.isArray(rule.scope) ? rule.scope : typeof rule.scope === "string" ? rule.scope.split(",").map((s) => s.trim()) : [];
              if (scopes.includes(target)) return rule.settings.foreground;
            }
          }
          for (const target of targetScopes) {
            for (const rule of tc) {
              if (!rule.settings || !rule.settings.foreground) continue;
              const scopes = Array.isArray(rule.scope) ? rule.scope : typeof rule.scope === "string" ? rule.scope.split(",").map((s) => s.trim()) : [];
              for (const s of scopes) {
                if (!s.includes(" ") && s.startsWith(target + ".")) return rule.settings.foreground;
              }
            }
          }
          return null;
        };
        const kwd = findColor(["keyword"]) || defaultTokens.kwd;
        const type = findColor(["entity.name.type", "support.type", "storage.type"]) || defaultTokens.type;
        const fn = findColor(["entity.name.function", "support.function"]) || defaultTokens.fn;
        const str = findColor(["string"]) || defaultTokens.str;
        const num = findColor(["constant.numeric"]) || defaultTokens.num;
        const constVal = findColor(["constant.language"]) || defaultTokens.constVal;
        const comment = findColor(["comment"]) || defaultTokens.comment;
        const varVal = findColor(["variable"]) || defaultTokens.varVal;
        const anno = findColor(["punctuation.definition.annotation", "meta.annotation"]) || type;
        const punct = findColor(["punctuation"]) || defaultTokens.punct;
        return { kwd, type, fn, str, num, constVal, varVal, comment, anno, punct };
      }
    } catch {
    }
    return defaultTokens;
  }
  getHtml() {
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode3.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "review.js")
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode3.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.css")
    );
    const nonce = getNonce2();
    const tokens = this.getThemeTokens();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <style id="dynamic-syntax-tokens">
    :root {
      --syn-kwd: ${tokens.kwd} !important;
      --syn-type: ${tokens.type} !important;
      --syn-fn: ${tokens.fn} !important;
      --syn-str: ${tokens.str} !important;
      --syn-num: ${tokens.num} !important;
      --syn-const: ${tokens.constVal} !important;
      --syn-var: ${tokens.varVal} !important;
      --syn-comment: ${tokens.comment} !important;
      --syn-anno: ${tokens.anno} !important;
      --syn-punct: ${tokens.punct} !important;
    }
  </style>
  <title>Code Review</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  dispose() {
    _CommitReviewPanel.currentPanel = void 0;
    for (const d of this.disposables) d.dispose();
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

// src/views/commitPanel.ts
var CommitViewProvider = class _CommitViewProvider {
  constructor(extensionUri, gitService, log2) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.log = log2;
    _CommitViewProvider.currentProvider = this;
    CommitReviewPanel.onFileNavigateListener = (filePath) => {
      this.selectFile(filePath);
    };
  }
  static currentProvider;
  extensionUri;
  gitService;
  log;
  static viewType = "intellij-git.commitView";
  view;
  changesFilePaths = [];
  unversionedFilePaths = [];
  allFilePaths = [];
  lastStatusHash = "";
  isRefreshing = false;
  queuedRefresh = false;
  selectFile(filePath) {
    if (this.view) {
      this.view.webview.postMessage({
        type: "selectFile",
        payload: filePath
      });
    }
  }
  getReviewFilesList(filePath) {
    if (this.unversionedFilePaths.includes(filePath)) {
      return this.unversionedFilePaths;
    }
    return this.changesFilePaths;
  }
  resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode4.Uri.joinPath(this.extensionUri, "dist", "webview")
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });
    this.refresh();
  }
  async refresh() {
    if (!this.view || !this.view.visible) return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;
    try {
      const isRepo = await this.gitService.isGitRepo();
      if (!isRepo) {
        this.view.webview.postMessage({
          type: "status",
          payload: {
            files: [],
            changesCount: 0,
            unversionedCount: 0,
            recentMessages: [],
            stashes: []
          }
        });
        return;
      }
      const [statusEntries, mergeMsg, recentMessages, stashes, totalDiff, cachedDiff] = await Promise.all([
        this.gitService.getStatus(),
        this.gitService.getMergeMessage(),
        this.gitService.getRecentCommitMessages(10),
        this.gitService.getStashes(),
        this.gitService.exec(["diff", "HEAD"]).catch(() => ""),
        this.gitService.exec(["diff", "--cached"]).catch(() => "")
      ]);
      const totalChangesMap = this.parseChangesPerFile(totalDiff);
      const stagedChangesMap = this.parseChangesPerFile(cachedDiff);
      const files = statusEntries.map((entry) => {
        const filePath = entry.path;
        const fileName = path4.basename(filePath);
        const fileDir = path4.dirname(filePath);
        const isUntracked = entry.x === "?" && entry.y === "?";
        const isStaged = entry.x !== " " && entry.x !== "?";
        const totalChanges = totalChangesMap.get(filePath) || 0;
        const stagedChanges = stagedChangesMap.get(filePath) || 0;
        const isPartiallyStaged = totalChanges > 0 && stagedChanges > 0 && stagedChanges < totalChanges;
        return {
          path: filePath,
          name: fileName,
          dir: fileDir === "." ? "" : fileDir,
          status: entry.y !== " " ? entry.y : entry.x,
          staged: isStaged,
          isUntracked,
          totalChanges,
          stagedChanges,
          partiallyStaged: isPartiallyStaged
        };
      });
      const changesFiles = files
        .filter((f) => !f.isUntracked)
        .sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }) || a.path.localeCompare(b.path));
      const unversionedFiles = files
        .filter((f) => f.isUntracked)
        .sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }) || a.path.localeCompare(b.path));
      const sortedFiles = [...changesFiles, ...unversionedFiles];
      const changesCount = changesFiles.length;
      const unversionedCount = unversionedFiles.length;
      this.changesFilePaths = changesFiles.map((f) => f.path);
      this.unversionedFilePaths = unversionedFiles.map((f) => f.path);
      this.allFilePaths = sortedFiles.map((f) => f.path);
      this.lastStatusHash = sortedFiles.map((f) => `${f.status}:${f.path}:${f.totalChanges}:${f.staged}`).join("\n");
      this.view.webview.postMessage({
        type: "status",
        payload: {
          files: sortedFiles,
          changesCount,
          unversionedCount,
          defaultCommitMessage: mergeMsg || "",
          recentMessages,
          stashes
        }
      });
    } catch (err) {
      this.log.appendLine(`Commit panel status fetch failed: ${err.message}`);
    } finally {
      this.isRefreshing = false;
      if (this.queuedRefresh) {
        this.queuedRefresh = false;
        this.refresh();
      }
    }
  }
  parseChangesPerFile(diffText) {
    const map = /* @__PURE__ */ new Map();
    if (!diffText || !diffText.trim()) return map;
    const fileSections = diffText.split(/^diff --git /m);
    for (const section of fileSections) {
      if (!section.trim()) continue;
      const match = section.match(/^a\/(.*?)\s+b\/(.*?)(?:\n|$)/);
      if (!match) continue;
      const filePath = match[2];
      const lines = section.split("\n");
      let count = 0;
      let inHunk = false;
      let inDiffBlock = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("@@")) {
          inHunk = true;
          inDiffBlock = false;
        } else if (inHunk) {
          if (line.startsWith("+") || line.startsWith("-")) {
            if (!inDiffBlock) {
              count++;
              inDiffBlock = true;
            }
          } else if (line.startsWith(" ")) {
            inDiffBlock = false;
          }
        }
      }
      map.set(filePath, count);
    }
    return map;
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "ready":
      case "refresh": {
        await this.refresh();
        break;
      }
      case "selectFile":
      case "openReviewInCenter": {
        const filePath = msg.payload;
        if (filePath) {
          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            this.getReviewFilesList(filePath),
            () => this.refresh()
          );
        }
        break;
      }
      case "stageFile": {
        const filePath = msg.payload;
        try {
          await this.gitService.stageFile(filePath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === filePath) {
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case "stageFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0) return;
        try {
          await this.gitService.stageFiles(filePaths);
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.includes(current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, this.getReviewFilesList(current));
            }
          }
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case "unstageFile": {
        const filePath = msg.payload;
        try {
          await this.gitService.unstageFile(filePath);
          if (CommitReviewPanel.currentPanel && CommitReviewPanel.currentPanel.getCurrentFilePath() === filePath) {
            await CommitReviewPanel.currentPanel.loadFile(filePath, this.getReviewFilesList(filePath));
          }
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case "unstageFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0) return;
        try {
          await this.gitService.unstageFiles(filePaths);
          if (CommitReviewPanel.currentPanel) {
            const current = CommitReviewPanel.currentPanel.getCurrentFilePath();
            if (current && filePaths.includes(current)) {
              await CommitReviewPanel.currentPanel.loadFile(current, this.getReviewFilesList(current));
            }
          }
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case "rollbackFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0) return;
        const confirm = await vscode4.window.showWarningMessage(
          `Rollback changes in ${filePaths.length} file(s)? This cannot be undone.`,
          { modal: true },
          "Rollback"
        );
        if (confirm !== "Rollback") return;
        try {
          await this.gitService.rollbackFiles(filePaths);
          vscode4.window.showInformationMessage(`Rolled back ${filePaths.length} file(s).`);
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Rollback failed: ${err.message}`);
        }
        break;
      }
      case "jumpToSource": {
        const filePath = msg.payload;
        if (filePath) {
          const fullPath = path4.join(this.gitService.getCwd(), filePath);
          if (fs3.existsSync(fullPath)) {
            vscode4.commands.executeCommand("vscode.open", vscode4.Uri.file(fullPath));
          }
        }
        break;
      }
      case "deleteFile": {
        const filePath = msg.payload;
        if (!filePath) return;
        const fileName = path4.basename(filePath);
        const confirm = await vscode4.window.showWarningMessage(
          `Are you sure you want to delete "${fileName}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete") return;
        try {
          const fullPath = path4.join(this.gitService.getCwd(), filePath);
          if (fs3.existsSync(fullPath)) {
            if (fs3.statSync(fullPath).isDirectory()) {
              fs3.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs3.unlinkSync(fullPath);
            }
          }
          await this.gitService.exec(["rm", "-f", "--cached", filePath]).catch(() => {});
          await this.refresh();
          vscode4.window.showInformationMessage(`Deleted ${fileName}`);
        } catch (err) {
          vscode4.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
        break;
      }
      case "getFileDiff": {
        const filePath = msg.payload;
        try {
          const diff = await this.gitService.getFileDiff(filePath);
          this.view?.webview.postMessage({
            type: "fileDiff",
            payload: { path: filePath, diff }
          });
        } catch (err) {
          this.log.appendLine(`Get diff failed: ${err.message}`);
        }
        break;
      }
      case "applyHunkPatch": {
        const { patch, reverse } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, reverse);
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case "commit": {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitFiles(message, files, amend);
          vscode4.window.showInformationMessage("Committed successfully.");
          this.view?.webview.postMessage({ type: "commitSuccess" });
          await this.refresh();
          vscode4.commands.executeCommand("intellij-git.refreshBranches");
        } catch (err) {
          vscode4.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case "commitAndPush": {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitAndPush(message, files, amend);
          vscode4.window.showInformationMessage("Committed and pushed successfully.");
          this.view?.webview.postMessage({ type: "commitSuccess" });
          await this.refresh();
          vscode4.commands.executeCommand("intellij-git.refreshBranches");
        } catch (err) {
          vscode4.window.showErrorMessage(`Commit and Push failed: ${err.message}`);
        }
        break;
      }
      case "generateAiCommitMessage": {
        const { files } = msg.payload || {};
        try {
          if (Array.isArray(files) && files.length > 0) {
            await this.gitService.stageFiles(files);
          }
          const repoRoot = this.gitService.getCwd();
          const gitExt = vscode4.extensions.getExtension("vscode.git");
          let gitRepo;
          if (gitExt) {
            const gitApi = gitExt.exports.getAPI(1);
            gitRepo = gitApi.repositories.find((r) => r.rootUri.fsPath === repoRoot || r.rootUri.path === repoRoot) || gitApi.repositories[0];
          }
          const restoreFocus = () => {
            vscode4.commands.executeCommand("workbench.view.extension.intellij-git-commit");
            vscode4.commands.executeCommand("intellij-git.commitView.focus");
          };
          setTimeout(restoreFocus, 30);
          setTimeout(restoreFocus, 80);
          setTimeout(restoreFocus, 180);
          setTimeout(restoreFocus, 350);
          let aiMsg = await vscode4.commands.executeCommand("antigravity.generateCommitMessage", repoRoot);
          if (!aiMsg && gitRepo?.inputBox?.value) {
            aiMsg = gitRepo.inputBox.value;
          }
          restoreFocus();
          if (aiMsg && typeof aiMsg === "string") {
            this.view?.webview.postMessage({
              type: "setCommitMessage",
              payload: { message: aiMsg.trim() }
            });
          } else {
            this.view?.webview.postMessage({ type: "generateAiError" });
            vscode4.window.showWarningMessage("No commit message was generated by AI.");
          }
        } catch (err) {
          this.view?.webview.postMessage({ type: "generateAiError" });
          vscode4.window.showErrorMessage(`Failed to generate commit message: ${err.message}`);
        }
        break;
      }
      case "openDiffInEditor": {
        const filePath = msg.payload;
        try {
          const leftUri = GitContentProvider.makeUri("HEAD", filePath);
          const rightUri = vscode4.Uri.file(path4.join(this.gitService.getCwd(), filePath));
          const fileName = path4.basename(filePath);
          await vscode4.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (HEAD \u2194 Working Tree)`);
        } catch (err) {
          vscode4.window.showErrorMessage(`Open diff editor failed: ${err.message}`);
        }
        break;
      }
      case "createStash": {
        const msgText = await vscode4.window.showInputBox({
          prompt: "Stash message (optional)",
          placeHolder: "WIP on feature..."
        });
        if (msgText === void 0) return;
        try {
          await this.gitService.stashSave(msgText);
          vscode4.window.showInformationMessage("Stashed local changes.");
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stash failed: ${err.message}`);
        }
        break;
      }
      case "stashPop": {
        const idx = msg.payload;
        try {
          await this.gitService.stashPop(idx);
          vscode4.window.showInformationMessage(`Applied and dropped ${idx}`);
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stash pop failed: ${err.message}`);
        }
        break;
      }
      case "stashApply": {
        const idx = msg.payload;
        try {
          await this.gitService.stashApply(idx);
          vscode4.window.showInformationMessage(`Applied ${idx}`);
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stash apply failed: ${err.message}`);
        }
        break;
      }
      case "stashDrop": {
        const idx = msg.payload;
        const confirm = await vscode4.window.showWarningMessage(
          `Drop stash ${idx}?`,
          { modal: true },
          "Drop"
        );
        if (confirm !== "Drop") return;
        try {
          await this.gitService.stashDrop(idx);
          vscode4.window.showInformationMessage(`Dropped ${idx}`);
          await this.refresh();
        } catch (err) {
          vscode4.window.showErrorMessage(`Stash drop failed: ${err.message}`);
        }
        break;
      }
      case "openLog": {
        vscode4.commands.executeCommand("intellij-git.openLog");
        break;
      }
      case "collapseView": {
        vscode4.commands.executeCommand("workbench.action.toggleSidebarVisibility");
        break;
      }
    }
  }
  show() {
    if (this.view) {
      this.view.show(true);
    }
  }
  getHtml(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode4.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode4.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.css")
    );
    const nonce = getNonce3();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>Commit</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
};
function getNonce3() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// src/views/rebasePanel.ts
var vscode5 = __toESM(require("vscode"));
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
  extensionUri;
  gitService;
  rebaseHandler;
  baseHash;
  static currentPanel;
  static viewType = "intellij-git.rebasePanel";
  panel;
  disposables = [];
  static createOrShow(extensionUri, gitService, rebaseHandler, baseHash) {
    if (_RebasePanel.currentPanel) {
      _RebasePanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode5.window.createWebviewPanel(
      _RebasePanel.viewType,
      "Interactive Rebase",
      vscode5.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode5.Uri.joinPath(extensionUri, "dist", "webview")
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
      vscode5.window.showErrorMessage(`Failed to load commits for rebase: ${err.message}`);
    }
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "startRebase": {
        const todoItems = msg.payload;
        this.panel.webview.postMessage({ type: "rebaseStarted" });
        const result = await this.rebaseHandler.executeRebase(this.baseHash, todoItems);
        if (result.success) {
          vscode5.window.showInformationMessage("Rebase completed successfully.");
          this.panel.dispose();
        } else if (result.error === "conflict") {
          vscode5.window.showWarningMessage(
            "Rebase paused due to conflicts. Resolve them and continue.",
            "Open Merge Editor"
          ).then((choice) => {
            if (choice === "Open Merge Editor") {
              vscode5.commands.executeCommand("intellij-git.resolveConflicts");
            }
          });
          this.panel.dispose();
        } else {
          vscode5.window.showErrorMessage(`Rebase failed: ${result.error}`);
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
          vscode5.window.showInformationMessage("Rebase aborted.");
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
      vscode5.Uri.joinPath(this.extensionUri, "dist", "webview", "rebase", "rebase.js")
    );
    const nonce = getNonce4();
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
    for (const d of this.disposables) d.dispose();
  }
};
function getNonce4() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// src/views/branchTree.ts
var vscode6 = __toESM(require("vscode"));
var BranchTreeProvider = class {
  constructor(gitService) {
    this.gitService = gitService;
  }
  gitService;
  _onDidChangeTreeData = new vscode6.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire(void 0);
  }
  getTreeItem(element) {
    const collapsible = element.children ? vscode6.TreeItemCollapsibleState.Expanded : vscode6.TreeItemCollapsibleState.None;
    const item = new vscode6.TreeItem(element.label, collapsible);
    switch (element.type) {
      case "category":
        item.iconPath = new vscode6.ThemeIcon(
          element.label === "Tags" ? "tag" : "git-branch"
        );
        break;
      case "remote-group":
        item.iconPath = new vscode6.ThemeIcon("cloud");
        break;
      case "branch-current":
        item.iconPath = new vscode6.ThemeIcon("star-full");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-current";
        break;
      case "branch-local":
        item.iconPath = new vscode6.ThemeIcon("git-branch");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-local";
        break;
      case "branch-remote":
        item.iconPath = new vscode6.ThemeIcon("git-branch");
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-remote";
        break;
      case "tag":
        item.iconPath = new vscode6.ThemeIcon("tag");
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
var vscode7 = __toESM(require("vscode"));
var path5 = __toESM(require("path"));
var fs4 = __toESM(require("fs"));
var DEFAULT_DATA = {
  changelists: [{ name: "Default", files: [] }],
  active: "Default"
};
var ChangelistTreeProvider = class {
  constructor(gitService, workspaceRoot) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    const vscodePath = path5.join(workspaceRoot, ".vscode");
    this.dataPath = path5.join(vscodePath, "changelists.json");
    this.load();
    // File-save / file-create listeners removed — extension.ts shared handler calls syncChangelists()
  }
  gitService;
  workspaceRoot;
  _onDidChangeTreeData = new vscode7.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  data = DEFAULT_DATA;
  dataPath;
  treeView;
  setTreeView(treeView) {
    this.treeView = treeView;
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        this.syncWithGitStatus();
      }
    });
  }
  refresh() {
    this.load();
    this._onDidChangeTreeData.fire(void 0);
  }
  /** Called by extension.ts shared debounce handler on file save / create. */
  syncChangelists() {
    if (this.treeView && !this.treeView.visible) {
      return;
    }
    this.syncWithGitStatus();
  }
  getTreeItem(element) {
    if (element.type === "changelist") {
      const item = new vscode7.TreeItem(
        element.name,
        vscode7.TreeItemCollapsibleState.Expanded
      );
      item.contextValue = element.active ? "changelist-active" : "changelist";
      item.iconPath = new vscode7.ThemeIcon(
        element.active ? "folder-active" : "folder"
      );
      if (element.active) {
        item.description = "(active)";
      }
      return item;
    } else {
      const item = new vscode7.TreeItem(
        path5.basename(element.path),
        vscode7.TreeItemCollapsibleState.None
      );
      item.description = path5.dirname(element.path);
      item.contextValue = "changelist-file";
      item.resourceUri = vscode7.Uri.joinPath(
        vscode7.Uri.file(this.workspaceRoot),
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
      name = await vscode7.window.showInputBox({
        prompt: "Changelist name",
        placeHolder: "Feature: ..."
      });
    }
    if (!name) return;
    if (this.data.changelists.some((c) => c.name === name)) {
      vscode7.window.showWarningMessage(`Changelist "${name}" already exists.`);
      return;
    }
    this.data.changelists.push({ name, files: [] });
    this.save();
    this._onDidChangeTreeData.fire(void 0);
  }
  async deleteChangelist(name) {
    if (name === "Default") {
      vscode7.window.showWarningMessage("Cannot delete the Default changelist.");
      return;
    }
    const cl = this.data.changelists.find((c) => c.name === name);
    if (!cl) return;
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
      vscode7.window.showWarningMessage(`Changelist "${clName}" has no files.`);
      return;
    }
    const message = await vscode7.window.showInputBox({
      prompt: "Commit message",
      placeHolder: clName === "Default" ? "Commit message..." : clName,
      value: clName === "Default" ? "" : clName
    });
    if (!message) return;
    try {
      await this.gitService.stageFiles(cl.files);
      await this.gitService.commit(message);
      cl.files = [];
      this.save();
      this._onDidChangeTreeData.fire(void 0);
      vscode7.window.showInformationMessage(`Committed changelist "${clName}".`);
    } catch (err) {
      vscode7.window.showErrorMessage(`Commit failed: ${err.message}`);
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
        for (const f of cl.files) allFiles.add(f);
      }
      const activeCl = this.data.changelists.find((c) => c.name === this.data.active);
      if (!activeCl) return;
      let changed = false;
      for (const entry of status) {
        if (
          entry.path === '.vscode' ||
          entry.path.startsWith('.vscode/') ||
          entry.path.includes('changelists.json')
        ) {
          continue;
        }
        if (!allFiles.has(entry.path)) {
          activeCl.files.push(entry.path);
          changed = true;
        }
      }
      const statusPaths = new Set(status.map((s) => s.path));
      for (const cl of this.data.changelists) {
        const before = cl.files.length;
        cl.files = cl.files.filter(
          (f) =>
            statusPaths.has(f) &&
            !f.startsWith('.vscode/') &&
            !f.includes('changelists.json')
        );
        if (cl.files.length !== before) changed = true;
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
      if (fs4.existsSync(this.dataPath)) {
        const raw = fs4.readFileSync(this.dataPath, "utf-8");
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = { ...DEFAULT_DATA };
    }
    if (!this.data.changelists.some((c) => c.name === "Default")) {
      this.data.changelists.unshift({ name: "Default", files: [] });
    }
    for (const cl of this.data.changelists) {
      cl.files = cl.files.filter(
        (f) => !f.startsWith('.vscode/') && !f.includes('changelists.json')
      );
    }
  }
  save() {
    try {
      const dir = path5.dirname(this.dataPath);
      if (!fs4.existsSync(dir)) {
        fs4.mkdirSync(dir, { recursive: true });
      }
      fs4.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch {
    }
  }
};

// src/providers/blameDecorations.ts
var vscode8 = __toESM(require("vscode"));

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
  if (cached) return cached;
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
    decorationType = vscode8.window.createTextEditorDecorationType({
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
      vscode8.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (this.isEnabled(e.textEditor)) {
          this.updateDecorations(e.textEditor);
        }
      })
    );
    this.disposables.push(
      vscode8.workspace.onDidSaveTextDocument((doc) => {
        const relativePath = vscode8.workspace.asRelativePath(doc.uri);
        invalidateBlameCache(relativePath);
        this.blameData.delete(doc.uri.toString());
        const editor = vscode8.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === doc.uri.toString()
        );
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode8.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode8.window.onDidChangeTextEditorSelection((e) => {
        if (e.kind !== vscode8.TextEditorSelectionChangeKind.Mouse) return;
        if (!this.isEnabled(e.textEditor)) return;
        const sel = e.selections[0];
        if (!sel || !sel.isEmpty) return;
        if (sel.active.character > 0) return;
        const uri = e.textEditor.document.uri.toString();
        const lines = this.blameData.get(uri);
        if (!lines) return;
        const blameLine = lines.find((l) => l.lineNumber === sel.active.line + 1);
        if (!blameLine || blameLine.hash.startsWith("0000000")) return;
        vscode8.commands.executeCommand("intellij-git.showCommitInLog", blameLine.hash);
      })
    );
    this.disposables.push(
      vscode8.languages.registerHoverProvider("*", {
        provideHover: (doc, pos) => this.provideHover(doc, pos)
      })
    );
  }
  workspaceRoot;
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
    if (!blameEnabled.get(uri)) return;
    const relativePath = vscode8.workspace.asRelativePath(editor.document.uri);
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
        if (!blameLine) continue;
        if (blameLine.hash.startsWith("0000000")) continue;
        const date = formatShortDate(blameLine.authorDate);
        const author = blameLine.author.length > 10 ? blameLine.author.slice(0, 10) : blameLine.author.padEnd(10);
        const text = `${date}  ${author}`;
        decorations.push({
          range: new vscode8.Range(lineNum, 0, lineNum, 0),
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
    if (!blameEnabled.get(uri)) return void 0;
    const lines = this.blameData.get(uri);
    if (!lines) return void 0;
    const blameLine = lines.find((l) => l.lineNumber === position.line + 1);
    if (!blameLine || blameLine.hash.startsWith("0000000")) return void 0;
    const md = new vscode8.MarkdownString();
    md.appendMarkdown(`**${blameLine.summary}**

`);
    md.appendMarkdown(`- **Author:** ${blameLine.author} (${blameLine.authorEmail})
`);
    md.appendMarkdown(`- **Date:** ${new Date(blameLine.authorDate).toLocaleString()}
`);
    md.appendMarkdown(`- **Commit:** \`${blameLine.hash.slice(0, 10)}\`
`);
    return new vscode8.Hover(md);
  }
  dispose() {
    for (const d of this.disposables) d.dispose();
    if (decorationType) {
      decorationType.dispose();
      decorationType = void 0;
    }
    blameEnabled.clear();
    this.blameData.clear();
  }
};

// src/providers/mergeProvider.ts
var vscode9 = __toESM(require("vscode"));
var path6 = __toESM(require("path"));
var fs5 = __toESM(require("fs"));
var MergeProvider = class {
  constructor(gitService, workspaceRoot) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    this.statusBarItem = vscode9.window.createStatusBarItem(
      vscode9.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "intellij-git.resolveConflicts";
    this.disposables.push(this.statusBarItem);
    this.checkForConflicts();
  }
  gitService;
  workspaceRoot;
  disposables = [];
  statusBarItem;
  refresh() {
    this.checkForConflicts();
  }
  async checkForConflicts() {
    try {
      const gitDir = path6.join(this.workspaceRoot, ".git");
      const hasConflictState = fs5.existsSync(path6.join(gitDir, "MERGE_HEAD")) || fs5.existsSync(path6.join(gitDir, "rebase-apply")) || fs5.existsSync(path6.join(gitDir, "rebase-merge")) || fs5.existsSync(path6.join(gitDir, "CHERRY_PICK_HEAD"));
      if (!hasConflictState) {
        this.statusBarItem.hide();
        return;
      }
      const unmerged = await this.gitService.getUnmergedFiles();
      if (unmerged.length > 0) {
        this.statusBarItem.text = `$(git-merge) ${unmerged.length} conflict${unmerged.length > 1 ? "s" : ""}`;
        this.statusBarItem.tooltip = `${unmerged.length} unresolved merge conflict(s). Click to resolve.`;
        this.statusBarItem.backgroundColor = new vscode9.ThemeColor(
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
      vscode9.window.showInformationMessage("No merge conflicts to resolve.");
      return;
    }
    const items = unmerged.map((f) => ({
      label: f,
      description: "Unresolved conflict"
    }));
    const selected = await vscode9.window.showQuickPick(items, {
      placeHolder: `${unmerged.length} file(s) with conflicts \u2014 select to resolve`,
      canPickMany: false
    });
    if (selected) {
      const fileUri = vscode9.Uri.joinPath(
        vscode9.Uri.file(this.workspaceRoot),
        selected.label
      );
      await vscode9.commands.executeCommand("vscode.open", fileUri);
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
        vscode9.window.showInformationMessage(`Auto-staged ${staged} resolved file(s).`);
      }
    } catch (err) {
      vscode9.window.showErrorMessage(`Failed: ${err.message}`);
    }
  }
  dispose() {
    for (const d of this.disposables) d.dispose();
  }
};

// src/extension.ts
var log;
function activate(context) {
  log = vscode10.window.createOutputChannel("IntelliJ Git");
  context.subscriptions.push(log);
  log.appendLine("IntelliJ Git extension activating...");
  const workspaceFolder = vscode10.workspace.workspaceFolders?.[0];
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
    vscode10.workspace.registerTextDocumentContentProvider(
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
    vscode10.window.registerWebviewViewProvider(
      GraphViewProvider.viewType,
      graphViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  const commitViewProvider = new CommitViewProvider(context.extensionUri, gitService, log);
  context.subscriptions.push(
    vscode10.window.registerWebviewViewProvider(
      CommitViewProvider.viewType,
      commitViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  const branchTree = new BranchTreeProvider(gitService);
  const branchTreeView = vscode10.window.createTreeView("intellij-git.branches", {
    treeDataProvider: branchTree,
    showCollapseAll: true
  });
  context.subscriptions.push(branchTreeView);
  const changelistTree = new ChangelistTreeProvider(gitService, workspaceRoot);
  const changelistTreeView = vscode10.window.createTreeView("intellij-git.changelists", {
    treeDataProvider: changelistTree,
    showCollapseAll: true
  });
  changelistTree.setTreeView(changelistTreeView);
  context.subscriptions.push(changelistTreeView);
  const blameProvider = new BlameDecorationProvider(workspaceRoot);
  context.subscriptions.push(blameProvider);
  const mergeProvider = new MergeProvider(gitService, workspaceRoot);
  context.subscriptions.push(mergeProvider);
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.openCommit", () => {
      vscode10.commands.executeCommand("intellij-git.commitView.focus");
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.openLog", () => {
      vscode10.commands.executeCommand("intellij-git.logView.focus");
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.showCommitInLog", (hash) => {
      vscode10.commands.executeCommand("intellij-git.logView.focus");
      graphViewProvider.selectCommit(hash);
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.toggleBlame", () => {
      const editor = vscode10.window.activeTextEditor;
      if (editor) {
        log.appendLine(`Toggling blame on ${editor.document.uri.fsPath}`);
        blameProvider.toggle(editor);
      } else {
        vscode10.window.showWarningMessage("No active text editor for blame.");
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.interactiveRebase", async (baseHash) => {
      if (!baseHash) {
        baseHash = await vscode10.window.showInputBox({
          prompt: "Base commit hash (rebase from this point)",
          placeHolder: "e.g. HEAD~5 or a commit hash"
        });
      }
      if (!baseHash) return;
      RebasePanel.createOrShow(context.extensionUri, gitService, rebaseHandler, baseHash);
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.refreshBranches", () => {
      branchTree.refresh();
      graphViewProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.checkoutBranch", async (node) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.checkout(ref);
        graphViewProvider.refresh();
        vscode10.window.showInformationMessage(`Checked out ${ref}`);
      } catch (err) {
        vscode10.window.showErrorMessage(`Checkout failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.createBranch", async (node) => {
      const name = await vscode10.window.showInputBox({
        prompt: "New branch name",
        placeHolder: "feature/..."
      });
      if (!name) return;
      try {
        await gitService.createBranch(name, node?.ref);
        graphViewProvider.refresh();
        vscode10.window.showInformationMessage(`Created and checked out ${name}`);
      } catch (err) {
        vscode10.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.deleteBranch", async (node) => {
      const ref = node?.ref;
      if (!ref) return;
      const confirm = await vscode10.window.showWarningMessage(
        `Delete branch "${ref}"?`,
        { modal: true },
        "Delete"
      );
      if (confirm !== "Delete") return;
      try {
        await gitService.deleteBranch(ref);
        graphViewProvider.refresh();
      } catch (err) {
        vscode10.window.showErrorMessage(`Delete failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.mergeBranch", async (node) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.merge(ref);
        graphViewProvider.refresh();
        vscode10.window.showInformationMessage(`Merged ${ref} into current branch.`);
      } catch (err) {
        if (err.message?.includes("CONFLICT")) {
          vscode10.window.showWarningMessage(
            `Merge conflicts detected. Resolve them to complete the merge.`,
            "Resolve"
          ).then((choice) => {
            if (choice === "Resolve") {
              vscode10.commands.executeCommand("intellij-git.resolveConflicts");
            }
          });
        } else {
          vscode10.window.showErrorMessage(`Merge failed: ${err.message}`);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.rebaseBranch", async (node) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        await gitService.rebase(ref);
        graphViewProvider.refresh();
        vscode10.window.showInformationMessage(`Rebased current branch onto ${ref}.`);
      } catch (err) {
        vscode10.window.showErrorMessage(`Rebase failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.compareBranch", async (node) => {
      const ref = node?.ref;
      if (!ref) return;
      try {
        const current = await gitService.getCurrentBranch();
        await vscode10.commands.executeCommand("git.branchCompare", ref, current);
      } catch (err) {
        vscode10.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.resolveConflicts", () => {
      mergeProvider.resolveConflicts();
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.acceptAllNonConflicting", () => {
      mergeProvider.acceptAllNonConflicting();
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.newChangelist", () => {
      changelistTree.createChangelist();
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.deleteChangelist", (node) => {
      if (node?.name) {
        changelistTree.deleteChangelist(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.setActiveChangelist", (node) => {
      if (node?.name) {
        changelistTree.setActive(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.commitChangelist", (node) => {
      changelistTree.commitChangelist(node?.name);
    })
  );
  context.subscriptions.push(
    vscode10.commands.registerCommand("intellij-git.refreshChangelists", () => {
      changelistTree.refresh();
    })
  );
  function debounce(fn, delay = 600) {
    let timer;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  const gitWatcher = vscode10.workspace.createFileSystemWatcher(
    new vscode10.RelativePattern(workspaceRoot, ".git/{HEAD,refs/**,packed-refs}")
  );
  const onGitChange = debounce(() => {
    log.appendLine("Git change detected \u2014 refreshing views...");
    branchTree.refresh();
    graphViewProvider.refresh();
    commitViewProvider.refresh();
    mergeProvider.refresh();
    if (CommitReviewPanel.currentPanel) {
      CommitReviewPanel.currentPanel.refresh();
    }
  }, 600);
  const handleGitFsEvent = (uri) => {
    const fsPath = uri?.fsPath || uri?.path || "";
    if (
      fsPath.endsWith(".lock") ||
      fsPath.includes("/objects/") ||
      fsPath.includes("\\objects\\") ||
      fsPath.endsWith("COMMIT_EDITMSG")
    ) {
      return;
    }
    onGitChange();
  };
  gitWatcher.onDidChange(handleGitFsEvent);
  gitWatcher.onDidCreate(handleGitFsEvent);
  gitWatcher.onDidDelete(handleGitFsEvent);
  context.subscriptions.push(gitWatcher);
  try {
    const gitExt = vscode10.extensions.getExtension("vscode.git");
    if (gitExt) {
      const gitApi = gitExt.exports.getAPI?.(1);
      if (gitApi) {
        gitApi.repositories.forEach((repo) => {
          repo.state.onDidChange(onGitChange);
        });
        gitApi.onDidOpenRepository((repo) => {
          repo.state.onDidChange(onGitChange);
        });
      }
    }
  } catch (err) {
    log.appendLine(`Failed to hook into vscode.git: ${err.message}`);
  }
  const onWorkspaceFileChange = debounce((doc) => {
    commitViewProvider.refresh();
    changelistTree.syncChangelists();
    if (
      doc &&
      CommitReviewPanel.currentPanel &&
      doc.uri.fsPath.endsWith(CommitReviewPanel.currentPanel.getCurrentFilePath())
    ) {
      CommitReviewPanel.currentPanel.refresh();
    }
  }, 400);
  context.subscriptions.push(
    vscode10.workspace.onDidSaveTextDocument((doc) => {
      if (doc.uri.scheme === "file") {
        onWorkspaceFileChange(doc);
      }
    })
  );
  context.subscriptions.push(
    vscode10.workspace.onDidCreateFiles(() => onWorkspaceFileChange()),
    vscode10.workspace.onDidDeleteFiles(() => onWorkspaceFileChange()),
    vscode10.workspace.onDidRenameFiles(() => onWorkspaceFileChange())
  );
  context.subscriptions.push(
    vscode10.window.onDidChangeWindowState((e) => {
      if (e.focused) {
        commitViewProvider.refresh();
        branchTree.refresh();
        mergeProvider.refresh();
      }
    })
  );
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
