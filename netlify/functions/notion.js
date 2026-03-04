exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (!NOTION_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NOTION_TOKEN non configurato nelle environment variables di Netlify.' }) };
  }

  try {
    const body = JSON.parse(event.body);

    // Password check — ogni richiesta deve portare la password corretta
    if (!APP_PASSWORD || body._password !== APP_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato.' }) };
    }

    const { _password, _action, ...payload } = body;

    let url;
    let method = 'POST';

    // Route the request to the correct Notion endpoint
    switch (_action) {
      case 'get_database':
        url = `https://api.notion.com/v1/databases/${payload.database_id}`;
        method = 'GET';
        break;
      case 'create_page':
        url = 'https://api.notion.com/v1/pages';
        method = 'POST';
        break;
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Azione non riconosciuta: ${_action}` }) };
    }

    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2025-09-03'
      }
    };

    if (method === 'POST') {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
