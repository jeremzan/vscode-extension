const assert = require('assert');
const vscode = require('vscode');
const myExtension = require('../extension');

suite('Extension Activation Test Suite', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('Best.pomodorotimer'));
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('Best.pomodorotimer');
        await extension.activate();
        assert.ok(extension.isActive);
    });

    // ... test for initialized components
});
