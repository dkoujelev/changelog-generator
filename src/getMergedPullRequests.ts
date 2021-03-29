import { graphql } from '@octokit/graphql';
import { PullRequest } from './types';

type PullRequestsResponse = {
  nodes: {
    title: string;
    labels: { nodes: { name: string }[] };
  }[];

  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
};

type Config = {
  accessToken: string;
  repoOwner: string;
  repoName: string;
  versionLabel: string;
};

type FetchMergedPullRequests = (config: Config, cursor?: string) => Promise<PullRequestsResponse>;

const fetchMergedPullRequests: FetchMergedPullRequests = async (
  { accessToken, repoName, repoOwner, versionLabel },
  cursor
) => {
  const after = cursor ? `, after: "${cursor}"` : '';
  const labels = `, labels: ["${versionLabel}"]`;

  const {
    repository: { pullRequests },
  } = await graphql(
    `
    {
      repository(owner: "${repoOwner}", name: "${repoName}") {
        pullRequests(first: 100, states: [MERGED] ${labels} ${after}) {
          nodes {
            title
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
        authorization: `bearer ${accessToken}`,
      },
    }
  );

  return pullRequests;
};

type GetMergedPullRequests = (config: Config) => Promise<PullRequest[]>;

export const getMergedPullRequests: GetMergedPullRequests = async (config) => {
  let hasUnfetchedPullRequests = true;
  let cursor: string | undefined;

  const prResponses: PullRequestsResponse[] = [];

  while (hasUnfetchedPullRequests) {
    const prResponse = await fetchMergedPullRequests(config, cursor);
    prResponses.push(prResponse);

    if (prResponse.pageInfo.hasNextPage) {
      cursor = prResponse.pageInfo.endCursor;
    } else {
      hasUnfetchedPullRequests = false;
    }
  }

  const pullRequests: PullRequest[] = prResponses.flatMap(({ nodes }) => {
    return nodes.map(({ title, labels }) => {
      return {
        title,
        labels: labels.nodes.map(({ name }) => name),
      };
    });
  });

  return pullRequests;
};
