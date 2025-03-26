from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import subprocess
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from a .env file
load_dotenv()

# FastAPI app initialization
app = FastAPI()

# Enable CORS (for frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

class Code(BaseModel):
    user_code: str

# Function to generate suggestions using Gemini API
def generate_suggestions(user_code: str):
    try:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise HTTPException(status_code=400, detail="API Key not found. Please set GEMINI_API_KEY in the .env file.")

        client = genai.Client(api_key=api_key)
        model = "gemini-1.5-pro"

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part(text=f"Analyze the following Python code and provide suggestions for fixing any issues or improving the logic:\n\n{user_code}")
                ],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
            response_mime_type="text/plain",
        )

        suggestions = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            suggestions += chunk.text

        return suggestions.strip()

    except Exception as e:
        return f"Suggestion error: {str(e)}"

@app.post("/get-code")
def getcode(code: Code):
    try:
        result = subprocess.run(
            [sys.executable, "-c", code.user_code],
            capture_output=True,
            text=True,
            timeout=10
        )

        output = result.stdout.strip()
        error_message = result.stderr.strip()

        # If there is an error, provide suggestions
        if error_message:
            suggestions = generate_suggestions(code.user_code)
            return {
                "output": error_message,
                "user_code": code.user_code,
                "suggestions": suggestions
            }

        # If the code runs but produces no output, also provide suggestions
        if not output:
            suggestions = generate_suggestions(code.user_code)
            return {
                "output": "No output",
                "user_code": code.user_code,
                "suggestions": suggestions
            }

        # If everything is fine, return the output
        return {"output": output}

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Request timeout: the code took too long to execute.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
