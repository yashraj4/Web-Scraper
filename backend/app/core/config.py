from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Web Scraper Platform"
    database_url: str = "sqlite:///./webscraper.db"
    redis_url: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
