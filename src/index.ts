import dotenv from 'dotenv';
import { generateChangelog } from './generateChangelog';
import { getMergedPullRequests } from './getMergedPullRequests';

dotenv.config();

const config = {
  ghAccessToken: process.env['GITHUB_ACCESS_TOKEN'] || '',
};

const run = async () => {
  const pullRequests = await getMergedPullRequests({
    accessToken: config.ghAccessToken,
    repoOwner: 'dkoujelev',
    repoName: 'changelog-generator',
    versionLabel: '0.0.2',
  });

  console.log(generateChangelog(pullRequests, '0.0.2'));
};

run();
