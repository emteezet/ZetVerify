
NIN, NIN Phone,

Field code

Type

Value

ID Type

idType

string

nin

Id Number

idNumber

string





// sample of how the api will work from claude ai agaent


const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ─── Token Cache ──────────────────────────────────────────────────────────────
// The QoreID token expires every 2 hours (7200 seconds).
// We cache it in memory and refresh it 5 minutes before expiry.
let tokenCache = {
  accessToken: null,
  expiresAt: null, // Unix timestamp (ms)
};

const TOKEN_URL = "https://api.qoreid.com/token";
const NIN_BASE_URL = "https://api.qoreid.com/v1/ng/identities/nin-premium";
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const REFRESH_BUFFER_MS = 5 * 60 * 1000;     // refresh 5 minutes early

async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid
  if (tokenCache.accessToken && tokenCache.expiresAt && now < tokenCache.expiresAt - REFRESH_BUFFER_MS) {
    console.log("✅ Using cached token");
    return tokenCache.accessToken;
  }

  // Fetch a fresh token
  console.log("🔄 Fetching new token from QoreID...");
  const response = await axios.post(TOKEN_URL, {
    clientId: process.env.QOREID_CLIENT_ID,
    secret: process.env.QOREID_SECRET_KEY,
  });

  const { accessToken } = response.data;

  // Store in cache with expiry time
  tokenCache = {
    accessToken,
    expiresAt: now + TOKEN_EXPIRY_MS,
  };

  console.log("✅ New token cached, valid for 2 hours");
  return accessToken;
}

// ─── NIN Lookup Route ─────────────────────────────────────────────────────────
// POST /api/nin-lookup
// Body: { "nin": "12345678901" }

app.post("/api/nin-lookup", async (req, res) => {
  const { nin } = req.body;

  // Validate NIN (must be 11 digits)
  if (!nin || !/^\d{11}$/.test(nin)) {
    return res.status(400).json({
      success: false,
      message: "Invalid NIN. Please provide an 11-digit number.",
    });
  }

  try {
    // Step 1: Get a valid access token (cached or freshly fetched)
    const token = await getAccessToken();

    // Step 2: Call the QoreID NIN Premium endpoint
    const ninResponse = await axios.post(
      `${NIN_BASE_URL}/${nin}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = ninResponse.data;

    // Step 3: Return the user's details to your frontend
    return res.status(200).json({
      success: true,
      data: {
        nin: data.nin,
        firstname: data.firstname,
        middlename: data.middlename,
        lastname: data.lastname,
        phone: data.phone,
        gender: data.gender,
        birthdate: data.birthdate,
        address: data.address,
        photo: data.photo, // base64 image string (if available)
        status: data.status,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error?.response?.data || error.message);

    // If the token was rejected (401), clear cache so it refreshes next time
    if (error?.response?.status === 401) {
      tokenCache = { accessToken: null, expiresAt: null };
    }

    return res.status(error?.response?.status || 500).json({
      success: false,
      message: error?.response?.data?.message || "Something went wrong. Please try again.",
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "NIN Lookup API is running 🚀" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});