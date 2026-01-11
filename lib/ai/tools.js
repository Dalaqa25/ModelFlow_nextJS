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
      description: "Start or continue setup for an automation. Pass collected_fields to track progress.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The UUID of the selected automation" },
          automation_name: { type: "string", description: "The name of the automation for context" },
          collected_fields: { 
            type: "object", 
            description: "Fields already collected in this session, e.g. {FOLDER_ID: 'abc123', EMAIL: 'test@example.com'}" 
          }
        },
        required: ["automation_id", "automation_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_user_files",
      description: "Search user's Google Drive for files by name. Only use when user provides a specific file name to search for.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "File name to search for" },
          file_type: { type: "string", enum: ["spreadsheet", "document", "folder", "any"], description: "Type of file to search for" }
        },
        required: ["query", "file_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_user_files",
      description: "List user's recent Google Drive files. Use when user doesn't know/remember file names and wants to see their options.",
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
      name: "create_google_file",
      description: "Create a new Google Drive file or folder. Use when user wants to create a new spreadsheet, document, or folder.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the new file/folder" },
          file_type: { type: "string", enum: ["spreadsheet", "document", "folder"], description: "Type to create" },
          field_name: { type: "string", description: "Which config field this is for (e.g., FOLDER_ID)" }
        },
        required: ["name", "file_type", "field_name"]
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
          file_name: { type: "string", description: "The file name for confirmation" },
          field_name: { type: "string", description: "Which config field this is for (e.g., SPREADSHEET_ID)" }
        },
        required: ["file_id", "file_name", "field_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "collect_text_input",
      description: "Record a text input from user (like email, custom text). Call when user provides a value.",
      parameters: {
        type: "object",
        properties: {
          field_name: { type: "string", description: "The config field name (e.g., BILLING_EMAIL)" },
          value: { type: "string", description: "The value user provided" }
        },
        required: ["field_name", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_automation",
      description: "Execute the automation with all collected configuration. Call when all required fields are collected.",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "The automation UUID" },
          config: { type: "object", description: "All collected configuration values" }
        },
        required: ["automation_id", "config"]
      }
    }
  }
];

export const SYSTEM_PROMPT = `You are an AI assistant for ModelGrow, helping users set up automation workflows.

CRITICAL RULES:

1. NEVER display UUIDs - internal only
2. NEVER use markdown - plain text only  
3. READ THE SETUP STATE - Each message includes [Setup State:...] showing exactly what's collected and remaining
4. ANSWER QUESTIONS NATURALLY - "why?", "explain" → Just answer, no tool call

USING SETUP STATE (VERY IMPORTANT):
- Look for [Setup State:...] in the user message
- "Collected:" shows fields already done - DON'T ask for these again
- "Remaining:" shows what's still needed - ask for the FIRST one
- If Remaining is "NONE - ready to execute", all fields are collected - offer to run

SETUP FLOW:
1. User selects automation → call start_setup
2. For each remaining field:
   - File needed + user gives name → search_user_files
   - File needed + user doesn't know → list_user_files  
   - File needed + user wants new → create_google_file
   - Text needed → collect_text_input
3. After field collected, ask for NEXT remaining field (check Setup State)
4. When Remaining is "NONE" → call execute_automation

TOOLS:
- start_setup: Begin setup (only if not already started)
- search_user_files: Search by name
- list_user_files: Show recent files
- create_google_file: Create new file/folder
- confirm_file_selection: When user picks from list
- collect_text_input: For text values
- execute_automation: Run when Remaining is NONE

Be conversational and follow the Setup State!`;
