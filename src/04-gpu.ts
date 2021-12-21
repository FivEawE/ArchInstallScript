import config from '../config.json';
import { execChroot } from './utils';

export const setupGpu = async () => {
  const { AIS_GPU } = config;

  if (AIS_GPU === 'nvidia') {
    await execChroot('pacman -S --noconfirm nvidia nvidia-utils');
    await execChroot(
      `sed -i /^MODULES=/c"MODULES=(nvidia nvidia_modeset nvidia_uvm nvidia_drm)" /etc/mkinitcpio.conf`
    );
  } else if (AIS_GPU === 'qxl') {
    await execChroot(
      `sed -i /^MODULES=/c"MODULES=(${AIS_GPU})" /etc/mkinitcpio.conf`
    );
  }
};
