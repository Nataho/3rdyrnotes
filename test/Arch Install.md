---
tags:
  - linux
  - arch
  - install-guide
---

# Arch Install — My Way

Personal step-by-step guide for installing Arch Linux with GRUB + KDE Plasma.

## 1. Create the bootable USB (Rufus)

1. Download the Arch Linux ISO from [archlinux.org](https://archlinux.org)
2. Download Rufus from their official website
3. Open Rufus
4. Select the flashdrive to use
5. Select the Arch Linux ISO
6. Set **partition scheme: GPT**, **target system: UEFI (non CSM)**
7. Press **START**
8. Once it is finished, it is ready for the next step

> [!warning] The flashdrive will get wiped
> Everything on the selected USB drive will be erased.

## 2. Boot to the flashdrive

1. Insert the flashdrive into a functioning USB port
2. While turning on the PC, spam the button which opens the BIOS
	- Common keys: `F2`, `F10`, `F11`, `Del`
3. Locate the **Boot** section
	1. Disable secure boot (can be under **Security** too)
	2. Set the bootable flashdrive to boot first, **OR** select the flashdrive to boot directly
	3. Save and quit
4. This should enter Arch Linux

## 3. Pre-install checks

### 3.1 Check boot mode

> [!important] Needed for the GRUB step later
> Run `ls /sys/firmware/efi/efivars`
> - Files are listed → **UEFI** (use the UEFI notes below)
> - No such directory → legacy **BIOS** (use the BIOS notes below)

### 3.2 Connect to the internet

**Wi-Fi**

1. Type `iwctl` to enter **iwd**
2. Inside iwd, type `device list` to show the list of devices
3. Check if the Wi-Fi adapter is powered on
	- If not: `adapter <adapter> set-property Powered on`
4. To show available networks: `station <name> get-networks`
5. To connect: `station <name> connect <SSID>` and enter the password
6. Exit iwd by typing `exit` while in `[iwd]#`

**Ethernet** — just plug in the cable.

### 3.3 Verify connection

```bash
ping -c 3 google.com
```

Stops by itself after 3 pings, or press `Ctrl+C` to cancel.

### 3.4 Check the clock

```bash
timedatectl
```

The clock should be correct and NTP active (newer ISOs have it on by default).

## 4. Identify the disk

> [!danger] Do this first so you don't wipe the wrong drive

```bash
lsblk
# or
fdisk -l
```

- Target is usually `/dev/sda` or `/dev/nvme0n1` (nvme partitions look like `nvme0n1p1`)
- The examples below assume: `sda1` = EFI, `sda2` = swap, `sda3` = main — adjust to your own numbering

## 5. Make partitions

For a more beginner friendly interface:

```bash
cfdisk /dev/sda
```

1. If asked, choose the **gpt** label type
2. Create this layout:

| Partition | Size | Type in cfdisk |
| --------- | ---- | -------------- |
| EFI System Partition | 512M–1G | EFI System |
| swap | as big as RAM (needed for hibernate), or skip | Linux swap |
| main | rest of the space | Linux filesystem |

3. Select **Write**, type `yes`, then **Quit**

## 6. Format partitions

> [!warning] This wipes each partition

```bash
mkfs.ext4 /dev/sda3    # main partition
mkfs.fat -F 32 /dev/sda1   # boot / EFI partition
mkswap /dev/sda2       # swap
```

## 7. Mount the partitions

```bash
mkdir -p /mnt/boot/efi    # create the folder BEFORE mounting
mount /dev/sda3 /mnt
mount /dev/sda1 /mnt/boot/efi
swapon /dev/sda2
```

## 8. Install the base system

```bash
pacstrap /mnt base linux linux-firmware sof-firmware base-devel grub efibootmgr nano networkmanager intel-ucode
```

> [!note] CPU microcode
> Use `intel-ucode` for Intel CPUs, `amd-ucode` for AMD CPUs.

## 9. Generate fstab

```bash
genfstab -U /mnt >> /mnt/etc/fstab
cat /mnt/etc/fstab
```

- `-U` = use UUIDs (more reliable than device names)
- Confirm all 3 partitions are listed

## 10. Enter the installed system

```bash
arch-chroot /mnt
```

## 11. Timezone

```bash
ln -sf /usr/share/zoneinfo/Asia/Manila /etc/localtime
date
hwclock --systohc
```

## 12. Localization

1. `nano /etc/locale.gen`
2. Uncomment `en_PH.UTF-8 UTF-8`
3. `Ctrl+O` to save, `Ctrl+X` to exit
4. Run `locale-gen`
5. `nano /etc/locale.conf` — enter `LANG=en_PH.UTF-8`, save and exit
6. `nano /etc/vconsole.conf` — enter `KEYMAP=us`

> [!note] Common mistake
> It is `/etc/locale.conf`, **NOT** `/etc/local.conf`.

## 13. Hostname

1. `nano /etc/hostname`
2. Enter the desired PC name

## 14. Root password

```bash
passwd
```

## 15. Add user

```bash
useradd -m -G wheel -s /bin/bash <USERNAME>
passwd <USERNAME>
```

## 16. Enable sudo for the user

1. `EDITOR=nano visudo`
2. Uncomment `%wheel ALL=(ALL:ALL) ALL`

## 17. Enable services + install GRUB

```bash
systemctl enable NetworkManager
```

**UEFI** (the case if step 3.1 listed files):

```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
```

**BIOS only**:

```bash
grub-install --target=i386-pc /dev/sda
```

> [!note] "Whole drive, NOT a partition"
> That rule only applies to BIOS installs. UEFI installs go to the EFI partition instead.

Generate the GRUB config:

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

> [!tip] Only if dual booting with Windows
> `pacman -S os-prober`, then `nano /etc/default/grub` and uncomment `GRUB_DISABLE_OS_PROBER=false` **before** running `grub-mkconfig`.

## 18. Exit the archISO environment

```bash
exit
umount -R /mnt
swapoff /dev/sda2
reboot
```

> [!warning] Use `umount -R /mnt`
> NOT `umount -a` — that unmounts everything, including the live USB. Remove the flashdrive once the PC restarts.

## 19. Boot into the fresh install

1. Log in to the user with the password (plain text console is normal)
2. Update everything first:

```bash
sudo pacman -Syu
```

3. Install a graphical environment (when asked, pick **sddm** as display manager):

```bash
sudo pacman -S plasma sddm
```

4. Install apps:

```bash
sudo pacman -S kitty kate firefox
```

5. Enable the display manager and reboot:

```bash
sudo systemctl enable sddm
reboot
```

6. Should land in the SDDM login screen → Plasma desktop

## 20. Add user to extra groups (optional)

```bash
sudo usermod -aG audio,video,storage,input <USERNAME>
```

> [!note]
> Mostly not needed since systemd handles permissions — only add if something does not work.
