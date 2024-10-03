import axios from 'axios';
import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';
import pLimit from 'p-limit';

dotenv.config();

const RPS = Number(process.env.RPS) || 100;  
const TOTAL_ACCOUNTS = Number(process.env.ACCOUNTS) || 1000;
const API_URL = process.env.API_URL || 'https://ton-rpc.subwallet.app/getAddressBalance?address=';
const ACCOUNT_SOURCE = process.env.ACCOUNT_SOURCE || './accounts.txt'; 
const limit = pLimit(RPS);

function formatToNineDecimals(number) {
  return Math.floor(number * 1e9) / 1e9;
}

async function sendRequest(index, accountAddress) {
  try {
    const response = await axios.get(`${API_URL}${accountAddress}`);
    if(response.status != 200) {
        console.log(response.statusText);
      }
  //   else{
  //   const balance = formatToNineDecimals(response.data.result / 1e9);
  //   console.log(`Request #${index} - Account: ${accountAddress}, Balance: ${balance}`);
  // }
  } catch (error) {
    console.error(`Request #${index} failed: ${error}`);
  }
}

async function processBatch(batchAccounts, batchNumber) {
  console.log(`Processing batch #${batchNumber}`);
  const promises = batchAccounts.map((account, index) =>
    limit(() => sendRequest(index, account))
  );
  await Promise.all(promises);
  console.log(`Batch #${batchNumber} processed.`);
}

async function startStressTest() {
  console.log("Starting stress test...");

  const fileStream = fs.createReadStream(ACCOUNT_SOURCE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const accountAddresses = [];
  let lineCount = 0;

  for await (const accountAddress of rl) {
    accountAddresses.push(accountAddress);
    lineCount++;
    
    if (lineCount >= TOTAL_ACCOUNTS) {
      break;
    }
  }

  const totalAccounts = accountAddresses.length;
  console.log(`Total accounts loaded: ${totalAccounts}`);

  let currentIndex = 0;
  const interval = setInterval(async () => {
    if (currentIndex < totalAccounts) {
      const batchAccounts = accountAddresses.slice(currentIndex, currentIndex + RPS);
      await processBatch(batchAccounts, Math.floor(currentIndex / RPS) + 1);
      currentIndex += RPS;
    } else {
      clearInterval(interval);
      console.log("Stress test completed.");
    }
  }, 1000); 
}

startStressTest().catch((error) => {
  console.error("Error during stress test:", error);
});
