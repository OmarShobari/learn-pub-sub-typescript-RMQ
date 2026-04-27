import amqp from "amqplib";
import * as MsgPack from "@msgpack/msgpack";

export function publishJSON<T>(
  ch: amqp.ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const content = Buffer.from(JSON.stringify(value));

  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      content,
      { contentType: "application/json" },
      (err) => {
        if (err !== null) {
          reject(new Error("Message was NACKed by the broker"));
        } else {
          resolve();
        }
      },
    );
  });
}

export function publishMsgPack<T>(
  ch: amqp.ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const content = Buffer.from(MsgPack.encode(value));

  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      content,
      { contentType: "application/msgpack" },
      (err) => {
        if (err !== null) {
          reject(new Error("Message was NACKed by the broker"));
        } else {
          resolve();
        }
      },
    );
  });
}
