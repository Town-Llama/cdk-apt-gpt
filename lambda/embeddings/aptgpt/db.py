import json
import os
import uuid
from typing import List
from uuid import uuid4

import boto3
import psycopg2
from botocore.exceptions import ClientError
from PIL import Image

DB_HOST_DEV = os.environ.get("DB_HOST",None)
DB_HOST_PROD = os.environ.get("DB_HOST",None)
DB_USER = os.environ.get("DB_USER",None)
DB_PASSWORD = os.environ.get("DB_PW",None)
DB_NAME = os.environ.get("DB_DATABASE",None)

class Database:
    def __init__(self, stage):
        self.stage = stage

    def __enter__(self):
        pw = DB_PASSWORD
        self.db = psycopg2.connect(database=DB_NAME,
                        host=DB_HOST_PROD if self.stage == "prod" else DB_HOST_DEV,
                        user=DB_USER,
                        password=pw,
                        port=5432)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()
