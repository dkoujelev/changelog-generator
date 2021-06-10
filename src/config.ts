import { Config } from './types';
import path from 'path';
import fs from 'fs';
import configTemplate from './changelogConfigTemplate.json';
import chalk from 'chalk';

export const getConfig = (): Config | null => {
  const configPath = path.join(process.cwd(), './changelogConfig.json');
  const configFound = fs.existsSync(configPath);

  if (!configFound) {
    return null;
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
};

export const createConfigFile = () => {
  const config: Config = configTemplate;

  try {
    fs.appendFileSync('changelogConfig.json', JSON.stringify(config, null, 2));
    console.log(chalk.blueBright('Created config file.'));
    console.log(chalk.blue('Please update the config file and run the command again.'));
  } catch (err) {
    console.error(chalk.red('Failed to create config file'));
    console.error(err);
  }
};
