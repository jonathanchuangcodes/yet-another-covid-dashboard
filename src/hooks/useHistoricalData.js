import { useMemo } from "react"

export default function useHistoricalData(historicalData, mapData) {
    const parsedHistoricalData = useMemo(() => {
        const provincialData = historicalData ? historicalData.filter((country) => {
            return country.province
        }) : null;
        if (provincialData) {

            for (let i = 0; i < provincialData.length - 1; i++) {
                if (provincialData[i].country === provincialData[i + 1].country) {
                    Object.keys(provincialData[i].timeline.cases).forEach((day) => {
                        if (provincialData[i + 1].timeline.cases[day]) {
                            provincialData[i].timeline.cases[day] += provincialData[i + 1].timeline.cases[day];
                        }
                    })
                    Object.keys(provincialData[i].timeline.deaths).forEach((day) => {
                        if (provincialData[i + 1].timeline.deaths[day]) {
                            provincialData[i].timeline.deaths[day] += provincialData[i + 1].timeline.deaths[day];
                        }
                    })
                    Object.keys(provincialData[i].timeline.recovered).forEach((day) => {
                        if (provincialData[i + 1].timeline.recovered[day]) {
                            provincialData[i].timeline.recovered[day] += provincialData[i + 1].timeline.recovered[day];
                        }
                    })
                    provincialData.splice(i, 1);
                    i--;
                }
            }
            const countryOnlyData = historicalData.filter((country) => {
                return !country.province
            })
            const combinedData = [...provincialData, ...countryOnlyData];
            const covidData = new Map();
            combinedData.forEach((country) => {
                covidData.set(country.country, country.timeline)
            });
            const theFeatures = mapData.features.map((feature) => {
                const corrData = covidData.get(feature.properties.name_long) ||
                    covidData.get(feature.properties.name_short) ||
                    covidData.get(feature.properties.name) ||
                    covidData.get(feature.properties.iso_a3)
                if (corrData) {
                    return { ...feature, timeline: { ...corrData } }
                } else {
                    return feature;
                }
            })
            return { ...mapData, features: theFeatures };
        }
        return null;
    }, [historicalData, mapData])

    return parsedHistoricalData
}
