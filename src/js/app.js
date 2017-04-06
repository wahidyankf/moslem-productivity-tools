/*
Application states
*/

var stateApp = {
  mode: {
    current: "reset",
    last: "stop"
  },
  prayer: {
    latitude: 51.7167,
    longitude: 8.7667,
    lastUpdate: 0,
    fajr: moment(),
    dhuhr: moment(),
    asr: moment(),
    maghrib: moment(),
    isha: moment(),
    oneThird: moment(),
    halfNight: moment(),
    twoThird: moment(),
    imsak: moment()
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
    audioRate: 1000,
    audioWorkVolume: 0.1
  }
};

/* 
Productivity Section
*/

var modeWork = function () {
  if (stateApp.mode.last !== stateApp.mode.current) {
    stateApp.productivity.workCurrent = moment.duration(0);
  }
  stateApp.productivity.restNeeded = stateApp.productivity.restNeeded.add(moment.duration(stateApp.time.timeDiff * (stateApp.productivity.proportionRest / stateApp.productivity.proportionWork)));
  stateApp.productivity.workCurrent = stateApp.productivity.workCurrent.add(stateApp.time.timeDiff);
  stateApp.productivity.workTotal = stateApp.productivity.workTotal.add(stateApp.time.timeDiff);
};

var modeRest = function () {
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

var modeReset = function () {
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

var modeStop = function () {
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

var updateProductivity = function () {
  stateApp.time.markCurrent = moment();
  stateApp.time.timeDiff = stateApp.time.markCurrent - stateApp.time.markLast;
  modeTransition();
  if (stateApp.mode.current === "work") {
    modeWork();
  } else if (stateApp.mode.current === "rest") {
    modeRest();
  } else if (stateApp.mode.current === "stop") {
    modeStop();
  } else if (stateApp.mode.current === "reset") {
    modeReset();
  }
  stateApp.time.markLast = stateApp.time.markCurrent;
  stateApp.mode.last = stateApp.mode.current;
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

/*
Sound
*/

var playSound = function () {
  var audioWork = document.getElementById("audio-work");
  audioWork.volume = stateApp.settings.audioWorkVolume;
  if (stateApp.mode.current == "work") {
    audioWork.play();
  } else if (stateApp.mode.current != "work") {
    audioWork.pause();
    audioWork.currentTime = 0;
  }
};

var updateSound = function () {
  window.setInterval(function () {
    playSound();
  }, stateApp.settings.audioRate);
};

/*
Prayer functions
*/

var updatePrayer = function (){
  var pray = prayTimes.getTimes(new Date(), [stateApp.prayer.latitude, stateApp.prayer.longitude]);

  stateApp.prayer.fajr = moment(pray.fajr, "HH:mm");
  stateApp.prayer.sunrise = moment(pray.sunrise, "HH:mm");
  stateApp.prayer.dhuhr = moment(pray.dhuhr, "HH:mm");
  stateApp.prayer.asr = moment(pray.asr, "HH:mm");
  stateApp.prayer.maghrib = moment(pray.maghrib, "HH:mm");
  stateApp.prayer.isha = moment(pray.isha, "HH:mm");
  stateApp.prayer.imsak = moment(pray.imsak, "HH:mm");
  
  // var nightLength = (24*60) + stateApp.prayer.fajr.diff(stateApp.prayer.isha, "minutes");
  // console.log(nightLength);

  stateApp.prayer.oneThird = moment(pray.isha, "HH:mm");
  stateApp.prayer.halfNight = moment(pray.isha, "HH:mm");
  stateApp.prayer.twoThird = moment(pray.isha, "HH:mm");

  stateApp.prayer.lastUpdate = moment();
};

/*
App Update
*/

var updateApp = function () {
  window.setInterval(function () {
    updateProductivity();
    checkLimit();
    updatePrayer();
    updateDisplay();
  }, stateApp.settings.updateRate);
};

/**
 * Display Functions
 */

var updateDisplay = function() {
  // general time
  $('#time-now').html(moment().format('HH:mm:ss'));
  $('#date-now').html(moment().format('dddd, D MMM YYYY'));

  // prayer time
  $('#imsak-time').html(stateApp.prayer.imsak.format("HH:mm"));
  $('#fajr-time').html(stateApp.prayer.fajr.format("HH:mm"));
  $('#sunrise-time').html(stateApp.prayer.sunrise.format("HH:mm"));
  $('#dhuhr-time').html(stateApp.prayer.dhuhr.format("HH:mm"));
  $('#asr-time').html(stateApp.prayer.asr.format("HH:mm"));
  $('#maghrib-time').html(stateApp.prayer.maghrib.format("HH:mm"));
  $('#isha-time').html(stateApp.prayer.isha.format("HH:mm"));
  $('#onethird-time').html(stateApp.prayer.oneThird.format("HH:mm"));
  $('#halfnight-time').html(stateApp.prayer.halfNight.format("HH:mm"));
  $('#twothird-time').html(stateApp.prayer.twoThird.format("HH:mm"));

  // productivity
  $('#work-total').html(displayDuration(stateApp.productivity.workTotal));
  $('#work-current').html(displayDuration(stateApp.productivity.workCurrent));
  $('#work-last').html(displayDuration(stateApp.productivity.workLast));
  $('#rest-total').html(displayDuration(stateApp.productivity.restTotal));
  $('#rest-current').html(displayDuration(stateApp.productivity.restCurrent));
  $('#rest-last').html(displayDuration(stateApp.productivity.restLast));
  $('#rest-needed').html(displayDuration(stateApp.productivity.restNeeded));
};

/*
Runner Functions
*/

updateApp();

updateSound();

/*
Button functions
*/

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