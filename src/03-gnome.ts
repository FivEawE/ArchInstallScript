import config from '../config.json';
import { derivedConfig } from './derivedConfig';
import { execChroot, execChrootUser } from './utils';

export const installDesktopEnvironment = async () => {
  const { AIS_GPU } = config;
  const { AIS_HOOKS_LINE } = derivedConfig;

  await execChroot(
    `pacman -S --noconfirm pipewire-media-session networkmanager gnome gnome-tweaks noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra ttf-liberation`
  );
  await execChroot(`pacman -Rdd --noconfirm gdm libgdm`);
  await execChroot(`systemctl enable NetworkManager`);

  // Keyboard
  await execChrootUser(
    `dbus-launch gsettings set org.gnome.desktop.input-sources sources \\\"[('xkb', 'sk')]\\\"`
  );
  await execChrootUser(
    `dbus-launch gsettings set org.gnome.system.locale region 'sk_SK.UTF-8'`
  );

  // Capitaine cursors
  await execChroot(`pacman -S --noconfirm capitaine-cursors`);
  await execChrootUser(
    `dbus-launch gsettings set org.gnome.desktop.interface cursor-theme 'capitaine-cursors'`
  );

  // Hide unused apps
  const AIS_DENTRIES_SOURCE = '/usr/share/applications';
  const AIS_DENTRIES_DESTINATION = '.local/share/applications';
  await execChrootUser(`mkdir -p ${AIS_DENTRIES_DESTINATION}`);
  await execChrootUser(
    `cp ${AIS_DENTRIES_SOURCE}/qv4l2.desktop ${AIS_DENTRIES_DESTINATION}`
  );
  await execChrootUser(
    `cp ${AIS_DENTRIES_SOURCE}/qvidcap.desktop ${AIS_DENTRIES_DESTINATION}`
  );
  await execChrootUser(
    `cp ${AIS_DENTRIES_SOURCE}/bvnc.desktop ${AIS_DENTRIES_DESTINATION}`
  );
  await execChrootUser(
    `cp ${AIS_DENTRIES_SOURCE}/avahi-discover.desktop ${AIS_DENTRIES_DESTINATION}`
  );
  await execChrootUser(
    `cp ${AIS_DENTRIES_SOURCE}/bssh.desktop ${AIS_DENTRIES_DESTINATION}`
  );
  await execChrootUser(
    `echo NoDisplay=true >> ${AIS_DENTRIES_DESTINATION}/qv4l2.desktop`
  );
  await execChrootUser(
    `echo NoDisplay=true >> ${AIS_DENTRIES_DESTINATION}/qvidcap.desktop`
  );
  await execChrootUser(
    `echo NoDisplay=true >> ${AIS_DENTRIES_DESTINATION}/bvnc.desktop`
  );
  await execChrootUser(
    `echo NoDisplay=true >> ${AIS_DENTRIES_DESTINATION}/avahi-discover.desktop`
  );
  await execChrootUser(
    `echo NoDisplay=true >> ${AIS_DENTRIES_DESTINATION}/bssh.desktop`
  );

  // Plymouth install
  await execChrootUser(`yay -S --noconfirm plymouth-git gdm-plymouth`);
  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/udev/"udev plymouth"/ /etc/mkinitcpio.conf`
  );
  await execChroot(
    `sed -i ${AIS_HOOKS_LINE}s/encrypt/plymouth-encrypt/ /etc/mkinitcpio.conf`
  );
  await execChroot(
    `sed -i /^MODULES=/c"MODULES=(${AIS_GPU})" /etc/mkinitcpio.conf`
  );
  await execChroot(`systemctl enable gdm`);
  await execChroot(
    `sed -i /GRUB_CMDLINE_LINUX_DEFAULT=/cGRUB_CMDLINE_LINUX_DEFAULT='"loglevel=3 quiet splash vt.global_cursor_default=0"' /etc/default/grub`
  );
  await execChroot(
    `cp /usr/share/plymouth/arch-logo.png /usr/share/plymouth/themes/spinner/watermark.png`
  );
};
