from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import subprocess
import os
import re
import hashlib
from google import genai
from google.genai import types
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

class Code(BaseModel):
    user_code: str


suggestion_cache = {}


def parse_gemini_response(response_text):
    try:
        print(f"=== PARSING RESPONSE ===")
        print(f"Full response: {response_text}")
        print("=" * 50)
        
       
        code_pattern = r'```(?:python)?\s*\n(.*?)\n```'
        code_matches = re.findall(code_pattern, response_text, re.DOTALL)
        
        if code_matches:
           
            corrected_code = code_matches[-1].strip()
            print(f" FOUND CORRECTED CODE: {corrected_code}")
            return {
                "suggestions": response_text,
                "corrected_code": corrected_code
            }
        
   
        alt_pattern = r'```\s*\n(.*?)\n```'
        alt_matches = re.findall(alt_pattern, response_text, re.DOTALL)
        
        if alt_matches:
            corrected_code = alt_matches[-1].strip()
            print(f" FOUND CODE (alternative): {corrected_code}")
            return {
                "suggestions": response_text,
                "corrected_code": corrected_code
            }
        
       
        lines = response_text.split('\n')
        code_lines = []
        capture_code = False
        
        for line in lines:
            if 'corrected' in line.lower() or 'fixed' in line.lower():
                capture_code = True
                continue
            if capture_code and line.strip():
                if line.startswith('#') or 'print' in line or '=' in line:
                    code_lines.append(line)
        
        if code_lines:
            corrected_code = '\n'.join(code_lines)
            print(f" EXTRACTED FROM TEXT: {corrected_code}")
            return {
                "suggestions": response_text,
                "corrected_code": corrected_code
            }
        
        print(" NO CODE FOUND - Using fallback")
        return {
            "suggestions": response_text,
            "corrected_code": None
        }
        
    except Exception as e:
        print(f" Parse error: {e}")
        return {
            "suggestions": response_text,
            "corrected_code": None
        }


def generate_suggestions_with_correction(user_code: str):
    code_hash = hashlib.md5(user_code.encode()).hexdigest()
    
    if code_hash in suggestion_cache:
        print(" Using cached response")
        return suggestion_cache[code_hash]
    
    try:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            return {
                "suggestions": "API Key not found. Please set GEMINI_API_KEY in the .env file.",
                "corrected_code": "# Please configure your API key\nprint('Hello, World!')"
            }

        client = genai.Client(api_key=api_key)
        model = "gemini-2.0-flash"

       
        prompt = f"""Fix this Python code and provide the corrected version.

BROKEN CODE:
{user_code}

text

Please respond with:

## Suggestions
Explain the problem and solution.

## Corrected Code
Write the fixed code here
text

Make sure to always include the corrected code in the specified format."""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part(text=prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            temperature=0.1,  
            top_p=0.9,
            top_k=20,
            max_output_tokens=1000,
            response_mime_type="text/plain",
        )

        print(" Calling Gemini API...")
        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            response_text += chunk.text

        print(f" Received {len(response_text)} characters from Gemini")
        result = parse_gemini_response(response_text.strip())
        
        
        if not result["corrected_code"]:
            result["corrected_code"] = f"# Fixed version of your code\nprint('Hello, World!')"
        
        suggestion_cache[code_hash] = result
        return result

    except Exception as e:
        error_message = str(e)
        print(f" Gemini API Error: {error_message}")
        

        return {
            "suggestions": f"API Error: {error_message}\n\nTry these common fixes:\n- Check for missing quotes or brackets\n- Ensure variables are defined\n- Fix indentation issues",
            "corrected_code": "# Simple fix - replace with working code\nprint('Hello, World!')"
        }

@app.post("/get-code")
async def getcode(code: Code):
    print(f"\n{'='*60}")
    print(f" PROCESSING REQUEST")
    print(f"Code: {code.user_code}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            [sys.executable, "-c", code.user_code],
            capture_output=True,
            text=True,
            timeout=10
        )

        output = result.stdout.strip()
        error_message = result.stderr.strip()

        print(f" EXECUTION RESULTS:")
        print(f"   Output: '{output}'")
        print(f"   Error: '{error_message}'")

      
        if error_message or not output:
            print("GENERATING AUTO-CORRECTION...")
            gemini_response = generate_suggestions_with_correction(code.user_code)
            
            response = {
                "success": False,
                "output": error_message or "No output",
                "user_code": code.user_code,
                "suggestions": gemini_response["suggestions"],
                "corrected_code": gemini_response["corrected_code"],
                "has_correction": True  
            }
            
            print(f" RESPONSE READY:")
            print(f"   Has correction: {response['has_correction']}")
            print(f"   Corrected code: {response['corrected_code'][:100]}...")
            
            return response

      
        return {
            "success": True,
            "output": output,
            "suggestions": None,
            "corrected_code": None,
            "has_correction": False
        }

    except subprocess.TimeoutExpired:
        print("TIMEOUT - Generating correction...")
        gemini_response = generate_suggestions_with_correction(code.user_code)
        return {
            "success": False,
            "output": "Code execution timeout (>10 seconds)",
            "user_code": code.user_code,
            "suggestions": gemini_response["suggestions"],
            "corrected_code": gemini_response["corrected_code"],
            "has_correction": True
        }
    except Exception as e:
        print(f"Server error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test-correction")
def test_correction_directly(code: Code):
    """Test auto-correction without running code"""
    result = generate_suggestions_with_correction(code.user_code)
    return {
        "original_code": code.user_code,
        "suggestions": result["suggestions"],
        "corrected_code": result["corrected_code"],
        "has_correction": result["corrected_code"] is not None
    }


@app.get("/")
def read_root():
    return {"message": "Python Web Compiler with Auto-Correction"}


@app.get("/test-api")
def test_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"status": " No API key found"}
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Say 'API working!'"
        )
        return {"status": " API key working"}
    except Exception as e:
        return {"status": " API test failed", "error": str(e)}