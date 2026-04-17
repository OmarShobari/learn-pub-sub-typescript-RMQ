import amqp from "amqplib";
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
  printQuit,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

async function main() {
  console.log("Starting Peril client...");
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril game client connected to RabbitMQ!");

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log("RabbitMQ connection closed.");
      } catch (err) {
        console.error("Error closing RabbitMQ connection:", err);
      } finally {
        process.exit(0);
      }
    }),
  );

  const username = await clientWelcome().catch((err) => {
    console.error("Error during client welcome:", err);
    process.exit(1);
  });

  declareAndBind(
    conn,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );

  const gameState = new GameState(username);

  while (true) {
    const words = await getInput("> ");
    if (words.length === 0) {
      continue;
    }
    const command = words[0]!.toLowerCase();

    switch (command) {
      case "spawn":
        try {
          commandSpawn(gameState, words);
        } catch (err) {
          console.error(err instanceof Error ? err.message : err);
        }
        break;
      case "move":
        try {
          commandMove(gameState, words);
        } catch (err) {
          console.error(err instanceof Error ? err.message : err);
        }
        break;
      case "status":
        commandStatus(gameState);
        break;
      case "help":
        printClientHelp();
        break;
      case "quit":
        printQuit();
        process.exit(0);
      case "spam":
        console.log("Spamming not allowed yet!");
        break;
      default:
        console.error(`Unknown command: ${command}`);
        break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
