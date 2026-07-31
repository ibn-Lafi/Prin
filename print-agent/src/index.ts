import "./config";
import { startJobQueue } from "./jobQueue";
import { startHeartbeat } from "./heartbeat";

console.log("BRIN Print Agent — جارِ التشغيل...");

startHeartbeat();
startJobQueue();

console.log("BRIN Print Agent — جاهز، بانتظار مهام الطباعة");
