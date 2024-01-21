const vscode = require("vscode");

let pomodoroTimer;
let countdownTimer;
let workDuration = 25 * 60; // default 25 minutes
let breakDuration = 5 * 60; // default 5 minutes
let isWorkInterval = true;
let statusBarTimer;

function activate(context) {
    console.log('Congratulations, your extension "pomodorotimer" is now active!');

    statusBarTimer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarTimer);

    let startCommand = vscode.commands.registerCommand('pomodorotimer.start', startPomodoro);
    let stopCommand = vscode.commands.registerCommand('pomodorotimer.stop', stopPomodoro);
    let resetCommand = vscode.commands.registerCommand('pomodorotimer.reset', resetPomodoro);
    let setWorkDurationCommand = vscode.commands.registerCommand('pomodorotimer.setWorkDuration', setWorkDuration);
    let setBreakDurationCommand = vscode.commands.registerCommand('pomodorotimer.setBreakDuration', setBreakDuration);

    context.subscriptions.push(startCommand, stopCommand, resetCommand, setWorkDurationCommand, setBreakDurationCommand);
}

function updateStatusBarTimer(timeLeft) {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    statusBarTimer.text = `Pomodoro: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    statusBarTimer.show();
}

function startPomodoro() {
    stopPomodoro(); // Stop existing timer if any

    let intervalDuration = isWorkInterval ? workDuration : breakDuration;
    let timeLeft = intervalDuration;

    updateStatusBarTimer(timeLeft);
    
    countdownTimer = setInterval(() => {
        timeLeft--;
        updateStatusBarTimer(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            vscode.window.showInformationMessage(isWorkInterval ? 'Time for a break!' : 'Work interval starts now!');
            isWorkInterval = !isWorkInterval;
            startPomodoro();
        }
    }, 1000);

    vscode.window.showInformationMessage(`Pomodoro ${isWorkInterval ? 'Work' : 'Break'} interval started`);
}

function stopPomodoro() {
    if (pomodoroTimer) {
        clearTimeout(pomodoroTimer);
        pomodoroTimer = undefined;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = undefined;
    }
    statusBarTimer.hide();
    vscode.window.showInformationMessage('Pomodoro Timer stopped');
}

function resetPomodoro() {
    stopPomodoro();
    isWorkInterval = true;
    vscode.window.showInformationMessage('Pomodoro Timer reset');
}

function setWorkDuration() {
    vscode.window.showInputBox({ prompt: 'Enter Work Duration in Minutes' })
        .then(value => {
            let num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
                workDuration = num * 60;
                vscode.window.showInformationMessage(`Work Duration set to ${num} minutes`);
            } else {
                vscode.window.showErrorMessage('Invalid input. Please enter a positive number.');
            }
        });
}

function setBreakDuration() {
    vscode.window.showInputBox({ prompt: 'Enter Break Duration in Minutes' })
        .then(value => {
            let num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
                breakDuration = num * 60;
                vscode.window.showInformationMessage(`Break Duration set to ${num} minutes`);
            } else {
                vscode.window.showErrorMessage('Invalid input. Please enter a positive number.');
            }
        });
}

function deactivate() {
    stopPomodoro();
}

module.exports = {
    activate,
    deactivate
};
