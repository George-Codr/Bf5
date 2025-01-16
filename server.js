const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Helper to fetch external data
async function req(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
    return await response.text();
  } catch (error) {
    throw new Error("Network Error");
  }
}

// Check tool control
async function checkToolControl() {
  const data = await req(process.env.TOOL_CONTROL_URL);
  if (data.trim() !== "ON") {
    return { status: "OFF" };
  }
  return { status: "ON" };
}

// Check user status
async function checkStatus() {
  const data = await req(process.env.STATUS_URL);
  const trimmedData = data.trim();
  if (trimmedData === "TRIAL" || trimmedData === "PAID") {
    return { status: trimmedData };
  }
  throw new Error("Invalid status from server.");
}

// Check if the key is blocked
async function checkBlock(key) {
  const data = await req(process.env.BLOCK_URL);
  if (data.includes(key)) {
    return { status: "BLOCKED" };
  }
  return { status: "NOT_BLOCKED" };
}

// Check if the key is approved
async function checkApproval(key) {
  const data = await req(process.env.APPROVAL_URL);
  if (!data.includes(key)) {
    return { status: "NONE" }; // Not approved
  }
  return { status: "APPROVED" };
}

// Execute custom functionality
function executeCustomFunctionality() {
  return { message: "ACTIVE" };
}

// API endpoint
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

    // All checks passed, execute functionality
    const response = executeCustomFunctionality();
    res.status(200).json(response);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
