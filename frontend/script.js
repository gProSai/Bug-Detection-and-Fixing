document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    const codeEditor = CodeMirror(document.querySelector('.editor-container'), {
        mode: 'python',
        lineNumbers: true,
        theme: 'dracula',
        value: "print('Hello, World!')"
    });

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

    // Run Button Click Event
    document.getElementById('run').addEventListener('click', async () => {
        const code = codeEditor.getValue();
        const outputElement = document.getElementById('output-content');
        const suggestionsElement = document.getElementById('suggestions-content');

        // Display Running Message
        outputElement.innerHTML = '<strong style="color: yellow;">Running...</strong>';

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
                throw new Error(`Server Error: ${response.status} - ${await response.text()}`);
            }

            const result = await response.json();

            outputElement.innerHTML = result.output ? `<pre>${marked.parse(result.output)}</pre>` : "<pre>No output</pre>";
            suggestionsElement.innerHTML = result.suggestions ? marked.parse(result.suggestions) : "No issues detected.";
        } catch (error) {
            outputElement.innerHTML = `<h3 style="color: red;">Error:</h3> <p>${error.message}</p>`;
        }
    });

    // Clear Button Click Event
    document.getElementById('clear').addEventListener('click', () => {
        codeEditor.setValue('');
        document.getElementById('output-content').innerHTML = 'Waiting for execution...';
        document.getElementById('suggestions-content').innerHTML = 'No issues detected.';
    });
});
