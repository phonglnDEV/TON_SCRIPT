import axios from "axios";
import fs from "fs";
import readline from "readline";
import dotenv from 'dotenv';
import pLimit from "p-limit";

dotenv.config();

async function sendRequest(index, apiGetBalance){
  try {
    const response = await axios.get(apiGetBalance);
    console.log(`Balance: ${response.result}`);
  } catch (error) {
    console.error(`Request ${index} failed: ${error}`);
  }
}

async function stressTest(apiGetBalance) {
  const totalRequests = 20000;
  const timeLimit = 60 * 1000; 
  const interval = timeLimit / totalRequests; 

  for (let i = 0; i < totalRequests; i++) {
      setTimeout(() => {
          sendRequest(apiGetBalance, i);
      }, i * interval);
  }
}

async function getAccount() {
  let filePath = '../data/account'
  for(let i = 1; i <= 5; i ++){
    console.log("START DATA ACCOUNT: ", i);
    let dataAccount = filePath + i + '.txt';
    const fileStream = fs.createReadStream(dataAccount);
    const apiGetBalance = "https://abc-def.app/getAddressBalance?address="
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
  
    for await ( const line of rl) {
      console.log(`Address: ${line}`);
      stressTest(apiGetBalance + 'line')
    }
    console.log("DATA ACCOUNT " + i + "COMPLETE");
  }
  console.log("Stress test completed.");

}

getAccount();
