// Jahr im Footer
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll-Reveal: Elemente sanft einblenden, sobald sie sichtbar werden
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealEls = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
}

// Mobile-Navigation
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Wunschtermin: frühestens morgen vorbelegen
const dateInput = document.getElementById("date");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = tomorrow.toISOString().split("T")[0];

const form = document.getElementById("bookingForm");
const success = document.getElementById("bookingSuccess");

function setError(name, msg) {
  const el = form.querySelector(`.error[data-for="${name}"]`);
  const input = form.querySelector(`[name="${name}"]`);
  if (el) el.textContent = msg || "";
  if (input) input.classList.toggle("invalid", Boolean(msg));
}

function validate() {
  let ok = true;
  const get = (n) => form.querySelector(`[name="${n}"]`).value.trim();

  if (!get("name")) { setError("name", "Bitte gib deinen Namen an."); ok = false; }
  else setError("name", "");

  const email = get("email");
  if (!email) { setError("email", "Bitte gib deine E-Mail an."); ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("email", "Bitte gib eine gültige E-Mail an."); ok = false; }
  else setError("email", "");

  if (!get("date")) { setError("date", "Bitte wähle ein Datum."); ok = false; }
  else setError("date", "");

  if (!get("time")) { setError("time", "Bitte wähle eine Uhrzeit."); ok = false; }
  else setError("time", "");

  if (!form.querySelector('[name="consent"]').checked) { setError("consent", "Bitte stimme der Speicherung zu."); ok = false; }
  else setError("consent", "");

  return ok;
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function buildIcs(data) {
  const start = new Date(`${data.date}T${data.time}:00`);
  const end = new Date(start.getTime() + 30 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LuxVision Digital//Erstberatung//DE",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@luxvision.digital`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Erstberatung – LuxVision Digital",
    `DESCRIPTION:Unverbindliche Erstberatung (${data.channel}).`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form).entries());

  // Hinweis: Ohne Backend wird die Anfrage nur lokal bestätigt.
  // Für den Live-Betrieb hier z. B. einen Fetch-Aufruf an ein Buchungs-/E-Mail-Backend ergänzen.
  console.log("Terminanfrage:", data);

  document.getElementById("successName").textContent = data.name + "!";
  document.getElementById("successSummary").innerHTML = `
    <div><span>Termin</span><span>${formatDate(data.date)}, ${data.time} Uhr</span></div>
    <div><span>Kanal</span><span>${data.channel}</span></div>
    <div><span>E-Mail</span><span>${data.email}</span></div>`;
  document.getElementById("calendarLink").href = buildIcs(data);
  document.getElementById("calendarLink").setAttribute("download", "erstberatung.ics");

  form.hidden = true;
  success.hidden = false;
  success.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.getElementById("resetBooking").addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  success.hidden = true;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ===================================================================
   Cinematic scroll narrative: pinned [data-story] sections.
   Computes section progress p (0..1) and animates child layers
   (Vision-Reel scenes, Process journey numbers/steps).
   =================================================================== */
(function () {
  if (reduceMotion) return; // respektiert Nutzer-Einstellung

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // Glockenkurve: voll sichtbar in der Mitte einer Stage, weich an den Rändern
  const bell = (p, center, half) => {
    const d = Math.abs(p - center) / half;
    return Math.max(0, 1 - d * d);
  };

  const stories = Array.from(document.querySelectorAll("[data-story]"));
  if (!stories.length) return;

  function updateVisionReel(frame, p) {
    const scenes = frame.querySelectorAll(".scene");
    const centers = [1 / 6, 3 / 6, 5 / 6]; // Mitte jeder von 3 Stages
    scenes.forEach((scene, i) => {
      const v = bell(p, centers[i], 0.28);
      const scale = 0.92 + v * 0.12; // zoom in beim Eintreten, zoom out beim Verlassen
      scene.style.opacity = v.toFixed(3);
      scene.style.transform = `scale(${scale.toFixed(3)})`;
    });
  }

  function updateProcess(frame, p) {
    const nums = frame.querySelectorAll(".big-num span");
    const steps = frame.querySelectorAll(".step");
    const count = nums.length;
    const centers = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
    for (let i = 0; i < count; i++) {
      const v = bell(p, centers[i], 0.18);
      const scale = 0.7 + v * 0.5; // 0.7 → 1.2 → 0.7
      nums[i].style.opacity = v.toFixed(3);
      nums[i].style.transform = `scale(${scale.toFixed(3)})`;
      if (steps[i]) {
        steps[i].style.opacity = v.toFixed(3);
        steps[i].style.transform = `translateY(${((1 - v) * 24).toFixed(1)}px)`;
      }
    }
  }

  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;
    for (const section of stories) {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - vh;
      if (total <= 0) continue;
      const p = clamp(-rect.top / total, 0, 1);
      const frame = section.querySelector(".story-frame");
      if (!frame) continue;
      frame.style.setProperty("--p", p.toFixed(4));
      if (section.classList.contains("story-vision")) updateVisionReel(frame, p);
      else if (section.classList.contains("story-process")) updateProcess(frame, p);
    }
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
