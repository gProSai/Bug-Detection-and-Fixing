# Bug Detection and Fixing

## Project Overview

This project aims to detect and fix bugs in code using a web-based interface. It consists of a frontend (HTML, CSS, JavaScript) and a backend (Python with FastAPI). The backend processes the bug detection logic and serves the results to the frontend.

## Project Structure

```
Bug Detection and Fixing/
│-- frontend/        # Contains HTML, CSS, and JavaScript files for the UI
│   ├── index.html   # Main entry file for the frontend
│   ├── README.md    # Documentation for the frontend
│   ├── script.js    # JavaScript file for frontend functionality
│   ├── styles.css   # CSS file for styling
│-- backend/         # Contains Python backend code with FastAPI
│   ├── include/     # Virtual environment dependencies
│   ├── lib/         # Libraries installed in the virtual environment
│   ├── main/        # Contains the main backend files
│   │   ├── main.py  # Main FastAPI application file
│   │   ├── requirements.txt # List of dependencies required for the backend
│   │   ├── .env  # Contains essential API keys and configurations
│   ├── scripts/     # Additional backend scripts (if any)
│   ├── pyvenv.cfg   # Configuration file for the virtual environment
│-- README.md        # Main documentation file containing setup instructions
```

## Setup Instructions

### 1. Activating the Existing Virtual Environment

A virtual environment named `backend` is already included in the project. You do **not** need to create a new one, just activate the existing one.

To activate the virtual environment:

**For Windows:**

```sh
backend\Scripts\activate
```

**For macOS/Linux:**

```sh
source backend/bin/activate
```

After activation, your command prompt will change, and you should see something like this:

```sh
(backend) C:\Users\YourName\Bug Detection and Fixing>
```

> **Note:** The `(backend)` prefix should appear before your current directory path. If it appears, you have successfully activated the virtual environment.

If you ever need to deactivate the virtual environment, use:

```sh
deactivate
```

### 2. Ensuring the `.env` File is Present

The `.env` file contains an API key that is essential for the backend to function correctly. This file is already included in the repository and should not be modified. Ensure that it remains in the `backend/main` directory before running the backend.

If the `.env` file is missing, manually create a new one inside `backend/main/` and add the following content:

```sh
GEMINI_API_KEY=your_api_key_here
```

> **Note:** The API key provided in the `.env` file is temporary and will be deleted or become non-functional after a certain period. If the API key expires, please contact the project maintainer for an updated key.

### 3. Installing Required Packages

Once the virtual environment is activated, install the required dependencies.

1. **Open Command Prompt (CMD) in the project root directory (`Bug Detection and Fixing`).**
2. Run the following command to navigate to the backend folder:
   ```sh
   cd backend/main
   ```
3. Install the required dependencies by running:
   ```sh
   pip install -r requirements.txt
   ```
   This will install all the necessary Python libraries used in the project.

### 4. Running the FastAPI Server

The backend of this project is built using FastAPI, which provides a high-performance API framework.

To start the server:

1. Navigate to the `backend/main` directory (if not already there):
   ```sh
   cd backend/main
   ```
2. Open **Command Prompt (CMD)** in this directory and run:
   ```sh
   uvicorn main:app --reload
   ```

### 5. Accessing the Application

Once the FastAPI server is running, you can access it in the browser at:

```
http://127.0.0.1:8000
```

FastAPI also provides an interactive API documentation at:

```
http://127.0.0.1:8000/docs
```

This page allows you to test API endpoints directly from the browser.

### 6. Running the Frontend

To interact with the backend, you need to open the frontend in a web browser:

1. Navigate to the `frontend` folder in the project directory.
2. Locate the file `index.html`.
3. Double-click `index.html` to open it in your default web browser.

This will launch the frontend interface, allowing you to interact with the bug detection system.

### 7. Testing the Bug Detection

After opening the frontend interface:

1. Type or paste your code into the provided input field.
2. Click the **"Check for Bugs"** button (or similar, depending on the UI).
3. The system will analyze the code and display the detected bugs along with possible fixes.

This will allow you to verify if the backend is correctly processing the bug detection logic.

## Notes

- Ensure you have **Python 3.10.11** installed.
- The frontend files should be opened in a web browser to interact with the backend.
- The `.env` file is essential for proper execution of the backend and should not be modified.
- If the `.env` file is missing, manually create it inside `backend/main/` with the required API key.
- The API key included in the `.env` file is temporary and will expire after a certain period.
- If you face any issues, check the error messages and ensure all dependencies are installed.



