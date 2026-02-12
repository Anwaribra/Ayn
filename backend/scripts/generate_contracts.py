import os
import re
from typing import get_type_hints, List, Union, Optional, Any, get_args, get_origin
from pydantic import BaseModel
import importlib.util
import sys
import datetime

# Configuration
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_TYPES_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend", "ayn-landing-page", "types"))
OUTPUT_FILE = os.path.join(FRONTEND_TYPES_DIR, "contracts.ts")

# Add backend to path so we can import modules
sys.path.append(BACKEND_DIR)

# Type mapping from Python/Pydantic to TypeScript
TYPE_MAP = {
    str: "string",
    int: "number",
    float: "number",
    bool: "boolean",
    datetime.datetime: "string",
    Any: "any",
    dict: "Record<string, any>",
    type(None): "null",
}

def get_ts_type(py_type: Any) -> str:
    """Recursively convert Python types to TypeScript types."""
    # Handle Literal
    if hasattr(py_type, "__name__") and py_type.__name__ == "Literal":
        args = get_args(py_type)
        return " | ".join([f'"{arg}"' if isinstance(arg, str) else str(arg) for arg in args])
    
    # Handle EmailStr and other Pydantic specific types
    if hasattr(py_type, "__name__"):
        if py_type.__name__ == "EmailStr":
            return "string"

    origin = get_origin(py_type)
    args = get_args(py_type)

    if py_type in TYPE_MAP:
        return TYPE_MAP[py_type]
    
    if origin is list or origin is List:
        return f"{get_ts_type(args[0])}[]"
    
    if origin is Union or origin is Optional:
        # Handle Optional[T] or Union[T, None]
        types = [get_ts_type(t) for t in args if t is not type(None)]
        if len(types) == 1:
            return f"{types[0]} | null"
        return " | ".join(types)
    
    if origin is dict or py_type is dict:
        return "Record<string, any>"

    # Check if it's a class/model name
    if hasattr(py_type, "__name__"):
        return py_type.__name__
    
    # Fallback to string representation or any
    name = str(py_type)
    if "ForwardRef" in name:
        # Extract name from ForwardRef('ModelName')
        match = re.search(r"'(.*?)'", name)
        if match:
            return match.group(1)
    
    return "any"

def generate_typescript():
    """Main function to scan models and generate TS interfaces."""
    print("🚀 Generating TypeScript contracts from Pydantic models...")
    
    models_to_export = []
    
    # 1. Scan for models.py files
    app_dir = os.path.join(BACKEND_DIR, "app")
    for root, dirs, files in os.walk(app_dir):
        if "models.py" in files:
            module_path = os.path.join(root, "models.py")
            module_name = root.replace(BACKEND_DIR, "").replace(os.sep, ".").strip(".") + ".models"
            
            # Dynamic import
            spec = importlib.util.spec_from_file_location(module_name, module_path)
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            try:
                spec.loader.exec_module(module)
            except Exception as e:
                print(f"⚠️ Error importing {module_name}: {e}")
                continue

            # Find all classes that inherit from BaseModel
            for name, obj in vars(module).items():
                if isinstance(obj, type) and issubclass(obj, BaseModel) and obj is not BaseModel:
                    models_to_export.append(obj)

    # 2. Build TypeScript content
    ts_content = [
        "/**",
        " * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY",
        " * This file was generated from Pydantic models in the backend.",
        " */",
        "",
    ]
    
    # Remove duplicates but keep order roughly (by name)
    unique_models = {}
    for model in models_to_export:
        unique_models[model.__name__] = model
    
    sorted_models = sorted(unique_models.values(), key=lambda x: x.__name__)

    for model in sorted_models:
        ts_content.append(f"export interface {model.__name__} {{")
        
        # Get type hints (includes inherited ones)
        try:
            hints = get_type_hints(model)
            for field_name, field_type in hints.items():
                ts_type = get_ts_type(field_type)
                ts_content.append(f"  {field_name}: {ts_type};")
        except Exception as e:
            print(f"⚠️ Error getting hints for {model.__name__}: {e}")
            # Fallback for fields
            for field_name in model.model_fields:
                ts_content.append(f"  {field_name}: any; // Error extracting type")
        
        ts_content.append("}")
        ts_content.append("")

    # 3. Write to file
    if not os.path.exists(FRONTEND_TYPES_DIR):
        os.makedirs(FRONTEND_TYPES_DIR)
        
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_content))
    
    print(f"✅ Success! Generated {len(sorted_models)} interfaces in {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_typescript()
