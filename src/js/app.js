var stateApp = {
  mode: {
    current: "reset",
    last: "stop"
  },
  productivity: {
    workTotal: moment.duration(0),
    workCurrent: moment.dur,
    workLast: moment.duration(0),
    restTotal: moment.duration(0),
    restCurrent: moment.duration(0),
    restLast: moment.duration(0),
    restNeeded: moment.duration(0),
    proportionWork: 52,
    proportionRest: 17,
    restLimit: moment.duration(((90/52)*17), "minutes") 
  },
  time: {
    sessionStart: moment(),
    markCurrent: moment(),
    markLast: moment(),
    timeDiff: null
  },
  settings: {
    updateRate: 400
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

var stop = function () {
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
  if (stateApp.mode.current == "work" && stateApp.mode.last == "rest"){
    stateApp.productivity.restLast = stateApp.productivity.restCurrent;
  } else if (stateApp.mode.current == "rest" && stateApp.mode.last == "work") {
    stateApp.productivity.workLast = stateApp.productivity.workCurrent;
  }
};

var displayDuration = function (timeVar) {
  return `${timeVar.hours()}h ${timeVar.minutes()}m ${timeVar.seconds()}s`;
};

var checkLimit = function () {
  if (stateApp.productivity.restNeeded.asSeconds() > stateApp.productivity.restLimit.asSeconds() && stateApp.mode.current == "work") {
    console.log("time to rest");
    document.getElementById("audio-limit").play();
  } else {
    document.getElementById("audio-limit").pause();
  }
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

  checkLimit();

  $('#time-now').html(moment().format('HH:mm:ss'));

  $('#work-total').html(displayDuration(stateApp.productivity.workTotal));
  $('#work-current').html(displayDuration(stateApp.productivity.workCurrent));
  $('#work-last').html(displayDuration(stateApp.productivity.workLast));
  $('#rest-total').html(displayDuration(stateApp.productivity.restTotal));
  $('#rest-current').html(displayDuration(stateApp.productivity.restCurrent));
  $('#rest-last').html(displayDuration(stateApp.productivity.restLast));
  $('#rest-needed').html(displayDuration(stateApp.productivity.restNeeded));

  stateApp.time.markLast = stateApp.time.markCurrent;
  stateApp.mode.last = stateApp.mode.current;
};

window.setInterval(function () {
  updateTime(stateApp);
}, stateApp.settings.updateRate);

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
