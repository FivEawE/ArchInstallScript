import { derivedConfig } from './derivedConfig';
import { exec, execChroot, execChrootUser } from './utils';

export const finalize = async () => {
  const { AIS_SUDO_LINE } = derivedConfig;

  // Snapper
  await execChrootUser(
    `yay -S --noconfirm snapper grub-btrfs snap-pac snap-pac-grub`
  );
  await execChroot(`snapper --no-dbus -c root create-config /`);
  await execChroot(
    `sed -i /TIMELINE_CREATE=/cTIMELINE_CREATE="yes" /etc/snapper/configs/root`
  );

  // sudo
  await execChroot(
    `sed -i ${AIS_SUDO_LINE}s/"%wheel ALL=(ALL) NOPASSWD: ALL"/"# %wheel ALL=(ALL) NOPASSWD: ALL"/ /etc/sudoers`
  );
  const AIS_SUDO_LINE2 = (
    await execChroot(
      `grep -n "^# %wheel ALL=(ALL) ALL" /etc/sudoers | cut -d : -f 1`
    )
  )
    .toString()
    .trim();
  await execChroot(`sed -i ${AIS_SUDO_LINE2}s/"# "// /etc/sudoers`);

  await execChroot(`mkinitcpio -P`);
  await execChroot(`grub-mkconfig -o /boot/grub/grub.cfg`);

  await exec(`genfstab -U /mnt >> /mnt/etc/fstab`);
};
