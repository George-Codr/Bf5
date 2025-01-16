const express = require('express');
const fetch = require('node-fetch'); // Install using `npm install node-fetch`

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000

async function req(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
    return await response.text();
  } catch (error) {
    throw new Error("Network Error");
  }
}

async function checkToolControl() {
  const data = await req("https://pastebin.com/raw/uNQge8Lu");
  if (data.trim() !== "ON") {
    return { message: "OFF" };
  }
  return { status: "ON" }; // Indicates tool is active
}

async function checkStatus() {
  const data = await req("https://pastebin.com/raw/v8ptC8RQ");
  const trimmedData = data.trim();
  if (trimmedData === "TRIAL" || trimmedData === "PAID") {
    return { message: trimmedData }; // Returns user status
  }
  throw new Error("Invalid status from server.");
}

async function checkBlock(key) {
  const data = await req("https://pastebin.com/raw/wu9Byz5J");
  if (data.includes(key)) {
    return { message: "BLOCKED" };
  }
  return { message: "NOT_BLOCKED" }; // Indicates key is not blocked
}

async function checkApproval(key) {
  const data = await req("https://pastebin.com/raw/nvRvibB4");
  if (!data.includes(key)) {
    return { message: "NONE" }; // Indicates no approval
  }
  return { status: "APPROVED" }; // Indicates approval for key
}

function executeCustomFunctionality() {
  // Add your custom functionality here
  return { message: "ACTIVE" };
}

// Define API endpoint
app.get('/api', async (req, res) => {
  try {
    const key = req.query.key || "";
    if (!key) {
      return res.status(400).json({ error: "Key is required." });
    }

    // Step 1: Check tool control
    const toolControl = await checkToolControl();
    if (toolControl.status === "OFF") return res.status(200).json(toolControl);

    // Step 2: Check status
    const status = await checkStatus();

    // Step 3: Check if key is blocked
    const blockStatus = await checkBlock(key);
    if (blockStatus.status === "BLOCKED") return res.status(200).json(blockStatus);

    // Step 4: Check approval for paid users
    if (status.status === "PAID") {
      const approvalStatus = await checkApproval(key);
      if (approvalStatus.status === "NONE") return res.status(200).json(approvalStatus);
    }

    // If all checks pass, execute functionality
    const response = executeCustomFunctionality();
    res.status(200).json(response);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});{
