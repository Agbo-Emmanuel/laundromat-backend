const { MessagingResponse } = require("twilio").twiml;

exports.handleWhatsapp = async (req, res) => {
  const twiml = new MessagingResponse();
  twiml.message("Hello from agborex!");
  //   res.writeHead(200, { "Content-Type": "text/xml" });
  //   res.end(twiml.toString());
  res.type("text/xml").send(twiml.toString());
};
