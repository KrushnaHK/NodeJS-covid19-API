const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is running at http://localhost:300")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStatesDbObjectToResponseObject = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

const convertDistrictDbObjectToResponseObject = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

//Get All States API
app.get("/states/", async (request, response) => {
  const getAllStateQuery = `
        SELECT * 
        FROM state
    `;
  const statesArray = await db.all(getAllStateQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStatesDbObjectToResponseObject(eachState)
    )
  );
});

//Get State API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
        SELECT * 
        FROM state 
        WHERE state_id = ${stateId}
    `;
  const state = await db.get(getStateQuery);
  response.send(convertStatesDbObjectToResponseObject(state));
});

//Add District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    )
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Get District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * 
        FROM district
        WHERE district_id = ${districtId}
    `;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

//Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId}
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District Detail API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictDetailQuery = `
    UPDATE district
    SET
        district_name = '${districtName}',
         state_id = ${stateId},
         cases = ${cases},
         cured = ${cured},
         active = ${active},
         deaths = ${deaths}
  `;
  await db.run(updateDistrictDetailQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsOfStateQuery = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM 
            district
        WHERE 
            state_id = ${stateId};
    `;
  const Stats = await db.get(getStatsOfStateQuery);
  console.log(Stats);
  response.send({
    totalCases: Stats["SUM(cases)"],
    totalCured: Stats["SUM(cured)"],
    totalActive: Stats["SUM(active)"],
    totalDeaths: Stats["SUM(deaths)"],
  });
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
        SELECT state_name
        FROM district NATURAL JOIN state
        WHERE district_id =${districtId}
    `;
  const stateName = await db.get(getStateNameQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
