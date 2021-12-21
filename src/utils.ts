import { spawn } from 'child_process';

import config from '../config.json';

const { AIS_USER } = config;

export const exec = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`# ${command}`);
    const processOutput = spawn(command, { shell: true });
    const outputBuffer: string[] = [];

    processOutput.stdout.on('data', (data) => {
      outputBuffer.push(data);
      process.stdout.write(`${data}`);
    });

    processOutput.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    processOutput.on('close', (code) => {
      if (!code) {
        resolve(outputBuffer.join());
      } else {
        reject();
      }
    });

    return processOutput;
  });
};

export const execChroot = (command: string) => {
  return exec(`arch-chroot /mnt ${command}`);
};

export const execChrootUser = (command: string) => {
  return exec(`arch-chroot /mnt su - ${AIS_USER} -c ${`"${command}"`}`);
};
