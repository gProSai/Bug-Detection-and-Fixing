document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    const codeEditor = CodeMirror(document.querySelector('.editor-container'), {
        mode: 'python',
        lineNumbers: true,
        theme: 'dracula',
        value: "print('Hello, World!')\n# Try introducing an error to test auto-correction!",
        indentUnit: 4,
        lineWrapping: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Ctrl-Enter": function(cm) { runCode(); },
            "Ctrl-Shift-F": function(cm) { applyAutoCorrect(); }
        }
    });

    // Global variables
    let currentCorrectedCode = null;
    const statusElement = document.getElementById('status');
    const autoCorrectButton = document.getElementById('auto-correct');

    // Update status
    function updateStatus(message, color = '#50fa7b') {
        statusElement.textContent = message;
        statusElement.style.color = color;
    }

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Reset auto-correct button
    function resetAutoCorrectButton() {
        autoCorrectButton.disabled = true;
        autoCorrectButton.textContent = '🔧 Auto-Correct';
        autoCorrectButton.style.background = 'linear-gradient(135deg, #ff9500, #ff7b00)';
        autoCorrectButton.classList.remove('applied');
        currentCorrectedCode = null;
    }

    // Enable auto-correct button
    function enableAutoCorrectButton() {
        autoCorrectButton.disabled = false;
        autoCorrectButton.textContent = '🔧 Apply Fix';
        autoCorrectButton.style.background = 'linear-gradient(135deg, #50fa7b, #4caf50)';
    }

    // Run code function
    async function runCode() {
        const code = codeEditor.getValue();
        const outputElement = document.getElementById('output-content');
        const suggestionsElement = document.getElementById('suggestions-content');

        if (!code.trim()) {
            outputElement.innerHTML = '<strong style="color: orange;">⚠️ Please enter some code first.</strong>';
            updateStatus('No code to execute', '#ff9500');
            return;
        }

        updateStatus('Executing...', '#8be9fd');
        outputElement.innerHTML = '<div style="color: #f1fa8c; text-align: center; padding: 20px;">⏳ <strong>Running your code...</strong></div>';
        
        // Reset auto-correct button
        resetAutoCorrectButton();

        try {
            const response = await fetch("http://127.0.0.1:8000/get-code", {
                method: 'POST',
                headers: { 
                    "Accept": "application/json", 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ user_code: code })
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const result = await response.json();
            console.log("API Response:", result);

            if (result.success) {
                outputElement.innerHTML = `<pre style="color: #50fa7b;">${result.output}</pre>`;
                suggestionsElement.innerHTML = '<div style="color: #50fa7b; text-align: center; padding: 20px;">✅ <strong>Code executed successfully!</strong><br>No issues detected.</div>';
                updateStatus('Execution successful', '#50fa7b');
            } else {
                outputElement.innerHTML = `<pre style="color: #ff5555;">${escapeHtml(result.output)}</pre>`;
                
                // Display suggestions
                if (result.suggestions) {
                    let suggestionsHtml = marked.parse(result.suggestions);
                    
                    // Add preview of corrected code if available
                    if (result.has_correction && result.corrected_code) {
                        currentCorrectedCode = result.corrected_code;
                        
                        suggestionsHtml += `
                            <hr style="margin: 20px 0; border: none; border-top: 2px solid #44475a;">
                            <h4 style="color: #8be9fd; margin-bottom: 15px;">📋 Corrected Code Preview:</h4>
                            <div class="code-preview"><code>${escapeHtml(result.corrected_code)}</code></div>
                            <div class="apply-fix-notice">
                                👆 <strong>Click "Auto-Correct" to apply this fix to your editor</strong><br>
                                <small>Keyboard shortcut: Ctrl+Shift+F</small>
                            </div>
                        `;
                        
                        // Enable auto-correct button
                        enableAutoCorrectButton();
                        updateStatus('Fix available - ready to auto-correct', '#ff9500');
                    } else {
                        updateStatus('Code analyzed - no auto-correction available', '#6272a4');
                    }
                    
                    suggestionsElement.innerHTML = suggestionsHtml;
                    
                    // Auto-switch to suggestions tab
                    document.querySelector('[data-tab="suggestions"]').click();
                } else {
                    suggestionsElement.innerHTML = '<div style="color: #6272a4; text-align: center; padding: 20px;">No specific suggestions available.</div>';
                    updateStatus('Execution failed', '#ff5555');
                }
            }

        } catch (error) {
            outputElement.innerHTML = `<div style="color: #ff5555; padding: 20px;"><strong>🚫 Connection Error:</strong><br>${error.message}</div>`;
            suggestionsElement.innerHTML = '<div style="color: #ff5555; padding: 20px;">Unable to get AI suggestions due to connection error.</div>';
            updateStatus('Connection error', '#ff5555');
            resetAutoCorrectButton();
        }
    }

    // Apply auto-correction function
    function applyAutoCorrect() {
        if (currentCorrectedCode) {
            // Show confirmation for significant changes
            const currentLength = codeEditor.getValue().length;
            const newLength = currentCorrectedCode.length;
            
            if (Math.abs(newLength - currentLength) > currentLength * 0.3) {
                if (!confirm('The auto-correction contains significant changes to your code. Do you want to apply it?')) {
                    return;
                }
            }
            
            // Apply the corrected code
            codeEditor.setValue(currentCorrectedCode);
            
            // Update button state
            autoCorrectButton.textContent = '✅ Applied!';
            autoCorrectButton.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
            autoCorrectButton.classList.add('applied');
            
            // Update suggestions
            document.getElementById('suggestions-content').innerHTML = 
                '<div style="color: #50fa7b; text-align: center; padding: 40px;">✅ <strong>Auto-correction applied successfully!</strong><br><br>Your code has been updated with the suggested fixes.<br><br>Click "Run Code" to test the corrected version.</div>';
            
            // Focus the editor
            codeEditor.focus();
            
            updateStatus('Auto-correction applied successfully', '#50fa7b');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                resetAutoCorrectButton();
            }, 3000);
        }
    }

    // Event Listeners
    document.getElementById('run').addEventListener('click', runCode);
    document.getElementById('auto-correct').addEventListener('click', applyAutoCorrect);

    // Clear Button
    document.getElementById('clear').addEventListener('click', () => {
        codeEditor.setValue('');
        document.getElementById('output-content').innerHTML = 'Ready to execute your Python code...';
        document.getElementById('suggestions-content').innerHTML = 'Write and run some code to get AI-powered suggestions!';
        resetAutoCorrectButton();
        updateStatus('Ready', '#50fa7b');
        
        // Switch back to output tab
        document.querySelector('[data-tab="output"]').click();
    });

    // Save/Load Code functionality
    document.getElementById('save-code').addEventListener('click', () => {
        const code = codeEditor.getValue();
        if (code.trim()) {
            localStorage.setItem('python-web-compiler-code', code);
            updateStatus('Code saved to browser storage', '#50fa7b');
        } else {
            updateStatus('No code to save', '#ff9500');
        }
    });

    document.getElementById('load-code').addEventListener('click', () => {
        const savedCode = localStorage.getItem('python-web-compiler-code');
        if (savedCode) {
            codeEditor.setValue(savedCode);
            updateStatus('Code loaded from browser storage', '#50fa7b');
        } else {
            updateStatus('No saved code found', '#ff9500');
        }
    });

    // Load saved code on page load
    const savedCode = localStorage.getItem('python-web-compiler-code');
    if (savedCode) {
        codeEditor.setValue(savedCode);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter to run code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        
        // Ctrl+Shift+F for auto-correct
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            if (!autoCorrectButton.disabled) {
                applyAutoCorrect();
            }
        }
    });

    // Initialize status
    updateStatus('Ready');
    console.log('Python Web Compiler v2.0 initialized successfully! 🚀');
});
