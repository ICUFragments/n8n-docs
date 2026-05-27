// Jahr im Footer
document.getElementById("year").textContent = new Date().getFullYear();

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
