import { getOrCreateConfig } from './cli/getConfig';
import { generateChangelog } from './generateChangelog';
import { getMergedPullRequests } from './getMergedPullRequests';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { Spinner } from 'clui';

const run = async () => {
  clear();

  const config = getOrCreateConfig();

  console.log(chalk.green(figlet.textSync('Changelog generator', { horizontalLayout: 'full' })));

  const spinner = new Spinner('Fetching pull requests');
  spinner.start();

  const pullRequests = await getMergedPullRequests(config);

  spinner.stop();

  console.log(chalk.greenBright('Pull requests fetched \n'));

  console.log(generateChangelog(config, pullRequests));
};

run();
