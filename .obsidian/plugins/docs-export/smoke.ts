/* eslint-disable */
// Smoke test: renders sample Obsidian markdown with a mocked RenderCtx in Node.
import { renderMarkdown } from './src/render';

const fakeFile = { path: 'notes/Sample.md', basename: 'Sample', name: 'Sample.md', extension: 'md' } as any;

const ctx = {
	app: {} as any,
	resolveDest: (t: string) => {
		if (t === 'Some Note') return { path: 'AAA.md', basename: 'Some Note', name: 'Some Note.md', extension: 'md' } as any;
		return null as any;
	},
	copyAsset: (f: any) => 'oasset://' + encodeURIComponent(f.path),
	isExported: (f: any) => f.path === 'notes/AAA.md',
	urlFor: (f: any) => 'some-note.html',
	child: async (f: any, d: number) => (d <= 3 ? { html: '<p>EMBEDDED CONTENT</p>', title: 'Some Note' } : null),
};

const md = `---
title: My Fancy Title
tags:
  - school
  - its-300
---

# Actual heading

Regular intro paragraph with #inline-tag and **bold** ==highlighted== text and a [[Some Note|custom label]] plus [[Missing]] another [[Some Note#Section Two|section link]].

## Section One

> [!note] Watch out
> Body line one.
> Body line two.

- first
	- second with \`inline code\`
- third

1. ordered one
2. ordered two

- [x] done task
- [ ] open task

\`\`\`ts
const x: number = 42; // comment
function hello() { return "hi"; }
\`\`\`

\`\`\`dataview
TABLE status FROM "ITS 300"
\`\`\`

\`\`\`mermaid
graph LR; A --> B
\`\`\`

| Col A | Col B |
| ----- | ----- |
| 1 | 2 |

![[Some Note]]

![alt text](imgs/pic.png)

### Section Two with #tag
More text.

---

External link: [Google](https://google.com) and auto https://example.com/foo
`;

async function main() {
const res = await renderMarkdown(ctx as any, fakeFile, md, 0);console.log(JSON.stringify({
	title: res.title,
	tags: res.tags,
	headings: res.headings.map((h) => `${h.level}:${h.slug}`),
	outgoing: res.outgoing.map((f) => f.path),
	usesMermaid: res.usesMermaid,
}, null, 2));
console.log('----HTML----');
console.log(res.html);
}

main();

