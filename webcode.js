document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const runBtn = document.getElementById('runBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const themeToggle = document.getElementById('themeToggle');
    const newFileBtn = document.getElementById('newFileBtn');
    const editorContainer = document.getElementById('editorContainer');
    const previewContainer = document.getElementById('previewContainer');
    const resizeHandle = document.getElementById('resizeHandle');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const fontSizeInput = document.getElementById('fontSize');
    const tabSizeInput = document.getElementById('tabSize');
    const themeSelect = document.getElementById('theme');
    const keymapSelect = document.getElementById('keymap');
    const layoutSelect = document.getElementById('layout');
    const fileTree = document.getElementById('fileTree');
    const fileTabs = document.getElementById('fileTabs');
    const consoleContainer = document.getElementById('consoleContainer');
    const consoleOutput = document.getElementById('console');
    const toggleConsole = document.getElementById('toggleConsole');
    const clearConsole = document.getElementById('clearConsole');
    const downloadLogs = document.getElementById('downloadLogs');
    const formatBtn = document.getElementById('formatBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const findReplaceBtn = document.getElementById('findReplaceBtn');
    const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
    const snippetList = document.getElementById('snippetList');
    const addSnippetBtn = document.getElementById('addSnippetBtn');
    const snippetModal = document.getElementById('snippetModal');
    const saveSnippet = document.getElementById('saveSnippet');
    const closeSnippetModal = document.getElementById('closeSnippetModal');
    const toggleLineWrapBtn = document.getElementById('toggleLineWrapBtn');
    const toggleMinimap = document.getElementById('toggleMinimap');
    const minimap = document.getElementById('minimap');

    let isResizing = false;
    let lastDownX = 0;
    let currentFile = null;
    let files = {};
    let snippets = {};
    let autoSaveInterval;

    const defaultFiles = {
        'index.html': '<h1>Hello, World!</h1>',
        'styles.css': 'body { font-family: sans-serif; }',
        'script.js': 'console.log("Welcome to the Advanced Code Editor!");'
    };

    const codeMirrorInstances = {};

    function createCodeMirrorInstance(mode) {
        const instance = CodeMirror(editor, {
            mode: mode,
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: false,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Ctrl-/": "toggleComment",
                "Ctrl-F": "findPersistent",
                "Ctrl-H": "replace",
                "Alt-F": "findNext",
                "Shift-Alt-F": "findPrev",
                "Shift-Ctrl-F": "replace",
                "Shift-Ctrl-R": "replaceAll",
                "Ctrl-G": "jumpToLine"
            }
        });

        // Add autosave and autorun functionality
        instance.on('change', () => {
            autoSave();
            updatePreview();
        });

        return instance;
    }

    function autoSave() {
        if (currentFile) {
            files[currentFile] = codeMirrorInstances[currentFile].getValue();
            localStorage.setItem('savedFiles', JSON.stringify(files));
            showToast('Autosaved');
        }
    }

    function updatePreview() {
        const html = files['index.html'] || '';
        const css = files['styles.css'] || '';
        const js = files['script.js'] || '';

        const previewContent = `
            <html>
                <head>
                    <style>${css}</style>
                </head>
                <body>
                    ${html}
                    <script>
                        (function() {
                            var originalConsole = console;
                            console = {
                                log: function() {
                                    originalConsole.log.apply(originalConsole, arguments);
                                    window.parent.postMessage({type: 'console', method: 'log', args: Array.from(arguments)}, '*');
                                },
                                error: function() {
                                    originalConsole.error.apply(originalConsole, arguments);
                                    window.parent.postMessage({type: 'console', method: 'error', args: Array.from(arguments)}, '*');
                                },
                                warn: function() {
                                    originalConsole.warn.apply(originalConsole, arguments);
                                    window.parent.postMessage({type: 'console', method: 'warn', args: Array.from(arguments)}, '*');
                                }
                            };
                        })();
                        ${js}
                    </script>
                </body>
            </html>
        `;

        preview.srcdoc = previewContent;
    }

    function switchFile(filename) {
        if (currentFile) {
            files[currentFile] = codeMirrorInstances[currentFile].getValue();
        }

        currentFile = filename;
        const fileExtension = filename.split('.').pop();
        const mode = fileExtension === 'html' ? 'htmlmixed' : fileExtension;

        if (!codeMirrorInstances[filename]) {
            codeMirrorInstances[filename] = createCodeMirrorInstance(mode);
        }

        editor.innerHTML = '';
        editor.appendChild(codeMirrorInstances[filename].getWrapperElement());
        codeMirrorInstances[filename].setValue(files[filename] || '');
        codeMirrorInstances[filename].refresh();

        updateFileTabs();
        updateMinimap();
    }

    function updateFileTabs() {
        fileTabs.innerHTML = '';
        Object.keys(files).forEach(filename => {
            const tab = document.createElement('div');
            tab.className = `file-tab${filename === currentFile ? ' active' : ''}`;
            tab.textContent = filename;
            tab.addEventListener('click', () => switchFile(filename));
            fileTabs.appendChild(tab);
        });
    }

    function updateFileTree() {
        fileTree.innerHTML = '';
        Object.keys(files).forEach(filename => {
            const fileElement = document.createElement('div');
            fileElement.textContent = filename;
            fileElement.addEventListener('click', () => switchFile(filename));
            fileTree.appendChild(fileElement);
        });
    }

    function createNewFile() {
        const filename = prompt('Enter the filename (e.g., newfile.js):');
        if (filename && !files[filename]) {
            files[filename] = '';
            updateFileTree();
            switchFile(filename);
        } else if (files[filename]) {
            showToast('File already exists!');
        }
    }

    function formatCode() {
        const currentCode = codeMirrorInstances[currentFile].getValue();
        let formattedCode;

        switch (currentFile.split('.').pop()) {
            case 'html':
                formattedCode = html_beautify(currentCode);
                break;
            case 'css':
                formattedCode = css_beautify(currentCode);
                break;
            case 'js':
                formattedCode = js_beautify(currentCode);
                break;
            default:
                formattedCode = currentCode;
        }

        codeMirrorInstances[currentFile].setValue(formattedCode);
    }

    function showSnippetModal() {
        snippetModal.style.display = 'block';
    }

    function hideSnippetModal() {
        snippetModal.style.display = 'none';
    }

    function addSnippet() {
        const name = document.getElementById('snippetName').value;
        const code = document.getElementById('snippetCode').value;

        if (name && code) {
            snippets[name] = code;
            updateSnippetList();
            hideSnippetModal();
            showToast('Snippet added successfully!');
        } else {
            showToast('Please enter both name and code for the snippet.');
        }
    }

    function updateSnippetList() {
        snippetList.innerHTML = '';
        Object.keys(snippets).forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => insertSnippet(name));
            snippetList.appendChild(li);
        });
    }

    function insertSnippet(name) {
        const code = snippets[name];
        codeMirrorInstances[currentFile].replaceSelection(code);
    }

    function toggleLineWrap() {
        const instance = codeMirrorInstances[currentFile];
        instance.setOption('lineWrapping', !instance.getOption('lineWrapping'));
    }

    function updateMinimap() {
        if (minimap.classList.contains('hidden')) return;

        const instance = codeMirrorInstances[currentFile];
        const content = instance.getValue();
        const lines = content.split('\n');

        minimap.innerHTML = '';
        lines.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'minimap-line';
            lineElement.style.height = '2px';
            lineElement.style.marginBottom = '1px';
            lineElement.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            minimap.appendChild(lineElement);
        });
    }

    newFileBtn.addEventListener('click', createNewFile);
    runBtn.addEventListener('click', updatePreview);
    saveBtn.addEventListener('click', () => {
        autoSave();
        showToast('Code saved successfully!');
    });

    loadBtn.addEventListener('click', () => {
        const savedFiles = localStorage.getItem('savedFiles');
        if (savedFiles) {
            files = JSON.parse(savedFiles);
            updateFileTree();
            if (currentFile && files[currentFile]) {
                switchFile(currentFile);
            } else {
                switchFile(Object.keys(files)[0]);
            }
            updatePreview();
            showToast('Code loaded successfully!');
        } else {
            showToast('No saved code found!');
        }
    });

    shareBtn.addEventListener('click', () => {
        if (currentFile) {
            files[currentFile] = codeMirrorInstances[currentFile].getValue();
        }
        const encodedFiles = btoa(JSON.stringify(files));
        const shareUrl = `${window.location.origin}${window.location.pathname}?files=${encodedFiles}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Share URL copied to clipboard!');
        }).catch((error) => {
            console.error('Error copying to clipboard:', error);
            showToast('Error copying share URL');
        });
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    fontSizeInput.addEventListener('input', (e) => {
        const fontSize = e.target.value;
        Object.values(codeMirrorInstances).forEach(instance => {
            instance.getWrapperElement().style.fontSize = `${fontSize}px`;
            instance.refresh();
        });
    });

    tabSizeInput.addEventListener('change', (e) => {
        const tabSize = parseInt(e.target.value);
        Object.values(codeMirrorInstances).forEach(instance => {
            instance.setOption('tabSize', tabSize);
            instance.setOption('indentUnit', tabSize);
        });
    });

    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        Object.values(codeMirrorInstances).forEach(instance => {
            instance.setOption('theme', theme);
        });
    });

    keymapSelect.addEventListener('change', (e) => {
        const keymap = e.target.value;
        Object.values(codeMirrorInstances).forEach(instance => {
            instance.setOption('keyMap', keymap);
        });
    });

    layoutSelect.addEventListener('change', (e) => {
        const layout = e.target.value;
        document.body.classList.toggle('layout-vertical', layout === 'vertical');
        resetLayout();
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        updatePreview();
    });

    formatBtn.addEventListener('click', formatCode);
    undoBtn.addEventListener('click', () => codeMirrorInstances[currentFile].undo());
    redoBtn.addEventListener('click', () => codeMirrorInstances[currentFile].redo());
    findReplaceBtn.addEventListener('click', () => codeMirrorInstances[currentFile].execCommand('findPersistent'));
    refreshPreviewBtn.addEventListener('click', updatePreview);
    toggleLineWrapBtn.addEventListener('click', toggleLineWrap);
    toggleMinimap.addEventListener('click', () => {
        minimap.classList.toggle('hidden');
        updateMinimap();
    });

    function resetLayout() {
        editorContainer.style.width = '';
        editorContainer.style.height = '';
        previewContainer.style.width = '';
        previewContainer.style.height = '';
        resizeHandle.style.display = 'block';
    }

    function handleResize(e) {
        if (!isResizing) return;
        const rect = resizeHandle.getBoundingClientRect();
        const isHorizontal = !document.body.classList.contains('layout-vertical');
        
        if (isHorizontal) {
            const containerWidth = editorContainer.parentElement.clientWidth;
            const percentage = ((e.clientX - rect.left) / containerWidth) * 100;
            editorContainer.style.width = `${percentage}%`;
            previewContainer.style.width = `${100 - percentage}%`;
        } else {
            const containerHeight = editorContainer.parentElement.clientHeight;
            const percentage = ((e.clientY - rect.top) / containerHeight) * 100;
            editorContainer.style.height = `${percentage}%`;
            previewContainer.style.height = `${100 - percentage}%`;
        }
    }

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });

    resizeHandle.addEventListener('touchstart', (e) => {
        isResizing = true;
        document.addEventListener('touchmove', handleResize);
        
        document.addEventListener('touchend', stopResize);
    }, { passive: true });

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('touchmove', handleResize);
    }

    toggleConsole.addEventListener('click', () => {
        consoleContainer.classList.toggle('hidden');
    });

    clearConsole.addEventListener('click', () => {
        consoleOutput.innerHTML = '';
    });

    downloadLogs.addEventListener('click', () => {
        const logs = consoleOutput.innerText;
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'console_logs.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    window.addEventListener('message', (event) => {
        if (event.data.type === 'console') {
            const { method, args } = event.data;
            const logElement = document.createElement('div');
            logElement.className = `console-${method}`;
            logElement.textContent = args.join(' ');
            consoleOutput.appendChild(logElement);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'toast fade-in';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Snippet functionality
    addSnippetBtn.addEventListener('click', showSnippetModal);
    saveSnippet.addEventListener('click', addSnippet);
    closeSnippetModal.addEventListener('click', hideSnippetModal);

    // Load snippets from localStorage
    const savedSnippets = localStorage.getItem('savedSnippets');
    if (savedSnippets) {
        snippets = JSON.parse(savedSnippets);
        updateSnippetList();
    }

    // Save snippets to localStorage when added
    function saveSnippetsToLocalStorage() {
        localStorage.setItem('savedSnippets', JSON.stringify(snippets));
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        } else if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            loadBtn.click();
        } else if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            runBtn.click();
        }
    });

    // Add drag and drop file upload
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const filename = file.name;
                files[filename] = event.target.result;
                updateFileTree();
                switchFile(filename);
                showToast(`File ${filename} uploaded successfully!`);
            };
            reader.readAsText(file);
        }
    });

    // Add file download functionality
    function downloadFile() {
        if (currentFile) {
            const content = codeMirrorInstances[currentFile].getValue();
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn';
    downloadBtn.innerHTML = '<span class="material-icons">file_download</span>';
    downloadBtn.setAttribute('aria-label', 'Download current file');
    downloadBtn.addEventListener('click', downloadFile);
    document.querySelector('.actions').appendChild(downloadBtn);

    // Add word count functionality
    function updateWordCount() {
        const text = codeMirrorInstances[currentFile].getValue();
        const wordCount = text.trim().split(/\s+/).length;
        const charCount = text.length;
        showToast(`Word count: ${wordCount}, Character count: ${charCount}`);
    }

    const wordCountBtn = document.createElement('button');
    wordCountBtn.className = 'btn';
    wordCountBtn.innerHTML = '<span class="material-icons">format_list_numbered</span>';
    wordCountBtn.setAttribute('aria-label', 'Show word count');
    wordCountBtn.addEventListener('click', updateWordCount);
    document.querySelector('.actions').appendChild(wordCountBtn);

    // Initialize with default files
    files = {...defaultFiles};
    updateFileTree();
    switchFile('index.html');

    // Initialize preview
    updatePreview();

    // Handle window resize
    window.addEventListener('resize', resetLayout);
});
