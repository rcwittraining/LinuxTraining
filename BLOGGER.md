# Publish the lab on Blogger

Students can open the GitHub Pages URL directly. Use Blogger as the **course announcement** page (schedule, worksheet, iframe).

## A. One-time: GitHub Pages

1. Push this project to `https://github.com/YOURUSER/rhel10-install-lab`.
2. **Settings → Pages → Deploy from a branch → main / root → Save.**
3. Confirm: `https://YOURUSER.github.io/rhel10-install-lab/` loads the GRUB screen.

## B. New Blogger post

1. Blogger → **New post**.
2. Title example: `Lab 01 — RHEL 10 installation (simulator)`.
3. Switch the editor to **HTML view** (not Compose).
4. Paste the block below. Replace `YOURUSER`.

```html
<style>
  .rhel-lab { font-family: system-ui, sans-serif; line-height: 1.45; }
  .rhel-lab a.cta {
    display: inline-block; background: #ee0000; color: #fff !important;
    text-decoration: none; padding: 10px 16px; border-radius: 4px; font-weight: 700;
  }
</style>
<div class="rhel-lab">
  <p>Complete this <strong>RHEL 10 Anaconda install lab</strong> before the VM practical.</p>
  <p>
    <a class="cta" href="https://YOURUSER.github.io/rhel10-install-lab/" target="_blank" rel="noopener">
      Launch full-screen lab
    </a>
  </p>
  <iframe
    src="https://YOURUSER.github.io/rhel10-install-lab/"
    title="RHEL 10 Installation Lab Simulator"
    width="100%" height="740"
    style="border:1px solid #ccc;max-width:100%;"
    loading="lazy"
    allowfullscreen>
  </iframe>
  <h3>Before you start</h3>
  <ol>
    <li>Use a laptop if you can (hub tiles are easier).</li>
    <li>Mandatory spokes: Destination, Root password, User.</li>
    <li>Set hostname to <code>server1.lab.example.com</code>.</li>
    <li>After reboot, log in and run <code>hostnamectl</code> and <code>lsblk</code>.</li>
    <li>Screenshot the green checklist score (9/9) and upload to the LMS.</li>
  </ol>
</div>
```

5. **Preview** → Publish.

If the iframe is blank, Blogger blocked mixed content or the Pages URL is still building. The red **Launch** button still works.

## C. Optional: Layout gadget (always on the sidebar)

**Layout → Add a Gadget → HTML/JavaScript** and paste a short link:

```html
<p><b>This week’s lab</b></p>
<p><a href="https://YOURUSER.github.io/rhel10-install-lab/" target="_blank">RHEL 10 Install Simulator</a></p>
```

## D. Custom domain (optional)

GitHub Pages → Custom domain → `lab.yourblog.com` after you add a CNAME at your DNS host. Blogger can keep using the same iframe `src`.
