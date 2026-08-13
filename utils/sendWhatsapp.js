require("dotenv").config();
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const TEMPLATE_ID_TEST = process.env.TWILIO_TEMPLATE_ID_TEST;
const TEMPLATE_ID_ORDER_CREATED =
  process.env.TWILIO_ORDER_CREATED_CODE_TEMPLATE_ID;
const TEMPLATE_ID_ORDER_READY =
  process.env.TWILIO_LAUNDRY_READY_PICKUP_TEMPLATE_ID;

const FROM_NUMBER = "whatsapp:+14155238886"; //trial number
// const FROM_NUMBER = "whatsapp:+16692821625";

const createMessage = async () => {
  const message = await client.messages.create({
    // contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentSid: TEMPLATE_ID_TEST,
    contentVariables: JSON.stringify({ 1: "kelechi", 2: "ORD-0R3T5C" }),
    from: FROM_NUMBER,
    to: "whatsapp:+2349169208398",
  });

  console.log(message.body);
};

const createMessageOrderCreated = async () => {
  const message = await client.messages.create({
    // contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentSid: TEMPLATE_ID_ORDER_CREATED,
    contentVariables: JSON.stringify({ 1: "kelechi", 2: "ORD-0R3T5C" }),
    from: FROM_NUMBER,
    to: "whatsapp:+2349169208398",
  });

  console.log(message.body);
};

const createMessageOrderReady = async () => {
  const message = await client.messages.create({
    // contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentSid: TEMPLATE_ID_ORDER_READY,
    contentVariables: JSON.stringify({ 1: "kelechi", 2: "ORD-0R3T5C" }),
    from: FROM_NUMBER,
    to: "whatsapp:+2349169208398",
  });

  console.log(message.body);
};

createMessage();
