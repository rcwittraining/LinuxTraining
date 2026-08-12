# RHEL 10 Installation Simulator

An unofficial, in-browser recreation of the **Red Hat Enterprise Linux 10** install path: UEFI POST, GRUB, the Anaconda **hub-and-spoke** installer, package progress, then first boot (GNOME or a text console).

Nothing is written to a real disk. It never talks to Red Hat’s CDN or Customer Portal.

> **Trademark notice:** Red Hat®, RHEL®, and Red Hat Enterprise Linux® are trademarks of Red Hat, Inc. This project is **not** affiliated with, endorsed by, or sponsored by Red Hat.

## Try it locally

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## What you can do

1. Power on → firmware POST → **GRUB** (arrow keys + Enter).
2. Optional **Test this media & install**.
3. Language, then the **Installation Summary** hub:
   - Keyboard, Language Support, Time & Date
   - Installation Source, Software Selection
   - Installation Destination (required), Kdump, Network & Host Name, Connect to Red Hat
   - Root password and/or User Creation (at least one required)
4. **Begin Installation** → reboot.
5. **Server with GUI** / **Workstation** land in GNOME. Minimal / Server land on a text console.
6. Desktop **Terminal** understands a small command set: `cat /etc/os-release`, `hostnamectl`, `dnf repolist`, `subscription-manager status`, `lsblk`, `sestatus`, …

Use **Skip to installed system** in the top bar if you only want the desktop for a blog walkthrough.

## Publish on GitHub Pages

1. Create a new GitHub repository (public).
2. Push this folder:

```bash
git init
git add .
git commit -m "RHEL 10 installation simulator"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

3. In the repo: **Settings → Pages → Build and deployment**.
   - Source: **Deploy from a branch**
   - Branch: `main` / root (`/`)
4. After a minute the site is at:

`https://YOUR_USER.github.io/YOUR_REPO/`

(If the repo is named `YOUR_USER.github.io`, it is served from the domain root.)

A `.nojekyll` file is included so GitHub does not process the site with Jekyll.

## Embed in Blogger

Blogger cannot host this app by itself (script limits, no multi-file static hosting). Host it on GitHub Pages, then embed the live URL.

1. Open your Blogger post or page → **pencil** → **HTML view** (not Compose).
2. Paste:

```html
<div style="position:relative;padding-top:62.5%;height:0;overflow:hidden;border:1px solid #222;background:#000">
  <iframe
    src="https://YOUR_USER.github.io/YOUR_REPO/"
    title="RHEL 10 Installation Simulator"
    style="position:absolute;inset:0;width:100%;height:100%;border:0"
    allowfullscreen
    loading="lazy">
  </iframe>
</div>
```

3. Replace `YOUR_USER` / `YOUR_REPO` with your Pages URL.
4. Publish. Readers run the full installer inside the post.

**Tips**

- Use a **page** (not only a post) if you want a stable permalink such as `/p/rhel10-simulator.html`.
- Some Blogger themes clip iframes. The wrapper above keeps a 16:10 frame; change `padding-top:62.5%` to `56.25%` for 16:9 or use a fixed height (`height:720px`) instead of the padding trick.
- If the theme strips iframes, add the same HTML as a **gadget**: Layout → Add a gadget → HTML/JavaScript.
- The simulator is keyboard-heavy on the GRUB screen; click the boot list first so it has focus.

## Project layout

```
index.html      App shell and Anaconda chrome
css/style.css   Anaconda / GRUB / GNOME styling
js/simulator.js Installer state, spokes, progress, desktop
```

No build step, no npm, no backend.

## License

Source code is under the MIT License (see `LICENSE`). Red Hat marks remain Red Hat’s.
