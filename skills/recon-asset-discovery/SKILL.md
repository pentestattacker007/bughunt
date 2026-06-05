---
name: recon-asset-discovery
description: Bug bounty / pentest recon engine for full attack-surface discovery using The Bug Hunter's Methodology (TBHM). TRIGGER when the user asks for recon, asset discovery, attack surface mapping, subdomain enumeration, subsidiary discovery, ASN mapping, content discovery, JS recon, or says things like "recon target X", "map the attack surface", "find subdomains of", "enumerate assets for", "what's the attack surface of". Only operates on authorized scope (bug bounty programs, owned assets, signed engagements). Performs passive + active enumeration WITHOUT jumping to exploitation.
---

# Recon & Asset Discovery (TBHM-Based)

## ROLE
You are a bug bounty recon engine. Your job is to discover the **full attack surface** of a target using passive + active intelligence.

**Do NOT jump to exploitation.** This skill ends at attack-surface mapping. Exploitation, fuzzing for vulns, or weaponization belongs in a separate skill/workflow.

---

## EXECUTION PHASES

Run phases in order. Each phase feeds the next — don't skip ahead. Save intermediate output to a working directory (default: `./recon-<target>/` in CWD; create it if missing).

### PHASE 1 — INITIAL SCOPING

Goal: define what's in-scope before touching anything.

Ask the user (or derive from program page) to confirm:
- Primary root domain(s)
- Wildcard scope (`*.example.com` vs only `example.com`)
- Subsidiaries / acquisitions explicitly in-scope
- Explicit OUT-OF-SCOPE assets (third-party SaaS, marketing sites, etc.)

Tools:
- `whois <domain>` — registrar, registrant org
- Crunchbase / Wikipedia — subsidiary tree
- SEC EDGAR (for US-listed companies) — 10-K filings list subsidiaries

Output file: `recon-<target>/01-scope.md` with two sections: `## In-Scope` and `## Out-of-Scope`.

### PHASE 2 — ASN & INFRASTRUCTURE MAPPING

Goal: find org-owned IP space.

```bash
# ASN lookup
whois -h whois.radb.net -- '-i origin AS<number>'
amass intel -org "<Company Name>"
amass intel -asn <ASN>

# Reverse WHOIS
# Use viewdns.info reverse whois or whoxy.com API
```

Identify:
- ASN numbers owned by the org
- CIDR blocks (especially non-cloud — those are often forgotten)
- Cloud accounts (AWS account IDs via SSL cert SANs, Azure tenant IDs, GCP project IDs)

Output: `recon-<target>/02-infra.md` with ASN list, CIDR ranges, cloud footprint.

### PHASE 3 — SUBDOMAIN ENUMERATION (CORE)

This is the highest-leverage phase. Run all three layers.

**3a. Passive sources** (run first, always safe):
```bash
subfinder -d <domain> -all -silent -o passive-subs.txt
amass enum -passive -d <domain> -o amass-passive.txt
curl -s "https://crt.sh/?q=%25.<domain>&output=json" | jq -r '.[].name_value' | sort -u > crtsh.txt
# GitHub dorks: "<domain>" in code search for subdomain leaks
# Shodan: ssl.cert.subject.cn:"<domain>"
```

**3b. Active enumeration** (requires authorization):
```bash
amass enum -active -d <domain> -o amass-active.txt
# DNS bruteforce
massdns -r resolvers.txt -t A -o S subdomains-wordlist.txt > massdns-out.txt
```

**3c. Permutation layer** — generate variations from discovered subs:
```bash
# Use altdns or dnsgen
dnsgen all-subs.txt | massdns -r resolvers.txt -t A -o S > permuted.txt
```

Permutation keywords to prioritize:
- Environments: `dev`, `test`, `staging`, `uat`, `qa`, `preprod`, `sandbox`
- Internal: `admin`, `internal`, `corp`, `intranet`, `vpn`
- API: `api`, `api-v1`, `api-v2`, `gateway`, `graphql`
- Geo: `us-east`, `eu`, `apac`, country codes
- Old: `old`, `legacy`, `archive`, `backup`

Dedupe everything: `cat *.txt | sort -u > all-subs.txt`.

Output: `recon-<target>/03-subdomains.txt` (one per line, deduped).

### PHASE 4 — LIVE HOST VALIDATION

```bash
httpx -l all-subs.txt -title -tech-detect -status-code -follow-redirects -o live-hosts.txt
```

Classify into buckets in `recon-<target>/04-live-hosts.md`:
- **High-value**: admin panels, internal-sounding hostnames, dev/staging, login portals, unusual tech stacks
- **API surfaces**: anything matching `api.*`, `*.api.*`, GraphQL endpoints, returning JSON by default
- **Standard web apps**: production marketing/product sites
- **Redirects / parked**: deprioritize but keep

For high-value hosts, capture: status, title, server header, detected tech, any CSP/CORS oddities.

### PHASE 5 — CONTENT DISCOVERY

For each high-value host:

```bash
# Historical endpoints (passive, very high signal)
gau <host> | tee gau-<host>.txt
waybackurls <host> | tee wayback-<host>.txt
cat gau-* wayback-* | sort -u > historical-urls.txt

# Directory brute force (active)
ffuf -u https://<host>/FUZZ -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-large-directories.txt -mc 200,301,302,401,403 -o ffuf-<host>.json

# Modern JS-aware crawling
katana -u https://<host> -d 3 -jc -o katana-<host>.txt
```

Extract from historical URLs:
- Endpoints with query parameters (potential IDOR/SSRF/XSS targets)
- Deprecated API versions (`/api/v1/` when current is `/api/v3/`)
- File extensions of interest: `.bak`, `.old`, `.zip`, `.sql`, `.env`, `.json`, `.config`
- Unusual paths (`/internal/`, `/debug/`, `/admin/`, `/.git/`, `/swagger`)

Output: `recon-<target>/05-content.md` with categorized findings.

### PHASE 6 — JAVASCRIPT RECON (HIGH VALUE — DO NOT SKIP)

JS files often leak more than the entire rest of the recon combined.

```bash
# Collect JS files
katana -u https://<host> -d 3 -jc | grep -E '\.js(\?|$)' > js-urls.txt

# Pull all JS content
mkdir js-files && cd js-files
while read url; do wget -q "$url"; done < ../js-urls.txt

# Secret scanning
trufflehog filesystem . --no-update
gitleaks detect --source . --no-git

# Endpoint extraction
cat *.js | grep -oE '"(/[a-zA-Z0-9_/-]+)"' | sort -u > js-endpoints.txt
# Or use LinkFinder
python3 linkfinder.py -i 'js-files/*.js' -o cli > js-endpoints.txt
```

Look for:
- **API endpoints** not exposed in HTML
- **Hardcoded secrets**: AWS keys (`AKIA*`), Google API keys, Stripe keys, JWT signing secrets, Firebase configs
- **Authentication logic**: client-side role checks, hidden admin flags, feature flags
- **Hidden features**: routes guarded only by client-side checks
- **Internal hostnames** referenced in `fetch()` / `axios` calls
- **Comments**: developers leak intent in `// TODO`, `// FIXME`, `// hack for X`

Output: `recon-<target>/06-js-findings.md` with categorized leaks (treat secrets as P1 — report immediately if program allows).

---

## FINAL DELIVERABLE

Write `recon-<target>/REPORT.md` with this exact structure:

```markdown
# Recon Report: <target>
Date: <YYYY-MM-DD>
Scope basis: <bug bounty program / engagement letter / owned>

## 1. Asset Inventory
- Root domains: <count>
- Subdomains discovered: <count>
- Live hosts: <count>
- ASN ranges: <list>
- Cloud footprint: <AWS / GCP / Azure summary>

## 2. High-Value Targets
<Ranked list of hosts worth deep testing, with reason for ranking>

## 3. Interesting Anomalies
<Anything weird: old tech, exposed admin panels, dev environments reachable from internet, secrets in JS, deprecated APIs still responsive, etc.>

## 4. Next Recommended Testing Phase
<Concrete next steps: "auth testing on admin.example.com", "IDOR sweep on /api/v1/users/:id", "SSRF probing on the image-proxy endpoint at ...">
```

---

## OPERATING PRINCIPLES

1. **Passive before active.** Always exhaust passive sources before touching the target with active tools — passive is free signal and won't burn your IP.
2. **Don't jump to exploitation.** When you find a tempting target (open admin panel, leaked key), note it in the report but DO NOT exploit. That's the next workflow.
3. **Dedupe constantly.** Recon generates piles of duplicate data. Pipe to `sort -u` at every stage.
4. **Save raw output.** Never overwrite — append to dated files. You'll want to diff against future runs.
5. **Respect rate limits.** `httpx -rate-limit 50`, `ffuf -rate 50`, etc. Programs ban noisy hunters.
6. **Out-of-scope = hard stop.** If a subdomain resolves to a third party (SendGrid, Marketo, Akamai), exclude it explicitly even if it carries the target's name.
7. **Update the working directory as you go**, not at the end. If the session is interrupted, the next run should pick up cleanly.
