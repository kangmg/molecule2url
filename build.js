const fs = require('fs');
const path = require('path');

const MOLECULES_DIR = path.join(__dirname, 'molecules');
const OUTPUT_DIR = __dirname;

if (!fs.existsSync(MOLECULES_DIR)) {
    console.error('Molecules directory not found!');
    process.exit(1);
}

function extractComment(filePath) {
    try {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n');
        return lines.length >= 2 ? lines[1].trim() : '';
    } catch (err) {
        return '';
    }
}

function getMoleculesRecursive(dir, basePath = '') {
    const molecules = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            molecules.push(...getMoleculesRecursive(fullPath, relativePath));
        } else if (entry.name.endsWith('.xyz')) {
            const comment = extractComment(fullPath);
            const name = relativePath.replace('.xyz', '');
            molecules.push({ name, comment, path: relativePath });
        }
    }
    return molecules;
}

function buildHierarchy(molecules) {
    const root = {};
    for (const mol of molecules) {
        const parts = mol.name.split('/');
        let current = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const folder = parts[i];
            if (!current[folder]) {
                current[folder] = { _type: 'folder', _name: folder, _children: {} };
            }
            current = current[folder]._children;
        }
        const fileName = parts[parts.length - 1];
        current[fileName] = { _type: 'file', _name: fileName, name: mol.name, comment: mol.comment };
    }
    return root;
}

const molecules = getMoleculesRecursive(MOLECULES_DIR);
const hierarchy = buildHierarchy(molecules);
console.log(`Found ${molecules.length} molecules:`, molecules.map(m => m.name));

function renderTree(node, depth = 0) {
    let html = '';
    const entries = Object.entries(node).sort((a, b) => {
        const aF = a[1]._type === 'folder', bF = b[1]._type === 'folder';
        if (aF && !bF) return -1;
        if (!aF && bF) return 1;
        return a[0].localeCompare(b[0]);
    });
    const indent = `<span class="tree-indent" style="width:${depth * 24}px"></span>`;
    for (const [, value] of entries) {
        if (value._type === 'folder') {
            html += `
            <div class="tree-folder-container">
                <div class="tree-row" onclick="toggleFolder(this)">
                    ${indent}
                    <div class="toggle-arrow"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
                    <div class="row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg></div>
                    <span class="row-name">${value._name}</span>
                </div>
                <div class="folder-content">${renderTree(value._children, depth + 1)}</div>
            </div>`;
        } else if (value._type === 'file') {
            html += `
            <div class="tree-row" onclick="selectMolecule('${value.name}')">
                ${indent}
                <div class="toggle-arrow"></div>
                <div class="row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                <span class="row-name">${value._name}</span>
                ${value.comment ? `<span class="row-comment">${value.comment}</span>` : ''}
            </div>`;
        }
    }
    return html;
}

const treeHtml = renderTree(hierarchy);

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Molecule Viewer</title>
    <script src="https://cdn.jsdelivr.net/gh/kangmg/aseview@main/aseview/static/js/aseview.js"><\/script>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0; padding: 0;
            display: flex; flex-direction: column;
            height: 100vh; overflow: hidden;
            background-color: #f8f9fa;
        }
        .header {
            height: 56px;
            background: white;
            border-bottom: 1px solid #e9ecef;
            display: flex; align-items: center;
            padding: 0 1.25rem;
            gap: 0.75rem;
            z-index: 100;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            flex-shrink: 0;
        }
        .brand {
            font-size: 1.1rem; font-weight: 600; color: #333;
            text-decoration: none; display: flex; align-items: center; gap: 0.4rem;
            flex-shrink: 0;
        }
        .nav-btn {
            display: flex; align-items: center; gap: 0.4rem;
            padding: 0.4rem 0.8rem; border-radius: 6px;
            color: #495057; text-decoration: none;
            font-weight: 500; font-size: 0.9rem;
            transition: background-color 0.15s;
            cursor: pointer; border: none; background: transparent;
            white-space: nowrap; flex-shrink: 0;
        }
        .nav-btn:hover { background-color: #f1f3f5; color: #212529; }
        .separator { width: 1px; height: 22px; background: #dee2e6; flex-shrink: 0; }
        .select-wrapper { position: relative; flex-shrink: 0; }
        .styled-select {
            padding: 0.38rem 2rem 0.38rem 0.75rem;
            font-size: 0.88rem; border: 1px solid #dee2e6;
            border-radius: 6px; background-color: #f8f9fa;
            color: #495057; cursor: pointer; outline: none;
            appearance: none; -webkit-appearance: none;
            font-family: inherit;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .styled-select:focus { border-color: #339af0; box-shadow: 0 0 0 2px rgba(51,154,240,0.2); }
        #moleculeSelect { min-width: 160px; }
        .select-arrow {
            position: absolute; right: 0.6rem; top: 50%;
            transform: translateY(-50%); pointer-events: none; color: #868e96;
        }
        .theme-label { font-size: 0.82rem; color: #868e96; flex-shrink: 0; }
        .spacer { flex: 1; }
        .share-btn {
            display: flex; align-items: center; gap: 0.4rem;
            padding: 0.38rem 0.9rem; border-radius: 6px;
            color: white; background: #339af0;
            border: none; cursor: pointer;
            font-size: 0.88rem; font-weight: 500;
            transition: background 0.15s;
            white-space: nowrap; flex-shrink: 0;
        }
        .share-btn:hover { background: #228be6; }
        .share-btn.copied { background: #40c057; }

        .main-content { flex: 1; position: relative; overflow: hidden; }

        .view-list {
            position: absolute; inset: 0;
            overflow-y: auto; padding: 2rem;
            display: flex; flex-direction: column; align-items: center;
        }
        .tree-view {
            width: 100%; background: white; border-radius: 12px;
            padding: 1rem 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e9ecef;
        }
        .tree-row {
            display: flex; align-items: center; padding: 0.7rem 1rem;
            cursor: pointer; border-bottom: 1px solid #e7f5ff;
            transition: background 0.1s; color: #495057;
        }
        .tree-row:last-child { border-bottom: none; }
        .tree-row:hover { background: #f8f9fa; }
        .tree-indent { display: inline-block; flex-shrink: 0; }
        .toggle-arrow {
            width: 20px; height: 20px; display: flex; align-items: center;
            justify-content: center; color: #adb5bd;
            transition: transform 0.2s; margin-right: 4px; flex-shrink: 0;
        }
        .toggle-arrow svg { width: 12px; height: 12px; }
        .tree-row.open .toggle-arrow { transform: rotate(90deg); }
        .row-icon { margin-right: 8px; display: flex; align-items: center; color: #339af0; flex-shrink: 0; }
        .row-name { font-weight: 500; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row-comment { font-size: 0.82rem; color: #868e96; margin-left: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
        .folder-content { display: none; }
        .folder-content.show { display: block; }

        .view-viewer {
            position: absolute; inset: 0;
            display: none;
        }
        #aseViewContainer { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <header class="header">
        <a href="?" onclick="showList(); return false;" class="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="color:#339af0">
                <path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 6.12549 15.0077 6.24919 15.0227 6.37063L8.08261 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.08261 14.1593L15.0227 17.6294C15.0077 17.7508 15 17.8745 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C17.1911 15 16.457 15.3202 15.9174 15.8407L8.97733 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97733 11.6294L15.9174 8.15934C16.457 8.67985 17.1911 9 18 9Z" fill="currentColor"/>
            </svg>
            molecule2url
        </a>

        <button class="nav-btn" onclick="showList()">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            List
        </button>

        <div class="select-wrapper">
            <select id="moleculeSelect" class="styled-select" onchange="if(this.value) selectMolecule(this.value)">
                <option value="" disabled selected>Select Molecule</option>
                ${molecules.map(mol => `<option value="${mol.name}">${mol.name}</option>`).join('\n                ')}
            </select>
            <div class="select-arrow">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>

        <div class="separator"></div>

        <span class="theme-label">Theme</span>
        <div class="select-wrapper">
            <select id="themeSelect" class="styled-select" onchange="onThemeChange()">
                <option value="simple">simple</option>
                <option value="dark">dark</option>
                <option value="darkgreen">darkgreen</option>
                <option value="spring">spring</option>
                <option value="glass">glass</option>
            </select>
            <div class="select-arrow">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>

        <div class="spacer"></div>

        <button id="shareBtn" class="share-btn" onclick="copyShareUrl()">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
                <path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 6.12549 15.0077 6.24919 15.0227 6.37063L8.08261 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.08261 14.1593L15.0227 17.6294C15.0077 17.7508 15 17.8745 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C17.1911 15 16.457 15.3202 15.9174 15.8407L8.97733 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97733 11.6294L15.9174 8.15934C16.457 8.67985 17.1911 9 18 9Z"/>
            </svg>
            Share
        </button>

        <div class="separator"></div>

        <a href="https://github.com/kangmg/molecule2url" target="_blank" class="nav-btn">
            <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
        </a>
    </header>

    <div class="main-content">
        <div id="viewList" class="view-list">
            <div class="tree-view">
                ${treeHtml}
            </div>
        </div>
        <div id="viewViewer" class="view-viewer">
            <div id="aseViewContainer"></div>
        </div>
    </div>

    <script>
        // ── Param definitions (mirrors viewer.html) ────────────────────────
        const FLOAT_PARAMS = ['atomSize','bondThreshold','bondThickness','radiusContrast','animationSpeed','forceScale','hBondThreshold','polyhedronOpacity','ringOpacity'];
        const BOOL_PARAMS  = ['showCell','showBond','showHBond','showAxis','showShading','showConstraint','showEnergyPlot','showForceMaxPlot','showForces','showPolyhedron','showRings'];
        const STR_PARAMS   = ['style','backgroundColor','cellColor','colorBy','viewMode','rotationMode','radiusContrastMode','colorScheme'];
        const ALL_PARAMS   = [...FLOAT_PARAMS, ...BOOL_PARAMS, ...STR_PARAMS];

        // ── State ──────────────────────────────────────────────────────────
        let viewer        = null;
        let currentMol    = null;
        let urlSettings   = {}; // settings from URL (passed to aseview on load)

        // ── DOM ────────────────────────────────────────────────────────────
        const viewList         = document.getElementById('viewList');
        const viewViewer       = document.getElementById('viewViewer');
        const molSelect        = document.getElementById('moleculeSelect');
        const themeSelect      = document.getElementById('themeSelect');

        // ── XYZ parser ─────────────────────────────────────────────────────
        function parseXYZ(text) {
            const frames = [], lines = text.split('\\n');
            let i = 0;
            while (i < lines.length) {
                while (i < lines.length && !lines[i].trim()) i++;
                if (i >= lines.length) break;
                const n = parseInt(lines[i].trim(), 10);
                if (isNaN(n) || n <= 0 || i + 1 + n >= lines.length) break;
                const symbols = [], positions = [];
                for (let j = 0; j < n; j++) {
                    const parts = lines[i + 2 + j].trim().split(/\\s+/);
                    if (parts.length < 4) continue;
                    symbols.push(parts[0]);
                    positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                }
                frames.push({ symbols, positions });
                i += 2 + n;
            }
            return frames;
        }

        // ── Viewer lifecycle ───────────────────────────────────────────────
        function initViewer(theme) {
            if (viewer) { try { viewer.dispose(); } catch(e) {} viewer = null; }
            document.getElementById('aseViewContainer').innerHTML = '';
            viewer = new ASEView.MolecularViewer('#aseViewContainer', { theme });
        }

        function loadMolecule(molName) {
            fetch('molecules/' + molName + '.xyz')
                .then(r => { if (!r.ok) throw new Error('Not found: ' + molName); return r.text(); })
                .then(text => {
                    const frames = parseXYZ(text);
                    if (!frames.length) throw new Error('Parse failed: ' + molName);
                    viewer.setData(frames);
                    if (Object.keys(urlSettings).length) viewer.setSettings(urlSettings);
                })
                .catch(err => console.error(err));
        }

        // ── Navigation ─────────────────────────────────────────────────────
        function showList() {
            currentMol = null;
            viewList.style.display  = 'flex';
            viewViewer.style.display = 'none';
            molSelect.value = '';
            history.pushState(null, '', location.pathname);
        }

        function selectMolecule(molName) {
            currentMol = molName;
            viewList.style.display   = 'none';
            viewViewer.style.display = 'block';
            molSelect.value = molName;

            const theme = themeSelect.value;
            if (!viewer) initViewer(theme);
            loadMolecule(molName);
            updateUrl();
        }

        function onThemeChange() {
            initViewer(themeSelect.value);
            if (currentMol) {
                loadMolecule(currentMol);
                updateUrl();
            }
        }

        function toggleFolder(row) {
            row.nextElementSibling.classList.toggle('show');
            row.classList.toggle('open');
        }

        // ── URL management ─────────────────────────────────────────────────
        function buildShareUrl() {
            const p = new URLSearchParams();
            p.set('molecule', currentMol);
            p.set('theme', themeSelect.value);
            // Include all settings that were originally in the URL (or set programmatically)
            Object.entries(urlSettings).forEach(([k, v]) => p.set(k, v));
            return location.origin + location.pathname + '?' + p.toString();
        }

        function updateUrl() {
            if (!currentMol) return;
            history.replaceState(null, '', buildShareUrl());
        }

        function copyShareUrl() {
            const url = currentMol ? buildShareUrl() : location.origin + location.pathname;
            navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById('shareBtn');
                const orig = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = \`<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!\`;
                setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
            });
        }

        // ── Route on load ──────────────────────────────────────────────────
        function handleRoute() {
            const params = new URLSearchParams(location.search);
            const mol   = params.get('molecule');
            const theme = params.get('theme') || 'simple';

            themeSelect.value = theme;

            // Collect non-navigation settings from URL
            urlSettings = {};
            FLOAT_PARAMS.forEach(k => { if (params.has(k)) urlSettings[k] = parseFloat(params.get(k)); });
            BOOL_PARAMS.forEach(k  => { if (params.has(k)) urlSettings[k] = params.get(k) === 'true'; });
            STR_PARAMS.forEach(k   => { if (params.has(k)) urlSettings[k] = params.get(k); });

            if (mol) {
                initViewer(theme);
                selectMolecule(mol);
            } else {
                showList();
            }
        }

        window.addEventListener('load', handleRoute);
        window.addEventListener('popstate', handleRoute);
    <\/script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
console.log('Generated index.html');
