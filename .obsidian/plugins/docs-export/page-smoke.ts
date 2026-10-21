import { pageHtml, renderToc, graphHtml, landingHtml, type TreeFolder } from './src/site';
import { relRoot, rewriteAssetUrls } from './src/exporter';

const tree: TreeFolder = {
	type: 'folder', name: '', children: [
		{
			type: 'folder',
			name: 'ITS 300',
			open: true,
			children: [
				{ type: 'file', name: 'Lesson 1.md', title: 'Lesson 1', url: 'its-300/lesson-1.html' },
				{ type: 'file', name: 'index.md', title: 'ITS 300 Home', url: 'its-300/index.html' },
			],
		},
		{ type: 'folder', name: 'GE 11', children: [{ type: 'file', name: 'Notes.md', title: 'Notes', url: 'ge-11/notes.html' }] },
		{ type: 'file', name: 'Welcome.md', title: 'Welcome', url: 'welcome.html' },
	],
};

const html = pageHtml({
	siteName: 'School',
	title: 'Lesson 1',
	url: 'its-300/lesson-1.html',
	root: '../',
	content: '<p>Content with <img src="oasset://' + encodeURIComponent('attachments/pic 1.png') + '"> and <a href="oasset://' + encodeURIComponent('attachments/doc.pdf') + '">doc</a></p>',
	tree,
	headings: [
		{ level: 2, text: 'Part A', slug: 'part-a' },
		{ level: 3, text: 'Part A.1 — deep', slug: 'part-a1-deep' },
		{ level: 2, text: 'Part B', slug: 'part-b' },
		{ level: 2, text: 'Part B again', slug: 'part-b-1' },
	],
	tags: ['its-300'],
	crumbs: [{ name: 'ITS 300' }, { name: 'Lesson 1' }],
	lastUpdated: 'Oct 21, 2026',
	showBreadcrumbs: true,
	showLastUpdated: true,
	showPagination: true,
	prev: { title: 'ITS 300 Home', url: 'its-300/index.html' },
	next: { title: 'Welcome', url: 'welcome.html' },
	showToc: true,
	usesMermaid: false,
	mermaidCdn: false,
});

console.log(html);
console.log('===ASSET-REWRITE===');
const rewritten = html.match(/(src|href)="[^"]*assets\/[^"]*"/g);
console.log([...new Set(rewritten)].sort().join('\n'));
console.log('===RELROOT===');
console.log(relRoot('index.html'), '|', relRoot('a/b/c.html'), '|', relRoot('a/index.html'));
console.log('===TOC===');
console.log(renderToc([
	{ level: 2, text: 'Part A', slug: 'part-a' },
	{ level: 3, text: 'Part A.1 — deep', slug: 'part-a1-deep' },
	{ level: 2, text: 'Part B', slug: 'part-b' },
	{ level: 2, text: 'Part B again', slug: 'part-b-1' },
	{ level: 5, text: 'Deep 5', slug: 'deep-5' },
	{ level: 2, text: 'Part C', slug: 'part-c' },
]));

console.log('===REWRITE===');
console.log(rewriteAssetUrls(
	`<img src="oasset://${encodeURIComponent('attachments/pic 1.png')}"><a href="oasset://${encodeURIComponent('nested/dir/file.pdf')}">f</a>`,
	'../',
));
console.log('===REWRITE-ROOT===');
console.log(rewriteAssetUrls(
	`<img src="oasset://${encodeURIComponent('attachments/pic 1.png')}">`,
	'',
));
console.log('===LANDING===');
console.log(landingHtml({
	siteName: 'School', root: '', tree,
	sections: [{ name: 'ITS 300', url: 'its-300/index.html', count: 2 }, { name: 'GE 11', url: 'ge-11/notes.html', count: 1 }],
}).slice(0, 200));
console.log('===GRAPH-HEAD===');
console.log(graphHtml({ siteName: 'School', root: '', tree }).slice(0, 200));
