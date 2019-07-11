import axios from "axios";
import moment, { max } from "moment";

var urlBase =
  "https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.";

export function getUserSteps(response) {
  return axios.get(
    urlBase +
      "step_count.delta:com.google.android.gms:estimated_steps/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function getUserWeight(response) {
  return axios.get(
    urlBase +
      "weight:com.google.android.gms:merge_weight/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function getUserHeight(response) {
  return axios.get(
    urlBase +
      "height:com.google.android.gms:merge_height/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function getUserHeartBeat(response) {
  return axios.get(
    urlBase +
      "heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function getUserBloodPressure(response) {
  return axios.get(
    urlBase +
      "blood_pressure:com.google.android.gms:merged/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function getUserBloodGlucose(response) {
  return axios.get(
    urlBase +
      "blood_glucose:com.google.android.gms:merged/datasets/631148400000000000-1735686000000000000",
    { headers: { Authorization: "Bearer " + response.accessToken } }
  );
}

export function formatNanosec(ns) {
  let momentObject = moment(ns / 1000000);
  return momentObject.format("YYYY-MM-DDTHH:mm:ss"); // Conforms to FHIR standard
}

export function structureDatasets(dataType) {
  let measurements = [];
  let currentValue;
  let startTime;
  let endTime;
  let intervalSeconds;
  let secondValue;
  let currentNano;
  let currentIntervalLength;
  const nanoSecFactor = 1000000000;
  dataType.data.point.forEach((item, index) => {
    if (item.value[0].intVal) {
      currentValue = item.value[0].intVal;
    } else if (item.value[0].fpVal) {
      currentValue = item.value[0].fpVal;
    } else {
      return;
    }
    intervalSeconds = (item.endTimeNanos - item.startTimeNanos) / nanoSecFactor;
    if (intervalSeconds <= 60) {
      startTime = formatNanosec(item.startTimeNanos);
      endTime = formatNanosec(item.endTimeNanos);
      measurements.push({
        start: startTime,
        end: endTime,
        value: currentValue
      });
    } else {
      console.log("intsec : ", intervalSeconds);
      secondValue = currentValue / intervalSeconds;
      currentNano = item.startTimeNanos;
      while (intervalSeconds > 0) {
        currentIntervalLength = Math.min(60, intervalSeconds);
        console.log("currentInt: ", currentIntervalLength);
        measurements.push({
          start: formatNanosec(currentNano),
          end: formatNanosec(
            currentNano + currentIntervalLength * nanoSecFactor
          ),
          value: Math.floor(secondValue * currentIntervalLength)
        });
        intervalSeconds -= currentIntervalLength;
        currentNano += currentIntervalLength * nanoSecFactor;
        console.log("pushed: ", measurements[measurements.length - 1]);
      }
    }
  });
  return measurements;
}

export function responseGoogle(response) {
  console.log("Saving google client to localStorage");
  localStorage.setItem("googleResponse", JSON.stringify(response));

  axios
    .all([
      getUserSteps(response),
      getUserWeight(response),
      getUserHeight(response),
      getUserHeartBeat(response),
      getUserBloodPressure(response),
      getUserBloodGlucose(response)
    ])
    .then(
      axios.spread(
        (steps, weight, height, heartBeat, bloodPressure, bloodGlucose) => {
          let datasets = [];
          const pic = response.profileObj.imageUrl + "?sz=200";

          let stepMeasurement = structureDatasets(steps);
          let weightMeasurement = structureDatasets(weight);
          let heightMeasurement = structureDatasets(height);
          let heartBeatMeasurement = structureDatasets(heartBeat);
          let bloodPressureMeasurement = structureDatasets(bloodPressure);
          let bloodGlucoseMeasurement = structureDatasets(bloodGlucose);

          datasets.push(
            { name: "55423-8", measurements: stepMeasurement },
            { name: "29463-7", measurements: weightMeasurement },
            { name: "8302-2", measurements: heightMeasurement },
            { name: "8867-4", measurements: heartBeatMeasurement },
            { name: "85354-9", measurements: bloodPressureMeasurement },
            { name: "2339-0", measurements: bloodGlucoseMeasurement }
          );

          this.props.addInfo(
            response.profileObj.googleId,
            response.profileObj.givenName,
            response.profileObj.familyName,
            response.profileObj.email,
            pic,
            datasets
          );

          this.props.onLoggedIn(true);
        }
      )
    )
    .catch(error => {
      console.log(error);
    });
}
