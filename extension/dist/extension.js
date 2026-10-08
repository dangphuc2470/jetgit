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
var vscode19 = __toESM(require("vscode"));

// src/git/gitService.ts
var import_child_process2 = require("child_process");
var import_util = require("util");
var fs3 = __toESM(require("fs"));
var path4 = __toESM(require("path"));

// src/cache.ts
var LRUCache = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = /* @__PURE__ */ new Map();
  }
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

// src/git/gitTypes.ts
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

// src/git/operations/conflictOperations.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
async function getUnmergedFiles(ctx) {
  const output = await ctx.exec(["diff", "--name-only", "--diff-filter=U"]);
  return output.split("\n").filter((l) => l.trim());
}
async function getConflictInfo(ctx) {
  const gitDir = path.join(ctx.cwd, ".git");
  const isMerging = fs.existsSync(path.join(gitDir, "MERGE_HEAD"));
  const isRebasing = fs.existsSync(path.join(gitDir, "rebase-merge")) || fs.existsSync(path.join(gitDir, "rebase-apply"));
  const isCherryPicking = fs.existsSync(path.join(gitDir, "CHERRY_PICK_HEAD"));
  let yoursBranch = "";
  try {
    yoursBranch = await ctx.getCurrentBranch();
  } catch {
  }
  if (!yoursBranch)
    yoursBranch = "HEAD";
  let theirsBranch = "";
  if (isMerging) {
    try {
      const mergeMsg = await ctx.getMergeMessage();
      const m = mergeMsg.match(/Merge branch '([^']+)'/) || mergeMsg.match(/Merge commit '([^']+)'/);
      if (m) {
        theirsBranch = m[1];
      } else {
        const mergeHead = fs.readFileSync(path.join(gitDir, "MERGE_HEAD"), "utf8").trim();
        theirsBranch = mergeHead.slice(0, 7);
      }
    } catch {
    }
  } else if (isRebasing) {
    try {
      const headNamePath = path.join(gitDir, "rebase-merge", "head-name");
      if (fs.existsSync(headNamePath)) {
        theirsBranch = fs.readFileSync(headNamePath, "utf8").trim().replace("refs/heads/", "");
      }
    } catch {
    }
  }
  if (!theirsBranch)
    theirsBranch = "Theirs";
  const statusEntries = await ctx.getStatus();
  const conflictCodes = /* @__PURE__ */ new Set(["UU", "UD", "DU", "AA", "DD", "AU", "UA"]);
  const conflictEntries = statusEntries.filter(
    (e) => conflictCodes.has(`${e.x}${e.y}`) || e.x === "U" || e.y === "U"
  );
  const conflicts = conflictEntries.map((e) => {
    let yours = "Modified";
    let theirs = "Modified";
    const code = `${e.x}${e.y}`;
    if (code === "UD") {
      yours = "Modified";
      theirs = "Deleted";
    } else if (code === "DU") {
      yours = "Deleted";
      theirs = "Modified";
    } else if (code === "AA") {
      yours = "Added";
      theirs = "Added";
    } else if (code === "DD") {
      yours = "Deleted";
      theirs = "Deleted";
    } else if (code === "AU") {
      yours = "Added";
      theirs = "Modified";
    } else if (code === "UA") {
      yours = "Modified";
      theirs = "Added";
    }
    return {
      path: e.path,
      name: path.basename(e.path),
      dir: path.dirname(e.path) === "." ? "" : path.dirname(e.path),
      yours,
      theirs,
      hasBothModified: yours === "Modified" && theirs === "Modified"
    };
  });
  return {
    hasConflicts: conflicts.length > 0,
    isMerging,
    isRebasing: isRebasing || isCherryPicking,
    yoursBranch,
    theirsBranch,
    conflicts
  };
}
async function acceptYours(ctx, filePath) {
  const status = await ctx.getStatus();
  const entry = status.find((s) => s.path === filePath);
  const code = entry ? `${entry.x}${entry.y}` : "";
  if (code === "DU" || code === "DD") {
    await ctx.exec(["rm", "-f", "--", filePath]).catch(
      () => ctx.exec(["rm", "--cached", "--ignore-unmatch", "--", filePath])
    );
  } else {
    await ctx.exec(["checkout", "--ours", "--", filePath]);
    await ctx.stageFiles([filePath]);
  }
}
async function acceptTheirs(ctx, filePath) {
  const status = await ctx.getStatus();
  const entry = status.find((s) => s.path === filePath);
  const code = entry ? `${entry.x}${entry.y}` : "";
  if (code === "UD" || code === "DD") {
    await ctx.exec(["rm", "-f", "--", filePath]).catch(
      () => ctx.exec(["rm", "--cached", "--ignore-unmatch", "--", filePath])
    );
  } else {
    await ctx.exec(["checkout", "--theirs", "--", filePath]);
    await ctx.stageFiles([filePath]);
  }
}
async function abortMerge(ctx) {
  const gitDir = path.join(ctx.cwd, ".git");
  if (fs.existsSync(path.join(gitDir, "rebase-merge")) || fs.existsSync(path.join(gitDir, "rebase-apply"))) {
    await ctx.exec(["rebase", "--abort"]);
  } else if (fs.existsSync(path.join(gitDir, "CHERRY_PICK_HEAD"))) {
    await ctx.exec(["cherry-pick", "--abort"]);
  } else {
    await ctx.exec(["merge", "--abort"]);
  }
}
async function getMergeMessage(cwd) {
  try {
    const mergeMsgPath = path.join(cwd, ".git", "MERGE_MSG");
    if (fs.existsSync(mergeMsgPath)) {
      return fs.readFileSync(mergeMsgPath, "utf8").trim();
    }
  } catch {
  }
  return "";
}

// src/git/operations/branchOperations.ts
var path2 = __toESM(require("path"));
async function getBranches(ctx) {
  const localOutput = await ctx.exec([
    "branch",
    "--format",
    "%(HEAD)%(refname:short)	%(objectname:short)	%(upstream:short)	%(upstream:track,nobracket)"
  ]);
  const remoteOutput = await ctx.exec([
    "branch",
    "-r",
    "--format",
    "%(refname:short)	%(objectname:short)"
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
      if (aheadMatch)
        ahead = parseInt(aheadMatch[1], 10);
      const behindMatch = track.match(/behind (\d+)/);
      if (behindMatch)
        behind = parseInt(behindMatch[1], 10);
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
    if (!line.trim())
      continue;
    if (line.includes(" -> "))
      continue;
    const [name, hash] = line.split("	");
    const trimmedName = name.trim();
    if (!trimmedName.includes("/") || trimmedName.endsWith("/HEAD")) {
      continue;
    }
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
async function getTags(ctx) {
  const output = await ctx.exec([
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
async function getCurrentBranch(ctx) {
  const output = await ctx.exec(["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = output.trim();
  if (branch === "HEAD") {
    try {
      const desc = await ctx.exec(["describe", "--tags", "--exact-match", "HEAD"]);
      return `HEAD (detached at ${desc.trim()})`;
    } catch {
      const hash = await ctx.exec(["rev-parse", "--short", "HEAD"]);
      return `HEAD (detached at ${hash.trim()})`;
    }
  }
  return branch;
}
async function checkout(ctx, ref) {
  try {
    const remotes = await ctx.getRemotes();
    for (const remote of remotes) {
      if (ref.startsWith(remote + "/")) {
        const localBranchName = ref.slice(remote.length + 1);
        try {
          await ctx.exec(["fetch", remote, `refs/heads/${localBranchName}:refs/remotes/${remote}/${localBranchName}`]);
        } catch {
        }
        const branchCheck = await ctx.exec(["branch", "--list", localBranchName]);
        if (branchCheck.trim()) {
          await ctx.exec(["checkout", localBranchName]);
        } else {
          await ctx.exec(["checkout", "-b", localBranchName, "--track", ref]);
        }
        return;
      }
    }
  } catch {
  }
  await ctx.exec(["checkout", ref]);
}
async function createBranch(ctx, name, startPoint, checkout2 = true, force = false) {
  if (checkout2) {
    const args = ["checkout", force ? "-B" : "-b", name];
    if (startPoint)
      args.push(startPoint);
    await ctx.exec(args);
  } else {
    const args = ["branch"];
    if (force)
      args.push("-f");
    args.push(name);
    if (startPoint)
      args.push(startPoint);
    await ctx.exec(args);
  }
}
async function getRemotes(ctx) {
  try {
    const out = await ctx.exec(["remote"]);
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
async function getDefaultRemote(ctx, branch) {
  try {
    const curBranch = branch || await ctx.getCurrentBranch().catch(() => "");
    if (curBranch) {
      try {
        const r = await ctx.exec(["config", `branch.${curBranch}.remote`]);
        if (r.trim())
          return r.trim();
      } catch {
      }
    }
    const remotes = await getRemotes(ctx);
    if (remotes.includes("origin"))
      return "origin";
    if (remotes.length > 0)
      return remotes[0];
  } catch {
  }
  return "origin";
}
async function getRemoteUrl(ctx) {
  try {
    const remote = await getDefaultRemote(ctx);
    const out = await ctx.exec(["remote", "get-url", remote]);
    return out.trim();
  } catch {
    return "";
  }
}
async function pull(ctx, branch) {
  const curBranch = await ctx.getCurrentBranch();
  if (!branch || branch === curBranch) {
    return ctx.exec(["pull"]);
  }
  try {
    const remote = await getDefaultRemote(ctx, branch);
    let targetBranch = branch;
    if (branch.startsWith(remote + "/")) {
      targetBranch = branch.slice(remote.length + 1);
    }
    const branchCheck = await ctx.exec(["branch", "--list", targetBranch]);
    if (branchCheck.trim()) {
      const out = await ctx.exec(["fetch", remote, `${targetBranch}:${targetBranch}`]);
      return out || `Updated branch '${targetBranch}' successfully.`;
    } else {
      const out = await ctx.exec(["fetch", remote, targetBranch]);
      return out || `Fetched '${targetBranch}' successfully.`;
    }
  } catch (err) {
    if (err.message && (err.message.includes("non-fast-forward") || err.message.includes("rejected"))) {
      throw new Error(`Cannot fast-forward branch '${branch}' because local commits diverged. Please checkout '${branch}' to merge or rebase.`);
    }
    throw err;
  }
}
async function getPushInfo(ctx, targetBranch) {
  const currentBranch = targetBranch || await ctx.getCurrentBranch();
  const remote = await getDefaultRemote(ctx, currentBranch);
  const remoteBranch = currentBranch;
  const repoRoot = await ctx.getRepoRoot().catch(() => ctx.cwd);
  const repoName = path2.basename(repoRoot);
  let isNew = true;
  try {
    await ctx.exec(["rev-parse", "--verify", `refs/remotes/${remote}/${currentBranch}`]);
    isNew = false;
  } catch {
    isNew = true;
  }
  let logArgs = [];
  if (!isNew) {
    logArgs = ["log", `${remote}/${currentBranch}..${currentBranch}`, "--format=%H%x00%h%x00%an%x00%ad%x00%s"];
  } else {
    logArgs = ["log", currentBranch, `--not`, `--remotes=${remote}`, "--format=%H%x00%h%x00%an%x00%ad%x00%s"];
  }
  let rawLog = "";
  try {
    rawLog = await ctx.exec(logArgs);
  } catch {
    try {
      rawLog = await ctx.exec(["log", "-n", "10", "--format=%H%x00%h%x00%an%x00%ad%x00%s"]);
    } catch {
    }
  }
  const lines = rawLog.split("\n").filter((l) => l.trim());
  const commits = [];
  const fileMap = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const parts = line.split("\0");
    if (parts.length < 5)
      continue;
    const [hash, shortHash, author, date, message] = parts;
    let commitFiles2 = [];
    try {
      const diffOut = await ctx.exec(["diff-tree", "--no-commit-id", "--name-status", "-r", hash]);
      commitFiles2 = diffOut.split("\n").filter((l) => l.trim()).map((dl) => {
        const tokens = dl.trim().split(/\s+/);
        const status = tokens[0] || "M";
        const p = tokens.length > 2 ? tokens[2] : tokens[1] || "";
        const dir = path2.dirname(p) === "." ? "" : path2.dirname(p);
        const fObj = {
          status: status.charAt(0),
          path: p,
          name: path2.basename(p),
          dir
        };
        if (!fileMap.has(p)) {
          fileMap.set(p, fObj);
        }
        return fObj;
      });
    } catch {
    }
    commits.push({
      hash,
      shortHash,
      message,
      author,
      date,
      files: commitFiles2
    });
  }
  const totalFiles = Array.from(fileMap.values());
  const remotes = await getRemotes(ctx);
  return {
    currentBranch,
    remote,
    remoteBranch,
    remotes: remotes.length > 0 ? remotes : [remote],
    repoName,
    isNew,
    commits,
    totalFiles
  };
}
async function push(ctx, branch, force = false, setUpstream = false, remoteName, tags = false, targetBranch) {
  const curBranch = branch || await ctx.getCurrentBranch();
  const remote = remoteName || await getDefaultRemote(ctx, curBranch);
  const args = ["push"];
  if (force)
    args.push("--force-with-lease");
  if (tags)
    args.push("--tags");
  let hasUpstream = false;
  try {
    const upstream = await ctx.exec(["rev-parse", "--abbrev-ref", `${curBranch}@{u}`]);
    if (upstream.trim())
      hasUpstream = true;
  } catch {
  }
  const remoteRef = targetBranch && targetBranch.trim() ? targetBranch.trim() : curBranch;
  const isCustomTarget = remoteRef !== curBranch;
  const refspec = isCustomTarget ? `${curBranch}:${remoteRef}` : curBranch;
  if (setUpstream || !hasUpstream || isCustomTarget) {
    args.push("-u", remote, refspec);
  } else {
    args.push(remote, refspec);
  }
  return ctx.exec(args);
}

// src/git/operations/stagingOperations.ts
var fs2 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var import_child_process = require("child_process");
async function getStatus(ctx) {
  const output = await ctx.exec(["status", "--porcelain=v1", "-uall"]);
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
async function stageFiles(ctx, paths) {
  if (!paths || paths.length === 0)
    return;
  const existing = [];
  const missing = [];
  for (const p of paths) {
    const full = path3.isAbsolute(p) ? p : path3.join(ctx.cwd, p);
    if (fs2.existsSync(full)) {
      existing.push(p);
    } else {
      missing.push(p);
    }
  }
  if (existing.length > 0) {
    await ctx.exec(["add", "--", ...existing]);
  }
  if (missing.length > 0) {
    await ctx.exec(["rm", "--cached", "--ignore-unmatch", "--", ...missing]);
  }
}
async function stageFileContent(ctx, filePath, content) {
  return new Promise((resolve2, reject) => {
    const proc = (0, import_child_process.execFile)("git", ["hash-object", "-w", "--stdin"], { cwd: ctx.cwd }, (err, stdout, stderr) => {
      if (err)
        return reject(new Error(stderr || err.message));
      const sha = stdout.trim();
      ctx.exec(["update-index", "--cacheinfo", `100644,${sha},${filePath}`]).then(() => resolve2()).catch(reject);
    });
    proc.stdin?.write(content);
    proc.stdin?.end();
  });
}
async function unstageFiles(ctx, paths) {
  await ctx.exec(["reset", "HEAD", "--", ...paths]);
}
async function rollbackFiles(ctx, paths) {
  const status = await ctx.getStatus();
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
      await ctx.exec(["checkout", "HEAD", "--", ...toRestore]);
    } catch {
      await ctx.exec(["restore", "--staged", "--worktree", "--", ...toRestore]);
    }
  }
  for (const p of toClean) {
    try {
      const fullPath = path3.join(ctx.cwd, p);
      if (fs2.existsSync(fullPath)) {
        if (fs2.statSync(fullPath).isDirectory()) {
          fs2.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs2.unlinkSync(fullPath);
        }
      }
    } catch {
    }
  }
}
async function getFileDiff(ctx, filePath) {
  const status = await ctx.getStatus();
  const entry = status.find((s) => s.path === filePath);
  if (entry && entry.x === "?" && entry.y === "?") {
    try {
      const fullPath = path3.join(ctx.cwd, filePath);
      const content = fs2.readFileSync(fullPath, "utf8");
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
    const diff = await ctx.exec(["diff", "HEAD", "--", filePath]);
    if (diff.trim())
      return diff;
    return await ctx.exec(["diff", "--", filePath]);
  } catch {
    return await ctx.exec(["diff", "--", filePath]);
  }
}
async function applyHunkPatch(ctx, patchContent, reverse = false) {
  return new Promise((resolve2, reject) => {
    const args = ["apply", "--cached", "--recount", "--whitespace=nowarn"];
    if (reverse)
      args.push("--reverse");
    args.push("-");
    const proc = (0, import_child_process.execFile)("git", args, { cwd: ctx.cwd }, (err, stdout, stderr) => {
      if (err)
        return reject(new Error(stderr || err.message));
      resolve2(stdout);
    });
    proc.stdin?.write(patchContent);
    proc.stdin?.end();
  });
}

// src/git/operations/commitOperations.ts
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
async function getLog(ctx, options = {}) {
  const args = ["log", `--format=${LOG_FORMAT}`];
  if (options.order === "topo") {
    args.push("--topo-order");
  } else {
    args.push("--date-order");
  }
  if (options.firstParent) {
    args.push("--first-parent");
  }
  if (options.noMerges) {
    args.push("--no-merges");
  }
  if (options.all === true || !options.branch && options.all !== false) {
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
  if (options.query) {
    args.push(`--grep=${options.query}`);
    args.push("-i");
  }
  if (options.branch) {
    let branchExists = false;
    try {
      await ctx.exec(["rev-parse", "--verify", options.branch]);
      branchExists = true;
    } catch {
      const slashIdx = options.branch.indexOf("/");
      if (slashIdx !== -1) {
        const remote = options.branch.slice(0, slashIdx);
        const leafBranch = options.branch.slice(slashIdx + 1);
        try {
          await ctx.exec(["fetch", remote, `refs/heads/${leafBranch}:refs/remotes/${remote}/${leafBranch}`]);
          await ctx.exec(["rev-parse", "--verify", options.branch]);
          branchExists = true;
        } catch {
          branchExists = false;
        }
      }
    }
    if (branchExists) {
      args.push(options.branch);
    } else if (!args.includes("--all")) {
      args.push("--all");
    }
  }
  if (options.path) {
    args.push("--");
    args.push(options.path);
  }
  const output = await ctx.exec(args);
  const commits = [];
  for (const chunk of output.split("\0")) {
    if (!chunk.trim())
      continue;
    const parts = chunk.split(SEP);
    if (parts.length < 9)
      continue;
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
    ctx.commitCache.set(commit.hash, commit);
    commits.push(commit);
  }
  if (options.query && /^[0-9a-f]{4,40}$/i.test(options.query.trim())) {
    try {
      const hashOut = await ctx.exec(["log", "-n1", `--format=${LOG_FORMAT}`, "--decorate=full", options.query.trim()]);
      for (const chunk of hashOut.split("\0")) {
        if (!chunk.trim())
          continue;
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
          ctx.commitCache.set(hashCommit.hash, hashCommit);
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
async function getCommitFiles(ctx, hash) {
  const output = await ctx.exec([
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
async function getAuthorRecentCommitMessages(ctx, count = 10) {
  try {
    let author = "";
    try {
      author = (await ctx.exec(["config", "user.email"])).trim();
    } catch {
    }
    if (!author) {
      try {
        author = (await ctx.exec(["config", "user.name"])).trim();
      } catch {
      }
    }
    const isMergeOrMr = (msg) => {
      const lower = msg.toLowerCase().trim();
      return lower.startsWith("merge ") || lower.startsWith("merge branch") || lower.startsWith("merge remote-tracking") || lower.startsWith("revert ") || lower.startsWith("resolve conflict") || lower.includes("merge request") || lower.includes("pull request") || lower.startsWith("see merge request") || /^mr\s*!/i.test(lower) || /^pr\s*#/i.test(lower);
    };
    const args = ["log", "-n", "50", "--no-merges", "--pretty=%s"];
    if (author) {
      args.push(`--author=${author}`);
    }
    let out = "";
    try {
      out = await ctx.exec(args);
    } catch {
      out = await ctx.exec(["log", "-n", "30", "--no-merges", "--pretty=%s"]);
    }
    const cleanList = out.split("\n").map((s) => s.trim()).filter((s) => Boolean(s) && !isMergeOrMr(s));
    if (cleanList.length > 0) {
      return cleanList.slice(0, count);
    }
    const fallbackOut = await ctx.exec(["log", "-n", "30", "--no-merges", "--pretty=%s"]);
    return fallbackOut.split("\n").map((s) => s.trim()).filter((s) => Boolean(s) && !isMergeOrMr(s)).slice(0, count);
  } catch {
    return [];
  }
}
async function getStashes(ctx) {
  try {
    const out = await ctx.exec(["stash", "list", "--format=%gd%gs%cr"]);
    const list = [];
    for (const line of out.split("\n")) {
      if (!line.trim())
        continue;
      const [index, message, date] = line.split("");
      list.push({ index: index?.trim(), message: message?.trim(), date: date?.trim() });
    }
    return list;
  } catch {
    return [];
  }
}
async function commitFiles(ctx, message, filesToStage, amend = false) {
  if (filesToStage && filesToStage.length > 0) {
    await ctx.stageFiles(filesToStage);
  }
  const args = ["commit"];
  if (amend)
    args.push("--amend");
  args.push("-m", message);
  await ctx.exec(args);
}

// src/git/gitService.ts
var execFileAsync = (0, import_util.promisify)(import_child_process2.execFile);
var GitService = class {
  constructor(workspaceRoot) {
    this.commitCache = new LRUCache(5e3);
    this.discoveredRemoteBranches = /* @__PURE__ */ new Map();
    this.cwd = workspaceRoot;
  }
  getCwd() {
    return this.cwd;
  }
  setCwd(newCwd) {
    this.cwd = newCwd;
    this.commitCache.clear();
    this.discoveredRemoteBranches.clear();
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
      const entries = fs3.readdirSync(this.cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          const subPath = path4.join(this.cwd, entry.name);
          const subGit = path4.join(subPath, ".git");
          if (fs3.existsSync(subGit)) {
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
  async exec(args, maxBuffer = 10 * 1024 * 1024, retries = 5, timeout = 0) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { stdout } = await execFileAsync("git", args, {
          cwd: this.cwd,
          maxBuffer,
          timeout: timeout > 0 ? timeout : void 0,
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
        });
        return stdout;
      } catch (err) {
        const isLockError = err?.message && (err.message.includes("index.lock") || err.message.includes("Unable to create") && err.message.includes(".lock"));
        if (isLockError && attempt < retries - 1) {
          try {
            const dotGit = path4.join(this.cwd, ".git");
            let lockPath = path4.join(dotGit, "index.lock");
            if (fs3.existsSync(dotGit) && fs3.statSync(dotGit).isFile()) {
              const content = fs3.readFileSync(dotGit, "utf8").trim();
              if (content.startsWith("gitdir:")) {
                const relOrAbs = content.replace(/^gitdir:\s*/, "");
                const actualGitDir = path4.isAbsolute(relOrAbs) ? relOrAbs : path4.resolve(this.cwd, relOrAbs);
                lockPath = path4.join(actualGitDir, "index.lock");
              }
            }
            if (fs3.existsSync(lockPath)) {
              const stat = fs3.statSync(lockPath);
              if (Date.now() - stat.mtimeMs > 5e3) {
                fs3.unlinkSync(lockPath);
                continue;
              }
            }
          } catch {
          }
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
  async getCurrentUser() {
    let name = "";
    let email = "";
    try {
      name = (await this.exec(["config", "user.name"])).trim();
    } catch {
    }
    try {
      email = (await this.exec(["config", "user.email"])).trim();
    } catch {
    }
    return { name, email };
  }
  // --- Log & Commit Operations ---
  async getLog(options = {}) {
    return getLog(this.asCommitContext(), options);
  }
  async getCommitFiles(hash) {
    return getCommitFiles(this.asCommitContext(), hash);
  }
  async getAuthorRecentCommitMessages(count = 10) {
    return getAuthorRecentCommitMessages(this.asCommitContext(), count);
  }
  async getRecentCommitMessages(count = 10) {
    try {
      const out = await this.exec(["log", `-n${count}`, "--pretty=%s"]);
      return out.split("\n").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  async commitFiles(message, filesToStage, amend = false) {
    return commitFiles(this.asCommitContext(), message, filesToStage, amend);
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
  // --- Branch & Remote Operations ---
  async getBranches() {
    const localAndRemote = await getBranches(this.asBranchContext());
    const existingNames = new Set(localAndRemote.map((b) => b.name));
    const merged = [...localAndRemote];
    for (const [_, branches] of this.discoveredRemoteBranches) {
      for (const b of branches) {
        if (!existingNames.has(b.name)) {
          existingNames.add(b.name);
          merged.push(b);
        }
      }
    }
    return merged;
  }
  async refreshRemoteBranchNames() {
    const remotes = await this.getRemotes();
    if (!remotes || remotes.length === 0)
      return [];
    const results = [];
    await Promise.allSettled(
      remotes.map(async (r) => {
        try {
          const check = await this.isRemoteReachable(r, 2500);
          if (!check.reachable)
            return;
          const out = await this.exec(["ls-remote", "--heads", r], 2 * 1024 * 1024, 1, 1e4);
          const list = [];
          for (const line of out.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed)
              continue;
            const [hash, ref] = trimmed.split(/\s+/);
            if (!ref || !ref.startsWith("refs/heads/"))
              continue;
            const branchName = ref.replace(/^refs\/heads\//, "");
            list.push({
              name: `${r}/${branchName}`,
              current: false,
              remote: r,
              hash: hash || ""
            });
          }
          this.discoveredRemoteBranches.set(r, list);
          results.push({ remote: r, count: list.length });
        } catch {
        }
      })
    );
    return results;
  }
  async fetchSingleBranch(remote, branchName) {
    return this.exec([
      "fetch",
      remote,
      `refs/heads/${branchName}:refs/remotes/${remote}/${branchName}`
    ], 100 * 1024 * 1024, 1, 3e5);
  }
  async getTags() {
    return getTags(this.asBranchContext());
  }
  async getCurrentBranch() {
    return getCurrentBranch(this.asBranchContext());
  }
  async checkout(ref) {
    return checkout(this.asBranchContext(), ref);
  }
  async createBranch(name, startPoint, checkout2 = true, force = false) {
    return createBranch(this.asBranchContext(), name, startPoint, checkout2, force);
  }
  async deleteBranch(name, force = false) {
    await this.exec(["branch", force ? "-D" : "-d", name]);
  }
  async renameBranch(oldName, newName) {
    await this.exec(["branch", "-m", oldName, newName]);
  }
  async getRemotes() {
    return getRemotes(this.asBranchContext());
  }
  async getDefaultRemote(branch) {
    return getDefaultRemote(this.asBranchContext(), branch);
  }
  async getRemoteUrl(remoteName) {
    if (remoteName) {
      try {
        const url = await this.exec(["remote", "get-url", remoteName]);
        return url.trim();
      } catch {
        return "";
      }
    }
    return getRemoteUrl(this.asBranchContext());
  }
  async pull(branch) {
    return pull(this.asBranchContext(), branch);
  }
  async getPushInfo(targetBranch) {
    return getPushInfo(this.asBranchContext(), targetBranch);
  }
  async push(branch, force = false, setUpstream = false, remoteName, tags = false, targetBranch) {
    return push(this.asBranchContext(), branch, force, setUpstream, remoteName, tags, targetBranch);
  }
  async isRemoteReachable(remoteName, timeoutMs = 3500) {
    const start = Date.now();
    try {
      const remoteUrl = await this.getRemoteUrl(remoteName);
      if (!remoteUrl)
        return { reachable: false, latency: 999999 };
      if (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://")) {
        try {
          const parsed = new URL(remoteUrl);
          const targetOrigin = `${parsed.protocol}//${parsed.host}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            await fetch(targetOrigin, { method: "HEAD", signal: controller.signal });
            clearTimeout(timer);
            return { reachable: true, latency: Date.now() - start };
          } catch {
            clearTimeout(timer);
            try {
              const c2 = new AbortController();
              const t2 = setTimeout(() => c2.abort(), 1500);
              await fetch(targetOrigin, { method: "GET", signal: c2.signal });
              clearTimeout(t2);
              return { reachable: true, latency: Date.now() - start };
            } catch {
              return { reachable: false, latency: 999999 };
            }
          }
        } catch {
          return { reachable: false, latency: 999999 };
        }
      }
      await execFileAsync("git", [
        "-c",
        "http.timeout=3",
        "-c",
        "ssh.connectTimeout=3",
        "ls-remote",
        "--heads",
        remoteName,
        "HEAD"
      ], {
        cwd: this.cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        timeout: timeoutMs
      });
      return { reachable: true, latency: Date.now() - start };
    } catch {
      return { reachable: false, latency: 999999 };
    }
  }
  async smartFetchAll(onRemoteSuccess, onProgress) {
    const remotes = await this.getRemotes();
    if (!remotes || remotes.length === 0) {
      return { successful: [], failed: [], skipped: [], needsAuth: [] };
    }
    const needsAuth = [];
    const isAuthError = (msg) => /terminal prompts disabled|could not read Username|Authentication failed|HTTP 401|Access denied|not authorized/i.test(msg);
    if (remotes.length === 1) {
      const r = remotes[0];
      try {
        onProgress?.(`Fetching '${r}'...`);
        await this.exec(["fetch", r, "--prune"], 10 * 1024 * 1024, 1, 9e4);
        onRemoteSuccess?.(r);
        return { successful: [r], failed: [], skipped: [], needsAuth: [] };
      } catch (err) {
        const msg = err?.message || "";
        if (isAuthError(msg)) {
          const url = await this.getRemoteUrl(r);
          let host = r;
          try {
            if (url)
              host = new URL(url).host;
          } catch {
          }
          needsAuth.push({ remote: r, url, host });
        }
        return { successful: [], failed: [r], skipped: [], needsAuth };
      }
    }
    onProgress?.("Checking remotes connectivity...");
    const checks = await Promise.allSettled(
      remotes.map(async (r) => {
        const res = await this.isRemoteReachable(r, 2500);
        return { remote: r, reachable: res.reachable, latency: res.latency };
      })
    );
    const probeResults = [];
    for (let i = 0; i < remotes.length; i++) {
      const c = checks[i];
      if (c.status === "fulfilled") {
        probeResults.push(c.value);
      } else {
        probeResults.push({ remote: remotes[i], reachable: false, latency: 999999 });
      }
    }
    probeResults.sort((a, b) => {
      if (a.reachable && !b.reachable)
        return -1;
      if (!a.reachable && b.reachable)
        return 1;
      return a.latency - b.latency;
    });
    const successful = [];
    const failed = [];
    const skipped = [];
    for (const item of probeResults) {
      if (!item.reachable) {
        skipped.push(item.remote);
        continue;
      }
      try {
        onProgress?.(`Fetching '${item.remote}'...`);
        await this.exec(["fetch", item.remote, "--prune"], 10 * 1024 * 1024, 1, 9e4);
        successful.push(item.remote);
        onRemoteSuccess?.(item.remote);
      } catch (err) {
        const msg = err?.message || "";
        if (isAuthError(msg)) {
          const url = await this.getRemoteUrl(item.remote);
          let host = item.remote;
          try {
            if (url)
              host = new URL(url).host;
          } catch {
          }
          needsAuth.push({ remote: item.remote, url, host });
        }
        failed.push(item.remote);
      }
    }
    return { successful, failed, skipped, needsAuth };
  }
  async fetchAll(onRemoteSuccess) {
    return this.smartFetchAll(onRemoteSuccess);
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
    if (hash)
      args.push(hash);
    await this.exec(args);
  }
  async createPatch(hash) {
    return this.exec(["format-patch", "-1", hash, "--stdout"]);
  }
  // --- Staging & Worktree Operations ---
  async getStatus() {
    return getStatus(this.asStagingContext());
  }
  async stageFile(filePath) {
    await this.stageFiles([filePath]);
  }
  async stageFiles(paths) {
    return stageFiles(this.asStagingContext(), paths);
  }
  async stageFileContent(filePath, content) {
    return stageFileContent(this.asStagingContext(), filePath, content);
  }
  async unstageFile(filePath) {
    await this.unstageFiles([filePath]);
  }
  async unstageFiles(paths) {
    return unstageFiles(this.asStagingContext(), paths);
  }
  async rollbackFiles(paths) {
    return rollbackFiles(this.asStagingContext(), paths);
  }
  async getFileDiff(filePath) {
    return getFileDiff(this.asStagingContext(), filePath);
  }
  async applyHunkPatch(patchContent, reverse = false) {
    return applyHunkPatch(this.asStagingContext(), patchContent, reverse);
  }
  async getStagedDiff() {
    try {
      return await this.exec(["diff", "--cached"]);
    } catch {
      return "";
    }
  }
  async setAssumeUnchanged(paths, assume) {
    if (!paths || paths.length === 0)
      return;
    const flag = assume ? "--assume-unchanged" : "--no-assume-unchanged";
    try {
      await this.exec(["update-index", flag, "--", ...paths]);
    } catch {
    }
  }
  async unmaskAllAssumeUnchanged() {
    try {
      const out = await this.exec(["ls-files", "-v"]);
      const masked = [];
      for (const line of out.split("\n")) {
        if (/^[a-z]\s+/.test(line)) {
          const p = line.replace(/^[a-z]\s+/, "").trim();
          if (p)
            masked.push(p);
        }
      }
      if (masked.length > 0) {
        await this.exec(["update-index", "--no-assume-unchanged", "--", ...masked]);
      }
    } catch {
    }
  }
  // --- Conflict Operations ---
  async getUnmergedFiles() {
    return getUnmergedFiles(this.asConflictContext());
  }
  async getConflictInfo() {
    return getConflictInfo(this.asConflictContext());
  }
  async acceptYours(filePath) {
    return acceptYours(this.asConflictContext(), filePath);
  }
  async acceptTheirs(filePath) {
    return acceptTheirs(this.asConflictContext(), filePath);
  }
  async abortMerge() {
    return abortMerge(this.asConflictContext());
  }
  async getMergeMessage() {
    return getMergeMessage(this.cwd);
  }
  // --- Stash Operations ---
  async getStashes() {
    return getStashes(this.asCommitContext());
  }
  async stashSave(message) {
    const args = ["stash", "push"];
    if (message)
      args.push("-m", message);
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
  clearCache() {
    this.commitCache.clear();
  }
  // --- Private Execution Contexts ---
  asBranchContext() {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getCurrentBranch: () => this.getCurrentBranch(),
      getRepoRoot: () => this.getRepoRoot(),
      getRemotes: () => this.getRemotes(),
      getDefaultRemote: (b) => this.getDefaultRemote(b)
    };
  }
  asStagingContext() {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getStatus: () => this.getStatus()
    };
  }
  asCommitContext() {
    return {
      cwd: this.cwd,
      commitCache: this.commitCache,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      stageFiles: (paths) => this.stageFiles(paths),
      push: () => this.push()
    };
  }
  asConflictContext() {
    return {
      cwd: this.cwd,
      exec: (args, mb, retries) => this.exec(args, mb, retries),
      getStatus: () => this.getStatus(),
      getCurrentBranch: () => this.getCurrentBranch(),
      stageFiles: (paths) => this.stageFiles(paths),
      getMergeMessage: () => this.getMergeMessage()
    };
  }
};

// src/git/rebaseHandler.ts
var import_child_process3 = require("child_process");
var import_util2 = require("util");
var fs4 = __toESM(require("fs"));
var path5 = __toESM(require("path"));
var os = __toESM(require("os"));
var execFileAsync2 = (0, import_util2.promisify)(import_child_process3.execFile);
var writeFileAsync = (0, import_util2.promisify)(fs4.writeFile);
var mkdtempAsync = (0, import_util2.promisify)(fs4.mkdtemp);
var unlinkAsync = (0, import_util2.promisify)(fs4.unlink);
var rmdirAsync = (0, import_util2.promisify)(fs4.rmdir);
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
    const tmpDir = await mkdtempAsync(path5.join(os.tmpdir(), "ijgit-rebase-"));
    const todoPath = path5.join(tmpDir, "todo");
    const scriptPath = path5.join(tmpDir, "editor.sh");
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
      const rebaseMergePath = path5.join(this.cwd, ".git", "rebase-merge");
      const rebaseApplyPath = path5.join(this.cwd, ".git", "rebase-apply");
      return fs4.existsSync(rebaseMergePath) || fs4.existsSync(rebaseApplyPath);
    } catch {
      return false;
    }
  }
};

// src/views/graphPanel.ts
var vscode9 = __toESM(require("vscode"));

// src/git/graphBuilder.ts
function buildGraph(commits) {
  if (commits.length === 0)
    return [];
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
        if (!colorMap.has(p0))
          colorMap.set(p0, color);
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
          if (!colorMap.has(p))
            colorMap.set(p, nextColor++);
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
  static {
    this.scheme = "intellij-git";
  }
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

// src/views/pushDialogPanel.ts
var vscode4 = __toESM(require("vscode"));

// src/views/commitReviewPanel.ts
var vscode3 = __toESM(require("vscode"));
var path7 = __toESM(require("path"));
var fs6 = __toESM(require("fs"));

// src/utils/themeTokens.ts
var vscode2 = __toESM(require("vscode"));
var path6 = __toESM(require("path"));
var fs5 = __toESM(require("fs"));
var defaultThemeTokens = {
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
function getThemeTokens() {
  try {
    const activeThemeName = vscode2.workspace.getConfiguration("workbench").get("colorTheme");
    if (!activeThemeName)
      return defaultThemeTokens;
    for (const ext of vscode2.extensions.all) {
      const themes = ext.packageJSON?.contributes?.themes;
      if (!Array.isArray(themes))
        continue;
      const matched = themes.find((t) => t.label === activeThemeName || t.id === activeThemeName);
      if (!matched || !matched.path)
        continue;
      const themePath = path6.join(ext.extensionPath, matched.path);
      if (!fs5.existsSync(themePath))
        continue;
      let content = fs5.readFileSync(themePath, "utf8");
      content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
      const themeJson = JSON.parse(content);
      const tc = themeJson.tokenColors || [];
      const findColor = (targetScopes) => {
        for (const target of targetScopes) {
          for (const rule of tc) {
            if (!rule.settings || !rule.settings.foreground)
              continue;
            const scopes = Array.isArray(rule.scope) ? rule.scope : typeof rule.scope === "string" ? rule.scope.split(",").map((s) => s.trim()) : [];
            if (scopes.includes(target))
              return rule.settings.foreground;
          }
        }
        for (const target of targetScopes) {
          for (const rule of tc) {
            if (!rule.settings || !rule.settings.foreground)
              continue;
            const scopes = Array.isArray(rule.scope) ? rule.scope : typeof rule.scope === "string" ? rule.scope.split(",").map((s) => s.trim()) : [];
            for (const s of scopes) {
              if (!s.includes(" ") && s.startsWith(target + "."))
                return rule.settings.foreground;
            }
          }
        }
        return null;
      };
      const kwd = findColor(["keyword"]) || defaultThemeTokens.kwd;
      const type = findColor(["entity.name.type", "support.type", "storage.type"]) || defaultThemeTokens.type;
      const fn = findColor(["entity.name.function", "support.function"]) || defaultThemeTokens.fn;
      const str = findColor(["string"]) || defaultThemeTokens.str;
      const num = findColor(["constant.numeric"]) || defaultThemeTokens.num;
      const constVal = findColor(["constant.language"]) || defaultThemeTokens.constVal;
      const comment = findColor(["comment"]) || defaultThemeTokens.comment;
      const varVal = findColor(["variable"]) || defaultThemeTokens.varVal;
      const anno = findColor(["punctuation.definition.annotation", "meta.annotation"]) || type;
      const punct = findColor(["punctuation"]) || defaultThemeTokens.punct;
      return { kwd, type, fn, str, num, constVal, varVal, comment, anno, punct };
    }
  } catch {
  }
  return defaultThemeTokens;
}
function getNonce() {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// src/views/commitReviewPanel.ts
var CommitReviewPanel = class _CommitReviewPanel {
  constructor(panel, extensionUri, gitService, onStageChange, readOnly = false, revisions) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.onStageChange = onStageChange;
    this.disposables = [];
    this.currentFilePath = "";
    this.filesList = [];
    this.isReadOnly = false;
    this.panel = panel;
    this.isReadOnly = readOnly;
    this.revisions = revisions;
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
  static {
    this.viewType = "intellij-git.commitReview";
  }
  static createOrShow(extensionUri, gitService, filePath, filesList = [], onStageChange, readOnly = false, revisions) {
    const fileName = path7.basename(filePath);
    if (_CommitReviewPanel.currentPanel) {
      if (onStageChange) {
        _CommitReviewPanel.currentPanel.onStageChange = onStageChange;
      }
      _CommitReviewPanel.currentPanel.isReadOnly = readOnly;
      _CommitReviewPanel.currentPanel.revisions = revisions;
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
      readOnly,
      revisions
    );
    _CommitReviewPanel.currentPanel.loadFile(filePath, filesList, readOnly);
    return _CommitReviewPanel.currentPanel;
  }
  focusAndJumpDiff(direction = 1, fromFileList = false) {
    this.panel.reveal(vscode3.ViewColumn.Active, false);
    this.panel.webview.postMessage({
      type: "jumpDiff",
      payload: { direction, fromFileList }
    });
  }
  async loadFile(filePath, filesList, readOnly, focusTarget) {
    this.currentFilePath = filePath;
    if (filesList)
      this.filesList = filesList;
    if (readOnly !== void 0)
      this.isReadOnly = readOnly;
    const fileName = path7.basename(filePath);
    this.panel.title = `Diff: ${fileName}`;
    if (_CommitReviewPanel.onFileNavigateListener) {
      _CommitReviewPanel.onFileNavigateListener(filePath);
    }
    try {
      let diff = "";
      let baseContent = "";
      let currentContent = "";
      let stagedDiff = "";
      if (this.revisions?.baseRef) {
        const baseRef = this.revisions.baseRef;
        const targetRef = this.revisions.targetRef || "HEAD";
        [diff, baseContent, currentContent] = await Promise.all([
          this.gitService.exec(["diff", `${baseRef}..${targetRef}`, "--", filePath]).catch(() => ""),
          this.gitService.exec(["show", `${baseRef}:${filePath}`]).catch(() => ""),
          this.gitService.exec(["show", `${targetRef}:${filePath}`]).catch(() => "")
        ]);
      } else {
        const fullPath = path7.join(this.gitService.getCwd(), filePath);
        [diff, baseContent, currentContent, stagedDiff] = await Promise.all([
          this.gitService.getFileDiff(filePath).catch(() => ""),
          this.gitService.exec(["show", `HEAD:${filePath}`]).catch(() => ""),
          (async () => {
            try {
              if (fs6.existsSync(fullPath)) {
                return fs6.readFileSync(fullPath, "utf8");
              }
            } catch {
            }
            return "";
          })(),
          this.gitService.exec(["diff", "--cached", "--", filePath]).catch(() => "")
        ]);
      }
      const isSameFile = this.lastLoadedState && this.lastLoadedState.filePath === filePath;
      const isUnchanged = isSameFile && this.lastLoadedState.diff === diff && this.lastLoadedState.stagedDiff === stagedDiff && this.lastLoadedState.baseContent === baseContent && this.lastLoadedState.currentContent === currentContent && this.lastLoadedState.readOnly === this.isReadOnly && !focusTarget;
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
          fileDir: path7.dirname(filePath) === "." ? "" : path7.dirname(filePath),
          diff,
          stagedDiff,
          baseContent,
          currentContent,
          baseTitle: this.revisions?.baseTitle,
          targetTitle: this.revisions?.targetTitle,
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
          if (this.onStageChange)
            this.onStageChange();
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
          const fullPath = path7.join(this.gitService.getCwd(), filePath);
          fs6.writeFileSync(fullPath, newContent, "utf8");
          if (this.onStageChange)
            this.onStageChange();
          await this.loadFile(this.currentFilePath, this.filesList, this.isReadOnly);
        } catch (err) {
          vscode3.window.showErrorMessage(`Revert failed: ${err.message}`);
        }
        break;
      }
      case "saveFileContent": {
        const { filePath, content, focusLine, focusOffset } = msg.payload;
        try {
          const fullPath = path7.join(this.gitService.getCwd(), filePath);
          fs6.writeFileSync(fullPath, content, "utf8");
          if (this.onStageChange)
            this.onStageChange();
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
          if (this.onStageChange)
            this.onStageChange();
          this.loadFile(this.currentFilePath, this.filesList);
        } catch (err) {
          vscode3.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case "openFile": {
        const filePath = msg.payload;
        if (filePath) {
          const fullPath = path7.join(this.gitService.getCwd(), filePath);
          vscode3.commands.executeCommand("vscode.open", vscode3.Uri.file(fullPath));
        }
        break;
      }
      case "rollbackHunk": {
        const { patch } = msg.payload;
        try {
          await this.gitService.applyHunkPatch(patch, true);
          if (this.onStageChange)
            this.onStageChange();
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
    const tokens = getThemeTokens();
    this.panel.webview.postMessage({
      type: "themeTokens",
      payload: tokens
    });
  }
  getHtml() {
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode3.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "review.js")
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode3.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.css")
    );
    const nonce = getNonce();
    const tokens = getThemeTokens();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}'; img-src 'self' data: https:;">
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
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  dispose() {
    _CommitReviewPanel.currentPanel = void 0;
    for (const d of this.disposables)
      d.dispose();
  }
};

// src/views/dialogs/pushDialogStyles.ts
var pushDialogStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #dfe1e5);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      user-select: none;
    }
    .as-push-card {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .as-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .as-col-left {
      width: 45%;
      min-width: 180px;
      max-width: calc(100% - 180px);
      border-right: 1px solid var(--vscode-panel-border, #323438);
      display: flex;
      flex-direction: column;
      background: var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1f22));
      overflow: hidden;
      position: relative;
    }
    .as-splitter {
      width: 6px;
      margin-left: -3px;
      margin-right: -3px;
      cursor: col-resize;
      background: transparent;
      position: relative;
      z-index: 50;
      flex-shrink: 0;
      transition: background-color 0.12s ease;
    }
    .as-splitter:hover,
    .as-splitter.dragging {
      background: var(--vscode-focusBorder, #3574f0);
    }
    .as-col-right {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
      overflow: hidden;
      position: relative;
      z-index: 10;
    }
    .as-branch-header {
      display: flex;
      align-items: center;
      padding: 7px 12px;
      background: var(--vscode-button-background, #2675bf);
      color: var(--vscode-button-foreground, #ffffff);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      gap: 4px;
      overflow: visible;
      position: relative;
      z-index: 5;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .as-commit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 26px;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
    }
    .as-commit-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-commit-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px 4px 24px;
      font-size: 12.5px;
      color: var(--vscode-editor-foreground, #dfe1e5);
      cursor: pointer;
      border-radius: 3px;
    }
    .as-file-item:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-file-item.selected {
      background: var(--vscode-list-activeSelectionBackground, #2e436e) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
      border-top: 1px solid var(--vscode-panel-border, #323438);
      height: 48px;
      flex-shrink: 0;
    }
    .as-btn {
      background: var(--vscode-button-secondaryBackground, #2b2d30);
      color: var(--vscode-button-secondaryForeground, #dfe1e5);
      border: 1px solid var(--vscode-button-border, #4e5157);
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 12.5px;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .as-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #35373b);
    }
    .as-btn-primary {
      background: var(--vscode-button-background, #3574f0);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      padding: 6px 18px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .as-btn-primary:hover {
      background: var(--vscode-button-hoverBackground, #3068d8);
    }
    .as-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .as-dropdown {
      position: absolute;
      background: var(--vscode-menu-background, #2b2d30);
      border: 1px solid var(--vscode-menu-border, #43454a);
      border-radius: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      z-index: 999;
      min-width: 140px;
      padding: 4px 0;
    }
    .as-dropdown-item {
      padding: 6px 12px;
      font-size: 12px;
      color: var(--vscode-menu-foreground, #dfe1e5);
      cursor: pointer;
    }
    .as-dropdown-item:hover {
      background: var(--vscode-menu-selectionBackground, #3574f0);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border: 1px solid var(--vscode-checkbox-border, #6C707E);
      border-radius: 2.5px;
      background: transparent !important;
      background-color: transparent !important;
      cursor: pointer;
      position: relative;
      outline: none;
      margin: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      box-sizing: border-box;
      transition: border-color 0.12s ease, background-color 0.12s ease;
    }
    input[type="checkbox"]:hover {
      border-color: var(--vscode-focusBorder, #CED0D6);
      background-color: rgba(255, 255, 255, 0.06) !important;
    }
    input[type="checkbox"]:checked {
      background: transparent !important;
      background-color: transparent !important;
      border-color: var(--vscode-focusBorder, #CED0D6);
    }
    input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 4px;
      width: 3.5px;
      height: 7px;
      border: solid var(--vscode-editor-foreground, #CED0D6);
      border-width: 0 1.8px 1.8px 0;
      transform: rotate(45deg);
    }
`;

// src/views/dialogs/fileIconScript.ts
var getFileIconScript = `
    function getFileIcon(filename) {
      if (!filename) return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="#2B2D30" stroke="#7F848E"/><path d="M7.325 9.03c0-.227.039-.425.115-.595.08-.173.175-.32.285-.44.114-.123.26-.263.44-.42.16-.14.285-.257.375-.35.094-.097.17-.208.23-.335.064-.127.095-.268.095-.425 0-.25-.076-.453-.23-.61-.153-.16-.356-.24-.61-.24-.28 0-.505.09-.675.27-.166.18-.248.415-.245.705H5.725c0-.46.094-.855.28-1.185.187-.333.454-.587.8-.76.35-.177.762-.265 1.235-.265.457 0 .854.082 1.19.245.337.163.596.395.776.695.18.297.268.647.265 1.05 0 .303-.048.565-.145.785-.097.22-.212.4-.345.54-.134.14-.309.298-.525.475-.15.12-.269.22-.355.3a.96.96 0 00-.21.275c-.054.1-.08.212-.08.335v.175H7.325V9.03zm1.415 2.47H7.24V10h1.5v1.5z" fill="#7F848E"/></svg>';
      const base = filename.toLowerCase();
      const ext = base.split('.').pop();
      if (ext === 'dart') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.379 10.272L3.373 3.374L1.191 7.926c-.255.542-.363 1.206.382 1.95l2.138 2.138c-.379-.379-.327-.997-.332-1.742zM12.526 4.223l-.511-.512c-.379-.379-.997-.327-1.743-.332L3.373 3.374 12 12h3l.001-5.303-2.475-2.474z" fill="#01579B"/><path d="M3.374 3.373l6.897.006c.088.001.173 0 .257 0 .631-.001 1.152-.003 1.487.332l-2.138-2.138C9.133.829 8.469.936 7.925 1.191L3.374 3.373z" fill="#29B6F6"/><path d="M12 12L3.374 3.373l.006 6.898c.001.088 0 .173 0 .257-.001.631-.003 1.152.332 1.486l.51.512 2.474 2.474H12V12z" fill="#29B6F6"/></svg>';
      }
      if (ext === 'kt' || ext === 'kts') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.334 12.631c.336.309.118.869-.338.869H3c-.276 0-.5-.224-.5-.5V3c0-.276.224-.5.5-.5h9.996c.456 0 .674.56.338.869L8.683 7.631a.508.508 0 000 .738l4.651 4.262z" fill="#2F2936"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3c0-.552.448-1 1-1h9.996c.912 0 1.348 1.121.676 1.737L9.021 8l4.651 4.263c.672.616.236 1.737-.676 1.737H3c-.552 0-1-.448-1-1V3zm10.996 0L3 3v10h9.996L8.345 8.737a1.008 1.008 0 010-1.474L12.996 3z" fill="#A571E6"/></svg>';
      }
      if (ext === 'gradle') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14.894 3.545c-.362-.756-1.556-1.65-2.893-.481m2.893.481c.463.881-.331 2.525-1.931 2.525-2.086 0-4.275-3.457-9.039-1.108-.421.207-.608.701-.464 1.148l.116.36m11.318-2.925s1.335 2.815-2.33 5.557c-1.033.773-1.411 2.292-1.45 3.644a.1.1 0 01-.1.098H9.873a.1.1 0 01-.1-.07c-.172-.64-.756-1.092-1.435-1.092-.678 0-1.26.456-1.434 1.094a.1.1 0 01-.1.068H5.512a.1.1 0 01-.1-.068c-.174-.638-.756-1.094-1.434-1.094-.678 0-1.26.456-1.434 1.095a.1.1 0 01-.1.068H1.036a.07.07 0 01-.07-.09c-.294-2.844.53-4.951 2.639-6.287m0 0l.581 1.911c.216.635 1.084.74 1.614.443.658-.356 1.264-.777 1.821-1.279" stroke="#CED0D6" stroke-linecap="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.259 7.32a.18.18 0 01-.115-.28c.1-.286.356-.497.668-.53a.81.81 0 01.844.542.8.8 0 01-.206.828.18.18 0 01-.302.012l-.889-.572z" fill="#CED0D6"/></svg>';
      }
      if (ext === 'json') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.988 9.778c.01-.385-.118-.693-.383-.923s-.622-.345-1.072-.345H2V7.43h.533c.45 0 .807-.115 1.072-.345s.393-.538.383-.923L3.958 4.58c-.01-.52.097-.975.322-1.365.23-.39.558-.69.983-.9s.925-.315 1.5-.315H7.5v1.005h-.73c-.52 0-.932.145-1.237.435-.3.285-.448.672-.443 1.162l.03 1.568c.01.51-.128.927-.413 1.252-.285.32-.67.498-1.155.533.485.09.87.3 1.155.63.285.325.423.72.413 1.185l-.03 1.778c-.01.44.123.79.398 1.05.28.265.657.397 1.132.397H7.5V14h-.888c-.535 0-1.005-.1-1.41-.305-.4-.195-.71-.478-.93-.848-.215-.365-.32-.792-.315-1.282l.03-1.792zM12.015 9.778c-.01-.385.118-.693.382-.923s.623-.345 1.073-.345H14V7.43h-.533c-.45 0-.808-.115-1.073-.345s-.392-.538-.382-.923l.03-1.582c.01-.52-.1-.975-.33-1.365-.225-.39-.55-.69-.975-.9s-.925-.315-1.5-.315H8.5v1.005h.732c.52 0 .93.145 1.23.435.305.285.455.672.45 1.162l-.03 1.568c-.01.51.127.927.412 1.252.285.32.67.498 1.155.533-.485.09-.87.3-1.155.63-.285.325-.422.72-.412 1.185l.03 1.778c.01.44-.125.79-.405 1.05-.275.265-.65.397-1.125.397H8.5V14h.89c.535 0 1.002-.1 1.402-.305.405-.195.715-.478.93-.848.22-.365.327-.792.322-1.282l-.03-1.792z" fill="#B589EC"/></svg>';
      }
      if (ext === 'yaml' || ext === 'yml') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 2c.552 0 1 .448 1 1v6h-1c-.552 0-1 .448-1 1v4H5c-.552 0-1-.448-1-1V6h2c1.105 0 2-.895 2-2V2h3z" fill="#402929"/><path d="M7 4c0 .069-.007.136-.02.201-.094.456-.497.8-.98.8H4.414L7 2.414V4z" fill="#402929"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11 1c1.105 0 2 .895 2 2v6h-1V3c0-.552-.448-1-1-1H8v2c0 1.105-.895 2-2 2H4v7c0 .552.448 1 1 1h5v1H5c-1.105 0-2-.895-2-2V5.414c0-.265.105-.519.293-.707L6.707 1.293C6.895 1.105 7.149 1 7.414 1H11zM4.414 5H6c.552 0 1-.448 1-1V2.414L4.414 5z" fill="#DB5C5C"/><path d="M12.402 16v-2.173L10.647 10.014h1.074l.935 2.075c.071.164.131.325.18.484.05.158.083.281.1.369.021-.088.054-.211.098-.369.05-.159.11-.32.18-.484l.91-2.075h1.066l-1.755 3.813V16h-1.033z" fill="#CED0D6"/></svg>';
      }
      if (ext === 'xml') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.078 2.44a.82.82 0 00-.42-.738.818.818 0 00-.737.42L5.765 13.56a.82.82 0 00.419.738c.32.088.65-.1.738-.42L10.078 2.44zM5.413 4.667a.747.747 0 01-.094.843L1.96 8.197l3.359 2.687a.747.747 0 01-.75 1.297l-3.944-3.155-.586-.469.586-.468 3.944-3.156a.747.747 0 01.844.094zm5.174 7.06a.747.747 0 01.094-.843L14.04 8.197l-3.359-2.687a.747.747 0 01.75-1.297l3.944 3.155.586.469-.586.468-3.944 3.156a.747.747 0 01-.844-.094z" fill="#C77D55"/></svg>';
      }
      if (ext === 'sh' || ext === 'bash' || ext === 'zsh') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="#43454A" stroke="#CED0D6"/><path d="M4 6l2 2-2 2M7.5 10.5h4" stroke="#CED0D6" stroke-width="1.2"/></svg>';
      }
      if (base === '.gitignore' || ext === 'gitignore') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.707 1.305a1 1 0 00-1.414 0L6.38 2.217l.955.955c.502-.297 1.159-.23 1.59.201.432.432.499 1.089.202 1.591l1.909 1.909c.501-.297 1.159-.23 1.59.201a1.2 1.2 0 010 1.697 1.2 1.2 0 01-1.697 0 1.206 1.206 0 01-.202-1.59L8.664 5.427a1.14 1.14 0 01-.336.138v4.868c.219.057.426.17.597.342a1.2 1.2 0 010 1.697 1.2 1.2 0 01-1.697 0 1.2 1.2 0 010-1.697c.172-.172.379-.285.598-.342V5.565a1.14 1.14 0 01-.598-.342c-.43-.43-.498-1.087-.203-1.588L6.07 2.68 1.457 7.292a1 1 0 000 1.414l5.988 5.988a1 1 0 001.414 0l5.988-5.988a1 1 0 000-1.414L8.707 1.305z" fill="#F34E29"/></svg>';
      }
      if (ext === 'ts' || ext === 'tsx') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="#3178C6"/><path d="M7.75 5.25H5.53v6.61H3.91V5.25H1.7V4.07h6.05v1.18zm5 4.61c0-.15-.03-.28-.08-.39-.06-.11-.13-.22-.23-.33-.08-.07-.21-.15-.37-.23-.11-.04-.3-.12-.58-.23l-.17-.06c-.9-.26-1.61-.59-2.14-.98-.47-.4-.71-.9-.71-1.5 0-.65.28-1.17.85-1.56.51-.39 1.19-.57 2.04-.57s1.57.24 2.12.73c.51.46.77 1.02.77 1.68h-1.5c0-.19-.03-.36-.1-.5-.06-.14-.15-.28-.29-.42-.28-.21-.62-.31-1.04-.31-.42 0-.73.08-.96.25-.22.17-.33.4-.33.71 0 .25.13.47.39.66.11.08.28.17.5.25.17.07.43.16.79.27.84.25 1.49.57 1.93.96.44.37.66.9.66 1.58 0 .33-.07.64-.21.91-.12.26-.31.48-.56.64-.53.39-1.22.58-2.08.58s-1.51-.22-2.07-.66c-.65-.51-.95-1.14-.89-1.87h1.56c0 .44.15.79.46 1.04.12.1.29.17.5.23.21.06.43.08.66.08.47 0 .8-.08.98-.25.17-.26.25-.5.25-.71z" fill="#ffffff"/></svg>';
      }
      if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') {
        return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="#F7DF1E"/><path d="M5.03 4.12h1.75v4.91c0 1.06-.25 1.83-.74 2.31-.45.44-1.13.66-2.04.66-.21 0-.43-.01-.68-.04-.25-.04-.45-.1-.6-.16l.19-1.4c.26.12.56.19.91.19.38 0 .67-.1.87-.31.23-.25.35-.66.35-1.24V4.12zm3.3 5.94c.25.14.54.25.87.35.37.11.72.16 1.05.16.41 0 .72-.07.93-.21.21-.15.31-.36.31-.62 0-.26-.1-.47-.29-.62-.19-.16-.53-.33-1.01-.49-1.42-.49-2.12-1.26-2.12-2.31 0-.69.26-1.24.78-1.67.54-.44 1.26-.66 2.19-.66.73 0 1.4.13 2 .39l-.39 1.42-.12-.06c-.25-.1-.45-.16-.6-.21-.29-.08-.58-.12-.89-.12-.37 0-.66.08-.87.23-.19.14-.29.32-.29.56s.11.43.33.58c.16.12.52.3 1.07.52.69.26 1.19.58 1.51.95.33.37.49.82.49 1.36 0 .69-.26 1.24-.78 1.67-.56.48-1.35.72-2.37.72-.4 0-.82-.06-1.26-.16-.34-.07-.65-.16-.93-.29l.39-1.48z" fill="#000000"/></svg>';
      }
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="#2B2D30" stroke="#7F848E"/><path d="M7.325 9.03c0-.227.039-.425.115-.595.08-.173.175-.32.285-.44.114-.123.26-.263.44-.42.16-.14.285-.257.375-.35.094-.097.17-.208.23-.335.064-.127.095-.268.095-.425 0-.25-.076-.453-.23-.61-.153-.16-.356-.24-.61-.24-.28 0-.505.09-.675.27-.166.18-.248.415-.245.705H5.725c0-.46.094-.855.28-1.185.187-.333.454-.587.8-.76.35-.177.762-.265 1.235-.265.457 0 .854.082 1.19.245.337.163.596.395.776.695.18.297.268.647.265 1.05 0 .303-.048.565-.145.785-.097.22-.212.4-.345.54-.134.14-.309.298-.525.475-.15.12-.269.22-.355.3a.96.96 0 00-.21.275c-.054.1-.08.212-.08.335v.175H7.325V9.03zm1.415 2.47H7.24V10h1.5v1.5z" fill="#7F848E"/></svg>';
    }
`;

// src/views/dialogs/pushDialogScript.ts
function getPushDialogScript(rawPushInfo) {
  return `
    const vscode = acquireVsCodeApi();
    let pushInfo = ${rawPushInfo};

    let selectedCommitHash = 'ALL';
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = (pushInfo.remotes && pushInfo.remotes.length > 0) ? pushInfo.remotes : [currentRemote];

    const titleEl = document.getElementById('push-dialog-title');
    const branchHeader = document.getElementById('push-branch-header');
    const currentBranchEl = document.getElementById('push-current-branch');
    const remoteLabel = document.getElementById('push-remote-label');
    const remoteDropdown = document.getElementById('push-remote-dropdown');
    const branchDisplay = document.getElementById('push-target-branch-display');
    const branchInput = document.getElementById('push-target-branch-input');
    const newBadge = document.getElementById('push-new-badge');
    const commitsContainer = document.getElementById('push-commits-container');
    const filesContainer = document.getElementById('push-files-container');
    const filesCountEl = document.getElementById('push-files-count');
    const repoNameEl = document.getElementById('push-repo-name');
    const btnCancel = document.getElementById('btn-push-cancel');
    const btnSubmit = document.getElementById('btn-push-submit');
    const btnMenuTrigger = document.getElementById('btn-push-menu-trigger');
    const dropdownMenu = document.getElementById('push-dropdown-menu');
    const btnForcePush = document.getElementById('btn-force-push-opt');
    const chkTags = document.getElementById('chk-push-tags');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
      return escapeHtml(str);
    }

    function initUI() {
      if (titleEl) titleEl.textContent = 'Push Commits to ' + currentRemote;
      currentBranchEl.textContent = pushInfo.currentBranch;
      currentBranchEl.title = pushInfo.currentBranch;
      remoteLabel.textContent = currentRemote;
      branchDisplay.textContent = currentTargetBranch;
      branchDisplay.title = 'Click to edit remote branch name: ' + currentTargetBranch;
      branchInput.value = currentTargetBranch;
      repoNameEl.textContent = pushInfo.repoName;
      repoNameEl.title = pushInfo.repoName;
      newBadge.style.display = pushInfo.isNew ? 'inline-block' : 'none';

      // Setup remotes dropdown
      remoteDropdown.innerHTML = '';
      availableRemotes.forEach(r => {
        const item = document.createElement('div');
        item.className = 'as-dropdown-item';
        item.textContent = r;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          currentRemote = r;
          remoteLabel.textContent = r;
          if (titleEl) titleEl.textContent = 'Push Commits to ' + r;
          remoteDropdown.style.display = 'none';
        });
        remoteDropdown.appendChild(item);
      });

      renderCommits();
      renderFiles();
    }

    function renderCommits() {
      const commits = pushInfo.commits || [];
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px;text-align:center;color:#808080;font-size:12px;">No unpushed commits found.</div>';
        return;
      }
      let html = '';
      commits.forEach(c => {
        const isSel = selectedCommitHash === c.hash;
        html += '<div class="as-commit-item' + (isSel ? ' selected' : '') + '" data-hash="' + escapeAttr(c.hash) + '">';
        html += '<span style="font-family:monospace;font-size:11.5px;color:#a9b7c6;font-weight:600;">' + escapeHtml(c.shortHash) + '</span>';
        html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + escapeHtml(c.message) + '</span>';
        html += '</div>';
      });
      commitsContainer.innerHTML = html;

      commitsContainer.querySelectorAll('.as-commit-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedCommitHash = el.getAttribute('data-hash');
          branchHeader.style.background = 'var(--vscode-list-inactiveSelectionBackground, #203248)';
          renderCommits();
          renderFiles();
        });
      });
    }

    function renderFiles() {
      let currentFiles = [];
      const commits = pushInfo.commits || [];
      const totalFiles = pushInfo.totalFiles || [];
      if (selectedCommitHash === 'ALL') {
        currentFiles = totalFiles;
      } else {
        const c = commits.find(x => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }

      filesCountEl.textContent = currentFiles.length + ' file' + (currentFiles.length > 1 ? 's' : '');

      if (currentFiles.length === 0) {
        filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
        return;
      }

      const groups = new Map();
      currentFiles.forEach(f => {
        const d = f.dir || '';
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d).push(f);
      });

      let html = '';
      for (const [dir, fList] of groups.entries()) {
        html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">';
        html += '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>';
        html += '<span style="color:#dfe1e5;">' + escapeHtml(dir || 'root') + '</span>';
        html += '<span style="color:#808080;font-size:11px;">' + fList.length + ' file' + (fList.length > 1 ? 's' : '') + '</span>';
        html += '</div>';

        fList.forEach(file => {
          let statusBadge = '';
          if (file.status === 'M') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === 'A') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === 'D') {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html += '<div class="as-file-item" data-path="' + escapeAttr(file.path) + '">';
          html += statusBadge;
          html += getFileIcon(file.name);
          html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(file.name) + '</span>';
          html += '</div>';
        });
      }
      filesContainer.innerHTML = html;

      filesContainer.querySelectorAll('.as-file-item').forEach(el => {
        el.addEventListener('click', () => {
          filesContainer.querySelectorAll('.as-file-item.selected').forEach(item => item.classList.remove('selected'));
          el.classList.add('selected');
        });

        el.addEventListener('dblclick', () => {
          filesContainer.querySelectorAll('.as-file-item.selected').forEach(item => item.classList.remove('selected'));
          el.classList.add('selected');
          const filePath = el.getAttribute('data-path');
          if (filePath) {
            vscode.postMessage({
              type: 'openReviewInCenter',
              payload: {
                filePath,
                commitHash: selectedCommitHash,
                filesList: currentFiles.map(f => f.path),
              },
            });
          }
        });
      });
    }

    // Branch header click to reset to ALL
    branchHeader.addEventListener('click', (e) => {
      if (e.target.closest('#push-remote-label') || e.target.closest('#push-remote-dropdown') ||
          e.target.closest('#push-target-branch-display') || e.target.closest('#push-target-branch-input')) {
        return;
      }
      selectedCommitHash = 'ALL';
      branchHeader.style.background = 'var(--vscode-button-background, #2675bf)';
      renderCommits();
      renderFiles();
    });

    // Remote dropdown trigger
    remoteLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = remoteDropdown.style.display === 'none';
      remoteDropdown.style.display = isHidden ? 'block' : 'none';
      branchHeader.style.zIndex = isHidden ? '100' : '5';
    });

    // Target branch editing
    branchDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      branchDisplay.style.display = 'none';
      branchInput.style.display = 'inline-block';
      branchInput.focus();
      branchInput.select();
    });

    function commitBranchInput() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = val;
      }
      branchInput.style.display = 'none';
      branchDisplay.style.display = 'inline-block';
    }

    branchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitBranchInput();
      if (e.key === 'Escape') {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = 'none';
        branchDisplay.style.display = 'inline-block';
      }
    });
    branchInput.addEventListener('blur', commitBranchInput);

    function closeDialog() {
      vscode.postMessage({ type: 'close' });
    }

    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pushing...';
      vscode.postMessage({
        type: 'executePush',
        payload: {
          branch: pushInfo.currentBranch,
          targetBranch: currentTargetBranch,
          force: !!force,
          setUpstream: pushInfo.isNew || (currentTargetBranch !== pushInfo.currentBranch),
          remote: currentRemote,
          tags: chkTags.checked,
        },
      });
    }

    btnSubmit.addEventListener('click', () => doPush(false));
    btnCancel.addEventListener('click', closeDialog);

    btnMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    btnForcePush.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
      doPush(true);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#push-dropdown-menu') && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = 'none';
      }
      if (!e.target.closest('#push-remote-dropdown') && e.target !== remoteLabel) {
        remoteDropdown.style.display = 'none';
        branchHeader.style.zIndex = '5';
      }
    });

    // Keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to Push
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDialog();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') doPush(false);
    });

    // Listen to messages from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'pushFailed') {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Push';
      } else if (msg.type === 'updatePushInfo') {
        pushInfo = msg.payload;
        initUI();
      }
    });

    // Resizable splitter logic
    const splitter = document.getElementById('as-splitter');
    const leftCol = document.getElementById('as-col-left');
    const bodyContainer = document.getElementById('as-body-container');

    if (splitter && leftCol && bodyContainer) {
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;

      splitter.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = leftCol.getBoundingClientRect().width;
        splitter.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const totalWidth = bodyContainer.getBoundingClientRect().width;
        const deltaX = e.clientX - startX;
        let newWidth = startWidth + deltaX;
        const minW = 180;
        const maxW = totalWidth - minW;
        if (newWidth < minW) newWidth = minW;
        if (newWidth > maxW) newWidth = maxW;
        leftCol.style.width = newWidth + 'px';
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          splitter.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    initUI();
`;
}

// src/views/pushDialogHtml.ts
function getPushDialogHtml(rawPushInfo) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Commits</title>
  <style>
${pushDialogStyles}
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div class="as-push-card">
    <div class="as-body" id="as-body-container">
      <!-- Left Column: Commits -->
      <div class="as-col-left" id="as-col-left">
        <div id="push-branch-header" class="as-branch-header">
          <span id="push-current-branch" style="font-weight:600;white-space:nowrap;"></span>
          <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
          <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
            <span id="push-remote-label" title="Click to change remote" style="color:#ffffff;font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.7);padding:0 2px;">origin</span>
            <div id="push-remote-dropdown" class="as-dropdown" style="display:none;top:26px;left:0;"></div>
          </div>
          <span style="opacity:0.7;margin:0 2px;">:</span>
          <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:#d0e3ff;text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;"></span>
          <input id="push-target-branch-input" type="text" style="display:none;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #ffffff);border:1.5px solid var(--vscode-focusBorder, #3574f0);border-radius:3px;padding:2px 6px;font-size:12px;outline:none;width:150px;">
          <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;display:none;">New</span>
        </div>
        <div id="push-commits-container" style="flex:1;min-height:0;overflow-y:auto;padding:4px 0;"></div>
      </div>

      <!-- Splitter / Resizer -->
      <div class="as-splitter" id="as-splitter" title="Drag to resize"></div>

      <!-- Right Column: Files -->
      <div class="as-col-right" id="as-col-right">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #26282b));border-bottom:1px solid var(--vscode-panel-border, #323438);flex-shrink:0;position:relative;z-index:10;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--vscode-editor-foreground, #dfe1e5);">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span id="push-repo-name">Repository</span>
            <span id="push-files-count" style="color:var(--vscode-descriptionForeground, #808080);font-size:11.5px;font-weight:normal;"></span>
          </div>
        </div>
        <div id="push-files-container" style="flex:1;min-height:0;overflow-y:auto;padding:6px 8px;"></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="as-footer">
      <div style="display:flex;align-items:center;gap:12px;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground, #dfe1e5);cursor:pointer;">
          <input type="checkbox" id="chk-push-tags" style="width:14px;height:14px;cursor:pointer;">
          <span>Push tags:</span>
        </label>
        <select id="sel-push-tags" style="background:var(--vscode-dropdown-background, #1e1f22);color:var(--vscode-dropdown-foreground, #dfe1e5);border:1px solid var(--vscode-dropdown-border, #4e5157);border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
          <option value="all">All</option>
          <option value="current">Current branch</option>
        </select>
      </div>

      <div style="display:flex;align-items:center;gap:10px;position:relative;">
        <button id="btn-push-cancel" class="as-btn">Cancel</button>
        <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          <button id="btn-push-submit" class="as-btn-primary">Push</button>
          <button id="btn-push-menu-trigger" class="as-btn-primary" style="border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;" title="Push Options">\u25BC</button>
        </div>
        <div id="push-dropdown-menu" class="as-dropdown" style="display:none;bottom:36px;right:0;min-width:180px;">
          <div id="btn-force-push-opt" class="as-dropdown-item">Force Push (no-verify)...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
${getFileIconScript}
${getPushDialogScript(rawPushInfo)}
  </script>
</body>
</html>`;
}

// src/views/pushDialogPanel.ts
var PushDialogPanel = class _PushDialogPanel {
  constructor(panel, extensionUri, gitService, pushInfo) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.pushInfo = pushInfo;
    this.disposables = [];
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }
  static {
    this.viewType = "intellij-git.pushDialogWindow";
  }
  static async createOrShow(extensionUri, gitService, targetBranch) {
    try {
      const pushInfo = await gitService.getPushInfo(targetBranch);
      if (!pushInfo) {
        vscode4.window.showInformationMessage("No branch or commits found to push.");
        return void 0;
      }
      if (_PushDialogPanel.currentPanel) {
        _PushDialogPanel.currentPanel.panel.reveal();
        _PushDialogPanel.currentPanel.update(pushInfo);
        return _PushDialogPanel.currentPanel;
      }
      const panel = vscode4.window.createWebviewPanel(
        _PushDialogPanel.viewType,
        `Push Commits - ${pushInfo.currentBranch}`,
        vscode4.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode4.Uri.joinPath(extensionUri, "dist", "webview"),
            vscode4.Uri.joinPath(extensionUri, "resources")
          ]
        }
      );
      _PushDialogPanel.currentPanel = new _PushDialogPanel(
        panel,
        extensionUri,
        gitService,
        pushInfo
      );
      try {
        await vscode4.commands.executeCommand("workbench.action.moveEditorToNewWindow");
      } catch {
      }
      return _PushDialogPanel.currentPanel;
    } catch (err) {
      vscode4.window.showErrorMessage(`Failed to open Push dialog: ${err?.message || err}`);
      return void 0;
    }
  }
  update(pushInfo) {
    this.pushInfo = pushInfo;
    this.panel.title = `Push Commits - ${pushInfo.currentBranch}`;
    this.panel.webview.postMessage({
      type: "updatePushInfo",
      payload: pushInfo
    });
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "close": {
        this.dispose();
        break;
      }
      case "openReviewInCenter": {
        const { filePath, commitHash, filesList } = msg.payload || {};
        if (filePath) {
          let revisions = void 0;
          if (commitHash && commitHash !== "ALL") {
            revisions = {
              baseRef: `${commitHash}~1`,
              targetRef: commitHash,
              baseTitle: `Parent (${commitHash.slice(0, 7)}~1)`,
              targetTitle: `Commit (${commitHash.slice(0, 7)})`
            };
          } else {
            const commits = this.pushInfo.commits || [];
            if (commits.length > 0) {
              const oldestHash = commits[commits.length - 1].hash;
              revisions = {
                baseRef: `${oldestHash}~1`,
                targetRef: "HEAD",
                baseTitle: `${this.pushInfo.remote}/${this.pushInfo.remoteBranch || this.pushInfo.currentBranch}`,
                targetTitle: `${this.pushInfo.currentBranch} (HEAD)`
              };
            }
          }
          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            filesList || [],
            void 0,
            true,
            // readOnly
            revisions
          );
        }
        break;
      }
      case "executePush": {
        const payload = msg.payload || {};
        try {
          await this.gitService.push(
            payload.branch,
            payload.force,
            payload.setUpstream,
            payload.remote,
            payload.tags,
            payload.targetBranch
          );
          vscode4.window.showInformationMessage(
            `Pushed branch '${payload.branch}' to ${payload.remote}/${payload.targetBranch || payload.branch} successfully!`
          );
          this.dispose();
        } catch (err) {
          this.panel.webview.postMessage({
            type: "pushFailed",
            error: err?.message || String(err)
          });
          vscode4.window.showErrorMessage(`Push failed: ${err?.message || err}`);
        }
        break;
      }
    }
  }
  dispose() {
    _PushDialogPanel.currentPanel = void 0;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  getHtml() {
    const rawPushInfo = JSON.stringify(this.pushInfo);
    return getPushDialogHtml(rawPushInfo);
  }
};

// src/views/graphActions/branchActions.ts
var vscode6 = __toESM(require("vscode"));

// src/views/graphActions/conflictResolution.ts
var vscode5 = __toESM(require("vscode"));
async function withSmartStashOnConflict(gitService, actionLabel, targetRef, runAction, onSuccess) {
  try {
    await runAction();
    onSuccess();
  } catch (err) {
    const rawError = `${err?.message || ""}
${err?.stdout || ""}
${err?.stderr || ""}`.trim() || String(err);
    const conflictInfo = await gitService.getConflictInfo().catch(() => null);
    const hasActiveConflicts = Boolean(conflictInfo && conflictInfo.hasConflicts && conflictInfo.conflicts.length > 0);
    const isConflict = /Your local changes to the following files would be overwritten by (merge|checkout)/i.test(rawError) || /The following untracked working tree files would be overwritten by (merge|checkout)/i.test(rawError) || /cannot rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) || /cannot pull with rebase: (?:You have unstaged changes|Your index contains uncommitted changes)/i.test(rawError) || /error: (?:cannot rebase|cannot cherry-pick|cannot revert):/i.test(rawError) || /error: Your local changes to the following files would be overwritten/i.test(rawError) || /Please commit or stash them before you (?:merge|rebase|cherry-pick|revert)/i.test(rawError);
    const is3WayConflict = hasActiveConflicts || rawError.includes("CONFLICT") || rawError.includes("Automatic merge failed") || rawError.includes("fix conflicts") || rawError.includes("could not apply") || rawError.includes("could not revert") || rawError.includes("git rebase --continue");
    let pastAction = `${actionLabel.toLowerCase()} '${targetRef}'`;
    if (actionLabel === "Checkout") {
      pastAction = `switching to '${targetRef}'`;
    } else if (actionLabel === "Update") {
      pastAction = `updating '${targetRef}'`;
    } else if (actionLabel === "Merge") {
      pastAction = `merging '${targetRef}' into current branch`;
    } else if (actionLabel === "Rebase") {
      pastAction = `rebasing onto '${targetRef}'`;
    } else if (actionLabel === "Cherry-Pick") {
      pastAction = `cherry-picking commit '${(targetRef || "").slice(0, 8)}'`;
    } else if (actionLabel === "Revert") {
      pastAction = `reverting commit '${(targetRef || "").slice(0, 8)}'`;
    }
    if (!isConflict) {
      if (is3WayConflict && (actionLabel === "Merge" || actionLabel === "Rebase" || actionLabel === "Cherry-Pick" || actionLabel === "Revert")) {
        vscode5.commands.executeCommand("intellij-git.refreshCommit");
        await vscode5.commands.executeCommand("intellij-git.resolveConflicts");
        onSuccess();
        return;
      }
      const detailErr = (err?.stderr || err?.stdout || err?.message || rawError).trim();
      vscode5.window.showErrorMessage(`${actionLabel} failed: ${detailErr}`);
      return;
    }
    const isUntracked = /The following untracked working tree files would be overwritten/i.test(rawError);
    const filesMatch = rawError.match(/overwritten by (?:merge|checkout):([\s\S]*?)(?:Please commit|Aborting|$)/i);
    let filesText = "";
    if (filesMatch) {
      const list = filesMatch[1].split("\n").map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith("error:"));
      if (list.length > 0) {
        filesText = "\n\nConflicting files:\n" + list.map((f) => `\u2022 ${f}`).join("\n");
      }
    }
    const smartLabel = `Smart ${actionLabel}`;
    const stashLabel = `Stash & ${actionLabel}`;
    const message = `${actionLabel} Failed: Your local changes would be overwritten by ${pastAction}.${filesText}

IntelliJ Git can stash your changes, perform the ${actionLabel.toLowerCase()}, and optionally re-apply them.`;
    const choice = await vscode5.window.showWarningMessage(
      message,
      { modal: true },
      smartLabel,
      stashLabel
    );
    if (!choice)
      return;
    const stashPrefix = actionLabel.toLowerCase().replace(/[^a-z0-9]/g, "");
    const stashName = `autostash-${stashPrefix}-${(targetRef || "HEAD").replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}`;
    const stashArgs = isUntracked ? ["stash", "push", "-u", "-m", stashName] : ["stash", "push", "-m", stashName];
    let stashed = false;
    try {
      const stashOut = await gitService.exec(stashArgs);
      if (!stashOut.includes("No local changes to save")) {
        stashed = true;
      }
    } catch (stashErr) {
      vscode5.window.showErrorMessage(`Failed to stash changes: ${stashErr.message}`);
      return;
    }
    try {
      await runAction();
    } catch (actionErr) {
      const actMsg = `${actionErr?.message || ""}
${actionErr?.stdout || ""}
${actionErr?.stderr || ""}`.trim() || String(actionErr);
      const conflictInfoPost = await gitService.getConflictInfo().catch(() => null);
      const is3Way = Boolean(conflictInfoPost && conflictInfoPost.hasConflicts && conflictInfoPost.conflicts.length > 0) || actMsg.includes("CONFLICT") || actMsg.includes("Automatic merge failed") || actMsg.includes("fix conflicts") || actMsg.includes("could not apply") || actMsg.includes("could not revert") || actMsg.includes("git rebase --continue");
      if (stashed && is3Way) {
        vscode5.commands.executeCommand("intellij-git.refreshCommit");
        await vscode5.commands.executeCommand("intellij-git.resolveConflicts");
        vscode5.window.showWarningMessage(
          `${actionLabel} resulted in conflicts. Your local changes were safely saved to stash '${stashName}'. Resolve conflicts first, then apply your stash.`
        );
        onSuccess();
        return;
      }
      if (stashed) {
        try {
          await gitService.exec(["stash", "pop"]);
        } catch {
        }
      }
      const detailErr = (actionErr?.stderr || actionErr?.stdout || actionErr?.message || actMsg).trim();
      vscode5.window.showErrorMessage(`${actionLabel} failed: ${detailErr}`);
      return;
    }
    if (choice === smartLabel && stashed) {
      try {
        await gitService.exec(["stash", "pop"]);
        vscode5.window.showInformationMessage(`${smartLabel} completed: Restored your changes.`);
      } catch (popErr) {
        vscode5.commands.executeCommand("intellij-git.refreshCommit");
        await vscode5.commands.executeCommand("intellij-git.resolveConflicts");
        vscode5.window.showWarningMessage(
          `${actionLabel} succeeded, but applying stashed changes resulted in merge conflicts. Please resolve them.`
        );
      }
    } else if (choice === stashLabel && stashed) {
      vscode5.window.showInformationMessage(`${actionLabel} succeeded. Your changes were safely saved to Stash.`);
    }
    onSuccess();
  }
}
async function handleCheckoutWithConflictResolution(gitService, ref, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Checkout",
    ref,
    async () => {
      await gitService.checkout(ref);
      vscode5.window.showInformationMessage(`Checked out ${ref}`);
    },
    onSuccess
  );
}
async function handleMergeWithConflictResolution(gitService, ref, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Merge",
    ref,
    async () => {
      await gitService.merge(ref);
      vscode5.window.showInformationMessage(`Merged '${ref}' into current branch.`);
    },
    onSuccess
  );
}
async function handleRebaseWithConflictResolution(gitService, ref, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Rebase",
    ref,
    async () => {
      await gitService.rebase(ref);
      vscode5.window.showInformationMessage(`Rebased current branch onto ${ref}.`);
    },
    onSuccess
  );
}
async function handleCheckoutAndRebaseWithConflictResolution(gitService, branch, onto, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Rebase",
    onto,
    async () => {
      await gitService.checkoutAndRebase(branch, onto);
      vscode5.window.showInformationMessage(`Rebased ${branch} onto ${onto}`);
    },
    onSuccess
  );
}
async function handleCherryPickWithConflictResolution(gitService, hash, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Cherry-Pick",
    hash,
    async () => {
      await gitService.cherryPick(hash);
      vscode5.window.showInformationMessage(`Cherry-picked ${hash.slice(0, 8)} successfully.`);
    },
    onSuccess
  );
}
async function handleRevertWithConflictResolution(gitService, hash, onSuccess) {
  await withSmartStashOnConflict(
    gitService,
    "Revert",
    hash,
    async () => {
      await gitService.revertCommit(hash);
      vscode5.window.showInformationMessage(`Reverted commit ${hash.slice(0, 8)}.`);
    },
    onSuccess
  );
}
async function handlePullWithConflictResolution(gitService, branch, onSuccess) {
  await vscode5.window.withProgress(
    {
      location: vscode5.ProgressLocation.Notification,
      title: `Updating '${branch}'...`,
      cancellable: false
    },
    async () => {
      await withSmartStashOnConflict(
        gitService,
        "Update",
        branch,
        async () => {
          const out = await gitService.pull(branch);
          vscode5.window.showInformationMessage(`Updated ${branch}: ${out || "Already up to date."}`);
        },
        onSuccess
      );
    }
  );
}

// src/views/graphActions/branchActions.ts
async function handleBranchAction(type, payload, host) {
  const { gitService } = host;
  switch (type) {
    case "checkout": {
      const ref = payload;
      if (ref && ref.includes("/")) {
        const slashIdx = ref.indexOf("/");
        const remoteName = ref.slice(0, slashIdx);
        const branchName = ref.slice(slashIdx + 1);
        try {
          const remotes = await gitService.getRemotes();
          if (remotes.includes(remoteName)) {
            let fetchOk = false;
            await vscode6.window.withProgress(
              {
                location: vscode6.ProgressLocation.Notification,
                title: `Fetching '${ref}' before checkout...`,
                cancellable: false
              },
              async () => {
                try {
                  await gitService.fetchSingleBranch(remoteName, branchName);
                  fetchOk = true;
                } catch (fetchErr) {
                  vscode6.window.showErrorMessage(`Failed to fetch '${ref}' from remote '${remoteName}': ${fetchErr.message}`);
                }
              }
            );
            if (!fetchOk) {
              return true;
            }
          }
        } catch {
        }
      }
      await handleCheckoutWithConflictResolution(gitService, ref, () => host.loadInitialData());
      return true;
    }
    case "createBranch": {
      let { name, startPoint, checkout: checkout2, force } = payload || {};
      if (!name) {
        name = await vscode6.window.showInputBox({
          prompt: `New branch name (from '${startPoint || "HEAD"}'):`,
          placeHolder: "feature/..."
        });
        if (!name)
          return true;
      }
      try {
        await gitService.createBranch(name, startPoint, checkout2 !== false, force === true);
        vscode6.window.showInformationMessage(`Created branch ${name}`);
        host.loadInitialData();
      } catch (err) {
        vscode6.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
      return true;
    }
    case "deleteBranch": {
      const ref = payload;
      try {
        await gitService.deleteBranch(ref);
        vscode6.window.showInformationMessage(`Deleted branch '${ref}'`);
        host.loadInitialData();
      } catch (err) {
        if (err.message && (err.message.includes("not fully merged") || err.message.includes("not merged"))) {
          const force = await vscode6.window.showWarningMessage(
            `Branch '${ref}' is not fully merged. Do you want to force delete it?`,
            { modal: true },
            "Force Delete"
          );
          if (force === "Force Delete") {
            try {
              await gitService.deleteBranch(ref, true);
              vscode6.window.showInformationMessage(`Force deleted branch '${ref}'`);
              host.loadInitialData();
            } catch (e) {
              vscode6.window.showErrorMessage(`Delete failed: ${e.message}`);
            }
          }
        } else {
          vscode6.window.showErrorMessage(`Delete failed: ${err.message}`);
        }
      }
      return true;
    }
    case "checkoutAndRebase": {
      const { branch, onto } = payload || {};
      if (branch && onto) {
        await handleCheckoutAndRebaseWithConflictResolution(gitService, branch, onto, () => host.loadInitialData());
      }
      return true;
    }
    case "compareBranch": {
      const { branch, withBranch } = payload || {};
      try {
        const commits = await gitService.getLog({
          branch: `${withBranch}..${branch}`,
          all: false
        });
        host.updateGraph(commits);
        vscode6.window.showInformationMessage(`Comparing commits between ${branch} and ${withBranch}`);
      } catch (err) {
        vscode6.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
      return true;
    }
    case "renameBranch": {
      let { oldName, newName } = payload || {};
      if (!newName && oldName) {
        newName = await vscode6.window.showInputBox({
          prompt: `Rename branch '${oldName}' to:`,
          value: oldName
        });
        if (!newName || newName === oldName)
          return true;
      }
      if (!oldName || !newName)
        return true;
      try {
        await gitService.renameBranch(oldName, newName);
        vscode6.window.showInformationMessage(`Renamed branch '${oldName}' to '${newName}'`);
        host.loadInitialData();
      } catch (err) {
        vscode6.window.showErrorMessage(`Rename failed: ${err.message}`);
      }
      return true;
    }
    case "setUpstream": {
      const { branch, upstream } = payload || {};
      if (!branch || !upstream)
        return true;
      try {
        const slashIdx = upstream.indexOf("/");
        const remote = slashIdx !== -1 ? upstream.slice(0, slashIdx) : upstream;
        const remoteBranch = slashIdx !== -1 ? upstream.slice(slashIdx + 1) : branch;
        try {
          await gitService.exec(["fetch", remote, remoteBranch]);
        } catch {
        }
        try {
          await gitService.exec(["branch", "--set-upstream-to", upstream, branch]);
        } catch {
          await gitService.exec(["config", `branch.${branch}.remote`, remote]);
          await gitService.exec(["config", `branch.${branch}.merge`, `refs/heads/${remoteBranch}`]);
        }
        vscode6.window.showInformationMessage(`Branch '${branch}' is now tracking '${upstream}'.`);
        host.loadInitialData();
        vscode6.commands.executeCommand("intellij-git.refreshBranches");
      } catch (err) {
        vscode6.window.showErrorMessage(`Set upstream failed: ${err.message}`);
      }
      return true;
    }
    case "unsetUpstream": {
      const { branch } = payload || {};
      if (!branch)
        return true;
      try {
        await gitService.exec(["branch", "--unset-upstream", branch]);
        vscode6.window.showInformationMessage(`Unset tracked branch for '${branch}'.`);
        host.loadInitialData();
        vscode6.commands.executeCommand("intellij-git.refreshBranches");
      } catch (err) {
        vscode6.window.showErrorMessage(`Unset upstream failed: ${err.message}`);
      }
      return true;
    }
    case "trackAllBranchesToRemote": {
      const { remote, prefix } = payload || {};
      if (!remote)
        return true;
      const displayTarget = prefix ? `${remote}/${prefix}` : remote;
      await vscode6.window.withProgress(
        {
          location: vscode6.ProgressLocation.Notification,
          title: `Tracking branches to '${displayTarget}'...`,
          cancellable: false
        },
        async () => {
          try {
            try {
              await gitService.exec(["fetch", remote]);
            } catch {
            }
            const branches = await gitService.getBranches();
            const allLocals = branches.filter((b) => !b.remote && !b.name.startsWith("("));
            const locals = prefix ? allLocals.filter((b) => b.name === prefix || b.name.startsWith(prefix + "/")) : allLocals;
            let trackedCount = 0;
            const errors = [];
            for (const local of locals) {
              const targetRemoteBranch = `${remote}/${local.name}`;
              try {
                try {
                  await gitService.exec(["branch", "--set-upstream-to", targetRemoteBranch, local.name]);
                } catch {
                  await gitService.exec(["config", `branch.${local.name}.remote`, remote]);
                  await gitService.exec(["config", `branch.${local.name}.merge`, `refs/heads/${local.name}`]);
                }
                trackedCount++;
              } catch (err) {
                errors.push(`${local.name}: ${err.message}`);
              }
            }
            if (trackedCount > 0) {
              vscode6.window.showInformationMessage(`Successfully tracked ${trackedCount} local branch${trackedCount > 1 ? "es" : ""} to '${displayTarget}'.`);
              host.loadInitialData();
              vscode6.commands.executeCommand("intellij-git.refreshBranches");
            } else {
              vscode6.window.showInformationMessage(`No matching local branches found to track to '${displayTarget}'.`);
            }
            if (errors.length > 0) {
              vscode6.window.showWarningMessage(`Some branches could not be tracked:
${errors.join("\n")}`);
            }
          } catch (err) {
            vscode6.window.showErrorMessage(`Track branches failed: ${err.message}`);
          }
        }
      );
      return true;
    }
    default:
      return false;
  }
}

// src/views/graphActions/remoteActions.ts
var vscode7 = __toESM(require("vscode"));
async function handleRemoteAction(type, payload, host) {
  const { gitService } = host;
  switch (type) {
    case "pull": {
      const branch = payload;
      await handlePullWithConflictResolution(gitService, branch, () => host.loadInitialData());
      return true;
    }
    case "fetchAll": {
      try {
        await vscode7.window.withProgress(
          {
            location: vscode7.ProgressLocation.Notification,
            title: "Fetching remotes...",
            cancellable: false
          },
          async (progress) => {
            progress.report({ message: "Checking connectivity..." });
            const result = await gitService.smartFetchAll(
              (remote) => {
                vscode7.window.showInformationMessage(`Fetched '${remote}' successfully.`);
                host.loadInitialData();
              },
              (status) => {
                progress.report({ message: status });
              }
            );
            if (result.successful.length > 0) {
              if (result.failed.length > 0 || result.skipped.length > 0) {
                const missed = [...result.failed, ...result.skipped];
                vscode7.window.showInformationMessage(`Finished fetching. (Skipped offline: ${missed.join(", ")})`);
              } else {
                vscode7.window.showInformationMessage(`Fetched all remotes successfully: ${result.successful.join(", ")}.`);
              }
            } else if (result.failed.length > 0 || result.skipped.length > 0) {
              vscode7.window.showWarningMessage(`Could not reach remotes: ${[...result.failed, ...result.skipped].join(", ")}.`);
            } else {
              vscode7.window.showInformationMessage("No remotes configured.");
            }
            if (result.needsAuth && result.needsAuth.length > 0) {
              const target = result.needsAuth[0];
              let defaultUser = "";
              try {
                defaultUser = (await gitService.exec(["config", "user.name"])).trim();
              } catch {
              }
              host.view?.webview.postMessage({
                type: "showAuthDialog",
                payload: {
                  remote: target.remote,
                  url: target.url,
                  host: target.host,
                  defaultUsername: defaultUser
                }
              });
            }
          }
        );
      } catch (err) {
        vscode7.window.showErrorMessage(`Fetch all failed: ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }
    case "fetchRemote": {
      const { remote } = payload || {};
      if (!remote)
        return true;
      try {
        await vscode7.window.withProgress(
          {
            location: vscode7.ProgressLocation.Notification,
            title: `Fetching '${remote}'...`,
            cancellable: false
          },
          async () => {
            await gitService.exec(["fetch", remote, "--prune"], 10 * 1024 * 1024, 1, 9e4);
            vscode7.window.showInformationMessage(`Fetched remote '${remote}' successfully.`);
          }
        );
      } catch (err) {
        vscode7.window.showErrorMessage(`Failed to fetch '${remote}': ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }
    case "fetchSingleBranch": {
      const { branch } = payload || {};
      if (!branch)
        return true;
      const slashIdx = branch.indexOf("/");
      if (slashIdx === -1)
        return true;
      const remoteName = branch.slice(0, slashIdx);
      const branchName = branch.slice(slashIdx + 1);
      try {
        await vscode7.window.withProgress(
          {
            location: vscode7.ProgressLocation.Notification,
            title: `Fetching '${branch}'...`,
            cancellable: false
          },
          async () => {
            await gitService.fetchSingleBranch(remoteName, branchName);
            vscode7.window.showInformationMessage(`Fetched branch '${branch}' successfully.`);
          }
        );
      } catch (err) {
        vscode7.window.showErrorMessage(`Failed to fetch branch '${branch}': ${err.message}`);
      } finally {
        host.loadInitialData();
      }
      return true;
    }
    case "openAuthDialog": {
      const { remote } = payload || {};
      const remotes = await gitService.getRemotes();
      const targetRemote = remote || (remotes.includes("apistudio-os") ? "apistudio-os" : remotes[0] || "origin");
      const url = await gitService.getRemoteUrl(targetRemote);
      let hostName = targetRemote;
      try {
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          hostName = new URL(url).host;
        }
      } catch {
      }
      let defaultUser = "";
      try {
        defaultUser = (await gitService.exec(["config", "user.name"])).trim();
      } catch {
      }
      host.view?.webview.postMessage({
        type: "showAuthDialog",
        payload: {
          remote: targetRemote,
          url,
          host: hostName,
          defaultUsername: defaultUser
        }
      });
      return true;
    }
    case "saveGitCredentials": {
      const { remote, url, authType, username, token, password, remember } = payload || {};
      try {
        const secret = authType === "token" ? token : password;
        if (!secret) {
          throw new Error("Access token or password cannot be empty");
        }
        let targetUrl = url || await gitService.getRemoteUrl(remote);
        if (!targetUrl) {
          throw new Error(`Could not find URL for remote '${remote}'`);
        }
        if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
          const parsed = new URL(targetUrl);
          if (username) {
            parsed.username = encodeURIComponent(username);
          }
          parsed.password = encodeURIComponent(secret);
          targetUrl = parsed.toString();
        }
        if (remember) {
          await gitService.exec(["remote", "set-url", remote, targetUrl]);
        }
        await gitService.exec(["-c", "http.timeout=15", "fetch", remote, "--prune"]);
        host.view?.webview.postMessage({ type: "authSuccess", payload: { remote } });
        vscode7.window.showInformationMessage(`Authenticated and fetched '${remote}' successfully.`);
        host.loadInitialData();
      } catch (err) {
        host.view?.webview.postMessage({
          type: "authError",
          payload: { remote, error: err.message || "Authentication failed" }
        });
      }
      return true;
    }
    case "push":
    case "openPushDialog": {
      const branch = payload;
      await host.openPushDialog(branch);
      return true;
    }
    case "executePush": {
      const { branch, targetBranch, force, setUpstream, remote, tags } = payload || {};
      await vscode7.window.withProgress(
        {
          location: vscode7.ProgressLocation.Notification,
          title: `Pushing '${branch || "branch"}' to '${remote || "remote"}'...`,
          cancellable: false
        },
        async () => {
          try {
            await gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
            vscode7.window.showInformationMessage(`Pushed ${branch || "branch"} successfully to ${remote || "remote"}.`);
            host.loadInitialData();
            vscode7.commands.executeCommand("intellij-git.refreshBranches");
            host.view?.webview.postMessage({ type: "pushSuccess" });
          } catch (err) {
            vscode7.window.showErrorMessage(`Push failed: ${err.message}`);
            host.view?.webview.postMessage({ type: "pushError", payload: { error: err.message } });
          }
        }
      );
      return true;
    }
    case "pushUpToHere": {
      const { hash } = payload || {};
      const shortHash = (hash || "").slice(0, 8);
      await vscode7.window.withProgress(
        {
          location: vscode7.ProgressLocation.Notification,
          title: `Pushing up to ${shortHash}...`,
          cancellable: false
        },
        async () => {
          try {
            const currentBranch = await gitService.getCurrentBranch();
            const remote = await gitService.getDefaultRemote(currentBranch);
            await gitService.exec(["push", remote, `${hash}:refs/heads/${currentBranch}`]);
            vscode7.window.showInformationMessage(`Pushed up to ${shortHash} on ${currentBranch}`);
            host.loadInitialData();
          } catch (err) {
            vscode7.window.showErrorMessage(`Push failed: ${err.message}`);
          }
        }
      );
      return true;
    }
    default:
      return false;
  }
}

// src/views/graphActions/commitActions.ts
var vscode8 = __toESM(require("vscode"));
var path8 = __toESM(require("path"));
async function handleCommitAction(type, payload, host) {
  const { gitService } = host;
  switch (type) {
    case "rebase": {
      const branch = payload;
      await handleRebaseWithConflictResolution(gitService, branch, () => host.loadInitialData());
      return true;
    }
    case "showDiff": {
      const { branch } = payload || {};
      try {
        const files = await gitService.getDiffFiles(branch);
        if (files.length === 0) {
          vscode8.window.showInformationMessage(`No differences between ${branch} and working tree.`);
          return true;
        }
        const items = files.map((f) => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : "",
          file: f
        }));
        const picked = await vscode8.window.showQuickPick(items, {
          placeHolder: `Select a file changed against ${branch} to view diff`
        });
        if (picked) {
          const filePath = picked.file.path;
          const leftUri = picked.file.status === "A" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(branch, picked.file.oldPath || filePath);
          const rightUri = picked.file.status === "D" ? GitContentProvider.emptyUri() : vscode8.Uri.file(path8.join(gitService.getCwd(), filePath));
          const fileName = filePath.split("/").pop() || filePath;
          await vscode8.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (${branch} \u2194 Working Tree)`);
        }
      } catch (err) {
        vscode8.window.showErrorMessage(`Show diff failed: ${err.message}`);
      }
      return true;
    }
    case "mergeBranch": {
      const ref = payload;
      await handleMergeWithConflictResolution(gitService, ref, () => host.loadInitialData());
      return true;
    }
    case "rebaseFromHere": {
      const hash = payload;
      await vscode8.commands.executeCommand("intellij-git.interactiveRebase", hash);
      return true;
    }
    case "cherryPick": {
      const { hash } = payload || {};
      if (hash) {
        await handleCherryPickWithConflictResolution(gitService, hash, () => host.loadInitialData());
      }
      return true;
    }
    case "revertCommit": {
      const { hash } = payload || {};
      if (hash) {
        await handleRevertWithConflictResolution(gitService, hash, () => host.loadInitialData());
      }
      return true;
    }
    case "resetToCommit": {
      const { hash } = payload || {};
      const mode = await vscode8.window.showQuickPick([
        { label: "Soft", description: "Keep all local changes in index (staged)", mode: "soft" },
        { label: "Mixed", description: "Keep all local changes in working tree (unstaged)", mode: "mixed" },
        { label: "Hard", description: "Discard all local changes", mode: "hard" }
      ], { placeHolder: `Reset current branch to ${hash.slice(0, 8)}` });
      if (mode) {
        if (mode.mode === "hard") {
          const confirm = await vscode8.window.showWarningMessage(
            `Are you sure you want to perform a HARD reset to ${hash.slice(0, 8)}? All uncommitted local changes will be lost!`,
            { modal: true },
            "Reset"
          );
          if (confirm !== "Reset")
            return true;
        }
        try {
          await gitService.reset(hash, mode.mode);
          vscode8.window.showInformationMessage(`Reset branch to ${hash.slice(0, 8)} (${mode.label})`);
          host.loadInitialData();
        } catch (err) {
          vscode8.window.showErrorMessage(`Reset failed: ${err.message}`);
        }
      }
      return true;
    }
    case "undoCommit": {
      try {
        await gitService.reset("HEAD~1", "soft");
        vscode8.window.showInformationMessage("Undid last commit (changes kept staged)");
        host.loadInitialData();
      } catch (err) {
        vscode8.window.showErrorMessage(`Undo commit failed: ${err.message}`);
      }
      return true;
    }
    case "createTag": {
      let { name, hash } = payload || {};
      if (!name) {
        name = await vscode8.window.showInputBox({
          prompt: `New tag name at ${hash?.slice(0, 8) || "commit"}:`,
          placeHolder: "v1.0.0"
        });
        if (!name)
          return true;
      }
      try {
        await gitService.createTag(name, hash);
        vscode8.window.showInformationMessage(`Created tag ${name} at ${hash ? hash.slice(0, 8) : ""}`);
        host.loadInitialData();
      } catch (err) {
        vscode8.window.showErrorMessage(`Create tag failed: ${err.message}`);
      }
      return true;
    }
    case "createPatch": {
      const { hash } = payload || {};
      try {
        const patch = await gitService.createPatch(hash);
        const doc = await vscode8.workspace.openTextDocument({
          content: patch,
          language: "diff"
        });
        await vscode8.window.showTextDocument(doc);
        vscode8.window.showInformationMessage(`Created patch for ${hash.slice(0, 8)}`);
      } catch (err) {
        vscode8.window.showErrorMessage(`Create patch failed: ${err.message}`);
      }
      return true;
    }
    case "compareWithLocal": {
      const { hash } = payload || {};
      try {
        const files = await gitService.getDiffFiles(hash);
        if (files.length === 0) {
          vscode8.window.showInformationMessage(`No differences between ${hash.slice(0, 8)} and working tree.`);
          return true;
        }
        const items = files.map((f) => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : "",
          file: f
        }));
        const picked = await vscode8.window.showQuickPick(items, {
          placeHolder: `Select a file changed against ${hash.slice(0, 8)} to view diff`
        });
        if (picked) {
          const filePath = picked.file.path;
          const leftUri = picked.file.status === "A" ? GitContentProvider.emptyUri() : GitContentProvider.makeUri(hash, picked.file.oldPath || filePath);
          const rightUri = picked.file.status === "D" ? GitContentProvider.emptyUri() : vscode8.Uri.file(path8.join(gitService.getCwd(), filePath));
          const fileName = filePath.split("/").pop() || filePath;
          await vscode8.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (${hash.slice(0, 8)} \u2194 Working Tree)`);
        }
      } catch (err) {
        vscode8.window.showErrorMessage(`Compare with local failed: ${err.message}`);
      }
      return true;
    }
    case "editCommitMessage": {
      const { hash, subject, message } = payload || {};
      let newMsg = message;
      if (!newMsg) {
        newMsg = await vscode8.window.showInputBox({
          prompt: "Edit Commit Message",
          value: subject || ""
        });
      }
      if (newMsg && newMsg.trim()) {
        try {
          const headHash = (await gitService.getLog({ maxCount: 1 }))[0]?.hash;
          if (headHash === hash) {
            await gitService.exec(["commit", "--amend", "-m", newMsg.trim()]);
            vscode8.window.showInformationMessage("Commit message updated");
            host.loadInitialData();
          } else {
            vscode8.window.showWarningMessage("Editing commit message of older commits requires interactive rebase.");
            await vscode8.commands.executeCommand("intellij-git.interactiveRebase", hash);
          }
        } catch (err) {
          vscode8.window.showErrorMessage(`Edit message failed: ${err.message}`);
        }
      }
      return true;
    }
    case "dropCommit": {
      const { hash } = payload || {};
      try {
        const headHash = (await gitService.getLog({ maxCount: 1 }))[0]?.hash;
        if (headHash === hash) {
          await gitService.reset("HEAD~1", "hard");
          vscode8.window.showInformationMessage(`Dropped commit ${hash.slice(0, 8)}`);
          host.loadInitialData();
        } else {
          vscode8.window.showInformationMessage(`Use Interactive Rebase to drop older commit ${hash.slice(0, 8)}`);
          await vscode8.commands.executeCommand("intellij-git.interactiveRebase", hash);
        }
      } catch (err) {
        vscode8.window.showErrorMessage(`Drop commit failed: ${err.message}`);
      }
      return true;
    }
    case "showRepoAtRevision": {
      const { hash } = payload || {};
      try {
        const files = await gitService.getCommitFiles(hash);
        if (files.length === 0) {
          vscode8.window.showInformationMessage(`No files changed in ${hash.slice(0, 8)}.`);
          return true;
        }
        const items = files.map((f) => ({
          label: `${f.status} ${f.path}`,
          description: f.oldPath ? `from ${f.oldPath}` : "",
          path: f.path
        }));
        const picked = await vscode8.window.showQuickPick(items, {
          placeHolder: `Files changed in commit ${hash.slice(0, 8)}`
        });
        if (picked) {
          const uri = GitContentProvider.makeUri(hash, picked.path);
          await vscode8.commands.executeCommand("vscode.open", uri);
        }
      } catch (err) {
        vscode8.window.showErrorMessage(`Show revision failed: ${err.message}`);
      }
      return true;
    }
    case "openInBrowser": {
      const { hash } = payload || {};
      try {
        const remoteUrl = await gitService.getRemoteUrl();
        if (!remoteUrl) {
          vscode8.window.showWarningMessage("No remote URL found for this repository.");
          return true;
        }
        let httpUrl = remoteUrl.replace(/^ssh:\/\/git@([^/:]+)(?::\d+)?\//, "https://$1/").replace(/^git@([^:]+):/, "https://$1/").replace(/^https?:\/\/[^@]+@/, "https://").replace(/\.git$/, "");
        if (httpUrl.includes("gitlab.com") || httpUrl.includes("gitlab")) {
          httpUrl = `${httpUrl}/-/commit/${hash}`;
        } else {
          httpUrl = `${httpUrl}/commit/${hash}`;
        }
        await vscode8.env.openExternal(vscode8.Uri.parse(httpUrl));
      } catch (err) {
        vscode8.window.showErrorMessage(`Open in browser failed: ${err.message}`);
      }
      return true;
    }
    default:
      return false;
  }
}

// src/views/graphActions/index.ts
async function handleGraphAction(type, payload, host) {
  if (await handleBranchAction(type, payload, host))
    return true;
  if (await handleRemoteAction(type, payload, host))
    return true;
  if (await handleCommitAction(type, payload, host))
    return true;
  return false;
}

// src/views/graphPanel.ts
var GraphViewProvider = class {
  constructor(extensionUri, gitService, log2) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.log = log2;
    this.allCommits = [];
    this.graphNodes = [];
    this.isLoadingMore = false;
    this.hasReachedEnd = false;
    this.lastBranches = [];
    this.lastTags = [];
    this.hasInitializedFilter = false;
    this.isRefreshing = false;
    this.queuedRefresh = false;
    this.currentFilter = {};
    this.currentBranchCommits = /* @__PURE__ */ new Set();
    this.currentUser = { name: "", email: "" };
    this.currentBranchName = "";
    this.initialWorkspaceRoot = "";
  }
  static {
    this.viewType = "intellij-git.logView";
  }
  async updateBranchAndUser() {
    try {
      this.currentBranchName = await this.gitService.getCurrentBranch();
    } catch {
      this.currentBranchName = "";
    }
    try {
      this.currentUser = await this.gitService.getCurrentUser();
    } catch {
      this.currentUser = { name: "", email: "" };
    }
    this.currentBranchCommits.clear();
    try {
      const target = this.currentFilter.branch || "HEAD";
      const output = await this.gitService.exec(["rev-list", "--max-count=3000", target]);
      for (const line of output.split("\n")) {
        const h = line.trim();
        if (h)
          this.currentBranchCommits.add(h);
      }
    } catch {
    }
  }
  resolveWebviewView(webviewView, _context, _token) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode9.Uri.joinPath(this.extensionUri, "dist", "webview"),
        vscode9.Uri.joinPath(this.extensionUri, "resources")
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      } else {
        this.closeAllMenus();
      }
    });
    this.loadInitialData();
  }
  closeAllMenus() {
    this.view?.webview.postMessage({ type: "closeAllMenus" });
  }
  async loadInitialData() {
    if (!this.initialWorkspaceRoot) {
      this.initialWorkspaceRoot = this.gitService.getCwd();
    }
    const isRepo = await this.gitService.isGitRepo();
    if (!isRepo) {
      this.log.appendLine("Current directory is not a git repository. Searching subfolders...");
      const subRepos = await this.gitService.findSubRepos();
      this.log.appendLine(`Found ${subRepos.length} sub-repositories: ${subRepos.map((r) => r.name).join(", ")}`);
      this.allCommits = [];
      this.graphNodes = [];
      this.lastBranches = [];
      this.lastTags = [];
      this.currentBranchName = "";
      this.currentBranchCommits.clear();
      this.currentFilter = {};
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
      } else if (this.currentFilter.branch && this.currentFilter.branch.includes("/")) {
        this.currentFilter.branch = "HEAD";
      }
      const [commits, branches, tags] = await Promise.all([
        this.gitService.getLog({ maxCount: 300, ...this.currentFilter }),
        this.gitService.getBranches(),
        this.gitService.getTags()
      ]);
      const seen = /* @__PURE__ */ new Set();
      this.allCommits = commits.filter((c) => {
        if (seen.has(c.hash))
          return false;
        seen.add(c.hash);
        return true;
      });
      this.lastBranches = branches;
      this.lastTags = tags;
      this.log.appendLine(`Loaded ${this.allCommits.length} commits, ${branches.length} branches, ${tags.length} tags`);
      this.graphNodes = buildGraph(this.allCommits);
      await this.updateBranchAndUser();
      this.sendCommits();
      this.sendBranches(branches, tags, this.currentBranchName || currentBranch);
      this.gitService.getRemotes().then((remotes) => {
        const hasMissingRemotes = remotes.some((r) => !branches.some((b) => b.name.startsWith(r + "/")));
        if (hasMissingRemotes) {
          this.gitService.refreshRemoteBranchNames().then((res) => {
            if (res.some((r) => r.count > 0)) {
              this.refresh();
            }
          }).catch(() => {
          });
        }
      }).catch(() => {
      });
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
    const isSingleBranch = !!this.currentFilter.branch;
    const isSubRepo = !!(this.initialWorkspaceRoot && this.gitService.getCwd() !== this.initialWorkspaceRoot);
    this.view?.webview.postMessage({
      type: "commits",
      payload: {
        commits: this.allCommits.map((c, i) => ({
          ...c,
          graph: this.graphNodes[i],
          isCurrentBranch: isSingleBranch || this.currentBranchCommits.has(c.hash)
        })),
        graphWidth: graphWidth(this.graphNodes),
        currentUser: this.currentUser,
        currentBranch: this.currentBranchName,
        isSubRepo,
        repoPath: this.gitService.getCwd()
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
    let remotes = [];
    try {
      remotes = await this.gitService.getRemotes();
    } catch {
      remotes = [];
    }
    const isSubRepo = !!(this.initialWorkspaceRoot && this.gitService.getCwd() !== this.initialWorkspaceRoot);
    this.view?.webview.postMessage({
      type: "branches",
      payload: {
        branches,
        tags,
        remotes,
        currentBranch: this.currentBranchName || currentBranch,
        currentUser: this.currentUser,
        activeBranch: this.currentFilter.branch || "",
        isSubRepo,
        repoPath: this.gitService.getCwd()
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
        try {
          this.gitService.setCwd(repoPath);
          this.hasInitializedFilter = false;
          await this.loadInitialData();
        } catch (err) {
          this.log.appendLine(`Failed to switch git repository: ${err.message}`);
          vscode9.window.showErrorMessage(`Failed to switch repository: ${err.message}`);
        }
        break;
      }
      case "exitSubRepo": {
        this.log.appendLine("Exiting sub-repository back to workspace root...");
        if (this.initialWorkspaceRoot) {
          this.gitService.setCwd(this.initialWorkspaceRoot);
          this.hasInitializedFilter = false;
          await this.loadInitialData();
        }
        break;
      }
      case "initRepo": {
        this.log.appendLine("Initializing new git repository...");
        try {
          await this.gitService.initRepo();
          vscode9.window.showInformationMessage("Initialized Git repository successfully.");
          this.hasInitializedFilter = false;
          await this.loadInitialData();
        } catch (err) {
          vscode9.window.showErrorMessage(`Failed to init git repository: ${err.message}`);
        }
        break;
      }
      case "selectCommit": {
        const hash = msg.payload;
        try {
          const files = await this.gitService.getCommitFiles(hash);
          this.view?.webview.postMessage({ type: "commitFiles", payload: { hash, files } });
        } catch (err) {
          vscode9.window.showErrorMessage(`Failed to get commit files: ${err.message}`);
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
          await vscode9.commands.executeCommand("vscode.diff", leftUri, rightUri, title);
        } catch (err) {
          this.log.appendLine(`openDiff ERROR: ${err.message}`);
          vscode9.window.showErrorMessage(`Diff failed: ${err.message}`);
        }
        break;
      }
      case "openReviewInCenter": {
        const filePath = typeof msg.payload === "string" ? msg.payload : msg.payload?.filePath;
        if (filePath) {
          CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            [{ path: filePath, name: filePath.split("/").pop() || filePath, dir: "", status: "M" }],
            () => this.refresh()
          );
        }
        break;
      }
      case "loadMore": {
        if (this.isLoadingMore || this.hasReachedEnd)
          break;
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
        const { branch, author, after, before, path: filePath, query, order, firstParent, noMerges } = msg.payload || {};
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        this.currentFilter = {
          branch: branch || void 0,
          author: author || void 0,
          after: after || void 0,
          before: before || void 0,
          path: filePath || void 0,
          query: query || void 0,
          order: order || void 0,
          firstParent: firstParent || void 0,
          noMerges: noMerges || void 0,
          all: !branch
        };
        try {
          const commits = await this.gitService.getLog({
            maxCount: 300,
            ...this.currentFilter
          });
          const seen = /* @__PURE__ */ new Set();
          this.allCommits = commits.filter((c) => {
            if (seen.has(c.hash))
              return false;
            seen.add(c.hash);
            return true;
          });
          this.graphNodes = buildGraph(this.allCommits);
          await this.updateBranchAndUser();
          this.sendCommits();
        } catch (err) {
          this.log.appendLine(`Filter failed: ${err.message}. Falling back to default log.`);
          try {
            this.currentFilter = { all: true };
            const commits = await this.gitService.getLog({ maxCount: 300, all: true });
            this.allCommits = commits;
            this.graphNodes = buildGraph(this.allCommits);
            await this.updateBranchAndUser();
            this.sendCommits();
          } catch {
          }
          vscode9.window.showWarningMessage(`Could not filter by '${branch}': ${err.message}`);
        }
        break;
      }
      case "refreshBranches": {
        this.hasReachedEnd = false;
        this.isLoadingMore = false;
        try {
          await this.gitService.refreshRemoteBranchNames();
          await this.refresh();
          vscode9.window.showInformationMessage("Branches refreshed.");
        } catch (err) {
          vscode9.window.showErrorMessage(`Refresh failed: ${err.message}`);
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
            if (seen.has(c.hash))
              return false;
            seen.add(c.hash);
            return true;
          });
          this.lastBranches = branches;
          this.lastTags = tags;
          this.graphNodes = buildGraph(this.allCommits);
          await this.updateBranchAndUser();
          this.sendCommits();
          this.sendBranches(branches, tags);
        } catch (err) {
          vscode9.window.showErrorMessage(`Refresh failed: ${err.message}`);
        }
        break;
      }
      default: {
        await handleGraphAction(msg.type, msg.payload, {
          gitService: this.gitService,
          extensionUri: this.extensionUri,
          loadInitialData: () => this.loadInitialData(),
          openPushDialog: (branch) => this.openPushDialog(branch),
          view: this.view,
          updateGraph: (commits) => {
            this.allCommits = commits;
            this.graphNodes = buildGraph(this.allCommits);
            this.sendCommits();
          }
        });
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
    if (!this.view || !this.view.visible)
      return;
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
        if (seen.has(c.hash))
          return false;
        seen.add(c.hash);
        return true;
      });
      this.lastBranches = branches;
      this.lastTags = tags;
      this.graphNodes = buildGraph(this.allCommits);
      await this.updateBranchAndUser();
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
  async openPushDialog(branch) {
    await PushDialogPanel.createOrShow(this.extensionUri, this.gitService, branch);
  }
  getHtml(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode9.Uri.joinPath(this.extensionUri, "dist", "webview", "graph", "graph.js")
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
  <style>
    *::-webkit-scrollbar-track,
    *::-webkit-scrollbar-track-piece,
    *::-webkit-scrollbar-corner {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app" style="height:100%;overflow:hidden;"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
};

// src/views/commitPanel.ts
var vscode13 = __toESM(require("vscode"));
var path10 = __toESM(require("path"));
var fs8 = __toESM(require("fs"));

// src/views/conflictsDialogPanel.ts
var vscode11 = __toESM(require("vscode"));

// src/views/mergeEditorPanel.ts
var vscode10 = __toESM(require("vscode"));
var path9 = __toESM(require("path"));
var fs7 = __toESM(require("fs"));

// src/views/mergeEditor/mergeEditorStyles.ts
var mergeEditorStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #bcbec4);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      font-size: 12px;
    }
    #app {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Top Toolbar */
    .merge-toolbar {
      height: 38px;
      background: var(--vscode-sideBarSectionHeader-background, var(--vscode-editorGroupHeader-tabsBackground, #2b2d30));
      border-bottom: 1px solid var(--vscode-panel-border, #393b40);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      flex-shrink: 0;
      gap: 12px;
    }
    .tool-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tool-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #9aa0a6;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      transition: all 0.12s;
    }
    .tool-btn:hover {
      background: #393b40;
      color: #dfe1e5;
    }
    .tool-btn svg {
      pointer-events: none;
    }
    .divider {
      width: 1px;
      height: 18px;
      background: #4e5157;
      margin: 0 4px;
    }
    .status-counter {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(229, 165, 10, 0.18);
      color: #e5a50a;
      border: 1px solid rgba(229, 165, 10, 0.35);
    }
    .status-counter.all-resolved {
      background: rgba(46, 160, 67, 0.18);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.35);
    }
    .file-path-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground, #bcbec4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }
    .action-btn {
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .action-btn.btn-apply {
      background: #3574f0;
      color: #ffffff;
      border: 1px solid #3574f0;
    }
    .action-btn.btn-apply:hover {
      background: #3068d9;
    }
    .action-btn.btn-cancel {
      background: transparent;
      color: #bcbec4;
      border: 1px solid #4e5157;
    }
    .action-btn.btn-cancel:hover {
      background: #393b40;
      color: #ffffff;
    }

    /* Sub-header Columns */
    .columns-header {
      display: flex;
      height: 26px;
      background: var(--vscode-editorGroupHeader-tabsBackground, #232528);
      border-bottom: 1px solid var(--vscode-panel-border, #2f3136);
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground, #7f848e);
      user-select: none;
    }
    .header-col {
      flex: 1;
      padding: 4px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-col.center-col {
      color: #dfe1e5;
    }
    .header-col-gutter {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
      border-left: 1px solid var(--vscode-panel-border, #2b2d30);
      border-right: 1px solid var(--vscode-panel-border, #2b2d30);
    }
    .editable-badge {
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 3px;
      background: rgba(53, 116, 240, 0.18);
      color: #58a6ff;
      border: 1px solid rgba(53, 116, 240, 0.35);
    }

    /* Viewport & 3 Panes */
    .viewport-wrapper {
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .editor-pane {
      flex: 1;
      overflow-x: auto;
      overflow-y: auto;
      background: var(--vscode-editor-background, #1e1f22);
      min-width: 0;
      position: relative;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .editor-pane::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .editor-pane::-webkit-scrollbar-thumb {
      background: #393b40;
      border-radius: 4px;
    }
    .editor-pane::-webkit-scrollbar-corner {
      background: transparent;
    }
    .lines-container {
      display: flex;
      flex-direction: column;
      min-width: 100%;
      width: max-content;
      position: relative;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .editor-line {
      height: 20px;
      min-height: 20px;
      max-height: 20px;
      line-height: 20px;
      display: flex;
      align-items: stretch;
      min-width: 100%;
      width: max-content;
      font-family: "JetBrains Mono", "JetBrains Mono NL", JetBrainsMono, Consolas, Menlo, Monaco, monospace;
      font-size: var(--vscode-editor-font-size, 12px);
      color: var(--vscode-editor-foreground, #bcbec4);
      white-space: pre;
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text;
    }
    .gutter-num {
      width: 44px;
      min-width: 44px;
      height: 20px;
      line-height: 20px;
      text-align: right;
      padding-right: 12px;
      color: var(--vscode-editorLineNumber-foreground, #5a5d63);
      user-select: none !important;
      -webkit-user-select: none !important;
      font-size: 11px;
      font-family: "JetBrains Mono", "JetBrains Mono NL", monospace;
      position: sticky;
      left: 0;
      background: inherit;
      z-index: 2;
      cursor: default;
    }
    .line-content {
      flex: 1;
      height: 20px;
      line-height: 20px;
      padding-left: 6px;
      padding-right: 24px;
      white-space: pre;
      overflow: visible;
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text !important;
    }
    .editor-line ::selection,
    .editor-line::selection {
      background: var(--vscode-editor-selectionBackground, #264f78) !important;
      color: inherit !important;
    }

    /* Middle Gutters */
    .merge-gutter {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      height: 100%;
      overflow: hidden;
      position: relative;
      background: var(--vscode-editorGutter-background, var(--vscode-editor-background, #1e1f22));
      border-left: 1px solid var(--vscode-panel-border, #2b2d30);
      border-right: 1px solid var(--vscode-panel-border, #2b2d30);
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    .merge-gutter * {
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    .gutter-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .gutter-controls {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .conflict-ribbon {
      fill: rgba(186, 68, 68, 0.35);
      transition: fill 0.15s ease;
    }
    .conflict-ribbon.resolved {
      fill: rgba(46, 160, 67, 0.25);
    }
    .conflict-ribbon.ignored {
      fill: rgba(90, 95, 105, 0.15);
    }

    /* Action Buttons in Gutter (>> and <<) */
    .block-btn {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: auto;
      z-index: 6;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--vscode-editor-background, #1e1f22);
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 3px;
      color: var(--vscode-foreground, #bcbec4);
      cursor: pointer;
      padding: 0;
      box-sizing: border-box;
      transition: all 0.12s ease;
    }
    .block-btn:hover {
      background: #3574f0;
      border-color: #3574f0;
      color: #ffffff;
      transform: scale(1.12);
    }
    .block-btn.btn-ignore {
      width: 16px;
      height: 16px;
      opacity: 0.65;
    }
    .block-btn.btn-ignore:hover {
      background: #ba4444;
      border-color: #ba4444;
      color: #ffffff;
      opacity: 1;
    }
    .block-btn.active-accepted {
      background: #2ea043;
      border-color: #2ea043;
      color: #ffffff;
    }

    /* Conflict Line Highlights */
    .line-conflict {
      background: rgba(186, 68, 68, 0.18) !important;
    }
    .line-conflict-resolved {
      background: rgba(46, 160, 67, 0.15) !important;
    }
    .line-placeholder {
      font-style: italic;
      color: #e5a50a;
      opacity: 0.8;
      background: rgba(229, 165, 10, 0.08);
      border-top: 1px dashed rgba(229, 165, 10, 0.3);
      border-bottom: 1px dashed rgba(229, 165, 10, 0.3);
    }

    /* Center Editable Line */
    .center-editor .line-content[contenteditable="plaintext-only"],
    .center-editor .line-content[contenteditable="true"] {
      outline: none !important;
      cursor: text;
    }

    /* Syntax Highlighting */
    .syn-kwd { color: var(--syn-kwd, #fd6883) !important; }
    .syn-type { color: var(--syn-type, #85dacc) !important; }
    .syn-fn { color: var(--syn-fn, #adda78) !important; }
    .syn-str { color: var(--syn-str, #f9cc6c) !important; }
    .syn-num { color: var(--syn-num, #a8a9eb) !important; }
    .syn-const { color: var(--syn-const, #a8a9eb) !important; }
    .syn-var { color: var(--syn-var, #fff1f3) !important; }
    .syn-comment { color: var(--syn-comment, #72696a) !important; font-style: italic; }
    .syn-anno { color: var(--syn-anno, #85dacc) !important; }
    .syn-punct { color: var(--syn-punct, #948a8b) !important; }
`;

// src/views/mergeEditor/mergeEditorScript.ts
var mergeEditorScript = `
    const vscode = acquireVsCodeApi();
    const LINE_HEIGHT = 20;

    let state = {
      filePath: '',
      fileName: '',
      yoursBranch: 'HEAD',
      theirsBranch: 'Incoming',
      hunks: [],
      conflictBlocks: [],
      currentConflictIndex: 0,
    };

    const TOKEN_REGEX = /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b)|(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(\\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|native|new|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield|let|function|package|public|private|protected)\\b)|(\\b(?:true|false|null|undefined|nil|None)\\b)|(\\b(?:int|double|num|bool|boolean|String|string|List|Map|Set|Iterable|Future|Stream|Duration|DateTime|Uri|Object|Never|any|number|char|float|long|short|byte)\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\())|(\\b[A-Z][a-zA-Z0-9_$]*\\b)|(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)/g;

    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function highlightCode(code) {
      if (!code) return '';
      let result = '';
      let lastIndex = 0;
      TOKEN_REGEX.lastIndex = 0;
      let match;
      while ((match = TOKEN_REGEX.exec(code)) !== null) {
        if (match.index > lastIndex) {
          result += escapeHtml(code.slice(lastIndex, match.index));
        }
        lastIndex = TOKEN_REGEX.lastIndex;
        const [full, comment, str, num, anno, kwd, constVal, builtinType, fnName, pascalType, ident] = match;
        if (comment) result += \`<span class="syn-comment">\${escapeHtml(comment)}</span>\`;
        else if (str) result += \`<span class="syn-str">\${escapeHtml(str)}</span>\`;
        else if (num) result += \`<span class="syn-num">\${escapeHtml(num)}</span>\`;
        else if (anno) result += \`<span class="syn-anno">\${escapeHtml(anno)}</span>\`;
        else if (kwd) result += \`<span class="syn-kwd">\${escapeHtml(kwd)}</span>\`;
        else if (constVal) result += \`<span class="syn-const">\${escapeHtml(constVal)}</span>\`;
        else if (builtinType) result += \`<span class="syn-type">\${escapeHtml(builtinType)}</span>\`;
        else if (fnName) result += \`<span class="syn-fn">\${escapeHtml(fnName)}</span>\`;
        else if (pascalType) result += \`<span class="syn-type">\${escapeHtml(pascalType)}</span>\`;
        else if (ident) result += \`<span class="syn-var">\${escapeHtml(ident)}</span>\`;
        else result += escapeHtml(full);
      }
      if (lastIndex < code.length) {
        result += escapeHtml(code.slice(lastIndex));
      }
      return result;
    }

    // Elements
    const leftEditor = document.getElementById('left-editor');
    const centerEditor = document.getElementById('center-editor');
    const rightEditor = document.getElementById('right-editor');
    const leftLinesEl = document.getElementById('left-lines');
    const centerLinesEl = document.getElementById('center-lines');
    const rightLinesEl = document.getElementById('right-lines');
    const leftSvg = document.getElementById('left-svg');
    const rightSvg = document.getElementById('right-svg');
    const leftControls = document.getElementById('left-controls');
    const rightControls = document.getElementById('right-controls');
    const statusCounter = document.getElementById('status-counter');
    const fileTitle = document.getElementById('file-title');
    const headerYours = document.getElementById('header-yours');
    const headerTheirs = document.getElementById('header-theirs');

    function render3Way() {
      leftLinesEl.innerHTML = '';
      centerLinesEl.innerHTML = '';
      rightLinesEl.innerHTML = '';
      state.conflictBlocks = [];

      let leftLineNo = 1;
      let centerLineNo = 1;
      let rightLineNo = 1;

      state.hunks.forEach((hunk) => {
        if (hunk.type === 'common') {
          const lines = hunk.commonLines || [];
          lines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, '');
            appendLine(centerLinesEl, centerLineNo++, text, '', true, hunk.id);
            appendLine(rightLinesEl, rightLineNo++, text, '');
          });
        } else if (hunk.type === 'conflict') {
          const yLines = hunk.yoursLines || [];
          const tLines = hunk.theirsLines || [];

          const leftStart = leftLineNo;
          yLines.forEach(text => {
            appendLine(leftLinesEl, leftLineNo++, text, 'line-conflict');
          });
          const leftEnd = leftLineNo - 1;

          const rightStart = rightLineNo;
          tLines.forEach(text => {
            appendLine(rightLinesEl, rightLineNo++, text, 'line-conflict');
          });
          const rightEnd = rightLineNo - 1;

          const centerStart = centerLineNo;
          const rLines = hunk.resultLines || [];
          if (hunk.resolved && rLines.length > 0) {
            rLines.forEach(text => {
              appendLine(centerLinesEl, centerLineNo++, text, 'line-conflict-resolved', true, hunk.id);
            });
          } else if (hunk.resolved && rLines.length === 0) {
            // Ignored / empty result
          } else {
            // Unresolved placeholder
            appendLine(centerLinesEl, centerLineNo++, '// Unresolved conflict #' + hunk.id, 'line-placeholder', true, hunk.id);
          }
          const centerEnd = centerLineNo - 1;

          state.conflictBlocks.push({
            id: hunk.id,
            hunk,
            leftStart,
            leftEnd: Math.max(leftStart, leftEnd),
            leftCount: yLines.length,
            rightStart,
            rightEnd: Math.max(rightStart, rightEnd),
            rightCount: tLines.length,
            centerStart,
            centerEnd: Math.max(centerStart, centerEnd),
            resolved: hunk.resolved || false,
            chosen: hunk.chosen || null,
          });
        }
      });

      updateConflictCounter();
      updateRibbonsAndControls();
    }

    function appendLine(container, lineNo, text, extraClass, editable = false, hunkId = null) {
      const lineEl = document.createElement('div');
      lineEl.className = 'editor-line' + (extraClass ? ' ' + extraClass : '');
      if (hunkId !== null) {
        lineEl.setAttribute('data-hunk-id', hunkId);
      }

      const numEl = document.createElement('div');
      numEl.className = 'gutter-num';
      numEl.textContent = lineNo;
      lineEl.appendChild(numEl);

      const contentEl = document.createElement('div');
      contentEl.className = 'line-content';
      contentEl.innerHTML = highlightCode(text);
      if (editable) {
        contentEl.setAttribute('contenteditable', 'plaintext-only');
        contentEl.setAttribute('spellcheck', 'false');
      }
      lineEl.appendChild(contentEl);

      container.appendChild(lineEl);
    }

    function updateConflictCounter() {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining === 0) {
        statusCounter.textContent = 'All conflicts resolved';
        statusCounter.className = 'status-counter all-resolved';
      } else {
        statusCounter.textContent = \`\${remaining} conflict\${remaining > 1 ? 's' : ''} remaining\`;
        statusCounter.className = 'status-counter';
      }
    }

    function updateRibbonsAndControls() {
      const sLeft = leftEditor.scrollTop;
      const sCenter = centerEditor.scrollTop;
      const sRight = rightEditor.scrollTop;
      const viewH = leftEditor.clientHeight;
      const W = 44;

      let leftSvgHtml = '';
      let rightSvgHtml = '';
      let leftCtrlHtml = '';
      let rightCtrlHtml = '';

      state.conflictBlocks.forEach(b => {
        // Left -> Center
        const ly1 = (b.leftStart - 1) * LINE_HEIGHT - sLeft;
        const ly2 = b.leftCount === 0 ? ly1 : (b.leftEnd * LINE_HEIGHT - sLeft);
        const cy1 = (b.centerStart - 1) * LINE_HEIGHT - sCenter;
        const cy2 = (b.centerEnd * LINE_HEIGHT - sCenter);

        const leftD = \`M 0,\${ly1} L 6,\${ly1} C 16,\${ly1} \${W - 16},\${cy1} \${W - 6},\${cy1} L \${W},\${cy1} L \${W},\${cy2} L \${W - 6},\${cy2} C \${W - 16},\${cy2} 16,\${ly2} 6,\${ly2} L 0,\${ly2} Z\`;
        const ribbonClass = b.resolved ? (b.chosen === 'ignored' ? 'conflict-ribbon ignored' : 'conflict-ribbon resolved') : 'conflict-ribbon';

        leftSvgHtml += \`<path d="\${leftD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        // Left controls (>> and x)
        const btnY = Math.max(0, ly1 + 2);
        const leftAcceptActive = b.resolved && b.chosen === 'yours' ? ' active-accepted' : '';
        leftCtrlHtml += \`
          <button class="block-btn accept-left-btn\${leftAcceptActive}" style="top: \${btnY}px; left: 4px;" title="Accept Yours (Left)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 2L5 5L1.5 8M5 2L8.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="block-btn btn-ignore ignore-left-btn" style="top: \${btnY}px; left: 24px;" title="Ignore Yours" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        \`;

        // Center <- Right
        const ry1 = (b.rightStart - 1) * LINE_HEIGHT - sRight;
        const ry2 = b.rightCount === 0 ? ry1 : (b.rightEnd * LINE_HEIGHT - sRight);

        const rightD = \`M 0,\${cy1} L 6,\${cy1} C 16,\${cy1} \${W - 16},\${ry1} \${W - 6},\${ry1} L \${W},\${ry1} L \${W},\${ry2} L \${W - 6},\${ry2} C \${W - 16},\${ry2} 16,\${ly2} 6,\${ly2} L 0,\${ly2} Z\`;
        rightSvgHtml += \`<path d="\${rightD}" class="\${ribbonClass}" data-id="\${b.id}"/>\`;

        const rBtnY = Math.max(0, ry1 + 2);
        const rightAcceptActive = b.resolved && b.chosen === 'theirs' ? ' active-accepted' : '';
        rightCtrlHtml += \`
          <button class="block-btn btn-ignore ignore-right-btn" style="top: \${rBtnY}px; left: 4px;" title="Ignore Theirs" data-id="\${b.id}">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          <button class="block-btn accept-right-btn\${rightAcceptActive}" style="top: \${rBtnY}px; left: 22px;" title="Accept Theirs (Right)" data-id="\${b.id}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M8.5 2L5 5L8.5 8M5 2L1.5 5L5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        \`;
      });

      leftSvg.innerHTML = leftSvgHtml;
      rightSvg.innerHTML = rightSvgHtml;
      leftControls.innerHTML = leftCtrlHtml;
      rightControls.innerHTML = rightCtrlHtml;

      // Bind events
      leftControls.querySelectorAll('.accept-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'yours');
        });
      });
      leftControls.querySelectorAll('.ignore-left-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
      rightControls.querySelectorAll('.accept-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'theirs');
        });
      });
      rightControls.querySelectorAll('.ignore-right-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.getAttribute('data-id'), 10);
          acceptConflict(id, 'ignored');
        });
      });
    }

    function acceptConflict(id, choice) {
      const hunk = state.hunks.find(h => h.id === id);
      if (!hunk) return;

      hunk.resolved = true;
      hunk.chosen = choice;
      if (choice === 'yours') {
        hunk.resultLines = [...(hunk.yoursLines || [])];
      } else if (choice === 'theirs') {
        hunk.resultLines = [...(hunk.theirsLines || [])];
      } else if (choice === 'ignored') {
        hunk.resultLines = [];
      }

      render3Way();
    }

    // Synchronized Scrolling
    let isSyncing = false;
    function syncScroll(source) {
      if (isSyncing) return;
      isSyncing = true;
      const top = source.scrollTop;
      const left = source.scrollLeft;

      if (source !== leftEditor) leftEditor.scrollTop = top;
      if (source !== centerEditor) centerEditor.scrollTop = top;
      if (source !== rightEditor) rightEditor.scrollTop = top;

      updateRibbonsAndControls();
      isSyncing = false;
    }

    function handleWheel(pane, e) {
      if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
        pane.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
    leftEditor.addEventListener('wheel', (e) => handleWheel(leftEditor, e), { passive: false });
    centerEditor.addEventListener('wheel', (e) => handleWheel(centerEditor, e), { passive: false });
    rightEditor.addEventListener('wheel', (e) => handleWheel(rightEditor, e), { passive: false });

    leftEditor.addEventListener('scroll', () => syncScroll(leftEditor));
    centerEditor.addEventListener('scroll', () => syncScroll(centerEditor));
    rightEditor.addEventListener('scroll', () => syncScroll(rightEditor));

    // Jump Between Conflicts
    function jumpConflict(direction) {
      const unresolved = state.conflictBlocks;
      if (unresolved.length === 0) return;

      state.currentConflictIndex = (state.currentConflictIndex + direction + unresolved.length) % unresolved.length;
      const target = unresolved[state.currentConflictIndex];
      if (target) {
        const targetY = Math.max(0, (target.centerStart - 4) * LINE_HEIGHT);
        centerEditor.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }

    document.getElementById('btn-prev-conflict').addEventListener('click', () => jumpConflict(-1));
    document.getElementById('btn-next-conflict').addEventListener('click', () => jumpConflict(1));

    document.getElementById('btn-apply-non-conflicting').addEventListener('click', () => {
      // Auto accept all non-conflicting or simple blocks
      state.hunks.forEach(h => {
        if (h.type === 'conflict' && !h.resolved) {
          if ((h.yoursLines || []).length === 0 && (h.theirsLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'theirs';
            h.resultLines = [...h.theirsLines];
          } else if ((h.theirsLines || []).length === 0 && (h.yoursLines || []).length > 0) {
            h.resolved = true;
            h.chosen = 'yours';
            h.resultLines = [...h.yoursLines];
          }
        }
      });
      render3Way();
    });

    // Apply & Cancel
    function getMergedContent() {
      const lineEls = centerLinesEl.querySelectorAll('.line-content');
      const lines = [];
      lineEls.forEach(el => {
        lines.push(el.textContent || '');
      });
      return lines.join('\\n');
    }

    document.getElementById('btn-apply-merge').addEventListener('click', () => {
      const remaining = state.conflictBlocks.filter(b => !b.resolved).length;
      if (remaining > 0) {
        // Highlight remaining
        jumpConflict(0);
      }
      const content = getMergedContent();
      vscode.postMessage({
        type: 'applyMerge',
        payload: {
          filePath: state.filePath,
          content,
        }
      });
    });

    document.getElementById('btn-cancel-merge').addEventListener('click', () => {
      vscode.postMessage({ type: 'cancelMerge' });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        jumpConflict(e.shiftKey ? -1 : 1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-apply-merge').click();
      } else if (e.key === 'Escape') {
        document.getElementById('btn-cancel-merge').click();
      }
    });

    // Webview Message Listener
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'loadMergeData') {
        state.filePath = msg.payload.filePath;
        state.fileName = msg.payload.fileName;
        state.yoursBranch = msg.payload.yoursBranch;
        state.theirsBranch = msg.payload.theirsBranch;
        state.hunks = msg.payload.hunks || [];

        fileTitle.textContent = state.filePath;
        headerYours.textContent = \`Your version (\${state.yoursBranch})\`;
        headerTheirs.textContent = \`Their version (\${state.theirsBranch})\`;

        render3Way();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, true);

    vscode.postMessage({ type: 'ready' });
`;

// src/views/mergeEditorHtml.ts
function getMergeEditorHtml(cspSource, nonce, tokens) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style id="dynamic-syntax-tokens">
    :root {
      --syn-kwd: ${tokens.kwd};
      --syn-type: ${tokens.type};
      --syn-fn: ${tokens.fn};
      --syn-str: ${tokens.str};
      --syn-num: ${tokens.num};
      --syn-const: ${tokens.constVal};
      --syn-var: ${tokens.varVal};
      --syn-comment: ${tokens.comment};
      --syn-anno: ${tokens.anno};
      --syn-punct: ${tokens.punct};
    }
  </style>
  <style>
${mergeEditorStyles}
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app">
    <!-- 1. Top Toolbar -->
    <div class="merge-toolbar">
      <div class="tool-group">
        <button class="tool-btn" id="btn-prev-conflict" title="Previous Conflict (Shift+F7)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 7.5L6 4L9.5 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Prev
        </button>
        <button class="tool-btn" id="btn-next-conflict" title="Next Conflict (F7)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Next
        </button>
        <div class="divider"></div>
        <button class="tool-btn" id="btn-apply-non-conflicting" title="Apply all non-conflicting changes">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L4.5 8.5L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Apply Non-Conflicting
        </button>
        <div class="divider"></div>
        <span class="status-counter" id="status-counter">0 conflicts remaining</span>
      </div>

      <div class="file-path-title" id="file-title">Resolving Conflicts</div>

      <div class="tool-group">
        <button class="action-btn btn-apply" id="btn-apply-merge" title="Apply merge and stage file (Cmd+Enter / Ctrl+Enter)">Apply</button>
        <button class="action-btn btn-cancel" id="btn-cancel-merge">Cancel</button>
      </div>
    </div>

    <!-- 2. Column Headers -->
    <div class="columns-header">
      <div class="header-col" id="header-yours">Your version</div>
      <div class="header-col-gutter"></div>
      <div class="header-col center-col">
        <span>Result</span>
        <span class="editable-badge">Editable</span>
      </div>
      <div class="header-col-gutter"></div>
      <div class="header-col" id="header-theirs">Their version</div>
    </div>

    <!-- 3. 3-Way Viewport -->
    <div class="viewport-wrapper">
      <!-- Left Editor (Yours) -->
      <div class="editor-pane left-editor" id="left-editor">
        <div class="lines-container" id="left-lines"></div>
      </div>

      <!-- Left Gutter (Yours -> Center) -->
      <div class="merge-gutter" id="left-gutter">
        <svg class="gutter-svg" id="left-svg"></svg>
        <div class="gutter-controls" id="left-controls"></div>
      </div>

      <!-- Center Editor (Merged Result) -->
      <div class="editor-pane center-editor" id="center-editor">
        <div class="lines-container" id="center-lines"></div>
      </div>

      <!-- Right Gutter (Center <- Theirs) -->
      <div class="merge-gutter" id="right-gutter">
        <svg class="gutter-svg" id="right-svg"></svg>
        <div class="gutter-controls" id="right-controls"></div>
      </div>

      <!-- Right Editor (Theirs) -->
      <div class="editor-pane right-editor" id="right-editor">
        <div class="lines-container" id="right-lines"></div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
${mergeEditorScript}
  </script>
</body>
</html>`;
}

// src/views/mergeEditorPanel.ts
var MergeEditorPanel = class _MergeEditorPanel {
  constructor(panel, extensionUri, gitService, filePath) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.disposables = [];
    this.currentFilePath = "";
    this.panel = panel;
    this.currentFilePath = filePath;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    vscode10.window.onDidChangeActiveColorTheme(
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
  static {
    this.viewType = "intellij-git.mergeEditor";
  }
  static async createOrShow(extensionUri, gitService, filePath) {
    const fileName = path9.basename(filePath);
    if (_MergeEditorPanel.currentPanel) {
      _MergeEditorPanel.currentPanel.currentFilePath = filePath;
      _MergeEditorPanel.currentPanel.panel.title = `Merge: ${fileName}`;
      _MergeEditorPanel.currentPanel.panel.reveal(vscode10.ViewColumn.Active, true);
      await _MergeEditorPanel.currentPanel.loadConflictData(filePath);
      return _MergeEditorPanel.currentPanel;
    }
    const panel = vscode10.window.createWebviewPanel(
      _MergeEditorPanel.viewType,
      `Merge: ${fileName}`,
      vscode10.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode10.Uri.joinPath(extensionUri, "dist", "webview")
        ]
      }
    );
    _MergeEditorPanel.currentPanel = new _MergeEditorPanel(
      panel,
      extensionUri,
      gitService,
      filePath
    );
    return _MergeEditorPanel.currentPanel;
  }
  async loadConflictData(filePath) {
    try {
      const fullPath = path9.join(this.gitService.getCwd(), filePath);
      let fileOnDisk = "";
      if (fs7.existsSync(fullPath)) {
        fileOnDisk = fs7.readFileSync(fullPath, "utf8");
      }
      let baseContent = "";
      let yoursContent = "";
      let theirsContent = "";
      try {
        baseContent = await this.gitService.exec(["show", `:1:${filePath}`]);
      } catch {
      }
      try {
        yoursContent = await this.gitService.exec(["show", `:2:${filePath}`]);
      } catch {
      }
      try {
        theirsContent = await this.gitService.exec(["show", `:3:${filePath}`]);
      } catch {
      }
      const conflictInfo = await this.gitService.getConflictInfo().catch(() => ({
        yoursBranch: "HEAD",
        theirsBranch: "Incoming"
      }));
      const hunks = this.parseConflictHunks(fileOnDisk, yoursContent, theirsContent, baseContent);
      this.panel.webview.postMessage({
        type: "loadMergeData",
        payload: {
          filePath,
          fileName: path9.basename(filePath),
          yoursBranch: conflictInfo.yoursBranch || "Current version",
          theirsBranch: conflictInfo.theirsBranch || "Incoming version",
          hunks,
          baseContent,
          yoursContent,
          theirsContent
        }
      });
    } catch (err) {
      vscode10.window.showErrorMessage(`Failed to load merge conflict data: ${err.message || err}`);
    }
  }
  parseConflictHunks(fileOnDisk, yoursContent, theirsContent, baseContent) {
    const hunks = [];
    let hunkId = 1;
    if (fileOnDisk.includes("<<<<<<<") && fileOnDisk.includes("=======")) {
      const lines = fileOnDisk.split(/\r?\n/);
      let currentCommon = [];
      let currentYours = [];
      let currentTheirs = [];
      let inOurs = false;
      let inTheirs = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("<<<<<<<")) {
          if (currentCommon.length > 0) {
            hunks.push({
              id: hunkId++,
              type: "common",
              commonLines: currentCommon
            });
            currentCommon = [];
          }
          inOurs = true;
          inTheirs = false;
          currentYours = [];
        } else if (inOurs && line.startsWith("=======")) {
          inOurs = false;
          inTheirs = true;
          currentTheirs = [];
        } else if (inTheirs && line.startsWith(">>>>>>>")) {
          inTheirs = false;
          hunks.push({
            id: hunkId++,
            type: "conflict",
            yoursLines: currentYours,
            theirsLines: currentTheirs,
            resolved: false,
            chosen: null,
            resultLines: []
          });
          currentYours = [];
          currentTheirs = [];
        } else {
          if (inOurs) {
            currentYours.push(line);
          } else if (inTheirs) {
            currentTheirs.push(line);
          } else {
            currentCommon.push(line);
          }
        }
      }
      if (currentCommon.length > 0) {
        hunks.push({
          id: hunkId++,
          type: "common",
          commonLines: currentCommon
        });
      }
      return hunks;
    }
    const yLines = yoursContent ? yoursContent.split(/\r?\n/) : [];
    const tLines = theirsContent ? theirsContent.split(/\r?\n/) : [];
    if (yoursContent === theirsContent && yoursContent.length > 0) {
      return [{
        id: 1,
        type: "common",
        commonLines: yLines
      }];
    }
    return [{
      id: 1,
      type: "conflict",
      yoursLines: yLines,
      theirsLines: tLines,
      resolved: false,
      chosen: null,
      resultLines: []
    }];
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "ready": {
        this.sendThemeTokens();
        if (this.currentFilePath) {
          await this.loadConflictData(this.currentFilePath);
        }
        break;
      }
      case "applyMerge": {
        const { filePath, content } = msg.payload;
        try {
          const fullPath = path9.join(this.gitService.getCwd(), filePath);
          fs7.writeFileSync(fullPath, content, "utf8");
          await this.gitService.stageFile(filePath);
          if (ConflictsDialogPanel.currentPanel) {
            await ConflictsDialogPanel.currentPanel.refresh();
          }
          vscode10.window.showInformationMessage(`Successfully resolved and staged '${path9.basename(filePath)}'`);
          this.panel.dispose();
        } catch (err) {
          vscode10.window.showErrorMessage(`Failed to apply merge: ${err?.message || err}`);
        }
        break;
      }
      case "cancelMerge": {
        this.panel.dispose();
        break;
      }
    }
  }
  sendThemeTokens() {
    const tokens = getThemeTokens();
    this.panel.webview.postMessage({
      type: "themeTokens",
      payload: tokens
    });
  }
  getHtml() {
    const nonce = getNonce();
    const tokens = getThemeTokens();
    return getMergeEditorHtml(this.panel.webview.cspSource, nonce, tokens);
  }
  dispose() {
    _MergeEditorPanel.currentPanel = void 0;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d)
        d.dispose();
    }
  }
};

// src/views/dialogs/conflictsDialogStyles.ts
var conflictsDialogStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1f22);
      color: var(--vscode-editor-foreground, #dfe1e5);
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      user-select: none;
    }
    .as-dialog-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1e1f22);
    }
    .as-banner {
      padding: 14px 20px 10px;
      font-size: 13px;
      color: var(--vscode-editor-foreground, #dfe1e5);
      flex-shrink: 0;
    }
    .as-content-area {
      display: flex;
      flex: 1;
      min-height: 0;
      padding: 0 20px 14px;
      gap: 16px;
    }
    .as-table-box {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--vscode-panel-border, #43454a);
      border-radius: 4px;
      background: var(--vscode-editor-background, #1e1f22);
      overflow: hidden;
    }
    .as-table-header {
      display: flex;
      background: var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background, #2b2d30));
      border-bottom: 1px solid var(--vscode-panel-border, #3c3f41);
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground, #9aa0a6);
      flex-shrink: 0;
    }
    .as-col-name {
      flex: 2;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-col-yours {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-col-theirs {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .as-table-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .as-conflict-row {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      font-size: 12.5px;
      cursor: pointer;
      user-select: none;
      transition: background 0.1s;
    }
    .as-conflict-row:hover {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
    }
    .as-conflict-row.selected {
      background: var(--vscode-list-activeSelectionBackground, #2675bf) !important;
      color: var(--vscode-list-activeSelectionForeground, #ffffff) !important;
    }
    .as-action-panel {
      width: 130px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 2px;
      flex-shrink: 0;
    }
    .as-btn {
      background: var(--vscode-button-secondaryBackground, #2b2d30);
      color: var(--vscode-button-secondaryForeground, #dfe1e5);
      border: 1px solid var(--vscode-button-border, #4e5157);
      border-radius: 4px;
      padding: 7px 14px;
      font-size: 12.5px;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .as-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, #35373b);
    }
    .as-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .as-btn-primary {
      background: var(--vscode-button-background, #3574f0);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      border-radius: 4px;
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .as-btn-primary:hover {
      background: var(--vscode-button-hoverBackground, #3068d8);
    }
    .as-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .as-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px 14px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background, #2b2d30));
      border-top: 1px solid var(--vscode-panel-border, #323438);
      flex-shrink: 0;
    }
`;

// src/views/dialogs/conflictsDialogScript.ts
function getConflictsDialogScript(rawConflictInfo) {
  return `
    const vscode = acquireVsCodeApi();
    let conflictInfo = ${rawConflictInfo};
    let conflicts = [...(conflictInfo.conflicts || [])];
    let selectedPath = conflicts.length > 0 ? conflicts[0].path : null;
    let groupByDir = false;

    const tableBody = document.getElementById('conflict-table-body');
    const chkGroup = document.getElementById('chk-group-dir');
    const btnAcceptYours = document.getElementById('btn-act-yours');
    const btnAcceptTheirs = document.getElementById('btn-act-theirs');
    const btnMerge = document.getElementById('btn-act-merge');
    const btnClose = document.getElementById('btn-dialog-close');
    const lblYours = document.getElementById('lbl-yours');
    const lblTheirs = document.getElementById('lbl-theirs');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
      return escapeHtml(str);
    }

    function updateHeaders() {
      lblYours.textContent = 'Yours (' + (conflictInfo.yoursBranch || 'HEAD') + ')';
      lblTheirs.textContent = 'Theirs (' + (conflictInfo.theirsBranch || 'MERGE_HEAD') + ')';
    }

    function renderTable() {
      updateHeaders();

      if (conflicts.length === 0) {
        tableBody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--vscode-descriptionForeground, #808080);font-size:13px;">All conflicts have been resolved!</div>';
        btnAcceptYours.disabled = true;
        btnAcceptTheirs.disabled = true;
        btnMerge.disabled = true;
        return;
      }

      btnAcceptYours.disabled = false;
      btnAcceptTheirs.disabled = false;
      btnMerge.disabled = false;

      if (!selectedPath || !conflicts.some(c => c.path === selectedPath)) {
        selectedPath = conflicts[0].path;
      }

      let html = '';
      if (!groupByDir) {
        conflicts.forEach(file => {
          const isSelected = file.path === selectedPath;
          const statusColor = isSelected ? 'inherit' : 'var(--vscode-editor-foreground, #dfe1e5)';
          const dirColor = isSelected ? 'inherit' : 'var(--vscode-descriptionForeground, #808080)';
          html += '<div class="as-conflict-row' + (isSelected ? ' selected' : '') + '" data-path="' + escapeAttr(file.path) + '">';
          html += '<div class="as-col-name" style="display:flex;align-items:center;gap:6px;">';
          html += getFileIcon(file.name);
          html += '<span style="font-weight:500;color:' + (isSelected ? 'inherit' : '#e06c75') + ';">' + escapeHtml(file.name) + '</span>';
          if (file.dir) {
            html += '<span style="font-size:11.5px;color:' + dirColor + ';margin-left:4px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(file.dir) + '</span>';
          }
          html += '</div>';
          html += '<div class="as-col-yours" style="color:' + statusColor + ';">' + escapeHtml(file.yours) + '</div>';
          html += '<div class="as-col-theirs" style="color:' + statusColor + ';">' + escapeHtml(file.theirs) + '</div>';
          html += '</div>';
        });
      } else {
        const groups = new Map();
        conflicts.forEach(file => {
          const dir = file.dir || '';
          if (!groups.has(dir)) groups.set(dir, []);
          groups.get(dir).push(file);
        });

        for (const [dir, files] of groups.entries()) {
          html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.04);color:var(--vscode-descriptionForeground, #9aa0a6);font-size:11.5px;font-weight:600;">';
          html += '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>';
          html += '<span>' + escapeHtml(dir || 'root') + '</span>';
          html += '</div>';

          files.forEach(file => {
            const isSelected = file.path === selectedPath;
            const statusColor = isSelected ? 'inherit' : 'var(--vscode-editor-foreground, #dfe1e5)';
            html += '<div class="as-conflict-row' + (isSelected ? ' selected' : '') + '" data-path="' + escapeAttr(file.path) + '" style="padding-left:22px;">';
            html += '<div class="as-col-name" style="display:flex;align-items:center;gap:6px;">';
            html += getFileIcon(file.name);
            html += '<span style="font-weight:500;color:' + (isSelected ? 'inherit' : '#e06c75') + ';">' + escapeHtml(file.name) + '</span>';
            if (file.dir) {
              html += '<span style="font-size:11.5px;color:' + dirColor + ';margin-left:4px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(file.dir) + '</span>';
            }
            html += '</div>';
            html += '<div class="as-col-yours" style="color:' + statusColor + ';">' + escapeHtml(file.yours) + '</div>';
            html += '<div class="as-col-theirs" style="color:' + statusColor + ';">' + escapeHtml(file.theirs) + '</div>';
            html += '</div>';
          });
        }
      }

      tableBody.innerHTML = html;

      tableBody.querySelectorAll('.as-conflict-row').forEach(row => {
        row.addEventListener('click', () => {
          selectedPath = row.getAttribute('data-path');
          renderTable();
        });
        row.addEventListener('dblclick', () => {
          selectedPath = row.getAttribute('data-path');
          doMerge();
        });
      });
    }

    function doMerge() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'openMergeEditor', payload: { path: selectedPath } });
    }

    function doAcceptYours() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'acceptYours', payload: { path: selectedPath } });
    }

    function doAcceptTheirs() {
      if (!selectedPath) return;
      vscode.postMessage({ type: 'acceptTheirs', payload: { path: selectedPath } });
    }

    function closeDialog() {
      vscode.postMessage({ type: 'close' });
    }

    btnAcceptYours.addEventListener('click', doAcceptYours);
    btnAcceptTheirs.addEventListener('click', doAcceptTheirs);
    btnMerge.addEventListener('click', doMerge);
    btnClose.addEventListener('click', closeDialog);

    chkGroup.addEventListener('change', () => {
      groupByDir = chkGroup.checked;
      renderTable();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDialog();
      } else if (e.key === 'Enter') {
        doMerge();
      } else if (e.key === 'ArrowDown') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx < conflicts.length - 1) {
          selectedPath = conflicts[idx + 1].path;
          renderTable();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowUp') {
        const idx = conflicts.findIndex(c => c.path === selectedPath);
        if (idx > 0) {
          selectedPath = conflicts[idx - 1].path;
          renderTable();
          e.preventDefault();
        }
      }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'updateConflictInfo') {
        conflictInfo = msg.payload || {};
        conflicts = [...(conflictInfo.conflicts || [])];
        renderTable();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, true);

    renderTable();
`;
}

// src/views/conflictsDialogHtml.ts
function getConflictsDialogHtml(rawConflictInfo) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resolve Conflicts</title>
  <style>
${conflictsDialogStyles}
  </style>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div class="as-dialog-container">
    <div class="as-banner">
      The following files have unresolved conflicts. You need to resolve them before continuing.
    </div>

    <div class="as-content-area">
      <div class="as-table-box">
        <div class="as-table-header">
          <div class="as-col-name">Name</div>
          <div class="as-col-yours" id="lbl-yours">Yours</div>
          <div class="as-col-theirs" id="lbl-theirs">Theirs</div>
        </div>
        <div class="as-table-body" id="conflict-table-body"></div>
      </div>

      <div class="as-action-panel">
        <button id="btn-act-yours" class="as-btn">Accept Yours</button>
        <button id="btn-act-theirs" class="as-btn">Accept Theirs</button>
        <button id="btn-act-merge" class="as-btn-primary" style="margin-top:4px;">Merge...</button>
      </div>
    </div>

    <div class="as-footer">
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground, #dfe1e5);cursor:pointer;">
        <input type="checkbox" id="chk-group-dir" style="accent-color:var(--vscode-focusBorder, #3574f0);cursor:pointer;width:14px;height:14px;margin:0;">
        <span>Group files by directory</span>
      </label>
      <button id="btn-dialog-close" class="as-btn" style="padding:6px 20px;">Close</button>
    </div>
  </div>

  <script>
${getFileIconScript}
${getConflictsDialogScript(rawConflictInfo)}
  </script>
</body>
</html>`;
}

// src/views/conflictsDialogPanel.ts
var ConflictsDialogPanel = class _ConflictsDialogPanel {
  constructor(panel, extensionUri, gitService, conflictInfo) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.conflictInfo = conflictInfo;
    this.disposables = [];
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.active) {
          this.refresh();
        }
      },
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
  static {
    this.viewType = "intellij-git.conflictsDialogWindow";
  }
  static async createOrShow(extensionUri, gitService) {
    try {
      const conflictInfo = await gitService.getConflictInfo();
      if (!conflictInfo.hasConflicts || conflictInfo.conflicts.length === 0) {
        vscode11.window.showInformationMessage("No unresolved conflicts found in the repository.");
        return void 0;
      }
      if (_ConflictsDialogPanel.currentPanel) {
        _ConflictsDialogPanel.currentPanel.panel.reveal();
        _ConflictsDialogPanel.currentPanel.update(conflictInfo);
        return _ConflictsDialogPanel.currentPanel;
      }
      const panel = vscode11.window.createWebviewPanel(
        _ConflictsDialogPanel.viewType,
        "Resolve Conflicts",
        vscode11.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode11.Uri.joinPath(extensionUri, "dist", "webview"),
            vscode11.Uri.joinPath(extensionUri, "resources")
          ]
        }
      );
      _ConflictsDialogPanel.currentPanel = new _ConflictsDialogPanel(
        panel,
        extensionUri,
        gitService,
        conflictInfo
      );
      try {
        await vscode11.commands.executeCommand("workbench.action.moveEditorToNewWindow");
      } catch {
      }
      return _ConflictsDialogPanel.currentPanel;
    } catch (err) {
      vscode11.window.showErrorMessage(`Failed to open Conflicts dialog: ${err?.message || err}`);
      return void 0;
    }
  }
  async refresh() {
    try {
      const conflictInfo = await this.gitService.getConflictInfo();
      this.update(conflictInfo);
    } catch {
    }
  }
  update(conflictInfo) {
    this.conflictInfo = conflictInfo;
    this.panel.webview.postMessage({
      type: "updateConflictInfo",
      payload: conflictInfo
    });
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "close": {
        this.dispose();
        break;
      }
      case "acceptYours": {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await this.gitService.acceptYours(filePath);
            vscode11.window.showInformationMessage(`Accepted Yours for '${filePath}'`);
            await this.refresh();
          } catch (err) {
            vscode11.window.showErrorMessage(`Accept Yours failed: ${err?.message || err}`);
          }
        }
        break;
      }
      case "acceptTheirs": {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await this.gitService.acceptTheirs(filePath);
            vscode11.window.showInformationMessage(`Accepted Theirs for '${filePath}'`);
            await this.refresh();
          } catch (err) {
            vscode11.window.showErrorMessage(`Accept Theirs failed: ${err?.message || err}`);
          }
        }
        break;
      }
      case "openMergeEditor": {
        const filePath = msg.payload?.path;
        if (filePath) {
          try {
            await MergeEditorPanel.createOrShow(this.extensionUri, this.gitService, filePath);
          } catch (err) {
            vscode11.window.showErrorMessage(`Failed to open merge editor: ${err?.message || err}`);
          }
        }
        break;
      }
    }
  }
  dispose() {
    _ConflictsDialogPanel.currentPanel = void 0;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  getHtml() {
    const rawConflictInfo = JSON.stringify(this.conflictInfo);
    return getConflictsDialogHtml(rawConflictInfo);
  }
};

// src/utils/aiCommitGenerator.ts
var vscode12 = __toESM(require("vscode"));
function detectAuthorStyle(messages) {
  if (!messages || messages.length === 0) {
    return { type: "imperative", endsWithPeriod: false };
  }
  let conventionalCount = 0;
  let imperativeCount = 0;
  let periodCount = 0;
  let scopeCount = 0;
  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?:\s*(.+)/i;
  for (const msg of messages) {
    if (msg.endsWith("."))
      periodCount++;
    const convMatch = msg.match(conventionalRegex);
    if (convMatch) {
      conventionalCount++;
      if (convMatch[2])
        scopeCount++;
    } else if (/^[A-Z][a-zA-Z0-9_\-]*\s+/.test(msg)) {
      imperativeCount++;
    }
  }
  return {
    type: conventionalCount > imperativeCount ? "conventional" : "imperative",
    hasScope: scopeCount > conventionalCount / 2,
    endsWithPeriod: periodCount > messages.length / 2
  };
}
function adaptCommitMessageStyle(raw, samples) {
  if (!raw)
    return raw;
  const style = detectAuthorStyle(samples);
  let msg = raw.trim();
  if (style.type === "imperative") {
    msg = msg.replace(/^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([^\)]+\))?!?:\s*/i, "");
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    if (!style.endsWithPeriod) {
      msg = msg.replace(/\.+$/, "");
    } else if (!msg.endsWith(".")) {
      msg += ".";
    }
    return msg;
  } else {
    const convRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-\.\/]+\))?!?:\s*(.+)/i;
    const match = msg.match(convRegex);
    if (match) {
      const type2 = match[1].toLowerCase();
      const scope = match[2] ? match[2].toLowerCase() : "";
      let desc2 = match[3].trim();
      desc2 = desc2.charAt(0).toLowerCase() + desc2.slice(1);
      desc2 = desc2.replace(/\.+$/, "");
      return `${type2}${scope}: ${desc2}`;
    }
    let type = "feat";
    if (/^(fix|resolve|prevent|handle|correct)\b/i.test(msg))
      type = "fix";
    else if (/^(refactor|clean|simplify)\b/i.test(msg))
      type = "refactor";
    else if (/^(doc|document|docs)\b/i.test(msg))
      type = "docs";
    else if (/^(test|tests)\b/i.test(msg))
      type = "test";
    else if (/^(chore|build|ci)\b/i.test(msg))
      type = "chore";
    let desc = msg.charAt(0).toLowerCase() + msg.slice(1);
    desc = desc.replace(/\.+$/, "");
    return `${type}: ${desc}`;
  }
}
async function getDiffForFiles(gitService, files) {
  const allStatus = await gitService.getStatus().catch(() => []);
  const untrackedSet = new Set(allStatus.filter((s) => s.x === "?" && s.y === "?").map((s) => s.path));
  const targetFiles = files && files.length > 0 ? files : allStatus.map((s) => s.path);
  const sortedFiles = [...targetFiles].sort((a, b) => {
    const isLockA = /lock|\.json$|\.der$/i.test(a) ? 1 : 0;
    const isLockB = /lock|\.json$|\.der$/i.test(b) ? 1 : 0;
    return isLockA - isLockB;
  });
  let combinedDiff = "";
  const perFileLimit = Math.max(1500, Math.floor(1e4 / (sortedFiles.length || 1)));
  for (const f of sortedFiles) {
    if (combinedDiff.length >= 1e4)
      break;
    try {
      let diff = "";
      if (untrackedSet.has(f)) {
        diff = await gitService.getFileDiff(f);
      } else {
        diff = await gitService.exec(["diff", "HEAD", "--", f]).catch(async () => {
          return await gitService.exec(["diff", "--", f]).catch(() => "");
        });
      }
      if (diff && diff.trim()) {
        const trimmedDiff = diff.length > perFileLimit ? diff.slice(0, perFileLimit) + "\n... (truncated)" : diff;
        combinedDiff += (combinedDiff ? "\n" : "") + trimmedDiff;
      }
    } catch {
    }
  }
  if (!combinedDiff.trim()) {
    try {
      combinedDiff = await gitService.getStagedDiff();
    } catch {
    }
  }
  return combinedDiff;
}
async function generateAiCommitMessage(gitService, checkedFiles) {
  const authorSamples = await gitService.getAuthorRecentCommitMessages(10).catch(() => []);
  const repoRoot = gitService.getCwd();
  const gitExt = vscode12.extensions.getExtension("vscode.git");
  let gitRepo;
  if (gitExt) {
    const gitApi = gitExt.exports.getAPI(1);
    gitRepo = gitApi.repositories.find((r) => r.rootUri.fsPath === repoRoot || r.rootUri.path === repoRoot) || gitApi.repositories[0];
  }
  const restoreFocus = () => {
    vscode12.commands.executeCommand("workbench.view.extension.intellij-git-commit");
    vscode12.commands.executeCommand("intellij-git.commitView.focus");
  };
  setTimeout(restoreFocus, 30);
  setTimeout(restoreFocus, 80);
  let aiMsg = "";
  try {
    const targetDiff = await getDiffForFiles(gitService, checkedFiles);
    if (targetDiff && targetDiff.trim()) {
      if (vscode12.lm && typeof vscode12.lm.selectChatModels === "function") {
        const models = await vscode12.lm.selectChatModels({ family: "gemini-1.5-pro" }).catch(() => []);
        const model = models[0] || (await vscode12.lm.selectChatModels().catch(() => []))[0];
        if (model) {
          const prompt = [
            "You are an expert Git commit message generator.",
            authorSamples.length > 0 ? `Follow the exact style, tone, and conventions of the author's recent commit messages below:
${authorSamples.map((s) => `- ${s}`).join("\n")}` : "Write a concise, high quality commit message.",
            "Generate ONLY a single-line commit summary with no markdown, quotes, backticks, or extra explanation.",
            `Git diff:
${targetDiff.slice(0, 8e3)}`
          ].join("\n\n");
          const response = await model.sendRequest([
            vscode12.LanguageModelChatMessage.User(prompt)
          ]);
          let accumulated = "";
          for await (const chunk of response.text) {
            accumulated += chunk;
          }
          if (accumulated.trim()) {
            aiMsg = accumulated.trim().replace(/^[`'"]+|[`'"]+$/g, "");
          }
        }
      }
    }
  } catch {
  }
  if (!aiMsg) {
    try {
      aiMsg = await vscode12.commands.executeCommand("antigravity.generateCommitMessage", repoRoot) || "";
    } catch {
    }
  }
  if (!aiMsg && gitRepo?.inputBox?.value) {
    aiMsg = gitRepo.inputBox.value;
  }
  restoreFocus();
  if (aiMsg && typeof aiMsg === "string") {
    return adaptCommitMessageStyle(aiMsg, authorSamples).trim();
  }
  return "";
}

// src/views/commitPanel.ts
var CommitViewProvider = class _CommitViewProvider {
  constructor(extensionUri, gitService, log2) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.log = log2;
    this.changesFilePaths = [];
    this.unversionedFilePaths = [];
    this.allFilePaths = [];
    this.lastStatusHash = "";
    this.isRefreshing = false;
    this.queuedRefresh = false;
    _CommitViewProvider.currentProvider = this;
    CommitReviewPanel.onFileNavigateListener = (filePath) => {
      this.selectFile(filePath);
    };
  }
  static {
    this.viewType = "intellij-git.commitView";
  }
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
        vscode13.Uri.joinPath(this.extensionUri, "dist", "webview"),
        vscode13.Uri.joinPath(this.extensionUri, "resources")
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      } else {
        this.closeAllMenus();
      }
    });
    this.refresh();
  }
  closeAllMenus() {
    this.view?.webview.postMessage({ type: "closeAllMenus" });
  }
  async refresh() {
    if (!this.view || !this.view.visible)
      return;
    if (this.isRefreshing) {
      this.queuedRefresh = true;
      return;
    }
    this.isRefreshing = true;
    try {
      const isRepo = await this.gitService.isGitRepo();
      const workspaceFolder = vscode13.workspace.workspaceFolders?.[0];
      const repoName = workspaceFolder ? workspaceFolder.name : path10.basename(this.gitService.getCwd()) || "Project";
      if (!isRepo) {
        this.view.webview.postMessage({
          type: "status",
          payload: {
            files: [],
            changesCount: 0,
            unversionedCount: 0,
            recentMessages: [],
            stashes: [],
            repoName
          }
        });
        return;
      }
      await this.gitService.unmaskAllAssumeUnchanged();
      const [statusEntries, mergeMsg, recentMessages, stashes, totalDiff, cachedDiff, conflictInfo] = await Promise.all([
        this.gitService.getStatus(),
        this.gitService.getMergeMessage(),
        this.gitService.getRecentCommitMessages(10),
        this.gitService.getStashes(),
        this.gitService.exec(["diff", "HEAD"]).catch(() => ""),
        this.gitService.exec(["diff", "--cached"]).catch(() => ""),
        this.gitService.getConflictInfo().catch(() => ({
          hasConflicts: false,
          isMerging: false,
          isRebasing: false,
          yoursBranch: "",
          theirsBranch: "",
          conflicts: []
        }))
      ]);
      const totalChangesMap = this.parseChangesPerFile(totalDiff);
      const stagedChangesMap = this.parseChangesPerFile(cachedDiff);
      const files = statusEntries.map((entry) => {
        const filePath = entry.path;
        const fileName = path10.basename(filePath);
        const fileDir = path10.dirname(filePath);
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
      const changesFiles = files.filter((f) => !f.isUntracked).sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }) || a.path.localeCompare(b.path));
      const unversionedFiles = files.filter((f) => f.isUntracked).sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }) || a.path.localeCompare(b.path));
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
          stashes,
          conflictInfo,
          repoName
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
    if (!diffText || !diffText.trim())
      return map;
    const fileSections = diffText.split(/^diff --git /m);
    for (const section of fileSections) {
      if (!section.trim())
        continue;
      const match = section.match(/^a\/(.*?)\s+b\/(.*?)(?:\n|$)/);
      if (!match)
        continue;
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
        const filePath = typeof msg.payload === "string" ? msg.payload : msg.payload?.filePath;
        const jumpDiff = typeof msg.payload === "object" ? Boolean(msg.payload?.jumpDiff) : false;
        const fromFileList = typeof msg.payload === "object" ? Boolean(msg.payload?.fromFileList) : false;
        const direction = typeof msg.payload === "object" ? msg.payload?.direction || 1 : 1;
        if (filePath) {
          const panel = CommitReviewPanel.createOrShow(
            this.extensionUri,
            this.gitService,
            filePath,
            this.getReviewFilesList(filePath),
            () => this.refresh()
          );
          if (jumpDiff) {
            panel.focusAndJumpDiff(direction, fromFileList);
          }
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
          vscode13.window.showErrorMessage(`Stage failed: ${err.message}`);
        }
        break;
      }
      case "stageFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0)
          return;
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
          vscode13.window.showErrorMessage(`Stage failed: ${err.message}`);
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
          vscode13.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case "unstageFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0)
          return;
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
          vscode13.window.showErrorMessage(`Unstage failed: ${err.message}`);
        }
        break;
      }
      case "rollbackFiles": {
        const filePaths = msg.payload;
        if (!filePaths || filePaths.length === 0)
          return;
        const confirm = await vscode13.window.showWarningMessage(
          `Rollback changes in ${filePaths.length} file(s)? This cannot be undone.`,
          { modal: true },
          "Rollback"
        );
        if (confirm !== "Rollback")
          return;
        try {
          await this.gitService.rollbackFiles(filePaths);
          vscode13.window.showInformationMessage(`Rolled back ${filePaths.length} file(s).`);
          await this.refresh();
        } catch (err) {
          vscode13.window.showErrorMessage(`Rollback failed: ${err.message}`);
        }
        break;
      }
      case "jumpToSource": {
        const filePath = msg.payload;
        if (filePath) {
          const fullPath = path10.join(this.gitService.getCwd(), filePath);
          if (fs8.existsSync(fullPath)) {
            vscode13.commands.executeCommand("vscode.open", vscode13.Uri.file(fullPath));
          }
        }
        break;
      }
      case "deleteFile": {
        const filePath = msg.payload;
        if (!filePath)
          return;
        const fileName = path10.basename(filePath);
        const confirm = await vscode13.window.showWarningMessage(
          `Are you sure you want to delete "${fileName}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete")
          return;
        try {
          const fullPath = path10.join(this.gitService.getCwd(), filePath);
          if (fs8.existsSync(fullPath)) {
            if (fs8.statSync(fullPath).isDirectory()) {
              fs8.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs8.unlinkSync(fullPath);
            }
          }
          await this.gitService.exec(["rm", "-f", "--cached", filePath]).catch(() => {
          });
          await this.refresh();
          vscode13.window.showInformationMessage(`Deleted ${fileName}`);
        } catch (err) {
          vscode13.window.showErrorMessage(`Delete failed: ${err.message}`);
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
          vscode13.window.showErrorMessage(`Apply patch failed: ${err.message}`);
        }
        break;
      }
      case "commit": {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitFiles(message, files, amend);
          vscode13.window.showInformationMessage("Committed successfully.");
          this.view?.webview.postMessage({ type: "commitSuccess" });
          await this.refresh();
          vscode13.commands.executeCommand("intellij-git.refreshBranches");
        } catch (err) {
          vscode13.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case "commitAndPush": {
        const { message, files, amend } = msg.payload;
        try {
          await this.gitService.commitFiles(message, files, amend);
          vscode13.window.showInformationMessage("Committed successfully.");
          this.view?.webview.postMessage({ type: "commitSuccess" });
          await this.refresh();
          vscode13.commands.executeCommand("intellij-git.refreshBranches");
          await this.openPushDialog();
        } catch (err) {
          vscode13.window.showErrorMessage(`Commit failed: ${err.message}`);
        }
        break;
      }
      case "openPushDialog": {
        await this.openPushDialog(msg.payload?.branch);
        break;
      }
      case "executePush": {
        const { branch, targetBranch, force, setUpstream, remote, tags } = msg.payload || {};
        try {
          await this.gitService.push(branch, force, setUpstream, remote, tags, targetBranch);
          vscode13.window.showInformationMessage(`Pushed ${branch || "branch"} successfully to ${remote || "remote"}.`);
          await this.refresh();
          vscode13.commands.executeCommand("intellij-git.refreshBranches");
          this.view?.webview.postMessage({ type: "pushSuccess" });
        } catch (err) {
          vscode13.window.showErrorMessage(`Push failed: ${err.message}`);
          this.view?.webview.postMessage({ type: "pushError", payload: { error: err.message } });
        }
        break;
      }
      case "acceptYours": {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptYours(filePath);
          vscode13.window.showInformationMessage(`Accepted Yours for '${filePath}'`);
          await this.refresh();
        } catch (err) {
          vscode13.window.showErrorMessage(`Accept Yours failed: ${err.message}`);
        }
        break;
      }
      case "acceptTheirs": {
        const { path: filePath } = msg.payload;
        try {
          await this.gitService.acceptTheirs(filePath);
          vscode13.window.showInformationMessage(`Accepted Theirs for '${filePath}'`);
          await this.refresh();
        } catch (err) {
          vscode13.window.showErrorMessage(`Accept Theirs failed: ${err.message}`);
        }
        break;
      }
      case "openMergeEditor": {
        const { path: filePath } = msg.payload;
        try {
          await MergeEditorPanel.createOrShow(this.extensionUri, this.gitService, filePath);
        } catch (err) {
          vscode13.window.showErrorMessage(`Failed to open merge editor: ${err.message}`);
        }
        break;
      }
      case "abortMerge": {
        const confirmed = await vscode13.window.showWarningMessage(
          "Are you sure you want to abort the current merge/rebase? All uncommitted merge changes will be lost.",
          { modal: true },
          "Abort"
        );
        if (confirmed === "Abort") {
          try {
            await this.gitService.abortMerge();
            vscode13.window.showInformationMessage("Merge/rebase aborted.");
            await this.refresh();
          } catch (err) {
            vscode13.window.showErrorMessage(`Abort failed: ${err.message}`);
          }
        }
        break;
      }
      case "openConflictsDialog": {
        this.openConflictsDialog();
        break;
      }
      case "generateAiCommitMessage": {
        const { files } = msg.payload || {};
        const checkedFiles = Array.isArray(files) ? files : [];
        try {
          const finalMessage = await generateAiCommitMessage(this.gitService, checkedFiles);
          if (finalMessage) {
            this.view?.webview.postMessage({
              type: "setCommitMessage",
              payload: { message: finalMessage }
            });
          } else {
            this.view?.webview.postMessage({ type: "generateAiError" });
            vscode13.window.showWarningMessage("No commit message was generated by AI.");
          }
        } catch (err) {
          this.view?.webview.postMessage({ type: "generateAiError" });
          vscode13.window.showErrorMessage(`Failed to generate commit message: ${err.message}`);
        } finally {
          await this.refresh();
        }
        break;
      }
      case "openDiffInEditor": {
        const filePath = msg.payload;
        try {
          const leftUri = GitContentProvider.makeUri("HEAD", filePath);
          const rightUri = vscode13.Uri.file(path10.join(this.gitService.getCwd(), filePath));
          const fileName = path10.basename(filePath);
          await vscode13.commands.executeCommand("vscode.diff", leftUri, rightUri, `${fileName} (HEAD \u2194 Working Tree)`);
        } catch (err) {
          vscode13.window.showErrorMessage(`Open diff editor failed: ${err.message}`);
        }
        break;
      }
      case "createStash": {
        const msgText = await vscode13.window.showInputBox({
          prompt: "Stash message (optional)",
          placeHolder: "WIP on feature..."
        });
        if (msgText === void 0)
          return;
        try {
          await this.gitService.stashSave(msgText);
          vscode13.window.showInformationMessage("Stashed local changes.");
          await this.refresh();
        } catch (err) {
          vscode13.window.showErrorMessage(`Stash failed: ${err.message}`);
        }
        break;
      }
      case "stashPop": {
        const idx = msg.payload;
        try {
          await this.gitService.stashPop(idx);
          vscode13.window.showInformationMessage(`Applied and dropped ${idx}`);
        } catch (err) {
          const raw = err?.message || String(err);
          if (raw.includes("CONFLICT") || raw.includes("conflict") || raw.includes("Merge conflict")) {
            vscode13.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              "Resolve Conflicts"
            ).then((res) => {
              if (res === "Resolve Conflicts") {
                vscode13.commands.executeCommand("intellij-git.resolveConflicts");
              }
            });
          } else {
            vscode13.window.showErrorMessage(`Stash pop failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case "stashApply": {
        const idx = msg.payload;
        try {
          await this.gitService.stashApply(idx);
          vscode13.window.showInformationMessage(`Applied ${idx}`);
        } catch (err) {
          const raw = err?.message || String(err);
          if (raw.includes("CONFLICT") || raw.includes("conflict") || raw.includes("Merge conflict")) {
            vscode13.window.showWarningMessage(
              `Stash applied with merge conflicts. Resolve them in the merge editor.`,
              "Resolve Conflicts"
            ).then((res) => {
              if (res === "Resolve Conflicts") {
                vscode13.commands.executeCommand("intellij-git.resolveConflicts");
              }
            });
          } else {
            vscode13.window.showErrorMessage(`Stash apply failed: ${err.message}`);
          }
        } finally {
          await this.refresh();
        }
        break;
      }
      case "stashDrop": {
        const idx = msg.payload;
        const confirm = await vscode13.window.showWarningMessage(
          `Drop stash ${idx}?`,
          { modal: true },
          "Drop"
        );
        if (confirm !== "Drop")
          return;
        try {
          await this.gitService.stashDrop(idx);
          vscode13.window.showInformationMessage(`Dropped ${idx}`);
          await this.refresh();
        } catch (err) {
          vscode13.window.showErrorMessage(`Stash drop failed: ${err.message}`);
        }
        break;
      }
      case "openLog": {
        vscode13.commands.executeCommand("intellij-git.openLog");
        break;
      }
      case "collapseView": {
        vscode13.commands.executeCommand("workbench.action.toggleSidebarVisibility");
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
      vscode13.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode13.Uri.joinPath(this.extensionUri, "dist", "webview", "commit", "commit.css")
    );
    const nonce = getNonce();
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
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  async openConflictsDialog() {
    await ConflictsDialogPanel.createOrShow(this.extensionUri, this.gitService);
  }
  async openPushDialog(branch) {
    await PushDialogPanel.createOrShow(this.extensionUri, this.gitService, branch);
  }
};

// src/views/rebasePanel.ts
var vscode14 = __toESM(require("vscode"));
var RebasePanel = class _RebasePanel {
  constructor(panel, extensionUri, gitService, rebaseHandler, baseHash) {
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.rebaseHandler = rebaseHandler;
    this.baseHash = baseHash;
    this.disposables = [];
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
  static {
    this.viewType = "intellij-git.rebasePanel";
  }
  static createOrShow(extensionUri, gitService, rebaseHandler, baseHash) {
    if (_RebasePanel.currentPanel) {
      _RebasePanel.currentPanel.panel.reveal();
      return;
    }
    const panel = vscode14.window.createWebviewPanel(
      _RebasePanel.viewType,
      "Interactive Rebase",
      vscode14.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode14.Uri.joinPath(extensionUri, "dist", "webview")
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
      vscode14.window.showErrorMessage(`Failed to load commits for rebase: ${err.message}`);
    }
  }
  async handleMessage(msg) {
    switch (msg.type) {
      case "startRebase": {
        const todoItems = msg.payload;
        this.panel.webview.postMessage({ type: "rebaseStarted" });
        const result = await this.rebaseHandler.executeRebase(this.baseHash, todoItems);
        if (result.success) {
          vscode14.window.showInformationMessage("Rebase completed successfully.");
          this.panel.dispose();
        } else if (result.error === "conflict") {
          vscode14.window.showWarningMessage(
            "Rebase paused due to conflicts. Resolve them and continue.",
            "Open Merge Editor"
          ).then((choice) => {
            if (choice === "Open Merge Editor") {
              vscode14.commands.executeCommand("intellij-git.resolveConflicts");
            }
          });
          this.panel.dispose();
        } else {
          vscode14.window.showErrorMessage(`Rebase failed: ${result.error}`);
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
          vscode14.window.showInformationMessage("Rebase aborted.");
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
      vscode14.Uri.joinPath(this.extensionUri, "dist", "webview", "rebase", "rebase.js")
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
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
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
var vscode15 = __toESM(require("vscode"));
var BranchTreeProvider = class {
  constructor(gitService, extensionUri) {
    this.gitService = gitService;
    this.extensionUri = extensionUri;
    this._onDidChangeTreeData = new vscode15.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  refresh() {
    this._onDidChangeTreeData.fire(void 0);
  }
  getTreeItem(element) {
    const collapsible = element.children ? vscode15.TreeItemCollapsibleState.Expanded : vscode15.TreeItemCollapsibleState.None;
    const item = new vscode15.TreeItem(element.label, collapsible);
    switch (element.type) {
      case "category":
        if (element.label === "Tags" && this.extensionUri) {
          item.iconPath = {
            light: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "branchLabel.svg"),
            dark: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "branchLabel_dark.svg")
          };
        } else if (this.extensionUri) {
          item.iconPath = {
            light: vscode15.Uri.joinPath(this.extensionUri, "resources", "vcs", "branch.svg"),
            dark: vscode15.Uri.joinPath(this.extensionUri, "resources", "vcs", "branch_dark.svg")
          };
        } else {
          item.iconPath = new vscode15.ThemeIcon(
            element.label === "Tags" ? "tag" : "git-branch"
          );
        }
        break;
      case "remote-group":
        item.iconPath = new vscode15.ThemeIcon("cloud");
        break;
      case "branch-current":
        if (this.extensionUri) {
          item.iconPath = {
            light: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "currentBranchFavoriteLabel.svg"),
            dark: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "currentBranchFavoriteLabel.svg")
          };
        } else {
          item.iconPath = new vscode15.ThemeIcon("star-full");
        }
        item.description = element.hash?.slice(0, 7);
        item.contextValue = "branch-current";
        break;
      case "branch-local":
      case "branch-remote":
        if (this.extensionUri) {
          item.iconPath = {
            light: vscode15.Uri.joinPath(this.extensionUri, "resources", "vcs", "branch.svg"),
            dark: vscode15.Uri.joinPath(this.extensionUri, "resources", "vcs", "branch_dark.svg")
          };
        } else {
          item.iconPath = new vscode15.ThemeIcon("git-branch");
        }
        item.description = element.hash?.slice(0, 7);
        item.contextValue = element.type;
        break;
      case "tag":
        if (this.extensionUri) {
          item.iconPath = {
            light: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "branchLabel.svg"),
            dark: vscode15.Uri.joinPath(this.extensionUri, "resources", "icons", "branchLabel_dark.svg")
          };
        } else {
          item.iconPath = new vscode15.ThemeIcon("tag");
        }
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
var vscode16 = __toESM(require("vscode"));
var path11 = __toESM(require("path"));
var fs9 = __toESM(require("fs"));
var DEFAULT_DATA = {
  changelists: [{ name: "Default", files: [] }],
  active: "Default"
};
var ChangelistTreeProvider = class {
  constructor(gitService, workspaceRoot, extensionUri) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    this.extensionUri = extensionUri;
    this._onDidChangeTreeData = new vscode16.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.data = DEFAULT_DATA;
    const vscodePath = path11.join(workspaceRoot, ".vscode");
    this.dataPath = path11.join(vscodePath, "changelists.json");
    this.load();
  }
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
      const item = new vscode16.TreeItem(
        element.name,
        vscode16.TreeItemCollapsibleState.Expanded
      );
      item.contextValue = element.active ? "changelist-active" : "changelist";
      if (this.extensionUri) {
        item.iconPath = {
          light: vscode16.Uri.joinPath(this.extensionUri, "resources", "vcs", "changelist.svg"),
          dark: vscode16.Uri.joinPath(this.extensionUri, "resources", "vcs", "changelist_dark.svg")
        };
      } else {
        item.iconPath = new vscode16.ThemeIcon(
          element.active ? "folder-active" : "folder"
        );
      }
      if (element.active) {
        item.description = "(active)";
      }
      return item;
    } else {
      const item = new vscode16.TreeItem(
        path11.basename(element.path),
        vscode16.TreeItemCollapsibleState.None
      );
      item.description = path11.dirname(element.path);
      item.contextValue = "changelist-file";
      item.resourceUri = vscode16.Uri.joinPath(
        vscode16.Uri.file(this.workspaceRoot),
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
      name = await vscode16.window.showInputBox({
        prompt: "Changelist name",
        placeHolder: "Feature: ..."
      });
    }
    if (!name)
      return;
    if (this.data.changelists.some((c) => c.name === name)) {
      vscode16.window.showWarningMessage(`Changelist "${name}" already exists.`);
      return;
    }
    this.data.changelists.push({ name, files: [] });
    this.save();
    this._onDidChangeTreeData.fire(void 0);
  }
  async deleteChangelist(name) {
    if (name === "Default") {
      vscode16.window.showWarningMessage("Cannot delete the Default changelist.");
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
      vscode16.window.showWarningMessage(`Changelist "${clName}" has no files.`);
      return;
    }
    const message = await vscode16.window.showInputBox({
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
      vscode16.window.showInformationMessage(`Committed changelist "${clName}".`);
    } catch (err) {
      vscode16.window.showErrorMessage(`Commit failed: ${err.message}`);
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
        if (entry.path === ".vscode" || entry.path.startsWith(".vscode/") || entry.path.includes("changelists.json")) {
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
          (f) => statusPaths.has(f) && !f.startsWith(".vscode/") && !f.includes("changelists.json")
        );
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
      if (fs9.existsSync(this.dataPath)) {
        const raw = fs9.readFileSync(this.dataPath, "utf-8");
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
        (f) => !f.startsWith(".vscode/") && !f.includes("changelists.json")
      );
    }
  }
  save() {
    try {
      const dir = path11.dirname(this.dataPath);
      if (!fs9.existsSync(dir)) {
        fs9.mkdirSync(dir, { recursive: true });
      }
      fs9.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch {
    }
  }
};

// src/providers/blameDecorations.ts
var vscode17 = __toESM(require("vscode"));

// src/git/blameParser.ts
var import_child_process4 = require("child_process");
var import_util3 = require("util");
var execFileAsync3 = (0, import_util3.promisify)(import_child_process4.execFile);
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
    decorationType = vscode17.window.createTextEditorDecorationType({
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
    this.disposables = [];
    this.blameData = /* @__PURE__ */ new Map();
    this.disposables.push(
      vscode17.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (this.isEnabled(e.textEditor)) {
          this.updateDecorations(e.textEditor);
        }
      })
    );
    this.disposables.push(
      vscode17.workspace.onDidSaveTextDocument((doc) => {
        const relativePath = vscode17.workspace.asRelativePath(doc.uri);
        invalidateBlameCache(relativePath);
        this.blameData.delete(doc.uri.toString());
        const editor = vscode17.window.visibleTextEditors.find(
          (e) => e.document.uri.toString() === doc.uri.toString()
        );
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode17.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isEnabled(editor)) {
          this.updateDecorations(editor);
        }
      })
    );
    this.disposables.push(
      vscode17.window.onDidChangeTextEditorSelection((e) => {
        if (e.kind !== vscode17.TextEditorSelectionChangeKind.Mouse)
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
        vscode17.commands.executeCommand("intellij-git.showCommitInLog", blameLine.hash);
      })
    );
    this.disposables.push(
      vscode17.languages.registerHoverProvider("*", {
        provideHover: (doc, pos) => this.provideHover(doc, pos)
      })
    );
  }
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
    const relativePath = vscode17.workspace.asRelativePath(editor.document.uri);
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
          range: new vscode17.Range(lineNum, 0, lineNum, 0),
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
    const md = new vscode17.MarkdownString();
    md.appendMarkdown(`**${blameLine.summary}**

`);
    md.appendMarkdown(`- **Author:** ${blameLine.author} (${blameLine.authorEmail})
`);
    md.appendMarkdown(`- **Date:** ${new Date(blameLine.authorDate).toLocaleString()}
`);
    md.appendMarkdown(`- **Commit:** \`${blameLine.hash.slice(0, 10)}\`
`);
    return new vscode17.Hover(md);
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
var vscode18 = __toESM(require("vscode"));
var path12 = __toESM(require("path"));
var fs10 = __toESM(require("fs"));
var MergeProvider = class {
  constructor(gitService, workspaceRoot) {
    this.gitService = gitService;
    this.workspaceRoot = workspaceRoot;
    this.disposables = [];
    this.statusBarItem = vscode18.window.createStatusBarItem(
      vscode18.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "intellij-git.resolveConflicts";
    this.disposables.push(this.statusBarItem);
    this.checkForConflicts();
  }
  refresh() {
    this.checkForConflicts();
  }
  async checkForConflicts() {
    try {
      const gitDir = path12.join(this.workspaceRoot, ".git");
      const hasConflictState = fs10.existsSync(path12.join(gitDir, "MERGE_HEAD")) || fs10.existsSync(path12.join(gitDir, "rebase-apply")) || fs10.existsSync(path12.join(gitDir, "rebase-merge")) || fs10.existsSync(path12.join(gitDir, "CHERRY_PICK_HEAD"));
      if (!hasConflictState) {
        this.statusBarItem.hide();
        return;
      }
      const unmerged = await this.gitService.getUnmergedFiles();
      if (unmerged.length > 0) {
        this.statusBarItem.text = `$(git-merge) ${unmerged.length} conflict${unmerged.length > 1 ? "s" : ""}`;
        this.statusBarItem.tooltip = `${unmerged.length} unresolved merge conflict(s). Click to resolve.`;
        this.statusBarItem.backgroundColor = new vscode18.ThemeColor(
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
      vscode18.window.showInformationMessage("No merge conflicts to resolve.");
      return;
    }
    const items = unmerged.map((f) => ({
      label: f,
      description: "Unresolved conflict"
    }));
    const selected = await vscode18.window.showQuickPick(items, {
      placeHolder: `${unmerged.length} file(s) with conflicts \u2014 select to resolve`,
      canPickMany: false
    });
    if (selected) {
      const fileUri = vscode18.Uri.joinPath(
        vscode18.Uri.file(this.workspaceRoot),
        selected.label
      );
      await vscode18.commands.executeCommand("vscode.open", fileUri);
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
        vscode18.window.showInformationMessage(`Auto-staged ${staged} resolved file(s).`);
      }
    } catch (err) {
      vscode18.window.showErrorMessage(`Failed: ${err.message}`);
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
  log = vscode19.window.createOutputChannel("IntelliJ Git");
  context.subscriptions.push(log);
  log.appendLine("IntelliJ Git extension activating...");
  const workspaceFolder = vscode19.workspace.workspaceFolders?.[0];
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
    vscode19.workspace.registerTextDocumentContentProvider(
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
    vscode19.window.registerWebviewViewProvider(
      GraphViewProvider.viewType,
      graphViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  const commitViewProvider = new CommitViewProvider(context.extensionUri, gitService, log);
  context.subscriptions.push(
    vscode19.window.registerWebviewViewProvider(
      CommitViewProvider.viewType,
      commitViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  const branchTree = new BranchTreeProvider(gitService, context.extensionUri);
  const branchTreeView = vscode19.window.createTreeView("intellij-git.branches", {
    treeDataProvider: branchTree,
    showCollapseAll: true
  });
  context.subscriptions.push(branchTreeView);
  const changelistTree = new ChangelistTreeProvider(gitService, workspaceRoot, context.extensionUri);
  const changelistTreeView = vscode19.window.createTreeView("intellij-git.changelists", {
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
    vscode19.commands.registerCommand("intellij-git.openCommit", () => {
      vscode19.commands.executeCommand("intellij-git.commitView.focus");
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.openLog", () => {
      vscode19.commands.executeCommand("intellij-git.logView.focus");
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.showCommitInLog", (hash) => {
      vscode19.commands.executeCommand("intellij-git.logView.focus");
      graphViewProvider.selectCommit(hash);
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.toggleBlame", () => {
      const editor = vscode19.window.activeTextEditor;
      if (editor) {
        log.appendLine(`Toggling blame on ${editor.document.uri.fsPath}`);
        blameProvider.toggle(editor);
      } else {
        vscode19.window.showWarningMessage("No active text editor for blame.");
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.interactiveRebase", async (baseHash) => {
      if (!baseHash) {
        baseHash = await vscode19.window.showInputBox({
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
    vscode19.commands.registerCommand("intellij-git.refreshBranches", async () => {
      try {
        await gitService.refreshRemoteBranchNames();
      } catch {
      }
      branchTree.refresh();
      graphViewProvider.refresh();
      vscode19.window.showInformationMessage("Branches refreshed.");
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.checkoutBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      await handleCheckoutWithConflictResolution(gitService, ref, () => graphViewProvider.refresh());
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.createBranch", async (node) => {
      const name = await vscode19.window.showInputBox({
        prompt: "New branch name",
        placeHolder: "feature/..."
      });
      if (!name)
        return;
      try {
        await gitService.createBranch(name, node?.ref);
        graphViewProvider.refresh();
        vscode19.window.showInformationMessage(`Created and checked out ${name}`);
      } catch (err) {
        vscode19.window.showErrorMessage(`Create branch failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.deleteBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      const confirm = await vscode19.window.showWarningMessage(
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
        vscode19.window.showErrorMessage(`Delete failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.mergeBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      await handleMergeWithConflictResolution(gitService, ref, () => graphViewProvider.refresh());
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.rebaseBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      await handleRebaseWithConflictResolution(gitService, ref, () => graphViewProvider.refresh());
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.compareBranch", async (node) => {
      const ref = node?.ref;
      if (!ref)
        return;
      try {
        const current = await gitService.getCurrentBranch();
        await vscode19.commands.executeCommand("git.branchCompare", ref, current);
      } catch (err) {
        vscode19.window.showErrorMessage(`Compare failed: ${err.message}`);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.resolveConflicts", async () => {
      await ConflictsDialogPanel.createOrShow(context.extensionUri, gitService);
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.openMergeEditor", async (filePath) => {
      if (filePath) {
        await MergeEditorPanel.createOrShow(context.extensionUri, gitService, filePath);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.acceptAllNonConflicting", () => {
      mergeProvider.acceptAllNonConflicting();
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.pushDialog", async (branch) => {
      await PushDialogPanel.createOrShow(context.extensionUri, gitService, branch);
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.newChangelist", () => {
      changelistTree.createChangelist();
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.deleteChangelist", (node) => {
      if (node?.name) {
        changelistTree.deleteChangelist(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.setActiveChangelist", (node) => {
      if (node?.name) {
        changelistTree.setActive(node.name);
      }
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.commitChangelist", (node) => {
      changelistTree.commitChangelist(node?.name);
    })
  );
  context.subscriptions.push(
    vscode19.commands.registerCommand("intellij-git.refreshChangelists", () => {
      changelistTree.refresh();
    })
  );
  function debounce(fn, delay = 600) {
    let timer;
    return (...args) => {
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  const gitWatcher = vscode19.workspace.createFileSystemWatcher(
    new vscode19.RelativePattern(workspaceRoot, ".git/{HEAD,refs/**,packed-refs}")
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
    if (fsPath.endsWith(".lock") || fsPath.includes("/objects/") || fsPath.includes("\\objects\\") || fsPath.endsWith("COMMIT_EDITMSG")) {
      return;
    }
    onGitChange();
  };
  gitWatcher.onDidChange(handleGitFsEvent);
  gitWatcher.onDidCreate(handleGitFsEvent);
  gitWatcher.onDidDelete(handleGitFsEvent);
  context.subscriptions.push(gitWatcher);
  try {
    const gitExt = vscode19.extensions.getExtension("vscode.git");
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
    if (doc && CommitReviewPanel.currentPanel && doc.uri.fsPath.endsWith(CommitReviewPanel.currentPanel.getCurrentFilePath())) {
      CommitReviewPanel.currentPanel.refresh();
    }
  }, 400);
  context.subscriptions.push(
    vscode19.workspace.onDidSaveTextDocument((doc) => {
      if (doc.uri.scheme === "file") {
        onWorkspaceFileChange(doc);
      }
    })
  );
  context.subscriptions.push(
    vscode19.workspace.onDidCreateFiles(() => onWorkspaceFileChange()),
    vscode19.workspace.onDidDeleteFiles(() => onWorkspaceFileChange()),
    vscode19.workspace.onDidRenameFiles(() => onWorkspaceFileChange())
  );
  context.subscriptions.push(
    vscode19.window.onDidChangeWindowState((e) => {
      if (e.focused) {
        commitViewProvider.refresh();
        branchTree.refresh();
        mergeProvider.refresh();
      } else {
        graphViewProvider.closeAllMenus();
        commitViewProvider.closeAllMenus();
      }
    }),
    vscode19.window.onDidChangeActiveTextEditor(() => {
      graphViewProvider.closeAllMenus();
      commitViewProvider.closeAllMenus();
    }),
    vscode19.window.onDidChangeTextEditorSelection(() => {
      graphViewProvider.closeAllMenus();
      commitViewProvider.closeAllMenus();
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
