import amqp, { type Channel } from "amqplib";

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const ch = await conn.createChannel();
  const qu = await ch.assertQueue(queueName, {
    durable: queueType == SimpleQueueType.Durable,
    autoDelete: queueType == SimpleQueueType.Transient,
    exclusive: queueType == SimpleQueueType.Transient,
  });
  await ch.bindQueue(qu.queue, exchange, key);
  return [ch, qu];
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const [ch, qu] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );
  await ch.consume(qu.queue, (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
      try {
        const content = msg.content.toString();
        const data = JSON.parse(content) as T;
        handler(data);
      } catch (err) {
        console.error("Error processing message:", err);
      } finally {
        ch.ack(msg);
      }
    }
    return;
  });
}
