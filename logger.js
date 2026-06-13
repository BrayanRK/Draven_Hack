// ╔══════════════════════════════════════════════════════╗
// ║             DRAVEN_HACK — Logger v2.0               ║
// ║                  by Brayan / bytebot                ║
// ╚══════════════════════════════════════════════════════╝

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

// Colores de texto
const WHITE  = "\x1b[97m";
const CYAN   = "\x1b[96m";
const GREEN  = "\x1b[92m";
const YELLOW = "\x1b[93m";
const RED    = "\x1b[91m";
const MAGENTA= "\x1b[95m";
const BLUE   = "\x1b[94m";
const GRAY   = "\x1b[90m";

// Colores de fondo
const BG_GREEN   = "\x1b[42m";
const BG_RED     = "\x1b[41m";
const BG_YELLOW  = "\x1b[43m";
const BG_CYAN    = "\x1b[46m";
const BG_MAGENTA = "\x1b[45m";
const BG_BLUE    = "\x1b[44m";

function timestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${GRAY}${DIM}${h}:${m}:${s}${RESET}`;
}

function tag(bg, fg, label) {
  return `${BOLD}${bg}${fg} ${label} ${RESET}`;
}

const log = {
  ok:   (...args) => console.log(`${timestamp()} ${tag(BG_GREEN,   "\x1b[30m", " ✔ OK  ")} ${GREEN}${args.join(" ")}${RESET}`),
  info: (...args) => console.log(`${timestamp()} ${tag(BG_CYAN,    "\x1b[30m", " ℹ INFO")} ${CYAN}${args.join(" ")}${RESET}`),
  warn: (...args) => console.log(`${timestamp()} ${tag(BG_YELLOW,  "\x1b[30m", " ⚠ WARN")} ${YELLOW}${args.join(" ")}${RESET}`),
  error:(...args) => console.log(`${timestamp()} ${tag(BG_RED,     WHITE,      " ✖ ERR ")} ${RED}${args.join(" ")}${RESET}`),
  cmd:  (...args) => console.log(`${timestamp()} ${tag(BG_MAGENTA, WHITE,      " ⚡ CMD ")} ${MAGENTA}${args.join(" ")}${RESET}`),
  ban:  (...args) => console.log(`${timestamp()} ${tag(BG_RED,     WHITE,      " ⛔ BAN ")} ${RED}${DIM}${args.join(" ")}${RESET}`),
  auto: (...args) => console.log(`${timestamp()} ${tag(BG_BLUE,    WHITE,      " 🔄 AUTO")} ${BLUE}${args.join(" ")}${RESET}`),
  div:  ()        => console.log(`${GRAY}${DIM}  ${"─".repeat(52)}${RESET}`),
};

export default log;