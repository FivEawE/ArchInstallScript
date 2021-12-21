import config from '../config.json';
import { derivedConfig } from './derivedConfig';
import { exec } from './utils';

export const createAndMountPartitions = async () => {
  const { AIS_DEVICE, AIS_ENCRYPTION_KEY } = config;

  // Check for NVMe drives
  let AIS_DEVICE_PREPEND_P = '';
  if (AIS_DEVICE.substring(0, 8) === '/dev/nvm') {
    AIS_DEVICE_PREPEND_P = 'p';
  }

  derivedConfig.AIS_DEVICE_EFI = `${AIS_DEVICE}${AIS_DEVICE_PREPEND_P}1`;
  derivedConfig.AIS_DEVICE_BOOT = `${AIS_DEVICE}${AIS_DEVICE_PREPEND_P}2`;
  derivedConfig.AIS_DEVICE_LUKS = `${AIS_DEVICE}${AIS_DEVICE_PREPEND_P}3`;

  const { AIS_DEVICE_EFI, AIS_DEVICE_BOOT, AIS_DEVICE_LUKS } = derivedConfig;

  // Create partitions
  await exec(`sgdisk -Z ${AIS_DEVICE}`);
  await exec(`sgdisk -n 0:0:+600M -t 0:ef00 ${AIS_DEVICE}`);
  await exec(`sgdisk -n 0:0:+1G -t 0:8300 ${AIS_DEVICE}`);
  await exec(`sgdisk -n 0:0:0 -t 0:8300 ${AIS_DEVICE}`);
  await exec(`partprobe ${AIS_DEVICE}`);

  // Format partitions
  await exec(`mkfs.fat -F 32 ${AIS_DEVICE_EFI}`);
  await exec(`mkfs.ext4 -F ${AIS_DEVICE_BOOT}`);

  await exec(
    `echo -n ${AIS_ENCRYPTION_KEY} | cryptsetup luksFormat ${AIS_DEVICE_LUKS} -`
  );
  await exec(
    `echo -n ${AIS_ENCRYPTION_KEY} | cryptsetup open ${AIS_DEVICE_LUKS} cryptroot -`
  );
  await exec(`mkfs.btrfs -f /dev/mapper/cryptroot`);

  // Create BTRFS subvolumes
  await exec(`mount /dev/mapper/cryptroot /mnt`);

  await exec(`btrfs subvolume create /mnt/@`);
  await exec(`btrfs subvolume create /mnt/@home`);
  await exec(`btrfs subvolume create /mnt/@var_log`);
  await exec(`btrfs subvolume create /mnt/@var_cache_pacman_pkg`);
  await exec(`btrfs subvolume create /mnt/@var_tmp`);

  // Mount partitions
  await exec(`umount /mnt`);
  await exec(`mount -o compress=zstd,subvol=@ /dev/mapper/cryptroot /mnt`);

  await exec(`mkdir /mnt/home`);
  await exec(`mkdir -p /mnt/var/log`);
  await exec(`mkdir -p /mnt/var/cache/pacman/pkg`);
  await exec(`mkdir /mnt/tmp`);
  await exec(`mkdir /mnt/boot`);

  await exec(`mount -o subvol=@home /dev/mapper/cryptroot /mnt/home`);
  await exec(`mount -o subvol=@var_log /dev/mapper/cryptroot /mnt/var/log`);
  await exec(
    `mount -o subvol=@var_cache_pacman_pkg /dev/mapper/cryptroot /mnt/var/cache/pacman/pkg`
  );
  await exec(`mount -o subvol=@var_tmp /dev/mapper/cryptroot /mnt/tmp`);

  await exec(`mount ${AIS_DEVICE_BOOT} /mnt/boot`);
  await exec(`mkdir /mnt/boot/efi`);
  await exec(`mount ${AIS_DEVICE_EFI} /mnt/boot/efi`);
};
