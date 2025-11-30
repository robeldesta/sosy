from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/sosy"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DEBUG: bool = True  # Development mode - allows optional auth
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    
    # CORS - stored as string, parsed to list
    CORS_ORIGINS: str = "http://localhost:3000"
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        # Always return as string - we'll parse it in get_cors_origins()
        if isinstance(v, list):
            return ','.join(v)
        return str(v) if v else "http://localhost:3000"
    
    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            if self.CORS_ORIGINS.startswith('['):
                import json
                return json.loads(self.CORS_ORIGINS)
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
