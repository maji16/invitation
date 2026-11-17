/* =========================================================
   Jemputan Affrina & Arsyad  -  script.js
   Edit the CONFIG block below. Everything else can stay.
   ========================================================= */
(() => {
  "use strict";

  /* ---------------- EDIT THESE ---------------- */
  const CONFIG = {
    // Event start / end (Malaysia time, +08:00). Change the hours when you know the schedule.
    eventStart: "2027-01-12T11:00:00+08:00",
    eventEnd:   "2027-01-12T16:00:00+08:00",
    timeText:   "11.00 pagi - 4.00 petang",

    venueName:    "Pusat Islam UMS",
    venueAddress: "Universiti Malaysia Sabah, Kota Kinabalu, Sabah",

    brideParents: "Puteri kepada Encik [Nama Bapa] & Puan [Nama Ibu]",
    groomParents: "Putera kepada Encik [Nama Bapa] & Puan [Nama Ibu]",

    // WhatsApp number for RSVP: country code + number, no "+" or spaces. Example: 60123456789
    whatsappNumber: "60123456789",

    // Search text for the map buttons
    mapQuery: "Pusat Islam UMS Kota Kinabalu",
  };
  /* -------------------------------------------- */

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* Fill text placeholders: <span data-fill="venueName"> */
  $$("[data-fill]").forEach((el) => {
    const v = CONFIG[el.dataset.fill];
    if (v) el.textContent = v;
  });

  /* Guest name from link:  index.html?to=Ahmad%20Fauzi  (textContent = safe) */
  const guest = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 60);
  if (guest) $("#guestName").textContent = guest;

  /* Map + RSVP links */
  const q = encodeURIComponent(CONFIG.mapQuery);
  $("#btnMaps").href = "https://www.google.com/maps/search/?api=1&query=" + q;
  $("#btnWaze").href = "https://waze.com/ul?q=" + q;

  const who = guest ? "saya " + guest : "saya";
  const wa = (msg) => "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(msg);
  $("#btnHadir").href = wa("Assalamualaikum, " + who + " ingin mengesahkan kehadiran ke majlis perkahwinan Affrina & Arsyad pada 12 Januari 2027. InsyaAllah hadir.");
  $("#btnTidak").href = wa("Assalamualaikum, " + who + " memohon maaf kerana tidak dapat hadir ke majlis perkahwinan Affrina & Arsyad pada 12 Januari 2027. Semoga majlis berjalan lancar.");

  /* ---------------- Music ---------------- */
  const bgm = $("#bgm");
  const musicBtn = $("#musicBtn");
  const setMusicUI = (on) => musicBtn.classList.toggle("playing", on);
  bgm.volume = 0.7;

  musicBtn.addEventListener("click", () => {
    if (bgm.paused) { bgm.play().then(() => setMusicUI(true)).catch(() => {}); }
    else { bgm.pause(); setMusicUI(false); }
  });
  // Pause music when the guest leaves the tab/app, resume when they return.
  let wasPlaying = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { wasPlaying = !bgm.paused; bgm.pause(); }
    else if (wasPlaying) { bgm.play().catch(() => {}); }
  });

  /* ---------------- Scroll reveal ---------------- */
  function startReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------- Open envelope ---------------- */
  const envelope = $("#envelope");
  const cover = $("#cover");
  let opened = false;

  envelope.addEventListener("click", () => {
    if (opened) return;
    opened = true;

    envelope.classList.add("open");

    // play() is called directly inside the tap, so browsers allow the sound.
    bgm.play().then(() => setMusicUI(true)).catch(() => setMusicUI(false));

    setTimeout(() => {
      document.body.classList.remove("locked");
      window.scrollTo(0, 0);
      cover.classList.add("done");
      musicBtn.hidden = false;
      startReveal();
    }, 3000);
  });

  /* ---------------- Countdown ---------------- */
  const target = new Date(CONFIG.eventStart).getTime();
  const ids = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  function tick() {
    let diff = target - Date.now();
    if (diff <= 0) {
      $("#countdown").hidden = true;
      $("#cdDone").hidden = false;
      return;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    ids.d.textContent = d; ids.h.textContent = String(h).padStart(2, "0");
    ids.m.textContent = String(m).padStart(2, "0"); ids.s.textContent = String(s).padStart(2, "0");
    setTimeout(tick, 1000);
  }
  tick();

  /* ---------------- Add to calendar (.ics) ---------------- */
  $("#btnCalendar").addEventListener("click", () => {
    const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (t) => t.replace(/([,;])/g, "\\$1");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jemputan//MS//EN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@jemputan",
      "DTSTAMP:" + fmt(new Date().toISOString()),
      "DTSTART:" + fmt(CONFIG.eventStart),
      "DTEND:" + fmt(CONFIG.eventEnd),
      "SUMMARY:" + esc("Majlis Perkahwinan Affrina & Arsyad"),
      "LOCATION:" + esc(CONFIG.venueName + ", " + CONFIG.venueAddress),
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "majlis-affrina-arsyad.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });

  /* ---------------- Butterflies ---------------- */
  const BF_SVG = '<svg viewBox="0 0 64 48" aria-hidden="true">' +
    '<g class="wing"><path fill="url(#bfGrad)" d="M32 24C20 4 2 4 4 18c1 12 16 14 28 6z"/>' +
    '<path fill="url(#bfGrad)" opacity=".85" d="M32 24c-10 6-20 20-10 20 8 0 10-12 10-20z"/></g>' +
    '<g transform="matrix(-1 0 0 1 64 0)"><g class="wing"><path fill="url(#bfGrad)" d="M32 24C20 4 2 4 4 18c1 12 16 14 28 6z"/>' +
    '<path fill="url(#bfGrad)" opacity=".85" d="M32 24c-10 6-20 20-10 20 8 0 10-12 10-20z"/></g></g>' +
    '<rect x="30.5" y="14" width="3" height="22" rx="1.5" fill="#6b4f1d"/></svg>';

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    const box = $("#butterflies");
    const count = window.innerWidth < 600 ? 5 : 8;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "bf";
      el.style.setProperty("--y", (8 + Math.random() * 78).toFixed(1) + "%");
      el.style.setProperty("--s", (26 + Math.random() * 22).toFixed(0) + "px");
      el.style.setProperty("--dy", (30 + Math.random() * 70).toFixed(0) + "px");
      el.style.setProperty("--t", (20 + Math.random() * 18).toFixed(1) + "s");
      el.style.setProperty("--delay", (-Math.random() * 30).toFixed(1) + "s");
      el.innerHTML = BF_SVG;
      box.appendChild(el);
    }
  }
})();
