const vscode = require("vscode");

let pomodoroTimer;
let countdownTimer;
let workDuration = 45 * 60; // default 45 minutes
let breakDuration = 15 * 60; // default 15 minutes
let isWorkInterval = true;
let statusBarTimer;
let timerWebviewPanel = null; // Added for webview

function activate(context) {
  console.log('Congratulations, your extension "pomodorotimer" is now active!');

  statusBarTimer = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  context.subscriptions.push(statusBarTimer);

  let showTimerUICommand = vscode.commands.registerCommand(
    "pomodorotimer.showTimerUI",
    showTimer
  );

context.subscriptions.push(showTimerUICommand);

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
  let sessionType = isWorkInterval ? 'Work' : 'Break';
  statusBarTimer.text = `${sessionType} Session: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  statusBarTimer.show();

  // Calculate the total time based on the session type
  let totalTime = isWorkInterval ? workDuration : breakDuration;
  updateWebviewTimer(timeLeft, totalTime, sessionType);
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

  updateWebviewTimer(intervalDuration, intervalDuration, isWorkInterval ? 'Work' : 'Break');
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
    workDuration = 45 * 60; // Reset to default 45 minutes
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

function showTimer() {
  if (timerWebviewPanel === null) {
      timerWebviewPanel = vscode.window.createWebviewPanel(
          'timer', 
          'Pomodoro Timer', 
          vscode.ViewColumn.One, 
          { enableScripts: true }
      );
      timerWebviewPanel.webview.html = getWebviewContent();
      timerWebviewPanel.onDidDispose(() => {
          timerWebviewPanel = null;
      });
  }
  updateWebviewTimer(statusBarTimer.text); // Initialize with current timer status
}

function getWebviewContent() {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pomodoro Timer</title>
          <style>
              body {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  background-color: #0e1117;
                  color: #fff;
                  font-family: 'Arial', sans-serif;
                  margin: 0;
                  overflow: hidden;
              }
              .session {
                  font-size: 1.5em;
                  margin-bottom: 20px;
              }
              .clock {
                  position: relative;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 250px;
                  height: 250px;
              }
              .clock svg {
                  transform: rotate(-90deg);
              }
              .clock circle {
                  fill: none;
                  stroke-width: 10;
                  stroke: #0af;
                  transition: stroke-dashoffset 0.5s;
                  stroke-linecap: round;
              }
              .clock circle.bg {
                  stroke: rgba(255, 255, 255, 0.1);
              }
              .time {
                  position: absolute;
                  font-size: 2.5em;
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <div class="session" id="sessionType">Work Session</div>
          <div class="clock">
              <svg width="250" height="250">
                  <circle class="bg" r="110" cx="125" cy="125"></circle>
                  <circle class="progress" r="110" cx="125" cy="125" stroke-dasharray="691" stroke-dashoffset="691"></circle>
              </svg>
              <div id="timer" class="time">00:00</div>
          </div>
          <script>
          const vscode = acquireVsCodeApi();
          const circumference = 691; // This should match the stroke-dasharray of the circle
          let initialized = false;
    
          window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent
            const timerElement = document.getElementById('timer');
            const sessionTypeElement = document.getElementById('sessionType');
            const progressCircle = document.querySelector('.progress');
    
            if (!initialized) {
              // Set the progress circle to full circumference when initializing
              progressCircle.style.strokeDasharray = circumference;
              progressCircle.style.strokeDashoffset = circumference;
              initialized = true;
            }
    
            // Extract the time left and total time from the message
            const totalTime = message.totalTime;
            const timeLeft = message.timeLeft;
    
            // Calculate the strokeDashoffset based on time left
            const progress = (timeLeft / totalTime) * circumference;
            progressCircle.style.strokeDashoffset = progress;
    
            // Convert timeLeft back into minutes and seconds
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
    
            // Update the displayed time and session type
            timerElement.textContent = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
            sessionTypeElement.textContent = (message.sessionType || 'Work') + ' Session';
          });
        </script>
      </body>
      </html>`;
}
// Update the timer in the webview
function updateWebviewTimer(timeLeft, totalTime, sessionType) {
  if (timerWebviewPanel) {
      timerWebviewPanel.webview.postMessage({
          timeLeft: timeLeft,
          totalTime: totalTime,
          sessionType: sessionType // This will be either 'Work' or 'Break'
      });
  }
}

function deactivate() {
  stopPomodoro();
}

module.exports = {
  activate,
  deactivate
};
