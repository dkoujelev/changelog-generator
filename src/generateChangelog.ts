import { PullRequest, Config, ConfigChangelogSection } from './types';
import { format } from 'date-fns';

const getChangelogEntries = (pullRequests: PullRequest[], labels: string[]) => {
  return pullRequests.filter((pr) => labels.some((label) => pr.labels.includes(label))).map(toChangelogEntry);
};

const getChangelogEntriesWithoutSectionLabels = (
  pullRequests: PullRequest[],
  changelogSections: ConfigChangelogSection[]
) => {
  const sectionLabels = changelogSections.flatMap(({ labels }) => labels || []);

  return pullRequests.filter((pr) => !sectionLabels.some((label) => pr.labels.includes(label))).map(toChangelogEntry);
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
  const { changelogSections, versionTitle } = config;

  const today = format(new Date(), 'yyyy-MM-dd');
  let changelog = `# ${versionTitle} (${today}) \n`;

  let hasChanges = false;

  changelogSections.forEach(({ title, labels, leftovers }) => {
    const entries = leftovers
      ? getChangelogEntriesWithoutSectionLabels(pullRequests, changelogSections)
      : getChangelogEntries(pullRequests, labels!);

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
