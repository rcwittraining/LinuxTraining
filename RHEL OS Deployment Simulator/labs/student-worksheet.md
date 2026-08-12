# RHEL 10 Installation Lab — Student worksheet

Complete the browser simulator, then answer these questions. Bring this sheet (or a copy in your notes) to class.

## Part A — Guided install (simulator)

1. Boot **Install Red Hat Enterprise Linux 10.0** from GRUB.
2. Choose a language and open the **Installation Summary** hub.
3. Set **Time & Date** to the timezone your instructor assigned.
4. Under **Software Selection**, choose **Server** (or the environment on the board).
5. Under **Installation Destination**, select a disk, Automatic + LVM + XFS.
6. Set **hostname** to: `server1.lab.example.com` (unless told otherwise).
7. Set a **root password** (8+ characters) and create an **admin user**.
8. **Begin Installation**, wait, **Reboot**, and log in.
9. In the post-install terminal run:

```text
cat /etc/os-release
uname -r
hostnamectl
lsblk
df -hT
```

Record the kernel string and the mountpoints you see.

## Part B — Short answers

1. When does Anaconda actually write packages to disk?
2. What is the default filesystem for `/` on RHEL 10?
3. Which volume manager does Automatic partitioning typically use?
4. Why create a wheel (administrator) user even if root is enabled?
5. Name the two default RHEL yum/dnf repositories after a registered install.
6. Which service provides NTP on RHEL 10 (`timedatectl` / chrony)?
7. What GRUB entry would you use if the graphical installer failed to start? (rescue)

## Instructor scoring

The floating checklist auto-scores 9 tasks (saved in the browser). Screenshot the score before Reset.

| Task | Points |
|------|--------|
| Language → hub | 5 |
| Destination disk | 15 |
| Software selection | 10 |
| Hostname | 10 |
| Root password | 10 |
| Admin user | 15 |
| Timezone reviewed | 5 |
| Full install + reboot | 15 |
| First login | 15 |
| **Total** | **100** |
