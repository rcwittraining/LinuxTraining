# RHEL 10 Installation Lab Simulator

Browser-based **Anaconda-style** install lab for teaching Red Hat Enterprise Linux 10.

Students walk through GRUB → language → Installation Summary spokes → package install → first login → verify with a small command set.

This is an **educational simulation**. It is **not** Red Hat Enterprise Linux, not a VM, and **not affiliated with Red Hat**. No packages are installed on the student’s computer.

## What students practice

- GRUB boot entries (Install / Test media / Rescue)
- Anaconda hub-and-spoke model (configure in any order)
- Timezone + chrony/NTP
- Software Selection (Server, Server with GUI, Minimal, Workstation)
- Installation Destination (vda / sda / NVMe, Automatic, LVM, XFS, LUKS2 option)
- NetworkManager hostname
- Optional subscription-manager screen (simulated)
- Root password + wheel user
- First-boot login and `hostnamectl`, `lsblk`, `df`, `/etc/os-release`

A floating **lab checklist** scores 9 required steps and stores progress in `localStorage`.

## Give students access (GitHub + Blogger)

### 1. Put the lab on GitHub

1. Create a repository, for example `rhel10-install-lab`.
2. Upload **this entire folder** (keep `index.html` at the repo root).
3. Settings → **Pages** → Build from branch **main** / folder **/ (root)**.
4. After a minute the lab URL is:

   `https://YOURUSER.github.io/rhel10-install-lab/`

Use that URL in class, LMS, and Blogger.

### 2. Embed on Blogger

See [BLOGGER.md](BLOGGER.md) for a full gadget / HTML widget. Short version:

```html
<p><a href="https://YOURUSER.github.io/rhel10-install-lab/" target="_blank">
  Open the RHEL 10 Installation Lab (full screen)
</a></p>
<iframe
  src="https://YOURUSER.github.io/rhel10-install-lab/"
  title="RHEL 10 Installation Lab"
  style="width:100%;height:720px;border:1px solid #444;border-radius:6px;"
  allowfullscreen>
</iframe>
```

Blogger sometimes strips iframes in the **Compose** view. Use **HTML view** (or a gadget) when you paste.

### 3. Classroom tips

- Chrome / Edge / Firefox; phones work but a laptop is better.
- Ask students to screenshot the **Lab score** before Reset.
- Pair with [labs/student-worksheet.md](labs/student-worksheet.md).
- This does **not** replace a real VM for RH124 storage/network exams — use it as a **pre-lab** so the first real Anaconda screen is familiar.

## Local preview

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Files

| Path | Role |
|------|------|
| `index.html` | Shell: GRUB, language, hub, progress, login, terminal |
| `css/lab.css` | Anaconda-inspired layout |
| `js/installer.js` | State, spokes, scoring, fake post-install shell |
| `labs/student-worksheet.md` | Printable questions |
| `BLOGGER.md` | Step-by-step Blogger publish |

## License

Lab content is yours to use with your students. Red Hat, RHEL, and Anaconda are trademarks of Red Hat, Inc. Use this only for teaching look-and-feel, not as a product or ISO substitute.
