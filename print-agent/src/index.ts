import "./config";
import { startJobQueue } from "./jobQueue";
import { startHeartbeat } from "./heartbeat";
import { startSettingsSync } from "./settingsSync";

console.log("BRIN Print Agent — جارِ التشغيل...");

startSettingsSync();
startHeartbeat();
startJobQueue();

console.log("BRIN Print Agent — جاهز، بانتظار مهام الطباعة");
