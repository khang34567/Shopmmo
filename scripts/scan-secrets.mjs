import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "coverage"]);
const PATTERNS = [
  { name: "Telegram Buyer API Key", regex: /tgb_[a-f0-9]{24,}/gi },
  { name: "Private Key Block", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "NEXT_PUBLIC Secret", regex: /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD)/g },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g }
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      const content = fs.readFileSync(full, "utf8");
      for (const p of PATTERNS) {
        if (p.regex.test(content)) {
          findings.push({ file: full, rule: p.name });
        }
        p.regex.lastIndex = 0;
      }
    }
  }
}

walk(process.cwd());

if (findings.length > 0) {
  console.error("PHÁT HIỆN RÒ RỈ SECRET TIỀM ẨN:");
  for (const f of findings) {
    console.error(` - [${f.rule}] ${f.file}`);
  }
  process.exit(1);
}
console.log("Secret scan passed: 0 findings.");
