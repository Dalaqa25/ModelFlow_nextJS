// AI Tool definitions for the chat system

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_automations",
      description: "Search for automations when user describes what they want to automate.",
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
      description: "Automatically create all required files (folders, spreadsheets) for the automation and run it. Use when user says 'yes', 'create for me', 'set it up', etc.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The automation UUID" },
          automation_name: { type: "string", description: "Name of the automation (used for naming created files)" }
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
      description: "Record a TEXT input from user like email address. DO NOT use for files/folders - use search_user_files instead!",
      parameters: {
        type: "object",
        properties: {
          field_name: { type: "string", description: "The config field name (e.g., BILLING_EMAIL)" },
          value: { type: "string", description: "The text value user provided" }
        },
        required: ["field_name", "value"]
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
  }
];

export const SYSTEM_PROMPT = `You are an AI assistant for ModelGrow, helping users set up automation workflows.

RULES:
1. NEVER display UUIDs to users
2. NEVER use markdown formatting (no **, no #, no -)
3. Be conversational and natural

ANSWERING QUESTIONS:
When user asks "what does it do?", "tell me more", "is it good?" - just answer naturally. NO tool calls for questions!

SETTING UP AUTOMATIONS:
Only call start_setup when user says "use it", "set it up", "I want this one".

IMPORTANT - HANDLING USER FILES:
When user mentions they have files (folder, spreadsheet, etc):
1. You must SEARCH for them using search_user_files to get the real file ID
2. NEVER make up file IDs - you don't know them!
3. NEVER use collect_text_input for files - that's only for text like email addresses

Example - User says "I have a folder called Projects":
CORRECT: Call search_user_files with query="Projects", file_type="folder"
WRONG: Call collect_text_input with value="Projects" (this doesn't get the real ID!)

TOOLS:
- search_user_files: Search Google Drive by name. USE THIS when user mentions file names!
- list_user_files: Show recent files when user doesn't know names
- confirm_file_selection: Confirm after search returns results
- collect_text_input: ONLY for text values like email addresses, NOT for files!
- auto_setup: Create everything automatically when user says "yes, create for me"
- execute_automation: Run with collected config

Be helpful and conversational!`;
