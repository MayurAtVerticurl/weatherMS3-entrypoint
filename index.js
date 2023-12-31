const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const axios = require("axios");
const https = require("https");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json()); //accepting only json data
// app.use(express.urlencoded());  //accept url encoded data

const ms1URL =
  `${process.env.ms1URL}/getWeatherData` ||
  `http://3.87.12.65:3001/getWeatherData` ||
  `http://selfassuredmiserablerectangles--mayurrajan.repl.co/getWeatherData`;
const ms2URL =
  `${process.env.ms2URL}/getAiReport` ||
  `http://3.87.12.65:3002/getAiReport` ||
  `https://sociablewhirlwindmicrostation--mayurrajan.repl.co/getAiReport`;

app.get("/", (req, res) => {
  res.json({
    up: "1",
  });
  // res.json(
  //   {
  //     temperature: 26.88,
  //     condition: 'Haze',
  //     location: 'Periyanayakkanpalaiyam',
  //     pressure: 1015,
  //     humidity: 69,
  //     sunset: 1701087960,
  //     sunrise: 1701046400,
  //     gpt: 'The weather risk level in Periyanayakkanpalaiyam is relatively low with only haze as the main weather condition. However, visibility is reduced to 5000 meters, posing some risk while moving around.'
  //   }
  // )
});

app.get("/getWeatherReport", async (req, res, next) => {
  try {
    // Extract latitude and longitude from request parameters
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Latitude and longitude are required in the request parameters.",
      });
    }

    // console.log("starting");
    const response1 = await axios.get(ms1URL, {
      params: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
    });

    // console.log("response from 1 got", response1.data);

    // Check if the response is in the expected format
    if (
      !response1.data.main ||
      !response1.data.weather ||
      !response1.data.name
    ) {
      throw new Error("Invalid response format from ms1URL");
    }

    const ms1DATA = response1.data;

    const response2 = await axios.get(ms2URL, {
      params: {
        data: JSON.stringify(ms1DATA),
      },
    });

    const ms2DATA = response2.data;
    // console.log("ms1DATA", ms1DATA);
    // console.log("ms2DATA", ms2DATA);

    const output = {
      temperature: ms1DATA.main.temp,
      condition: ms1DATA.weather[0].main,
      location: ms1DATA.name,
      pressure: ms1DATA.main.pressure,
      humidity: ms1DATA.main.humidity,
      sunset: ms1DATA.sys.sunset,
      sunrise: ms1DATA.sys.sunrise,
      gpt: ms2DATA.gpt,
    };

    res.json(output);
    return;
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    error: "something went wrong",
    stack: error.stack,
  });
});

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
