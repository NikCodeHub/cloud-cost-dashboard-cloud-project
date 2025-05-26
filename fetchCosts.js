const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const costExplorer = new AWS.CostExplorer({ region: "us-east-1" });

exports.handler = async () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  
  const format = (d) => d.toISOString().split("T")[0];
  const startDate = format(start);
  const endDate = format(today);

  const params = {
    TimePeriod: {
      Start: startDate,
      End: endDate,
    },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      {
        Type: "DIMENSION",
        Key: "SERVICE",
      },
    ],
  };

  try {
    const data = await costExplorer.getCostAndUsage(params).promise();
    const filename = `costs/${startDate}.json`;

    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: filename,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json"
    }).promise();

    console.log(`✅ Uploaded cost data to ${filename}`);
    return { statusCode: 200, body: "Success" };

  } catch (err) {
    console.error("❌ Error fetching or saving data:", err);
    return { statusCode: 500, body: "Error" };
  }
};
