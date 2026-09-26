const handler = async (event) => {
  console.log("S3 ObjectCreated event received");

  console.log(JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda executed successfully",
    }),
  };
};

module.exports = {
  handler,
};
