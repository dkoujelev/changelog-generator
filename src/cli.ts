#!/usr/bin/env node
import { generateChangelog } from './generateChangelog';
import { getMergedPullRequests } from './getMergedPullRequests';
import { Config } from './types';
import { getConfig, createConfigFile } from './config';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { Spinner } from 'clui';
import fs from 'fs';

const runCli = async (): Promise<void> => {
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

  const changelogSection = generateChangelog(config, pullRequests);

  if (changelogSection) {
    writeToFile(config.changelogPath!, changelogSection);
  } else {
    console.log(chalk.blue('No changes found'));
  }
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
  if (config.changelogPath) {
    return;
  }

  const userInput = await prompt([
    {
      name: 'changelogPath',
      message: 'Path to changelog file:',
      default: './CHANGELOG.md',
    },
  ]);

  config.changelogPath = userInput.changelogPath;
};

const writeToFile = (fileName: string, changelogSection: string) => {
  if (!fs.existsSync(fileName)) {
    try {
      fs.writeFileSync(fileName, changelogSection);
      console.log(chalk.green('Changelog created!'));
    } catch (err) {
      console.error(chalk.red("Couldn't create changelog."));
    }

    return;
  }

  try {
    const oldChangelog = fs.readFileSync(fileName);
    const fd = fs.openSync(fileName, 'w+');
    const newChangelogEntry = Buffer.from(changelogSection);

    // Write new changelog entry to the begining of the file
    fs.writeSync(fd, newChangelogEntry, 0, newChangelogEntry.length, 0);

    // Append the old file content
    fs.writeSync(fd, oldChangelog, 0, oldChangelog.length, newChangelogEntry.length);

    fs.closeSync(fd);
    console.log(chalk.green('Added changes to changelog!'));
  } catch (err) {
    console.error(chalk.red("Couldn't add changed to changelog."));
  }
};

runCli();
