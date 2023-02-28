const express = require("express");

const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");

let database = null;

const InitializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("listening to http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (req, res) => {
  const GetStatesQuery = `SELECT * FROM state`;

  const statesArray = await database.all(GetStatesQuery);

  res.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;

  const GetStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;

  const State = await database.get(GetStateQuery);
  res.send(convertStateDbObjectToResponseObject(State));
});

app.post("/districts/", async (req, res) => {
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = req.body;
  const addDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES ("${districtName}",${stateId},${cases},${cured},${active},${deaths});
    `;

  await database.run(addDistrictQuery);
  res.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;

  const GetDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;

  const District = await database.get(GetDistrictQuery);
  res.send(convertDistrictDbObjectToResponseObject(District));
});

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;

  const GetDistrictQuery = `DELETE  FROM district WHERE district_id = ${districtId};`;
  await database.run(GetDistrictQuery);
  res.send("District Removed");
});

app.put("/districts/:districtId/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const { districtId } = req.params;

  const updatedDistrictQuery = `UPDATE 
   district 
   SET 
 
   district_name = "${districtName}",
   state_id = ${stateId},
   cases = ${cases},
   cured = ${cured},
   active = ${active},
    deaths = ${deaths}
    
    WHERE district_id = ${districtId}`;

  await database.run(updatedDistrictQuery);
  res.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;

  const GetStatisticsQuery = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths FROM district WHERE state_id = ${stateId}; `;

  const StatisticsArray = await database.get(GetStatisticsQuery);

  res.send(StatisticsArray);
});

app.get("/districts/:districtId/details/", async (req, res) => {
  const GetStateQuery = `SELECT state.state_name
    FROM state
    INNER JOIN district ON state.state_id =district.state_id`;
  const state = await database.get(GetStateQuery);
  res.send(convertStateDbObjectToResponseObject(state));
});

module.exports = app;
