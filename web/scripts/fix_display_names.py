import os
import re

def add_display_name(file_path, component_name, pattern):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if f"{component_name}.displayName =" in content:
        print(f"displayName already exists for {component_name} in {file_path}")
        return

    # Look for the end of the component
    # This is a bit naive but works for the current files
    new_content = content.replace(pattern, f"{pattern}\n{component_name}.displayName = '{component_name}';")
    
    if new_content == content:
        print(f"Pattern not found for {component_name} in {file_path}")
        return

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Added displayName for {component_name} to {file_path}")

# Fix index.tsx
index_path = r"e:\TTGDBH\BH-EDU\web\components\ui\index.tsx"
add_display_name(index_path, "Input", "  );\n};")
add_display_name(index_path, "Textarea", "  );\n};")

# Fix table.tsx
table_path = r"e:\TTGDBH\BH-EDU\web\components\ui\table.tsx"
add_display_name(table_path, "TablePagination", "  );\n};")

# Fix Toast.tsx
toast_path = r"e:\TTGDBH\BH-EDU\web\components\ui\Toast.tsx"
add_display_name(toast_path, "SuccessIcon", "  </div>\n);")
add_display_name(toast_path, "ErrorIcon", "  </div>\n);")
add_display_name(toast_path, "WarningIcon", "  </div>\n);")
add_display_name(toast_path, "InfoIcon", "  </div>\n);")
add_display_name(toast_path, "ToastComponent", "    </div>\n  );\n};")
add_display_name(toast_path, "ToastContainer", "    </div>\n  );\n};")
