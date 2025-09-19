# Coding Agent

## Project Overview
A minimal LangGraph/LangChain agent that turns a natural-language request into a working code project.

## 🚀 Features
* 🔁 Deterministic pipeline: `planner → architect → coder (loop) → done`

* 🧱 Strict schemas with Pydantic `(Plan, TaskPlan, ImplementationTask, CoderState)`

* 🛠️ Safe file tools fenced to `generated_project/`

![Code Agent Workflow](static/asset/code_agent_ReAct_workflow.png)

## 🚀 Tech Stack
| Component        | Technology                                  |
|------------------|----------------------------------------------|
| LLM Provider     | Groq / OpenAI                                |
| Orchestration    | LangGraph                                    |
| Prompt/IO Layer  | LangChain                                    |
| Data Models      | Pydantic v2                                  |
| Backend API      | FastAPI (served with Uvicorn)                |
| Agent Tools      | LangChain Tools (custom: read/write/list/cmd)|
| Runtime          | Python 3.10+                                 |


## 📂 Project Structure
```grapql
.
├─ agent/
│  ├─ __init__.py
│  ├─ graph.py          # GraphBuilder: planner → architect → coder
│  ├─ prompts.py        # planner_prompt, architect_prompt, coder_system_prompt
│  ├─ states.py         # File, Plan, ImplementationTask, TaskPlan, CoderState
│  ├─ tools.py          # read/write/list/run_cmd + sandboxing
│  └─ utils/
│     ├─ model_loader.py
│     └─ config_loader.py 
│
├─ config/
│  └─ config.yaml       # LLM/provider settings (active)
│
├─ generated_project/   # runtime outputs (gitignored)
│
├─ static/              # (optional) assets for docs/UI; remove if unused
│
├─ main.py              # FastAPI entrypoint
├─ README.md
└─ pyproject.toml       # or requirements.txt
```

## ⚙️ Setup Instructions
1. **Clone the repository**
```bash
git clone https://github.com/Kanon14/coding-agent-langgraph
cd coding-agent-langgraph
```

2. **Create and activate a virtual environment**
```bash
# conda setup
conda create -n coding_agent python=3.11 -y
conda activate coding_agent

# uv setup
uv venv --python 3.11
.venv/Scripts/activate
```

3. **Install dependencies**
```bash
uv pip install -r pyproject.toml
```

4. **Setup `.env` file**
```bash
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

## 🤖 How to Run
1. **Run the Fast API server**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* Health check: GET http://localhost:8000/health
* Interactive docs: http://localhost:8000/docs

2. **Run the full pipeline and return the final state**
**Request body**
```bash
{
  "prompt": "Create a todo application."
}
```
3. **Example prompts**
* Create a simple calculator web application.
* Create a todo application.
* Create a Sudoku game.