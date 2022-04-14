import axios from "axios";
export default axios.create({
    baseURL: `ipinfo.io/?token=${process.env.REACT_APP_IPINFO_KEY}`,
});
