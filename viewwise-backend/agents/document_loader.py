import os
import json
import sqlite3
import re
from dotenv import load_dotenv


import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional, Any,Set
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin
from dotenv import load_dotenv
from langchain_unstructured import UnstructuredLoader
from langchain_community.document_loaders import (UnstructuredURLLoader, Docx2txtLoader, JSONLoader, PyPDFLoader,
                                                  UnstructuredCSVLoader, UnstructuredExcelLoader, UnstructuredXMLLoader, YoutubeLoader)

# Load environment variables from .env file
load_dotenv()
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get the Google API key from environment variables
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', 'API_KEY_NOT_FOUND')
if GOOGLE_API_KEY == 'API_KEY_NOT_FOUND':
    print("Google API key is missing. Please set the GOOGLE_API_KEY environment variable.")
    exit(1)
SOCIAL_MEDIA_DOMAINS = {
    'facebook.com', 'twitter.com', 'instagram.com',
    'linkedin.com', 'youtube.com', 'tiktok.com',
    'pinterest.com', 'reddit.com', 'snapchat.com',
    'whatsapp.com', 'telegram.org', 'viber.com'
}

def is_social_media(url: str) -> bool:
    """Vérifie si l'URL appartient à un réseau social."""
    return any(domain in url for domain in SOCIAL_MEDIA_DOMAINS)

def is_valid_url(url: str) -> bool:
    """Vérifie si l'URL est valide (pas un mailto, tel, ou lien social)."""
    return not (
            url.startswith("mailto:") or
            url.startswith("tel:") or
            is_social_media(url)
    )
def display_file_content(source: str, file_extension: Optional[str], content: str, char_limit: int = 500) -> None:
    separator = "-" * 50
    source_info = f"{source} ({file_extension})" if file_extension else source
    print(f"\n{separator}")
    print(f"Displaying content of {source_info}:")
    print(separator)
    display_content = content[:char_limit] + ("..." if len(content) > char_limit else "")
    print(display_content)
    print(f"{separator}\n")

class DocumentLoader:
    """
    Manages loading various types of documents such as local files, URLs, and YouTube videos.
    """
    def __init__(self, output_char_limit: int = 500, max_workers: int = 4):
        self.output_char_limit: int = output_char_limit
        self.max_workers: int = max_workers
        self.loader_registry = {
            '.pdf': PyPDFLoader,
            '.xls': UnstructuredExcelLoader,
            '.xlsx': UnstructuredExcelLoader,
            '.csv': UnstructuredCSVLoader,
            '.json': lambda file_path: JSONLoader(file_path=file_path, jq_schema=".", text_content=False),
            '.xml': UnstructuredXMLLoader,
            '.txt': UnstructuredLoader,
            '.docx': Docx2txtLoader
        }
        self.documents: List[Any] = []  # Stores loaded documents

    def load_document(self, input_path: str) -> None:
        """
        Automatically detects the type of document and loads it accordingly.
        Handles local files, URLs, YouTube videos, and SQL scripts.
        """
        # Check if input is a URL
        if re.match(r'^https?://', input_path):
            if "youtube.com" in input_path or "youtu.be" in input_path:
                # Load YouTube content
                self.load_youtube(input_path)
            elif input_path.endswith("sitemap.xml"):
                # Load URLs from an XML sitemap
                self.load_urls_from_sitemap(input_path)
            else:
                # Load regular webpage URL
                self.load_url(input_path)
        elif os.path.isfile(input_path):
            # Handle local files based on their extension
            self.load_file(input_path)
        elif input_path.endswith('.sql'):
            # Handle SQL script file
            self.load_sql(input_path)
        else:
            print(f"Unsupported input type for {input_path}")

    def load_file(self, file_path: str) -> None:
        """Loads a file and displays its content."""
        file_extension: str = os.path.splitext(file_path)[-1].lower()
        loader_class = self.loader_registry.get(file_extension)
        if loader_class:
            try:
                loader = loader_class(file_path=file_path) if callable(loader_class) else loader_class(file_path)
                documents = loader.load()
                if documents:
                    self.documents.extend(documents)
                    text = documents[0].page_content if hasattr(documents[0], 'page_content') else json.dumps(documents[0])
                    display_file_content(file_path, file_extension, text, self.output_char_limit)
                else:
                    print(f"No content found for {file_path}.")
            except Exception as e:
                print(f"Error loading file {file_path}: {e}")
        else:
            print(f"Unsupported file format: {file_extension}")

    def load_sql(self, file_path: str) -> None:
        try:
            with open(file_path, 'r') as file:
                sql_script: str = file.read()
                conn = sqlite3.connect(':memory:')
                cursor = conn.cursor()
                cursor.executescript(sql_script)
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                if tables:
                    for table in tables:
                        cursor.execute(f"SELECT * FROM {table[0]} LIMIT 5;")
                        rows = cursor.fetchall()
                        content = f"Tables: {tables}\nData: {rows}"
                        display_file_content(file_path, '.sql', content, self.output_char_limit)
                conn.close()
        except sqlite3.DatabaseError as e:
            print(f"Database error when executing SQL script: {e}")
        except Exception as e:
            print(f"Error loading SQL file: {e}")

    def load_url(self, url: str) -> None:
        try:
            loader = UnstructuredURLLoader(urls=[url])
            documents = loader.load()
            if documents:
                self.documents.extend(documents)
                text = "\n".join([doc.page_content for doc in documents])
                display_file_content(url, None, text, self.output_char_limit)
            else:
                print(f"No content found for URL: {url}")
        except requests.RequestException as e:
            print(f"Error making request to URL: {e}")
        except Exception as e:
            print(f"Error loading URL: {e}")

    def load_youtube(self, url: str) -> None:
        try:
            loader = YoutubeLoader.from_youtube_url(url)
            documents = loader.load()
            if documents:
                self.documents.extend(documents)
                text = "\n".join([doc.page_content for doc in documents])
                display_file_content(url, None, text, self.output_char_limit)
            else:
                print(f"No content found for YouTube URL: {url}")
        except Exception as e:
            print(f"Error loading YouTube URL: {e}")

    def has_sitemap(self, start_url: str) -> bool:
        sitemap_url = start_url + "/sitemap.xml"
        try:
            response = requests.head(sitemap_url)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

    def get_urls_from_sitemap(self, start_url: str) -> List[str]:
        sitemap_url = start_url
        try:
            response = requests.get(sitemap_url)
            response.raise_for_status()
        except requests.exceptions.RequestException:
            return []

        urls = []
        soup = BeautifulSoup(response.content, 'xml')
        for url in soup.find_all("loc"):
            url_text = url.get_text()
            if url_text.endswith(".xml"):
                urls.extend(self.get_urls_from_sitemap(url_text))
            else:
                urls.append(url_text)
        return urls




    def get_urls_from_html_sitemap(self, start_url: str, seen_urls: Set[str] = None) -> List[str]:
            """
            Explore un sitemap HTML, ignore les liens indésirables, et parcourt récursivement les URLs trouvées.

            :param start_url: URL de départ.
            :param seen_urls: Ensemble des URLs déjà visitées pour éviter les boucles infinies.
            :return: Liste d'URLs uniques.
            """
            if seen_urls is None:
                seen_urls = set()

            try:
                logger.info(f"Fetching HTML sitemap from {start_url}")
                response = requests.get(
                    start_url,
                    timeout=10,
                    verify=False,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                response.raise_for_status()
                logger.info(f"Received response with status code {response.status_code}")

                soup = BeautifulSoup(response.content, 'html.parser')
                urls = [a.get('href') for a in soup.find_all('a', href=True)]
                logger.info(f"Found {len(urls)} links in the HTML sitemap")

                # Convertir les liens relatifs en liens absolus et filtrer les doublons
                urls = [urljoin(start_url, url) for url in urls]
                urls = [url for url in urls if is_valid_url(url) and url not in seen_urls]

                # Ajouter les URLs valides au set des URLs visitées
                seen_urls.update(urls)

                # Explorer récursivement chaque URL trouvée
                for url in urls:
                    if url not in seen_urls:
                        logger.info(f"Exploring URL: {url}")
                        more_urls = self.get_urls_from_html_sitemap(url, seen_urls)
                        seen_urls.update(more_urls)

                return list(seen_urls)

            except requests.RequestException as e:
                logger.error(f"Error fetching HTML sitemap from {start_url}: {e}")
                return []

    def load_urls_from_sitemap(self, start_url: str) -> None:
        if self.has_sitemap(start_url):
            urls = self.get_urls_from_sitemap(start_url + "/sitemap.xml")
        else:
            urls = self.get_urls_from_html_sitemap(start_url)
        for url in urls:
            self.load_url(url)
# Exemple d'utilisation
if __name__ == "__main__":
    loader = DocumentLoader()

    # Streaming des URLs depuis un sitemap XML
    for url in loader.get_urls_from_html_sitemap("https://inveep.com/en/"):
        print(f"URL trouvée : {url}")