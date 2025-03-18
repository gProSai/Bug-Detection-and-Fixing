document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = CodeMirror(document.querySelector('.editor-container'), {
        mode: 'python',
        lineNumbers: true,
        theme: 'material-darker',
        value: "print('Hello, World!')"
    });

    document.getElementById('run').addEventListener('click', async () => {
        const code = codeEditor.getValue();
        const outputElement = document.getElementById('output');

        outputElement.textContent = 'Running...';

        try {
            const response = await fetch('/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const result = await response.json();
            outputElement.textContent = result.output || result.error;
        } catch (error) {
            outputElement.textContent = 'Error: Unable to reach server';
        }
    });

    document.getElementById('clear').addEventListener('click', () => {
        codeEditor.setValue('');
        document.getElementById('output').textContent = '';
    });
});
