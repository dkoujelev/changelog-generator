import { PullRequest, Config, ConfigChangelogSection } from './types';
import { format } from 'date-fns';
import path from 'path';

const getChangelogEntries = (pullRequests: PullRequest[], labels: string[], jiraUrl?: string) => {
  return pullRequests
    .filter((pr) => labels.some((label) => pr.labels.includes(label)))
    .map((pr) => toChangelogEntry(pr, jiraUrl));
};

const getChangelogEntriesWithoutSectionLabels = (
  pullRequests: PullRequest[],
  changelogSections: ConfigChangelogSection[],
  jiraUrl?: string
) => {
  const sectionLabels = changelogSections.flatMap(({ labels }) => labels || []);

  return pullRequests
    .filter((pr) => !sectionLabels.some((label) => pr.labels.includes(label)))
    .map((pr) => toChangelogEntry(pr, jiraUrl));
};

const jiraIdRegex = /\[DEV-[0-9]{3,5}\]/g;

const toChangelogEntry = ({ title, number, url }: PullRequest, jiraUrl?: string) => {
  const titleText = jiraUrl ? title.replace(jiraIdRegex, '') : title;

  return toSafeMarkdownString(`- ${titleText} ${markdownUrl(`(#${number})`, url)} ${jiraTasks(title, jiraUrl)}`);
};

const toSafeMarkdownString = (text: string) => {
  return text.replace(/</g, '\\<');
};

const jiraTasks = (title: string, jiraUrl?: string) => {
  if (!jiraUrl) {
    return '';
  }

  const jiraIds = title.match(jiraIdRegex);

  return jiraIds?.map((id) => markdownUrl(id, path.join(jiraUrl, toJiraId(id)))).join(' ') ?? '';
};

const toJiraId = (id: string) => {
  return id.replace(/\[|\]/g, '');
};

const markdownUrl = (text: string | number, url: string) => {
  return `[${text}](${url})`;
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
  const { changelogSections, versionTitle, jiraUrl } = config;

  const today = format(new Date(), 'yyyy-MM-dd');
  let changelog = `# ${versionTitle} (${today}) \n`;

  let hasChanges = false;

  changelogSections.forEach(({ title, labels, leftovers }) => {
    const entries = leftovers
      ? getChangelogEntriesWithoutSectionLabels(pullRequests, changelogSections, jiraUrl)
      : getChangelogEntries(pullRequests, labels!, jiraUrl);

    if (entries.length) {
      hasChanges = true;
      changelog += generateChangelogSection(title, entries);
    }
  });

  if (!hasChanges) {
    return '';
  }

  changelog += '\n';

  return changelog;
};
