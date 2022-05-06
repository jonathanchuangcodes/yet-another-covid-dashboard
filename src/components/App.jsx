import React, { useState, useEffect, useMemo } from "react"
import covid from '../api/covid'
import "../styles/App.css"
import GeoChart from "./GeoChart";
import GeoChartHistorical from "./GeoChartHistorical";
import mapData from "../GeoChart.world.geo.json";
import useHistoricalData from "../hooks/useHistoricalData";

//TODO: Change any type definitions
export default function App() {
  const [allData, setAllData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [countriesData, setCountriesData] = useState(null);

  async function getAllData() {
    const { data } = await covid.get("all?allowNull=true");
    return setAllData(data);
  }

  async function getCountriesData() {
    const { data } = await covid.get("countries?allowNull=true&?yesterday=true");
    return setCountriesData(data);
  }

  async function getAllHistoricalData() {
    const { data } = await covid.get("historical?lastdays=all");
    return setHistoricalData(data);
  }

  useEffect(() => {
    if (!allData) {
      getAllData();
    }
  }, [allData])

  useEffect(() => {
    if (!countriesData) {
      getCountriesData();
    }
  }, [countriesData])

  useEffect(() => {
    if (!historicalData) {
      getAllHistoricalData();
    }
  }, [historicalData])

  const parsedData = useMemo(() => {
    const theFeatures = mapData.features.map((feature) => {
      const corrData = countriesData ? countriesData.find((country) => {
        return country.countryInfo.iso2 === feature.properties.iso_a2;
      }) : null;

      if (corrData) {
        return { ...feature, covidData: { ...corrData } }
      } else {
        return feature;
      }
    })
    return { ...mapData, features: theFeatures };
  }, [countriesData])

  const parsedHistoricalData = useHistoricalData(historicalData, mapData);

  if (allData && countriesData) {
    return (
      <div className="container-fluid">
        <hgroup>
          <h1>Yet Another Covid-19 Dashboard</h1>
          <h2>Covid-19 in the World Today</h2>
        </hgroup>

        <p>Another Coronavirus wave is here, with the BA.2 Omicron
          variant becoming the dominant strain in affected communities. Read more about it <a href="https://www.nytimes.com/2022/03/30/well/live/ba2-omicron-covid.html">here</a>.</p>
        <div className="general-statistics">
          <h1>World Summary</h1>
          <h2>Today</h2>
          <div className="grid">
            <div>
              <h3>{`${allData.todayCases.toLocaleString()} new cases today`}</h3>
            </div>
            <div>
              <h3>{`${allData.todayDeaths.toLocaleString()} deaths today`}</h3>
            </div>
          </div>
          <h2>Totals</h2>
          <div className="grid">
            <div>
              <h3>{`${allData.active.toLocaleString()} cases remain active, with ${Math.round(allData.activePerOneMillion).toLocaleString()} active cases per million`}</h3>
            </div>
          </div>
          <div className="grid">
            <h3><span className="red">{allData.critical.toLocaleString()}</span>{` people remain in critical condition`}</h3>
          </div>
        </div>

        {countriesData ? <GeoChart data={parsedData} /> : null}
        {historicalData ? <GeoChartHistorical data={parsedHistoricalData} /> : null}
        <h1>Cases, Deaths, and Recovered Cases by Country</h1>
        <div className="container table">
          <table>
            <thead className="header">
              <tr>
                <th scope="col">Country</th>
                <th scope="col">Confirmed Cases Today</th>
                <th scope="col">Confirmed Deaths Today</th>
                <th scope="col">Confirmed Recovered Cases</th>
                <th scope="col">Total Confirmed Cases</th>
                <th scope="col">Total Deaths</th>
                <th scope="col">Total Recovered Cases</th>
              </tr>
            </thead>
            <tbody>
              {countriesData ? countriesData.map((country) => {
                return (
                  <tr key={country.ID}>
                    <th scope="row">{country.country}</th>
                    <td>{country.todayCases ? country.todayCases.toLocaleString() : "N/A"}</td>
                    <td>{country.todayDeaths ? country.todayDeaths.toLocaleString() : "N/A"}</td>
                    <td>{country.todayRecovered ? country.todayRecovered.toLocaleString() : "N/A"}</td>
                    <td>{country.cases ? country.cases.toLocaleString() : "N/A"}</td>
                    <td>{country.deaths ? country.deaths.toLocaleString() : "N/A"}</td>
                    <td>{country.recovered ? country.recovered.toLocaleString() : "N/A"}</td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        </div>
        <small>Data sourced from <a href="https://disease.sh/">disease.sh</a>, a third party API providing
          COVID-19 data from sources like Worldometer, Johns Hopkins University, and Governments around the world.</small>
      </div>


    );
  } else {
    return <div>Loading...</div>
  }

}
