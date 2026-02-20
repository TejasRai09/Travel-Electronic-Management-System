import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Employee, TravelRequest, User } from '../models.js';
import { verifyToken, type AuthenticatedRequest } from '../jwt.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const expertRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_PATH = path.resolve(__dirname, '../../1.pdf');

let cachedPdfText: string | null = null;

async function getPdfContent(): Promise<string> {
  if (cachedPdfText) return cachedPdfText;

  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found at ${PDF_PATH}`);
    return '';
  }

  try {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(dataBuffer);
    cachedPdfText = data.text || '';
    return cachedPdfText || '';
  } catch (err) {
    console.error('Error parsing PDF:', err);
    return '';
  }
}

// Initialize Gemini with the standard SDK (Lazy init to ensure env vars are loaded)
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing in environment variables.');
    throw new Error('API Key missing');
  }
  return new GoogleGenerativeAI(apiKey);
};

const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

function normalizeHistory(history: unknown) {
  const source = Array.isArray(history) ? history : [];
  const mapped = source
    .map((msg: any) => ({
      role: msg?.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(msg?.content || '') }],
    }))
    .filter((msg) => msg.parts[0].text.trim().length > 0);

  if (mapped.length > 0 && mapped[0].role === 'model') {
    mapped.shift();
  }

  return mapped;
}

async function generateReplyWithFallback(
  genAI: GoogleGenerativeAI,
  systemInstruction: string,
  history: unknown,
  message: string
) {
  const chatHistory = normalizeHistory(history);
  let lastError: unknown = null;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: any) {
      lastError = error;
      const status = Number(error?.status || 0);
      const messageText = String(error?.message || '');
      const isModelNotFound = status === 404 || /not found|models\//i.test(messageText);
      if (!isModelNotFound) {
        throw error;
      }
    }
  }

  throw lastError || new Error('No compatible Gemini model found for this API key.');
}

function extractJsonObject(text: string) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] || raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

expertRouter.post('/chat', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user!.userId;
    const userEmail = String(req.user?.email || '').trim().toLowerCase();

    // Initialize AI per request to ensure env vars are ready
    const genAI = getGenAI();

    // 1. Get Travel Policy
    const policyText = await getPdfContent();
    if (!policyText) {
      return res.status(500).json({ ok: false, error: 'Travel Policy document not available.' });
    }

    // 2. Get User Context (Employee master + account + own travel tickets)
    const [user, employee] = await Promise.all([
      User.findById(userId),
      userEmail ? Employee.findOne({ email: userEmail }) : null,
    ]);

    const travelRequests = await TravelRequest.find({
      $or: [
        { userId },
        ...(userEmail ? [{ originatorEmail: userEmail }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Format travel history carefully
    const requestSummary = travelRequests.map(r => 
      `- Trip ID: ${r.uniqueId}
       From: ${r.origin}, To: ${r.destination}
       Date: ${r.travelDate ? new Date(r.travelDate).toLocaleDateString() : 'N/A'}
       Status: ${r.status}
       Purpose: ${r.purpose}
       Mode: ${r.mode}`
    ).join('\n\n');

    const userContext = `
      EMPLOYEE DETAILS (LOGGED-IN USER ONLY):
      Name: ${employee?.employeeName || user?.profile?.fullName || 'Employee'}
      Email: ${employee?.email || userEmail || user?.email || 'Unknown'}
      Employee Number: ${employee?.employeeNumber || user?.profile?.employeeId || 'Unknown'}
      Designation: ${employee?.designation || 'Unknown'}
      Department: ${user?.profile?.department || employee?.designation || 'Unknown'}
      Phone: ${employee?.phone || user?.profile?.phone || 'Unknown'}
      Manager Email: ${employee?.managerEmail || user?.profile?.managerEmail || 'Unknown'}
      Manager Number: ${employee?.managerEmployeeNo || 'Unknown'}
      Manager Name: ${employee?.managerEmployeeName || 'Unknown'}
      Impact Level: ${employee?.impactLevel || 'Unknown'}

      TRAVEL TICKETS RAISED BY THIS EMPLOYEE (${travelRequests.length} found, latest first):
      ${requestSummary || 'No travel history found for this employee.'}
    `;

    // 3. Construct System Instruction
    const systemPrompt = `
      You are the "Zuari Travel Expert", an intelligent assistant for Zuari Industries employees.
      
      CORE RESPONSIBILITIES:
      1. Answer questions strictly based on the "TRAVEL POLICY" provided below.
      2. If the answer is not found in the policy, state: "I cannot find this information in the official travel policy."
      3. Assist the employee with their own travel history using the "USER DATA" provided below.
      
      TRAVEL POLICY:
      ${policyText}
      
      USER DATA (Use this only to answer questions about the specific user's trips):
      ${userContext}
      
      GUIDELINES:
      - Be professional, concise, and helpful.
      - Do not hallucinate rules.
      - If asking about specific trip details (e.g., "status of my last trip"), look at the RECENT TRAVEL REQUESTS.
      - Never provide another employee's data; use only this logged-in employee's details and tickets.
      - Always format responses in clean markdown using this template:
        ## Answer
        <2-4 line direct answer>
        ## Details
        - <key point 1>
        - <key point 2>
        - <key point 3>
      - If there are approvals/limits/conditions, add:
        ## Conditions
        - <condition 1>
        - <condition 2>
      - If answer is from policy, add:
        ## Source
        - Domestic Policy PDF
      - If answer is from employee data, add:
        ## Employee Context Used
        - <fields used from employee/tickets>
      - Avoid using all-caps text except headings.
    `;

    const responseText = await generateReplyWithFallback(
      genAI,
      systemPrompt,
      history,
      String(message || '')
    );

    res.json({ ok: true, reply: responseText });

  } catch (error) {
    console.error('Expert chat error:', error);
    res.status(500).json({ ok: false, error: 'Failed to process your request.' });
  }
});

expertRouter.post('/trip-draft', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const userEmail = String(req.user?.email || '').trim().toLowerCase();
    const genAI = getGenAI();

    const { history, message, currentDraft } = req.body as {
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      message?: string;
      currentDraft?: Record<string, unknown>;
    };

    const [user, employee] = await Promise.all([
      User.findById(userId),
      userEmail ? Employee.findOne({ email: userEmail }) : null,
    ]);

    const systemPrompt = `
You are an assistant that extracts travel request form fields from employee chat.

Return ONLY valid JSON object with this shape:
{
  "firstName": string | null,
  "middleName": string | null,
  "lastName": string | null,
  "passengerPhone": string | null,
  "tripNature": "One Way" | "Round Trip" | "Multicity" | null,
  "mode": "Flight" | "Train" | "Car" | null,
  "origin": string | null,
  "destination": string | null,
  "travelDate": string | null,
  "returnDate": string | null,
  "departureTimeSlot": string | null,
  "travelClass": string | null,
  "purpose": string | null,
  "accommodationRequired": boolean | null,
  "hotelPreference": string | null,
  "dietaryPreference": "Veg" | "Non-Veg" | "Jain" | "No Preference" | null,
  "specialInstructions": string | null,
  "missingQuestions": string[]
}

Rules:
1) Keep existing values from CURRENT_DRAFT unless new message clearly updates them.
2) Use EMPLOYEE defaults for name/phone where suitable.
3) Dates MUST be ISO yyyy-mm-dd when known.
4) If uncertain, return null for that field.
5) missingQuestions should contain 1-4 short next questions for required missing fields.
6) No markdown, no explanation, JSON only.
7) origin/destination must match one of these exactly when identifiable: Goa (GOI), Mumbai (BOM), Delhi (DEL), Bangalore (BLR), Pune (PNQ), Hyderabad (HYD), Chennai (MAA), Kolkata (CCU), Ahmedabad (AMD), Jaipur (JAI), Kochi (COK), Lucknow (LKO), Chandigarh (IXC), Indore (IDR), Nagpur (NAG).
8) departureTimeSlot must be one of: Before 6 AM, 6 AM to 12 PM, 12 PM to 6 PM, After 6 PM.

EMPLOYEE:
${JSON.stringify(
  {
    employeeName: employee?.employeeName || user?.profile?.fullName || null,
    phone: employee?.phone || user?.profile?.phone || null,
    email: employee?.email || userEmail || null,
    designation: employee?.designation || null,
    impactLevel: employee?.impactLevel || null,
  },
  null,
  2
)}

CURRENT_DRAFT:
${JSON.stringify(currentDraft || {}, null, 2)}

CHAT_HISTORY:
${JSON.stringify(history || [], null, 2)}
`;

    const modelOutput = await generateReplyWithFallback(
      genAI,
      systemPrompt,
      history || [],
      String(message || '')
    );

    const parsed = extractJsonObject(modelOutput) as Record<string, unknown>;
    res.json({ ok: true, draft: parsed });
  } catch (error) {
    console.error('Trip draft extraction error:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate trip draft.' });
  }
});
