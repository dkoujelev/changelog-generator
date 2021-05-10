import { graphql } from '@octokit/graphql';
import { PullRequest, Config, ConfigRepo } from './types';

type PullRequestsResponse = {
  nodes: PullRequestResponseNode[];

  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
};

type PullRequestResponseNode = {
  url: string;
  number: number;
  title: string;
  mergedAt: string;
  labels: { nodes: { name: string }[] };
};

type FetchMergedPullRequests = (
  githubAccessToken: string,
  repo: ConfigRepo,
  cursor?: string
) => Promise<PullRequestsResponse>;

const fetchMergedPullRequests: FetchMergedPullRequests = async (githubAccessToken, repo, cursor) => {
  const { owner, name, versionLabel } = repo;

  const after = cursor ? `, after: "${cursor}"` : '';
  const labels = `, labels: ["${versionLabel}"]`;

  const {
    repository: { pullRequests },
  } = await graphql(
    `
    {
      repository(owner: "${owner}", name: "${name}") {
        pullRequests(first: 100, states: [MERGED] ${labels} ${after}) {
          nodes {
            url
            number
            title
            mergedAt
            labels(first: 10) {
              nodes {
                name
              }
            }
          }

          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
    `,
    {
      headers: {
        authorization: `bearer ${githubAccessToken}`,
      },
    }
  );

  return pullRequests;
};

type GetMergedPullRequestsForRepo = (githubAccessToken: string, repo: ConfigRepo) => Promise<PullRequestResponseNode[]>;

const getMergedPullRequestsForRepo: GetMergedPullRequestsForRepo = async (githubAccessToken, repo) => {
  let hasUnfetchedPullRequests = true;
  let cursor: string | undefined;

  const prResponses: PullRequestsResponse[] = [];

  while (hasUnfetchedPullRequests) {
    const prResponse = await fetchMergedPullRequests(githubAccessToken, repo, cursor);
    prResponses.push(prResponse);

    if (prResponse.pageInfo.hasNextPage) {
      cursor = prResponse.pageInfo.endCursor;
    } else {
      hasUnfetchedPullRequests = false;
    }
  }

  const { excludeLabels, includeLabels } = repo;

  return prResponses
    .flatMap(({ nodes }) => nodes)
    .filter(({ labels: labelsResponse }) => {
      const labels = labelsResponse.nodes.map(({ name }) => name);

      if (excludeLabels?.some((excludeLabel) => labels.includes(excludeLabel))) {
        return false;
      }

      if (includeLabels?.some((includeLabel) => !labels.includes(includeLabel))) {
        return false;
      }

      return true;
    });
};

type GetMergedPullRequests = (config: Config) => Promise<PullRequest[]>;

export const getMergedPullRequests: GetMergedPullRequests = async (config) => {
  const { githubAccessToken, repos } = config;

  const fetchedPullRequests = await Promise.all(
    repos.map((repo) => getMergedPullRequestsForRepo(githubAccessToken, repo))
  );

  const mergedPullRequests: PullRequest[] = fetchedPullRequests
    .flatMap((pr) => pr)
    .sort(byMergeDate)
    .flatMap(({ url, number, title, labels }) => {
      return {
        url,
        number,
        title,
        labels: labels.nodes.map(({ name }) => name),
      };
    });

  return mergedPullRequests.flatMap((pr) => pr);
};

const byMergeDate = (a: PullRequestResponseNode, b: PullRequestResponseNode) => {
  if (a.mergedAt > b.mergedAt) {
    return -1;
  } else if (a.mergedAt < b.mergedAt) {
    return 1;
  }

  return 0;
};
