import { createAndMountPartitions } from './01-partitions';
import { installAndConfigureBase } from './02-base';
import { installDesktopEnvironment } from './03-gnome';
import { setupGpu } from './04-gpu';
import { finalize } from './05-finalization';
import { exec } from './utils';

const run = async () => {
  // Init
  await exec(`loadkeys sk-qwertz`);
  await exec(`timedatectl set-ntp true`);

  // Partitions
  await createAndMountPartitions();

  // Base
  await installAndConfigureBase();

  // DE
  await installDesktopEnvironment();

  // GPU
  await setupGpu();

  // Finalization
  await finalize();

  await exec(`umount -R /mnt`);
  console.log('Installation done. Please reboot the PC.');
};

run();
