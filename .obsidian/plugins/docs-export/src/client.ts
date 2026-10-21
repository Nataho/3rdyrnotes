/* Docs Site Export — page runtime (bundled to assets/site.js) */

(() => {
	const body = document.body;
	const root = body.dataset.root || '';
	const page = body.dataset.page || '';

	/* ---------- file tree ---------- */
	const tree = document.querySelector('.tree');
	if (tree) {
		tree.querySelectorAll('.tree-folder > .tree-link').forEach((btn) => {
			btn.addEventListener('click', () => {
				const list = btn.nextElementSibling;
				if (!list) return;
				btn.classList.toggle('open', list.classList.toggle('is-open'));
			});
		});
	}

	/* ---------- mobile nav ---------- */
	const hamburger = document.querySelector('.hamburger');
	if (hamburger) {
		const overlay = document.createElement('div');
		overlay.className = 'sidebar-overlay';
		document.querySelector('.layout')?.prepend(overlay);
		const closeNav = () => body.classList.remove('nav-open');
		hamburger.addEventListener('click', () => body.classList.toggle('nav-open'));
		overlay.addEventListener('click', closeNav);
	}

	/* ---------- code copy buttons ---------- */
	document.querySelectorAll('.code-copy').forEach((btn) => {
		btn.addEventListener('click', () => {
			const block = btn.closest('.code-block');
			const code = block?.querySelector('pre code');
			if (!code) return;
			const text = code.textContent || '';
			const done = () => {
				const label = btn.querySelector('span:last-child');
				btn.classList.add('copied');
				if (label) label.textContent = 'Copied!';
				setTimeout(() => {
					btn.classList.remove('copied');
					if (label) label.textContent = 'Copy';
				}, 1600);
			};
			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
			} else fallbackCopy(text, done);
		});
	});

	function fallbackCopy(text: string, done: () => void) {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		try { document.execCommand('copy'); } catch { /* noop */ }
		ta.remove();
		done();
	}

	/* ---------- scrollspy (right toc) ---------- */
	const tocLinks = Array.from(document.querySelectorAll('.toc a')) as HTMLAnchorElement[];
	if (tocLinks.length) {
		const headings = tocLinks
			.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
			.filter((el): el is HTMLElement => !!el);
		let ticking = false;
		const update = () => {
			ticking = false;
			const top = 56 + 48; // navbar + breathing room
			let active: HTMLElement | null = null;
			for (const h of headings) {
				if (h.getBoundingClientRect().top <= top) active = h;
				else break;
			}
			tocLinks.forEach((a) => a.classList.toggle('active', !!active && a.hash === '#' + active!.id));
		};
		const onScroll = () => {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(update);
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('hashchange', onScroll);
		update();
	}

	/* ---------- mermaid ---------- */
	const anyMermaid = document.querySelector('.mermaid');
	if (anyMermaid) {
		if ((window as any).mermaid) {
			(window as any).mermaid.initialize({
				startOnLoad: true,
				theme: 'dark',
				securityLevel: 'loose',
			});
		}
	}

	/* ---------- search ---------- */
	const searchBox = document.querySelector('.navbar-search input') as HTMLInputElement | null;
	const searchWrap = document.querySelector('.navbar-search') as HTMLElement | null;
	const resultsEl = document.querySelector('.search-results') as HTMLElement | null;

	interface IndexPage { u: string; t: string; c: string; h: string[]; b: string }

	const searchReady = searchBox && searchWrap && resultsEl && page !== 'graph.html';
	if (searchReady) setupSearch();

	function setupSearch() {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const box = searchBox!;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const wrap = searchWrap!;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const results = resultsEl!;
		type Entry = IndexPage & { index: number };
		let pages: Entry[] = [];
		let loaded = false;
		let loadErr = false;
		let activeIdx = -1;
		let currentResults: Entry[] = [];

		const loadIndex = async () => {
			if (loaded || loadErr) return;
			try {
				const res = await fetch(root + 'assets/search.json');
				if (!res.ok) throw new Error('search index failed');
				const data = JSON.parse(await res.text());
				pages = (data.pages || []).map((p: IndexPage, i: number) => ({ ...p, index: i }));
				loaded = true;
			} catch (e) {
				console.error('Docs export: could not load search index', e);
				loadErr = true;
			}
		};

		box.addEventListener('focus', loadIndex);
		box.addEventListener('input', async () => {
			await loadIndex();
			runSearch(box.value);
		});
		box.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				if (!currentResults.length) return;
				e.preventDefault();
				activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : currentResults.length)) % (currentResults.length + 1);
				if (activeIdx >= currentResults.length) activeIdx = -1; // back to input
				paintActive();
			} else if (e.key === 'Enter') {
				const pick = activeIdx >= 0 ? currentResults[activeIdx] : currentResults[0];
				if (pick) go(pick);
			} else if (e.key === 'Escape') {
				close();
				box.blur();
			}
		});

		function paintActive() {
			results.querySelectorAll('.search-result').forEach((el, i) =>
				el.classList.toggle('active', i === activeIdx));
		}

		function go(entry: Entry) {
			location.href = root + entry.u;
			close();
		}

		function close() {
			results.classList.remove('is-open');
			activeIdx = -1;
			currentResults = [];
		}

		function runSearch(query: string) {
			const q = query.trim().toLowerCase();
			if (q.length < 2) { close(); return; }
			const tokens = q.split(/\s+/);
			const scored: { entry: Entry; score: number }[] = [];
			for (const p of pages) {
				let score = 0;
				let firstBodyHit = -1;
				for (const tok of tokens) {
					let s = 0;
					const t = p.t.toLowerCase();
					if (t.includes(tok)) s += 12 + (t.startsWith(tok) ? 8 : 0);
					if (p.h.some((h) => h.toLowerCase().includes(tok))) s += 5;
					const body = p.b.toLowerCase();
					const at = body.indexOf(tok);
					if (at >= 0) {
						s += 3;
						if (firstBodyHit < 0) firstBodyHit = at;
					}
					if (!s) { score = 0; break; } // every token must match somewhere
					score += s;
				}
				if (score > 0) scored.push({ entry: p, score });
			}
			scored.sort((a, b) => b.score - a.score || a.entry.index - b.entry.index);
			currentResults = scored.slice(0, 8).map((x) => x.entry);

			// paint
			results.innerHTML = '';
			if (loadErr) {
				const err = document.createElement('div');
				err.className = 'search-empty';
				err.textContent = 'Search index could not be loaded';
				results.appendChild(err);
			} else if (!currentResults.length) {
				const empty = document.createElement('div');
				empty.className = 'search-empty';
				empty.textContent = 'No results found';
				results.appendChild(empty);
			}
			for (const p of currentResults) {
				const a = document.createElement('a');
				a.className = 'search-result';
				a.href = root + p.u;
				a.innerHTML = `<span class="sr-title">${esc(p.t)}<span class="sr-sub">${esc(p.c)}</span></span>` +
					`<span class="sr-snippet">${snippetHtml(p, q)}</span>`;
				a.addEventListener('click', () => close());
				results.appendChild(a);
			}
			if (results.childNodes.length) {
				results.classList.add('is-open');
				activeIdx = -1;
			} else results.classList.remove('is-open');
		}

		function esc(s: string): string {
			return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		function snippetHtml(p: Entry, q: string): string {
			const tokens = q.split(/\s+/).filter(Boolean);
			const body = p.b;
			let at = -1;
			for (const tok of tokens) {
				const i = body.toLowerCase().indexOf(tok);
				if (i >= 0 && (at < 0 || i < at)) at = i;
			}
			let text: string;
			if (at >= 0) {
				const start = Math.max(0, at - 40);
				text = (start > 0 ? '…' : '') + body.slice(start, start + 200);
				if (start + 200 < body.length) text += '…';
			} else {
				text = body.slice(0, 180) + (body.length > 180 ? '…' : '');
			}
			let out = esc(text);
			for (const tok of tokens) {
				out = out.replace(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`);
			}
			return out;
		}

		document.addEventListener('click', (e) => {
			if (!wrap.contains(e.target as Node)) close();
		});
	}

	/* ---------- '/' focuses search ---------- */
	document.addEventListener('keydown', (e) => {
		if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
			const target = e.target as HTMLElement;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
			const box = document.querySelector('.navbar-search input') as HTMLInputElement | null;
			if (box) {
				e.preventDefault();
				box.focus();
				box.select();
			}
		}
	});

	/* ---------- graph ---------- */
	if (document.getElementById('graph-container')) initGraph();

	function initGraph() {
		const container = document.getElementById('graph-container')!;
		fetch(root + 'assets/graph.json')
			.then((r) => r.json())
			.then((data) => drawGraph(container, data))
			.catch((e) => console.error('graph data failed', e));
	}

	type GNode = { id: string; label: string; x: number; y: number; vx: number; vy: number; fx: number | null; fy: number | null; el: SVGGElement; circleEl: SVGCircleElement; textEl: SVGTextElement };
	type GLink = { s: number; t: number };

	function drawGraph(container: HTMLElement, data: { nodes: { id: string; label: string }[]; links: { s: string; t: string }[] }) {
		const NS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(NS, 'svg');
		container.prepend(svg);

		const edgeGroup = document.createElementNS(NS, 'g');
		edgeGroup.setAttribute('class', 'graph-edges');
		const nodeGroup = document.createElementNS(NS, 'g');
		nodeGroup.setAttribute('class', 'graph-nodes');
		svg.appendChild(edgeGroup);
		svg.appendChild(nodeGroup);

		const nodes: GNode[] = [];
		const idToIdx = new Map<string, number>();
		const radius = 5;
		const W = () => container.clientWidth || 1200;
		const H = () => container.clientHeight || 800;
		const n = data.nodes.length || 1;
		data.nodes.forEach((nd, i) => {
			idToIdx.set(nd.id, i);
			const angle = (i / n) * Math.PI * 2;
			nodes.push({
				id: nd.id,
				label: nd.label,
				x: W() / 2 + Math.cos(angle) * Math.min(W(), H()) * 0.35,
				y: H() / 2 + Math.sin(angle) * Math.min(W(), H()) * 0.35,
				vx: 0, vy: 0, fx: null, fy: null,
				el: null as unknown as SVGGElement,
				circleEl: null as unknown as SVGCircleElement,
				textEl: null as unknown as SVGTextElement,
			});
		});
		const links: GLink[] = [];
		const lineEls: SVGLineElement[] = [];
		for (const l of data.links || []) {
			const si = idToIdx.get(l.s);
			const ti = idToIdx.get(l.t);
			if (si === undefined || ti === undefined || si === ti) continue;
			links.push({ s: si, t: ti });
			const line = document.createElementNS(NS, 'line');
			edgeGroup.appendChild(line);
			lineEls.push(line);
		}

		const paramP = new URLSearchParams(location.search).get('p');
		let currentIdx = paramP ? idToIdx.get(paramP) ?? null : null;

		nodes.forEach((nd, i) => {
			const g = document.createElementNS(NS, 'g');
			g.setAttribute('class', 'graph-node' + (i === currentIdx ? ' current' : ''));
			const c = document.createElementNS(NS, 'circle');
			if (i === currentIdx) c.setAttribute('r', String(radius + 2));
			c.setAttribute('r', String(radius));
			const label = document.createElementNS(NS, 'text');
			label.setAttribute('x', '0');
			label.setAttribute('y', String(radius + 14));
			label.textContent = nd.label.length > 28 ? nd.label.slice(0, 27) + '…' : nd.label;
			g.appendChild(c);
			g.appendChild(label);
			nodeGroup.appendChild(g);
			nd.el = g;
			nd.circleEl = c;
			nd.textEl = label;
			g.addEventListener('pointerdown', (e) => startDrag(e, i));
			g.addEventListener('click', () => {
				if (movedFar) { movedFar = false; return; }
				location.href = nd.id;
			});
		});

		// pan/zoom
		let scale = 1;
		let tx = 0;
		let ty = 0;
		const applyView = () => {
			nodeGroup.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
			edgeGroup.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
			nodeGroup.style.setProperty('display', '');
			nodeGroup.classList?.toggle('zoomed-out', scale < 0.5);
		};
		// hide labels when zooming far out
		const style = document.createElement('style');
		style.textContent = '.graph-nodes.zoomed-out text, .graph-edges + .graph-nodes.zoomed-out text { display: none }';
		container.appendChild(style);
		applyView();

		let panning = false;
		let panStart: { x: number; y: number; tx: number; ty: number } | null = null;
		container.addEventListener('pointerdown', (e) => {
			if ((e.target as Element).closest('.graph-node, .graph-toolbar')) return;
			panning = true;
			panStart = { x: e.clientX, y: e.clientY, tx, ty };
		});
		window.addEventListener('pointermove', (e) => {
			if (panning && panStart) {
				tx = panStart.tx + (e.clientX - panStart.x);
				ty = panStart.ty + (e.clientY - panStart.y);
				applyView();
			}
		});
		window.addEventListener('pointerup', () => {
			panning = false;
			panStart = null;
		});
		container.addEventListener('wheel', (e) => {
			e.preventDefault();
			const factor = e.deltaY < 0 ? 1.12 : 0.89;
			const rect = container.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;
			tx = mx - factor * (mx - tx);
			ty = my - factor * (my - ty);
			scale = Math.min(6, Math.max(0.15, scale * factor));
			applyView();
		}, { passive: false });

		// dragging nodes
		let dragIdx = -1;
		let movedFar = false;
		let dragStart: { x: number; y: number } | null = null;
		function startDrag(e: PointerEvent, idx: number) {
			e.preventDefault();
			e.stopPropagation();
			dragIdx = idx;
			movedFar = false;
			dragStart = { x: e.clientX, y: e.clientY };
			(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
			nodes[idx].circleEl.classList.add('dragging');
		}
		window.addEventListener('pointermove', (e) => {
			if (dragIdx < 0) return;
			if (dragStart && Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) > 3) movedFar = true;
			const rect = container.getBoundingClientRect();
			const x = (e.clientX - rect.left - tx) / scale;
			const y = (e.clientY - rect.top - ty) / scale;
			nodes[dragIdx].fx = x;
			nodes[dragIdx].fy = y;
		});
		window.addEventListener('pointerup', () => {
			if (dragIdx >= 0) {
				nodes[dragIdx].circleEl.classList.remove('dragging');
				nodes[dragIdx].fx = null;
				nodes[dragIdx].fy = null;
			}
			dragIdx = -1;
			dragStart = null;
		});

		// simulation
		let alpha = 1;
		let frozen = false;
		let running = true;
		const linkDist = 95;
		const repulseK = 1600;
		const gravity = 0.025;
		const damping = 0.86;

		function tick() {
			if (frozen || alpha <= 0.015) { running = false; return; }
			alpha *= 0.992;
			// repulsion
			for (let i = 0; i < nodes.length; i++) {
				const a = nodes[i];
				for (let j = i + 1; j < nodes.length; j++) {
					const b = nodes[j];
					let dx = b.x - a.x;
					let dy = b.y - a.y;
					let d2 = dx * dx + dy * dy;
					if (d2 < 1) {
						dx = (Math.random() - 0.5);
						dy = (Math.random() - 0.5);
						d2 = dx * dx + dy * dy;
					}
					if (d2 > 80000) continue;
					const d = Math.sqrt(d2);
					const f = Math.min(60, repulseK / d2) / d;
					a.vx -= dx * f * alpha;
					a.vy -= dy * f * alpha;
					b.vx += dx * f * alpha;
					b.vy += dy * f * alpha;
				}
			}
			// springs
			for (const l of links) {
				const a = nodes[l.s];
				const b = nodes[l.t];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d = Math.max(1, Math.hypot(dx, dy));
				const f = ((d - linkDist) / d) * 0.055 * alpha;
				a.vx += dx * f;
				a.vy += dy * f;
				b.vx -= dx * f;
				b.vy -= dy * f;
			}
			// gravity + integrate
			const cx = W() / 2;
			const cy = H() / 2;
			for (const nd of nodes) {
				nd.vx += (cx - nd.x) * gravity * alpha;
				nd.vy += (cy - nd.y) * gravity * alpha;
				if (nd.fx !== null) { nd.x = nd.fx; nd.y = nd.fy!; nd.vx = 0; nd.vy = 0; }
				else {
					nd.vx *= damping;
					nd.vy *= damping;
					nd.x += nd.vx;
					nd.y += nd.vy;
				}
			}
		}

		function paintEdges() {
			links.forEach((l, i) => {
				const a = nodes[l.s];
				const b = nodes[l.t];
				const el = lineEls[i];
				el.setAttribute('x1', String(a.x));
				el.setAttribute('y1', String(a.y));
				el.setAttribute('x2', String(b.x));
				el.setAttribute('y2', String(b.y));
				const hl = (!!currentIdx && (l.s === currentIdx || l.t === currentIdx)) || l.s === dragIdx || l.t === dragIdx;
				el.setAttribute('class', hl ? 'highlight' : '');
			});
		}

		let frame = 0;
		function loop() {
			if (running) {
				tick();
				frame++;
				if (!frozen) paintEdges();
				nodeGroup.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
				edgeGroup.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
				nodes.forEach((nd) => {
					nd.el.setAttribute('transform', `translate(${nd.x},${nd.y})`);
				});
			}
			if (running) requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);

		const freezeBtn = document.getElementById('graph-freeze') as HTMLButtonElement | null;
		freezeBtn?.addEventListener('click', () => {
			frozen = !frozen;
			freezeBtn.textContent = frozen ? 'Resume layout' : 'Freeze layout';
			if (!frozen && !running) {
				running = true;
				alpha = Math.max(alpha, 0.3);
				requestAnimationFrame(loop);
			}
		});

		const openBtn = document.getElementById('graph-open') as HTMLButtonElement | null;
		openBtn?.addEventListener('click', () => {
			if (currentIdx !== null) location.href = nodes[currentIdx].id;
		});
	}
})();
