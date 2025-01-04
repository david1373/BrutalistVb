from setuptools import setup, find_packages

setup(
    name="scraper",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'python-dotenv',
        'supabase',
        'loguru',
        'requests',
        'beautifulsoup4',
        'playwright'
    ],
)