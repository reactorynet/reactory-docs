# Python Development Cheat Sheet

## Python Basics

### Running Python
```bash
python --version           # Check Python version
python3 --version          # Check Python 3 version
python script.py           # Run a script
python -m module           # Run module as script
python -c "print('Hello')" # Execute code directly
python -i script.py        # Interactive mode after script
```

### Virtual Environments
```bash
# venv (built-in)
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
deactivate                 # Exit virtual environment

# virtualenv (external)
pip install virtualenv
virtualenv venv
virtualenv -p python3.11 venv  # Specific version

# conda
conda create -n myenv python=3.11
conda activate myenv
conda deactivate
```

### Package Management

#### pip
```bash
pip install package              # Install package
pip install package==1.2.3       # Specific version
pip install package>=1.2.3       # Minimum version
pip install -r requirements.txt  # Install from file
pip install -e .                 # Editable/development install
pip install --upgrade package    # Upgrade package
pip uninstall package            # Remove package
pip list                         # List installed packages
pip freeze                       # List with versions
pip freeze > requirements.txt    # Export requirements
pip show package                 # Show package details
```

#### poetry (Modern Package Manager)
```bash
poetry init                      # Initialize project
poetry add package               # Add dependency
poetry add -D package            # Add dev dependency
poetry install                   # Install dependencies
poetry update                    # Update dependencies
poetry shell                     # Activate virtual environment
poetry run python script.py      # Run with poetry env
poetry build                     # Build package
poetry publish                   # Publish to PyPI
```

#### pipenv
```bash
pipenv install                   # Install from Pipfile
pipenv install package           # Add package
pipenv install --dev package     # Add dev package
pipenv shell                     # Activate environment
pipenv run python script.py      # Run command
pipenv lock                      # Generate Pipfile.lock
```

## Modern Python Syntax

### Type Hints (Python 3.9+)
```python
from typing import List, Dict, Optional, Union, Tuple, Any

# Basic types
def greet(name: str) -> str:
    return f"Hello, {name}"

# Collections
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Optional values
def find_user(user_id: int) -> Optional[dict]:
    return None

# Union types (Python 3.10+)
def parse_value(value: int | str) -> str:
    return str(value)

# Type aliases
UserID = int
User = dict[str, Any]

def get_user(user_id: UserID) -> User:
    return {"id": user_id, "name": "John"}
```

### Pattern Matching (Python 3.10+)
```python
def handle_command(command):
    match command:
        case ["quit"]:
            return "Goodbye!"
        case ["load", filename]:
            return f"Loading {filename}"
        case ["save", filename]:
            return f"Saving to {filename}"
        case _:
            return "Unknown command"

# Structural pattern matching
def process_point(point):
    match point:
        case (0, 0):
            return "Origin"
        case (0, y):
            return f"Y-axis at {y}"
        case (x, 0):
            return f"X-axis at {x}"
        case (x, y):
            return f"Point at ({x}, {y})"
```

### Data Classes
```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    tags: list[str] = field(default_factory=list)
    
    def __post_init__(self):
        self.email = self.email.lower()

# Usage
user = User(id=1, name="John", email="JOHN@EXAMPLE.COM")
print(user)  # User(id=1, name='John', email='john@example.com', ...)
```

### Async/Await
```python
import asyncio
import aiohttp

async def fetch_url(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

async def fetch_multiple(urls: list[str]) -> list[str]:
    tasks = [fetch_url(url) for url in urls]
    return await asyncio.gather(*tasks)

# Run async code
asyncio.run(fetch_multiple(["https://example.com"]))
```

## Enterprise Python Stack

### Web Frameworks

#### FastAPI (Modern, Async, High Performance)
```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}

@app.post("/items/")
async def create_item(item: Item):
    return {"item": item, "id": 123}

# Dependency injection
async def get_current_user():
    return {"username": "john"}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Run with: uvicorn main:app --reload
```

#### Flask (Lightweight, Flexible)
```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({"message": "Hello World"})

@app.route('/items/<int:item_id>')
def get_item(item_id):
    return jsonify({"item_id": item_id})

@app.route('/items', methods=['POST'])
def create_item():
    data = request.get_json()
    return jsonify({"item": data}), 201

if __name__ == '__main__':
    app.run(debug=True)
```

#### Django (Full-Featured Framework)
```python
# models.py
from django.db import models

class User(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

# views.py
from django.http import JsonResponse
from .models import User

def user_list(request):
    users = User.objects.all().values()
    return JsonResponse(list(users), safe=False)

# Django REST Framework
from rest_framework import viewsets
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
```

### Database & ORM

#### SQLAlchemy (Most Popular ORM)
```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create engine and session
engine = create_engine('postgresql://user:pass@localhost/dbname')
Session = sessionmaker(bind=engine)
session = Session()

# CRUD operations
# Create
user = User(username='john', email='john@example.com')
session.add(user)
session.commit()

# Read
users = session.query(User).filter(User.username == 'john').all()
user = session.query(User).filter_by(id=1).first()

# Update
user.email = 'newemail@example.com'
session.commit()

# Delete
session.delete(user)
session.commit()
```

#### SQLModel (FastAPI + SQLAlchemy Integration)
```python
from sqlmodel import Field, Session, SQLModel, create_engine, select
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    email: str = Field(unique=True)

# Create database
engine = create_engine("sqlite:///database.db")
SQLModel.metadata.create_all(engine)

# Use with FastAPI
@app.post("/users/")
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@app.get("/users/")
def read_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users
```

#### Tortoise ORM (Async ORM)
```python
from tortoise import fields
from tortoise.models import Model

class User(Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=100, unique=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        table = "users"

# Initialize
from tortoise import Tortoise

async def init():
    await Tortoise.init(
        db_url='postgres://user:pass@localhost/dbname',
        modules={'models': ['__main__']}
    )
    await Tortoise.generate_schemas()

# CRUD operations
async def create_user():
    user = await User.create(username='john', email='john@example.com')
    return user

async def get_users():
    users = await User.all()
    return users
```

#### Raw SQL with asyncpg/psycopg2
```python
# asyncpg (async PostgreSQL)
import asyncpg

async def fetch_users():
    conn = await asyncpg.connect('postgresql://user:pass@localhost/db')
    rows = await conn.fetch('SELECT * FROM users WHERE active = $1', True)
    await conn.close()
    return rows

# psycopg2 (sync PostgreSQL)
import psycopg2

conn = psycopg2.connect("dbname=test user=postgres")
cur = conn.cursor()
cur.execute("SELECT * FROM users")
rows = cur.fetchall()
cur.close()
conn.close()
```

### Data Processing & Analysis

#### Pandas (Data Analysis)
```python
import pandas as pd
import numpy as np

# Create DataFrame
df = pd.DataFrame({
    'name': ['John', 'Jane', 'Bob'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
})

# Read data
df = pd.read_csv('data.csv')
df = pd.read_excel('data.xlsx')
df = pd.read_json('data.json')
df = pd.read_sql('SELECT * FROM users', conn)

# Basic operations
df.head()                    # First 5 rows
df.tail()                    # Last 5 rows
df.info()                    # DataFrame info
df.describe()                # Statistics
df.shape                     # (rows, columns)
df.columns                   # Column names
df.dtypes                    # Data types

# Selection
df['name']                   # Single column
df[['name', 'age']]         # Multiple columns
df[df['age'] > 25]          # Filtering
df.loc[0]                    # By label
df.iloc[0]                   # By position
df.query('age > 25')        # Query syntax

# Manipulation
df['bonus'] = df['salary'] * 0.1
df.drop('bonus', axis=1, inplace=True)
df.rename(columns={'name': 'full_name'})
df.sort_values('age', ascending=False)
df.groupby('department')['salary'].mean()

# Merging
pd.merge(df1, df2, on='id')
pd.concat([df1, df2])

# Export
df.to_csv('output.csv', index=False)
df.to_excel('output.xlsx')
df.to_json('output.json')
```

#### Polars (Fast DataFrame Library)
```python
import polars as pl

# Create DataFrame (faster than pandas)
df = pl.DataFrame({
    'name': ['John', 'Jane', 'Bob'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
})

# Read data
df = pl.read_csv('data.csv')
df = pl.read_parquet('data.parquet')

# Operations (lazy evaluation)
result = (
    df.lazy()
    .filter(pl.col('age') > 25)
    .groupby('department')
    .agg(pl.col('salary').mean())
    .collect()
)

# Benefits: Much faster than pandas for large datasets
```

#### NumPy (Numerical Computing)
```python
import numpy as np

# Create arrays
arr = np.array([1, 2, 3, 4, 5])
matrix = np.array([[1, 2], [3, 4]])
zeros = np.zeros((3, 3))
ones = np.ones((2, 4))
random = np.random.rand(3, 3)

# Operations
arr + 10
arr * 2
np.mean(arr)
np.std(arr)
np.max(arr)
np.argmax(arr)

# Matrix operations
matrix.T                     # Transpose
np.dot(matrix1, matrix2)    # Dot product
np.linalg.inv(matrix)       # Inverse
```

### Data Validation

#### Pydantic (Data Validation)
```python
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional

class User(BaseModel):
    id: int
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    age: Optional[int] = Field(None, ge=0, le=150)
    created_at: datetime = Field(default_factory=datetime.now)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'must be alphanumeric'
        return v
    
    class Config:
        validate_assignment = True

# Usage
user = User(id=1, username='john123', email='john@example.com')
print(user.json())  # JSON serialization
print(user.dict())  # Dictionary

# Validation error handling
from pydantic import ValidationError

try:
    User(id=1, username='j', email='invalid')
except ValidationError as e:
    print(e.json())
```

### Testing

#### pytest (Modern Testing Framework)
```python
# test_calculator.py
import pytest

def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_add_types():
    with pytest.raises(TypeError):
        add("2", 3)

# Fixtures
@pytest.fixture
def sample_data():
    return [1, 2, 3, 4, 5]

def test_sum(sample_data):
    assert sum(sample_data) == 15

# Parametrize
@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected

# Async tests
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_function()
    assert result == expected

# Run tests
# pytest                    # Run all tests
# pytest test_file.py       # Run specific file
# pytest -v                 # Verbose
# pytest -k "test_add"      # Run tests matching pattern
# pytest --cov              # Coverage report
```

#### unittest (Built-in Testing)
```python
import unittest

class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.calculator = Calculator()
    
    def tearDown(self):
        pass
    
    def test_add(self):
        self.assertEqual(self.calculator.add(2, 3), 5)
    
    def test_divide_by_zero(self):
        with self.assertRaises(ZeroDivisionError):
            self.calculator.divide(5, 0)

if __name__ == '__main__':
    unittest.main()
```

### API Clients & HTTP

#### httpx (Modern HTTP Client)
```python
import httpx

# Sync
response = httpx.get('https://api.example.com/users')
response.json()

# Async
async with httpx.AsyncClient() as client:
    response = await client.get('https://api.example.com/users')
    data = response.json()

# With timeout and retries
client = httpx.Client(timeout=10.0)
response = client.post('https://api.example.com/data', json=data)
```

#### requests (Classic HTTP Library)
```python
import requests

# GET
response = requests.get('https://api.example.com/users')
data = response.json()

# POST
response = requests.post(
    'https://api.example.com/users',
    json={'name': 'John'},
    headers={'Authorization': 'Bearer token'}
)

# Error handling
response.raise_for_status()

# Session (connection pooling)
with requests.Session() as session:
    session.headers.update({'Authorization': 'Bearer token'})
    response = session.get('https://api.example.com/users')
```

#### aiohttp (Async HTTP)
```python
import aiohttp

async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.example.com/data') as response:
            return await response.json()

# Multiple requests
async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [session.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [await r.json() for r in responses]
```

### Task Queues & Background Jobs

#### Celery (Distributed Task Queue)
```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379')

@app.task
def add(x, y):
    return x + y

@app.task
def send_email(to, subject, body):
    # Send email logic
    pass

# Call tasks
result = add.delay(4, 6)  # Async
result.get()  # Wait for result

# Periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    'add-every-30-seconds': {
        'task': 'tasks.add',
        'schedule': 30.0,
        'args': (16, 16)
    },
    'daily-report': {
        'task': 'tasks.generate_report',
        'schedule': crontab(hour=0, minute=0),
    },
}

# Run worker: celery -A tasks worker --loglevel=info
# Run beat: celery -A tasks beat --loglevel=info
```

#### RQ (Redis Queue - Simpler Alternative)
```python
from redis import Redis
from rq import Queue

redis_conn = Redis()
q = Queue(connection=redis_conn)

def long_task(x, y):
    return x + y

# Enqueue job
job = q.enqueue(long_task, 4, 6)

# Check job
job.is_finished
job.result

# Run worker: rq worker
```

### Caching

#### Redis
```python
import redis

# Connect
r = redis.Redis(host='localhost', port=6379, db=0)

# Basic operations
r.set('key', 'value')
value = r.get('key')  # Returns bytes
r.delete('key')

# With expiration
r.setex('key', 3600, 'value')  # 1 hour

# Hash operations
r.hset('user:1', 'name', 'John')
r.hget('user:1', 'name')
r.hgetall('user:1')

# Lists
r.lpush('queue', 'item1')
r.rpush('queue', 'item2')
r.lrange('queue', 0, -1)

# Sets
r.sadd('tags', 'python', 'redis')
r.smembers('tags')
```

#### cachetools (In-Memory Caching)
```python
from cachetools import cached, TTLCache, LRUCache
from functools import lru_cache

# LRU Cache (built-in)
@lru_cache(maxsize=128)
def expensive_function(x):
    return x * x

# TTL Cache
cache = TTLCache(maxsize=100, ttl=300)

@cached(cache)
def get_data(key):
    return fetch_from_database(key)
```

### Logging & Monitoring

#### Logging (Built-in)
```python
import logging

# Basic configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

logger.debug('Debug message')
logger.info('Info message')
logger.warning('Warning message')
logger.error('Error message')
logger.critical('Critical message')

# Exception logging
try:
    result = 1 / 0
except Exception as e:
    logger.exception('An error occurred')

# Structured logging with dictConfig
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        },
    },
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'app.log',
            'formatter': 'default',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file'],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
```

#### loguru (Better Logging)
```python
from loguru import logger

# Auto-configured, colored output
logger.info("This is an info message")
logger.error("This is an error")

# Add file handler
logger.add("app.log", rotation="500 MB")

# Structured logging
logger.bind(user="john").info("User action")

# Exception catching
@logger.catch
def problematic_function():
    return 1 / 0
```

### CLI Tools

#### Click (CLI Framework)
```python
import click

@click.command()
@click.option('--count', default=1, help='Number of greetings.')
@click.option('--name', prompt='Your name', help='The person to greet.')
def hello(count, name):
    """Simple program that greets NAME for a total of COUNT times."""
    for _ in range(count):
        click.echo(f'Hello, {name}!')

if __name__ == '__main__':
    hello()

# Run: python script.py --count=3 --name=John
```

#### Typer (Modern CLI)
```python
import typer

app = typer.Typer()

@app.command()
def hello(name: str, count: int = 1):
    """Greet NAME count times."""
    for _ in range(count):
        typer.echo(f"Hello {name}")

@app.command()
def goodbye(name: str):
    """Say goodbye to NAME."""
    typer.echo(f"Goodbye {name}")

if __name__ == "__main__":
    app()
```

#### argparse (Built-in)
```python
import argparse

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('integers', metavar='N', type=int, nargs='+',
                    help='an integer for the accumulator')
parser.add_argument('--sum', dest='accumulate', action='store_const',
                    const=sum, default=max,
                    help='sum the integers (default: find the max)')

args = parser.parse_args()
print(args.accumulate(args.integers))
```

### Configuration Management

#### python-dotenv
```python
from dotenv import load_dotenv
import os

# Load from .env file
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
API_KEY = os.getenv('API_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```

#### Pydantic Settings
```python
from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_key: str
    debug: bool = False
    redis_host: str = 'localhost'
    redis_port: int = 6379
    
    class Config:
        env_file = '.env'

settings = Settings()
print(settings.database_url)
```

### Security

#### Passlib (Password Hashing)
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("mysecretpassword")

# Verify password
is_valid = pwd_context.verify("mysecretpassword", hashed)
```

#### JWT Authentication
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### File Processing

#### Working with CSV
```python
import csv

# Read CSV
with open('data.csv', 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row['name'], row['email'])

# Write CSV
with open('output.csv', 'w', newline='') as file:
    fieldnames = ['name', 'email']
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({'name': 'John', 'email': 'john@example.com'})
```

#### Working with JSON
```python
import json

# Read JSON
with open('data.json', 'r') as file:
    data = json.load(file)

# Write JSON
with open('output.json', 'w') as file:
    json.dump(data, file, indent=2)

# JSON strings
json_str = json.dumps(data, indent=2)
data = json.loads(json_str)
```

#### Working with Excel
```python
import openpyxl

# Read Excel
wb = openpyxl.load_workbook('data.xlsx')
sheet = wb.active
value = sheet['A1'].value

# Write Excel
wb = openpyxl.Workbook()
sheet = wb.active
sheet['A1'] = 'Hello'
sheet['B1'] = 42
wb.save('output.xlsx')
```

### Date & Time

#### datetime (Built-in)
```python
from datetime import datetime, date, time, timedelta

# Current datetime
now = datetime.now()
today = date.today()

# Create datetime
dt = datetime(2024, 1, 15, 10, 30, 45)

# Formatting
now.strftime('%Y-%m-%d %H:%M:%S')  # 2024-01-15 10:30:45
now.strftime('%B %d, %Y')           # January 15, 2024

# Parsing
dt = datetime.strptime('2024-01-15', '%Y-%m-%d')

# Arithmetic
tomorrow = today + timedelta(days=1)
last_week = now - timedelta(weeks=1)
```

#### Arrow (Better Dates)
```python
import arrow

# Current time
now = arrow.now()
utc = arrow.utcnow()

# Parsing
dt = arrow.get('2024-01-15')

# Human-friendly
now.humanize()  # 'just now'
past = arrow.now().shift(hours=-2)
past.humanize()  # '2 hours ago'

# Ranges
for dt in arrow.Arrow.range('hour', arrow.now().shift(days=-1), arrow.now()):
    print(dt)
```

## Productivity Tips

### 1. Use Virtual Environments Always
Never install packages globally. Always create a virtual environment for each project:
```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

### 2. Poetry for Modern Dependency Management
Poetry handles dependencies better than pip:
```bash
poetry new myproject
cd myproject
poetry add fastapi uvicorn
poetry install
```

### 3. Type Hints for Better Code
Use type hints for better IDE support and fewer bugs:
```python
def process_user(user_id: int, active: bool = True) -> dict[str, Any]:
    pass
```

### 4. Use Context Managers
Always use context managers for resources:
```python
# Good
with open('file.txt') as f:
    content = f.read()

# Bad
f = open('file.txt')
content = f.read()
f.close()
```

### 5. List Comprehensions Over Loops
```python
# Good
squares = [x**2 for x in range(10)]

# Less Pythonic
squares = []
for x in range(10):
    squares.append(x**2)
```

### 6. Use enumerate() and zip()
```python
# enumerate
for i, item in enumerate(items):
    print(f"{i}: {item}")

# zip
for name, age in zip(names, ages):
    print(f"{name} is {age}")
```

### 7. F-Strings for String Formatting
```python
name = "John"
age = 30

# Best (Python 3.6+)
message = f"{name} is {age} years old"

# Old ways (avoid)
message = "{} is {} years old".format(name, age)
message = "%s is %d years old" % (name, age)
```

### 8. Use Pathlib for File Paths
```python
from pathlib import Path

# Modern way
path = Path('data') / 'users' / 'john.txt'
path.exists()
path.read_text()
path.write_text('data')

# Old way (avoid)
import os
path = os.path.join('data', 'users', 'john.txt')
```

### 9. Use dataclasses for Data Containers
```python
from dataclasses import dataclass

@dataclass
class User:
    name: str
    email: str
    age: int = 0
```

### 10. Async for I/O-Bound Operations
Use async/await for network requests, database queries:
```python
async def fetch_users():
    async with aiohttp.ClientSession() as session:
        tasks = [session.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return responses
```

### 11. Use Black for Code Formatting
```bash
pip install black
black .  # Format all Python files
```
Or add to `pyproject.toml`:
```toml
[tool.black]
line-length = 88
target-version = ['py311']
```

### 12. Use ruff for Fast Linting
```bash
pip install ruff
ruff check .
ruff format .  # Also formats like black
```

### 13. Pre-commit Hooks
Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.0.254
    hooks:
      - id: ruff
```

### 14. Use Environment Variables
Never hardcode credentials:
```python
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
```

### 15. Proper Exception Handling
```python
# Good
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise
finally:
    cleanup()

# Bad
try:
    result = risky_operation()
except:  # Too broad!
    pass  # Silencing errors!
```

### 16. Use Generator Expressions for Large Data
```python
# Memory efficient
total = sum(x**2 for x in range(1000000))

# Memory intensive
total = sum([x**2 for x in range(1000000)])
```

### 17. Leverage Python 3.10+ Features
```python
# Pattern matching
match status_code:
    case 200:
        return "Success"
    case 404:
        return "Not Found"
    case _:
        return "Error"

# Union types
def process(value: int | str) -> str:
    return str(value)
```

### 18. Use __name__ == "__main__"
```python
def main():
    # Your code here
    pass

if __name__ == "__main__":
    main()
```

### 19. Document with Docstrings
```python
def calculate_total(items: list[dict]) -> float:
    """
    Calculate total price from list of items.
    
    Args:
        items: List of item dictionaries with 'price' key
        
    Returns:
        Total price as float
        
    Raises:
        ValueError: If items is empty
    """
    if not items:
        raise ValueError("Items list cannot be empty")
    return sum(item['price'] for item in items)
```

### 20. Use requirements.txt with Pinned Versions
```
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
```

Generate with:
```bash
pip freeze > requirements.txt
```

## Best Practices

### 1. Project Structure
```
myproject/
├── .env
├── .gitignore
├── README.md
├── requirements.txt
├── pyproject.toml
├── setup.py
├── src/
│   └── myproject/
│       ├── __init__.py
│       ├── main.py
│       ├── models/
│       ├── services/
│       └── utils/
└── tests/
    ├── __init__.py
    └── test_main.py
```

### 2. Follow PEP 8
- Use 4 spaces for indentation
- Max line length: 79-88 characters
- Use snake_case for functions and variables
- Use PascalCase for classes
- Two blank lines between top-level definitions

### 3. Write Tests
Always write tests for your code:
```bash
pytest tests/
pytest --cov=src tests/  # With coverage
```

### 4. Use Type Checking
```bash
pip install mypy
mypy src/
```

### 5. Document Your Code
- Write clear docstrings
- Add type hints
- Include README with setup instructions
- Document complex algorithms

### 6. Use Logging, Not Print
```python
# Good
logger.info(f"Processing user {user_id}")

# Bad
print(f"Processing user {user_id}")
```

### 7. Keep Functions Small and Focused
Each function should do one thing well.

### 8. Use Dependency Injection
```python
def process_data(data: str, db: Database, logger: Logger):
    # Function depends on passed parameters, not globals
    pass
```

### 9. Avoid Mutable Default Arguments
```python
# Bad
def add_item(item, items=[]):
    items.append(item)
    return items

# Good
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### 10. Use Constants
```python
# config.py
DATABASE_URL = "postgresql://localhost/mydb"
MAX_RETRIES = 3
TIMEOUT = 30

# main.py
from config import DATABASE_URL, MAX_RETRIES
```

## Common Workflows

### API Development with FastAPI
```bash
# Setup
mkdir myapi && cd myapi
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic

# Create main.py
# (See FastAPI section above)

# Run
uvicorn main:app --reload

# Test
curl http://localhost:8000
```

### Data Analysis Pipeline
```bash
# Setup
pip install pandas numpy matplotlib seaborn jupyter

# Create notebook
jupyter notebook

# In notebook:
# 1. Load data with pandas
# 2. Clean and transform
# 3. Analyze and visualize
# 4. Export results
```

### Async Web Scraping
```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def scrape_url(session, url):
    async with session.get(url) as response:
        html = await response.text()
        soup = BeautifulSoup(html, 'html.parser')
        return soup.title.string

async def main():
    urls = ['http://example.com'] * 10
    async with aiohttp.ClientSession() as session:
        tasks = [scrape_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

asyncio.run(main())
```

## Performance Tips

### 1. Use Built-in Functions
Built-in functions are optimized in C:
```python
# Fast
result = sum(numbers)

# Slower
result = 0
for num in numbers:
    result += num
```

### 2. Use Sets for Membership Testing
```python
# Fast - O(1)
if item in my_set:
    pass

# Slow - O(n)
if item in my_list:
    pass
```

### 3. Use __slots__ for Classes with Many Instances
```python
class Point:
    __slots__ = ['x', 'y']
    
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

### 4. Profile Your Code
```python
import cProfile
import pstats

cProfile.run('my_function()', 'profile_stats')
stats = pstats.Stats('profile_stats')
stats.sort_stats('cumulative')
stats.print_stats()
```

### 5. Use Caching
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

This cheat sheet covers essential Python concepts, modern enterprise packages, and best practices for professional Python development. Adjust and expand based on your specific needs and project requirements.

