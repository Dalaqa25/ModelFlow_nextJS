-- Get the workflow JSON to see the credential structure
SELECT 
  id,
  name,
  workflow->'nodes'->0->'credentials' as first_node_credentials,
  jsonb_pretty(workflow->'nodes'->0) as first_node_full
FROM automations
WHERE id = '<paste-your-automation-id-here>'
LIMIT 1;
