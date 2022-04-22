import { useRef, useEffect, useState } from "react";
import { select, geoPath, geoMercator, min, max, scaleLinear } from "d3";
import useResizeObserver from "../hooks/useResizeObserver";
import "../styles/GeoChart.css"

export default function GeoChart({ data }) {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const dimensions = useResizeObserver(wrapperRef);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedStat, setSelectedStat] = useState("todayCases");

    useEffect(() => {
        const svg = select(svgRef.current);
        const minProp = min(data.features, (feature) => {
            if (feature.covidData) {
                return feature.covidData[selectedStat]
            } else {
                return 0;
            }
        })
        const maxProp = max(data.features, (feature) => {
            if (feature.covidData) {
                return feature.covidData[selectedStat]
            } else {
                return 0;
            }
        })
        let tooltip = select("#tooltip")

        const colorScale = scaleLinear()
            .domain([minProp, maxProp])
            .range(["#ccc", "red"]);

        const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect();

        const handleLabel = () => {
            if (selectedStat === "todayCases") {
                return "Cases Today"
            } else if (selectedStat === "todayDeaths") {
                return "Deaths Today"
            } else if (selectedStat === "active") {
                return "Current Active Cases"
            } else if (selectedStat === "cases") {
                return "Total Cases"
            } else if (selectedStat === "deaths") {
                return "Total Deaths"
            }
        }

        const projection = geoMercator().fitSize([width, height], selectedCountry || data).precision(100);
        const pathGenerator = geoPath().projection(projection);

        svg.selectAll(".country")
            .data(data.features)
            .join("path")
            .on("click", (_, feature) => {
                setSelectedCountry(selectedCountry === feature ? null : feature);
            })
            .on("mousemove", (event, d) => {
                tooltip.html(`${handleLabel()} in ${d.properties.name}: ${d.covidData && d.covidData[selectedStat] ?
                    d.covidData[selectedStat].toLocaleString() : "data currently unavailable"}`)
                    .style("display", "block")
                    .style("left", event.x + 20 + 'px')
                    .style("top", event.y + 830 + 'px');
            })
            .on("mouseleave", function () {
                tooltip
                    .style("display", null)
                    .style("left", null)
                    .style("top", null);
            })
            .attr("class", "country")
            .transition()
            .duration(1000)
            .attr("fill", feature => colorScale(feature.covidData ? feature.covidData[selectedStat] : 0))
            .attr("d", feature => pathGenerator(feature))


        svg.selectAll(".label")
            .data([selectedCountry])
            .join("text")
            .attr("class", "label")
            .text(
                feature => {
                    return feature &&
                        `${handleLabel()} in ${feature.properties.name}: 
                        ${feature.covidData && feature.covidData[selectedStat] ?
                            feature.covidData[selectedStat].toLocaleString() : "data currently unavailable"}`
                }
            )
            .attr("x", 10)
            .attr("y", 25);

    }, [data, dimensions, selectedCountry, selectedStat])



    return (
        <div className="container-fluid chart">
            <h1>Cases and Deaths around the World</h1>
            <div ref={wrapperRef} className="svg-container">
                <svg ref={svgRef}></svg>
                <div id="tooltip"></div>
            </div>
            <select name="stat" id="stat-select" onClick={(e) => {
                setSelectedStat(e.target.value);
            }}>
                <option value={"todayCases"}>Today's Cases</option>
                <option value={"todayDeaths"}>Today's Deaths</option>
                <option value={"active"}>Active Cases</option>
                <option value={"cases"}>Total Cases</option>
                <option value={"deaths"}>Total Deaths</option>
            </select>
        </div>

    );
}

