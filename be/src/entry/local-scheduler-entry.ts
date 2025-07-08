import { handler } from "./handler";

const bodyString = process.argv[2];
const body = JSON.parse(bodyString) as { type: string; body: string };

await handler({
  from: "eventBridgeScheduler",
  type: body.type,
  body: bodyString,
});
