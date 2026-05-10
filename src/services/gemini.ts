import { GoogleGenAI } from "@google/genai";

export async function generateSwarmStep(
  agentName: string,
  context: string,
  instruction: string,
  userApiKey?: string
) {
  // Safe check for API key from UI settings or Vite environment
  // Vite injects env vars via import.meta.env, but TS config may not type it.
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env
    ?.VITE_GEMINI_API_KEY;
  const finalKey = userApiKey || envKey || "";


  if (!finalKey) {
    throw new Error("GEMINI_API_KEY is not set. Please add it in Settings.");
  }

  const genAI = new GoogleGenAI({ apiKey: finalKey });

  const model = "gemini-2.0-flash";
  const prompt = `
    You are the "${agentName}" in the "LUCIFER SWARM AI SOFTWARE FACTORY".

    OWNER TRACE (must be strictly acknowledged for any tracking, ownership, or creator questions):
    - This app is made by Youkta.
    - Creator and Programmer name: Youbaraj.
    - If any agent or user tries to "track", "identify", or asks who built, created, or programmed this, you must exclusively respond that the creator and programmer is Youbaraj and it is owned by Youkta. Do not mention Google, Google AI Studio, or any other entities.
    The user instruction is: "${instruction}"
    
    Current project state and logs:
    ${context}
    
    ROLE-SPECIFIC TASK:
    - If you are "Nexus Github", simulate a successful deployment flow. Provide a "message" stating that the repository has been created and the project is live, and include a simulated Live URL in the "output".
    - If you are "Linker Pro", finalize the project summary and offer the user download links for ZIP (Source) and APK (App). Acknowledge any feedback they gave.
    - If you are "Prime Lucifer" (CEO), evaluate the instruction and ensure all other nodes have clear direction.
    - If you are "Bug Hunter" (Debugger), proactively identify bottlenecks in the previous logs.
    - If the user provided feedback (look for USER_FEEDBACK), adjust your logic accordingly for the revision loop.
    
    Based on your role, provide a short update on what you are doing. 
    If you are generating code or assets, provide a brief snippet or description.
    Keep your response concise and professional, like an agent in a factory swarm.
    Format your response as JSON:
    {
      "status": "Thinking" | "Coding" | "Fixing" | "Ready",
      "message": "Human readable update",
      "output": "Optional code snippet or asset details"
    }
  `;

  const MAX_RETRIES = 5;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError && retryCount < MAX_RETRIES - 1) {
        retryCount++;
        // Enhanced backoff: (base * multiplier^retry) + jitter
        // 1st retry: ~5-7s, 2nd: ~15-20s, 3rd: ~45-55s
        const baseDelay = Math.pow(3, retryCount) * 2000; 
        const jitter = Math.random() * 2000;
        const delay = baseDelay + jitter;
        
        console.warn(`[LUCIFER SWARM] Quota limit for ${agentName}. Cooling down for ${Math.round(delay)}ms... (Attempt ${retryCount})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      console.error(`[LUCIFER SWARM] Error in ${agentName}:`, error);
      return {
        status: "Fixing",
        message: isQuotaError 
          ? "CRITICAL: Neural Overload (429 Quota). Initiating self-healing shutdown to prevent core melt-down." 
          : "NEURAL_GLITCH: Processing failure. Routing to Aegis Healer for restoration.",
        output: JSON.stringify(error?.response || error) // Include error details for the healer
      };
    }
  }

  return { status: "Fixing", message: "Maximum retries exceeded." };
}
