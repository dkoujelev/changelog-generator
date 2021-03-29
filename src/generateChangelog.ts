import { PullRequest, Config } from './types';
import { format } from 'date-fns';

const getChangelogEntriesFromPullRequest = (pullRequests: PullRequest[], labels: string[]) => {
  return pullRequests.filter(createLabelFilter(labels)).map(toChangelogEntry);
};

const createLabelFilter = (filterLabels: string[]) => ({ labels }: PullRequest) => {
  return filterLabels.some((filterLabel) => labels.includes(filterLabel));
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

export const generateChangelog = (config: Config, pullRequests: PullRequest[]): string => {
  const { versionTitle, changelogSections } = config;

  const today = format(new Date(), 'yyyy-MM-dd');
  let changelog = `# ${versionTitle} (${today}) \n`;

  let hasChanges = false;

  changelogSections.forEach(({ title, labels }) => {
    const entries = getChangelogEntriesFromPullRequest(pullRequests, labels);

    if (entries.length) {
      hasChanges = true;
      changelog += generateChangelogSection(title, entries);
    }
  });

  if (!hasChanges) {
    console.log('No changes found');
    return '';
  }

  return changelog;
};
