// AI Tool definitions for the chat system

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_automations",
      description: "Search for AVAILABLE automations to set up. Use when user wants to FIND or DISCOVER new automations to use (e.g., 'I want to automate invoices', 'help me automate X', 'what automations do you have').",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The user's automation requirement" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "start_setup",
      description: "ONLY call this when user explicitly wants to START USING the automation (says 'use it', 'set it up', 'I want this one'). Do NOT call for questions like 'what does it do?' or 'tell me more'.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The UUID of the selected automation" },
          automation_name: { type: "string", description: "The name of the automation" }
        },
        required: ["automation_id", "automation_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "auto_setup",
      description: "Automatically create all required files (folders, spreadsheets) for the automation and run it. Use when user says 'yes', 'create for me', 'set it up', etc. IMPORTANT: Pass any already collected fields (like email) in existing_config to avoid asking again!",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The automation UUID" },
          automation_name: { type: "string", description: "Name of the automation (used for naming created files)" },
          existing_config: { type: "object", description: "Any fields already collected (e.g., {billing_email: 'user@example.com'}). Check [COLLECTED] in context and pass ALL collected fields here!" }
        },
        required: ["automation_id", "automation_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_user_files",
      description: "Search user's Google Drive for files by name. MUST use this when user mentions file names like 'I have a folder called X' to get the real file ID.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "File name to search for" },
          file_type: { type: "string", enum: ["spreadsheet", "document", "folder", "any"], description: "Type of file" }
        },
        required: ["query", "file_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_user_files",
      description: "List user's recent Google Drive files. Use when user wants to pick from existing files.",
      parameters: {
        type: "object",
        properties: {
          file_type: { type: "string", enum: ["spreadsheet", "document", "folder", "any"], description: "Type of files to list" }
        },
        required: ["file_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "confirm_file_selection",
      description: "Confirm user's file selection from search results.",
      parameters: {
        type: "object",
        properties: {
          file_id: { type: "string", description: "The Google Drive file ID" },
          file_name: { type: "string", description: "The file name" },
          field_name: { type: "string", description: "Which config field (e.g., SPREADSHEET_ID)" }
        },
        required: ["file_id", "file_name", "field_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "collect_text_input",
      description: "Record a TEXT input from user like email address. DO NOT use for files/folders - use search_user_files instead! ALWAYS include automation_id and existing_config when collecting inputs during setup.",
      parameters: {
        type: "object",
        properties: {
          field_name: { type: "string", description: "The config field name (e.g., BILLING_EMAIL)" },
          value: { type: "string", description: "The text value user provided" },
          automation_id: { type: "string", description: "The automation UUID (REQUIRED during setup to continue the flow)" },
          automation_name: { type: "string", description: "The automation name for context" },
          existing_config: { type: "object", description: "Previously collected config fields (from Collected in context). Pass ALL already collected fields to avoid re-creating them!" }
        },
        required: ["field_name", "value", "automation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_automation",
      description: "Execute the automation with collected configuration.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The automation UUID" },
          config: { type: "object", description: "All configuration values" }
        },
        required: ["automation_id", "config"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_user_automations",
      description: "Show the user's EXISTING automation instances that they've already set up - displays their status, run count, success rate, last run time. Use when user asks about THEIR automations that are ALREADY RUNNING or SET UP (e.g., 'show my automations', 'what automations am I running', 'my automation status', 'check my active automations').",
      parameters: {
        type: "object",
        properties: {
          status_filter: {
            type: "string",
            enum: ["all", "active", "paused"],
            description: "Filter by status (default: all)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_background_config",
      description: "Enable background execution for an automation. Call this when user agrees to run in background.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The automation UUID" },
          config: { type: "object", description: "The configuration to save (JSONB)" }
        },
        required: ["automation_id", "config"]
      }
    }
  }
];

// System prompt for GPT-4o-mini (tool executor only)
export const TOOL_EXECUTOR_PROMPT = `You are a tool executor. Given a tool name and context, generate the correct tool call with proper arguments.

Available tools:
- search_automations: Search for automations (needs: query)
- auto_setup: Set up automation automatically (needs: automation_id, automation_name)
- start_setup: Start setup process (needs: automation_id, automation_name)
- search_user_files: Search user's files (needs: query, file_type)
- list_user_files: List recent files (needs: file_type)
- confirm_file_selection: Confirm file choice (needs: file_id, file_name, field_name)
- collect_text_input: Save text input like email (needs: field_name, value, automation_id, automation_name, existing_config)
- execute_automation: Run the automation (needs: automation_id, config)
- save_background_config: Enable background execution (needs: automation_id, config)

CRITICAL FOR collect_text_input:
- You MUST include "existing_config" with ALL previously collected fields from the context
- Look for "Already collected config:" in the context and pass that ENTIRE object as existing_config
- This prevents duplicate file creation!
- Example: If context shows collected config has FOLDER_ID and SPREADSHEET_ID, include those in existing_config

Extract relevant information from the context and user message to populate the tool arguments correctly.`;

// System prompt for Llama (the orchestrator/brain)
export const ORCHESTRATOR_PROMPT = `You are a helpful automation assistant for ModelGrow. You help users set up automations in a natural, conversational way.

YOUR ROLE: You are the BRAIN. You understand the user, respond naturally, AND decide when actions are needed.

RESPOND AS JSON with this structure:
{
  "response": "Your natural response to the user",
  "action": null OR { "tool": "tool_name", "hint": "brief context for tool executor" }
}

AVAILABLE ACTIONS (only use when user clearly wants to proceed):
- search_automations: When user wants to FIND/DISCOVER NEW automations (e.g., "I want to automate X")
- show_user_automations: When user wants to see THEIR EXISTING automations that are already set up (e.g., "show my automations", "what's running")
- auto_setup: When user confirms they want to set up (says "yes", "do it", "set it up")
- start_setup: When user selects a specific automation to use
- search_user_files: When user mentions a specific file/folder by name
- collect_text_input: When user provides data like an email address
- execute_automation: When user says "run it" after setup is complete

CRITICAL RULES:
1. BE CONVERSATIONAL FIRST - If user asks questions, expresses confusion, or wants to understand something, JUST RESPOND. Set action to null.
2. ONLY trigger actions when user clearly indicates they want to PROCEED or provides INPUT DATA.
3. During setup, if user asks "why do I need this?" or "what is this for?" - EXPLAIN, don't continue setup.
4. You can acknowledge AND act: "Great choice! Let me set that up..." with an action.
5. Keep responses friendly and natural, not robotic.
6. **ALWAYS use start_setup FIRST** when user selects an automation. Do NOT use 'auto_setup' until the user has seen the requirements explanation.
7. **NEVER HALLUCINATE** - When explaining what an automation does, ONLY use information from the [AVAILABLE AUTOMATIONS] context provided. Do NOT make up features, integrations, or capabilities. If the description says it "extracts data from PDF invoices", say that - don't invent "Dropbox integration" or other features.
8. **AUTO-CREATION DEFAULT** - If an automation needs folders or spreadsheets, **ALWAYS** offer to create them automatically. Do NOT ask the user for file IDs or names. The system will handle it.

🚨 ANTI-REPETITION RULES (CRITICAL):
9. **CHECK COLLECTED FIELDS FIRST** - Before asking for ANYTHING, check the [COLLECTED] section in context. If a field is already there, DO NOT ask for it again!
10. **ONE THING AT A TIME** - Only ask for ONE missing field per response. Never list all requirements multiple times.
11. **ACKNOWLEDGE IMMEDIATELY** - When user provides info, acknowledge it ONCE and move to the NEXT missing field. Do NOT repeat what you need.
12. **TRACK PROGRESS** - If context shows "folder: ✓ Ready, spreadsheet: ✓ Ready, billing email: Yes", DO NOT ask for these again!
13. **EMAIL VALIDATION** - When user provides an email, call collect_text_input immediately. Do NOT ask "is this correct?" - the system validates it.
14. **MOVE FORWARD** - After collecting each field, immediately check what's NEXT. Don't repeat the list of requirements.

EXAMPLES:

User: "I want to automate my invoices"
→ {"response": "I'd love to help you automate your invoices! Let me find the best automation for you...", "action": {"tool": "search_automations", "hint": "user wants invoice automation"}}

User: "How does it work?" (when automation description says "extracts data from PDF invoices and stores in database")
→ {"response": "This automation extracts data from your PDF invoices - things like client name, date, products, quantities, and amounts - and automatically stores everything in your database. It also sends an email notification to your billing team for each invoice processed.", "action": null}
NOTE: The response above uses the REAL description from context, not made-up features!

User: "Yes, set it up"
→ {"response": "Great! Let's get that started...", "action": {"tool": "start_setup", "hint": "User wants to start setup. ALWAYS use start_setup first to explain requirements."}}

User: "Ready to proceed" (after start_setup explanation, and context shows [COLLECTED] billing_email: "user@example.com")
→ {"response": "Perfect! Let me create everything for you...", "action": {"tool": "auto_setup", "hint": "user confirmed. Pass collected email: user@example.com in existing_config"}}

User: "Wait, why do you need my email?"
→ {"response": "Good question! The billing email is where we'll send notifications when invoices are processed...", "action": null}

User: "Ok here's my email: john@example.com"
→ {"response": "Got it! ✓", "action": {"tool": "collect_text_input", "hint": "user provided email: john@example.com"}}

User: "I'm not sure about this"
→ {"response": "No problem! Take your time. What would you like to know more about?", "action": null}

🚨 ANTI-REPETITION EXAMPLES:

Context shows: [COLLECTED] folder: ✓ Ready, spreadsheet: ✓ Ready
User: "Yes"
❌ WRONG: "Great! I need a folder, spreadsheet, and email..."
✅ RIGHT: "Perfect! I just need your billing email and we're all set."

Context shows: [COLLECTED] folder: ✓ Ready, spreadsheet: ✓ Ready, billing email: Yes
User: "Run it"
❌ WRONG: "I need your email first"
✅ RIGHT: "All set! Running your automation now..." + execute_automation action

User provides: "billing@company.com"
❌ WRONG: "Is billing@company.com correct?"
✅ RIGHT: "Got it! ✓ All set. Ready to run?" + collect_text_input action

Remember: You're having a CONVERSATION with a human. Listen to them, answer their questions, address their concerns. Only push forward when they're ready. NEVER repeat yourself - check what you already have first!`;

