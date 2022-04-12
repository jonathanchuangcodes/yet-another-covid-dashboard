import React, { useState, useEffect } from "react"
import covid from './api/covid'
import "./styles/App.css"

//TODO: Change any type definitions
export default function App() {
  const [location, setLocation] = useState(null);
  const [summaries, setSummaries] = useState<null | any>(null);
  const [country, setCountry] = useState(null);
  navigator.geolocation.getCurrentPosition((location: any) => {
    setLocation(location)
  });

  console.log(location);

  async function getSummaries() {
    const { data } = await covid.get("summary");
    return setSummaries(data);
  }

  useEffect(() => {
    if (!summaries) {
      getSummaries();
    }
  }, [summaries])

  return (
    <div data-theme="dark" className="container">
      <h1>Yet Another Covid-19 Dashboard</h1>
      <label htmlFor="country-select">Choose a country:</label>
      <select id="country-select" onChange={(e: any) => setCountry(e.target.value)}>
        <option value="">Please select a country</option>
        {summaries ? summaries.Countries.map((country: any) => {
          return <option key={country.ID} value={country.Slug}>{country.Country}</option>
        }) : ""}
      </select>
      <div>
        <h1>{`New Cases Today in ${country ? country : "selected country"}: ${summaries && country ? summaries.Countries.find((element: any) => {
          return element.Slug === country
        }).NewConfirmed : ""}`}</h1>
      </div>
      <div className="container table">
        <table>
          <thead className="header">
            <tr>
              <th scope="col">Country</th>
              <th scope="col">Confirmed Cases Yesterday</th>
              <th scope="col">Deaths Yesterday</th>
              <th scope="col">Total Confirmed Cases</th>
            </tr>
          </thead>
          <tbody>
            {summaries ? summaries.Countries.map((country: any) => {
              return (
                <tr key={country.ID}>
                  <th scope="row">{country.Country}</th>
                  <td>{country.NewConfirmed}</td>
                  <td>{country.NewDeaths}</td>
                  <td>{country.TotalConfirmed}</td>
                </tr>
              );
            }) : null}
          </tbody>
        </table>
      </div>
    </div>

  );
}
