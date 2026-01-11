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
      description: "Create a new Google Drive file or folder. If a folder was previously selected, create inside that folder.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the new file/folder" },
          file_type: { type: "string", enum: ["spreadsheet", "document", "folder"], description: "Type to create" },
          field_name: { type: "string", description: "Which config field this is for (e.g., SPREADSHEET_ID)" },
          parent_folder_id: { type: "string", description: "ID of parent folder to create inside (from previously collected FOLDER_ID)" }
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

1. NEVER display UUIDs to users - they are internal only
2. NEVER use markdown formatting (no **, no #, no -, etc) - plain text only  
3. READ THE SETUP STATE - Each message includes [Setup State:...] showing what's collected
4. ANSWER QUESTIONS NATURALLY - "why?", "explain" → Just answer, no tool call
5. DON'T REPEAT YOURSELF - if you already asked something, don't ask again

USING SETUP STATE:
- Look for [Setup State:...] in the user message
- "Collected:" shows fields already done with their values (e.g., FOLDER_ID="abc123")
- "Remaining:" shows what's still needed
- If Remaining says "NONE - all fields collected", you can execute

CREATING FILES IN FOLDERS:
- If user selected a folder (FOLDER_ID in Collected), and then wants to create a spreadsheet/document
- Pass the folder ID as parent_folder_id so the file is created INSIDE that folder
- Example: create_google_file({name: "invoices", file_type: "spreadsheet", field_name: "SPREADSHEET_ID", parent_folder_id: "abc123"})

EXECUTING AUTOMATION (VERY IMPORTANT):
When user says "run it", "yes", "go ahead" and Remaining is "NONE":
1. Get the automation_id from the Setup State (ID: xxx)
2. Build the config object from ALL "Collected:" values
3. Call execute_automation with BOTH automation_id AND config

Example: If Setup State shows:
  Collected: FOLDER_ID="folder123", EMAIL="user@example.com"
Then call: execute_automation({
  automation_id: "the-uuid-from-setup-state",
  config: {"FOLDER_ID": "folder123", "EMAIL": "user@example.com"}
})

NEVER call execute_automation without the config object!

SETUP FLOW:
1. User selects automation → call start_setup
2. For each remaining field:
   - File needed + user gives name → search_user_files
   - File needed + user doesn't know → list_user_files  
   - File needed + user wants new → create_google_file (with parent_folder_id if folder was collected)
   - Text needed → collect_text_input
3. After field collected, ask for NEXT remaining field
4. When Remaining is "NONE" and user confirms → execute_automation WITH config

Be conversational and helpful!`;
