/**
 * Generate the crawlable surface of the site from public/kb.json.
 *
 * Devhalla is a WebGL SPA: a crawler that fetches "/" sees a <canvas> and no
 * prose, and answer engines (which mostly do not execute JS at all) see even
 * less. So the same content Recruiter Mode shows in-app is emitted here as
 * static files that need no JavaScript:
 *
 *   resume.html   full semantic resume/portfolio page + Person/FAQ JSON-LD
 *   llms.txt      plain-markdown digest for answer engines (AEO)
 *   sitemap.xml   the three real URLs
 *   robots.txt    open to search *and* AI crawlers, points at the sitemap
 *
 * kb.json stays the single source of truth, so this never drifts from the app.
 * Runs before every build (the `prebuild` script), after build-kb.mjs.
 */
import { writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => resolve(root, "public", f);
const kb = JSON.parse(readFileSync(pub("kb.json"), "utf-8"));

const SITE = kb.owner.site.replace(/\/$/, "");
const { name, role, bio, github, email } = kb.owner;
// The role string is display copy ("Forward Deployed Engineer · AI / full-stack");
// the plain job title is what a search engine and an answer engine both index on.
const TITLE = "Software Engineer";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ------------------------------- resume.html ------------------------------ */

const DESC =
  `${name} is a ${TITLE.toLowerCase()} building autonomous agents, ML pipelines and ` +
  `full-stack products. Full project portfolio, resume, skills and contact — plus ` +
  `Devhalla, the playable 3D RPG world this portfolio is built as.`;

// Question-shaped headings: the format answer engines quote from most readily,
// and the FAQPage graph below mirrors them one-for-one.
const FAQ = [
  [
    `Who is ${name}?`,
    `${name} is a ${TITLE.toLowerCase()} working across AI/ML and full-stack engineering. ` +
      bio.split("This realm")[0].trim(),
  ],
  [
    "What is Devhalla?",
    `Devhalla is the software engineer portfolio of ${name}, built as a playable 3D RPG ` +
      `world. Instead of a scrolling list of projects, every project is a building you can ` +
      `walk into and inspect, and the characters answer questions about the work in ` +
      `character. It runs in the browser on Three.js and React with a FastAPI backend.`,
  ],
  [
    `What is ${name} working on now?`,
    kb.currentWork.map((c) => `${c.name} — ${c.tagline || c.detail}`).join(" "),
  ],
  [`What technologies does ${name} use?`, kb.skills.map((s) => s.label).join(", ") + "."],
  [
    `How do I contact ${name}?`,
    `By email at ${email}, or through GitHub at ${github}. A downloadable resume (PDF) ` +
      `is at ${SITE}/resume.pdf.`,
  ],
];

const projectCard = (p) => `        <article class="card">
          <h3>${esc(p.name)}</h3>
          <p class="tier">${esc(p.tier)}</p>
          <p class="lede">${esc(p.oneLiner)}</p>
          <p>${esc(p.blurb)}</p>
          ${p.stack?.length ? `<ul class="stack">${p.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        </article>`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name,
      jobTitle: TITLE,
      description: bio,
      url: SITE,
      email: `mailto:${email}`,
      sameAs: [github],
      knowsAbout: kb.skills.map((s) => s.label),
      hasOccupation: {
        "@type": "Occupation",
        name: TITLE,
        occupationalCategory: "15-1252.00",
      },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE}/resume.html#page`,
      url: `${SITE}/resume.html`,
      name: `${name} — ${TITLE} Resume and Portfolio`,
      description: DESC,
      about: { "@id": `${SITE}/#person` },
      mainEntity: { "@id": `${SITE}/#person` },
    },
    {
      "@type": "ItemList",
      name: `Software engineering projects by ${name}`,
      numberOfItems: kb.projects.length,
      itemListElement: kb.projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareSourceCode",
          name: p.name,
          description: p.blurb,
          abstract: p.oneLiner,
          programmingLanguage: p.stack,
          author: { "@id": `${SITE}/#person` },
        },
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const resumeHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)} — ${TITLE} Resume &amp; Project Portfolio</title>
<meta name="description" content="${esc(DESC)}" />
<link rel="canonical" href="${SITE}/resume.html" />
<link rel="icon" type="image/svg+xml" href="/relic.svg" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="author" content="${esc(name)}" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${esc(name)} — ${TITLE} Resume &amp; Portfolio" />
<meta property="og:description" content="${esc(DESC)}" />
<meta property="og:url" content="${SITE}/resume.html" />
<meta name="twitter:card" content="summary_large_image" />
<style>
:root{color-scheme:dark;--bg:#0b0e14;--fg:#e6ebf5;--muted:#8b97b0;--gold:#e8c66a;--edge:#1e2534;--card:#111726}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 Inter,system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:60rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
a{color:#6ad0ff}
h1{font-size:clamp(1.9rem,5vw,2.6rem);margin:0 0 .25rem;line-height:1.15}
h2{font-size:1.35rem;margin:2.75rem 0 .25rem;color:var(--gold);border-bottom:1px solid var(--edge);padding-bottom:.4rem}
h3{font-size:1.05rem;margin:0 0 .15rem}
.role{color:var(--gold);margin:0 0 .75rem;font-size:1.05rem}
.bio{color:var(--muted);max-width:46rem}
.links{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.25rem 0 0;padding:0;list-style:none}
.links a{display:inline-block;border:1px solid var(--edge);border-radius:.5rem;padding:.45rem .85rem;text-decoration:none;background:var(--card)}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr));margin-top:1.25rem}
.card{border:1px solid var(--edge);border-radius:.6rem;padding:1rem;background:var(--card)}
.card p{margin:.4rem 0;font-size:.9rem;color:var(--muted)}
.tier{text-transform:uppercase;letter-spacing:.14em;font-size:.68rem!important;color:var(--gold)!important;margin:.1rem 0 .5rem!important}
.lede{color:var(--fg)!important}
.stack{display:flex;flex-wrap:wrap;gap:.35rem;margin:.7rem 0 0;padding:0;list-style:none}
.stack li{font:500 .7rem/1 ui-monospace,monospace;border:1px solid var(--edge);border-radius:.3rem;padding:.3rem .45rem;color:var(--muted)}
.tags{display:flex;flex-wrap:wrap;gap:.4rem;margin:1rem 0 0;padding:0;list-style:none}
.tags li{border:1px solid var(--edge);border-radius:2rem;padding:.3rem .75rem;font-size:.82rem;background:var(--card)}
.rows{margin:1rem 0 0;padding:0;list-style:none}
.rows li{border-left:2px solid var(--edge);padding:.15rem 0 1rem 1rem}
.rows strong{display:block}
.rows span{color:var(--muted);font-size:.9rem}
.faq dt{font-weight:600;margin-top:1.15rem}
.faq dd{margin:.35rem 0 0;color:var(--muted)}
footer{margin-top:3.5rem;border-top:1px solid var(--edge);padding-top:1.25rem;color:var(--muted);font-size:.85rem}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<div class="wrap">
<header>
  <h1>${esc(name)}</h1>
  <p class="role">${TITLE} · ${esc(role)}</p>
  <p class="bio">${esc(bio)}</p>
  <ul class="links">
    <li><a href="/">Enter Devhalla (the 3D portfolio)</a></li>
    <li><a href="/resume.pdf">Download resume (PDF)</a></li>
    <li><a href="${esc(github)}" rel="me noopener">GitHub</a></li>
    <li><a href="mailto:${esc(email)}">${esc(email)}</a></li>
  </ul>
</header>

<main>
<section>
  <h2>Currently building</h2>
${kb.currentWork
  .map(
    (c) => `  <article class="card" style="margin-top:1rem">
    <h3>${esc(c.name)}</h3>
    ${c.tagline ? `<p class="lede">${esc(c.tagline)}</p>` : ""}
    <p>${esc(c.detail)}</p>
  </article>`,
  )
  .join("\n")}
</section>

<section>
  <h2>Projects</h2>
  <p class="bio">${kb.projects.length} shipped and in-flight projects across AI and agents, systems and infrastructure, data products, and full-stack ventures.</p>
  <div class="grid">
${kb.projects.map(projectCard).join("\n")}
  </div>
</section>

<section>
  <h2>Skills &amp; technologies</h2>
  <ul class="tags">${kb.skills.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ul>
</section>

<section>
  <h2>Honours &amp; awards</h2>
  <ul class="rows">
${kb.accomplishments
  .map(
    (a) =>
      `    <li><strong>${esc(a.title)}${a.when ? ` — ${esc(a.when)}` : ""}</strong><span>${esc(a.detail)}</span></li>`,
  )
  .join("\n")}
  </ul>
</section>

<section>
  <h2>The path so far</h2>
  <ul class="rows">
${kb.timeline
  .map(
    (t) =>
      `    <li><strong>${esc(t.title)} — ${esc(t.era)}</strong><span>${esc(t.blurb)}</span></li>`,
  )
  .join("\n")}
  </ul>
</section>

<section>
  <h2>Questions people ask</h2>
  <dl class="faq">
${FAQ.map(([q, a]) => `    <dt>${esc(q)}</dt>\n    <dd>${esc(a)}</dd>`).join("\n")}
  </dl>
</section>

<section>
  <h2>Away from the keyboard</h2>
  <p class="bio">${esc(kb.hobbies.summary)}</p>
</section>
</main>

<footer>
  <p>This is the plain-text index of <a href="/">Devhalla</a> — the same content the
  3D world holds, without the WebGL. ${esc(name)} · ${TITLE} ·
  <a href="mailto:${esc(email)}">${esc(email)}</a></p>
</footer>
</div>
</body>
</html>
`;

/* --------------------------------- llms.txt ------------------------------- */
// https://llmstxt.org — a single markdown digest an answer engine can lift
// facts from without executing the WebGL app.

const llms = `# ${name} — ${TITLE}

> ${bio}

${name} is a ${TITLE.toLowerCase()} specialising in AI agents, machine learning
pipelines, and full-stack product engineering. This file is the machine-readable
digest of ${SITE}; the human site is a playable 3D RPG world called Devhalla,
where every project is a building you can walk into.

- Site: ${SITE}
- Resume (PDF): ${SITE}/resume.pdf
- Plain-HTML resume and project index: ${SITE}/resume.html
- GitHub: ${github}
- Email: ${email}

## Currently building

${kb.currentWork
  .map((c) => `### ${c.name}\n${c.tagline ? c.tagline + "\n\n" : ""}${c.detail}`)
  .join("\n\n")}

## Projects (${kb.projects.length})

${kb.projects
  .map(
    (p) =>
      `### ${p.name} (${p.tier})\n${p.oneLiner}\n\n${p.blurb}\n\nStack: ${(p.stack || []).join(", ")}`,
  )
  .join("\n\n")}

## Skills

${kb.skills.map((s) => s.label).join(", ")}

## Honours

${kb.accomplishments
  .map((a) => `- **${a.title}**${a.when ? ` (${a.when})` : ""} — ${a.detail}`)
  .join("\n")}

## Background

${kb.timeline.map((t) => `- **${t.title}** (${t.era}) — ${t.blurb}`).join("\n")}

## Outside work

${kb.hobbies.summary}

## FAQ

${FAQ.map(([q, a]) => `### ${q}\n${a}`).join("\n\n")}
`;

/* ---------------------------- sitemap + robots ---------------------------- */

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  ["/", "1.0"],
  ["/resume.html", "0.9"],
  ["/resume.pdf", "0.6"],
]
  .map(
    ([loc, pri]) =>
      `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${pri}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

// Answer engines are the point of the AEO half of this: they are allowed in
// explicitly so nobody has to guess whether a missing rule means "no".
const robots = `# ${SITE}
User-agent: *
Allow: /

# Answer engines / AI crawlers — explicitly welcome to read and cite this site.
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Bingbot
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

await writeFile(pub("resume.html"), resumeHtml, "utf-8");
await writeFile(pub("llms.txt"), llms, "utf-8");
await writeFile(pub("sitemap.xml"), sitemap, "utf-8");
await writeFile(pub("robots.txt"), robots, "utf-8");

console.log(
  `seo      ·  resume.html (${kb.projects.length} projects, ${FAQ.length} FAQs), ` +
    `llms.txt, sitemap.xml, robots.txt  ->  public/`,
);
