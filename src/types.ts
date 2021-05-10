export type PullRequest = {
  url: string;
  number: number;
  title: string;
  labels: string[];
};

export type Config = {
  githubAccessToken: string;
  repos: ConfigRepo[];
  changelogSections: ConfigChangelogSection[];

  versionTitle?: string;
  changelogPath?: string;
  jiraUrl?: string;
};

export type ConfigRepo = {
  owner: string;
  name: string;

  versionLabel?: string;

  includeLabels?: string[];
  excludeLabels?: string[];
};

export type ConfigChangelogSection = {
  title: string;
  labels?: string[];
  leftovers?: boolean;
};
