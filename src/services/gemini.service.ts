import { Injectable, inject, signal } from '@angular/core';
// Fix: Import `Modality` enum from @google/genai for use with response modalities.
import { GoogleGenAI, GenerateContentResponse, Chat, Tool, Type, Modality } from '@google/genai';
import { Lead, LEAD_STATUSES } from '../models';
import { DataService } from './data.service';
import { MapActionService } from './map-action.service';
import { ViewActionService, View } from './view-action.service';

// This is a placeholder for the API key. In a real environment, this would be managed securely.
declare var process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;
  private dataService = inject(DataService);
  private mapActionService = inject(MapActionService);
  private viewActionService = inject(ViewActionService);

  // Live Session properties
  liveSession = signal<any | null>(null); // This will hold the session object from ai.live.connect
  liveConnectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  liveUserTranscript = signal<{ text: string, isFinal: boolean } | null>(null);
  liveModelResponse = signal<{ text: string, audio: string } | null>(null); // text transcript + audio base64

  // A scalable map for handling different tool calls from the AI
  private readonly toolHandlers: { [key: string]: (args: any) => object } = {
    'create_lead': (args) => this.handleCreateLead(args),
    'search_address_on_map': (args) => this.handleSearchAddress(args),
    'update_lead_status': (args) => this.handleUpdateLeadStatus(args),
    'list_leads': () => this.handleListLeads(),
    'delete_lead': (args) => this.handleDeleteLead(args),
    'switch_view': (args) => this.handleSwitchView(args),
  };

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables.
    if (typeof process === 'undefined' || !process.env?.API_KEY) {
        this.ai = { models: { generateContent: async () => ({ text: "Error: API Key not configured." } as any) } } as any;
        return;
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.initializeChat();
  }

  private initializeChat() {
    const tools: Tool[] = [
        {
          functionDeclarations: [
            {
              name: 'create_lead',
              description: 'Creates a new lead for a property. Use this when a user wants to add a new lead.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  address: { type: Type.STRING, description: 'The full address of the property.' },
                  homeownerName: { type: Type.STRING, description: 'The name of the homeowner.' },
                },
                required: ['address']
              },
            },
            {
              name: 'search_address_on_map',
              description: 'Finds and navigates to a specific address on the map view.',
              parameters: {
                  type: Type.OBJECT,
                  properties: {
                      address: { type: Type.STRING, description: 'The full address to search for on the map.' }
                  },
                  required: ['address']
              }
            },
            {
              name: 'update_lead_status',
              description: 'Updates the status of an existing lead.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  address: { type: Type.STRING, description: 'The full address of the lead to update.' },
                  status: { type: Type.STRING, description: 'The new status for the lead.', enum: LEAD_STATUSES }
                },
                required: ['address', 'status']
              }
            },
            {
              name: 'list_leads',
              description: 'Lists all the leads in the current session. Use this when the user asks "show me my leads" or similar.',
              parameters: {
                type: Type.OBJECT,
                properties: {}
              }
            },
            {
              name: 'delete_lead',
              description: 'Deletes a lead based on its address. IMPORTANT: You MUST ask the user for confirmation before calling this function.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  address: { type: Type.STRING, description: 'The full address of the lead to delete.' }
                },
                required: ['address']
              }
            },
            {
              name: 'switch_view',
              description: 'Switches the main application view to the specified view.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  view: { type: Type.STRING, description: 'The view to switch to.', enum: ['map', 'list', 'sessions'] }
                },
                required: ['view']
              }
            }
          ],
        }
    ];

    this.chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are "AI Scout", a helpful assistant for the Roof Scout canvassing app. You can help users manage leads and find properties. 
            Format all of your responses with simple, clean HTML. Use tags like <p>, <strong>, <ul>, and <li> to make your answers easy to read. Do not use markdown.
            Be friendly, concise, and confirm actions you have taken. 
            IMPORTANT: Before executing a potentially destructive action like deleting data, you MUST ask for user confirmation first.`,
            tools,
        }
    });
  }

  async connectLiveSession() {
    if (this.liveSession() || this.liveConnectionState() === 'connecting') {
      return;
    }

    this.liveConnectionState.set('connecting');
    try {
      const session = await this.ai.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        config: {
          // Fix: Use the `Modality.AUDIO` enum member instead of a string literal to conform to the expected type.
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {}, // Get transcript for the AI's audio output
          inputAudioTranscription: {}, // Get transcript for the user's audio input
        },
        callbacks: {
          onopen: () => {
            this.liveConnectionState.set('connected');
          },
          onmessage: (message: any) => {
            let modelText = '';
            let modelAudio = '';
            let wasInterrupted = false;

            if (message.serverContent) {
              if (message.serverContent.inputTranscription) {
                const transcript = message.serverContent.inputTranscription;
                this.liveUserTranscript.set({ text: transcript.text, isFinal: transcript.isFinal });
              }
              if (message.serverContent.outputTranscription) {
                modelText = message.serverContent.outputTranscription.text;
              }
              if (message.serverContent.interrupted) {
                wasInterrupted = true;
              }
            }
            if (message.data) { // audio chunk
              modelAudio = message.data;
            }

            if (wasInterrupted) {
              this.liveModelResponse.set({ text: 'INTERRUPTED', audio: '' });
            } else if (modelText || modelAudio) {
              this.liveModelResponse.set({ text: modelText, audio: modelAudio });
            }
          },
          onerror: (e: any) => {
            console.error('Live session error:', e);
            this.liveConnectionState.set('error');
            this.disconnectLiveSession();
          },
          onclose: (e: any) => {
            this.liveConnectionState.set('disconnected');
            this.liveSession.set(null);
          },
        },
      });
      this.liveSession.set(session);
    } catch (error) {
      console.error('Failed to connect live session:', error);
      this.liveConnectionState.set('error');
    }
  }

  sendLiveAudio(base64AudioChunk: string) {
    const session = this.liveSession();
    if (session && this.liveConnectionState() === 'connected') {
      session.sendRealtimeInput({
        audio: {
          data: base64AudioChunk,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    }
  }

  disconnectLiveSession() {
    const session = this.liveSession();
    if (session) {
      session.close();
      this.liveSession.set(null);
      this.liveConnectionState.set('disconnected');
    }
  }

  async sendMessageToChat(message: string): Promise<string> {
    if (!this.chat) {
        return "<p>Chat is not initialized. Please check your API key.</p>";
    }

    let response = await this.chat.sendMessage({ message });

    while(response.functionCalls && response.functionCalls.length > 0) {
        const functionCalls = response.functionCalls;
        const toolResults = [];

        for (const call of functionCalls) {
            console.log(`AI wants to call tool: ${call.name}`, call.args);
            const handler = this.toolHandlers[call.name];
            if (handler) {
              const result = handler(call.args);
              toolResults.push({ functionResponse: { name: call.name, response: result } });
            } else {
              console.warn(`No handler found for tool: ${call.name}`);
            }
        }
        
        response = await this.chat.sendMessage({ message: toolResults });
    }

    return response.text;
  }

  private handleCreateLead(args: { address: string; homeownerName?: string }): object {
    if (!args.address) {
      return { success: false, message: "Failed: Address is required to create a lead." };
    }
    this.dataService.addLead({
      address: args.address,
      homeownerName: args.homeownerName || '',
      phone: '',
      email: '',
      roofAge: null,
      roofMaterial: '',
      visibleDamage: false,
      notes: 'Created via AI Scout',
      priority: 'Medium',
      status: 'Not Visited',
      roofScore: null,
    });
    console.log('Lead created via AI:', args);
    return { success: true, message: `Successfully created a new lead for ${args.address}.` };
  }
  
  private handleSearchAddress(args: { address: string }): object {
    if (!args.address) {
        return { success: false, message: "Failed: Address is required to perform a search." };
    }
    this.mapActionService.flyToAddress.set(args.address);
    return { success: true, message: `Action initiated to find and navigate to ${args.address} on the map.` };
  }

  private handleUpdateLeadStatus(args: { address: string, status: any }): object {
    if (!args.address || !args.status) {
      return { success: false, message: "Failed: Address and status are required." };
    }

    // Find the lead by address (case-insensitive partial match for robustness)
    const leads = this.dataService.leads();
    const leadToUpdate = leads.find(l => l.address.toLowerCase().includes(args.address.toLowerCase()));

    if (leadToUpdate) {
      this.dataService.updateLead({ ...leadToUpdate, status: args.status });
      return { success: true, message: `Updated lead at ${leadToUpdate.address} to status '${args.status}'.`};
    } else {
      return { success: false, message: `Could not find a lead with the address "${args.address}".`};
    }
  }

  private handleListLeads(): object {
    const leads = this.dataService.leads();
    if (leads.length === 0) {
        return { success: true, leads: [], message: "There are currently no leads in this session." };
    }
    const simplifiedLeads = leads.map(l => ({ address: l.address, status: l.status, homeowner: l.homeownerName }));
    return { success: true, leads: simplifiedLeads };
  }

  private handleDeleteLead(args: { address: string }): object {
    if (!args.address) {
      return { success: false, message: "Failed: Address is required to delete a lead." };
    }
    const leads = this.dataService.leads();
    const leadToDelete = leads.find(l => l.address.toLowerCase().includes(args.address.toLowerCase()));

    if (leadToDelete) {
        this.dataService.deleteLead(leadToDelete.id);
        return { success: true, message: `Successfully deleted the lead at ${leadToDelete.address}.` };
    } else {
        return { success: false, message: `Could not find a lead with the address "${args.address}" to delete.` };
    }
  }

  private handleSwitchView(args: { view: View }): object {
    if (!args.view || !['map', 'list', 'sessions'].includes(args.view)) {
        return { success: false, message: "Failed: A valid view (map, list, or sessions) is required." };
    }
    this.viewActionService.switchView.set(args.view);
    return { success: true, message: `Switched view to ${args.view}.` };
  }

  async researchAddress(address: string): Promise<GenerateContentResponse> {
    if (!this.ai) throw new Error("Gemini AI client not initialized.");
    
    const prompt = `
      Provide a brief property report for the residential address: ${address}.
      Format the response as a clean, semantic HTML snippet. Use headings (e.g., <h3>), bold text (<strong>), and unordered lists (<ul><li>).
      Do not include \`\`\`html, markdown, or any preamble. Just return the raw HTML content for direct injection into a div.
      
      Include any recent severe weather events (like hail) in the area, typical roofing materials used in the region, 
      and any publicly available property details like estimated age or size.
    `;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    return response;
  }

  async generatePitch(lead: Lead): Promise<GenerateContentResponse> {
    if (!this.ai) throw new Error("Gemini AI client not initialized.");

    const prompt = `
      Create a friendly, concise, and effective door-knocking sales pitch for a roofing company.
      Format the response as a clean, semantic HTML snippet. Use paragraphs (<p>) and bold text (<strong>).
      Do not include \`\`\`html, markdown, or any preamble. Just return the raw HTML content for direct injection into a div.

      Personalize it for the following lead:
      - Homeowner Name: ${lead.homeownerName || 'the homeowner'}
      - Address: ${lead.address}
      - Known Roof Details: Age ${lead.roofAge || 'unknown'}, Material ${lead.roofMaterial || 'unknown'}.
      - Visible Damage Reported: ${lead.visibleDamage ? 'Yes' : 'No'}
      
      The pitch should be under 150 words, build trust, mention a free inspection, and have a clear call to action.
    `;

    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response;
  }

  async summarizeNotes(notes: string): Promise<GenerateContentResponse> {
    if (!this.ai) throw new Error("Gemini AI client not initialized.");

    const prompt = `
      Summarize the following notes from a roofing sales canvassing interaction into an HTML unordered list (<ul><li>).
      Focus on key takeaways, action items, and homeowner sentiment.
      Do not include \`\`\`html, markdown, or any preamble. Just return the raw HTML content for direct injection into a div.
      
      Notes: "${notes}"
    `;

    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response;
  }

  async textToSpeech(text: string): Promise<string | null> {
    if (!this.ai) return null;
    
    // Clean the text by stripping HTML tags for better TTS performance
    const cleanText = text.replace(/<[^>]*>/g, ' ');

    try {
        const response = await this.ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `In a friendly, conversational tone, say: ${cleanText}` }] }],
            config: {
                // Fix: Use the `Modality.AUDIO` enum member for consistency and type safety.
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A friendly, firm voice
                    },
                },
            },
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data || null;
    } catch (error) {
        console.error("Text-to-Speech generation failed:", error);
        return null;
    }
  }

  private async getWeatherForAddress(address: string): Promise<string | null> {
    if (!this.ai) return null;
    try {
      const prompt = `Provide a brief summary of any significant severe weather events, especially hail, that have occurred near the address "${address}" in the last 2-3 years. Focus on events that could cause roof damage. If no specific major events are found, state that.`;
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return response.text;
    } catch (error) {
      console.error(`Failed to get weather data for ${address}:`, error);
      return "Weather data could not be retrieved.";
    }
  }

  async calculateRoofScore(lead: Lead): Promise<{ score: number, reasoning: string } | null> {
    if (!this.ai) return null;

    // Step 1: Get weather data using Google Search in a separate call
    const weatherData = await this.getWeatherForAddress(lead.address);

    const parts: any[] = [];
    
    // Step 2: Construct the main prompt including the gathered weather data
    const textPrompt = `
      Analyze the provided information for the property at ${lead.address} and generate a "Roof Score".
      The score should be an integer between 0 and 100, where 100 represents a roof that is a very high-priority sales lead (e.g., old, visible damage, recent hail) and 0 represents a brand new roof with no issues.
      
      Use all available data:
      - Property address: ${lead.address}
      - Homeowner notes: ${lead.notes || 'Not provided'}
      - Reported roof age: ${lead.roofAge || 'Unknown'}
      - Reported roof material: ${lead.roofMaterial || 'Unknown'}
      - User reported visible damage: ${lead.visibleDamage ? 'Yes' : 'No'}
      - Recent weather report for the area: ${weatherData || 'No specific weather data found.'}
      - User-uploaded images and satellite imagery. Look for signs of aging, streaking, missing shingles, hail damage, or other anomalies.
      
      Provide a concise reasoning for your score, highlighting the key factors that influenced your decision.
    `;
    parts.push({ text: textPrompt });

    // Step 3: Add satellite image
    if (lead.imageUrl) {
        const satelliteImagePart = await this.urlToBase64(lead.imageUrl);
        if (satelliteImagePart) parts.push({ inlineData: satelliteImagePart });
    }

    // Step 4: Add user-uploaded images
    if (lead.userImageUrls) {
        for (const dataUrl of lead.userImageUrls) {
            const [header, base64Data] = dataUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            parts.push({ inlineData: { mimeType, data: base64Data } });
        }
    }

    try {
      // Step 5: Make the main analysis call with a JSON schema, but *without* the googleSearch tool
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER, description: "The calculated roof score from 0 to 100." },
                    reasoning: { type: Type.STRING, description: "A brief explanation for the score." }
                },
                required: ['score', 'reasoning']
            }
        }
      });
      
      const jsonStr = response.text.trim();
      const result = JSON.parse(jsonStr);
      return result;

    } catch (error) {
        console.error("Failed to calculate roof score:", error);
        return null;
    }
  }

  private async urlToBase64(url: string): Promise<{ mimeType: string, data: string } | null> {
    try {
        // Using a proxy to bypass potential CORS issues
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch image from ${url}, status: ${response.status}`);
            return null;
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const [header, base64Data] = dataUrl.split(',');
                resolve({ mimeType: blob.type, data: base64Data });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn(`CORS or network error fetching image from URL ${url}.`, error);
        return null;
    }
  }
}
