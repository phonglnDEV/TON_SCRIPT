import axios from "axios";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function sendRequest(index) {
    try {

    const apiUrl = "https://toncenter-proxy.phongle.workers.dev/api/v3/transactionsByMessage?msg_hash=JWLp4c%2BDTML6qHysZxk8YpV6zugS%2Fwsti%2F%2FPi3BPYFw%3D&limit=10&offset=0"
      const response = await axios.get(apiUrl);
      console.log("RES: ", response.status);
    } catch (error) {
      console.error(`Request ${index} failed: ${error}`);
    }
  }

async function stressTest(){
    console.log("START STRESS TEST");
    for (let i = 0; i < 20; i++) {
      sendRequest(i);
    // await delay(10000);
    }
}

stressTest();

  