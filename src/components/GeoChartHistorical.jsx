import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { select, geoPath, geoMercator, map, max, min, range, scaleSqrt, descending } from "d3";
import { Scrubber } from "react-scrubber";
import useResizeObserver from "../hooks/useResizeObserver";
import "../styles/GeoChartHistorical.css"
import "../styles/scrubber.css"

export default function GeoChartHistorical({ data }) {
    const [selectedType, setSelectedType] = useState("cases");

    // const markers = Object.keys(data.features[0].timeline.cases).map((date) => {
    //     return Date.parse(date);
    // })

    const minDate = useMemo(() => {
        const days = min(data.features.map((feature) => {
            return feature.timeline ? Object.keys(feature.timeline[selectedType]).map((day) => {
                return Date.parse(day)
            }) : 0;
        }))
        return min(days);
    }, [data, selectedType])

    const maxDate = useMemo(() => {
        const days = max(data.features.map((feature) => {
            return feature.timeline ? Object.keys(feature.timeline[selectedType]).map((day) => {
                return Date.parse(day)
            }) : 0;
        }))
        return max(days);
    }, [data, selectedType])
    const [date, setDate] = useState(minDate);

    const dateString = useMemo(() => {
        const dateObject = new Date(date);
        const year = (dateObject.getFullYear() + "").slice(2);
        return `${dateObject.getMonth() + 1}/${dateObject.getDate()}/${year}`
    }, [date])

    const svgRef = useRef();
    const wrapperRef = useRef();
    const dimensions = useResizeObserver(wrapperRef);

    const handleScrubStart = (value) => {
        setDate(Math.round(value))
    }

    const handleScrubEnd = (value) => {
        setDate(Math.round(value))
    }

    const handleScrubChange = (value) => {
        setDate(Math.round(value))
    }

    //Changes the bubble color base on the selected type.
    const handleColor = useCallback(() => {
        if (selectedType === "cases") {
            return "red"
        } else if (selectedType === "deaths") {
            return "grey"
        } else if (selectedType === "recovered") {
            return "blue"
        }
    }, [selectedType])

    //Calculates the maximum stat number for the given date. 
    const maxStats = useMemo(() => {
        const maxStatsArray = data.features.map((feature) => {
            return feature.timeline ? feature.timeline[selectedType][dateString] : null;
        })
        return max(maxStatsArray);
    }, [data.features, selectedType, dateString])

    //Creates the bubble representing the chosen info type.
    function centroid(country) {
        const path = geoPath();
        return path.centroid(country);
    }

    const position = (country) => {
        return country && centroid(country);
    }

    const value = (country) => {
        return country.timeline ? country.timeline[selectedType][dateString] : 0;
    }

    const title = (country) => {
        return country.properties.name;
    };
    const V = map(data.features, value);
    const P = map(data.features, position);
    const T = title === null ? null : map(data.features, title);
    const domain = [0, maxStats];

    const radius = scaleSqrt().domain(domain).range([0, 100]);

    useEffect(() => {
        const svg = select(svgRef.current);
        svg.selectAll("g").remove("circle");

        const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect();
        const projection = geoMercator().fitSize([width, height], data);
        const pathGenerator = geoPath().projection(projection);

        svg.selectAll(".country")
            .data(data.features)
            .join("path")
            .attr("class", "country")
            .attr("d", feature => pathGenerator(feature))

        svg.append("g")
            .attr("fill", handleColor)
            .attr("fill-opacity", 0.5)
            .attr('stroke', "black")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 1)
            .selectAll("circle")
            .data(range(data.features.length)
                .filter(i => P[i])
                .sort((i, j) => {
                    return descending(V[i], V[j])
                }))
            .join("circle")
            .attr("transform", projection === null
                ? i => `translate(${P[i]})`
                : i => `translate(${projection(P[i])})`)
            .attr("r", i => {
                if (V[i] !== 0) {
                    return radius(V[i])
                } else {
                    return 0;
                }
            })
            .call(T ? circle => circle.append("title").text(i => `${T[i]}: ${V[i].toLocaleString()} ${selectedType}`) : () => { });

    }, [selectedType, date, data, dimensions, maxStats, dateString, handleColor, P, T, V, radius])




    return (
        <div className="container-fluid chart">
            <h1>Covid-19 Outbreak Historical Timeline</h1>
            <div ref={wrapperRef} className="svg-container">
                <svg ref={svgRef}></svg>
            </div>
            <Scrubber
                max={maxDate}
                min={minDate}
                value={date}
                onScrubStart={handleScrubStart}
                onScrubEnd={handleScrubEnd}
                onScrubChange={handleScrubChange}
            />
            <p>{`Date: ${dateString}`}</p>
            <select name="stat" id="stat-select" onClick={(e) => {
                setSelectedType(e.target.value);
            }}>
                <option value={"cases"}>Cases</option>
                <option value={"deaths"}>Deaths</option>
                <option value={"recovered"}>Recoveries</option>
            </select>
        </div>
    )

}