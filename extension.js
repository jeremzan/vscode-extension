const vscode = require("vscode");

let pomodoroTimer;
let countdownTimer;
let workDuration = 45 * 60; // default 45 minutes
let breakDuration = 15 * 60; // default 15 minutes
let isWorkInterval = true;
let statusBarTimer;

function activate(context) {
  console.log('Congratulations, your extension "pomodorotimer" is now active!');

  statusBarTimer = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  context.subscriptions.push(statusBarTimer);

  let startCommand = vscode.commands.registerCommand(
    "pomodorotimer.start",
    () => startPomodoro(true)
  );
  let stopCommand = vscode.commands.registerCommand(
    "pomodorotimer.stop",
    stopPomodoro
  );
  let resetCommand = vscode.commands.registerCommand(
    "pomodorotimer.reset",
    resetPomodoro
  );
  let setWorkDurationCommand = vscode.commands.registerCommand(
    "pomodorotimer.setWorkDuration",
    setWorkDuration
  );
  let setBreakDurationCommand = vscode.commands.registerCommand(
    "pomodorotimer.setBreakDuration",
    setBreakDuration
  );

  context.subscriptions.push(
    startCommand,
    stopCommand,
    resetCommand,
    setWorkDurationCommand,
    setBreakDurationCommand
  );
}

function updateStatusBarTimer(timeLeft) {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  let sessionType = isWorkInterval ? 'Work Session' : 'Break Session';
  statusBarTimer.text = `${sessionType}: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  statusBarTimer.show();
}


function startPomodoro(firstStart = false) {
  // Determine if the timer is already running
  let isRestarting = pomodoroTimer || countdownTimer;

  // If a timer is already running, stop it silently
  if (isRestarting) {
    stopPomodoro(false); // Stop existing timer without showing notification
  }

  let intervalDuration = isWorkInterval ? workDuration : breakDuration;
  let timeLeft = intervalDuration;

  updateStatusBarTimer(timeLeft);

  countdownTimer = setInterval(() => {
    timeLeft--;
    updateStatusBarTimer(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = undefined;
      vscode.window.showInformationMessage(
        isWorkInterval ? "Time for a break!" : "Work interval starts now!"
      );
      isWorkInterval = !isWorkInterval;
      startPomodoro(); // Automatically start next interval
    }
  }, 1000);

  // Determine which message to show based on whether the timer is being started or restarted
  if (isRestarting) {
    vscode.window.showInformationMessage("Pomodoro Timer restarted");
  } else if (firstStart) {
    vscode.window.showInformationMessage("Pomodoro Timer started");
  }
}

function stopPomodoro(showNotification = true) {
  if (pomodoroTimer || countdownTimer) {
    if (pomodoroTimer) {
      clearTimeout(pomodoroTimer);
      pomodoroTimer = undefined;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = undefined;
    }
    statusBarTimer.hide();
    if (showNotification) {
      vscode.window.showInformationMessage("Pomodoro Timer stopped");
    }
  }
}

function resetPomodoro() {
  // Stop the current timer if it's running, without showing the "stopped" notification
  if (pomodoroTimer || countdownTimer) {
    stopPomodoro(false); // Stop the timer silently
    statusBarTimer.hide();

    // Reset the state and durations to default
    isWorkInterval = true;
    workDuration = 45 * 60; // Reset to default 25 minutes
    breakDuration = 15 * 60; // Reset to default 5 minutes

    startPomodoro(); // Start a new timer without the message
    vscode.window.showInformationMessage(
      "Pomodoro Timer reset and restarted with default settings"
    );
  }
}

function setWorkDuration() {
  vscode.window
    .showInputBox({ prompt: "Enter Work Duration in Minutes" })
    .then((value) => {
      let num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        workDuration = num * 60;
        vscode.window.showInformationMessage(
          `Work Duration set to ${num} minutes`
        );
      } else {
        vscode.window.showErrorMessage(
          "Invalid input. Please enter a positive number."
        );
      }
    });
}

function setBreakDuration() {
  vscode.window
    .showInputBox({ prompt: "Enter Break Duration in Minutes" })
    .then((value) => {
      let num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        breakDuration = num * 60;
        vscode.window.showInformationMessage(
          `Break Duration set to ${num} minutes`
        );
      } else {
        vscode.window.showErrorMessage(
          "Invalid input. Please enter a positive number."
        );
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
