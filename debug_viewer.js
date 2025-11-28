        (function () {
            function initData() {
                console.log('Initializing molecular data...');

                // Apply settings from Python
                const pythonSettings = { "bondThreshold": 1.1, "bondThickness": 0.1, "atomSize": 0.4, "animationSpeed": 30, "forceScale": 1.0, "backgroundColor": "#1f2937", "style": "Cartoon", "showCell": true, "showBond": true, "showShadow": false, "showEnergyPlot": false, "showForces": false, "viewMode": "Perspective", "rotationMode": "TrackBall", "selectionMode": "Lasso" };
                Object.assign(settings, pythonSettings);
                console.log('Applied settings:', settings);

                // Wait for renderer to be initialized
                function trySetData() {
                    if (typeof renderer !== 'undefined' && renderer !== null) {
                        console.log('Renderer ready, setting data');
                        if (typeof setMolecularData === 'function') {
                            // Override global setter to ignore any embedded hardcoded calls by default.
                            // The original implementation is preserved and will be invoked only when the
                            // user loads a file (or external code sets window.ALLOW_EMBEDDED_MOLECULE = true).
                            (function () {
                                const originalSet = setMolecularData;
                                window.ALLOW_EMBEDDED_MOLECULE = false; // safe default: do not auto-load embedded data
                                window.setMolecularData = function (data) {
                                    if (window.ALLOW_EMBEDDED_MOLECULE) {
                                        return originalSet(data);
                                    }
                                    console.log('Embedded setMolecularData call ignored (ALLOW_EMBEDDED_MOLECULE=false)');
                                };

                                // File loading helpers (accept .xyz and xyz-style .traj files)
                                const fileInput = document.getElementById('file-input');
                                const loadBtn = document.getElementById('load-file-btn');

                                function loadInitialMolecule() {
                                    console.log('loadInitialMolecule called');
                                    // Load initial hardcoded molecule
                                    // Dynamic loading from URL parameter or injected config
                                    const params = new URLSearchParams(window.location.search);
                                    const config = window.MOLECULE_CONFIG || {};
                                    const moleculeName = params.get('molecule') || config.name;
                                    const basePath = config.basePath || '';

                                    console.log('Params:', { moleculeName, basePath, config });

                                    if (moleculeName) {
                                        const xyzUrl = `${basePath}molecules/${moleculeName}.xyz`;
                                        console.log('Fetching molecule from:', xyzUrl);
                                        fetch(xyzUrl)
                                            .then(response => {
                                                console.log('Fetch response status:', response.status);
                                                if (!response.ok) {
                                                    throw new Error(`HTTP error! status: ${response.status}`);
                                                }
                                                return response.text();
                                            })
                                            .then(text => {
                                                console.log('Molecule data fetched, length:', text.length);
                                                handleFileText(moleculeName + '.xyz', text);
                                            })
                                            .catch(e => {
                                                console.error('Error loading molecule:', e);
                                                alert(`Failed to load molecule: ${moleculeName}`);
                                            });
                                    } else {
                                        console.log('No molecule name specified, trying default');
                                        // Let's try to load the sample one if it exists, or just do nothing.
                                        // We will try to load 'first-share' as default if nothing specified, 
                                        // or just wait for user input.
                                        // Let's load 'first-share' as a default demo if available.
                                        fetch('molecules/first-share.xyz')
                                            .then(res => {
                                                if (res.ok) return res.text();
                                                throw new Error('Default molecule not found');
                                            })
                                            .then(text => handleFileText('first-share.xyz', text))
                                            .catch(() => console.log('No default molecule loaded'));
                                    }
                                }

                                function parseXYZFrames(text) {
                                    const lines = text.replace(/\r/g, '').split('\n');
                                    const frames = [];
                                    let i = 0;
                                    while (i < lines.length) {
                                        const line = lines[i].trim();
                                        if (!line) { i++; continue; }
                                        const n = parseInt(line, 10);
                                        if (Number.isFinite(n) && n > 0) {
                                            const atomCount = n;
                                            const comment = lines[i + 1] || '';
                                            const symbols = [];
                                            const positions = [];
                                            for (let j = 0; j < atomCount; j++) {
                                                const parts = (lines[i + 2 + j] || '').trim().split(/\s+/);
                                                if (parts.length >= 4) {
                                                    const sym = parts[0];
                                                    const x = parseFloat(parts[1]);
                                                    const y = parseFloat(parts[2]);
                                                    const z = parseFloat(parts[3]);
                                                    if ([x, y, z].every(v => Number.isFinite(v))) {
                                                        symbols.push(sym);
                                                        positions.push([x, y, z]);
                                                    }
                                                }
                                            }
                                            if (symbols.length === atomCount) {
                                                frames.push({ symbols, positions, comment });
                                            }
                                            i += 2 + atomCount;
                                        } else {
                                            i++;
                                        }
                                    }
                                    return frames;
                                }

                                function handleFileText(name, text) {
                                    console.log('handleFileText called for:', name);
                                    const frames = parseXYZFrames(text);
                                    console.log('Parsed frames:', frames.length);
                                    if (frames.length === 0) {
                                        alert('No frames parsed from file: ' + name);
                                        return;
                                    }
                                    const molFrames = frames.map(f => ({ positions: f.positions, symbols: f.symbols, cell: null }));
                                    // Restore original setter and call it with parsed frames
                                    window.ALLOW_EMBEDDED_MOLECULE = true;
                                    console.log('Calling originalSet with frames');
                                    originalSet(molFrames);
                                    // After loading, set flag true so subsequent external calls behave normally
                                    window.ALLOW_EMBEDDED_MOLECULE = true;
                                }

                                if (fileInput && loadBtn) {
                                    loadBtn.addEventListener('click', () => fileInput.click());
                                    fileInput.addEventListener('change', (ev) => {
                                        const file = ev.target.files && ev.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            handleFileText(file.name, e.target.result);
                                        };
                                        reader.readAsText(file);
                                    });
                                })();
                            }
                    }
                    }
                    trySetData();
                }
                initData();
            })();
    </script>
