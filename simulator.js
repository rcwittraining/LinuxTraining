/* RHEL 10 Anaconda installation simulator — unofficial educational demo */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const ENV = {
    "server-gui": { name: "Server with GUI", gui: true, desc: "An integrated, easy-to-manage server with a graphical interface." },
    server: { name: "Server", gui: false, desc: "An integrated, easy-to-manage server." },
    minimal: { name: "Minimal Install", gui: false, desc: "Basic functionality. You can use DNF after first boot to add software." },
    workstation: { name: "Workstation", gui: true, desc: "Workstation for laptops and PCs, with GNOME." },
    custom: { name: "Custom Operating System", gui: false, desc: "Basic building block for a custom RHEL system." },
    virt: { name: "Virtualization Host", gui: false, desc: "Minimal host for running virtual machines with KVM." },
  };

  const ADDONS = {
    "server-gui": ["GNOME", "Debugging Tools", "Container Management", "Guest Agents", "Development Tools", "Security Tools", "System Tools", "Network File System Client", "Headless Management"],
    server: ["Debugging Tools", "Container Management", "Guest Agents", "Development Tools", "Security Tools", "System Tools", "Network File System Client", "Headless Management"],
    minimal: ["Standard", "Guest Agents"],
    workstation: ["GNOME", "Internet Browser", "Office Suite", "Development Tools", "Container Management"],
    custom: ["Standard", "Development Tools"],
    virt: ["Virtualization Hypervisor", "Virtualization Tools", "Guest Agents"],
  };

  const LANGS = {
    English: ["English (United States)", "English (United Kingdom)", "English (India)", "English (Canada)"],
    Deutsch: ["Deutsch (Deutschland)", "Deutsch (Österreich)", "Deutsch (Schweiz)"],
    Español: ["Español (España)", "Español (México)", "Español (Argentina)"],
    Français: ["Français (France)", "Français (Canada)"],
    हिन्दी: ["हिन्दी (भारत)"],
    日本語: ["日本語 (日本)"],
    Português: ["Português (Brasil)", "Português (Portugal)"],
    "中文": ["中文 (简体)", "中文 (繁體)"],
    தமிழ்: ["தமிழ் (இந்தியா)"],
  };

  const KEYBOARDS = ["English (US)", "English (UK)", "English (India)", "German", "French", "Spanish", "Tamil", "Hindi InScript", "Japanese"];

  const ZONES = {
    Africa: ["Cairo", "Johannesburg", "Nairobi"],
    America: ["New_York", "Chicago", "Denver", "Los_Angeles", "Sao_Paulo"],
    Asia: ["Kolkata", "Kolkata (Chennai)", "Dubai", "Tokyo", "Shanghai", "Singapore"],
    Atlantic: ["Reykjavik"],
    Australia: ["Sydney", "Perth"],
    Europe: ["London", "Berlin", "Paris", "Moscow"],
    Pacific: ["Auckland", "Honolulu"],
  };

  const GRUB_MAIN = [
    { id: "install", label: "Install Red Hat Enterprise Linux 10.0" },
    { id: "test", label: "Test this media & install Red Hat Enterprise Linux 10.0" },
    { id: "trouble", label: "Troubleshooting →" },
  ];
  const GRUB_TROUBLE = [
    { id: "rescue", label: "Rescue a Red Hat Enterprise Linux system" },
    { id: "memtest", label: "Run a memory test (memtest86+)" },
    { id: "local", label: "Boot from local drive" },
    { id: "back", label: "← Return to the main menu" },
  ];

  const state = {
    language: "English (United States)",
    family: "English",
    keyboard: "English (US)",
    extraLangs: new Set(["English (United States)"]),
    region: "Asia",
    city: "Kolkata",
    ntp: true,
    source: "local",
    env: "server-gui",
    addons: new Set(["GNOME"]),
    destVisited: false,
    disk: "sda",
    storage: "automatic",
    encrypt: false,
    encryptPass: "",
    scheme: "lvm",
    customParts: null,
    kdump: true,
    kdumpMem: 256,
    hostname: "localhost.localdomain",
    netOn: true,
    registered: false,
    rhUser: "",
    rootOn: false,
    rootPass: "",
    rootSsh: false,
    user: { full: "", name: "", pass: "", admin: true, created: false },
    grub: GRUB_MAIN,
    grubIdx: 0,
    spoke: null,
    installed: false,
    clocks: null,
  };

  /* ---------- helpers ---------- */
  function showScreen(id) {
    $$(".screen").forEach((el) => el.classList.toggle("active", el.id === id));
    if (id === "screen-grub") setTimeout(() => $("#grub-box").focus(), 50);
    if (id === "screen-desktop" || id === "screen-login") tickClocks();
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  function confirmDlg(title, body) {
    return new Promise((resolve) => {
      $("#confirm-title").textContent = title;
      $("#confirm-body").textContent = body;
      $("#modal-confirm").classList.remove("hidden");
      const done = (v) => {
        $("#modal-confirm").classList.add("hidden");
        $("#confirm-yes").onclick = null;
        $("#confirm-no").onclick = null;
        resolve(v);
      };
      $("#confirm-yes").onclick = () => done(true);
      $("#confirm-no").onclick = () => done(false);
    });
  }

  function slug(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user";
  }

  function strength(p) {
    if (!p) return "";
    let n = 0;
    if (p.length >= 8) n++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
    if (/\d/.test(p) && /\W/.test(p)) n++;
    return n >= 3 ? "strong" : n === 2 ? "fair" : "weak";
  }

  function usersOk() {
    return state.rootOn || state.user.created;
  }

  function canBegin() {
    return state.destVisited && usersOk();
  }

  function tzLabel() {
    const city = state.city.replace(" (Chennai)", "");
    return `${state.region}/${city}`;
  }

  function hasGui() {
    return ENV[state.env].gui;
  }

  function displayName() {
    return state.user.created ? state.user.full || state.user.name : "root";
  }

  function userName() {
    return state.user.created ? state.user.name : "root";
  }

  function hostShort() {
    return (state.hostname || "localhost").split(".")[0];
  }

  /* ---------- clocks ---------- */
  function fmtClock() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function tickClocks() {
    const t = fmtClock();
    const d = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    ["gdm-clock", "panel-clock", "lock-clock"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.textContent = t;
    });
    if ($("#lock-date")) $("#lock-date").textContent = d;
  }
  setInterval(tickClocks, 1000);

  /* ---------- POWER / FIRMWARE ---------- */
  $("#btn-power").addEventListener("click", startFirmware);
  function skipFirmware() {
    clearTimeout(startFirmware._t);
    showGrub();
  }
  $("#screen-firmware").addEventListener("click", skipFirmware);
  document.addEventListener("keydown", (e) => {
    if ($("#screen-firmware").classList.contains("active") && (e.key === "Escape" || e.key === "F12" || e.key === "Delete")) {
      skipFirmware();
    }
  });

  function startFirmware() {
    showScreen("screen-firmware");
    const lines = [
      "AetherCore not detected. Using generic x86_64-v3 CPU…",
      "CPU: 4 cores  ·  x86-64-v3 (AVX2 required by RHEL 10)  [OK]",
      "Memory: 4096 MB  Dual Channel  [OK]",
      "Initializing USB controllers ……………… [OK]",
      "AHCI SATA 0: VBOX HARDDISK 64 GiB",
      "AHCI SATA 1: VBOX CD-ROM  RHEL-10-0-x86_64-dvd",
      "UEFI boot order: CD-ROM, HDD, Network",
      "Loading GRUB from EFI/BOOT/BOOTX64.EFI…",
    ];
    const log = $("#fw-log");
    log.textContent = "";
    $("#fw-bar").style.width = "0";
    let i = 0;
    const step = () => {
      if (i < lines.length) {
        log.textContent += lines[i] + "\n";
        $("#fw-bar").style.width = ((i + 1) / lines.length) * 100 + "%";
        i++;
        startFirmware._t = setTimeout(step, 220);
      } else {
        startFirmware._t = setTimeout(showGrub, 400);
      }
    };
    step();
  }

  /* ---------- GRUB ---------- */
  function showGrub() {
    state.grub = GRUB_MAIN;
    state.grubIdx = 0;
    renderGrub();
    showScreen("screen-grub");
  }

  function renderGrub() {
    const box = $("#grub-box");
    box.innerHTML = state.grub.map((it, i) =>
      `<div class="grub-item${i === state.grubIdx ? " selected" : ""}" data-i="${i}" role="option">${it.label}</div>`
    ).join("");
    $$(".grub-item", box).forEach((el) => {
      el.addEventListener("mouseenter", () => { state.grubIdx = +el.dataset.i; renderGrub(); });
      el.addEventListener("click", () => chooseGrub());
    });
  }

  function chooseGrub() {
    const id = state.grub[state.grubIdx].id;
    if (id === "trouble") {
      state.grub = GRUB_TROUBLE;
      state.grubIdx = 0;
      renderGrub();
      return;
    }
    if (id === "back") {
      state.grub = GRUB_MAIN;
      state.grubIdx = 0;
      renderGrub();
      return;
    }
    if (id === "rescue") {
      showScreen("screen-console");
      startRescue();
      return;
    }
    if (id === "memtest") {
      toast("memtest86+ would run here. Returning to GRUB.");
      return;
    }
    if (id === "local") {
      toast("No installed system on the simulated local disk yet.");
      return;
    }
    if (id === "test") {
      runMediaCheck().then(openLanguage);
      return;
    }
    openLanguage();
  }

  $("#grub-box").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.grubIdx = (state.grubIdx + 1) % state.grub.length;
      renderGrub();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.grubIdx = (state.grubIdx - 1 + state.grub.length) % state.grub.length;
      renderGrub();
    } else if (e.key === "Enter") {
      e.preventDefault();
      chooseGrub();
    } else if (e.key === "e" || e.key === "c") {
      toast("Boot editor / GRUB shell are not simulated.");
    }
  });

  function runMediaCheck() {
    return new Promise((resolve) => {
      showScreen("screen-media");
      let p = 0;
      const tick = () => {
        p += 4 + Math.random() * 6;
        if (p > 100) p = 100;
        $("#media-bar").style.width = p + "%";
        $("#media-status").textContent = p < 100
          ? `Testing checksums… ${Math.floor(p)}%  (rd.live.check)`
          : "Success. Media checks out. Starting Anaconda…";
        if (p < 100) setTimeout(tick, 90);
        else setTimeout(resolve, 700);
      };
      tick();
    });
  }

  /* ---------- LANGUAGE ---------- */
  function openLanguage() {
    renderLangs();
    showView("language");
    showScreen("screen-anaconda");
  }

  function renderLangs() {
    const fam = $("#lang-families");
    fam.innerHTML = Object.keys(LANGS).map((f) =>
      `<li class="${f === state.family ? "on" : ""}" data-f="${f}">${f}</li>`
    ).join("");
    const locs = LANGS[state.family];
    $("#lang-locales").innerHTML = locs.map((l) =>
      `<li class="${l === state.language ? "on" : ""}" data-l="${l}">${l}</li>`
    ).join("");
    $$("#lang-families li").forEach((li) => li.onclick = () => {
      state.family = li.dataset.f;
      state.language = LANGS[state.family][0];
      renderLangs();
    });
    $$("#lang-locales li").forEach((li) => li.onclick = () => {
      state.language = li.dataset.l;
      renderLangs();
    });
  }

  $("#btn-continue").addEventListener("click", () => {
    state.extraLangs.add(state.language);
    if ($("#precheck").checked) {
      if (state.language.includes("United Kingdom")) state.keyboard = "English (UK)";
      else if (state.language.includes("India") || state.language.includes("भारत") || state.language.includes("தமிழ்"))
        state.keyboard = "English (India)";
    }
    refreshHub();
    showView("hub");
  });

  function showView(name) {
    $$(".ana-view").forEach((v) => v.classList.add("hidden"));
    $("#view-" + name).classList.remove("hidden");
  }

  /* ---------- HUB ---------- */
  function refreshHub() {
    $("#st-keyboard").textContent = state.keyboard;
    $("#st-langsup").textContent = [...state.extraLangs].join(", ");
    $("#st-datetime").textContent = tzLabel() + (state.ntp ? " · NTP on" : " · NTP off");
    $("#st-source").textContent = state.source === "local" ? "Local media" : "Closest mirror (network)";
    $("#st-software").textContent = ENV[state.env].name;
    $("#st-dest").textContent = state.destVisited
      ? destSummary()
      : "Please select a disk and partitioning scheme";
    $("#spoke-dest").classList.toggle("warn", !state.destVisited);
    $("#st-kdump").textContent = state.kdump ? `Kdump is enabled (${state.kdumpMem} MB)` : "Kdump is disabled";
    $("#st-network").textContent = state.netOn
      ? `Connected: enp1s0 · ${state.hostname}`
      : `Disconnected · ${state.hostname}`;
    $("#st-connect").textContent = state.registered ? `Registered as ${state.rhUser}` : "Not registered";
    $("#st-root").textContent = state.rootOn ? "Root account is enabled" : "Root account is disabled";
    $("#spoke-root").classList.toggle("warn", !usersOk());
    $("#st-user").textContent = state.user.created
      ? `${state.user.name}${state.user.admin ? " (administrator)" : ""}`
      : "No user will be created";
    $("#spoke-user").classList.toggle("warn", !usersOk());
    const ok = canBegin();
    $("#btn-begin").disabled = !ok;
    $("#begin-hint").textContent = ok
      ? "All required items are configured. You can begin the installation."
      : "Installation Destination is required. Enable root or create a user.";
  }

  function destSummary() {
    const enc = state.encrypt ? ", LUKS2" : "";
    if (state.storage === "custom") return `/dev/${state.disk} · Custom partitions${enc}`;
    return `/dev/${state.disk} · Automatic ${state.scheme.toUpperCase()}${enc}`;
  }

  $$("#view-hub .spoke").forEach((b) => {
    b.addEventListener("click", () => openSpoke(b.dataset.spoke));
  });

  $("#btn-begin").addEventListener("click", () => {
    if (!canBegin()) return;
    startInstall();
  });

  $("#btn-quit").addEventListener("click", quitInstaller);
  $("#ana-x").addEventListener("click", quitInstaller);
  $("#ana-help").addEventListener("click", () => $("#modal-help").classList.remove("hidden"));

  async function quitInstaller() {
    const yes = await confirmDlg("Are you sure you want to quit the installer?", "This simulated session will return to the boot menu. Nothing was written to disk.");
    if (yes) showGrub();
  }

  /* ---------- SPOKES ---------- */
  $("#spoke-done").addEventListener("click", () => {
    if (state.spoke === "dest") state.destVisited = true;
    if (state.spoke === "user") commitUser();
    if (state.spoke === "root") commitRoot();
    refreshHub();
    showView("hub");
    state.spoke = null;
  });

  function openSpoke(id) {
    state.spoke = id;
    const titles = {
      keyboard: "KEYBOARD",
      langsup: "LANGUAGE SUPPORT",
      datetime: "TIME & DATE",
      source: "INSTALLATION SOURCE",
      software: "SOFTWARE SELECTION",
      dest: "INSTALLATION DESTINATION",
      kdump: "KDUMP",
      network: "NETWORK & HOST NAME",
      connect: "CONNECT TO RED HAT",
      root: "ROOT PASSWORD",
      user: "CREATE USER",
    };
    $("#spoke-title").textContent = titles[id] || id;
    $("#spoke-body").innerHTML = spokeHTML(id);
    bindSpoke(id);
    showView("spoke");
  }

  function spokeHTML(id) {
    switch (id) {
      case "keyboard":
        return `<p class="help">Select the keyboard layout for the installer and the installed system. Type in the test box to try it.</p>
          <div class="list" id="kb-list">${KEYBOARDS.map((k) =>
            `<button type="button" class="${k === state.keyboard ? "on" : ""}" data-k="${k}">${k}</button>`
          ).join("")}</div>
          <div class="field" style="margin-top:16px"><label class="lbl">Test the layout</label>
          <input type="text" placeholder="Type here to test" /></div>`;
      case "langsup":
        return `<p class="help">Additional languages available on the installed system. The installer language is always included.</p>
          <div id="ls-list">${Object.values(LANGS).flat().map((l) =>
            `<label class="opt"><input type="checkbox" value="${l}" ${state.extraLangs.has(l) ? "checked" : ""}/> <span>${l}</span></label>`
          ).join("")}</div>`;
      case "datetime": {
        const regions = Object.keys(ZONES);
        return `<p class="help">Set the time zone used by the installed system. NTP keeps the clock accurate when a network is available.</p>
          <div class="field"><label class="lbl">Region</label>
            <select id="tz-region">${regions.map((r) => `<option ${r === state.region ? "selected" : ""}>${r}</option>`).join("")}</select></div>
          <div class="field"><label class="lbl">City</label>
            <select id="tz-city">${ZONES[state.region].map((c) => `<option ${c === state.city ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <label class="opt"><input type="checkbox" id="tz-ntp" ${state.ntp ? "checked" : ""}/> <span><b>Network Time (NTP)</b><br/>Use chronyd to synchronize the clock.</span></label>
          <p class="help">Current simulated zone: <b>${tzLabel()}</b></p>`;
      }
      case "source":
        return `<p class="help">Anaconda needs a package repository. The Binary DVD carries BaseOS and AppStream. A Boot ISO must use a network source.</p>
          <label class="opt"><input type="radio" name="src" value="local" ${state.source === "local" ? "checked" : ""}/> <span><b>Auto-detected installation media</b><br/>RHEL-10-0-x86_64-dvd on /dev/sr0</span></label>
          <label class="opt"><input type="radio" name="src" value="net" ${state.source === "net" ? "checked" : ""}/> <span><b>On the network</b><br/>Closest mirror / Red Hat CDN (requires registration)</span></label>`;
      case "software":
        return `<p class="help">Pick one base environment. Add-ons on the right are optional package groups for that environment.</p>
          <div class="soft-grid">
            <div class="soft-col"><h4>Base Environment</h4><div id="env-list"></div></div>
            <div class="soft-col"><h4>Additional software for Selected Environment</h4><div id="addon-list"></div></div>
          </div>`;
      case "dest":
        return `<p class="help">Select the disk that will hold Red Hat Enterprise Linux. This simulator uses a 64&nbsp;GiB virtual disk. Automatic partitioning creates XFS on LVM (the RHEL default) plus <code>/boot</code> and ESP.</p>
          <div class="disks">
            <div class="disk ${state.disk === "sda" ? "on" : ""}" data-d="sda"><div class="dev">sda</div><div>VBOX HARDDISK</div><div class="sz">64 GiB · ATA</div></div>
            <div class="disk ${state.disk === "sr0" ? "on" : ""}" data-d="sr0" style="opacity:.55"><div class="dev">sr0</div><div>RHEL-10 DVD</div><div class="sz">optical · not a target</div></div>
          </div>
          <h4>Storage Configuration</h4>
          <label class="opt"><input type="radio" name="stor" value="automatic" ${state.storage === "automatic" ? "checked" : ""}/> <span><b>Automatic</b> — create a standard LVM layout.</span></label>
          <label class="opt"><input type="radio" name="stor" value="custom" ${state.storage === "custom" ? "checked" : ""}/> <span><b>Custom</b> — configure mount points yourself.</span></label>
          <div class="field"><label class="lbl">Partitioning scheme (automatic)</label>
            <select id="scheme">
              <option value="lvm" ${state.scheme === "lvm" ? "selected" : ""}>LVM</option>
              <option value="standard" ${state.scheme === "standard" ? "selected" : ""}>Standard Partition</option>
              <option value="lvmthin" ${state.scheme === "lvmthin" ? "selected" : ""}>LVM Thin Provisioning</option>
            </select></div>
          <label class="opt"><input type="checkbox" id="enc" ${state.encrypt ? "checked" : ""}/> <span><b>Encrypt my data</b> — LUKS2 on the system volume.</span></label>
          <div id="enc-pass" class="${state.encrypt ? "" : "hidden"} field">
            <label class="lbl">Passphrase</label>
            <input type="password" id="enc-p1" value="${state.encryptPass}" />
          </div>
          <div id="auto-preview">${autoPreview()}</div>
          <div id="custom-ui" class="${state.storage === "custom" ? "" : "hidden"}">${customUI()}</div>`;
      case "kdump":
        return `<p class="help">Kdump captures a memory image if the kernel crashes. It reserves a small amount of RAM.</p>
          <label class="opt"><input type="checkbox" id="kd-on" ${state.kdump ? "checked" : ""}/> <span><b>Enable kdump</b></span></label>
          <div class="field"><label class="lbl">Memory to be reserved (MB)</label>
            <input type="text" id="kd-mem" value="${state.kdumpMem}" /></div>`;
      case "network":
        return `<p class="help">A working network is needed for registration, NTP, and a network installation source. Wired interfaces usually come up with DHCP.</p>
          <label class="opt"><input type="checkbox" id="net-on" ${state.netOn ? "checked" : ""}/> <span><b>enp1s0</b> — Ethernet · ${state.netOn ? "Connected (DHCP 192.168.122.85)" : "Off"}</span></label>
          <div class="field"><label class="lbl">Host Name</label>
            <input type="text" id="hn" value="${state.hostname}" />
            <button type="button" class="btn" id="hn-apply" style="margin-top:8px">Apply</button>
          </div>
          <p class="help">DNS: 192.168.122.1 · Gateway: 192.168.122.1 · IPv6: ignore</p>`;
      case "connect":
        return `<p class="help">Registering attaches this system to the Red Hat Customer Portal so it can receive updates from BaseOS and AppStream. A no-cost Red Hat Developer subscription covers personal systems. This simulator never contacts Red Hat.</p>
          <div class="field"><label class="lbl">Red Hat account (login)</label>
            <input type="text" id="rh-user" value="${state.rhUser}" autocomplete="off" /></div>
          <div class="field"><label class="lbl">Password</label>
            <input type="password" id="rh-pass" autocomplete="off" /></div>
          <button type="button" class="btn suggested" id="rh-reg">Register</button>
          <button type="button" class="btn" id="rh-unreg" style="margin-left:8px">Unregister</button>
          <p class="help" id="rh-st" style="margin-top:12px">${state.registered ? "Registered (simulated)." : "Not registered."}</p>`;
      case "root":
        return `<p class="help">RHEL 10 leaves the root account locked unless you enable it. Prefer a sudo-capable user for day-to-day work.</p>
          <label class="opt"><input type="checkbox" id="root-on" ${state.rootOn ? "checked" : ""}/> <span><b>Enable root account</b></span></label>
          <div class="field"><label class="lbl">Root Password</label>
            <input type="password" id="root-p1" ${state.rootOn ? "" : "disabled"} /></div>
          <div class="field"><label class="lbl">Confirm</label>
            <input type="password" id="root-p2" ${state.rootOn ? "" : "disabled"} /></div>
          <div class="strength" id="root-str"><i></i></div>
          <label class="opt"><input type="checkbox" id="root-ssh" ${state.rootSsh ? "checked" : ""}/> <span>Allow root SSH login with password</span></label>`;
      case "user":
        return `<p class="help">Create a non-root account. Check “Make this user administrator” to grant sudo (wheel group).</p>
          <div class="field"><label class="lbl">Full name</label>
            <input type="text" id="u-full" value="${state.user.full}" /></div>
          <div class="field"><label class="lbl">User name</label>
            <input type="text" id="u-name" value="${state.user.name}" /></div>
          <label class="opt"><input type="checkbox" id="u-admin" ${state.user.admin ? "checked" : ""}/> <span>Make this user administrator</span></label>
          <div class="field"><label class="lbl">Password</label>
            <input type="password" id="u-p1" /></div>
          <div class="field"><label class="lbl">Confirm password</label>
            <input type="password" id="u-p2" /></div>
          <div class="strength" id="u-str"><i></i></div>`;
      default:
        return "<p>Unknown spoke.</p>";
    }
  }

  function autoLayout() {
    if (state.scheme === "standard") {
      return [
        { dev: `${state.disk}1`, mount: "/boot/efi", fs: "EFI System", size: "600 MiB" },
        { dev: `${state.disk}2`, mount: "/boot", fs: "xfs", size: "1 GiB" },
        { dev: `${state.disk}3`, mount: "swap", fs: "swap", size: "2 GiB" },
        { dev: `${state.disk}4`, mount: "/", fs: "xfs", size: "60.4 GiB" },
      ];
    }
    return [
      { dev: `${state.disk}1`, mount: "/boot/efi", fs: "EFI System", size: "600 MiB" },
      { dev: `${state.disk}2`, mount: "/boot", fs: "xfs", size: "1 GiB" },
      { dev: `rhel-root`, mount: "/", fs: "xfs (LVM)", size: "60.4 GiB" },
      { dev: `rhel-swap`, mount: "swap", fs: "swap (LVM)", size: "2 GiB" },
    ];
  }

  function defaultCustom() {
    return [
      { mount: "/boot/efi", fs: "EFI System", size: "600 MiB" },
      { mount: "/boot", fs: "xfs", size: "1 GiB" },
      { mount: "/", fs: "xfs", size: "40 GiB" },
      { mount: "/home", fs: "xfs", size: "14 GiB" },
      { mount: "/var", fs: "xfs", size: "6 GiB" },
      { mount: "swap", fs: "swap", size: "2 GiB" },
    ];
  }

  function autoPreview() {
    const rows = autoLayout().map((p) =>
      `<tr><td>${p.dev}</td><td>${p.mount}</td><td>${p.fs}</td><td>${p.size}</td></tr>`
    ).join("");
    return `<h4>Proposed layout</h4>
      <div class="part-bar">
        <span style="width:3%;background:#8bc34a"></span>
        <span style="width:4%;background:#03a9f4"></span>
        <span style="width:80%;background:#ff9800"></span>
        <span style="width:13%;background:#9c27b0"></span>
      </div>
      <table class="ptable"><thead><tr><th>Device</th><th>Mount</th><th>Type</th><th>Size</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function customUI() {
    if (!state.customParts) state.customParts = defaultCustom();
    const rows = state.customParts.map((p, i) =>
      `<tr><td>${p.mount}</td><td>${p.fs}</td><td>${p.size}</td>
       <td><button type="button" class="btn" data-del="${i}">Remove</button></td></tr>`
    ).join("");
    return `<h4>Manual partitioning</h4>
      <table class="ptable" id="ctab"><thead><tr><th>Mount point</th><th>Type</th><th>Capacity</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="field" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        <div><label class="lbl">Mount</label><input type="text" id="np-m" placeholder="/opt" style="width:120px" /></div>
        <div><label class="lbl">Size</label><input type="text" id="np-s" placeholder="2 GiB" style="width:100px" /></div>
        <div><label class="lbl">FS</label>
          <select id="np-f"><option>xfs</option><option>ext4</option><option>swap</option><option>EFI System</option></select></div>
        <button type="button" class="btn" id="np-add">Add mount point</button>
      </div>`;
  }

  function bindSpoke(id) {
    if (id === "keyboard") {
      $$("#kb-list button").forEach((b) => b.onclick = () => {
        state.keyboard = b.dataset.k;
        $$("#kb-list button").forEach((x) => x.classList.toggle("on", x === b));
      });
    }
    if (id === "langsup") {
      $$("#ls-list input").forEach((c) => c.onchange = () => {
        if (c.checked) state.extraLangs.add(c.value);
        else if (c.value !== state.language) state.extraLangs.delete(c.value);
        c.checked = state.extraLangs.has(c.value);
      });
    }
    if (id === "datetime") {
      $("#tz-region").onchange = () => {
        state.region = $("#tz-region").value;
        state.city = ZONES[state.region][0];
        $("#tz-city").innerHTML = ZONES[state.region].map((c) => `<option>${c}</option>`).join("");
      };
      $("#tz-city").onchange = () => { state.city = $("#tz-city").value; };
      $("#tz-ntp").onchange = () => { state.ntp = $("#tz-ntp").checked; };
    }
    if (id === "source") {
      $$("input[name=src]").forEach((r) => r.onchange = () => { state.source = r.value; });
    }
    if (id === "software") renderSoftware();
    if (id === "dest") {
      $$(".disk").forEach((d) => d.onclick = () => {
        if (d.dataset.d === "sr0") { toast("Optical media cannot be an installation destination."); return; }
        state.disk = d.dataset.d;
        $$(".disk").forEach((x) => x.classList.toggle("on", x === d));
      });
      $$("input[name=stor]").forEach((r) => r.onchange = () => {
        state.storage = r.value;
        $("#custom-ui").classList.toggle("hidden", r.value !== "custom");
        if (r.value === "custom") {
          $("#custom-ui").innerHTML = customUI();
          bindCustom();
        }
      });
      $("#scheme").onchange = () => {
        state.scheme = $("#scheme").value;
        $("#auto-preview").innerHTML = autoPreview();
      };
      $("#enc").onchange = () => {
        state.encrypt = $("#enc").checked;
        $("#enc-pass").classList.toggle("hidden", !state.encrypt);
      };
      if ($("#enc-p1")) $("#enc-p1").oninput = () => { state.encryptPass = $("#enc-p1").value; };
      bindCustom();
    }
    if (id === "kdump") {
      $("#kd-on").onchange = () => { state.kdump = $("#kd-on").checked; };
      $("#kd-mem").oninput = () => { state.kdumpMem = parseInt($("#kd-mem").value, 10) || 256; };
    }
    if (id === "network") {
      $("#net-on").onchange = () => { state.netOn = $("#net-on").checked; };
      $("#hn-apply").onclick = () => {
        state.hostname = $("#hn").value.trim() || "localhost.localdomain";
        toast("Host name set to " + state.hostname);
      };
    }
    if (id === "connect") {
      $("#rh-reg").onclick = () => {
        const u = $("#rh-user").value.trim();
        if (!u || !$("#rh-pass").value) { toast("Enter a Red Hat login and password (simulated)."); return; }
        state.registered = true;
        state.rhUser = u;
        $("#rh-st").textContent = "Registered (simulated). Entitlements: Red Hat Developer Subscription.";
        toast("System registered (simulated).");
      };
      $("#rh-unreg").onclick = () => {
        state.registered = false;
        $("#rh-st").textContent = "Not registered.";
      };
    }
    if (id === "root") {
      const sync = () => {
        const on = $("#root-on").checked;
        $("#root-p1").disabled = $("#root-p2").disabled = !on;
        const s = strength($("#root-p1").value);
        $("#root-str").className = "strength " + s;
      };
      $("#root-on").onchange = sync;
      $("#root-p1").oninput = sync;
    }
    if (id === "user") {
      $("#u-full").oninput = () => {
        if (!$("#u-name").dataset.touched) {
          const n = slug($("#u-full").value).split("-")[0];
          $("#u-name").value = n;
        }
      };
      $("#u-name").oninput = () => { $("#u-name").dataset.touched = "1"; };
      $("#u-p1").oninput = () => {
        $("#u-str").className = "strength " + strength($("#u-p1").value);
      };
    }
  }

  function bindCustom() {
    if (!$("#ctab")) return;
    $$("#ctab [data-del]").forEach((b) => b.onclick = () => {
      state.customParts.splice(+b.dataset.del, 1);
      $("#custom-ui").innerHTML = customUI();
      bindCustom();
    });
    if ($("#np-add")) $("#np-add").onclick = () => {
      const m = $("#np-m").value.trim();
      const s = $("#np-s").value.trim();
      if (!m || !s) { toast("Enter a mount point and size."); return; }
      state.customParts.push({ mount: m, fs: $("#np-f").value, size: s });
      $("#custom-ui").innerHTML = customUI();
      bindCustom();
    };
  }

  function renderSoftware() {
    $("#env-list").innerHTML = Object.entries(ENV).map(([k, v]) =>
      `<label class="env ${state.env === k ? "on" : ""}"><input type="radio" name="env" value="${k}" ${state.env === k ? "checked" : ""}/> <span><b>${v.name}</b><br/>${v.desc}</span></label>`
    ).join("");
    $("#addon-list").innerHTML = ADDONS[state.env].map((a) =>
      `<label class="addon"><input type="checkbox" value="${a}" ${state.addons.has(a) ? "checked" : ""}/> <span>${a}</span></label>`
    ).join("");
    $$("input[name=env]").forEach((r) => r.onchange = () => {
      state.env = r.value;
      state.addons = new Set(ENV[state.env].gui ? ["GNOME"] : []);
      renderSoftware();
    });
    $$("#addon-list input").forEach((c) => c.onchange = () => {
      if (c.checked) state.addons.add(c.value);
      else state.addons.delete(c.value);
    });
  }

  function commitRoot() {
    const on = $("#root-on")?.checked;
    if (on === undefined) return;
    state.rootOn = on;
    state.rootSsh = $("#root-ssh").checked;
    const a = $("#root-p1").value, b = $("#root-p2").value;
    if (on) {
      if (!a || a !== b) {
        toast("Root passwords do not match — account left disabled.");
        state.rootOn = false;
      } else state.rootPass = a;
    }
  }

  function commitUser() {
    if (!$("#u-name")) return;
    const name = slug($("#u-name").value);
    const a = $("#u-p1").value, b = $("#u-p2").value;
    const full = $("#u-full").value.trim();
    if (!name || !a) {
      state.user.created = false;
      return;
    }
    if (a !== b) {
      toast("User passwords do not match.");
      state.user.created = false;
      return;
    }
    state.user = { full, name, pass: a, admin: $("#u-admin").checked, created: true };
  }

  /* ---------- INSTALL ---------- */
  function startInstall() {
    showScreen("screen-progress");
    const log = $("#install-log");
    log.textContent = "";
    const pkgs = [
      "anaconda 40.22.3-1.el10 started (graphical).",
      "Checking storage configuration on /dev/" + state.disk + "…",
      state.encrypt ? "Creating LUKS2 container… passphrase accepted." : "No disk encryption requested.",
      "Creating GPT on /dev/" + state.disk + ".",
      "mkfs.vfat /dev/" + state.disk + "1  (/boot/efi)",
      "mkfs.xfs  /dev/" + state.disk + "2  (/boot)",
      state.scheme === "standard" ? "mkfs.xfs /dev/" + state.disk + "4  (/)" : "pvcreate /dev/" + state.disk + "3 ; vgcreate rhel ; lvcreate --name root --name swap",
      "mkfs.xfs /dev/mapper/rhel-root",
      "Mounting filesystems under /mnt/sysimage",
      "Starting package installation from " + (state.source === "local" ? "file:///run/install/repo" : "cdn.redhat.com"),
      "Installing  fedora-gpg-keys  redhat-release-10.0  setup  filesystem",
      "Installing  glibc  bash  coreutils  systemd-257  dbus",
      "Installing  kernel-core-6.12.0-55.el10.x86_64",
      "Installing  kernel-modules  linux-firmware  grub2-efi-x64  shim-x64",
      "Installing  NetworkManager  firewalld  chrony  sudo  openssh-server",
      "Installing  dnf  subscription-manager  insights-client",
      hasGui() ? "Installing  gnome-shell  gdm  gnome-terminal  firefox  (" + ENV[state.env].name + ")" : "Skipping graphical packages (" + ENV[state.env].name + ")",
      ...[...state.addons].map((a) => "Installing group: " + a),
      "Running post-install scripts…",
      "Setting hostname to " + state.hostname,
      state.rootOn ? "Root password configured." : "Root account remains locked.",
      state.user.created ? "Created user " + state.user.name + (state.user.admin ? " (wheel)" : "") : "No local user created.",
      state.registered ? "Writing subscription-manager facts for " + state.rhUser : "System not registered — use subscription-manager after boot.",
      "Installing boot loader on /dev/" + state.disk,
      "grub2-mkconfig → /boot/grub2/grub.cfg",
      "Performing post-installation setup for kdump: " + (state.kdump ? "enabled" : "disabled"),
      "Installation complete.",
    ];
    const msgs = [
      "Setting up storage…",
      "Creating file systems…",
      "Downloading packages…",
      "Installing packages…",
      "Installing boot loader…",
      "Performing post-installation setup…",
    ];
    let i = 0;
    const total = pkgs.length;
    const tick = () => {
      if (i < total) {
        log.textContent += pkgs[i] + "\n";
        log.scrollTop = log.scrollHeight;
        const pct = Math.round(((i + 1) / total) * 100);
        $("#prog-fill").style.width = pct + "%";
        $("#prog-pct").textContent = pct + "%";
        $("#prog-msg").textContent = msgs[Math.min(msgs.length - 1, Math.floor((i / total) * msgs.length))];
        i++;
        setTimeout(tick, 160 + Math.random() * 80);
      } else {
        state.installed = true;
        setTimeout(() => showScreen("screen-done"), 500);
      }
    };
    tick();
  }

  $("#toggle-log").addEventListener("click", () => {
    $("#install-log").classList.toggle("hidden");
    $("#toggle-log").textContent = $("#install-log").classList.contains("hidden") ? "Show log" : "Hide log";
  });

  $("#btn-reboot").addEventListener("click", rebootToSystem);

  function rebootToSystem() {
    showScreen("screen-plymouth");
    let n = 0;
    const dots = $$("#ply-dots i");
    const t = setInterval(() => {
      dots.forEach((d, i) => d.classList.toggle("on", i === n % dots.length));
      n++;
      if (n > 14) {
        clearInterval(t);
        firstBoot();
      }
    }, 180);
  }

  function firstBoot() {
    if (hasGui()) {
      prepareLogin();
      showScreen("screen-login");
    } else {
      showScreen("screen-console");
      startConsole();
    }
  }

  /* ---------- LOGIN ---------- */
  function prepareLogin() {
    const n = displayName();
    $("#gdm-name").textContent = n;
    $("#gdm-avatar").textContent = n.charAt(0).toUpperCase();
    $("#login-hint").textContent = state.user.created
      ? "Password is the one you set in the installer."
      : "Log in as root with the password you set.";
    $("#login-pass").value = "";
  }

  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = $("#login-pass").value;
    const expect = state.user.created ? state.user.pass : state.rootPass;
    if (p !== expect) {
      $("#login-hint").textContent = "Sorry, that didn’t work. Please try again.";
      return;
    }
    openDesktop();
  });

  /* ---------- DESKTOP ---------- */
  const APPS = [
    { id: "term", name: "Terminal", icon: ">_" },
    { id: "files", name: "Files", icon: "▤" },
    { id: "settings", name: "Settings", icon: "⚙" },
    { id: "about", name: "About", icon: "ⓘ" },
    { id: "firefox", name: "Firefox", icon: "◈" },
  ];

  function openDesktop() {
    $("#sys-name").textContent = displayName();
    $("#sys-host").textContent = state.hostname;
    $("#sys-av").textContent = displayName().charAt(0).toUpperCase();
    $("#dash").innerHTML = APPS.map((a) =>
      `<button type="button" data-app="${a.id}" title="${a.name}">${a.icon}</button>`
    ).join("");
    $("#ov-grid").innerHTML = APPS.map((a) =>
      `<button type="button" data-app="${a.id}"><div class="di">${a.icon}</div>${a.name}</button>`
    ).join("");
    $("#desk-icons").innerHTML = `
      <button type="button" class="desk-icon" data-app="home"><div class="di">⌂</div>Home</button>
      <button type="button" class="desk-icon" data-app="trash"><div class="di">🗑</div>Trash</button>
      <button type="button" class="desk-icon" data-app="about"><div class="di">ⓘ</div>About RHEL</button>`;
    $$("#dash [data-app], #ov-grid [data-app], #desk-icons [data-app]").forEach((b) => {
      b.onclick = () => { closeOverview(); openApp(b.dataset.app); };
    });
    showScreen("screen-desktop");
    openApp("about");
  }

  function closeOverview() { $("#overview").classList.add("hidden"); }
  $("#btn-activities").addEventListener("click", () => {
    $("#overview").classList.toggle("hidden");
    if (!$("#overview").classList.contains("hidden")) $("#ov-search").focus();
  });
  $("#btn-system").addEventListener("click", () => $("#sysmenu").classList.toggle("hidden"));
  document.addEventListener("click", (e) => {
    if (!$("#sysmenu").contains(e.target) && e.target !== $("#btn-system"))
      $("#sysmenu").classList.add("hidden");
  });
  $$("#sysmenu [data-sys]").forEach((b) => {
    b.addEventListener("click", () => {
      $("#sysmenu").classList.add("hidden");
      const a = b.dataset.sys;
      if (a === "settings" || a === "about") openApp(a);
      if (a === "lock") showScreen("screen-lock");
      if (a === "reboot" || a === "off") resetSim();
    });
  });
  $("#screen-lock").addEventListener("click", () => {
    prepareLogin();
    showScreen("screen-login");
  });
  document.addEventListener("keydown", (e) => {
    if ($("#screen-lock").classList.contains("active")) {
      prepareLogin();
      showScreen("screen-login");
    }
    if (e.key === "Escape") closeOverview();
  });

  function openApp(id) {
    if (id === "trash") { toast("Trash is empty."); return; }
    if (id === "home") id = "files";
    const win = document.createElement("div");
    win.className = "win" + (id === "term" ? "" : " light");
    win.style.left = 8 + Math.random() * 12 + "%";
    win.style.top = 6 + Math.random() * 10 + "%";
    const titles = { term: "Terminal", files: "Home", settings: "Settings", about: "About Red Hat Enterprise Linux", firefox: "Firefox" };
    win.innerHTML = `<div class="win-bar"><span>${titles[id] || id}</span><button type="button" class="win-x" aria-label="Close">×</button></div>
      <div class="win-body">${appBody(id)}</div>`;
    $("#wins").appendChild(win);
    $("#panel-app").textContent = titles[id] || "RHEL 10";
    win.querySelector(".win-x").onclick = () => win.remove();
    dragWin(win);
    if (id === "term") bindTerm(win);
  }

  function appBody(id) {
    if (id === "term") {
      return `<div class="term" id="term-out"></div>`;
    }
    if (id === "files") {
      const home = "/home/" + userName();
      return `<p class="muted">${home}</p>
        <table class="ptable">
          <tr><th>Name</th><th>Type</th></tr>
          <tr><td>Documents</td><td>Folder</td></tr>
          <tr><td>Downloads</td><td>Folder</td></tr>
          <tr><td>Music</td><td>Folder</td></tr>
          <tr><td>Pictures</td><td>Folder</td></tr>
          <tr><td>Videos</td><td>Folder</td></tr>
          <tr><td>.bashrc</td><td>Plain text</td></tr>
        </table>`;
    }
    if (id === "settings") {
      return `<h3>Settings</h3>
        <p><b>Region &amp; Language</b> — ${state.language} · ${state.keyboard}</p>
        <p><b>Date &amp; Time</b> — ${tzLabel()} · NTP ${state.ntp ? "on" : "off"}</p>
        <p><b>Network</b> — enp1s0 ${state.netOn ? "connected" : "disconnected"}</p>
        <p><b>About</b> — Red Hat Enterprise Linux 10.0 (Coughlan) · GNOME 47 · Wayland</p>
        <p><b>Users</b> — ${displayName()} ${state.user.admin ? "· Administrator" : ""}</p>`;
    }
    if (id === "about") {
      return `<h2 style="font-family:var(--display);margin:0 0 8px">Red Hat Enterprise Linux 10.0</h2>
        <p>64-bit · Kernel 6.12.0-55.el10.x86_64 · ${ENV[state.env].name}</p>
        <p>This is a <b>simulated</b> first-boot session. Register a real system with:</p>
        <pre style="background:#222;color:#ddd;padding:10px;border-radius:4px">sudo subscription-manager register</pre>
        <p>Useful next steps on a real box: <code>sudo dnf update</code>, enable Insights, configure firewalld and SELinux (Enforcing is the default).</p>
        <p class="muted">Unofficial educational simulator. Not affiliated with Red Hat, Inc.</p>`;
    }
    if (id === "firefox") {
      return `<p><b>https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/10</b></p>
        <p>Welcome to RHEL 10. Documentation, errata, and the Customer Portal would load here if this were a real browser.</p>
        <ul>
          <li>x86-64-v3 baseline (AVX2)</li>
          <li>Image mode (bootc) available alongside package mode</li>
          <li>Anaconda hub-and-spoke installer</li>
          <li>Default GUI: GNOME on Wayland</li>
        </ul>`;
    }
    return "";
  }

  function dragWin(win) {
    const bar = win.querySelector(".win-bar");
    let ox = 0, oy = 0, drag = false;
    bar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".win-x")) return;
      drag = true;
      ox = e.clientX - win.offsetLeft;
      oy = e.clientY - win.offsetTop;
    });
    window.addEventListener("mousemove", (e) => {
      if (!drag) return;
      win.style.left = e.clientX - ox + "px";
      win.style.top = e.clientY - oy + "px";
    });
    window.addEventListener("mouseup", () => { drag = false; });
  }

  function bindTerm(win) {
    const out = win.querySelector(".term");
    const hist = [];
    let h = 0;
    const promptStr = () => `<span class="prompt">[${userName()}@${hostShort()} ~]$</span> `;
    const print = (html) => { out.insertAdjacentHTML("beforeend", html); };
    print(`Red Hat Enterprise Linux 10.0 (Coughlan)\nKernel 6.12.0-55.el10.x86_64 on an x86_64\nType <b>help</b> for simulated commands.\n\n`);
    const line = () => {
      print(`<div>${promptStr()}<input type="text" spellcheck="false" /></div>`);
      const inp = out.querySelector("div:last-child input");
      inp.focus();
      inp.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (hist.length) { h = Math.max(0, h - 1); inp.value = hist[h] || ""; }
        }
        if (e.key === "Enter") {
          const cmd = inp.value;
          inp.replaceWith(document.createTextNode(cmd));
          hist.push(cmd); h = hist.length;
          const result = runCmd(cmd);
          print("\n" + result + (result ? "\n" : ""));
          line();
          out.parentElement.scrollTop = out.parentElement.scrollHeight;
        }
      });
    };
    line();
  }

  function runCmd(raw) {
    const cmd = raw.trim();
    if (!cmd) return "";
    const [bin, ...args] = cmd.split(/\s+/);
    const os = `NAME="Red Hat Enterprise Linux"
VERSION="10.0 (Coughlan)"
ID="rhel"
ID_LIKE="fedora"
VERSION_ID="10.0"
PLATFORM_ID="platform:el10"
PRETTY_NAME="Red Hat Enterprise Linux 10.0 (Coughlan)"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:redhat:enterprise_linux:10.0"
HOME_URL="https://www.redhat.com/"
`;
    switch (bin) {
      case "help":
        return "help  clear  ls  pwd  whoami  id  date  uname  hostnamectl  cat  echo\nsubscription-manager  dnf  ip  df  lsblk  systemctl  sestatus  firewall-cmd";
      case "clear":
        $$(".term")[$$(".term").length - 1].innerHTML = "";
        return "";
      case "ls":
        return "Documents  Downloads  Music  Pictures  Videos";
      case "pwd":
        return "/home/" + userName();
      case "whoami":
        return userName();
      case "id":
        return `uid=1000(${userName()}) gid=1000(${userName()}) groups=1000(${userName()})${state.user.admin ? ",10(wheel)" : ""}`;
      case "date":
        return new Date().toString();
      case "uname":
        return args.includes("-a")
          ? "Linux " + hostShort() + " 6.12.0-55.el10.x86_64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"
          : "Linux";
      case "hostnamectl":
        return ` Static hostname: ${state.hostname}\n       Icon name: computer-vm\n         Chassis: vm\n      Machine ID: a1b2c3d4e5f60718293a4b5c6d7e8f90\n  Operating System: Red Hat Enterprise Linux 10.0 (Coughlan)\n       CPE OS Name: cpe:/o:redhat:enterprise_linux:10.0\n            Kernel: Linux 6.12.0-55.el10.x86_64\n      Architecture: x86-64`;
      case "cat":
        if (args[0] === "/etc/os-release" || args[0] === "/etc/redhat-release")
          return args[0] === "/etc/redhat-release" ? "Red Hat Enterprise Linux release 10.0 (Coughlan)" : os;
        return `cat: ${args[0] || ""}: No such file or directory`;
      case "echo":
        return args.join(" ");
      case "subscription-manager":
        if (args[0] === "status" || !args[0])
          return state.registered
            ? "+-------------------------------------------+\n   System Status Details\n+-------------------------------------------+\nOverall Status: Current\nSystem Purpose: Development/Test"
            : "Overall Status: Unknown\nThis system is not yet registered. Run: subscription-manager register";
        if (args[0] === "register") {
          state.registered = true;
          return "Registering to: subscription.rhsm.redhat.com:443/subscription\nThe system has been registered with ID: 00000000-rhel-10-sim\nThe registered system name is: " + state.hostname;
        }
        return "Usage: subscription-manager [status|register|unregister]";
      case "dnf":
        if (args[0] === "update" || args[0] === "upgrade")
          return state.registered
            ? "Updating Subscription Management repositories.\nLast metadata expiration check: 0:00:01\nDependencies resolved.\nNothing to do. Complete!"
            : "This system is not registered with an entitlement server. You can use subscription-manager to register.\nError: There are no enabled repositories.";
        if (args[0] === "repolist")
          return state.registered
            ? "repo id                              repo name\nrhel-10-for-x86_64-baseos-rpms      Red Hat Enterprise Linux 10 for x86_64 - BaseOS (RPMs)\nrhel-10-for-x86_64-appstream-rpms   Red Hat Enterprise Linux 10 for x86_64 - AppStream (RPMs)"
            : "No repositories available.";
        return "usage: dnf [update|repolist|install]";
      case "ip":
        return state.netOn
          ? "1: lo: <LOOPBACK,UP> 127.0.0.1/8\n2: enp1s0: <BROADCAST,UP> 192.168.122.85/24"
          : "1: lo: <LOOPBACK,UP> 127.0.0.1/8\n2: enp1s0: <BROADCAST> DOWN";
      case "df":
        return "Filesystem             Size  Used Avail Use%\n/dev/mapper/rhel-root   60G  4.2G   56G   8% /\n/dev/sda2              1.0G  180M  820M  18% /boot\n/dev/sda1              600M  7.2M  593M   2% /boot/efi";
      case "lsblk":
        return "NAME          MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda             8:0    0   64G  0 disk\n├─sda1          8:1    0  600M  0 part /boot/efi\n├─sda2          8:2    0    1G  0 part /boot\n└─sda3          8:3    0 62.4G  0 part\n  ├─rhel-root 253:0    0 60.4G  0 lvm  /\n  └─rhel-swap 253:1    0    2G  0 lvm  [SWAP]\nsr0            11:0    1 1024M  0 rom";
      case "systemctl":
        if (args[0] === "status") return `${args[1] || "systemd"} — simulated active (running)`;
        return "systemctl [status|start|stop] UNIT   (simulated)";
      case "sestatus":
        return "SELinux status:                 enabled\nSELinuxfs mount:                /sys/fs/selinux\nCurrent mode:                   enforcing\nMode from config file:          enforcing\nPolicy version:                 33\nPolicy from config file:        targeted";
      case "firewall-cmd":
        return args.includes("--state") ? "running" : "FirewallD is running (simulated)\n  public (default, active)\n    services: cockpit dhcpv6-client ssh";
      case "sudo":
        return state.user.admin ? runCmd(args.join(" ")) : `${userName()} is not in the sudoers file.`;
      default:
        return `bash: ${bin}: command not found`;
    }
  }

  /* ---------- CONSOLE / RESCUE ---------- */
  function startConsole() {
    const el = $("#tty");
    el.innerHTML = "";
    const print = (t) => { el.insertAdjacentHTML("beforeend", t); };
    print(`Red Hat Enterprise Linux 10.0 (Coughlan)\nKernel 6.12.0-55.el10.x86_64 on an x86_64\n\n${hostShort()} login: `);
    const userInp = document.createElement("input");
    userInp.type = "text";
    userInp.spellcheck = false;
    el.appendChild(userInp);
    userInp.focus();
    userInp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const u = userInp.value.trim() || "root";
      userInp.replaceWith(document.createTextNode(u + "\nPassword: "));
      const p = document.createElement("input");
      p.type = "password";
      el.appendChild(p);
      p.focus();
      p.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        const expect = u === "root" ? state.rootPass : (u === state.user.name ? state.user.pass : null);
        if (expect === null || p.value !== expect) {
          p.replaceWith(document.createTextNode("\nLogin incorrect\n"));
          startConsole();
          return;
        }
        p.replaceWith(document.createTextNode("\n"));
        attachTtyShell(el, u);
      });
    });
  }

  function attachTtyShell(el, user) {
    const prompt = () => {
      el.insertAdjacentHTML("beforeend", `[${user}@${hostShort()} ~]$ `);
      const inp = document.createElement("input");
      inp.type = "text";
      inp.spellcheck = false;
      el.appendChild(inp);
      inp.focus();
      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const cmd = inp.value;
        inp.replaceWith(document.createTextNode(cmd + "\n"));
        if (cmd.trim() === "exit" || cmd.trim() === "logout") {
          el.insertAdjacentHTML("beforeend", "logout\n\n");
          startConsole();
          return;
        }
        const out = runCmd(cmd);
        el.insertAdjacentHTML("beforeend", (out ? out + "\n" : ""));
        prompt();
        el.scrollTop = el.scrollHeight;
      });
    };
    el.insertAdjacentHTML("beforeend", `Last login: ${new Date().toDateString()} on tty1\n`);
    prompt();
  }

  function startRescue() {
    const el = $("#tty");
    el.innerHTML = `=== Rescue environment (simulated) ===\nAnaconda rescue mode would search for existing RHEL installations,\nbind-mount them under /mnt/sysroot, and drop you in a root shell.\n\n1) Continue\n2) Reboot\n\nType 1 or 2: `;
    const inp = document.createElement("input");
    inp.type = "text";
    el.appendChild(inp);
    inp.focus();
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (inp.value.trim() === "2") showGrub();
      else {
        inp.replaceWith(document.createTextNode(inp.value + "\nsh-5.2# this is a fake rescue shell. Type 'exit'.\n"));
        const sh = document.createElement("input");
        sh.type = "text";
        el.appendChild(sh);
        sh.focus();
        sh.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") showGrub();
        });
      }
    });
  }

  /* ---------- RESET / SKIP ---------- */
  function resetSim() {
    showScreen("screen-power");
  }

  function skipToInstalled() {
    state.destVisited = true;
    state.storage = "automatic";
    state.env = "server-gui";
    if (!state.user.created) {
      state.user = { full: "Demo User", name: "demo", pass: "redhat", admin: true, created: true };
    }
    state.installed = true;
    state.hostname = state.hostname || "rhel10.example.com";
    openDesktop();
    toast("Skipped to an installed Server with GUI session. Password: the one you set, or “redhat” if you skipped setup.");
  }

  $("#btn-skip").addEventListener("click", skipToInstalled);
  $("#btn-banner-help").addEventListener("click", () => $("#modal-help").classList.remove("hidden"));
  $("#help-close").addEventListener("click", () => $("#modal-help").classList.add("hidden"));

  /* boot */
  tickClocks();
})();
