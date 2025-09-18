from __future__ import annotations

from typing import Any, Dict, Optional, TypedDict

from langchain.globals import set_verbose, set_debug
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import create_react_agent

from utils.model_loader import ModelLoader
from states import Plan, TaskPlan, CoderState
from prompts import planner_prompt, architect_prompt, coder_system_prompt
from tools import write_file, read_file, get_current_directory, list_files


class BuildState(TypedDict, total=False):
    user_prompt: str
    plan: Plan
    task_plan: TaskPlan
    coder_state: CoderState
    status: str           # "IN_PROGRESS" | "DONE"
    last_result: Any      # optional: the agent's invoke() return
    

class GraphBuilder():
    def __init__(self, 
                 model_provider: str = "groq",
                 *,
                 enable_debug: bool = True,
                 enable_verbose: bool = True):
        # Global LangChain verbosity
        set_debug(bool(enable_debug))
        set_verbose(bool(enable_verbose))
        
        # LLM + tools
        self.model_loader = ModelLoader(model_provider=model_provider)
        self.llm = self.model_loader.load_llm()
        self.tools = [write_file, read_file, get_current_directory, list_files]
    
        self.graph = None # compiled graph cached after build

    
    def planner_agent(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Converts user prompt into a structured Plan."""
        user_prompt: Optional[str] = state.get("user_prompt")
        if not user_prompt:
            raise ValueError("planner_agent expected 'user_prompt' in state.")
        
        resp: Optional[Plan] = self.llm.with_structured_output(Plan).invoke(
            planner_prompt(user_prompt)
        )
        if resp is None:
            raise ValueError("Planner did not return a valid response.")
        
        return {"plan": resp}


    def architect_agent(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Creates TaskPlan from Plan."""
        plan: Optional[Plan] = state.get("plan")
        if plan is None:
            raise ValueError("architect_agent expected 'plan' in state.")
        
        # architect_prompt expects a string; pass JSON text
        plan_payload = plan.model_dump_json()
        
        resp: Optional[TaskPlan] = self.llm.with_structured_output(TaskPlan).invoke(
            architect_prompt(plan=plan_payload)
        )
        
        if resp is None:
            raise ValueError("Architect did not return a valid response.")

        return {"plan": plan, "task_plan": resp}


    def coder_agent(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Tool-using coder agent that iterates through implementation steps."""
        coder_state: Optional[CoderState] = state.get("coder_state")
        if coder_state is None: # Initially the state will be None
            task_plan = Optional[TaskPlan] = state.get("task_plan")
            if task_plan is None:
                raise ValueError("coder_agent expected 'task_plan' in state.")
            coder_state = CoderState(task_plan=task_plan, current_step_idx=0)

        steps = getattr(coder_state.task_plan, "implementation_steps", None)
        if not steps: # if there is no 'implementation_steps'
            return {"coder_state": coder_state, "status": "DONE"}
        
        if coder_state.current_step_idx >= len(steps): # to verify whether all step size finished
            return {"coder_state": coder_state, "status": "DONE"}

        # Current task (Implementations with fields: filepath, task_description)
        current_task = steps[coder_state.current_step_idx]
        filepath = getattr(current_task, "filepath", None)
        if not filepath:
            raise ValueError(
                f"implementation_steps[{coder_state.current_step_idx}] missing 'filepath'."
            )
        
        # Read existing file content safely
        try:
            existing_content = read_file.run(filepath)
        except Exception:
            existing_content = "" # file may not exist yet
        coder_state.current_file_content = existing_content
        
        # Build prompts
        system_prompt = coder_system_prompt()
        user_prompt = (
            f"Task: {current_task.task_description}\n"
            f"File: {filepath}\n"
            f"Existing content:\n{existing_content}\n"
            "Use write_file(path, content) to save your changes."
        )

        # Create a ReAct agent with tools and invoke
        react_agent = create_react_agent(self.llm, self.tools)
        result = react_agent.invoke(
            {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
            }
        )
        
        # Advance step pointer
        coder_state.current_step_idx += 1
        status = "DONE" if coder_state.current_step_idx >= len(steps) else "IN_PROGRESS"

        return {"coder_state": coder_state, "status": status, "last_result": result}


    def build_graph(self):
        """Constructs and compiles the LangGraph pipeline."""
        if self.graph is not None:
            return self.graph
        
        graph_builder = StateGraph(state_schema=BuildState)

        graph_builder.add_node("planner", self.planner_agent)
        graph_builder.add_node("architect", self.architect_agent)
        graph_builder.add_node("coder", self.coder_agent)
        
        graph_builder.add_edge(START, "planner")
        graph_builder.add_edge("planner", "architect")
        graph_builder.add_edge("architect", "coder")
        
        def coder_done_router(state: BuildState):
            return state.get("status") == "DONE"

        graph_builder.add_conditional_edges(
            "coder",
            coder_done_router,
            {True: END, False: "coder"}
        )
        
        self.graph = graph_builder.compile()
        return self.graph
        
    
    def __call__(self):
        return self.build_graph()