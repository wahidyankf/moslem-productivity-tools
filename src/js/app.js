/*
Application States
*/

var colorPalette = {
  denim: "#1779ba",
  boulder: "#767676",
  shamrock: "#3adb76",
  yellowsea: "#ffae00",
  mojo: "#cc4b37"
};

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
    imsak: moment(),
    currentSection: 0,
    nextPrayer: 0,
    nextPrayerIn: moment.duration(0),
    prayerList: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    sectionList: ["imsak", "fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha", "oneThird", "halfNight", "twoThird"]
  },
  productivity: {
    workTotal: moment.duration(0),
    workAvailable: moment.duration(0),
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
    updateRate: 500,
    audioRate: 1000,
    prayerUpdateRate: 300000,
    audioWorkVolume: 0.1,
    color: {
      work: colorPalette.denim,
      rest: colorPalette.shamrock,
      stop: colorPalette.yellowsea,
      reset: colorPalette.mojo,
      good: colorPalette.shamrock,
      warning: colorPalette.yellowsea,
      danger: colorPalette.mojo,
      praySectionCurrent: {
        backgroundColor: colorPalette.shamrock,
        text: "white"
      },
      prayNext: {
        backgroundColor: "lightGrey",
        text: "black"
      }
    }
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

var modeStop = function () {};

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

var productivity = function () {
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

  stateApp.productivity.workAvailable = moment.duration((stateApp.productivity.restLimit - stateApp.productivity.restNeeded) * 52 / 17);

  stateApp.time.markLast = stateApp.time.markCurrent;
  stateApp.mode.last = stateApp.mode.current;
};

var checkLimit = function () {
  var audioLimit = document.getElementById("audio-limit");
  var limitPortion = stateApp.productivity.restNeeded.asSeconds() / stateApp.productivity.restLimit.asSeconds();
  if (limitPortion >= 1) {
    $("#rest-needed").css("background-color", stateApp.settings.color.danger);
  } else if (limitPortion >= 0.5) {
    $("#rest-needed").css("background-color", stateApp.settings.color.warning);
  } else {
    $("#rest-needed").css("background-color", stateApp.settings.color.good);
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
Prayer Functions
*/

var updatePrayerTime = function () {
  var today = new Date();
  var pray = prayTimes.getTimes(today, [stateApp.prayer.latitude, stateApp.prayer.longitude]);

  stateApp.prayer.fajr = moment(pray.fajr, "HH:mm");
  stateApp.prayer.sunrise = moment(pray.sunrise, "HH:mm");
  stateApp.prayer.dhuhr = moment(pray.dhuhr, "HH:mm");
  stateApp.prayer.asr = moment(pray.asr, "HH:mm");
  stateApp.prayer.maghrib = moment(pray.maghrib, "HH:mm");
  stateApp.prayer.isha = moment(pray.isha, "HH:mm");
  stateApp.prayer.imsak = moment(pray.imsak, "HH:mm");

  var nightLength = (24 * 60) - stateApp.prayer.isha.diff(stateApp.prayer.fajr, "minutes");
  var isha = stateApp.prayer.isha;
  var dateToday = stateApp.time.markCurrent.date();

  stateApp.prayer.oneThird = moment(isha).add((nightLength * 1 / 3), "minutes").date(dateToday);
  stateApp.prayer.halfNight = moment(isha).add((nightLength * 1 / 2), "minutes").date(dateToday);
  stateApp.prayer.twoThird = moment(isha).add((nightLength * 2 / 3), "minutes").date(dateToday);

  stateApp.prayer.lastUpdate = moment();
};

var findPrayer = function (toFind) {
  if (toFind == "nextPrayer") {
    var comparePrayer = [];
    var nextPrayerIndex = 0;
    for (var i = 0; i < stateApp.prayer.prayerList.length; i++) {
      comparePrayer.push(stateApp.time.markCurrent - stateApp.prayer[stateApp.prayer.prayerList[i]]);
    }
    for (var i = 0; i < comparePrayer.length; i++) {
      nextPrayerIndex = i;
      if (comparePrayer[i] < 0) {
        break;
      }
      if (nextPrayerIndex == comparePrayer.length - 1) {
        nextPrayerIndex = 0;
      }
    }
    return stateApp.prayer.prayerList[nextPrayerIndex];
  } else if (toFind == "currentSection") {
    var currentSectionIndex = 0;
    var compareSection = [];
    for (var i = 0; i < stateApp.prayer.sectionList.length; i++) {
      compareSection.push(stateApp.time.markCurrent - stateApp.prayer[stateApp.prayer.sectionList[i]]);
    }
    for (var i = 0; i < compareSection.length; i++) {
      currentSectionIndex = i;
      if (compareSection[i] < 0) {
        break;
      }
      if (currentSectionIndex == compareSection.length - 1) {
        currentSectionIndex = 0;
      }
    }
    return stateApp.prayer.sectionList[currentSectionIndex - 1];
  }
};

var paintPrayerTable = function(){
  $(".prayer-table").css("font-weight", "normal");
  $(".prayer-name").css("font-weight", "bold");
  $(".prayer-table tr:nth-child(2n+1)").css("background-color", "FEFEFE");
  $(".prayer-table tr:nth-child(2n)").css("background-color", "#F1F1F1");
  $(".prayer-helper").css("color", "Grey");
  $(".prayer-time").css("color", "black");
  $(".next-prayer").css("background-color", colorPalette.denim);
};

var markPrayer = function (marked, markType) {
  var selector = `#${marked.toLowerCase()}-time`;
  if (markType == "currentSection") {
    $(selector).parent().children().css("background-color", stateApp.settings.color.praySectionCurrent.backgroundColor);
    $(selector).parent().children().css("color", stateApp.settings.color.praySectionCurrent.text);
    $(selector).css("font-weight", "bold");
  } else if (markType == "nextPrayer") {
    $(selector).css("background-color", stateApp.settings.color.prayNext.backgroundColor);
    $(selector).css("color", stateApp.settings.color.prayNext.text);
  }
};

var timeToPrayer = function (prayerName) {
  var timeToNext = moment.duration(stateApp.prayer[prayerName] - stateApp.time.markCurrent);
  return timeToNext;
};

var prayer = function () {
  if (stateApp.prayer.lastUpdate === 0) {
    updatePrayerTime();
  } else if ((stateApp.time.markCurrent - stateApp.prayer.lastUpdate) >= stateApp.settings.prayerUpdateRate) {
    updatePrayerTime();
  }

  stateApp.prayer.nextPrayer = findPrayer("nextPrayer");
  stateApp.prayer.currentSection = findPrayer("currentSection");
  stateApp.prayer.nextPrayerIn = timeToPrayer(stateApp.prayer.nextPrayer);

  paintPrayerTable();

  markPrayer(stateApp.prayer.currentSection, "currentSection");
  markPrayer(stateApp.prayer.nextPrayer, "nextPrayer");
};

/**
 * Display Functions
 */

var display = function () {
  // general time
  $('#time-now').html(moment().format('HH:mm:ss'));
  $('#date-now').html(moment().format('dddd, D MMM YYYY'));

  // prayer time
  $('#nextprayer-time').html(displayDuration(stateApp.prayer.nextPrayerIn));
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
  $('#work-available').html(displayDuration(stateApp.productivity.workAvailable));
  $('#work-current').html(displayDuration(stateApp.productivity.workCurrent));
  $('#work-last').html(displayDuration(stateApp.productivity.workLast));
  $('#rest-total').html(displayDuration(stateApp.productivity.restTotal));
  $('#rest-current').html(displayDuration(stateApp.productivity.restCurrent));
  $('#rest-last').html(displayDuration(stateApp.productivity.restLast));
  $('#rest-needed').html(displayDuration(stateApp.productivity.restNeeded));
};

/*
App Update
*/

var updateApp = function () {
  window.setInterval(function () {
    productivity();
    checkLimit();
    prayer();
    display();
  }, stateApp.settings.updateRate);
};

/*
Runner Functions
*/

updateApp();

updateSound();

/*
Button Functions
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