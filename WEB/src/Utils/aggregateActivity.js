import moment from "moment";
import findStartAndEndIndex from "./findStartAndEndIndex";

export default function aggregateData(
  inData,
  interval,
  startString,
  endString,
  outputFormat
) {
  let sleepArray = [];
  let activityArray = [];
  let notActiveArray = [];
  let activityType =
    1 || // Biking
    2 || // On foot
    7 || // Walking
    8 || // Running
    11 || // Baseball
    12 || // Basketball
    16 || // Road biking
    17 || // Spinning
    18 || // Stationary biking
    19 || // Utility biking
    39 || // Jumping rope
    54 || // Rowing machine
    57 || // Running on sand
    58 || // Running (treadmill)
    77 || // Stair climbing
    78 || // Stair-climbing machine
    80 || // Strength training
    85 || // Table tennis
    86 || // Team Sports
    87 || // Tennis
    88 || // Treadmill (walking or running)
    89 || // Volleyball
    93 || // Walking (fitness)
    94 || // Nording walking
    95 || // Walking (treadmill)
    97 || // Weightlifting
    98 || // Wheelchair
    114 || // HIIT
    116; // Walking (stroller)

  for (let i = 0; i < inData.length; i++) {
    let googleType = inData[i].value;
    if (
      googleType === 0 || // In vehicle
      googleType === 3 || // Still (not moving)
      googleType === 4 || // Unknown (unable to detect activity)
      googleType === 5 // Tilting (sudden device gravity change)
    ) {
      notActiveArray.push(inData[i]);
    } else if (
      googleType === 72 || // Sleeping
      googleType === 109 || // Light sleep	
      googleType === 110 || // Deep sleep
      googleType === 111 || // REM sleep
      googleType === 112 // Awake (during sleep cycle)
    ) {
      sleepArray.push(inData[i]);
    } else {
      activityArray.push(inData[i]);
    }
  }
  const { startIndex, endIndex } = findStartAndEndIndex(
    activityArray,
    startString,
    endString
  );

  let slicedData = activityArray.slice(startIndex, endIndex);
  const inputFormat = "YYYY-MM-DDTHH:mm";
  const slicedLength = slicedData.length;

  let aggregated = [];
  let count = 0;

  let data = slicedData.map(item => ({ x: item.start, y: 0 }));

  let start = moment(data[0].x, inputFormat).startOf("minutes");

  let currentDataTime;
  for (let i = 1; i < slicedLength; i++) {
    currentDataTime = moment(data[i].x, inputFormat);
    if (data[i].x !== data[i - 1].x) {
      aggregated.push({
        y: 0,
        x: currentDataTime.format(outputFormat)
      });
    }
  }
  aggregated.push({ y: 0, x: start.format(outputFormat) });

  return aggregated;
}