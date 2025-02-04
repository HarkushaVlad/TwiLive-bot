import {captureStreamSegmentUsingStreamlink} from "./services/ffmpeg/capture";
import {botConfig} from "./config/config";

captureStreamSegmentUsingStreamlink(botConfig.STREAMER_USERNAME!)
    .then((res) => console.log(`GIF saved at: ${res}`))
    .catch((err) => console.error(`Error: ${err.message}`));
