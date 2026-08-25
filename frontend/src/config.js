// config.js — single source of truth for repo coordinates & feature flags.
//
// These are baked into the static build. Override at build time with
// VITE_ env vars if you fork the project to your own repo.

const REPO_OWNER = import.meta.env.VITE_REPO_OWNER || 'sparkstech-inc';
const REPO_NAME = import.meta.env.VITE_REPO_NAME || 'free4techies';

export const config = {
  repoOwner: REPO_OWNER,
  repoName: REPO_NAME,
  repoUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
  // Pre-filled "new issue" URL for the resource-submission template.
  // The submit form appends a query string with the structured body.
  issueTemplateUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?assignees=&labels=resource-submission&template=resource-submission.yml&title=`,
  // Ad provider (optional). Set VITE_AD_PROVIDER at build time to enable.
  adProvider: import.meta.env.VITE_AD_PROVIDER || null,
  adClient: import.meta.env.VITE_AD_CLIENT || null,
  adSlot: import.meta.env.VITE_AD_SLOT || null,
};

export default config;
