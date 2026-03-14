Overview
Welcome to the NinBvnPortal API. Our RESTful API provides secure and reliable access to NIN and BVN verification services.

Key Features
Real-time NIN and BVN verification
Multiple search methods (Number, Phone, Demographics)
Secure API key authentication
JSON request and response format
Comprehensive error handling
Wallet-based billing system
Important Notice
All API requests require user consent. You must include "consent": true in all verification requests. This ensures compliance with data protection regulations.

Authentication
All API requests must be authenticated using an API key. Include your API key in the request headers using one of the following methods:

Method 1: x-api-key Header
Copy
x-api-key: YOUR_API_KEY_HERE
Method 2: Authorization Bearer
Copy
Authorization: Bearer YOUR_API_KEY_HERE
How to Get Your API Key
Register an account on our platform
Login to your dashboard
Navigate to API Settings
Generate your API key
Fund your wallet to start making requests
Base URL
All API requests should be made to:

Copy
https://ninbvnportal.com.ng/api
Request Format
All requests must be sent using the POST method with Content-Type: application/json.

Required Headers
Copy
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE
Request Body Structure
Copy
{
    "number": "12345678901",
    "consent": true
}
Consent Requirement
The "consent": true field is mandatory for all verification requests. Requests without this field will be rejected with a 400 error.

Response Format
All API responses are returned in JSON format with the following structure:

Successful Response
Copy
{
    "status": "success",
    "reportID": "280325-31AA4C4B87DC7A",
    "message": "ID Verified Successfully",
    "data": {
        "firstname": "EXAMPLE_FIRSTNAME",
        "middlename": "EXAMPLE_MIDDLENAME",
        "surname": "EXAMPLE_SURNAME",
        "telephoneno": "08012345678",
        "residence_state": "EXAMPLE_RESIDENT_STATE",
        "residence_town": "EXAMPLE_TOWN",
        "residence_address": "EXAMPLE_ADDRESS",
        "residence_lga": "EXAMPLE_LGA",
        "birthcountry": "EXAMPLE_COUNTRY",
        "birthstate": "EXAMPLE_STATE",
        "birthlga": "EXAMPLE_LGA",
        "gender": "EXAMPLE_GENDER",
        "nin": "12345678901",
        "birthdate": "1990-01-01",
        "photo": "EXAMPLE_BASE64_IMAGE_STRING"
    }
}
Error Response
Copy
{
    "status": "error",
    "message": "Invalid NIN format. NIN must be exactly 11 digits",
    "code": 400
}
API Endpoints
Available endpoints for verification services:

Endpoint	Method	Description	Price From
/api/nin-verification	POST	Verify NIN by number	₦150
/api/nin-phone	POST	Search NIN by phone number	₦200
/api/nin-tracking ID	POST	Search NIN by tracking ID	₦200
/api/bvn-verification	POST	Verify BVN by number	₦100
/api/bvn-phone	POST	Search BVN by phone number	₦150
/api/balance	GET	Check account balance	Free
NIN Verification
POST
Verify a National Identity Number (NIN) and retrieve associated personal information.

Endpoint
Copy
POST https://ninbvnportal.com.ng/api/nin-verification
Request Body
Copy
{
    "nin": "12345678901",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/nin-verification \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "nin": "12345678901",
    "consent": true
  }'

JavaScript Example
Copy
fetch('https://ninbvnportal.com.ng/api/nin-verification', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY_HERE'
    },
    body: JSON.stringify({
        nin: '12345678901',
        consent: true
    })
})
.then(response => response.json())
.then(data => {
    console.log('Success:', data);
})
.catch((error) => {
    console.error('Error:', error);
});
Successful Response
Copy
{
    "status": "success",
    "reportID": "NIN_251021154942_59E172",
    "message": "NIN Verified Successfully",
    "data": {
        "firstname": "JOHN",
        "middlename": "OLUMIDE",
        "surname": "ADEBAYO",
        "telephoneno": "08012345678",
        "residence_state": "LAGOS",
        "residence_town": "IKEJA",
        "residence_address": "15 ALLEN AVENUE",
        "residence_lga": "IKEJA",
        "birthcountry": "NIGERIA",
        "birthstate": "OGUN",
        "birthlga": "ABEOKUTA NORTH",
        "gender": "MALE",
        "nin": "12345678901",
        "birthdate": "1990-05-15",
        "photo": "data:image/jpeg;base64,/9j/4AAQSkZJ..."
    }
}
NIN Phone Search
POST
Search for NIN information using a phone number.

Endpoint
Copy
POST https://ninbvnportal.com.ng/api/nin-phone
Request Body
Copy
{
    "phone": "08012345678",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/nin-phone \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "phone": "08012345678",
    "consent": true
  }'
NIN Tracking
POST
Search for NIN information using a tracking ID.

Request Body
Copy
{
    "tracking_id": "7Y0OG2ZO003KUPG",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/nin-tracking \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "tracking_id": "7Y0OG2ZO003KUPG",
    "consent": true
  }'
NIN Demography Search
POST
Search for NIN information using demographic data.

Request Body
Copy
{
    "firstname": "JOHN",
    "lastname": "ADEBAYO",
    "gender": "male",
    "dob": "1990-05-15",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/nin-demography \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "firstname": "JOHN",
    "lastname": "ADEBAYO", 
    "gender": "male",
    "dob": "1990-05-15",
    "consent": true
  }'
BVN Verification
POST
Verify a Bank Verification Number (BVN) and retrieve associated information.

Request Body
Copy
{
    "bvn": "22350591353",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/bvn-verification \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "bvn": "22350591353",
    "consent": true
  }'
Successful Response
Copy
{
    "status": "success",
    "reportID": "BVN_251019185403_3A7269",
    "message": "BVN Verified Successfully",
    "data": {
        "firstname": "JOHN",
        "middlename": "OLUMIDE", 
        "lastname": "ADEBAYO",
        "phone": "08012345678",
        "email": "john.adebayo@email.com",
        "bvn": "22350591353",
        "dob": "15-May-90",
        "gender": "Male",
        "state_of_origin": "Ogun",
        "state_of_residence": "Lagos",
        "nationality": "Nigerian",
        "photo": "data:image/jpeg;base64,/9j/4AAQSkZJ..."
    }
}
BVN Phone Search
POST
Search for BVN information using a phone number.

Request Body
Copy
{
    "phone": "08012345678",
    "consent": true
}
cURL Example
Copy
curl -X POST https://ninbvnportal.com.ng/api/bvn-phone \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "phone": "08012345678",
    "consent": true
  }'
Account Balance
GET
Check your account balance and API usage statistics.

Endpoint
Copy
GET https://ninbvnportal.com.ng/api/balance
cURL Example
Copy
curl -X GET https://ninbvnportal.com.ng/api/balance \
  -H "x-api-key: YOUR_API_KEY_HERE"
Successful Response
Copy
{
    "status": "success",
    "reportID": null,
    "message": "Balance retrieved successfully",
    "data": {
        "user_id": 123,
        "username": "john_doe",
        "balance": 5000.00,
        "formatted_balance": "₦5,000.00",
        "user_type": "regular",
        "api_requests_today": 25,
        "api_limit": 1000
    }
}
Error Codes
The API uses standard HTTP status codes to indicate the success or failure of requests:

Status Code	Meaning	Description
200	OK	Request successful
400	Bad Request	Invalid request format or missing required fields
401	Unauthorized	Invalid or missing API key
403	Forbidden	API access disabled or insufficient permissions
405	Method Not Allowed	HTTP method not supported for this endpoint
429	Too Many Requests	Daily request limit exceeded
500	Internal Server Error	Server error occurred
503	Service Unavailable	Service temporarily unavailable
Common Error Examples
Missing Consent
Copy
{
    "status": "error",
    "message": "Consent is required. Please include \"consent\": true in your request",
    "code": 400
}
Invalid API Key
Copy
{
    "status": "error",
    "message": "Invalid API key",
    "code": 401
}
Insufficient Balance
Copy
{
    "status": "error",
    "message": "Insufficient wallet balance",
    "code": 400
}



