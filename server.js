const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Helper to fetch external data with error logging
async function req(url) {
  try {
    console.log(`Attempting to fetch from URL: ${url}`);  // Log the URL being requested
    const response = await fetch(url);
    
    // Check for a successful response
    if (!response.ok) {
      console.error(`Failed to fetch from ${url}: Status code ${response.status}`); // Log failure
      throw new Error(`Failed to fetch data from ${url}`);
    }
    
    // Return response text if successful
    return await response.text();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);  // Log full error message
    throw new Error("Network Error");
  }
}

// Check tool control status
async function checkToolControl() {
  const data = await req('https://pastebin.com/raw/uNQge8Lu');
  if (data.trim() !== "ON") {
    return { status: "OFF" };
  }
  return { status: "ON" };
}

// Check user status
async function checkStatus() {
  const data = await req('https://pastebin.com/raw/v8ptC8RQ');
  const trimmedData = data.trim();
  if (trimmedData === "TRIAL" || trimmedData === "PAID") {
    return { status: trimmedData };
  }
  throw new Error("Invalid status from server.");
}

// Check if the key is blocked
async function checkBlock(key) {
  const data = await req('https://pastebin.com/raw/wu9Byz5J');
  if (data.includes(key)) {
    return { status: "BLOCKED" };
  }
  return { status: "NOT_BLOCKED" };
}

// Check if the key is approved
async function checkApproval(key) {
  const data = await req('https://pastebin.com/raw/nvRvibB4');
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
    console.error("Error in /api endpoint:", error);  // Log full error details
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
