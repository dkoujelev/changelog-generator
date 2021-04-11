import { generateChangelog } from './../generateChangelog';
import { getMergedPullRequests } from './../getMergedPullRequests';
import { Config } from './../types';
import { getConfig, createConfigFile } from './config';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { Spinner } from 'clui';

export const runCli = async (): Promise<void> => {
  clear();
  console.log(chalk.green(figlet.textSync('Changelog generator', { horizontalLayout: 'full' })));

  const config = getConfig();

  if (!config) {
    createConfigFile();
    process.exit(0);
  }

  await inquireVersionTitle(config);
  await inquireVersionLabels(config);
  await inquireChangelogPath(config);

  const spinner = new Spinner('Fetching pull requests');
  spinner.start();

  const pullRequests = await getMergedPullRequests(config);

  spinner.stop();

  console.log(chalk.greenBright('Pull requests fetched \n'));

  console.log(generateChangelog(config, pullRequests));
};

const inquireVersionTitle = async (config: Config): Promise<void> => {
  const defaultValue = config.versionTitle || undefined;

  const userInput = await prompt([
    {
      name: 'versionTitle',
      message: 'Changelog title for version:',
      default: defaultValue,
      validate: (value) => {
        return value?.trim() || defaultValue ? true : 'Changelog version title is required.';
      },
    },
  ]);

  config.versionTitle = userInput.versionTitle;
};

const inquireVersionLabels = async (config: Config): Promise<void> => {
  let prevVersionLabel = '';

  for (const repo of config.repos) {
    const defaultValue = repo.versionLabel || prevVersionLabel || undefined;

    const userInput = await prompt([
      {
        name: 'versionLabel',
        message: `Version label for ${repo.owner}/${repo.name}:`,
        default: defaultValue,
        validate: (value) => {
          if (value?.trim()) {
            prevVersionLabel = value;
            return true;
          }

          return prevVersionLabel ? true : 'Version label is required.';
        },
      },
    ]);

    repo.versionLabel = userInput.versionLabel;
  }
};

const inquireChangelogPath = async (config: Config): Promise<void> => {
  const defaultValue = config.changelogPath || './CHANGELOG.md';

  const userInput = await prompt([
    {
      name: 'changelogPath',
      message: 'Path to changelog file:',
      default: defaultValue,
    },
  ]);

  config.changelogPath = userInput.changelogPath;
};
