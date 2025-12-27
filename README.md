# anylist-mcp

MCP server for AnyList (shopping lists, recipes, meal plans) built on the
unofficial AnyList API wrapper.

## Setup

```bash
npm install
```

Set environment variables:

- `ANYLIST_EMAIL` (required)
- `ANYLIST_PASSWORD` (required)
- `ANYLIST_USER_ID` (optional, recommended if you have empty lists)
- `ANYLIST_CREDENTIALS_FILE` (optional; set to `false` or `null` to disable
  saved credentials)

Run the server:

```bash
npm start
```

Node 23.6+ includes native TypeScript execution.

## Streamable HTTP

The MCP server listens on `http://localhost:3333/mcp` by default. Override the
port with `MCP_PORT`.

## MCP config example

```json
{
  "mcpServers": {
    "anylist": {
      "url": "http://localhost:3333/mcp"
    }
  }
}
```

## MCP tools

Shopping lists:

- `anylist_lists`
- `anylist_list_items`
- `anylist_add_item`
- `anylist_update_item`
- `anylist_remove_item`
- `anylist_uncheck_all`

Recipes:

- `anylist_recipes`
- `anylist_get_recipe`
- `anylist_create_recipe`
- `anylist_update_recipe`
- `anylist_delete_recipe`

Meal plans:

- `anylist_meal_plan_events`
- `anylist_meal_plan_labels`
- `anylist_create_meal_plan_event`
- `anylist_delete_meal_plan_event`

## Notes

- If your lists are empty, the server may not be able to infer a user id from
  list items. Set `ANYLIST_USER_ID` to avoid that issue.
- AnyList credentials are stored in `~/.anylist_credentials` by default.
