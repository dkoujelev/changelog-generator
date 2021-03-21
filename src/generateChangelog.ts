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

export const generateChangelog = (pullRequests: PullRequest[], version: string): string => {
  const newEntries = getChangelogEntriesFromPullRequest(pullRequests, 'new');
  const changedEntries = getChangelogEntriesFromPullRequest(pullRequests, 'changed');
  const fixedEntries = getChangelogEntriesFromPullRequest(pullRequests, 'fixed');

  if (!newEntries.length && !changedEntries.length && !fixedEntries.length) {
    console.error('No changes found');

    return '';
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  let changelogString = `# ${version} (${today}) \n`;

  if (newEntries.length) {
    changelogString += '\n## New \n';
    changelogString += newEntries.join('\n');
    changelogString += '\n';
  }

  if (changedEntries.length) {
    changelogString += '\n## Changed \n';
    changelogString += changedEntries.join('\n');
    changelogString += '\n';
  }

  if (fixedEntries.length) {
    changelogString += '\n## Fixed \n';
    changelogString += fixedEntries.join('\n');
    changelogString += '\n';
  }

  return changelogString;
};
