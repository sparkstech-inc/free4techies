// issue-to-pr.mjs — convert a "resource-submission" GitHub issue into an
// auto-merging pull request.
//
// Runs inside .github/workflows/issue-submission.yml. It:
//   1. Reads the issue body (provided via env or stdin).
//   2. Extracts the ```json payload block the submit form generated.
//   3. Validates the single entry + the full resulting document.
//   4. Checks for duplicate URLs.
//   5. Fetches the current frontend/public/resources.json from the default branch.
//   6. Inserts the entry, sorts, and commits to a new branch.
//   7. Opens a PR and auto-merges it (squash) if valid.
//   8. On validation failure, comments on the issue with the errors and
//      closes it.
//
// Uses the GitHub REST API via fetch with the GITHUB_TOKEN (available in
// the Action environment). No Octokit dependency — just native fetch.
//
// Required env:
//   GITHUB_TOKEN        — the workflow's GITHUB_TOKEN (or a PAT with repo+PR)
//   GITHUB_REPOSITORY   — "owner/repo" (set automatically in Actions)
//   ISSUE_NUMBER        — the issue that triggered this run
//   ISSUE_TITLE         — the issue title
//   ISSUE_BODY          — the issue body (or read from stdin)
//   ISSUE_AUTHOR        — the issue author login (for credit)

import {
  validateSingleEntry,
  validateResources,
  findDuplicate,
  insertEntry,
  sortResources,
} from './validate-resources.mjs';

const API = 'https://api.github.com';
const RESOURCES_PATH = 'frontend/public/resources.json';

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
  return v;
}

function log(...args) {
  console.log('[issue-to-pr]', ...args);
}

// Extract the first ```json fenced block from the issue body.
function extractJsonBlock(body) {
  if (!body) return null;
  const re = /```json\s*([\s\S]*?)```/i;
  const m = body.match(re);
  if (!m) return null;
  return m[1].trim();
}

async function gh(path, { method = 'GET', body, token } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const err = new Error(`GitHub API ${method} ${url} failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function commentOnIssue(repo, issueNumber, body, token) {
  return gh(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: { body },
    token,
  });
}

async function closeIssue(repo, issueNumber, token) {
  return gh(`/repos/${repo}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: { state: 'closed' },
    token,
  });
}

async function main() {
  const token = env('GITHUB_TOKEN');
  const repo = env('GITHUB_REPOSITORY');
  const issueNumber = env('ISSUE_NUMBER');
  const issueTitle = env('ISSUE_TITLE', false) || `Submission #${issueNumber}`;
  let issueBody = env('ISSUE_BODY', false);
  const issueAuthor = env('ISSUE_AUTHOR', false) || 'anonymous';

  // Allow piping the body via stdin if not in env.
  if (!issueBody) {
    log('No ISSUE_BODY env var; reading from stdin…');
    issueBody = await readStdin();
  }

  log(`Processing issue #${issueNumber} in ${repo}`);

  // 1. Extract JSON payload
  const jsonText = extractJsonBlock(issueBody);
  if (!jsonText) {
    const msg =
      '❌ I couldn't find a valid ```json code block in this issue. ' +
      'Please use the submit form at https://free4techies.pages.dev/submit ' +
      'to generate a properly formatted submission, or include a ```json block ' +
      'with the fields: categoryName, entry{name,url,description,tier,tags}.';
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('No JSON block found — commented + closed.');
    return;
  }

  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (e) {
    const msg = `❌ The JSON in this issue is not valid JSON:\n\n\`\`\`\n${e.message}\n\`\`\`\n\nPlease re-submit via the [submit form](https://free4techies.pages.dev/submit).`;
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('Invalid JSON — commented + closed.');
    return;
  }

  if (!payload || !payload.entry || !payload.categoryName) {
    const msg =
      '❌ The submission JSON is missing required fields. It must contain `categoryName` and `entry` (with `name`, `url`, `description`, `tier`).';
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('Missing fields — commented + closed.');
    return;
  }

  // 2. Validate the single entry
  const { valid: entryValid, errors: entryErrors } = validateSingleEntry(payload.entry);
  if (!entryValid) {
    const msg =
      '❌ Your submission has validation errors:\n\n' +
      entryErrors.map((e) => `- ${e}`).join('\n') +
      '\n\nPlease fix these and re-submit via the [submit form](https://free4techies.pages.dev/submit).';
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('Entry invalid — commented + closed:', entryErrors.join('; '));
    return;
  }

  // 3. Fetch current resources.json from the default branch
  const [owner, name] = repo.split('/');
  const repoInfo = await gh(`/repos/${repo}`, { token });
  const baseBranch = repoInfo.default_branch;
  log(`Default branch: ${baseBranch}`);

  const fileRes = await gh(
    `/repos/${repo}/contents/${encodeURIComponent(RESOURCES_PATH)}?ref=${baseBranch}`,
    { token }
  );
  const currentSha = fileRes.sha;
  const currentContent = Buffer.from(fileRes.content, 'base64').toString('utf8');
  let data = JSON.parse(currentContent);

  // 4. Duplicate check
  const dup = findDuplicate(data, payload.entry.url);
  if (dup) {
    const msg =
      `❌ This resource looks like a duplicate.\n\n` +
      `**${payload.entry.name}** (\`${new URL(payload.entry.url).hostname}\`) ` +
      `already exists as **${dup.name}** in the **${dup.category}** category.\n\n` +
      `If this is a genuinely different resource on the same domain, please ` +
      `open a pull request manually and explain the difference.`;
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('Duplicate URL — commented + closed.');
    return;
  }

  // 5. Insert + sort + validate full document
  // Credit the submitter (prefer issue author over the form field).
  const entry = {
    ...payload.entry,
    submittedBy: payload.entry.submittedBy || issueAuthor,
  };
  data = insertEntry(
    data,
    { categoryName: payload.categoryName, newCategoryDescription: payload.newCategoryDescription },
    entry
  );
  data = sortResources(data);
  // Update meta timestamp
  data.meta = {
    ...(data.meta || {}),
    lastUpdated: new Date().toISOString(),
  };

  const { valid: docValid, errors: docErrors } = validateResources(data);
  if (!docValid) {
    const msg =
      '❌ After inserting your entry, the full resources.json failed validation:\n\n' +
      docErrors.map((e) => `- ${e}`).join('\n') +
      '\n\nThis is likely a bug — please open an issue describing what happened.';
    await commentOnIssue(repo, issueNumber, msg, token);
    await closeIssue(repo, issueNumber, token);
    log('Full document invalid after insert — commented + closed:', docErrors.join('; '));
    return;
  }

  // 6. Create a branch, commit, open PR, auto-merge
  const newContent = JSON.stringify(data, null, 2) + '\n';
  const branchName = `resource/${slugify(payload.entry.name)}-${issueNumber}`;

  // Get the base branch SHA
  const baseRef = await gh(`/repos/${repo}/git/refs/heads/${baseBranch}`, { token });
  const baseSha = baseRef.object.sha;
  log(`Base ${baseBranch} SHA: ${baseSha}`);

  // Create the new branch
  try {
    await gh(`/repos/${repo}/git/refs`, {
      method: 'POST',
      body: { ref: `refs/heads/${branchName}`, sha: baseSha },
      token,
    });
  } catch (e) {
    if (e.status === 422) {
      log(`Branch ${branchName} already exists — reusing.`);
    } else {
      throw e;
    }
  }
  log(`Created branch ${branchName}`);

  // Commit the updated resources.json to the new branch
  await gh(`/repos/${repo}/contents/${encodeURIComponent(RESOURCES_PATH)}`, {
    method: 'PUT',
    body: {
      message: `Add "${payload.entry.name}" to ${payload.categoryName}\n\nSubmitted via issue #${issueNumber} by @${issueAuthor}`,
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      branch: branchName,
      sha: currentSha,
    },
    token,
  });
  log(`Committed ${RESOURCES_PATH} to ${branchName}`);

  // Open the PR
  const pr = await gh(`/repos/${repo}/pulls`, {
    method: 'POST',
    body: {
      title: `Add "${payload.entry.name}" to ${payload.categoryName}`,
      head: branchName,
      base: baseBranch,
      body: [
        `## New resource`,
        '',
        `**${payload.entry.name}** — _${payload.entry.tier}_`,
        '',
        payload.entry.description,
        '',
        `URL: ${payload.entry.url}`,
        payload.entry.tags?.length ? `Tags: ${payload.entry.tags.join(', ')}` : '',
        '',
        `Closes #${issueNumber}`,
        '',
        `Submitted by @${issueAuthor}${payload.submitterNote ? `\n\n> ${payload.submitterNote}` : ''}`,
      ].filter(Boolean).join('\n'),
      labels: ['resource-submission', 'auto-merge'],
    },
    token,
  });
  log(`Opened PR #${pr.number}: ${pr.html_url}`);

  // 7. Auto-merge (squash) if the branch is mergeable
  // Give GitHub a moment to compute mergeability.
  await sleep(3000);
  let merged = false;
  try {
    await gh(`/repos/${repo}/pulls/${pr.number}/merge`, {
      method: 'PUT',
      body: {
        commit_title: `Add "${payload.entry.name}" to ${payload.categoryName} (#${pr.number})`,
        merge_method: 'squash',
      },
      token,
    });
    merged = true;
    log(`Auto-merged PR #${pr.number}`);
  } catch (e) {
    log(`Auto-merge failed (will try again on checks): ${e.message}`);
    // Leave the PR open; auto-merge-pr.yml will retry on check completion.
  }

  // 8. Comment on the issue + close it
  const statusLine = merged
    ? `✅ **Merged!** Your resource is now live in the directory. Thanks for contributing! 🎉`
    : `⏳ A pull request was opened and is being merged automatically. You can track it here: ${pr.html_url}`;
  const thanksMsg =
    `Thanks for your submission, @${issueAuthor}!\n\n` +
    statusLine +
    `\n\n**Resource:** [${payload.entry.name}](${payload.entry.url})\n` +
    `**Category:** ${payload.categoryName}\n` +
    `**Tier:** ${payload.entry.tier}\n` +
    `**Pull request:** ${pr.html_url}`;
  await commentOnIssue(repo, issueNumber, thanksMsg, token);
  await closeIssue(repo, issueNumber, token);
  log('Done.');
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  try {
    const repo = process.env.GITHUB_REPOSITORY;
    const issueNumber = process.env.ISSUE_NUMBER;
    const token = process.env.GITHUB_TOKEN;
    if (repo && issueNumber && token) {
      await commentOnIssue(
        repo,
        issueNumber,
        `⚠️ Something went wrong while processing this submission:\n\n\`\`\`\n${e.message}\n\`\`\`\n\nThe maintainers have been notified. Sorry about that!`,
        token
      );
    }
  } catch (_) {
    // best effort
  }
  process.exit(1);
});
