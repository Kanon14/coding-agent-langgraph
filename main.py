from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from pydantic import BaseModel
from typing import Any, Dict

from agent.graph import GraphBuilder


app = FastAPI(title="Coding Agent", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromptRequest(BaseModel):
    prompt: str
    

def _serialize(obj: Any) -> Any:
    """Make LangGraph/LangChain/Pydantic objects JSON-serializable for responses."""
    if hasattr(obj, "model_dump"):  # Pydantic v2 models
        return obj.model_dump()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(v) for v in obj]
    try:
        _ = obj.__dict__
        return str(obj)
    except Exception:
        return obj
    

# ----- Startup: init tools folder and compile graph once -----
_builder = GraphBuilder(model_provider="groq", enable_debug=True, enable_verbose=True)
_react_app = _builder()  # same as _builder.build_graph()


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}

    
@app.post("/prompt")
async def coding_agent(request: PromptRequest):
    user_prompt = request.prompt.strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="prompt must be a non-empty string")

    try:
        final_state = _react_app.invoke(
            {"user_prompt": user_prompt},
            config={"recursion_limit": 100},
        )
        return _serialize(final_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")


@app.get("/graph.png")
def get_graph_png():
    """Optional: render and return the graph as a PNG."""
    try:
        png_bytes = _react_app.get_graph().draw_mermaid_png()
        path = "my_graph.png"
        with open(path, "wb") as f:
            f.write(png_bytes)
        return FileResponse(path, media_type="image/png", filename="my_graph.png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to render graph PNG: {e}")
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)