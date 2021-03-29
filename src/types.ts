export type PullRequest = {
  title: string;
  labels: string[];
};

export type Config = {
  githubAccessToken: string;
  versionTitle: string;
  repos: ConfigRepo[];
  changelogSections: ConfigChangelogSection[];
};

export type ConfigRepo = {
  owner: string;
  name: string;
  versionLabel: string;
};

export type ConfigChangelogSection = {
  title: string;
  labels: string[];
};
