import { PullRequest } from './types';
import { format } from 'date-fns';

const getChangelogEntriesFromPullRequest = (pullRequests: PullRequest[], label: string) => {
  return pullRequests.filter(createLabelFilter(label)).map(toChangelogEntry);
};

const createLabelFilter = (label: string) => ({ labels }: PullRequest) => {
  return labels.includes(label);
};

const toChangelogEntry = (pullRequest: PullRequest) => {
  // const jiraIdRegex = /\[DEV-[0-9]{3,4}\]/g;
  return `- ${pullRequest.title}`;
};

const generateChangelogSection = (label: string, entries: string[]) => {
  let section = '';

  if (entries.length) {
    section += `\n## ${label} \n`;
    section += entries.join('\n');
    section += '\n';
  }

  return section;
};

export const generateChangelog = (pullRequests: PullRequest[], version: string): string => {
  const newEntries = getChangelogEntriesFromPullRequest(pullRequests, 'new');
  const changedEntries = getChangelogEntriesFromPullRequest(pullRequests, 'changed');
  const fixedEntries = getChangelogEntriesFromPullRequest(pullRequests, 'fixed');

  if (!newEntries.length && !changedEntries.length && !fixedEntries.length) {
    console.error('No changes found');

    return '';
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  let changelog = `# ${version} (${today}) \n`;

  changelog += generateChangelogSection('New', newEntries);
  changelog += generateChangelogSection('Changed', changedEntries);
  changelog += generateChangelogSection('Fixed', fixedEntries);

  return changelog;
};
