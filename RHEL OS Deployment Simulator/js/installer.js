/* RHEL 10 Installation Lab Simulator — educational Anaconda-style hub */
const state = {
  lang: "English (United States)",
  locale: "en_US.UTF-8",
  keyboard: "us",
  timezone: "America/New_York",
  ntp: true,
  source: "Local media (DVD / ISO)",
  env: "Server",
  addons: [],
  disk: null,
  storage: "Automatic",
  encrypt: false,
  lvm: true,
  fs: "xfs",
  hostname: "localhost.localdomain",
  ipv4: "dhcp",
  connected: false,
  rootEnabled: true,
  rootPass: "",
  user: { full: "", name: "", pass: "", admin: true },
  installed: false,
  progress: 0,
};

const tasks = [
  { id: "lang", text: "Choose installation language and continue" },
  { id: "dest", text: "Select a disk under Installation Destination" },
  { id: "soft", text: "Pick a base environment (Software Selection)" },
  { id: "net", text: "Set a hostname (not localhost.localdomain)" },
  { id: "root", text: "Set a root password (8+ characters)" },
  { id: "user", text: "Create a local administrator user" },
  { id: "time", text: "Review Date & Time / timezone" },
  { id: "begin", text: "Click Begin Installation and wait for completion" },
  { id: "login", text: "Log in on first boot with your user" },
];
const done = new Set();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function show(id) {
  $$(".screen").forEach((el) => el.classList.toggle("active", el.id === id));
}

function mark(id) {
  done.add(id);
  renderLab();
}

function renderLab() {
  const ul = $("#lab-list");
  ul.innerHTML = tasks
    .map(
      (t) =>
        `<li class="${done.has(t.id) ? "ok" : ""}">${t.text}</li>`
    )
    .join("");
  const pct = Math.round((done.size / tasks.length) * 100);
  $("#score").textContent = `Lab score: ${done.size}/${tasks.length} (${pct}%)`;
  localStorage.setItem(
    "rhel10-lab",
    JSON.stringify({ done: [...done], state, when: Date.now() })
  );
}

function canBegin() {
  return (
    state.disk &&
    state.rootPass.length >= 8 &&
    state.user.name &&
    state.user.pass.length >= 8
  );
}

function renderHub() {
  const destOk = !!state.disk;
  const userOk = state.user.name && state.user.pass.length >= 8;
  const rootOk = state.rootPass.length >= 8;
  $("#hub-grid").innerHTML = [
    tile("time", "🕒", "Time & Date", `${state.timezone}<br>NTP ${state.ntp ? "on" : "off"}`, done.has("time")),
    tile("kbd", "⌨️", "Keyboard", state.keyboard.toUpperCase(), true),
    tile("lang2", "🌐", "Language Support", state.lang, true),
    tile("src", "💿", "Installation Source", state.source, true),
    tile("soft", "📦", "Software Selection", `${state.env}${state.addons.length ? " + add-ons" : ""}`, done.has("soft")),
    tile("dest", "💾", "Installation Destination", destOk ? `${state.disk} · ${state.storage} · ${state.fs.toUpperCase()}` : "No disks selected — required", destOk, !destOk),
    tile("net", "🔌", "Network & Host Name", `${state.hostname}<br>${state.ipv4.toUpperCase()}`, done.has("net") || state.hostname !== "localhost.localdomain"),
    tile("rhsm", "🪪", "Connect to Red Hat", state.connected ? "Registered (simulated)" : "Not registered (optional in lab)", true),
    tile("root", "🔐", "Root Password", rootOk ? "Root account enabled" : "Root password is required", rootOk, !rootOk),
    tile("user", "👤", "User Creation", userOk ? `${state.user.name} (admin)` : "Create a user — required", userOk, !userOk),
  ].join("");
  $("#begin-btn").disabled = !canBegin();
}

function tile(id, ico, title, sum, ok, warn) {
  return `<button class="tile ${warn ? "warn" : ""} ${ok ? "done" : ""}" data-spoke="${id}">
    <div class="ico">${ico}</div>
    <h3>${title}</h3>
    <div class="sum">${sum}</div>
    <div class="badge">${warn ? "⚠ Needs attention" : ok ? "✓ Configured" : ""}</div>
  </button>`;
}

function openSpoke(id) {
  const map = {
    time: spokeTime,
    kbd: spokeKbd,
    lang2: spokeLang,
    src: spokeSrc,
    soft: spokeSoft,
    dest: spokeDest,
    net: spokeNet,
    rhsm: spokeRhsm,
    root: spokeRoot,
    user: spokeUser,
  };
  if (map[id]) map[id]();
}

function modal(title, html, onDone) {
  $("#spoke-title").textContent = title;
  $("#spoke-body").innerHTML = html;
  $("#overlay").classList.add("show");
  $("#spoke-done").onclick = () => {
    onDone();
    $("#overlay").classList.remove("show");
    renderHub();
  };
}

function spokeTime() {
  modal(
    "Time & Date",
    `<p class="help">RHEL 10 uses timedatectl. Choose a region. NTP is recommended.</p>
     <div class="field"><label>Timezone</label>
     <select id="tz">
       ${[
         "America/New_York","America/Chicago","America/Los_Angeles","Europe/London",
         "Europe/Berlin","Asia/Kolkata","Asia/Tokyo","Australia/Sydney","UTC"
       ].map((z) => `<option ${z === state.timezone ? "selected" : ""}>${z}</option>`).join("")}
     </select></div>
     <label><input type="checkbox" id="ntp" ${state.ntp ? "checked" : ""}> Use Network Time (chronyd)</label>`,
    () => {
      state.timezone = $("#tz").value;
      state.ntp = $("#ntp").checked;
      mark("time");
    }
  );
}

function spokeKbd() {
  modal(
    "Keyboard",
    `<div class="field"><label>Layout</label>
     <select id="kb">${["us","uk","de","fr","in","jp"].map((k) =>
       `<option ${k === state.keyboard ? "selected" : ""}>${k}</option>`
     ).join("")}</select></div>`,
    () => { state.keyboard = $("#kb").value; }
  );
}

function spokeLang() {
  modal(
    "Language Support",
    `<p class="help">Installer language was already chosen. Additional locales can be added here.</p>
     <div class="field"><label>Primary locale</label>
     <select id="loc">
       <option>en_US.UTF-8</option><option>en_GB.UTF-8</option><option>ta_IN.UTF-8</option>
       <option>hi_IN.UTF-8</option><option>de_DE.UTF-8</option>
     </select></div>`,
    () => { state.locale = $("#loc").value; }
  );
}

function spokeSrc() {
  modal(
    "Installation Source",
    `<p class="help">This lab boots from a simulated DVD ISO (AppStream + BaseOS).</p>
     <label><input type="radio" name="src" value="Local media (DVD / ISO)" checked> Local media</label><br>
     <label><input type="radio" name="src" value="On the network (http)"> On the network (http://mirror.example/rhel10)</label>`,
    () => {
      const r = document.querySelector('input[name="src"]:checked');
      state.source = r.value;
    }
  );
}

function spokeSoft() {
  const envs = [
    ["Server", "Headless server. Common for RH124/RH134 labs."],
    ["Server with GUI", "Server plus GNOME (cockpit still available either way)."],
    ["Minimal Install", "Smallest footprint. Add packages later with dnf."],
    ["Workstation", "Developer / desktop workstation."],
    ["Custom Operating System", "Empty base; pick add-ons only."],
  ];
  const adds = ["Guest Agents", "Headless Management", "Standard", "Container Management", "Development Tools"];
  modal(
    "Software Selection",
    `<p class="help">Base Environment (one) plus optional add-ons. RHEL 10 uses DNF5 / AppStream.</p>
     ${envs.map(([n, d]) => `<button type="button" class="env ${state.env === n ? "on" : ""}" data-e="${n}"><b>${n}</b><br><small>${d}</small></button>`).join("")}
     <p><b>Add-ons</b></p>
     ${adds.map((a) => `<label><input type="checkbox" class="addon" value="${a}" ${state.addons.includes(a) ? "checked" : ""}> ${a}</label><br>`).join("")}`,
    () => {
      const on = document.querySelector(".env.on");
      if (on) state.env = on.dataset.e;
      state.addons = $$(".addon:checked").map((x) => x.value);
      mark("soft");
    }
  );
  setTimeout(() => {
    $$(".env").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".env").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
      })
    );
  }, 0);
}

function spokeDest() {
  const disks = [
    { id: "vda", label: "VirtIO Disk 1 — 20 GiB (vda)", hint: "Typical KVM / lab VM disk" },
    { id: "sda", label: "SATA Disk — 40 GiB (sda)", hint: "Bare-metal or VirtualBox SATA" },
    { id: "nvme0n1", label: "NVMe — 256 GiB (nvme0n1)", hint: "Physical workstation" },
  ];
  modal(
    "Installation Destination",
    `<p class="help">Nothing is written until Begin Installation. Automatic partitioning on RHEL 10 uses LVM + XFS for / (and /boot as XFS; ESP on UEFI).</p>
     ${disks.map((d) => `<div class="disk ${state.disk === d.id ? "on" : ""}" data-id="${d.id}"><b>${d.label}</b><br><small>${d.hint}</small></div>`).join("")}
     <div class="field"><label>Storage configuration</label>
       <select id="stor">
         <option>Automatic</option>
         <option>Custom (Blivet-GUI style)</option>
       </select>
     </div>
     <label><input type="checkbox" id="lvm" ${state.lvm ? "checked" : ""}> Use LVM</label><br>
     <label><input type="checkbox" id="enc"> Encrypt my data (LUKS2)</label>
     <div class="field"><label>Root filesystem</label>
       <select id="fs"><option value="xfs">XFS (default)</option><option value="ext4">ext4</option></select>
     </div>`,
    () => {
      const d = document.querySelector(".disk.on");
      state.disk = d ? d.dataset.id : state.disk;
      state.storage = $("#stor").value;
      state.lvm = $("#lvm").checked;
      state.encrypt = $("#enc").checked;
      state.fs = $("#fs").value;
      if (state.disk) mark("dest");
    }
  );
  setTimeout(() => {
    $$(".disk").forEach((el) =>
      el.addEventListener("click", () => {
        $$(".disk").forEach((x) => x.classList.remove("on"));
        el.classList.add("on");
      })
    );
  }, 0);
}

function spokeNet() {
  modal(
    "Network & Host Name",
    `<p class="help">NetworkManager (nmcli / nmtui). A unique hostname is required for this lab.</p>
     <div class="field"><label>Host name</label><input id="hn" value="${state.hostname}" placeholder="server1.lab.example.com"></div>
     <div class="field"><label>IPv4</label>
       <select id="ip"><option value="dhcp">Automatic (DHCP)</option><option value="static">Manual</option></select>
     </div>
     <div id="static" style="display:none">
       <div class="row">
         <div class="field"><label>Address</label><input id="addr" value="192.168.122.50"></div>
         <div class="field"><label>Prefix</label><input id="pref" value="24"></div>
       </div>
       <div class="field"><label>Gateway</label><input id="gw" value="192.168.122.1"></div>
     </div>`,
    () => {
      state.hostname = $("#hn").value.trim() || "localhost.localdomain";
      state.ipv4 = $("#ip").value;
      if (state.hostname !== "localhost.localdomain") mark("net");
    }
  );
  setTimeout(() => {
    $("#ip").addEventListener("change", () => {
      $("#static").style.display = $("#ip").value === "static" ? "block" : "none";
    });
  }, 0);
}

function spokeRhsm() {
  modal(
    "Connect to Red Hat",
    `<p class="help">Production systems register with subscription-manager. This lab only simulates the screen.</p>
     <div class="field"><label>Red Hat account (optional)</label><input id="rhuser" placeholder="student@example.com"></div>
     <div class="field"><label>Password</label><input type="password" id="rhpass"></div>
     <p class="help">Leave blank to skip. You can still complete the install (like using a developer subscription later).</p>`,
    () => {
      state.connected = !!$("#rhuser").value;
    }
  );
}

function spokeRoot() {
  modal(
    "Root Password",
    `<p class="help">RHEL allows a locked root with only sudo users. This lab requires an enabled root password (min 8 chars).</p>
     <label><input type="checkbox" id="rooton" ${state.rootEnabled ? "checked" : ""}> Enable root account</label>
     <div class="field"><label>Root password</label><input type="password" id="rp1"></div>
     <div class="field"><label>Confirm</label><input type="password" id="rp2"></div>`,
    () => {
      state.rootEnabled = $("#rooton").checked;
      const a = $("#rp1").value, b = $("#rp2").value;
      if (a && a === b && a.length >= 8) {
        state.rootPass = a;
        mark("root");
      } else if (a) {
        alert("Passwords must match and be at least 8 characters.");
      }
    }
  );
}

function spokeUser() {
  modal(
    "Create User",
    `<p class="help">Create a local user and add them to the wheel group (sudo).</p>
     <div class="field"><label>Full name</label><input id="fn" value="${state.user.full}"></div>
     <div class="field"><label>User name</label><input id="un" value="${state.user.name}" placeholder="student"></div>
     <div class="field"><label>Password</label><input type="password" id="up1"></div>
     <div class="field"><label>Confirm</label><input type="password" id="up2"></div>
     <label><input type="checkbox" id="adm" ${state.user.admin ? "checked" : ""}> Make this user administrator</label>`,
    () => {
      const p1 = $("#up1").value, p2 = $("#up2").value;
      state.user.full = $("#fn").value;
      state.user.name = $("#un").value.trim();
      state.user.admin = $("#adm").checked;
      if (state.user.name && p1 === p2 && p1.length >= 8) {
        state.user.pass = p1;
        mark("user");
      } else {
        alert("Need a username and matching passwords (8+ characters).");
      }
    }
  );
}

function startInstall() {
  if (!canBegin()) return;
  show("screen-progress");
  mark("begin");
  const steps = [
    "Setting up installation environment",
    "Configuring storage on /dev/" + state.disk,
    state.lvm ? "Creating LVM volume group rhel" : "Creating standard partitions",
    "Formatting /boot (xfs) and / (" + state.fs + ")",
    "Installing BaseOS package set",
    "Installing " + state.env + " environment",
    "Writing bootloader (grub2-efi / grub2-pc)",
    "Creating user " + state.user.name + " (wheel=" + state.user.admin + ")",
    "Configuring NetworkManager hostname " + state.hostname,
    "Running post-installation scripts",
    "Installation complete",
  ];
  let i = 0;
  const log = $("#install-log");
  const bar = $("#pbar");
  const tick = () => {
    if (i < steps.length) {
      log.textContent += `[anaconda] ${steps[i]}\n`;
      log.scrollTop = log.scrollHeight;
      i++;
      bar.style.width = Math.round((i / steps.length) * 100) + "%";
      setTimeout(tick, 700);
    } else {
      state.installed = true;
      $("#reboot-btn").disabled = false;
    }
  };
  tick();
}

function bootLogin() {
  show("screen-login");
  $("#login-host").textContent = state.hostname;
}

function doLogin() {
  const u = $("#login-user").value.trim();
  const p = $("#login-pass").value;
  const ok =
    (u === state.user.name && p === state.user.pass) ||
    (u === "root" && p === state.rootPass);
  if (!ok) {
    $("#login-err").textContent = "Login incorrect";
    return;
  }
  mark("login");
  show("screen-desktop");
  $("#who").textContent = u;
  const term = $("#term-out");
  const banner = `Red Hat Enterprise Linux 10.0 (Coughlan)
Kernel 6.12.0-55.el10.x86_64 on an x86_64

${state.hostname} login: ${u}
`;
  term.textContent = banner + (u === "root" ? "[root@rhel10 ~]# " : `[${u}@rhel10 ~]$ `);
  $("#prompt").textContent = u === "root" ? "[root@rhel10 ~]# " : `[${u}@rhel10 ~]$ `;
  window.__user = u;
}

const fakeCmd = {
  help: "Lab commands: uname -r, cat /etc/os-release, hostnamectl, lsblk, df -hT, whoami, id, date, timedatectl, nmcli, systemctl status chronyd, dnf repolist, cat /etc/redhat-release",
};

function runCmd(line) {
  const u = window.__user || "student";
  const out = $("#term-out");
  const p = u === "root" ? "[root@rhel10 ~]# " : `[${u}@rhel10 ~]$ `;
  let res = "";
  const c = line.trim();
  if (!c) {
    out.textContent += "\n" + p;
    return;
  }
  if (c === "clear") {
    out.textContent = p;
    return;
  }
  const answers = {
    "uname -r": "6.12.0-55.el10.x86_64",
    "uname -a": "Linux " + state.hostname.split(".")[0] + " 6.12.0-55.el10.x86_64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux",
    "cat /etc/redhat-release": "Red Hat Enterprise Linux release 10.0 (Coughlan)",
    "cat /etc/os-release": `NAME="Red Hat Enterprise Linux"
VERSION="10.0 (Coughlan)"
ID="rhel"
ID_LIKE="fedora"
VERSION_ID="10.0"
PLATFORM_ID="platform:el10"
PRETTY_NAME="Red Hat Enterprise Linux 10.0 (Coughlan)"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:redhat:enterprise_linux:10::baseos"
HOME_URL="https://www.redhat.com/"
`,
    hostnamectl: ` Static hostname: ${state.hostname}
       Icon name: computer-vm
         Chassis: vm
      Machine ID: a1b2c3d4e5f60718293a4b5c6d7e8f90
         Boot ID: 11223344556677889900aabbccddeeff
  Operating System: Red Hat Enterprise Linux 10.0 (Coughlan)
       CPE OS Name: cpe:/o:redhat:enterprise_linux:10::baseos
            Kernel: Linux 6.12.0-55.el10.x86_64
      Architecture: x86-64
   Hardware Vendor: Lab Simulator
    Hardware Model: RHEL10-INSTALL-LAB
  Firmware Version: UEFI-SIM-1.0`,
    whoami: u,
    id: `uid=1000(${state.user.name}) gid=1000(${state.user.name}) groups=1000(${state.user.name}),10(wheel)`,
    date: new Date().toString(),
    timedatectl: `               Local time: ${new Date().toString()}
           Time zone: ${state.timezone}
System clock synchronized: ${state.ntp ? "yes" : "no"}
              NTP service: ${state.ntp ? "active" : "inactive"}`,
    lsblk: `NAME          MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
${state.disk || "vda"}           252:0    0   20G  0 disk
├─${state.disk || "vda"}1        252:1    0  600M  0 part /boot/efi
├─${state.disk || "vda"}2        252:2    0    1G  0 part /boot
└─${state.disk || "vda"}3        252:3    0 18.4G  0 part
  ├─rhel-root 253:0    0 16.4G  0 lvm  /
  └─rhel-swap 253:1    0    2G  0 lvm  [SWAP]`,
    "df -hT": `Filesystem          Type      Size  Used Avail Use% Mounted on
/dev/mapper/rhel-root ${state.fs.padEnd(6)}  17G  2.1G   15G  13% /
/dev/${state.disk || "vda"}2      xfs      1014M  198M  817M  20% /boot
/dev/${state.disk || "vda"}1      vfat      599M  7.2M  592M   2% /boot/efi`,
    "dnf repolist": `repo id                         repo name
rhel-10-for-x86_64-baseos-rpms  Red Hat Enterprise Linux 10 for x86_64 - BaseOS
rhel-10-for-x86_64-appstream-rpms Red Hat Enterprise Linux 10 for x86_64 - AppStream`,
    "systemctl status chronyd": state.ntp
      ? "● chronyd.service - NTP client/server\n     Active: active (running)"
      : "○ chronyd.service - NTP client/server\n     Active: inactive (dead)",
    nmcli: `${state.hostname} | connected | eth0 | ethernet`,
    help: fakeCmd.help,
  };
  if (c === "id" && u === "root") res = "uid=0(root) gid=0(root) groups=0(root)";
  else res = answers[c] || `bash: ${c}: command not found (try: help)`;
  out.textContent += c + "\n" + res + "\n" + p;
  out.scrollTop = out.scrollHeight;
}

function initLang() {
  const langs = [
    "English (United States)","English (United Kingdom)","English (India)",
    "Tamil (India)","Hindi (India)","Spanish (Spain)","French (France)",
    "German (Germany)","Japanese (Japan)","Chinese (Simplified)",
  ];
  const box = $("#lang-list");
  langs.forEach((l, i) => {
    const b = document.createElement("button");
    b.textContent = l;
    if (i === 0) b.classList.add("on");
    b.onclick = () => {
      $$("#lang-list button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      state.lang = l;
    };
    box.appendChild(b);
  });
}

function initGrub() {
  const items = $$(".grub-item");
  let i = 0;
  const sel = () => items.forEach((el, n) => el.classList.toggle("sel", n === i));
  sel();
  document.addEventListener("keydown", (e) => {
    if (!$("#screen-grub").classList.contains("active")) return;
    if (e.key === "ArrowDown") { i = Math.min(items.length - 1, i + 1); sel(); }
    if (e.key === "ArrowUp") { i = Math.max(0, i - 1); sel(); }
    if (e.key === "Enter") bootSelected(i);
  });
  items.forEach((el, n) => el.addEventListener("click", () => { i = n; sel(); bootSelected(n); }));
}

function bootSelected(i) {
  if (i === 2) {
    alert("This is a simulator. Rescue mode is not implemented. Choose Install Red Hat Enterprise Linux 10.");
    return;
  }
  if (i === 1) {
    alert("Test this media would checksum the ISO. Skipping in the lab — booting installer.");
  }
  show("screen-lang");
}

document.addEventListener("DOMContentLoaded", () => {
  initGrub();
  initLang();
  renderLab();
  $("#continue-lang").onclick = () => {
    mark("lang");
    show("screen-hub");
    renderHub();
  };
  $("#hub-grid").addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) openSpoke(t.dataset.spoke);
  });
  $("#begin-btn").onclick = startInstall;
  $("#reboot-btn").onclick = bootLogin;
  $("#do-login").onclick = doLogin;
  $("#cmd").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runCmd(e.target.value);
      e.target.value = "";
    }
  });
  $("#reset-lab").onclick = () => {
    localStorage.removeItem("rhel10-lab");
    location.reload();
  };
});
