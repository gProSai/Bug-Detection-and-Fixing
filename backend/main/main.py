from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import subprocess


app = FastAPI()

class Code():
    user_code: str

@app.post("/get-code")
def getcode(code: Code):

    try:
        result = subprocess.run(
            [sys.executable, '-c', code.user_code],
            executable=True, timeout=5, text=True
            return {"output": result.stdout, "ERROR": result.stderr} 
        )
    except Exception as e:
        raise HTTPException(status_code = 500, detail=str(e))
    