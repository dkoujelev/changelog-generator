import { graphql } from '@octokit/graphql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  ghAccessToken: process.env['GITHUB_ACCESS_TOKEN'],
};

const getReleaseTags = async () => {
  const {
    repository: {
      releases: { nodes: releaseTags },
    },
  } = await graphql(
    `
      {
        repository(owner: "dkoujelev", name: "changelog-generator") {
          releases(first: 20, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              tagName
              publishedAt
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `bearer ${config.ghAccessToken}`,
      },
    }
  );

  return releaseTags;
};

const getPullRequests = async () => {
  const {
    repository: {
      pullRequests: { nodes: pullRequests },
    },
  } = await graphql(
    `
      {
        repository(owner: "dkoujelev", name: "changelog-generator") {
          pullRequests(first: 100, states: [MERGED], baseRefName: "main") {
            nodes {
              title
              labels(first: 10) {
                nodes {
                  name
                }
              }
              baseRefName
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `bearer ${config.ghAccessToken}`,
      },
    }
  );

  return pullRequests;
};

const run = async () => {
  const tags = await getReleaseTags();
  const pullRequests = await getPullRequests();

  console.log(JSON.stringify(tags, null, 2));
  console.log(JSON.stringify(pullRequests, null, 2));
};

run();
