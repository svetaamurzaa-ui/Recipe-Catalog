import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT_DIR, 'global_recipes_database.json')

class RecipeServer(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/recipes':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            recipes = self.load_recipes()
            params = parse_qs(parsed.query)
            search = params.get('search', [''])[0].strip().lower()
            limit = None
            if 'limit' in params:
                try:
                    limit = int(params['limit'][0])
                except ValueError:
                    limit = None
            if search:
                recipes = [r for r in recipes if search in (r.get('title', '') or '').lower() or search in ' '.join((r.get('tags') or [])).lower()]
            if limit is not None:
                recipes = recipes[:limit]
            self.wfile.write(json.dumps(recipes, ensure_ascii=False).encode('utf-8'))
            return
        return super().do_GET()

    def load_recipes(self):
        if not os.path.exists(DATA_FILE):
            return []
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as file:
                return json.load(file)
        except Exception:
            return []

if __name__ == '__main__':
    os.chdir(ROOT_DIR)
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, RecipeServer)
    print('Запущено сервер на http://127.0.0.1:8000')
    print('API для рецептів: http://127.0.0.1:8000/api/recipes?limit=12')
    httpd.serve_forever()
