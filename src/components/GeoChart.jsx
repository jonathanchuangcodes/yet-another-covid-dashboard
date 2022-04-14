import { useRef, useEffect, useState } from "react";
import { select, geoPath, geoMercator, min, max, scaleLinear } from "d3";
import useResizeObserver from "../hooks/useResizeObserver";
import "../styles/GeoChart.css"

export default function GeoChart({ data }) {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const dimensions = useResizeObserver(wrapperRef);
    const [selectedCountry, setSelectedCountry] = useState(null);

    useEffect(() => {
        const svg = select(svgRef.current);
        const minProp = min(data.features, (feature) => {
            if (feature.covidData) {
                return feature.covidData.todayCases
            } else {
                return 0;
            }
        })
        const maxProp = max(data.features, (feature) => {
            if (feature.covidData) {
                return feature.covidData.todayCases
            } else {
                return 0;
            }
        })

        console.log(minProp, maxProp);
        const colorScale = scaleLinear()
            .domain([minProp, maxProp])
            .range(["#ccc", "red"]);

        const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect();

        const projection = geoMercator().fitSize([width, height], selectedCountry || data).precision(100);
        const pathGenerator = geoPath().projection(projection);

        svg.selectAll(".country")
            .data(data.features)
            .join("path")
            .on("click", (_, feature) => {
                setSelectedCountry(selectedCountry === feature ? null : feature);
            })
            .attr("class", "country")
            .transition()
            .duration(1000)
            .attr("fill", feature => colorScale(feature.covidData ? feature.covidData.todayCases : 0))
            .attr("d", feature => pathGenerator(feature));

        svg
            .selectAll(".label")
            .data([selectedCountry])
            .join("text")
            .attr("class", "label")
            .text(
                feature => {
                    console.log(feature);
                    return feature &&
                        `New Cases in ${feature.properties.name}: ${feature.covidData.todayCases ? feature.covidData.todayCases.toLocaleString() : "N/A"}`

                }

            )
            .attr("x", 10)
            .attr("y", 25);
    }, [data, dimensions, selectedCountry])

    return (
        <div ref={wrapperRef} style={{ marginBottom: "2rem" }}>
            <svg ref={svgRef}></svg>
        </div>
    );
}

