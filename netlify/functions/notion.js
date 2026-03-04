exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (!NOTION_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NOTION_TOKEN non configurato.' }) };
  }

  try {
    const body = JSON.parse(event.body);

    if (!APP_PASSWORD || body._password !== APP_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato.' }) };
    }

    const { _password, _action, ...payload } = body;

    const notionHeaders = {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2025-09-03'
    };

    let url, method = 'POST', fetchBody;

    switch (_action) {
      case 'get_database':
        url = `https://api.notion.com/v1/databases/${payload.database_id}`;
        method = 'GET';
        break;

      case 'query_database':
        // For contradiction check: fetch existing pages from a DB
        url = `https://api.notion.com/v1/databases/${payload.database_id}/query`;
        method = 'POST';
        fetchBody = JSON.stringify({
          filter: payload.filter || undefined,
          page_size: payload.page_size || 10
        });
        break;

      case 'get_page':
        url = `https://api.notion.com/v1/pages/${payload.page_id}`;
        method = 'GET';
        break;

      case 'get_page_content':
        url = `https://api.notion.com/v1/blocks/${payload.page_id}/children`;
        method = 'GET';
        break;

      case 'create_page':
        url = 'https://api.notion.com/v1/pages';
        method = 'POST';
        fetchBody = JSON.stringify(payload);
        break;

      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Azione non riconosciuta: ${_action}` }) };
    }

    const fetchOptions = { method, headers: notionHeaders };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
