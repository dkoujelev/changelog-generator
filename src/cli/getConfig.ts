import { Config } from './../types';
import path from 'path';
import fs from 'fs';
import configTemplate from './changelogConfigTemplate.json';
import chalk from 'chalk';

export const getOrCreateConfig = (): Config => {
  const configPath = path.join(process.cwd(), './changelogConfig.json');
  const configFound = fs.existsSync(configPath);

  let config: Config;

  if (configFound) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    config = createConfig();
  }

  return config;
};

const createConfig = () => {
  const config: Config = configTemplate;

  fs.appendFile('changelogConfig.json', JSON.stringify(config, null, 2), (err) => {
    if (err) {
      console.error(chalk.red('Failed to create config file'));
      console.error(err);
      process.exit(1);
    } else {
      console.log(chalk.blueBright('Created config file'));
      console.log(chalk.blue('Please update the config file and try again.'));
      process.exit(0);
    }
  });

  return config;
};
