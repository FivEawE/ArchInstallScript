import config from '../config.json';
import { derivedConfig } from './derivedConfig';
import { exec, execChroot, execChrootUser } from './utils';

export const installAndConfigureBase = async () => {
  const { AIS_ADDITIONAL_PACKAGES, AIS_HOSTNAME, AIS_USER, AIS_PASSWORD } =
    config;
  const { AIS_DEVICE_LUKS } = derivedConfig;

  // Install base packages
  await exec(`pacstrap /mnt base linux linux-firmware util-linux base-devel \
			grub efibootmgr btrfs-progs reflector neovim sudo man-db man-pages \
			texinfo git bash-completion ${AIS_ADDITIONAL_PACKAGES}`);

  // Basic stuff
  await execChroot(
    `ln -sf /usr/share/zoneinfo/Europe/Bratislava /etc/localtime`
  );

  await execChroot(`hwclock --systohc`);

  await execChroot(`sed -i s/#en_US.UTF-8/en_US.UTF-8/ /etc/locale.gen`);
  await execChroot(`sed -i s/#sk_SK.UTF-8/sk_SK.UTF-8/ /etc/locale.gen`);
  await execChroot(`sh -c "echo LANG=en_US.UTF-8 > /etc/locale.conf"`);
  await execChroot(`locale-gen`);

  await execChroot(`sh -c "echo KEYMAP=sk-qwertz > /etc/vconsole.conf"`);
  await execChroot(`sh -c "echo ${AIS_HOSTNAME} > /etc/hostname"`);

  // Encrypt mkinitcpio hooks
  derivedConfig.AIS_HOOKS_LINE = (
    await execChroot(`grep -n ^HOOKS /etc/mkinitcpio.conf | cut -d : -f 1`)
  )
    .toString()
    .trim();

  const { AIS_HOOKS_LINE } = derivedConfig;

  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/" keyboard"// /etc/mkinitcpio.conf`
  );
  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/autodetect/"autodetect keyboard keymap"/ /etc/mkinitcpio.conf`
  );
  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/filesystems/"encrypt filesystems"/ /etc/mkinitcpio.conf`
  );

  // grub
  await execChroot(
    `sed -i /GRUB_CMDLINE_LINUX=/cGRUB_CMDLINE_LINUX='"cryptdevice=UUID=$(cryptsetup luksUUID ${AIS_DEVICE_LUKS}):cryptroot root=/dev/mapper/cryptroot"' /etc/default/grub`
  );
  await execChroot(
    `grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB`
  );

  // TRIM
  await execChroot(`systemctl enable fstrim.timer`);

  // sudo
  derivedConfig.AIS_SUDO_LINE = (
    await execChroot(
      `grep -n "^# %wheel ALL=(ALL) NOPASSWD: ALL" /etc/sudoers | cut -d : -f 1`
    )
  )
    .toString()
    .trim();
  const { AIS_SUDO_LINE } = derivedConfig;
  await execChroot(`sed -i ${AIS_SUDO_LINE}s/"# "// /etc/sudoers`);

  // Reflector
  await execChroot(`systemctl enable reflector.timer`);

  // User
  await execChroot(`useradd -m -G wheel ${AIS_USER}`);
  await execChroot(`sh -c "echo ${AIS_USER}:${AIS_PASSWORD} | chpasswd"`);
  //await execChroot(`sh -c "echo root:${AIS_PASSWORD} | chpasswd"`);

  // yay
  await execChrootUser(`git clone https://aur.archlinux.org/yay-bin.git`);
  await execChrootUser(`cd yay-bin && makepkg -si --noconfirm`);
  await execChrootUser(`rm -rf yay-bin`);
  await execChrootUser(
    `yay --save --answerclean All --answerdiff None --nodiffmenu --nocleanmenu`
  );

  // numlock
  await execChrootUser(`yay -S mkinitcpio-numlock`);
  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/modconf/"numlock modconf"/ /etc/mkinitcpio.conf`
  );
};
