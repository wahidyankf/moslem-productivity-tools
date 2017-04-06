var stateApp = {
  mode: {
    current: "reset",
    last: "stop"
  },
  productivity: {
    workTotal: moment.duration(0),
    workCurrent: moment.duration(0),
    workLast: moment.duration(0),
    restTotal: moment.duration(0),
    restCurrent: moment.duration(0),
    restLast: moment.duration(0),
    restNeeded: moment.duration(0),
    proportionWork: 52,
    proportionRest: 17,
    restLimit: moment.duration(((90 / 52) * 17), "minutes")
  },
  time: {
    sessionStart: moment(),
    markCurrent: moment(),
    markLast: moment(),
    timeDiff: null
  },
  settings: {
    updateRate: 1000,
    audioRate: 800,
    audioWorkVolume: 0.2
  }
};

var work = function () {
  if (stateApp.mode.last !== stateApp.mode.current) {
    stateApp.productivity.workCurrent = moment.duration(0);
  }
  stateApp.productivity.restNeeded = stateApp.productivity.restNeeded.add(moment.duration(stateApp.time.timeDiff * (stateApp.productivity.proportionRest / stateApp.productivity.proportionWork)));
  stateApp.productivity.workCurrent = stateApp.productivity.workCurrent.add(stateApp.time.timeDiff);
  stateApp.productivity.workTotal = stateApp.productivity.workTotal.add(stateApp.time.timeDiff);
};

var rest = function () {
  if (stateApp.mode.last !== stateApp.mode.current) {
    stateApp.productivity.restCurrent = moment.duration(0);
  }
  stateApp.productivity.restNeeded = stateApp.productivity.restNeeded.subtract(moment.duration(stateApp.time.timeDiff));
  if (stateApp.productivity.restNeeded.asSeconds() < 0) {
    stateApp.productivity.restNeeded = moment.duration(0);
  }
  stateApp.productivity.restCurrent = stateApp.productivity.restCurrent.add(stateApp.time.timeDiff);
  stateApp.productivity.restTotal = stateApp.productivity.restTotal.add(stateApp.time.timeDiff);
};

var reset = function () {
  if (stateApp.mode.last !== stateApp.mode.current) {
    stateApp.productivity.workTotal = moment.duration(0);
    stateApp.productivity.workCurrent = moment.duration(0);
    stateApp.productivity.workLast = moment.duration(0);
    stateApp.productivity.restTotal = moment.duration(0);
    stateApp.productivity.restCurrent = moment.duration(0);
    stateApp.productivity.restNeeded = moment.duration(0);
    stateApp.mode.last = stateApp.mode.current;
    stateApp.mode.current = "stop";
  }
};

var modeTransition = function () {
  if (stateApp.mode.current == "work" && stateApp.mode.last == "rest") {
    stateApp.productivity.restLast = stateApp.productivity.restCurrent;
  } else if (stateApp.mode.current == "rest" && stateApp.mode.last == "work") {
    stateApp.productivity.workLast = stateApp.productivity.workCurrent;
  }
};

var displayDuration = function (timeVar) {
  return `${timeVar.hours()}h ${timeVar.minutes()}m ${timeVar.seconds()}s`;
};

var updateTime = function () {
  stateApp.time.markCurrent = moment();
  stateApp.time.timeDiff = stateApp.time.markCurrent - stateApp.time.markLast;
  modeTransition();
  if (stateApp.mode.current === "work") {
    work();
  } else if (stateApp.mode.current === "rest") {
    rest();
  } else if (stateApp.mode.current === "stop") {
    stop();
  } else if (stateApp.mode.current === "reset") {
    reset();
  }
  stateApp.time.markLast = stateApp.time.markCurrent;
  stateApp.mode.last = stateApp.mode.current;
};

var updateDisplay = function() {
  $('#time-now').html(moment().format('HH:mm:ss'));
  $('#date-now').html(moment().format('dddd, D MMM YYYY'));
  $('#work-total').html(displayDuration(stateApp.productivity.workTotal));
  $('#work-current').html(displayDuration(stateApp.productivity.workCurrent));
  $('#work-last').html(displayDuration(stateApp.productivity.workLast));
  $('#rest-total').html(displayDuration(stateApp.productivity.restTotal));
  $('#rest-current').html(displayDuration(stateApp.productivity.restCurrent));
  $('#rest-last').html(displayDuration(stateApp.productivity.restLast));
  $('#rest-needed').html(displayDuration(stateApp.productivity.restNeeded));
};

var checkLimit = function () {
  var audioLimit = document.getElementById("audio-limit");
  var limitPortion = stateApp.productivity.restNeeded.asSeconds() / stateApp.productivity.restLimit.asSeconds();
  if (limitPortion >= 1) {
    $("#rest-needed").css("background-color", "#cc4b37");
  } else if (limitPortion >= 0.5) {
    $("#rest-needed").css("background-color", "#ffae00");
  } else {
    $("#rest-needed").css("background-color", "#3adb76");
  }
  if (limitPortion >= 1 && stateApp.mode.current == "work") {
    audioLimit.play();
  } else {
    audioLimit.pause();
  }
};

var updateApp = function () {
  window.setInterval(function () {
    updateTime();
    checkLimit();
    updateDisplay();
  }, stateApp.settings.updateRate);
};

var playSound = function () {
  var audioWork = document.getElementById("audio-work");
  audioWork.volume = stateApp.settings.audioWorkVolume;
  if (stateApp.mode.current == "work") {
    audioWork.play();
  } else if (stateApp.mode.current != "work") {
    audioWork.pause();
  }
};

var updateSound = function () {
  window.setInterval(function () {
    playSound();
  }, stateApp.settings.audioRate);
};

updateApp();

updateSound();

$('.btn-work').click(function () {
  stateApp.mode.last = stateApp.mode.current;
  stateApp.mode.current = "work";
});

$('.btn-rest').click(function () {
  stateApp.mode.last = stateApp.mode.current;
  stateApp.mode.current = "rest";
});

$('.btn-stop').click(function () {
  stateApp.mode.last = stateApp.mode.current;
  stateApp.mode.current = "stop";
});

$('.btn-reset').click(function () {
  stateApp.mode.last = stateApp.mode.current;
  stateApp.mode.current = "reset";
});