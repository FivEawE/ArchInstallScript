# ArchInstallScript

An install script which installs and configures Arch Linux the way I like to use
it.

## Installation

```
curl -Lo ArchInstallScript.tar https://github.com/FivEawE/ArchInstallScript/tarball/master
mkdir ArchInstallScript
tar -xf ArchInstallScript.tar -C ArchInstallScript --strip-components=1

# Configure the script by editing ArchInstallScript/config.json

sh ArchInstallScript/init.sh
```

Installation assumes you are booted in the live environment.

## Configuration

Here is a list and explanation of values you can edit in the config:

- AIS_DEVICE - A disk where Arch will be installed. **Warning, it wipes the disk
  clean**.
- AIS_ENCRYPTION_KEY - Encryption key for the root.
- AIS_HOSTNAME - Hostname for the OS.
- AIS_USER - Name for the user account.
- AIS_PASSWORD - Password for the user account.
- AIS_ADDITIONAL_PACKAGES - Additional packages to install, e.g. `amd-ucode`.
- AIS_DE - Desktop environment to install. Only `GNOME` is supported.
- AIS_GPU - GPU the PC uses. Only `qxl` and `nvidia` are supported.
