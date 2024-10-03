import axios from "axios";
import fs from "fs";
import readline from "readline";
import dotenv from "dotenv";
import pLimit from "p-limit";

dotenv.config();

const limit = pLimit(Number(process.env.RPS));

function getNineDecimals(number) {
  return Math.floor(number * 1e9) / 1e9;
}

async function sendRequest(index, apiGetBalance) {
  try {
    const response = await axios.get(apiGetBalance);
    console.log("API: ", apiGetBalance);
    console.log(
      "BALANCE: ",
      getNineDecimals(response.data.result / 1000000000)
    );
  } catch (error) {
    console.error(`Request ${index} failed: ${error}`);
  }
}

async function stressTest(batchAccount) {
  const promises = [];
  for (let i = 0; i < batchAccount.length; i++) {
    promises.push(limit(() => sendRequest(i, batchAccount[i])));
  }
  await Promise.all(promises);
}

async function getAccount() {
  console.log("START STRESS TEST");
  const fileStream = fs.createReadStream(process.env.ACCOUNT_SOURCE);
  const apiGetBalance =
    "https://ton-rpc.subwallet.app/getAddressBalance?address=";
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  let breakBatch = 0;
  let batchAccounts = [];

  for await (const line of rl) {
    batchAccounts.push(apiGetBalance + line);
    breakBatch++;
    console.log("COUNT: ", breakBatch);

    if (breakBatch % process.env.RPS === 0) {
      await stressTest(batchAccounts);
      batchAccounts = [];
    }

    if (breakBatch == process.env.ACCOUNTS) break;
    
  }

  if (batchAccounts.length > 0) {
    console.log('Processing remaining batch...');
    await stressTest(batchAccounts);
  }
  console.log("Stress test completed.");
}

getAccount().catch((error) => {
  console.error("Error during stress test:", error);
});
