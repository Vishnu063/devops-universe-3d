import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import urlopen
from http.server import ThreadingHTTPServer

class LearningApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.mkdtemp(prefix="universe-test-")
        os.environ["APP_MESSAGE"] = "integration-test"
        os.environ["DATA_DIR"] = cls.directory
        spec = importlib.util.spec_from_file_location("learning_app", Path(__file__).with_name("app.py"))
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), cls.module.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = "http://127.0.0.1:" + str(cls.server.server_address[1])

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        shutil.rmtree(cls.directory)

    def test_health_over_http(self):
        with urlopen(self.url + "/health", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(json.load(response)["message"], "integration-test")

    def test_database_read_over_http(self):
        with urlopen(self.url + "/products", timeout=3) as response:
            self.assertEqual(json.load(response), [{"id": 1, "name": "learning product"}])

    def test_metrics_over_http(self):
        with urlopen(self.url + "/metrics", timeout=3) as response:
            self.assertIn(b"universe_app_info 1", response.read())

    def test_missing_route(self):
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.url + "/missing", timeout=3)
        self.assertEqual(caught.exception.code, 404)

if __name__ == "__main__":
    unittest.main()
