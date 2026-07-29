/* ===========================================================
   Đồ án CNPM — Quản lý cuộc họp
   Fixed: Login riêng + Tài liệu + Trang thiết bị
=========================================================== */

(() => {
  "use strict";

  const TODAY = new Date(2026, 6, 2);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const dowShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const storage = {
    get(key, fallback) {
      const data = localStorage.getItem(`cnpm_${key}`);
      return data ? JSON.parse(data) : fallback;
    },
    set(key, value) {
      localStorage.setItem(`cnpm_${key}`, JSON.stringify(value));
    }
  };

  let currentUser = storage.get("currentUser", {
    name: "Minh Tuấn",
    email: localStorage.getItem("cnpm_login_email") || "admin",
    phone: "0901 234 567",
    role: "Quản lý"
  });

  // Bổ sung email cho dữ liệu cũ đã lưu trước bản cập nhật.
  if (!currentUser.email) {
    currentUser.email = localStorage.getItem("cnpm_login_email") || "admin";
    storage.set("currentUser", currentUser);
  }

  const defaultMembers = [
    { name: "Nguyễn Minh", role: "Quản lý", email: "minh.nguyen@company.com" },
    { name: "Lê Hoa", role: "Nhân viên", email: "hoa.le@company.com" },
    { name: "Trần Bình", role: "Nhân viên", email: "binh.tran@company.com" },
    { name: "Phạm Dung", role: "Nhân viên", email: "dung.pham@company.com" },
    { name: "Đỗ Khánh", role: "Nhân viên", email: "khanh.do@company.com" },
    { name: "Vũ Hùng", role: "Admin", email: "hung.vu@company.com" }
  ];

  let members = storage.get("members", defaultMembers);

  const defaultDocuments = [
    { title: "Tài liệu đặc tả hệ thống Q3", type: "PDF", date: "02/07/2026" },
    { title: "Bản vẽ wireframe Dashboard mới", type: "Figma Link", date: "02/07/2026" },
    { title: "Kịch bản test case sprint 4", type: "DOCX", date: "01/07/2026" },
    { title: "Báo cáo tiến độ dự án tháng 6", type: "XLSX", date: "30/06/2026" }
  ];

  let documents = storage.get("documents", defaultDocuments);

  const defaultEquipment = [
    { name: "Máy chiếu", quantity: 3, status: "Sẵn sàng" },
    { name: "Micro không dây", quantity: 5, status: "Sẵn sàng" },
    { name: "Laptop trình chiếu", quantity: 2, status: "Đang sử dụng" },
    { name: "Loa phòng họp", quantity: 2, status: "Bảo trì" }
  ];

  let equipment = storage.get("equipment", defaultEquipment);

  const defaultNotifications = [
    { text: "Nguyễn Minh đã gửi tài liệu mới", time: "5 phút trước", unread: true, dotClass: "purple" },
    { text: "Task #234 đã được hoàn thành", time: "20 phút trước", unread: true, dotClass: "success" },
    { text: "Lê Hoa đã tham gia nhóm dự án", time: "1 giờ trước", unread: false, dotClass: "purple" },
    { text: "Báo cáo tháng 6 đã sẵn sàng", time: "2 giờ trước", unread: false, dotClass: "warning" }
  ];

  let notifications = storage.get("notifications", defaultNotifications);

  let uid = storage.get("uid", 200);

  const defaultMeetings = [
    {
      id: 101,
      title: "Họp nhóm phát triển",
      description: "Cập nhật tiến độ sprint hiện tại.",
      room: "P.101",
      date: iso(TODAY),
      start: "09:00",
      end: "10:00",
      participants: ["Nguyễn Minh", "Lê Hoa", "Trần Bình"],
      docs: ["Tài liệu đặc tả hệ thống Q3"],
      status: "ongoing"
    },
    {
      id: 102,
      title: "Review thiết kế UI",
      description: "Rà soát bản thiết kế mới.",
      room: "P.203",
      date: iso(TODAY),
      start: "11:00",
      end: "11:30",
      participants: ["Phạm Dung", "Đỗ Khánh"],
      docs: ["Bản vẽ wireframe Dashboard mới"],
      status: "upcoming"
    },
    {
      id: 103,
      title: "Demo sản phẩm Q3",
      description: "Trình bày demo tính năng mới.",
      room: "P.301",
      date: iso(TODAY),
      start: "14:00",
      end: "15:30",
      participants: ["Nguyễn Minh", "Vũ Hùng"],
      docs: [],
      status: "upcoming"
    },
    {
      id: 104,
      title: "1:1 với PM",
      description: "Trao đổi định kỳ.",
      room: "P.105",
      date: iso(TODAY),
      start: "16:30",
      end: "17:15",
      participants: ["Nguyễn Minh"],
      docs: [],
      status: "upcoming"
    }
  ];

  let meetings = storage.get("meetings", defaultMeetings);

  const STATUS_LABEL = {
    upcoming: "Sắp diễn ra",
    ongoing: "Đang diễn ra",
    ended: "Đã kết thúc",
    cancelled: "Đã hủy"
  };

  function vnDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return `${dowShort[d.getDay()]}, ${fmt(d)}`;
  }

  function getAvatarLetters(name) {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function svgIcon(name) {
    const icons = {
      clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
      pin: `<svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
      users: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/></svg>`,
      edit: `<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>`,
      trash: `<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`,
      check: `<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
      doc: `<svg viewBox="0 0 24 24"><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5M8 13h8M8 17h8"/></svg>`,
      equipment: `<svg viewBox="0 0 24 24"><path d="M4 5h16v10H4z"/><path d="M8 19h8M12 15v4"/></svg>`
    };

    return icons[name] || "";
  }

  function badgeHTML(status) {
    const pulse = status === "ongoing" ? `<span class="pulse"></span>` : "";
    return `<span class="badge st-${status}">${pulse}${STATUS_LABEL[status]}</span>`;
  }

  function toast(msg, type = "info") {
    const stack = $("#toast-stack");
    if (!stack) return;

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="tdot"></span>${msg}`;

    stack.appendChild(el);

    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  const appShell = $("#app-shell");
  if (appShell) appShell.hidden = false;

  const logoutBtn = $("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLogin");
      localStorage.removeItem("userEmail");
      window.location.href = "login.html";
    });
  }

  function syncUserUI() {
    const avatar = getAvatarLetters(currentUser.name);

    if ($("#side-name")) $("#side-name").textContent = currentUser.name;
    if ($("#side-role")) $("#side-role").textContent = currentUser.role;
    if ($("#side-avatar")) $("#side-avatar").textContent = avatar;
    if ($("#open-profile-2")) $("#open-profile-2").textContent = avatar;
    if ($("#greet-name")) $("#greet-name").textContent = currentUser.name;
    if ($("#profile-avatar-display")) $("#profile-avatar-display").textContent = avatar;
  }

  function openProfileModal() {
    if ($("#profile-name")) $("#profile-name").value = currentUser.name || "";
    if ($("#profile-email")) $("#profile-email").value = currentUser.email || localStorage.getItem("cnpm_login_email") || "admin";
    if ($("#profile-phone")) $("#profile-phone").value = currentUser.phone || "";
    if ($("#profile-role")) $("#profile-role").value = currentUser.role || "Quản lý";
    syncUserUI();
    openModal("#modal-profile");
  }

  [$("#open-profile"), $("#open-profile-2")].forEach(btn => {
    if (btn) btn.addEventListener("click", openProfileModal);
  });

  if ($("#form-profile")) {
    $("#form-profile").addEventListener("submit", e => {
      e.preventDefault();

      const oldName = currentUser.name;
      currentUser = {
        name: $("#profile-name").value.trim(),
        email: $("#profile-email").value.trim(),
        phone: $("#profile-phone").value.trim(),
        role: $("#profile-role").value
      };

      // Đồng bộ email hồ sơ với email dùng để đăng nhập.
      localStorage.setItem("cnpm_login_email", currentUser.email);

      storage.set("currentUser", currentUser);
      syncUserUI();
      closeModal();
      toast("Đã cập nhật thông tin Admin!", "success");

      addNotification(
        oldName !== currentUser.name
          ? `Thông tin Admin đã được cập nhật thành ${currentUser.name}`
          : `${currentUser.name} đã cập nhật thông tin Admin`,
        "success"
      );
    });
  }

  const VIEW_META = {
    dashboard: ["Tổng quan", "Thứ Năm, 02 tháng 7 năm 2026"],
    "schedule-view": ["Xem lịch họp", "Toàn bộ lịch theo tháng"],
    "schedule-filter": ["Lọc lịch họp", "Thu hẹp theo tiêu chí"],
    "schedule-create": ["Tạo lịch họp", "Đặt lịch cuộc họp mới"],
    "meeting-list": ["Danh sách cuộc họp", "Quản lý cuộc họp của bạn"],
    "equipment-view": ["Trang thiết bị", "Quản lý thiết bị phòng họp"],
    "members-view": ["Thành viên", "Quản lý danh sách thành viên nội bộ"],
    "documents-view": ["Tài liệu", "Quản lý kho tài liệu đính kèm"],
    placeholder: ["Đang phát triển", ""]
  };

  function showView(view, opts = {}) {
    $$(".view").forEach(v => v.classList.remove("active"));

    const target = $(`.view[data-view="${view}"]`);
    if (target) target.classList.add("active");

    $$(".menu-item[data-view]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    $$(".submenu-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    const subViews = [
      "equipment-view",
      "schedule-view",
      "schedule-filter",
      "schedule-create",
      "meeting-list"
    ];

    const isSubView = subViews.includes(view);

    const meetingsToggle = $("#meetings-toggle");
    const meetingsSubmenu = $("#meetings-submenu");

    if (meetingsToggle && meetingsSubmenu) {
      meetingsToggle.classList.toggle("open", isSubView);
      if (isSubView) meetingsSubmenu.classList.add("open");
    }

    const meta = VIEW_META[view] || ["", ""];

    if ($("#topbar-title")) $("#topbar-title").textContent = opts.title || meta[0];
    if ($("#topbar-sub")) $("#topbar-sub").textContent = meta[1];

    if (view === "meeting-list") renderFullList();
    if (view === "schedule-view") renderCalendar();
    if (view === "schedule-filter") applyFilter();
    if (view === "schedule-create") resetCreateForm();
    if (view === "members-view") renderMembers();
    if (view === "documents-view") renderDocuments();
    if (view === "equipment-view") renderEquipment();

    closeMobileSidebar();
  }

  $$(".menu-item[data-view], .submenu-item[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "placeholder" && $("#placeholder-title")) {
        $("#placeholder-title").textContent = btn.dataset.title || "Đang phát triển";
      }

      showView(btn.dataset.view, {
        title: btn.dataset.title
      });
    });
  });

  $$("[data-view-jump]").forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.viewJump);
    });
  });

  function openSubmenu(force) {
    const sub = $("#meetings-submenu");
    const toggle = $("#meetings-toggle");

    if (!sub || !toggle) return;

    const open = force !== undefined ? force : !sub.classList.contains("open");

    sub.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
  }

  if ($("#meetings-toggle")) {
    $("#meetings-toggle").addEventListener("click", () => openSubmenu());
  }

  const sidebarEl = $(".sidebar");

  if ($("#burger")) {
    $("#burger").addEventListener("click", () => {
      sidebarEl?.classList.toggle("open");
    });
  }

  function closeMobileSidebar() {
    sidebarEl?.classList.remove("open");
  }

  function animateStats() {
    if ($("#stat-meetings")) {
      $("#stat-meetings").dataset.count =
        meetings.filter(m => m.date === iso(TODAY) && m.status !== "cancelled").length;
    }

    if ($("#stat-notifs")) {
      $("#stat-notifs").dataset.count =
        notifications.filter(n => n.unread).length;
    }

    if ($("#stat-members")) {
      $("#stat-members").dataset.count = members.length;
    }

    if ($("#stat-docs")) {
      $("#stat-docs").dataset.count = documents.length;
    }

    $$(".stat-num[data-count]").forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      let cur = 0;
      const step = Math.max(1, Math.round(target / 20));

      const timer = setInterval(() => {
        cur += step;

        if (cur >= target) {
          cur = target;
          clearInterval(timer);
        }

        el.textContent = cur;
      }, 25);
    });
  }

  function duration(m) {
    const [sh, sm] = m.start.split(":").map(Number);
    const [eh, em] = m.end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }
    function renderTodayList() {
    const el = $("#today-list");
    if (!el) return;

    const list = meetings
      .filter(m => m.date === iso(TODAY) && m.status !== "cancelled")
      .sort((a, b) => a.start.localeCompare(b.start));

    el.innerHTML = list.map(m => `
      <div class="mrow st-${m.status}">
        <div class="mrow-info">
          <p>${m.title}</p>
          <span>${m.start} · ${duration(m)} phút · ${m.participants.length} người</span>
        </div>
        ${badgeHTML(m.status)}
      </div>
    `).join("") || `<p class="muted">Không có cuộc họp nào hôm nay.</p>`;
  }

  function renderWeekGrid() {
    const el = $("#week-grid");
    if (!el) return;

    const monday = new Date(TODAY);
    monday.setDate(TODAY.getDate() - ((TODAY.getDay() + 6) % 7));

    let html = "";

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dayMeetings = meetings.filter(
        m => m.date === iso(d) && m.status !== "cancelled"
      );

      html += `
        <div class="week-cell">
          <p class="wd">${dowShort[d.getDay()]}</p>
          <p class="wn">${d.getDate()}</p>
          ${dayMeetings.slice(0, 1).map(m => `
            <div class="chip">${m.title.split(" ").slice(0, 2).join(" ")}</div>
          `).join("")}
        </div>
      `;
    }

    el.innerHTML = html;
  }

  function renderNotifications() {
    const unreadCount = notifications.filter(n => n.unread).length;
    const todayCount = meetings.filter(
      m => m.date === iso(TODAY) && m.status !== "cancelled"
    ).length;

    if ($("#notif-dot")) {
      $("#notif-dot").style.display = unreadCount > 0 ? "block" : "none";
    }

    if ($("#greet-sub")) {
      $("#greet-sub").textContent =
        unreadCount > 0
          ? `Bạn có ${todayCount} cuộc họp hôm nay và ${unreadCount} thông báo mới.`
          : `Bạn có ${todayCount} cuộc họp hôm nay.`;
    }

    const html = notifications.map(n => `
      <li style="display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:13px;">
        <span class="dot ${n.dotClass}" style="opacity:${n.unread ? "1" : "0.25"};"></span>
        <span style="flex-grow:1; font-weight:${n.unread ? "600" : "400"};">${n.text}</span>
        <time style="font-size:11px; color:#8a879f;">${n.time}</time>
      </li>
    `).join("");

    if ($("#notif-list")) $("#notif-list").innerHTML = html;
    if ($("#notif-dropdown-list")) $("#notif-dropdown-list").innerHTML = html;
  }

  function addNotification(text, dotClass = "purple") {
    notifications.unshift({
      text,
      time: "Vừa xong",
      unread: true,
      dotClass
    });

    // Giữ danh sách gọn, tránh localStorage tăng mãi.
    notifications = notifications.slice(0, 30);
    storage.set("notifications", notifications);
    renderNotifications();
    animateStats();
  }

  if ($("#notif-btn")) {
    $("#notif-btn").addEventListener("click", e => {
      e.stopPropagation();
      const dropdown = $("#notif-dropdown");
      if (dropdown) dropdown.hidden = !dropdown.hidden;
    });
  }

  document.addEventListener("click", e => {
    const dropdown = $("#notif-dropdown");
    if (dropdown && !dropdown.hidden && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
    }
  });

  function markAllNotificationsRead() {
    notifications.forEach(n => n.unread = false);
    storage.set("notifications", notifications);
    renderNotifications();
    animateStats();
  }

  if ($("#mark-read")) $("#mark-read").addEventListener("click", markAllNotificationsRead);
  if ($("#notif-clear-btn")) $("#notif-clear-btn").addEventListener("click", markAllNotificationsRead);

  function updateMultiselectPanels() {
    const memberHtml = members.map(m => `
      <label class="ms-option">
        <input type="checkbox" value="${m.name}">
        <span class="ms-avatar">${getAvatarLetters(m.name)}</span>
        ${m.name}
      </label>
    `).join("");

    const docHtml = documents.map(d => `
      <label class="ms-option">
        <input type="checkbox" value="${d.title}">
        <span class="ms-avatar">DOC</span>
        ${d.title}
      </label>
    `).join("");

    if ($("#create-participants-panel")) $("#create-participants-panel").innerHTML = memberHtml;
    if ($("#edit-participants-panel")) $("#edit-participants-panel").innerHTML = memberHtml;
    if ($("#create-docs-panel")) $("#create-docs-panel").innerHTML = docHtml;
    if ($("#edit-docs-panel")) $("#edit-docs-panel").innerHTML = docHtml;

    $$("[data-multiselect]").forEach(root => {
      if (root._renderChips) root._renderChips();
    });
  }

  function renderMembers() {
    const el = $("#members-list");
    if (!el) return;

    el.innerHTML = members.map(m => `
      <div class="lrow" style="padding:12px 15px; margin-bottom:8px; background:#fff; border-radius:6px; display:flex; align-items:center; gap:15px;">
        <span class="avatar big">${getAvatarLetters(m.name)}</span>
        <div style="flex-grow:1;">
          <p style="font-weight:600; margin:0;">${m.name}</p>
          <span style="font-size:12px; color:#8a879f;">
            Chức vụ: <strong>${m.role}</strong> · Email: ${m.email}
          </span>
        </div>
      </div>
    `).join("");
  }

  if ($("#btn-add-member")) {
    $("#btn-add-member").addEventListener("click", () => openModal("#modal-add-member"));
  }

  if ($("#form-add-member")) {
    $("#form-add-member").addEventListener("submit", e => {
      e.preventDefault();

      members.push({
        name: $("#member-name").value,
        role: $("#member-role").value,
        email: $("#member-email").value
      });

      storage.set("members", members);

      toast("Đã thêm thành viên mới!", "success");
      closeModal();
      renderMembers();
      updateMultiselectPanels();
      animateStats();
      e.target.reset();
    });
  }

  function renderDocuments() {
    const el = $("#documents-list");
    if (!el) return;

    el.innerHTML = documents.map((d, index) => `
      <div class="lrow" style="padding:12px 15px; margin-bottom:8px; background:#fff; border-radius:6px; display:flex; align-items:center; gap:15px;">
        <span style="padding:10px; background:#fff8e7; color:#c88a1c; border-radius:6px;">
          ${svgIcon("doc")}
        </span>

        <div style="flex-grow:1;">
          <p style="font-weight:600; margin:0;">${d.title}</p>
          <span style="font-size:12px; color:#8a879f;">
            Định dạng: <strong>${d.type}</strong> · Ngày tải lên: ${d.date}
          </span>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="act-btn edit" data-edit-doc="${index}">Sửa</button>
          <button class="act-btn cancel" data-delete-doc="${index}">Xóa</button>
        </div>
      </div>
    `).join("");

    $$("[data-edit-doc]", el).forEach(btn => {
      btn.addEventListener("click", () => editDocument(Number(btn.dataset.editDoc)));
    });

    $$("[data-delete-doc]", el).forEach(btn => {
      btn.addEventListener("click", () => deleteDocument(Number(btn.dataset.deleteDoc)));
    });
  }

  function editDocument(index) {
    const doc = documents[index];
    if (!doc) return;

    const newTitle = prompt("Nhập tên tài liệu mới:", doc.title);
    if (!newTitle || newTitle.trim() === "") return;

    const newType = prompt("Nhập định dạng:", doc.type);
    if (!newType || newType.trim() === "") return;

    documents[index].title = newTitle.trim();
    documents[index].type = newType.trim().toUpperCase();

    storage.set("documents", documents);

    toast("Đã sửa tài liệu!", "success");
    addNotification(`${currentUser.name} đã cập nhật tài liệu “${documents[index].title}”`, "warning");
    renderDocuments();
    updateMultiselectPanels();
  }

  function deleteDocument(index) {
    const doc = documents[index];
    if (!doc) return;

    if (!confirm(`Bạn có chắc muốn xóa "${doc.title}" không?`)) return;

    documents.splice(index, 1);
    storage.set("documents", documents);

    toast("Đã xóa tài liệu!", "danger");
    renderDocuments();
    updateMultiselectPanels();
    animateStats();
  }

  if ($("#btn-add-doc")) {
    $("#btn-add-doc").addEventListener("click", () => openModal("#modal-add-doc"));
  }

  if ($("#form-add-doc")) {
    $("#form-add-doc").addEventListener("submit", e => {
      e.preventDefault();

      const fileInput = $("#doc-file");
      const files = fileInput ? Array.from(fileInput.files) : [];

      if (!files.length) {
        toast("Vui lòng chọn ít nhất 1 tài liệu!", "danger");
        return;
      }

      files.forEach(file => {
        const ext = file.name.includes(".")
          ? file.name.split(".").pop().toUpperCase()
          : "FILE";

        documents.push({
          title: file.name,
          type: ext,
          date: fmt(TODAY)
        });
      });

      storage.set("documents", documents);

      const addedNames = files.map(file => file.name).join(", ");
      addNotification(`${currentUser.name} đã thêm tài liệu mới: ${addedNames}`, "warning");
      toast("Đã thêm tài liệu từ máy!", "success");
      closeModal();
      renderDocuments();
      updateMultiselectPanels();
      animateStats();
      e.target.reset();
    });
  }

  function renderEquipment() {
    const el = $("#equipment-list");
    if (!el) return;

    el.innerHTML = equipment.map((item, index) => `
      <div class="lrow" style="padding:12px 15px; margin-bottom:8px; background:#fff; border-radius:6px; display:flex; align-items:center; gap:15px;">
        <span style="padding:10px; background:#f2edff; color:#7c5cfc; border-radius:6px;">
          ${svgIcon("equipment")}
        </span>

        <div style="flex-grow:1;">
          <p style="font-weight:600; margin:0;">${item.name}</p>
          <span style="font-size:12px; color:#8a879f;">
            Số lượng: <strong>${item.quantity}</strong> · Trạng thái: <strong>${item.status}</strong>
          </span>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="act-btn edit" data-edit-equipment="${index}">Sửa</button>
          <button class="act-btn cancel" data-delete-equipment="${index}">Xóa</button>
        </div>
      </div>
    `).join("");

    $$("[data-edit-equipment]", el).forEach(btn => {
      btn.addEventListener("click", () => editEquipment(Number(btn.dataset.editEquipment)));
    });

    $$("[data-delete-equipment]", el).forEach(btn => {
      btn.addEventListener("click", () => deleteEquipment(Number(btn.dataset.deleteEquipment)));
    });
  }

  function editEquipment(index) {
    const item = equipment[index];
    if (!item) return;

    const name = prompt("Nhập tên thiết bị:", item.name);
    if (!name || name.trim() === "") return;

    const quantity = prompt("Nhập số lượng:", item.quantity);
    if (!quantity || quantity.trim() === "") return;

    const status = prompt("Nhập trạng thái:", item.status);
    if (!status || status.trim() === "") return;

    equipment[index] = {
      name: name.trim(),
      quantity: quantity.trim(),
      status: status.trim()
    };

    storage.set("equipment", equipment);

    toast("Đã sửa thiết bị!", "success");
    renderEquipment();
  }

  function deleteEquipment(index) {
    const item = equipment[index];
    if (!item) return;

    if (!confirm(`Bạn có chắc muốn xóa "${item.name}" không?`)) return;

    equipment.splice(index, 1);
    storage.set("equipment", equipment);

    toast("Đã xóa thiết bị!", "danger");
    renderEquipment();
  }

  if ($("#btn-add-equipment")) {
    $("#btn-add-equipment").addEventListener("click", () => {
      openModal("#modal-add-equipment");
    });
  }

  if ($("#form-add-equipment")) {
    $("#form-add-equipment").addEventListener("submit", e => {
      e.preventDefault();

      equipment.push({
        name: $("#equipment-name").value,
        quantity: $("#equipment-quantity").value,
        status: $("#equipment-status").value
      });

      storage.set("equipment", equipment);

      toast("Đã thêm thiết bị mới!", "success");
      closeModal();
      renderEquipment();
      e.target.reset();
    });
  }

  let calCursor = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  let calSelected = iso(TODAY);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  function renderCalendar() {
    if (!$("#cal-month") || !$("#cal-grid")) return;

    $("#cal-month").textContent =
      `${monthNames[calCursor.getMonth()]}, ${calCursor.getFullYear()}`;

    const grid = $("#cal-grid");
    const dows = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join("");

    const firstDay = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);

    start.setDate(1 - startOffset);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const dateStr = iso(d);
      const inMonth = d.getMonth() === calCursor.getMonth();
      const hasMeeting = meetings.some(m => m.date === dateStr && m.status !== "cancelled");

      html += `
        <div class="cal-day ${inMonth ? "" : "muted"} ${hasMeeting ? "has-meeting" : ""} ${dateStr === calSelected ? "selected" : ""}" data-date="${dateStr}">
          ${d.getDate()}
        </div>
      `;
    }

    grid.innerHTML = html;

    $$(".cal-day", grid).forEach(cell => {
      cell.addEventListener("click", () => {
        calSelected = cell.dataset.date;
        renderCalendar();
      });
    });

    renderCalDayList();
  }

  function renderCalDayList() {
    const el = $("#cal-day-list");
    if (!el) return;

    const list = meetings
      .filter(m => m.date === calSelected)
      .sort((a, b) => a.start.localeCompare(b.start));

    el.innerHTML = list.map(m => `
      <div class="mrow st-${m.status}">
        <div class="mrow-info">
          <p>${m.title}</p>
          <span>${m.start} - ${m.end} · ${m.room}</span>
        </div>
        ${badgeHTML(m.status)}
      </div>
    `).join("") || `<p class="empty">Không có cuộc họp vào ${vnDate(calSelected)}</p>`;
  }

  if ($("#cal-prev")) {
    $("#cal-prev").addEventListener("click", () => {
      calCursor.setMonth(calCursor.getMonth() - 1);
      renderCalendar();
    });
  }

  if ($("#cal-next")) {
    $("#cal-next").addEventListener("click", () => {
      calCursor.setMonth(calCursor.getMonth() + 1);
      renderCalendar();
    });
  }

  function applyFilter() {
    const form = $("#filter-form");
    if (!form) return;

    const range = form.range.value;
    const room = form.room.value;
    const status = form.status.value;

    let list = [...meetings];

    if (room !== "all") list = list.filter(m => m.room === room);
    if (status !== "all") list = list.filter(m => m.status === status);

    if (range === "month") {
      list = list.filter(m => m.date.slice(0, 7) === iso(TODAY).slice(0, 7));
    }

    if ($("#filter-count")) $("#filter-count").textContent = `${list.length} cuộc họp`;

    if ($("#filter-list")) {
      $("#filter-list").innerHTML = list.map(m => `
        <div class="mrow st-${m.status}">
          <div class="mrow-info">
            <p>${m.title}</p>
            <span>${vnDate(m.date)}, ${m.start} · ${m.room}</span>
          </div>
          ${badgeHTML(m.status)}
        </div>
      `).join("") || `<p class="muted">Không tìm thấy cuộc họp phù hợp.</p>`;
    }
  }

  if ($("#filter-form")) {
    $("#filter-form").addEventListener("submit", e => {
      e.preventDefault();
      applyFilter();
    });
  }

  function buildTimeOptions(select) {
    let html = "";

    for (let h = 7; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 21 && m > 0) continue;

        const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        html += `<option value="${value}">${value}</option>`;
      }
    }

    select.innerHTML = html;
  }

  $$("[data-time-select]").forEach(buildTimeOptions);

  function initMultiselect(root) {
    const box = $(".multiselect-box", root);
    const panel = $(".multiselect-panel", root);
    const chipsEl = $(".chips", root);

    if (!box || !panel || !chipsEl) return;

    function renderChips() {
      const checked = $$("input[type=checkbox]:checked", panel);

      if (!checked.length) {
        chipsEl.innerHTML = `<span class="chip-placeholder">Chọn</span>`;
        return;
      }

      chipsEl.innerHTML = checked.map(cb => `
        <span class="chip" data-value="${cb.value}">
          ${cb.value}
          <button type="button">&times;</button>
        </span>
      `).join("");
    }

    box.addEventListener("click", e => {
      e.stopPropagation();
      root.classList.toggle("open");
    });

    panel.addEventListener("change", renderChips);

    root._renderChips = renderChips;
    root._setValues = values => {
      $$("input[type=checkbox]", panel).forEach(cb => {
        cb.checked = values.includes(cb.value);
      });

      renderChips();
    };

    root._getValues = () =>
      $$("input[type=checkbox]:checked", panel).map(cb => cb.value);
  }

  $$("[data-multiselect]").forEach(initMultiselect);

  function equipmentStatusClass(status) {
    if (status === "Sẵn sàng") return "ready";
    if (status === "Đang sử dụng") return "busy";
    return "maintenance";
  }

  function renderCreateEquipmentOptions() {
    const container = $("#create-equipment-list");
    if (!container) return;

    if (!equipment.length) {
      container.innerHTML = `<div class="meeting-equipment-empty">Chưa có thiết bị. Hãy thêm thiết bị trong mục Trang thiết bị.</div>`;
      return;
    }

    container.innerHTML = equipment.map((item, index) => {
      const available = item.status === "Sẵn sàng" && Number(item.quantity) > 0;
      return `
        <label class="meeting-equipment-item ${available ? "" : "is-disabled"}">
          <input
            type="checkbox"
            name="meetingEquipment"
            value="${item.name}"
            ${available ? "" : "disabled"}
          >
          <span class="meeting-equipment-icon">${svgIcon("equipment")}</span>
          <span class="meeting-equipment-info">
            <strong>${item.name}</strong>
            <small class="${equipmentStatusClass(item.status)}">
              ${item.status} · SL: ${item.quantity}
            </small>
          </span>
        </label>
      `;
    }).join("");
  }

  function getSelectedMeetingEquipment() {
    return $$('#create-equipment-list input[name="meetingEquipment"]:checked')
      .map(input => input.value);
  }

  function resetCreateForm() {
    const form = $("#create-form");
    if (!form) return;

    form.reset();

    if (form.date) form.date.value = iso(TODAY);
    if (form.start) form.start.value = "09:00";
    if (form.end) form.end.value = "10:00";
    if (form.room) form.room.value = "P.101";

    if ($("#create-participants-multi")) $("#create-participants-multi")._setValues([]);
    if ($("#create-docs-multi")) $("#create-docs-multi")._setValues([]);
    $$('#create-equipment-list input[name="meetingEquipment"]').forEach(input => {
      input.checked = false;
    });
  }

  if ($("#create-form")) {
    $("#create-form").addEventListener("submit", e => {
      e.preventDefault();

      const form = $("#create-form");
      const fd = new FormData(form);

      const meetingTitle = (fd.get("title") || "Cuộc họp mới").trim();
      const startTime = fd.get("start");
      const endTime = fd.get("end");

      if (startTime >= endTime) {
        toast("Giờ kết thúc phải sau giờ bắt đầu!", "danger");
        return;
      }

      const newMeeting = {
        id: uid,
        title: meetingTitle,
        description: fd.get("description") || "",
        room: fd.get("room"),
        date: fd.get("date"),
        start: fd.get("start"),
        end: fd.get("end"),
        participants: $("#create-participants-multi")?._getValues() || [],
        docs: $("#create-docs-multi")?._getValues() || [],
        equipment: getSelectedMeetingEquipment(),
        status: "upcoming"
      };

      const conflict = findMeetingConflict(newMeeting);
      if (conflict) {
        showMeetingConflict(conflict);
        return;
      }

      uid++;
      meetings.unshift(newMeeting);

      storage.set("meetings", meetings);
      storage.set("uid", uid);

      addNotification(`${currentUser.name} đã tạo lịch họp “${meetingTitle}”`, "purple");
      refreshAllLists();
      toast("Đã tạo lịch họp mới!", "success");
      showView("meeting-list");
    });
  }

  let meetingSearchText = "";
  let meetingSortOrder = "newest";

  function meetingTimestamp(meeting) {
    return new Date(`${meeting.date}T${meeting.start || "00:00"}:00`).getTime();
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getVisibleMeetings() {
    const keyword = normalizeSearchText(meetingSearchText);

    return meetings
      .filter(meeting => {
        if (!keyword) return true;

        const searchable = normalizeSearchText([
          meeting.title,
          meeting.description,
          meeting.room,
          ...(meeting.participants || []),
          ...(meeting.equipment || [])
        ].join(" "));

        return searchable.includes(keyword);
      })
      .sort((a, b) => {
        const difference = meetingTimestamp(a) - meetingTimestamp(b);
        return meetingSortOrder === "oldest" ? difference : -difference;
      });
  }

  function findMeetingConflict(candidate, ignoredId = null) {
    const candidateParticipants = candidate.participants || [];

    for (const existing of meetings) {
      if (existing.id === ignoredId || existing.status === "cancelled") continue;
      if (existing.date !== candidate.date) continue;

      const overlaps = candidate.start < existing.end && candidate.end > existing.start;
      if (!overlaps) continue;

      const sameRoom = Boolean(candidate.room && existing.room === candidate.room);
      const sharedParticipants = candidateParticipants.filter(name =>
        (existing.participants || []).includes(name)
      );

      if (sameRoom || sharedParticipants.length > 0) {
        return { meeting: existing, sameRoom, sharedParticipants };
      }
    }

    return null;
  }

  function showMeetingConflict(conflict) {
    const existing = conflict.meeting;
    const reasons = [];

    if (conflict.sameRoom) reasons.push(`phòng ${existing.room}`);
    if (conflict.sharedParticipants.length) {
      reasons.push(`người tham gia: ${conflict.sharedParticipants.join(", ")}`);
    }

    toast(
      `Lịch bị trùng với “${existing.title}” (${existing.start} - ${existing.end})${reasons.length ? ` — ${reasons.join("; ")}` : ""}.`,
      "danger"
    );
  }

  function renderFullList() {
    const el = $("#full-list");
    if (!el) return;

    const visibleMeetings = getVisibleMeetings();
    const count = $("#meeting-result-count");
    if (count) count.textContent = `${visibleMeetings.length} cuộc họp`;

    el.innerHTML = visibleMeetings.map(m => `
      <div class="lrow st-${m.status}" data-row="${m.id}">
        <div class="lrow-body">
          <p class="lrow-title">${m.title}</p>
          <p class="lrow-desc">${m.description || ""}</p>

          <div class="lrow-meta">
            <span>${svgIcon("clock")}${vnDate(m.date)} · ${m.start} - ${m.end}</span>
            <span>${svgIcon("pin")}${m.room}</span>
            <span>${svgIcon("users")}${m.participants.length} người</span>
            ${(m.equipment || []).length ? `<span>${svgIcon("equipment")}${m.equipment.join(", ")}</span>` : ""}
          </div>
        </div>

        <div class="lrow-side">
          ${badgeHTML(m.status)}

          <div class="lrow-actions">
            <button class="act-btn join" data-join="${m.id}">Tham gia</button>
            <button class="act-btn edit" data-edit="${m.id}">Sửa</button>
            <button class="act-btn cancel" data-cancel="${m.id}">Hủy</button>
          </div>
        </div>
      </div>
    `).join("") || `
      <div class="meeting-empty-result">
        <span class="meeting-empty-icon">⌕</span>
        <h3>Không tìm thấy cuộc họp phù hợp</h3>
        <p>Thử nhập từ khóa khác hoặc xóa nội dung tìm kiếm.</p>
      </div>
    `;

    $$('[data-join]', el).forEach(btn => {
      btn.addEventListener('click', () => openJoinMeeting(Number(btn.dataset.join)));
    });

    $$('[data-edit]', el).forEach(btn => {
      btn.addEventListener('click', () => openEditMeeting(Number(btn.dataset.edit)));
    });

    $$('[data-cancel]', el).forEach(btn => {
      btn.addEventListener('click', () => openCancelMeeting(Number(btn.dataset.cancel)));
    });
  }

  const meetingSearchInput = $("#meeting-search");
  const meetingSearchClear = $("#meeting-search-clear");
  const meetingSortSelect = $("#meeting-sort");

  meetingSearchInput?.addEventListener("input", event => {
    meetingSearchText = event.target.value;
    if (meetingSearchClear) meetingSearchClear.hidden = !meetingSearchText;
    renderFullList();
  });

  meetingSearchClear?.addEventListener("click", () => {
    meetingSearchText = "";
    if (meetingSearchInput) {
      meetingSearchInput.value = "";
      meetingSearchInput.focus();
    }
    meetingSearchClear.hidden = true;
    renderFullList();
  });

  meetingSortSelect?.addEventListener("change", event => {
    meetingSortOrder = event.target.value;
    renderFullList();
  });

  // ===================== PHÒNG HỌP =====================
  $$('[data-room-slider]').forEach(slider => {
    const track = $('.room-track', slider);
    const hiddenInput = slider.closest('.field')?.querySelector('input[type="hidden"]');

    $$('.room-pill', slider).forEach(pill => {
      pill.addEventListener('click', () => {
        $$('.room-pill', slider).forEach(item => item.classList.remove('active'));
        pill.classList.add('active');
        if (hiddenInput) hiddenInput.value = pill.dataset.room || '';
      });
    });

    $$('[data-room-scroll]', slider).forEach(btn => {
      btn.addEventListener('click', () => {
        if (!track) return;
        track.scrollBy({ left: (Number(btn.dataset.roomScroll) || 1) * 220, behavior: 'smooth' });
      });
    });
  });

  function setRoomSliderValue(slider, room) {
    if (!slider) return;
    const hiddenInput = slider.closest('.field')?.querySelector('input[type="hidden"]');
    $$('.room-pill', slider).forEach(pill => {
      pill.classList.toggle('active', pill.dataset.room === room);
    });
    if (hiddenInput) hiddenInput.value = room;
  }

  let selectedMeetingId = null;

  function openJoinMeeting(id) {
    const meeting = meetings.find(item => item.id === id);
    if (!meeting) return;
    selectedMeetingId = id;
    $('#join-title').textContent = meeting.title;
    $('#join-date').textContent = vnDate(meeting.date);
    $('#join-time').textContent = `${meeting.start} - ${meeting.end}`;
    $('#join-room').textContent = meeting.room;
    openModal('#modal-join');
  }

  function openEditMeeting(id) {
    const meeting = meetings.find(item => item.id === id);
    if (!meeting) return;
    selectedMeetingId = id;
    $('#edit-title').value = meeting.title || '';
    $('#edit-description').value = meeting.description || '';
    $('#edit-date').value = meeting.date || '';
    $('#edit-start').value = meeting.start || '09:00';
    $('#edit-end').value = meeting.end || '10:00';
    setRoomSliderValue($('#modal-edit [data-room-slider]'), meeting.room || 'P.101');
    $('#edit-participants-multi')?._setValues(meeting.participants || []);
    $('#edit-docs-multi')?._setValues(meeting.docs || []);
    openModal('#modal-edit');
  }

  function openCancelMeeting(id) {
    const meeting = meetings.find(item => item.id === id);
    if (!meeting) return;
    selectedMeetingId = id;
    $('#cancel-text').textContent = `Bạn có chắc muốn hủy cuộc họp “${meeting.title}”?`;
    openModal('#modal-cancel');
  }

  $('#decline-join-btn')?.addEventListener('click', () => {
    const meeting = meetings.find(item => item.id === selectedMeetingId);
    if (!meeting) return;

    // Nếu người dùng từng tham gia trước đó thì xóa khỏi danh sách người tham gia.
    meeting.participants = (meeting.participants || []).filter(
      participant => participant !== currentUser.name
    );

    storage.set('meetings', meetings);
    addNotification(
      `${currentUser.name} đã từ chối tham gia cuộc họp “${meeting.title}”`,
      'danger'
    );

    closeModal();
    refreshAllLists();
    toast(`Đã từ chối tham gia cuộc họp “${meeting.title}”!`, 'danger');
  });

  $('#confirm-join-btn')?.addEventListener('click', () => {
    const meeting = meetings.find(item => item.id === selectedMeetingId);
    if (!meeting) return;
    if (!meeting.participants.includes(currentUser.name)) meeting.participants.push(currentUser.name);
    storage.set('meetings', meetings);
    addNotification(`${currentUser.name} đã tham gia cuộc họp “${meeting.title}”`, 'success');
    closeModal();
    refreshAllLists();
    toast('Đã tham gia cuộc họp!', 'success');
  });

  $('#form-edit')?.addEventListener('submit', event => {
    event.preventDefault();
    const meeting = meetings.find(item => item.id === selectedMeetingId);
    if (!meeting) return;
    const start = $('#edit-start').value;
    const end = $('#edit-end').value;
    if (start >= end) {
      toast('Giờ kết thúc phải sau giờ bắt đầu!', 'danger');
      return;
    }
    const updatedMeeting = {
      ...meeting,
      title: $('#edit-title').value.trim() || 'Cuộc họp',
      description: $('#edit-description').value.trim(),
      room: $('#edit-room').value,
      date: $('#edit-date').value,
      start,
      end,
      participants: $('#edit-participants-multi')?._getValues() || [],
      docs: $('#edit-docs-multi')?._getValues() || []
    };

    const conflict = findMeetingConflict(updatedMeeting, meeting.id);
    if (conflict) {
      showMeetingConflict(conflict);
      return;
    }

    meeting.title = updatedMeeting.title;
    meeting.description = updatedMeeting.description;
    meeting.room = updatedMeeting.room;
    meeting.date = updatedMeeting.date;
    meeting.start = updatedMeeting.start;
    meeting.end = updatedMeeting.end;
    meeting.participants = updatedMeeting.participants;
    meeting.docs = updatedMeeting.docs;
    storage.set('meetings', meetings);
    addNotification(`${currentUser.name} đã cập nhật cuộc họp “${meeting.title}”`, 'purple');
    closeModal();
    refreshAllLists();
    toast('Đã lưu thay đổi cuộc họp!', 'success');
  });

  $('#confirm-cancel-btn')?.addEventListener('click', () => {
    const meeting = meetings.find(item => item.id === selectedMeetingId);
    if (!meeting) return;
    meeting.status = 'cancelled';
    storage.set('meetings', meetings);
    addNotification(`${currentUser.name} đã hủy cuộc họp “${meeting.title}”`, 'warning');
    closeModal();
    refreshAllLists();
    toast('Đã hủy cuộc họp!', 'danger');
  });

  const backdrop = $("#modal-backdrop");

  function openModal(id) {
    const modal = $(id);

    if (!backdrop || !modal) {
      console.error("Không tìm thấy modal:", id);
      return;
    }

    $$(".modal", backdrop).forEach(m => m.classList.remove("show"));

    modal.classList.add("show");
    backdrop.classList.add("open");
  }

  function closeModal() {
    if (!backdrop) return;

    backdrop.classList.remove("open");

    setTimeout(() => {
      $$(".modal", backdrop).forEach(m => m.classList.remove("show"));
    }, 200);
  }

  $$("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  if (backdrop) {
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) closeModal();
    });
  }

  function refreshAllLists() {
    renderTodayList();
      renderNotifications();

    if ($('.view[data-view="meeting-list"]')?.classList.contains("active")) renderFullList();
    if ($('.view[data-view="schedule-view"]')?.classList.contains("active")) renderCalendar();
    if ($('.view[data-view="schedule-filter"]')?.classList.contains("active")) applyFilter();
    if ($('.view[data-view="members-view"]')?.classList.contains("active")) renderMembers();
    if ($('.view[data-view="documents-view"]')?.classList.contains("active")) renderDocuments();
    if ($('.view[data-view="equipment-view"]')?.classList.contains("active")) renderEquipment();
  }

  updateMultiselectPanels();
  renderTodayList();
  renderNotifications();
  renderMembers();
  renderDocuments();
  renderEquipment();
  renderCreateEquipmentOptions();
  syncUserUI();
  animateStats();
  

})();
