/**
 * ASEView.js - JavaScript API for molecular visualization
 * Local copy with getSettings() added to BaseViewer.
 * Themes are served from ./themes/ (same origin) instead of raw.githack.com.
 */

(function(global) {
    'use strict';

    // Serve themes locally so we control the HTML (needed for getSettings support)
    const THEMES_BASE   = './themes';
    const FALLBACK_BASE = 'https://raw.githack.com/kangmg/aseview/main/aseview/templates';
    const CDN_BASE      = THEMES_BASE;

    const DEFAULT_VIEWER_OPTIONS = { bondThreshold: 1.2 };

    let _defaultTheme = 'dark';
    function setTheme(name) { _defaultTheme = name; }
    function getTheme()     { return _defaultTheme; }

    class BaseViewer {
        constructor(container, templateName, options = {}) {
            if (typeof container === 'string') {
                this.container = document.querySelector(container);
            } else {
                this.container = container;
            }
            if (!this.container) throw new Error('ASEView: Container element not found');

            this.options        = Object.assign({}, DEFAULT_VIEWER_OPTIONS, options);
            this.templateName   = templateName;
            this._theme         = this.options.theme || _defaultTheme;
            this.iframe         = null;
            this.isReady        = false;
            this.pendingMessages = [];

            this._createIframe();
        }

        _createIframe() {
            this.container.innerHTML = '';
            this.iframe = document.createElement('iframe');
            this.iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
            this.iframe.setAttribute('allowfullscreen', 'true');

            const templateUrl = `${THEMES_BASE}/${this._theme}/${this.templateName}`;
            this.iframe.src = templateUrl;
            this.iframe.addEventListener('error', () => {
                this.iframe.src = `${FALLBACK_BASE}/${this.templateName}`;
            }, { once: true });

            this._messageHandler = (event) => this._onMessage(event);
            window.addEventListener('message', this._messageHandler);
            this.container.appendChild(this.iframe);
        }

        _onMessage(event) {
            const msg = event.data;
            if (!msg || !msg.type) return;

            if (msg.type === 'viewerLoaded') {
                this.isReady = true;
                if (Object.keys(this.options).length > 0) {
                    this._postMessage({ type: 'setSettings', settings: this.options });
                }
                this.pendingMessages.forEach(m => this._postMessage(m));
                this.pendingMessages = [];
            }
        }

        _postMessage(message) {
            if (this.isReady && this.iframe && this.iframe.contentWindow) {
                this.iframe.contentWindow.postMessage(message, '*');
            } else {
                this.pendingMessages.push(message);
            }
        }

        setSettings(settings) {
            Object.assign(this.options, settings);
            this._postMessage({ type: 'setSettings', settings });
        }

        /**
         * Get the viewer's current live settings from the iframe.
         * Requires the theme HTML to handle the 'getSettings' message.
         * @returns {Promise<Object>}
         */
        getSettings() {
            return new Promise((resolve) => {
                const handler = (event) => {
                    const msg = event.data;
                    if (msg && msg.type === 'settingsResponse') {
                        window.removeEventListener('message', handler);
                        resolve(msg.settings || {});
                    }
                };
                window.addEventListener('message', handler);
                this._postMessage({ type: 'getSettings' });
            });
        }

        dispose() {
            window.removeEventListener('message', this._messageHandler);
            if (this.iframe) { this.iframe.remove(); this.iframe = null; }
            this.container.innerHTML = '';
        }
    }

    class MolecularViewer extends BaseViewer {
        constructor(container, options = {}) {
            super(container, 'molecular_viewer.html', options);
        }
        setData(data) {
            const dataArray = Array.isArray(data) ? data : [data];
            this._postMessage({ type: 'setData', data: dataArray });
        }
    }

    class NormalModeViewer extends BaseViewer {
        constructor(container, options = {}) {
            super(container, 'normal_viewer.html', options);
        }
        setData(data) {
            const dataArray = Array.isArray(data) ? data : [data];
            this._postMessage({ type: 'setData', data: dataArray });
        }
        setVibrationData(atoms, vibrationData) {
            this._postMessage({ type: 'initNormalMode', atoms, vibrationData });
        }
    }

    class OverlayViewer extends BaseViewer {
        constructor(container, options = {}) {
            super(container, 'overlay_viewer.html', options);
        }
        setStructures(...structures) {
            this._postMessage({ type: 'setData', data: structures });
        }
        setData(data) {
            const dataArray = Array.isArray(data) ? data : [data];
            this._postMessage({ type: 'setData', data: dataArray });
        }
    }

    class FragSelector extends BaseViewer {
        constructor(container, options = {}) {
            super(container, 'frag_selector.html', options);
        }
        setData(data) {
            const dataArray = Array.isArray(data) ? data : [data];
            this._postMessage({ type: 'setData', data: dataArray });
        }
        getSelection() {
            return new Promise((resolve) => {
                const handler = (event) => {
                    const msg = event.data;
                    if (msg && msg.type === 'selectionResponse') {
                        window.removeEventListener('message', handler);
                        resolve(msg.selected || []);
                    }
                };
                window.addEventListener('message', handler);
                this._postMessage({ type: 'getSelection' });
            });
        }
        setSelection(indices) { this._postMessage({ type: 'setSelection', indices }); }
        clearSelection()      { this._postMessage({ type: 'clearSelection' }); }
    }

    global.ASEView = {
        MolecularViewer,
        NormalModeViewer,
        OverlayViewer,
        FragSelector,
        setTheme,
        getTheme,
        DEFAULT_OPTIONS: Object.assign({}, DEFAULT_VIEWER_OPTIONS),
        version: '0.0.5',
        CDN_BASE,
    };

})(typeof window !== 'undefined' ? window : this);
