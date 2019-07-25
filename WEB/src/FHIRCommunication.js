import * as React from "react";
import * as FHIR from "fhirclient";
import moment from "moment";
import HomePage from "./Pages/LoginPage/loginPage";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { setGoals } from "./Redux/actions";

class FHIRCommunication extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      client: FHIR.client({
        serverUrl: "http://localhost:5000/fhir"
      }),
      userLoggedOut: false
    };
  }

  readAllObservations = () => {
    console.log(
      "Reading all observations the patient has in the FHIR database"
    );
    const q1 = new URLSearchParams();
    q1.set("subject", this.props.patient.googleId);
    this.state.client
      .request(`Observation?${q1}`, {
        pageLimit: 0,
        flat: true
      })
      .then(observations => {
        //console.log(observations);
      });
  };

  addPatient = () => {
    let patientJSON = {
      resourceType: "Patient",
      id: this.props.patient.googleId,
      meta: {
        versionId: "1",
        lastUpdated: moment().format("YYYY-MM-DDThh:mm:ss"),
        security: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
            code: "HTEST",
            display: "test health data"
          }
        ]
      },
      identifier: [
        {
          use: "usual",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR"
              }
            ]
          },
          system: "urn:oid:0.1.2.3.4.5.6.7",
          value: "0"
        }
      ],
      active: true,
      name: [
        {
          use: "official",
          family: this.props.patient.lastname,
          given: [this.props.patient.firstname, this.props.patient.lastname]
        }
      ],
      gender: "other",
      _gender: {
        extension: [
          {
            url: "http://example.org/Profile/administrative-status",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0001",
                  code: "A",
                  display: "Ambiguous"
                }
              ]
            }
          }
        ]
      },
      link: [
        {
          other: {
            reference:
              "https://localhost:5001/fhir/Patient/" +
              this.props.patient.googleId
          },
          type: "seealso"
        }
      ]
    };
    let optionsPatient = {
      method: "PUT",
      url: "http://localhost:5000/fhir/Patient/" + this.props.patient.googleId,
      headers: {
        "cache-control": "no-cache",
        Connection: "keep-alive",
        "accept-encoding": "gzip, deflate",
        Host: "localhost:5000",
        "Cache-Control": "no-cache",
        Accept: "*/*",
        "Content-Type": "application/json",
        "User-Agent": "PostmanRuntime/7.15.0",
        pageLimit: 0,
        flat: true
      },
      body: JSON.stringify(patientJSON)
    };

    console.log("Adding patient to FHIR database");
    this.state.client
      .request(optionsPatient, (error, response, body) => {})
      .then(patient => {
        //console.log(patient);
      });
  };

  addObservations = () => {
    for (let i = 0; i < this.props.patient.datasets.length; i++) {
      if (
        this.props.patient.datasets[i].measurements.length > 1 ||
        this.props.patient.datasets[i].measurements.value !== undefined
      ) {
        // console.log(this.props.patient.datasets[i].name);
        this.addObservation(i);
      }
    }
  };

  getStringsFromLOINC = LOINC => {
    let strings = {};
    switch (LOINC) {
      case "55423-8": // steps
        strings = {
          unitDisplayString: "Number of steps in unspecified time Pedometer",
          observationDisplayName: "Step count",
          unit: "steps/day",
          UCUMCode: "/d"
        };
        break;
      case "8867-4": // heart rate
        strings = {
          unitDisplayString: "Heart rate",
          observationDisplayName: "Heart rate",
          unit: "beats/minute",
          UCUMCode: "/min"
        };
        break;
      case "2339-0": // blood glucose
        strings = {
          unitDisplayString: "Glucose Bld-mCnc",
          observationDisplayName: "Glucose Bld-mCnc",
          unit: "mg/dL",
          UCUMCode: "mg/dL"
        };
        break;
      case "85354-9": // blood pressure
        strings = {
          unitDisplayString: "Blood pressure panel with all children optional",
          observationDisplayName: "Blood pressure systolic & diastolic",
          unit: "mmHg",
          UCUMCode: "mm[Hg]"
        };
        break;
      case "8302-2": // height
        strings = {
          unitDisplayString: "Body height",
          observationDisplayName: "Body height",
          unit: "m",
          UCUMCode: "m"
        };
        break;
      case "29463-7": // weight
        strings = {
          unitDisplayString: "Body weight",
          observationDisplayName: "Body weight",
          unit: "kg",
          UCUMCode: "kg"
        };
        break;
      case "77595-7": // Activity
        strings = {
          unitDisplayString: "Activity",
          observationDisplayName: "Activity",
          unit: "unitless",
          UCUMCode: "unitless"
        };

      default:
        strings = {
          unitDisplayString: "Activity",
          observationDisplayName: "Activity",
          unit: "unitless",
          UCUMCode: "unitless"
        };
      // console.error("Non-valid LOINC-code: ", LOINC);
      // return null;
    }
    return strings;
  };

  addObservation = datasetIndex => {
    const lenghtOfOneFhirDataset = 1000;
    let nSets =
      this.props.patient.datasets[datasetIndex].measurements.length /
      lenghtOfOneFhirDataset;

    for (let j = 0; j < nSets; j++) {
      let data = this.props.patient.datasets[datasetIndex].measurements.slice(
        Math.max(0, (j - 1) * lenghtOfOneFhirDataset),
        Math.min(
          j * lenghtOfOneFhirDataset,
          this.props.patient.datasets[datasetIndex].measurements.length
        )
      );
      let observationId;
      if (j === 0) {
        observationId = this.props.patient.datasets[datasetIndex].name;
      } else {
        observationId =
          this.props.patient.datasets[datasetIndex].name + "-" + j;
      }
      // Note on the above: this could also be set from uuid(),
      // but this makes it harder to overwrite all existing datasets
      let {
        unitDisplayString,
        observationDisplayName,
        unit,
        UCUMCode
      } = this.getStringsFromLOINC(
        this.props.patient.datasets[datasetIndex].name
      );

      let components = [];
      for (let i = 0; i < data.length; i++) {
        components.push({
          valueQuantity: {
            value: data[i].value,
            unit: unit,
            system: "http://unitsofmeasure.org",
            code: UCUMCode
          },
          code: { coding: { code: "value" } }
        });
        components.push({
          valuePeriod: {
            start: data[i].start,
            end: data[i].end
          },
          code: { coding: { code: "time" } }
        });
      }

      let observationJSON = {
        resourceType: "Observation",
        id: observationId,
        meta: {
          versionId: "1",
          lastUpdated: moment().format("YYYY-MM-DDThh:mm:ss")
        },
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: this.props.patient.datasets[datasetIndex].name,
              display: unitDisplayString
            }
          ],
          text: observationDisplayName
        },
        subject: {
          reference:
            "https://localhost:5001/fhir/Patient/" + this.props.patient.googleId
        },
        component: components
      };

      let optionsObservation = {
        method: "PUT",
        url: "http://localhost:5000/fhir/Observation/" + observationId,
        headers: {
          "cache-control": "no-cache",
          Connection: "keep-alive",
          "accept-encoding": "gzip, deflate",
          Host: "localhost:5000",
          "Cache-Control": "no-cache",
          Accept: "*/*",
          "Content-Type": "application/json",
          "User-Agent": "PostmanRuntime/7.15.0"
        },
        body: JSON.stringify(observationJSON)
      };

      console.log("Adding observation to FHIR database");
      this.state.client
        .request(optionsObservation, (error, response, body) => {})
        .then(observation => {
          // console.log(observation);
          // this.setState({ observation });
        });
    }
  };

  addPatientIfNeeded = () => {
    console.log("Reading patient from FHIR database");
    const q1 = new URLSearchParams();
    q1.set("id", this.props.patient.googleId);
    this.state.client
      .request(`Patient/${this.props.patient.googleId}`, {
        pageLimit: 0,
        flat: true
      })
      .then(patient => {
        // console.log(patient);
      })
      .catch(() => {
        console.log("Patient didn't already exist in FHIR database");
        this.addPatient();
      });
  };

  addGoal = () => {
    let goalId = "testGoal3";
    // Note on the above: this can also be set from uuid(), but since we want only one
    //                    of each dataset type connected to each patient this is better.
    let {
      unitDisplayString,
      observationDisplayName,
      unit,
      UCUMCode
    } = this.getStringsFromLOINC(
      "55423-8" // Steps
    );
    let datasetIndex = 0; // steps
    let lowerOrUpper = "lower";
    let descriptionText = "Desired minimum number of steps in a day";

    let goalJSON = {
      resourceType: "Goal",
      id: goalId,
      meta: {
        versionId: "1",
        lastUpdated: moment().format("YYYY-MM-DDThh:mm:ss")
      },
      subject: {
        reference:
          "https://localhost:5001/fhir/Patient/" + this.props.patient.googleId
      },
      target: {
        detailQuantity: {
          value: 14000,
          unit: unit,
          system: "http://unitsofmeasure.org",
          code: UCUMCode
        }
      },
      note: { text: lowerOrUpper },
      description: { text: descriptionText },
      lifecycleStatus: "active"
    };

    let goalOptions = {
      method: "PUT",
      url: "http://localhost:5000/fhir/Goal/" + goalId,
      headers: {
        "cache-control": "no-cache",
        Connection: "keep-alive",
        "accept-encoding": "gzip, deflate",
        Host: "localhost:5000",
        "Cache-Control": "no-cache",
        Accept: "*/*",
        "Content-Type": "application/json",
        "User-Agent": "PostmanRuntime/7.15.0"
      },
      body: JSON.stringify(goalJSON)
    };

    console.log("Adding goal to FHIR database");
    this.state.client
      .request(goalOptions, (error, response, body) => {})
      .then(goal => {
        // console.log("Goal: ", goal);
        // this.setState({ observation });
      });
  };

  readAllGoals = () => {
    console.log("Reading all goals the patient has in the FHIR database");
    const q1 = new URLSearchParams();
    q1.set("subject", this.props.patient.googleId);
    this.state.client
      .request(`Goal?${q1}`, {
        pageLimit: 0,
        flat: true
      })
      .then(goalsMsg => {
        // console.log(goalsMsg);
        let stateGoals = [];
        // for (let i = 0; i < goals.length; i++) {}
        goalsMsg.map((item, index) => {
          // console.log("item: ", item);
          if (item.note) {
            if (item.note[0].text === "range") {
              stateGoals.push({
                Name: item.id,
                type: item.note[0].text,
                lower: item.target[0].detailRange.low.value,
                upper: item.target[0].detailRange.upper.value,
                unit: item.taget[0].detailRange.low.unit
              });
            } else {
              stateGoals.push({
                Name: item.id,
                type: item.note[0].text,
                value: item.target[0].detailQuantity.value,
                unit: item.target[0].detailQuantity.unit
              });
            }
          }
        });
        this.props.setGoals(stateGoals);
      });
  };

  render() {
    if (this.props.baseInfo.isLoggedin) {
      return (
        <div>
          {/* moved them here, seems to have solved some issues, gets called after login has saved info to redux */}
          {this.addPatientIfNeeded()}
          {this.addObservations()}
          {/* {this.readAllObservations()} } */}
          {/* {this.addGoal()} */}
          {this.readAllGoals()}
          <Redirect to="/dashboard" />
        </div>
      );
    } else {
      return (
        <div>
          <HomePage />
        </div>
      );
    }
  }
}

const mapDispatchToProps = { setGoals };

function mapStateToProps(state) {
  return {
    patient: state.patient,
    baseInfo: state.baseInfo
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FHIRCommunication);
